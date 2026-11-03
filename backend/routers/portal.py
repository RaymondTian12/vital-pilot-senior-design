"""Role-scoped mobile portals; patient sharing requires an explicit consent row."""
from types import SimpleNamespace
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from backend.db import get_db_connection
from backend.security import get_current_user
from backend.routers.auth import Vitals
from backend.routers.metrics import get_metrics
router = APIRouter()

def role(user): return getattr(user.role, 'value', user.role)
def require(user, expected):
    if role(user) != expected: raise HTTPException(403, 'Not permitted for this account')

def connection():
    conn = get_db_connection()
    if not conn: raise HTTPException(503, 'Portal unavailable')
    return conn

class Consent(BaseModel):
    allowed: bool

@router.get('/sharing')
def sharing(current_user=Depends(get_current_user)):
    require(current_user, 'patient')
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT p.provider_id, u.firstname, u.lastname, p.specialty, COALESCE(c.allowed, 0) FROM Providers p JOIN Users u ON u.user_id = p.user_id LEFT JOIN PatientSharingConsents c ON c.provider_id = p.provider_id AND c.patient_user_id = %s ORDER BY p.provider_id LIMIT 100', (current_user.user_id,))
            return {'providers': [dict(zip(('provider_id','firstname','lastname','specialty','allowed'), row)) for row in cursor.fetchall()]}
    except Exception:
        raise HTTPException(503, 'Sharing unavailable. Check that the portal migration is installed.')
    finally: conn.close()

@router.put('/sharing/{provider_id}')
def consent(provider_id: int, payload: Consent, current_user=Depends(get_current_user)):
    require(current_user, 'patient')
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT provider_id FROM Providers WHERE provider_id = %s', (provider_id,))
            if not cursor.fetchone(): raise HTTPException(404, 'Registered provider not found')
            cursor.execute('INSERT INTO PatientSharingConsents (patient_user_id, provider_id, allowed) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE allowed = VALUES(allowed), updated_at = CURRENT_TIMESTAMP', (current_user.user_id, provider_id, payload.allowed))
        conn.commit()
        return {'allowed': payload.allowed}
    except HTTPException:
        conn.rollback(); raise
    except Exception:
        conn.rollback(); raise HTTPException(503, 'Could not update sharing')
    finally: conn.close()

@router.get('/provider/patients')
def patients(current_user=Depends(get_current_user)):
    require(current_user, 'provider')
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT u.user_id, u.firstname, u.lastname FROM PatientSharingConsents c JOIN Providers p ON p.provider_id = c.provider_id JOIN Users u ON u.user_id = c.patient_user_id WHERE p.user_id = %s AND c.allowed = 1 ORDER BY u.lastname, u.user_id LIMIT 100', (current_user.user_id,))
            return {'patients': [dict(zip(('user_id','firstname','lastname'), row)) for row in cursor.fetchall()]}
    except Exception: raise HTTPException(503, 'Patient list unavailable')
    finally: conn.close()

@router.get('/provider/patients/{patient_id}/metrics')
def patient_metrics(patient_id: int, metric_type: Vitals, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), current_user=Depends(get_current_user)):
    require(current_user, 'provider')
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT c.patient_user_id FROM PatientSharingConsents c JOIN Providers p ON p.provider_id = c.provider_id WHERE p.user_id = %s AND c.patient_user_id = %s AND c.allowed = 1', (current_user.user_id, patient_id))
            if not cursor.fetchone(): raise HTTPException(403, 'Patient permission is required')
    finally: conn.close()
    return get_metrics(metric_type, limit, offset, SimpleNamespace(user_id=patient_id))

@router.get('/admin/users')
def users(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), current_user=Depends(get_current_user)):
    require(current_user, 'admin')
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT user_id, firstname, lastname, role FROM Users ORDER BY user_id LIMIT %s OFFSET %s', (limit, offset))
            return {'users': [dict(zip(('user_id','firstname','lastname','role'), row)) for row in cursor.fetchall()]}
    finally: conn.close()
