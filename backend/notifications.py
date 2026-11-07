"""Creates and persists in-app notifications: per-reading alerts (from a
single metric submission) and temporal alerts (from the sustained/
chronic-elevation rules in backend/engine/temporal_engine.py).

Kept separate from backend/routers/metrics.py and backend/routers/auth.py
to avoid a circular import -- metrics.py calls into this module, so this
module imports Vitals/METRIC_TABLES lazily instead of at top level.
"""
from datetime import datetime, timedelta, timezone

from backend.engine.temporal_engine import (
    evaluate_consecutive_condition,
    evaluate_persistent_condition,
)

METRIC_LABELS = {
    "BLOOD_PRESSURE": "Blood Pressure",
    "BLOOD_GLUCOSE": "Blood Glucose",
    "BLOOD_OXYGEN": "Blood Oxygen",
    "PEAK_FLOW_RATE": "Peak Flow",
    "BODY_MASS_INDEX": "Weight / BMI",
    "PHYSICAL_ACTIVITY": "Steps",
    "SLEEP": "Sleep",
    "WATER_INTAKE": "Water Intake",
}

# Health metrics (not goal-tracking ones) are the only ones evaluated for
# sustained/chronic temporal alerts -- "elevated" has no meaning for a step
# count or water intake goal.
HEALTH_METRIC_VALUES = {"BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BLOOD_OXYGEN", "BODY_MASS_INDEX", "PEAK_FLOW_RATE"}


def create_notification(cursor, user_id, title, message, severity, category,
                         metric_name=None, metric_value=None,
                         action_label=None, action_route=None, alert_key=None):
    cursor.execute(
        "INSERT INTO Notifications (user_id, title, message, severity, category, "
        "metric_name, metric_value, action_label, action_route, alert_key) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (user_id, title[:150], message[:1000], severity, category,
         metric_name, metric_value, action_label, action_route, alert_key),
    )
    return cursor.lastrowid


def recent_alert_exists(cursor, user_id, alert_key, cooldown_hours=24):
    """True if this exact recurring alert_key already fired recently, so a
    still-active condition doesn't create a new notification on every
    single subsequent submission."""
    cursor.execute(
        "SELECT 1 FROM Notifications WHERE user_id = %s AND alert_key = %s "
        "AND created_at >= %s LIMIT 1",
        (user_id, alert_key, datetime.now(timezone.utc) - timedelta(hours=cooldown_hours)),
    )
    return cursor.fetchone() is not None


def severity_from_alert_state(alert_state):
    if not alert_state:
        return "info"
    if "CRITICAL" in alert_state:
        return "critical"
    if "WARNING" in alert_state:
        return "warning"
    if "SUCCESS" in alert_state:
        return "success"
    return "info"


def notify_reading(cursor, user_id, metric_type_value, classification, metric_value_text=None):
    """Creates the per-reading notification for a just-submitted metric,
    mirroring the severity mapping the mobile NotificationProvider used to
    apply client-side (addMetricEvaluation): normal -> success, warning/
    critical -> the matching alert, anything else -> a generic info update."""
    label = METRIC_LABELS.get(metric_type_value, metric_type_value.replace("_", " ").title())

    if metric_type_value == "BLOOD_PRESSURE":
        overall = (classification or {}).get("overall") or {}
        alert_state = overall.get("alert_state")
        guidance = overall.get("alert_message")
        class_label = overall.get("classification")
    else:
        classification = classification or {}
        alert_state = classification.get("alert_state")
        guidance = classification.get("guidance")
        class_label = classification.get("classification")

    severity = severity_from_alert_state(alert_state)

    if severity == "success":
        title, message = "Measurement Saved", f"{label} was recorded successfully."
    elif severity == "critical":
        title = class_label or "Critical Health Alert"
        message = guidance or "VitalPilot received a critical health alert from the health analytics service."
    elif severity == "warning":
        title = class_label or "Health Measurement Warning"
        message = guidance or "Your latest measurement requires attention."
    else:
        title = class_label or "Health Update"
        message = guidance or "New health information is available."

    create_notification(
        cursor, user_id, title=title, message=message, severity=severity,
        category="health-alert" if severity in ("warning", "critical") else "metric",
        metric_name=metric_type_value, metric_value=metric_value_text,
        action_label="Review Measurement" if severity in ("warning", "critical") else "View Measurement",
        action_route="/metrics",
    )
    return severity


