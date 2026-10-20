from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.db import get_db_connection
from backend.engine.clinical_evaluator import classify_blood_pressure
from backend.models.User import User
from backend.routers.auth import Vitals
from backend.security import get_current_user

router = APIRouter()


class MetricCreateRequest(BaseModel):
    metric_type: Vitals
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Blood pressure fields. Future metric types add their own optional
    # fields here, validated against METRIC_TABLES in the handlers below.
    systolic_mmhg: Optional[int] = Field(default=None, gt=0)
    diastolic_mmhg: Optional[int] = Field(default=None, gt=0)


# metric_type -> (table name, ordered (request field, numeric) columns to
# read/write, besides the shared user_id/log_id/logged_at columns).
METRIC_TABLES: dict[Vitals, tuple[str, list[str]]] = {
    Vitals.BLOOD_PRESSURE: ("BloodPressure", ["systolic_mmhg", "diastolic_mmhg"]),
}


def utc_timestamp(value):
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def record_from_row(metric_type: Vitals, fields: list[str], row: tuple) -> dict:
    log_id, *values, logged_at = row
    record = {"log_id": log_id, "metric_type": metric_type.value, "recorded_at": utc_timestamp(logged_at)}
    record.update(zip(fields, values))
    return record


@router.post("/metrics", status_code=status.HTTP_201_CREATED)
def create_metric(payload: MetricCreateRequest, current_user: User = Depends(get_current_user)):
    mapping = METRIC_TABLES.get(payload.metric_type)
    if mapping is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{payload.metric_type.value} is not supported yet")
    table, fields = mapping

    values = []
    for field in fields:
        value = getattr(payload, field)
        if value is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{field} is required for {payload.metric_type.value}")
        values.append(value)

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")

    columns = ", ".join(fields)
    placeholders = ", ".join(["%s"] * len(fields))

    classification = None
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            cursor.execute(
                f"INSERT INTO {table} (user_id, {columns}, logged_at) VALUES (%s, {placeholders}, %s)",
                (current_user.user_id, *values, utc_timestamp(payload.recorded_at).replace(tzinfo=None)),
            )
            log_id = cursor.lastrowid
            if payload.metric_type == Vitals.BLOOD_PRESSURE:
                classification = classify_blood_pressure(cursor, payload.systolic_mmhg, payload.diastolic_mmhg)
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error occurred while saving metric. Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save metric")
    finally:
        conn.close()

    return {
        "log_id": log_id,
        "metric_type": payload.metric_type.value,
        "recorded_at": utc_timestamp(payload.recorded_at),
        "classification": classification,
        **{field: getattr(payload, field) for field in fields},
    }


@router.get("/metrics")
def get_metrics(
    metric_type: Vitals,
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
):
    mapping = METRIC_TABLES.get(metric_type)
    if mapping is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{metric_type.value} is not supported yet")
    table, fields = mapping
    columns = ", ".join(fields)

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")

    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            cursor.execute(
                f"SELECT log_id, {columns}, logged_at FROM {table} "
                "WHERE user_id = %s ORDER BY logged_at DESC, log_id DESC LIMIT %s OFFSET %s",
                (current_user.user_id, limit, offset),
            )
            rows = cursor.fetchall()
            records = [record_from_row(metric_type, fields, row) for row in rows]
            if metric_type == Vitals.BLOOD_PRESSURE:
                for record in records:
                    record["classification"] = classify_blood_pressure(
                        cursor, record["systolic_mmhg"], record["diastolic_mmhg"]
                    )
    except Exception as e:
        print(f"Error occurred while fetching metrics. Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch metrics")
    finally:
        conn.close()

    return {"metric_type": metric_type.value, "count": len(records), "records": records}
