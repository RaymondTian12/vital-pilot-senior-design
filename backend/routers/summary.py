"""Read-only summary for a client-defined local calendar window."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from backend.db import get_db_connection
from backend.metric_assessments import attach_assessments, overall_result
from backend.security import get_current_user
from backend.routers.metrics import METRIC_TABLES, record_from_row
from backend.routers.auth import Vitals
from backend.engine.clinical_evaluator import classify_blood_pressure

router = APIRouter()
PER_METRIC_LIMIT = 2000


@router.get("/daily-summary")
def daily_summary(start_at: datetime, today_start: datetime, end_at: datetime,
                  current_user=Depends(get_current_user)):
    bounds = (start_at, today_start, end_at)
    if any(value.tzinfo is None or value.utcoffset() is None for value in bounds):
        raise HTTPException(400, "Summary boundaries must include a timezone offset.")
    start, today, end = (value.astimezone(timezone.utc) for value in bounds)
    if not start <= today < end or end - start > timedelta(days=8) or end - today > timedelta(hours=26):
        raise HTTPException(400, "Invalid summary window. Request at most eight days including one current local day.")
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Your daily summary is temporarily unavailable.")
    records, truncated = [], []
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            for metric, (table, fields) in METRIC_TABLES.items():
                timestamp = "recorded_at" if metric == Vitals.BODY_MASS_INDEX else "logged_at"
                cursor.execute(
                    f"SELECT log_id, {', '.join(fields)}, {timestamp} FROM {table} "
                    f"WHERE user_id = %s AND {timestamp} >= %s AND {timestamp} < %s "
                    f"ORDER BY {timestamp} DESC, log_id DESC LIMIT %s",
                    (current_user.user_id, start.replace(tzinfo=None), end.replace(tzinfo=None), PER_METRIC_LIMIT + 1),
                )
                rows = cursor.fetchall()
                if len(rows) > PER_METRIC_LIMIT:
                    truncated.append(metric.value)
                for row in rows[:PER_METRIC_LIMIT]:
                    record = record_from_row(metric, fields, row)
                    # Preserve all today's BP classifications, including an earlier
                    # warning even if a later reading is within the normal tier.
                    if metric == Vitals.BLOOD_PRESSURE and record["recorded_at"] >= today:
                        record["classification"] = classify_blood_pressure(cursor, record["systolic_mmhg"], record["diastolic_mmhg"])
                    records.append(record)
            attach_assessments(cursor, current_user.user_id, records)
            cursor.execute(
                "SELECT metric_type, goal_value FROM MetricGoals WHERE user_id = %s ORDER BY updated_at DESC, goal_id DESC",
                (current_user.user_id,),
            )
            goals = {}
            goal_types = {"Sleep": "SLEEP", "Steps": "PHYSICAL_ACTIVITY", "Water": "WATER_INTAKE", "Peak Flow": "PEAK_FLOW_RATE"}
            for name, value in cursor.fetchall():
                if name in goal_types and goal_types[name] not in goals and value is not None and float(value) > 0:
                    goals[goal_types[name]] = float(value)
        return {"overall_result": overall_result(records, today, end, truncated), "records": records, "goals": goals, "truncated_metrics": truncated,
                "start_at": start, "today_start": today, "end_at": end}
    except Exception:
        raise HTTPException(503, "Your daily summary could not be loaded. Please try again.")
    finally:
        conn.close()
