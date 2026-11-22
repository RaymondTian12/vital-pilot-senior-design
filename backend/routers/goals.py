"""Editable personal goals, serialized with patient metric writes."""
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from backend.db import get_db_connection
from backend.security import get_current_user

router = APIRouter()
NAMES = {'SLEEP': 'Sleep', 'PHYSICAL_ACTIVITY': 'Steps', 'WATER_INTAKE': 'Water', 'PEAK_FLOW_RATE': 'Peak Flow'}

class GoalsUpdate(BaseModel):
    # Bounds are realistic goal ranges, not just "a positive number" -- e.g.
    # a step goal previously had no real upper bound and would accept
    # 99,999,999 steps/day.
    SLEEP: Optional[Decimal] = Field(None, ge=Decimal('1'), le=Decimal('16'), decimal_places=2)
    PHYSICAL_ACTIVITY: Optional[int] = Field(None, ge=500, le=50000, strict=True)
    WATER_INTAKE: Optional[Decimal] = Field(None, ge=Decimal('1'), le=Decimal('20'), decimal_places=2)
    PEAK_FLOW_RATE: Optional[int] = Field(None, ge=30, le=900, strict=True)

    @model_validator(mode='after')
    def nonempty(self):
        if not any(v is not None for v in self.model_dump().values()):
            raise ValueError('Provide at least one goal')
        return self


def read_goals(cursor, user_id):
    cursor.execute('SELECT metric_type, goal_value FROM MetricGoals WHERE user_id = %s ORDER BY updated_at DESC, goal_id DESC', (user_id,))
    result = {}
    inverse = {v:k for k,v in NAMES.items()}
    for name, value in cursor.fetchall():
        if name in inverse and inverse[name] not in result:
            result[inverse[name]] = float(value)
    return result

@router.get('/goals')
def get_goals(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn: raise HTTPException(503, 'Goals unavailable')
    try:
        with conn.cursor() as cursor:
            return {'goals': read_goals(cursor, current_user.user_id)}
    finally:
        conn.close()

@router.patch('/goals')
def update_goals(payload: GoalsUpdate, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn: raise HTTPException(503, 'Goals unavailable')
    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT user_id FROM Users WHERE user_id = %s FOR UPDATE', (current_user.user_id,))
            cursor.fetchone()
            for kind, value in payload.model_dump(exclude_none=True).items():
                name = NAMES[kind]
                cursor.execute('SELECT goal_value, updated_at FROM MetricGoals WHERE user_id = %s AND metric_type = %s ORDER BY updated_at DESC, goal_id DESC', (current_user.user_id, name))
                previous = cursor.fetchone()
                if previous:
                    cursor.execute('INSERT INTO MetricGoalsHistory (user_id, metric_type, old_value, valid_from) VALUES (%s, %s, %s, %s)', (current_user.user_id, name, *previous))
                    cursor.execute('UPDATE MetricGoals SET goal_value = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s AND metric_type = %s', (value, current_user.user_id, name))
                else:
                    cursor.execute('INSERT INTO MetricGoals (user_id, metric_type, goal_value) VALUES (%s, %s, %s)', (current_user.user_id, name, value))
            result = read_goals(cursor, current_user.user_id)
        conn.commit()
        return {'goals': result}
    except Exception:
        conn.rollback()
        raise HTTPException(503, 'Could not save goals')
    finally:
        conn.close()
