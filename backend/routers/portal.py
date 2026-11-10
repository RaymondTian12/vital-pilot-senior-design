"""Patient-controlled provider access and read-only provider records."""
import json
from typing import Optional

import pymysql
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field, model_validator

from backend.db import get_db_connection
from backend.models.User import User, UserRole
from backend.routers.auth import Vitals
from backend.routers.metrics import METRIC_TABLES, record_from_row
from backend.routers.notifications import FIELDS as NOTIFICATION_FIELDS, row_to_dict as notification_row_to_dict
from backend.security import get_current_user

router = APIRouter(prefix="/portal")


def require_role(user: User, role: UserRole):
    if user.role != role:
        raise HTTPException(403, "This account cannot access this feature")


def connection():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Database unavailable")
    return conn


@router.get("/my-providers")
def my_providers(current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PATIENT)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT p.provider_id, u.first_name, u.last_name, p.specialty, a.assignment_status "
                "FROM PatientProviderAssignments a "
                "JOIN UserHealthProfiles h ON h.profile_id = a.patient_profile_id "
                "JOIN Providers p ON p.provider_id = a.provider_id "
                "JOIN Users u ON u.user_id = p.user_id "
                "WHERE h.user_id = %s AND a.assignment_status = 'ACTIVE' "
                "ORDER BY u.last_name, u.first_name", (current_user.user_id,))
            return {"providers": [dict(zip(("provider_id", "first_name", "last_name", "specialty", "status"), row)) for row in cursor.fetchall()]}
    finally:
        conn.close()


@router.put("/my-providers/{provider_id}")
def grant_provider(provider_id: int, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PATIENT)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT profile_id FROM UserHealthProfiles WHERE user_id = %s", (current_user.user_id,))
            profile = cursor.fetchone()
            if not profile:
                raise HTTPException(409, "Complete your health profile before sharing records")
            cursor.execute(
                "SELECT p.provider_id FROM Providers p JOIN Users u ON u.user_id = p.user_id "
                "WHERE p.provider_id = %s AND p.verification_status = 'APPROVED' AND u.is_active = TRUE FOR UPDATE",
                (provider_id,))
            if not cursor.fetchone():
                raise HTTPException(404, "Approved provider not found")
            cursor.execute(
                "SELECT assignment_id FROM PatientProviderAssignments "
                "WHERE provider_id = %s AND patient_profile_id = %s FOR UPDATE", (provider_id, profile[0]))
            rows = cursor.fetchall()
            if rows:
                cursor.execute(
                    "UPDATE PatientProviderAssignments SET assignment_status = 'ACTIVE' "
                    "WHERE provider_id = %s AND patient_profile_id = %s", (provider_id, profile[0]))
            else:
                cursor.execute(
                    "INSERT INTO PatientProviderAssignments (provider_id, patient_profile_id, assignment_status) "
                    "VALUES (%s, %s, 'ACTIVE')", (provider_id, profile[0]))
        conn.commit()
        return {"status": "ACTIVE"}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.delete("/my-providers/{provider_id}")
