from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from backend.db import get_db_connection
from backend.suggested_follow_up import attach_follow_up, suggested_follow_up
from backend.engine.clinical_evaluator import classify_blood_pressure
from backend.models.User import User
from backend.metric_assessments import load_settings, save_assessment, attach_assessments
from backend.notifications import evaluate_temporal_alerts, notify_reading
from backend.routers.auth import Vitals
from backend.security import get_current_user

router = APIRouter()


class MetricCreateRequest(BaseModel):
    # Bounds below are realistic physiological/device ranges, not just "a
    # positive number" -- e.g. blood pressure previously had no upper bound
    # at all and would accept a systolic reading of 10000.
    glucose_context: Literal["fasting", "nonfasting", "unknown"] = "unknown"
    peak_personal_best: Optional[int] = Field(default=None, ge=30, le=900, strict=True)
    metric_type: Vitals
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Start of the device's local calendar day (see mobile's summaryWindow),
    # used only for the one-entry-per-day goal metrics to find today's
    # existing row to update instead of inserting a new one. `timezone` (an
    # IANA zone name) is accepted as a fallback for clients that don't send
    # local_day_start -- the day boundary is then computed server-side.
    local_day_start: Optional[datetime] = None
    timezone: Optional[str] = None
    systolic_mmhg: Optional[int] = Field(default=None, ge=50, le=300)
    diastolic_mmhg: Optional[int] = Field(default=None, ge=30, le=200)
    glucose_mgdl: Optional[int] = Field(default=None, ge=20, le=600, strict=True)
    spo2_percentage: Optional[int] = Field(default=None, ge=50, le=100, strict=True)
    flow_rate_lmin: Optional[int] = Field(default=None, ge=30, le=900, strict=True)
    steps_taken: Optional[int] = Field(default=None, ge=0, le=200000, strict=True)
    weight_lbs: Optional[Decimal] = Field(default=None, ge=Decimal("20"), le=Decimal("999.99"), max_digits=5, decimal_places=2)
    duration_hours: Optional[Decimal] = Field(default=None, ge=0, le=24, max_digits=4, decimal_places=2)
    amount_cups: Optional[Decimal] = Field(default=None, ge=0, le=Decimal("99.99"), max_digits=4, decimal_places=2)

    @field_validator("amount_cups")
    @classmethod
    def half_cup_increments(cls, value):
        if value is not None and value % Decimal("0.5") != 0:
            raise ValueError("Enter water intake in half-cup increments (e.g. 6, 6.5, 7).")
        return value


# Goal-tracking metrics (see metric_assessments.py's GOALS) get at most one
# row per local calendar day: saving again today updates that row instead
# of inserting another. Clinical health metrics (including peak flow, which
# is tracked multiple times a day on purpose) are unaffected.
ONE_PER_DAY_METRICS = {Vitals.SLEEP, Vitals.PHYSICAL_ACTIVITY, Vitals.WATER_INTAKE}


