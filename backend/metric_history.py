"""Calendar-day aggregates for charts; raw observations remain independent of paging."""

from datetime import timedelta

HABITS = {"SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"}
FIELDS = {
    "BLOOD_PRESSURE": ["systolic_mmhg", "diastolic_mmhg"],
    "BLOOD_GLUCOSE": ["glucose_mgdl"],
    "BLOOD_OXYGEN": ["spo2_percentage"],
    "BODY_MASS_INDEX": ["weight_lbs", "bmi_value"],
    "PEAK_FLOW_RATE": ["flow_rate_lmin"],
    "SLEEP": ["duration_hours"],
    "WATER_INTAKE": ["amount_cups"],
    "PHYSICAL_ACTIVITY": ["steps_taken"],
}


def context_assessment(record):
    """Keep recognized BP component warnings when the overall tier is unknown."""
    classification = record.get("classification") or {}
    if record["metric_type"] != "BLOOD_PRESSURE":
        return classification
    if classification.get("overall"):
        return classification["overall"]
    components = [classification.get(name) or {} for name in ("systolic", "diastolic")]
    for severity in ("CRITICAL", "WARNING"):
        for value in components:
            if severity in value.get("alert_state", ""):
                return {
                    **value,
                    "classification": "Partial assessment: "
                    + value.get("classification", "Needs review"),
                }
    return {"classification": "Assessment unavailable", "alert_state": "UNKNOWN"}


def accumulate(bucket, record, fields):
    bucket["count"] += 1
    for field in fields:
        value = record.get(field)
        if value is None:
            continue
        value = float(value)
        stat = bucket["values"].setdefault(
            field, {"min": value, "max": value, "sum": 0, "count": 0}
        )
        stat["min"] = min(stat["min"], value)
        stat["max"] = max(stat["max"], value)
        stat["sum"] += value
        stat["count"] += 1


def finalize(bucket):
    return {
        "count": bucket["count"],
        "values": {
            field: {"min": s["min"], "max": s["max"], "avg": s["sum"] / s["count"]}
            for field, s in bucket["values"].items()
        },
    }


class HistoryAggregate:
    def __init__(self, kind, start, end, zone):
        self.kind, self.fields, self.zone = kind, FIELDS[kind], zone
        self.daily = {}
        self.total = {"count": 0, "values": {}}
        self.raw_count = 0
        self.latest = None
        day = start.astimezone(zone).date()
        last = (end.astimezone(zone) - timedelta(microseconds=1)).date()
        self.dates = []
        while day <= last:
            self.dates.append(day.isoformat())
            day += timedelta(days=1)

    def add(self, record):
        self.raw_count += 1
        if self.latest is None:
            self.latest = record
        day = record["recorded_at"].astimezone(self.zone).date().isoformat()
        bucket = self.daily.setdefault(day, {"count": 0, "values": {}, "contexts": {}})
        # Records arrive newest-first. A habit day is its latest saved snapshot.
        if self.kind in HABITS and bucket["count"]:
            return
        accumulate(bucket, record, self.fields)
        accumulate(self.total, record, self.fields)
        if self.kind == "BLOOD_GLUCOSE":
            context = (
                (record.get("classification") or {})
                .get("context", {})
                .get("glucose_context", "unknown")
            )
            if context not in ("fasting", "nonfasting"):
                context = "unknown"
            group = bucket["contexts"].setdefault(context, {"count": 0, "values": {}})
            accumulate(group, record, self.fields)

    def result(self):
        daily = []
        for day in self.dates:
            bucket = self.daily.get(day)
            daily.append(
                {
                    "date": day,
                    **(finalize(bucket) if bucket else {"count": 0, "values": {}}),
                    "contexts": {
                        name: finalize(group)
                        for name, group in bucket["contexts"].items()
                    }
                    if bucket
                    else {},
                }
            )
        return {
            "daily": daily,
            "summary": {
                **finalize(self.total),
                "raw_count": self.raw_count,
                "days_logged": len(self.daily),
            },
            "latest": self.latest,
        }
