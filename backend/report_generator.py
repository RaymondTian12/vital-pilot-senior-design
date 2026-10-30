"""Builds a clinical-style PDF health report for a 7/30/90-day period.

All numbers in the PDF come directly from the database. Gemini (when
GEMINI_API_KEY is configured) only writes the narrative prose, grounded in
that already-verified data -- it never invents or restates a number on its
own authority.
"""
import io
import json
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from backend.engine.clinical_evaluator import classify_blood_pressure
from backend.routers.auth import Vitals
from backend.routers.metrics import METRIC_TABLES, record_from_row

# Per-metric (label, unit, value field(s)) used for the "tracked metrics" table.
METRIC_DISPLAY = {
    Vitals.BLOOD_PRESSURE: ("Blood Pressure", "mmHg", ["systolic_mmhg", "diastolic_mmhg"]),
    Vitals.BLOOD_GLUCOSE: ("Blood Glucose", "mg/dL", ["glucose_mgdl"]),
    Vitals.BLOOD_OXYGEN: ("Blood Oxygen", "%", ["spo2_percentage"]),
    Vitals.PEAK_FLOW_RATE: ("Peak Flow", "L/min", ["flow_rate_lmin"]),
    Vitals.PHYSICAL_ACTIVITY: ("Steps", "steps", ["steps_taken"]),
    Vitals.SLEEP: ("Sleep", "hours", ["duration_hours"]),
    Vitals.WATER_INTAKE: ("Water Intake", "cups", ["amount_cups"]),
    Vitals.BODY_MASS_INDEX: ("Weight / BMI", "lbs / BMI", ["weight_lbs", "bmi_value"]),
}


def gather_period_records(cursor, user_id, start, end):
    """Fetch every logged reading for user_id within [start, end). Same query
    shape as /daily-summary, just without its 8-day window cap."""
    records = []
    for metric, (table, fields) in METRIC_TABLES.items():
        timestamp = "recorded_at" if metric == Vitals.BODY_MASS_INDEX else "logged_at"
        cursor.execute(
            f"SELECT log_id, {', '.join(fields)}, {timestamp} FROM {table} "
            f"WHERE user_id = %s AND {timestamp} >= %s AND {timestamp} < %s "
            f"ORDER BY {timestamp} DESC, log_id DESC",
            (user_id, start.replace(tzinfo=None), end.replace(tzinfo=None)),
        )
        for row in cursor.fetchall():
            record = record_from_row(metric, fields, row)
            if metric == Vitals.BLOOD_PRESSURE:
                record["classification"] = classify_blood_pressure(cursor, record["systolic_mmhg"], record["diastolic_mmhg"])
            records.append(record)
    return records


def summarize_metric_stats(records):
    """Per-metric count/min/max/avg for the 'tracked metrics' table."""
    by_kind = {}
    for record in records:
        by_kind.setdefault(record["metric_type"], []).append(record)
    stats = {}
    for metric, (label, unit, fields) in METRIC_DISPLAY.items():
        rows = by_kind.get(metric.value, [])
        entry = {"label": label, "unit": unit, "count": len(rows), "fields": {}}
        for field in fields:
            values = [float(row[field]) for row in rows if row.get(field) is not None]
            if values:
                entry["fields"][field] = {"min": min(values), "max": max(values), "avg": sum(values) / len(values)}
        stats[metric.value] = entry
    return stats


def fetch_patient_header(cursor, user_id):
    cursor.execute("SELECT first_name, last_name FROM Users WHERE user_id = %s", (user_id,))
    user_row = cursor.fetchone()
    cursor.execute(
        "SELECT profile_id, baseline_height_in, sex, date_of_birth FROM UserHealthProfiles WHERE user_id = %s",
        (user_id,),
    )
    profile_row = cursor.fetchone()
    if not user_row or not profile_row:
        return None
    cursor.execute(
        "SELECT weight_lbs FROM BodyMassIndex WHERE user_id = %s ORDER BY recorded_at DESC LIMIT 1",
        (user_id,),
    )
    weight_row = cursor.fetchone()
    first_name, last_name = user_row
    profile_id, height_in, sex, dob = profile_row
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return {
        "profile_id": profile_id,
        "name": f"{first_name} {last_name}",
        "first_name": first_name,
        "age": age,
        "dob": dob.isoformat(),
        "sex": sex,
        "height_in": float(height_in),
        "latest_weight_lbs": float(weight_row[0]) if weight_row else None,
    }


