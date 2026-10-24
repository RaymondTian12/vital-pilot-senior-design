"""Authenticated directory of providers registered with VitalPilot."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.db import get_db_connection
from backend.security import get_current_user

router = APIRouter()

@router.get('/care-team')
def care_team(specialty: Optional[str] = None, limit: int = Query(50, ge=1, le=200), current_user=Depends(get_current_user)):
    filters, values = [], []
    if specialty:
        terms = {
            'Cardiology': ['%cardio%', '%cardiovascular%'],
            'Primary care': ['%family%', '%primary%', '%internal medicine%', '%general practice%'],
        }.get(specialty, [specialty])
        filters.append('(' + ' OR '.join('p.specialty LIKE %s' for _ in terms) + ')')
        values.extend(terms)
    where = ' WHERE ' + ' AND '.join(filters) if filters else ''
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, 'Provider directory is temporarily unavailable')
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                'SELECT p.provider_id, p.npi, u.first_name, u.last_name, p.specialty, '
                'p.license_state, p.clinic_name, p.clinic_phone '
                'FROM Providers p JOIN Users u ON u.user_id = p.user_id' + where +
                ' ORDER BY u.last_name, u.first_name, p.provider_id LIMIT %s', (*values, limit))
            fields = ('provider_id', 'npi', 'first_name', 'last_name', 'specialty', 'license_state', 'clinic_name', 'phone')
            doctors = [dict(zip(fields, row)) for row in cursor.fetchall()]
        return {'source': 'vitalpilot_database', 'count': len(doctors), 'doctors': doctors}
    except Exception:
        raise HTTPException(503, 'Provider directory is temporarily unavailable')
    finally:
        conn.close()
