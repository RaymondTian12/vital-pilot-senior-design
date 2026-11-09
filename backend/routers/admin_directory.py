"""Read-only mobile account directory; team provider portal owns clinical access."""
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.db import get_db_connection
from backend.models.User import UserRole
from backend.security import get_current_user
router = APIRouter(tags=["admin"])

@router.get('/admin/users')
def users(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), current_user=Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, 'Administrator access required')
    conn = get_db_connection()
    if not conn: raise HTTPException(503, 'Directory unavailable')
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT user_id, first_name, last_name, role FROM Users ORDER BY user_id LIMIT %s OFFSET %s', (limit, offset))
            return {'users': [dict(zip(('user_id','firstname','lastname','role'), row)) for row in cursor.fetchall()]}
    finally: conn.close()