def fetch_previous_report(cursor, profile_id, before_start):
    """Most recent prior report for this profile, used for the 'notable
    differences from past periods' narrative context."""
    cursor.execute(
        "SELECT summary_text, start_date, end_date FROM ClinicalReports "
        "WHERE patient_profile_id = %s AND end_date <= %s ORDER BY end_date DESC LIMIT 1",
        (profile_id, before_start.date()),
    )
    row = cursor.fetchone()
    if not row:
        return None
    summary_text, start_date, end_date = row
    try:
        parsed = json.loads(summary_text) if summary_text else {}
    except (TypeError, ValueError):
        parsed = {}
    return {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "stats": parsed}


def generate_narrative(system_instruction, context):
    """Calls Gemini for one section of prose. Returns a clearly-labeled
    placeholder (not an error) when GEMINI_API_KEY isn't configured yet, so
    the rest of the report still works end-to-end without it."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return (
            "[AI-generated narrative unavailable: GEMINI_API_KEY is not configured. "
            "Every other figure in this report reflects real, saved data.]"
        )
    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        # NOTE: verify this model name against current Gemini API docs once a
        # real key is wired in -- naming may have moved on since this was written.
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=json.dumps(context, default=str),
            config={"system_instruction": system_instruction},
        )
        return (response.text or "").strip()
    except Exception as exc:
        return f"[AI-generated narrative unavailable: {exc}]"


def build_report_pdf(header, period_label, start, end, overall, stats, previous, narrative):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    body = styles["BodyText"]
    heading = ParagraphStyle("SectionHeading", parent=styles["Heading2"], spaceBefore=14, spaceAfter=6)
    small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8, textColor=colors.grey)
    table_style = TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    elements = [
        Paragraph("VitalPilot Health Report", styles["Title"]),
        Paragraph(f"{period_label} summary &middot; {start.date()} to {end.date()}", body),
        Spacer(1, 12),
    ]

    header_table = Table(
        [
            ["Patient", header["name"]],
            ["Age / Sex", f"{header['age']} / {header['sex']}"],
            ["Date of Birth", header["dob"]],
            ["Height", f"{header['height_in']:.1f} in"],
            ["Most Recent Weight", f"{header['latest_weight_lbs']:.1f} lbs" if header["latest_weight_lbs"] else "Not recorded"],
        ],
        colWidths=[160, 300],
    )
    header_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(header_table)

    elements.append(Paragraph("History of Present Illness", heading))
    elements.append(Paragraph(narrative.get("hpi", ""), body))
    if previous:
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(
            f"<i>Prior report on file: {previous['start_date']} to {previous['end_date']}.</i>", small,
        ))

    elements.append(Paragraph("Tracked Metrics This Period", heading))
    data_rows = [["Metric", "Readings", "Range", "Average"]]
    for entry in stats.values():
        if entry["count"] == 0:
            data_rows.append([entry["label"], "0", "-", "-"])
            continue
        ranges = [f"{fs['min']:g}-{fs['max']:g}" for fs in entry["fields"].values()]
        avgs = [f"{fs['avg']:.1f}" for fs in entry["fields"].values()]
        data_rows.append([entry["label"], str(entry["count"]), ", ".join(ranges), ", ".join(avgs)])
    data_table = Table(data_rows, colWidths=[140, 70, 140, 100])
    data_table.setStyle(table_style)
    elements.append(data_table)

    elements.append(Paragraph("Notable Alerts", heading))
    alerts = overall.get("urgent_readings", []) + overall.get("warning_readings", [])
    if alerts:
        alert_rows = [["Date/Time", "Metric", "Classification"]]
        for alert in sorted(alerts, key=lambda a: a["recorded_at"], reverse=True):
            recorded = alert["recorded_at"]
            alert_rows.append([
                recorded.strftime("%Y-%m-%d %H:%M") if hasattr(recorded, "strftime") else str(recorded),
                alert["metric_type"].replace("_", " ").title(),
                alert["classification"],
            ])
        alert_table = Table(alert_rows, colWidths=[140, 140, 170])
        alert_table.setStyle(table_style)
        elements.append(alert_table)
    else:
        elements.append(Paragraph("No urgent or warning alerts were triggered during this period.", body))

    elements.append(Paragraph("Summary", heading))
    elements.append(Paragraph(narrative.get("summary", ""), body))

    elements.append(Spacer(1, 16))
    elements.append(Paragraph(
        "This report is generated from self-reported readings and is not a medical diagnosis. "
        "Discuss these results with a licensed healthcare professional.",
        small,
    ))

    doc.build(elements)
    return buffer.getvalue()