def revoke_provider(provider_id: int, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PATIENT)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE PatientProviderAssignments a "
                "JOIN UserHealthProfiles h ON h.profile_id = a.patient_profile_id "
                "SET a.assignment_status = 'REVOKED' "
                "WHERE h.user_id = %s AND a.provider_id = %s", (current_user.user_id, provider_id))
        conn.commit()
        return {"status": "REVOKED"}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def provider_id_for(cursor, user_id: int):
    cursor.execute("SELECT provider_id, verification_status FROM Providers WHERE user_id = %s FOR SHARE", (user_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(403, "Provider account is not configured")
    if row[1] != "APPROVED":
        raise HTTPException(403, "Provider account is awaiting verification")
    return row[0]


@router.get("/provider-status")
def provider_status(current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT verification_status FROM Providers WHERE user_id = %s", (current_user.user_id,))
            row = cursor.fetchone()
            return {"status": row[0] if row else "PENDING"}
    finally:
        conn.close()


PROFILE_FIELDS = ("first_name", "last_name", "email", "specialty", "clinic_name",
                   "clinic_phone", "npi", "license_state", "license_number", "verification_status")
# License identity fields re-trigger admin review on change -- everything
# else (name, specialty, clinic contact info) is cosmetic and updates freely.
VERIFICATION_FIELDS = ("npi", "license_state", "license_number")


def _profile_row(cursor, user_id):
    cursor.execute(
        "SELECT u.first_name, u.last_name, u.email, p.specialty, p.clinic_name, p.clinic_phone, "
        "p.npi, p.license_state, p.license_number, p.verification_status "
        "FROM Providers p JOIN Users u ON u.user_id = p.user_id WHERE p.user_id = %s FOR UPDATE",
        (user_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(403, "Provider account is not configured")
    return dict(zip(PROFILE_FIELDS, row))


class ProviderProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    specialty: Optional[str] = Field(None, min_length=1, max_length=100)
    clinic_name: Optional[str] = Field(None, max_length=255)
    clinic_phone: Optional[str] = Field(None, max_length=20)
    npi: Optional[str] = Field(None, pattern=r"^\d{10}$")
    license_state: Optional[str] = Field(None, pattern=r"^[A-Za-z]{2}$")
    license_number: Optional[str] = Field(None, min_length=1, max_length=50)

    @model_validator(mode="after")
    def nonempty(self):
        if not any(v is not None for v in self.model_dump().values()):
            raise ValueError("Provide at least one field to update")
        return self


@router.get("/my-profile")
def my_profile(current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT u.first_name, u.last_name, u.email, p.specialty, p.clinic_name, p.clinic_phone, "
                "p.npi, p.license_state, p.license_number, p.verification_status "
                "FROM Providers p JOIN Users u ON u.user_id = p.user_id WHERE p.user_id = %s",
                (current_user.user_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(403, "Provider account is not configured")
            return dict(zip(PROFILE_FIELDS, row))
    finally:
        conn.close()


@router.patch("/my-profile")
def update_my_profile(payload: ProviderProfileUpdate, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            current = _profile_row(cursor, current_user.user_id)
            updates = payload.model_dump(exclude_none=True)
            if "license_state" in updates:
                updates["license_state"] = updates["license_state"].upper()
            for key in ("first_name", "last_name", "specialty", "clinic_name", "clinic_phone", "license_number"):
                if key in updates:
                    updates[key] = updates[key].strip()

            verification_changed = any(
                key in updates and updates[key] != current[key] for key in VERIFICATION_FIELDS
            )

            user_fields = {k: v for k, v in updates.items() if k in ("first_name", "last_name")}
            if user_fields:
                assignments = ", ".join(f"{k} = %s" for k in user_fields)
                cursor.execute(f"UPDATE Users SET {assignments} WHERE user_id = %s",
                              (*user_fields.values(), current_user.user_id))

            provider_fields = {k: v for k, v in updates.items() if k in
                               ("specialty", "clinic_name", "clinic_phone", "npi", "license_state", "license_number")}
            if verification_changed:
                # Re-submitted identity details need a fresh admin look before
                # this provider can be trusted with patient data again.
                provider_fields["verification_status"] = "PENDING"
            if provider_fields:
                assignments = ", ".join(f"{k} = %s" for k in provider_fields)
                cursor.execute(f"UPDATE Providers SET {assignments} WHERE user_id = %s",
                              (*provider_fields.values(), current_user.user_id))

            result = _profile_row(cursor, current_user.user_id)
        conn.commit()
        return result
    except HTTPException:
        conn.rollback()
        raise
    except pymysql.err.IntegrityError:
        conn.rollback()
        raise HTTPException(409, "This NPI is already registered to another provider account.")
    except Exception:
        conn.rollback()
        raise HTTPException(503, "Could not update profile")
    finally:
        conn.close()


def authorized_patient(cursor, provider_id: int, patient_id: int):
    cursor.execute(
        "SELECT u.user_id, u.first_name, u.last_name, h.date_of_birth "
        "FROM PatientProviderAssignments a "
        "JOIN UserHealthProfiles h ON h.profile_id = a.patient_profile_id "
        "JOIN Users u ON u.user_id = h.user_id "
        "WHERE a.provider_id = %s AND h.user_id = %s AND a.assignment_status = 'ACTIVE' "
        "LIMIT 1", (provider_id, patient_id))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(404, "Patient not found")
    return dict(zip(("user_id", "first_name", "last_name", "date_of_birth"), row))


@router.get("/patients")
def patients(current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            provider_id = provider_id_for(cursor, current_user.user_id)
            cursor.execute(
                "SELECT DISTINCT u.user_id, u.first_name, u.last_name, h.date_of_birth "
                "FROM PatientProviderAssignments a "
                "JOIN UserHealthProfiles h ON h.profile_id = a.patient_profile_id "
                "JOIN Users u ON u.user_id = h.user_id "
                "WHERE a.provider_id = %s AND a.assignment_status = 'ACTIVE' "
                "ORDER BY u.last_name, u.first_name", (provider_id,))
            return {"patients": [dict(zip(("user_id", "first_name", "last_name", "date_of_birth"), row)) for row in cursor.fetchall()]}
    finally:
        conn.close()


@router.get("/patients/{patient_id}")
def patient_detail(patient_id: int, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            return authorized_patient(cursor, provider_id_for(cursor, current_user.user_id), patient_id)
    finally:
        conn.close()


@router.get("/patients/{patient_id}/metrics")
def patient_metrics(patient_id: int, metric_type: Vitals,
                    limit: int = Query(20, ge=1, le=200), offset: int = Query(0, ge=0),
                    current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            authorized_patient(cursor, provider_id_for(cursor, current_user.user_id), patient_id)
            table, fields = METRIC_TABLES[metric_type]
            timestamp = "recorded_at" if metric_type == Vitals.BODY_MASS_INDEX else "logged_at"
            cursor.execute(
                f"SELECT log_id, {', '.join(fields)}, {timestamp} FROM {table} "
                f"WHERE user_id = %s ORDER BY {timestamp} DESC, log_id DESC LIMIT %s OFFSET %s",
                (patient_id, limit, offset))
            records = [record_from_row(metric_type, fields, row) for row in cursor.fetchall()]
            return {"metric_type": metric_type.value, "count": len(records), "records": records}
    finally:
        conn.close()


@router.get("/patients/{patient_id}/alerts")
def patient_alerts(patient_id: int, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                   current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            authorized_patient(cursor, provider_id_for(cursor, current_user.user_id), patient_id)
            # health-alert is the category notify_reading/evaluate_temporal_alerts
            # use for warning/critical findings -- this deliberately excludes the
            # routine "metric" category (plain save confirmations).
            cursor.execute(
                f"SELECT {NOTIFICATION_FIELDS} FROM Notifications "
                "WHERE user_id = %s AND category = 'health-alert' "
                "ORDER BY created_at DESC, notification_id DESC LIMIT %s OFFSET %s",
                (patient_id, limit, offset))
            return {"alerts": [notification_row_to_dict(row) for row in cursor.fetchall()]}
    finally:
        conn.close()


@router.get("/patients/{patient_id}/reports")
def patient_reports(patient_id: int, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            authorized_patient(cursor, provider_id_for(cursor, current_user.user_id), patient_id)
            cursor.execute(
                "SELECT report_id, report_title, start_date, end_date, file_size_kb, created_at, "
                "pdf_data IS NOT NULL AS downloadable, report_data IS NOT NULL AS previewable "
                "FROM ClinicalReports WHERE generated_by_user_id = %s "
                "ORDER BY created_at DESC", (patient_id,))
            rows = cursor.fetchall()
        return {
            "reports": [
                {
                    "report_id": row[0], "report_title": row[1], "start_date": row[2], "end_date": row[3],
                    "file_size_kb": row[4], "created_at": row[5],
                    "downloadable": bool(row[6]), "previewable": bool(row[7]),
                }
                for row in rows
            ]
        }
    finally:
        conn.close()


@router.get("/patients/{patient_id}/reports/{report_id}/preview")
def patient_report_preview(patient_id: int, report_id: int, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            authorized_patient(cursor, provider_id_for(cursor, current_user.user_id), patient_id)
            cursor.execute(
                "SELECT generated_by_user_id, report_data FROM ClinicalReports WHERE report_id = %s",
                (report_id,))
            row = cursor.fetchone()
        # 404 (not 403) for both "doesn't exist" and "not this patient's" --
        # don't reveal that a report_id belonging to someone else exists.
        if not row or row[0] != patient_id:
            raise HTTPException(404, "Report not found.")
        if row[1] is None:
            raise HTTPException(410, "This report was generated before in-app preview was added and can't be previewed.")
        return json.loads(row[1])
    finally:
        conn.close()


@router.get("/patients/{patient_id}/reports/{report_id}/download")
def patient_report_download(patient_id: int, report_id: int, current_user: User = Depends(get_current_user)):
    require_role(current_user, UserRole.PROVIDER)
    conn = connection()
    try:
        with conn.cursor() as cursor:
            authorized_patient(cursor, provider_id_for(cursor, current_user.user_id), patient_id)
            cursor.execute(
                "SELECT generated_by_user_id, report_title, end_date, pdf_data "
                "FROM ClinicalReports WHERE report_id = %s", (report_id,))
            row = cursor.fetchone()
        if not row or row[0] != patient_id:
            raise HTTPException(404, "Report not found.")
        _, title, end_date, pdf_data = row
        if pdf_data is None:
            raise HTTPException(410, "This report was generated before PDF storage was added and can't be re-downloaded.")
        filename = f"vitalpilot-report-{report_id}-{end_date}.pdf"
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    finally:
        conn.close()
