"""Read-only date-range history shared by patient History and Reports."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.db import get_db_connection
from backend.suggested_follow_up import attach_follow_up
from backend.security import get_current_user
from backend.routers.auth import Vitals
from backend.routers.metrics import METRIC_TABLES, record_from_row
from backend.engine.clinical_evaluator import classify_blood_pressure
from backend.metric_assessments import attach_assessments
from backend.metric_history import HistoryAggregate, context_assessment

router = APIRouter()


@router.get("/metrics/history")
def history(
    metric_type: Vitals,
    start_at: datetime,
    end_at: datetime,
    timezone_name: str = "UTC",
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
):
    return load_history(
        metric_type, start_at, end_at, timezone_name, limit, offset, current_user
    )


def load_history(
    metric_type,
    start_at,
    end_at,
    timezone_name,
    limit,
    offset,
    current_user,
    include_assessments=False,
):
    if any(t.tzinfo is None or t.utcoffset() is None for t in (start_at, end_at)):
        raise HTTPException(422, "Date boundaries must include timezone offsets")
    start, end = start_at.astimezone(timezone.utc), end_at.astimezone(timezone.utc)
    if not start < end or end - start > timedelta(days=92):
        raise HTTPException(422, "Choose a window of at most 92 days")
    try:
        zone = ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(422, "Invalid timezone")
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "History unavailable")
    aggregate = HistoryAggregate(metric_type.value, start, end, zone)
    page = []
    position = 0
    assessment_counts = {}
    table, fields = METRIC_TABLES[metric_type]
    timestamp = "recorded_at" if metric_type == Vitals.BODY_MASS_INDEX else "logged_at"
    try:
        # Assessment lookups need a separate cursor so they do not replace the
        # history result set while we consume its batches.
        with conn.cursor() as data, conn.cursor() as assessments:
            data.execute("SET time_zone = %s", ("+00:00",))
            data.execute(
                f"SELECT log_id, {', '.join(fields)}, {timestamp} FROM {table} WHERE user_id = %s AND {timestamp} >= %s AND {timestamp} < %s ORDER BY {timestamp} DESC, log_id DESC",
                (
                    current_user.user_id,
                    start.replace(tzinfo=None),
                    end.replace(tzinfo=None),
                ),
            )
            # Summaries consume the whole period; pagination only limits raw rows
            # returned to the table, never the chart statistics.
            while True:
                rows = data.fetchmany(500)
                if not rows:
                    break
                records = [record_from_row(metric_type, fields, row) for row in rows]
                if metric_type != Vitals.BLOOD_PRESSURE:
                    attach_assessments(assessments, current_user.user_id, records)
                for record in records:
                    if metric_type == Vitals.BLOOD_PRESSURE and (
                        include_assessments
                        or position == 0
                        or offset <= position < offset + limit
                    ):
                        record["classification"] = classify_blood_pressure(
                            assessments,
                            record["systolic_mmhg"],
                            record["diastolic_mmhg"],
                        )
                    if include_assessments:
                        value = context_assessment(record)
                        label = value.get("classification", "Assessment unavailable")
                        alert = value.get("alert_state", "UNKNOWN")
                        key = (label, alert)
                        assessment_counts[key] = assessment_counts.get(key, 0) + 1
                    attach_follow_up([record])
                    aggregate.add(record)
                    if offset <= position < offset + limit:
                        page.append(record)
                    position += 1
        return {
            "metric_type": metric_type.value,
            "start_at": start,
            "end_at": end,
            "timezone_name": zone.key,
            "records": page,
            "offset": offset,
            "more": offset + len(page) < position,
            **aggregate.result(),
            **(
                {
                    "assessment_counts": [
                        {"label": label, "alert_state": alert, "count": count}
                        for (label, alert), count in assessment_counts.items()
                    ]
                }
                if include_assessments
                else {}
            ),
        }
    except Exception:
        raise HTTPException(503, "Could not load metric history. Please retry.")
    finally:
        conn.close()