# metric_type -> (table name, ordered (request field, numeric) columns to
# read/write, besides the shared user_id/log_id/logged_at columns).
METRIC_TABLES: dict[Vitals, tuple[str, list[str]]] = {
    Vitals.BLOOD_PRESSURE: ("BloodPressure", ["systolic_mmhg", "diastolic_mmhg"]),
    Vitals.BLOOD_GLUCOSE: ("BloodGlucose", ["glucose_mgdl"]),
    Vitals.BLOOD_OXYGEN: ("BloodOxygenSaturation", ["spo2_percentage"]),
    Vitals.PEAK_FLOW_RATE: ("PeakFlowRate", ["flow_rate_lmin"]),
    Vitals.PHYSICAL_ACTIVITY: ("PhysicalActivity", ["steps_taken"]),
    Vitals.SLEEP: ("Sleep", ["duration_hours"]),
    Vitals.WATER_INTAKE: ("WaterIntake", ["amount_cups"]),
    Vitals.BODY_MASS_INDEX: ("BodyMassIndex", ["weight_lbs", "bmi_value"]),
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
    record.update((field, float(value) if isinstance(value, Decimal) else value) for field, value in zip(fields, values))
    return record


def _local_day_window(payload: MetricCreateRequest) -> Optional[tuple[datetime, datetime]]:
    """Returns the (start, end) UTC bounds of the submission's local calendar
    day, preferring the client-computed local_day_start and falling back to
    computing it server-side from an IANA timezone name."""
    if payload.local_day_start is not None:
        day_start = utc_timestamp(payload.local_day_start).replace(tzinfo=None)
        return day_start, day_start + timedelta(hours=24)
    if payload.timezone:
        try:
            zone = ZoneInfo(payload.timezone)
        except (ZoneInfoNotFoundError, ValueError):
            raise HTTPException(422, "Invalid timezone")
        local = utc_timestamp(payload.recorded_at).astimezone(zone)
        start = local.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        return start.astimezone(timezone.utc).replace(tzinfo=None), end.astimezone(timezone.utc).replace(tzinfo=None)
    return None


@router.post("/metrics", status_code=status.HTTP_201_CREATED)
def create_metric(payload: MetricCreateRequest, current_user: User = Depends(get_current_user)):
    mapping = METRIC_TABLES.get(payload.metric_type)
    if mapping is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{payload.metric_type.value} is not supported yet")
    table, fields = mapping

    values = []
    input_fields = [field for field in fields if field != "bmi_value"]
    for field in input_fields:
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
    updated = False
    timestamp_column = "recorded_at" if payload.metric_type == Vitals.BODY_MASS_INDEX else "logged_at"
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            if payload.metric_type == Vitals.BODY_MASS_INDEX:
                cursor.execute("SELECT baseline_height_in FROM UserHealthProfiles WHERE user_id = %s", (current_user.user_id,))
                profile = cursor.fetchone()
                if not profile or not profile[0] or Decimal(str(profile[0])) <= 0:
                    raise HTTPException(400, "Complete your health profile with your height before saving weight.")
                height = Decimal(str(profile[0]))
                bmi = (payload.weight_lbs * Decimal("703") / (height * height)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
                if bmi <= 0 or bmi > Decimal("999.9"):
                    raise HTTPException(400, "Weight and profile height produce a BMI outside the supported storage range. Review your profile height.")
                values.append(bmi)

            existing_log_id = None
            if payload.metric_type in ONE_PER_DAY_METRICS:
                window = _local_day_window(payload)
                if window is not None:
                    day_start, day_end = window
                    # Row-locks the caller's own user row so two near-simultaneous
                    # submissions for the same day serialize instead of racing
                    # into two separate inserts.
                    cursor.execute("SELECT user_id FROM Users WHERE user_id = %s FOR UPDATE", (current_user.user_id,))
                    cursor.fetchone()
                    cursor.execute(
                        f"SELECT log_id FROM {table} WHERE user_id = %s AND {timestamp_column} >= %s AND {timestamp_column} < %s "
                        f"ORDER BY {timestamp_column} DESC, log_id DESC LIMIT 1",
                        (current_user.user_id, day_start, day_end),
                    )
                    row = cursor.fetchone()
                    existing_log_id = row[0] if row else None

            if existing_log_id is not None:
                assignments = ", ".join(f"{field} = %s" for field in fields)
                cursor.execute(
                    f"UPDATE {table} SET {assignments}, {timestamp_column} = %s WHERE log_id = %s AND user_id = %s",
                    (*values, utc_timestamp(payload.recorded_at).replace(tzinfo=None), existing_log_id, current_user.user_id),
                )
                log_id = existing_log_id
                updated = True
            else:
                cursor.execute(
                    f"INSERT INTO {table} (user_id, {columns}, {timestamp_column}) VALUES (%s, {placeholders}, %s)",
                    (current_user.user_id, *values, utc_timestamp(payload.recorded_at).replace(tzinfo=None)),
                )
                log_id = cursor.lastrowid

            if payload.metric_type == Vitals.BLOOD_PRESSURE:
                classification = classify_blood_pressure(cursor, payload.systolic_mmhg, payload.diastolic_mmhg)
            else:
                record = {"log_id": log_id, "metric_type": payload.metric_type.value, "recorded_at": utc_timestamp(payload.recorded_at), **dict(zip(fields, values))}
                context = {}
                if payload.metric_type == Vitals.BLOOD_GLUCOSE: context["glucose_context"] = payload.glucose_context
                settings = load_settings(cursor, current_user.user_id)
                if payload.metric_type == Vitals.PEAK_FLOW_RATE:
                    best = settings["goals"].get("Peak Flow") or payload.peak_personal_best
                    if best: context["peak_personal_best"] = best
                classification = save_assessment(cursor, current_user.user_id, record, settings, context)

            try:
                metric_value_text = (
                    f"{payload.systolic_mmhg}/{payload.diastolic_mmhg}" if payload.metric_type == Vitals.BLOOD_PRESSURE
                    else str(getattr(payload, input_fields[0]))
                )
                notify_reading(cursor, current_user.user_id, payload.metric_type.value, classification, metric_value_text, log_id)
                evaluate_temporal_alerts(cursor, current_user.user_id, payload.metric_type)
            except Exception as notify_exc:
                # Never let a notification bug block saving the reading itself.
                print(f"Error occurred while creating notifications for a saved metric. Error: {notify_exc}")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
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
        "updated": updated,
        "suggested_follow_up": suggested_follow_up(payload.metric_type.value, classification),
        **{field: float(value) if isinstance(value, Decimal) else value for field, value in zip(fields, values)},
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
    timestamp_column = "recorded_at" if metric_type == Vitals.BODY_MASS_INDEX else "logged_at"

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")

    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            cursor.execute(
                f"SELECT log_id, {columns}, {timestamp_column} FROM {table} "
                f"WHERE user_id = %s ORDER BY {timestamp_column} DESC, log_id DESC LIMIT %s OFFSET %s",
                (current_user.user_id, limit, offset),
            )
            rows = cursor.fetchall()
            records = [record_from_row(metric_type, fields, row) for row in rows]
            if metric_type == Vitals.BLOOD_PRESSURE:
                for record in records:
                    record["classification"] = classify_blood_pressure(
                        cursor, record["systolic_mmhg"], record["diastolic_mmhg"]
                    )
            else:
                attach_assessments(cursor, current_user.user_id, records)
    except Exception as e:
        print(f"Error occurred while fetching metrics. Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch metrics")
    finally:
        conn.close()

    return {"metric_type": metric_type.value, "count": len(records), "records": attach_follow_up(records)}
