"""Administrator review, account controls, and invitations."""
import hashlib
import re
import secrets
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from backend.db import get_db_connection
from backend.models.User import User, UserRole
from backend.security import get_current_user

router = APIRouter(prefix="/admin")


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(403, "Administrator account required")
    return user


def connection():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Database unavailable")
    return conn


class ReviewDecision(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "REMOVED"]
    note: str = Field(min_length=3, max_length=500)
    identity_and_license_verified: bool = False
    confirm_revoke_patient_access: bool = False


class AccountAction(BaseModel):
    active: bool
    reason: str = Field(min_length=3, max_length=500)


class AdminInvitationRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=3, max_length=255)


@router.get("/invitations")
def list_invitations(admin: User = Depends(require_admin)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT invitation_id, first_name, last_name, email, expires_at, used_at, revoked_at "
                "FROM AdminInvitations ORDER BY invitation_id DESC LIMIT 100"
            )
            fields = ("invitation_id", "first_name", "last_name", "email", "expires_at", "used_at", "revoked_at")
            return {"invitations": [dict(zip(fields, row)) for row in cursor.fetchall()]}
    finally:
        conn.close()


@router.post("/invitations", status_code=201)
def create_invitation(payload: AdminInvitationRequest, admin: User = Depends(require_admin)):
    first_name, last_name, email = payload.first_name.strip(), payload.last_name.strip(), payload.email.strip().lower()
    if not first_name or not last_name or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(422, "Enter both names and a valid email address")
    code = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM Users WHERE email = %s", (email,))
            if cursor.fetchone():
                raise HTTPException(409, "An account already uses this email")
            cursor.execute(
                "SELECT invitation_id FROM AdminInvitations WHERE email = %s "
                "AND used_at IS NULL AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP() "
                "LIMIT 1 FOR UPDATE", (email,))
            if cursor.fetchone():
                raise HTTPException(409, "A pending invitation already exists for this email")
            cursor.execute(
                "INSERT INTO AdminInvitations (email, first_name, last_name, token_hash, invited_by, expires_at) "
                "VALUES (%s, %s, %s, %s, %s, UTC_TIMESTAMP() + INTERVAL 48 HOUR)",
                (email, first_name, last_name, token_hash, admin.user_id),
            )
            invitation_id = cursor.lastrowid
        conn.commit()
        return {"invitation_id": invitation_id, "email": email, "code": code, "expires_in_hours": 48}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/invitations/{invitation_id}/revoke")
def revoke_invitation(invitation_id: int, admin: User = Depends(require_admin)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE AdminInvitations SET revoked_at = UTC_TIMESTAMP(), revoked_by = %s "
                "WHERE invitation_id = %s AND used_at IS NULL AND revoked_at IS NULL "
                "AND expires_at > UTC_TIMESTAMP()", (admin.user_id, invitation_id))
            if cursor.rowcount != 1:
                raise HTTPException(409, "This invitation is no longer active")
        conn.commit()
        return {"status": "REVOKED"}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


class WelcomeSlideUpdate(BaseModel):
    eyebrow: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=500)


@router.put("/welcome-slides/{slide_number}")
def update_welcome_slide(slide_number: int, payload: WelcomeSlideUpdate,
                         admin: User = Depends(require_admin)):
    if slide_number not in (1, 2, 3, 4):
        raise HTTPException(404, "Welcome slide not found")
    eyebrow, title, description = (payload.eyebrow.strip(), payload.title.strip(), payload.description.strip())
    if not all((eyebrow, title, description)):
        raise HTTPException(422, "All welcome slide fields are required")
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO WelcomeSlides (slide_number, eyebrow, title, description, updated_by) "
                "VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE "
                "eyebrow = VALUES(eyebrow), title = VALUES(title), "
                "description = VALUES(description), updated_by = VALUES(updated_by)",
                (slide_number, eyebrow, title, description, admin.user_id),
            )
        conn.commit()
        return {"slide_number": slide_number, "eyebrow": eyebrow,
                "title": title, "description": description}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.get("/accounts")
