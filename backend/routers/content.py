"""Public welcome copy; patient data is not exposed here."""
from fastapi import APIRouter, HTTPException

from backend.db import get_db_connection

router = APIRouter(prefix="/content")


@router.get("/welcome")
def welcome_content():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Database unavailable")
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT slide_number, eyebrow, title, description "
                "FROM WelcomeSlides ORDER BY slide_number"
            )
            return {"slides": [dict(zip(("slide_number", "eyebrow", "title", "description"), row))
                               for row in cursor.fetchall()]}
    finally:
        conn.close()
