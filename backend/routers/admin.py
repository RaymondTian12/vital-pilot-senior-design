"""Administrator review of provider applications."""
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
    decision: Literal["APPROVED", "REJECTED"]
    note: str = Field(min_length=3, max_length=500)
    identity_and_license_verified: bool = False


@router.get("/providers")
def list_providers(status: Literal["PENDING", "APPROVED", "REJECTED"] = "PENDING",
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
            if row[0] != "PENDING":
                raise HTTPException(409, "This application has already been reviewed")
            cursor.execute("UPDATE Providers SET verification_status = %s WHERE provider_id = %s", (payload.decision, provider_id))
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