def list_accounts(search: str = Query("", max_length=100),
                  role: Literal["patient", "provider", "admin"] | None = None,
                  limit: int = Query(50, ge=1, le=100),
                  offset: int = Query(0, ge=0),
                  admin: User = Depends(require_admin)):
    conn = connection()
    try:
        conditions = []
        values = []
        if search.strip():
            conditions.append("(email LIKE %s OR first_name LIKE %s OR last_name LIKE %s)")
            value = f"%{search.strip()}%"
            values.extend((value, value, value))
        if role:
            conditions.append("role = %s")
            values.append(role)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, first_name, last_name, email, role, date_created, is_active "
                "FROM Users" + where + " ORDER BY user_id DESC LIMIT %s OFFSET %s",
                (*values, limit, offset),
            )
            fields = ("user_id", "first_name", "last_name", "email", "role", "created_at", "is_active")
            return {"accounts": [dict(zip(fields, row)) for row in cursor.fetchall()]}
    finally:
        conn.close()


@router.post("/accounts/{user_id}/status")
def change_account_status(user_id: int, payload: AccountAction, admin: User = Depends(require_admin)):
    reason = payload.reason.strip()
    if len(reason) < 3:
        raise HTTPException(422, "Enter a reason of at least 3 characters")
    if user_id == admin.user_id:
        raise HTTPException(403, "You cannot change your own account status")
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT role, is_active FROM Users WHERE user_id = %s FOR UPDATE", (user_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(404, "Account not found")
            if row[0] == "admin":
                raise HTTPException(403, "Admin account status cannot be changed here")
            if bool(row[1]) == payload.active:
                raise HTTPException(409, "Account status has already changed")
            cursor.execute("UPDATE Users SET is_active = %s WHERE user_id = %s", (payload.active, user_id))
            cursor.execute(
                "INSERT INTO AdminAccountActions (target_user_id, admin_user_id, action, reason) "
                "VALUES (%s, %s, %s, %s)",
                (user_id, admin.user_id, "RESTORE" if payload.active else "SUSPEND", reason),
            )
        conn.commit()
        return {"user_id": user_id, "is_active": payload.active}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.get("/providers")
def list_providers(status: Literal["PENDING", "APPROVED", "REJECTED", "REMOVED"] = "PENDING",
                   limit: int = Query(50, ge=1, le=200),
                   offset: int = Query(0, ge=0),
                   admin: User = Depends(require_admin)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT p.provider_id, u.first_name, u.last_name, u.email, p.npi, "
                "p.specialty, p.license_state, p.license_number, p.verification_status, p.created_at "
                "FROM Providers p JOIN Users u ON u.user_id = p.user_id "
                "WHERE p.verification_status = %s ORDER BY p.created_at, p.provider_id "
                "LIMIT %s OFFSET %s", (status, limit, offset))
            fields = ("provider_id", "first_name", "last_name", "email", "npi", "specialty",
                      "license_state", "license_number", "verification_status", "created_at")
            return {"providers": [dict(zip(fields, row)) for row in cursor.fetchall()]}
    finally:
        conn.close()


@router.post("/providers/{provider_id}/review")
def review_provider(provider_id: int, payload: ReviewDecision, admin: User = Depends(require_admin)):
    if payload.decision == "APPROVED" and not payload.identity_and_license_verified:
        raise HTTPException(422, "Confirm identity and active license verification before approval")
    if payload.decision == "REMOVED" and not payload.confirm_revoke_patient_access:
        raise HTTPException(422, "Confirm that existing patient sharing will be revoked")
    note = payload.note.strip()
    if len(note) < 3:
        raise HTTPException(422, "Enter a review note")
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT verification_status FROM Providers WHERE provider_id = %s FOR UPDATE", (provider_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(404, "Doctor application not found")
            current_status = row[0]
            allowed = {
                "PENDING": {"APPROVED", "REJECTED"},
                "APPROVED": {"REMOVED"},
                "REJECTED": {"APPROVED"},
                "REMOVED": {"APPROVED"},
            }
            if payload.decision not in allowed.get(current_status, set()):
                raise HTTPException(409, "This doctor cannot be changed to that status")
            cursor.execute("UPDATE Providers SET verification_status = %s WHERE provider_id = %s", (payload.decision, provider_id))
            if payload.decision == "REMOVED":
                cursor.execute(
                    "UPDATE PatientProviderAssignments SET assignment_status = 'REVOKED' "
                    "WHERE provider_id = %s AND assignment_status <> 'REVOKED'", (provider_id,))
            cursor.execute(
                "INSERT INTO ProviderReviews (provider_id, admin_user_id, decision, review_note) "
                "VALUES (%s, %s, %s, %s)", (provider_id, admin.user_id, payload.decision, note))
        conn.commit()
        return {"status": payload.decision}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