def _fetch_metric_window(cursor, user_id, metric_type, days=30):
    from backend.routers.auth import Vitals
    from backend.routers.metrics import METRIC_TABLES, record_from_row
    from backend.engine.clinical_evaluator import classify_blood_pressure
    from backend.metric_assessments import attach_assessments

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    table, fields = METRIC_TABLES[metric_type]
    timestamp_column = "recorded_at" if metric_type == Vitals.BODY_MASS_INDEX else "logged_at"

    cursor.execute(
        f"SELECT log_id, {', '.join(fields)}, {timestamp_column} FROM {table} "
        f"WHERE user_id = %s AND {timestamp_column} >= %s AND {timestamp_column} < %s "
        f"ORDER BY {timestamp_column}",
        (user_id, start.replace(tzinfo=None), end.replace(tzinfo=None)),
    )
    records = [record_from_row(metric_type, fields, row) for row in cursor.fetchall()]
    if metric_type == Vitals.BLOOD_PRESSURE:
        for record in records:
            record["classification"] = classify_blood_pressure(cursor, record["systolic_mmhg"], record["diastolic_mmhg"])
    else:
        attach_assessments(cursor, user_id, records)
    for record in records:
        record["timestamp"] = record["recorded_at"]
    return records


def _is_elevated(metric_type_value, record):
    classification = record.get("classification")
    if not classification:
        return False
    if metric_type_value == "BLOOD_PRESSURE":
        overall = classification.get("overall")
        alert_state = (overall or {}).get("alert_state", "")
    else:
        alert_state = classification.get("alert_state", "")
    return "WARNING" in alert_state or "CRITICAL" in alert_state


def _is_critical(metric_type_value, record):
    classification = record.get("classification")
    if not classification:
        return False
    if metric_type_value == "BLOOD_PRESSURE":
        overall = classification.get("overall")
        alert_state = (overall or {}).get("alert_state", "")
    else:
        alert_state = classification.get("alert_state", "")
    return "CRITICAL" in alert_state


def evaluate_temporal_alerts(cursor, user_id, metric_type):
    """Runs the sustained (k consecutive days) and chronic (X of last 30
    days) elevation rules from temporal_rules.md and creates a notification
    for each newly-triggered condition, skipping ones already notified
    within the cooldown window."""
    metric_type_value = metric_type.value
    if metric_type_value not in HEALTH_METRIC_VALUES:
        return

    logs = _fetch_metric_window(cursor, user_id, metric_type, days=30)
    if not logs:
        return
    label = METRIC_LABELS.get(metric_type_value, metric_type_value.replace("_", " ").title())

    def condition(log):
        return _is_elevated(metric_type_value, log)

    consecutive = evaluate_consecutive_condition(logs, condition, k_consecutive_days=3)
    if consecutive["triggered"]:
        alert_key = f"SUSTAINED:{metric_type_value}"
        if not recent_alert_exists(cursor, user_id, alert_key):
            severity = "critical" if _is_critical(metric_type_value, logs[-1]) else "warning"
            create_notification(
                cursor, user_id,
                title=f"Sustained {label} Alert",
                message=(
                    f"Your {label.lower()} readings have been elevated for "
                    f"{consecutive['consecutive_days']} consecutive days. "
                    "Consider discussing this with a healthcare professional."
                ),
                severity=severity, category="health-alert",
                metric_name=metric_type_value,
                action_label="Review Measurement", action_route="/metrics",
                alert_key=alert_key,
            )

    persistent = evaluate_persistent_condition(
        logs, condition, window_days=30, min_days_required=5,
        reference_date=datetime.now(timezone.utc),
    )
    if persistent["triggered"]:
        alert_key = f"CHRONIC:{metric_type_value}"
        if not recent_alert_exists(cursor, user_id, alert_key):
            create_notification(
                cursor, user_id,
                title=f"Chronic {label} Elevation",
                message=(
                    f"{label} has been elevated on {persistent['matching_days_count']} of the last "
                    f"{persistent['window_days']} days. This pattern is worth discussing with a "
                    "healthcare professional."
                ),
                severity="warning", category="health-alert",
                metric_name=metric_type_value,
                action_label="Review Measurement", action_route="/metrics",
                alert_key=alert_key,
            )
