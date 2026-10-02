"""
Classifies raw biometric readings against ClinicalThresholds rows.
Shared by seed/demo scripts now; the same lookups are what a real
logging endpoint would call to classify a reading at insert time.
"""

from typing import Optional, Tuple

# Severity order per metric, used to pick the worse of two component
# readings (e.g. blood pressure's systolic vs diastolic classification).
BLOOD_PRESSURE_SEVERITY = [
    "Normal Blood Pressure",
    "Elevated Blood Pressure",
    "Stage 1 Hypertension",
    "Stage 2 Hypertension",
    "Hypertensive Crisis",
]


def classify_value(cursor, metric_type: str, sub_metric: str, value: float) -> Optional[dict]:
    """Looks up which ClinicalThresholds row a value falls into."""
    cursor.execute(
        """
        SELECT classification, alert_state, alert_message
        FROM ClinicalThresholds
        WHERE metric_type = %s AND sub_metric = %s
          AND %s >= min_value AND %s < max_value
        LIMIT 1
        """,
        (metric_type, sub_metric, value, value),
    )
    row = cursor.fetchone()
    if not row:
        return None
    classification, alert_state, alert_message = row
    return {
        "classification": classification,
        "alert_state": alert_state,
        "alert_message": alert_message,
    }


def classify_blood_pressure(cursor, systolic: int, diastolic: int) -> dict:
    """Classifies a BP reading as the worse of its systolic/diastolic tiers."""
    systolic_result = classify_value(cursor, "BLOOD_PRESSURE", "SYSTOLIC", systolic)
    diastolic_result = classify_value(cursor, "BLOOD_PRESSURE", "DIASTOLIC", diastolic)

    def severity(result: Optional[dict]) -> int:
        if not result:
            return -1
        try:
            return BLOOD_PRESSURE_SEVERITY.index(result["classification"])
        except ValueError:
            return -1

    worse = systolic_result if severity(systolic_result) >= severity(diastolic_result) else diastolic_result
    return {
        "systolic": systolic_result,
        "diastolic": diastolic_result,
        "overall": worse,
    }


def is_at_least(classification: str, floor: str) -> bool:
    """True if `classification` is at least as severe as `floor` on the BP scale."""
    try:
        return BLOOD_PRESSURE_SEVERITY.index(classification) >= BLOOD_PRESSURE_SEVERITY.index(floor)
    except ValueError:
        return False
