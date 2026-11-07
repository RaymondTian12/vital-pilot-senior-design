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
from reportlab.platypus import (
    HRFlowable,
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from backend.engine.clinical_evaluator import classify_blood_pressure
from backend.routers.auth import Vitals
from backend.routers.metrics import METRIC_TABLES, record_from_row

LOGO_PATH = os.path.join(os.path.dirname(__file__), "assets", "logo.png")
AI_DISCLAIMER = (
    "The History of Present Illness and Summary sections above were drafted by an AI model "
    "(Gemini) from this patient's logged data. They are not written or reviewed by a clinician "
    "and may contain errors or omissions. Verify this narrative against the data tables above, "
    "and do not use it as the sole basis for a medical decision."
)

# VitalPilot brand palette (kept in sync with mobile's VitalPilotColors).
PRIMARY = colors.HexColor("#087F83")
PRIMARY_DARK = colors.HexColor("#06676B")
TITLE_COLOR = colors.HexColor("#142A35")
TEXT_SECONDARY = colors.HexColor("#536B7C")
MINT = colors.HexColor("#E5F4F5")
MINT_STRONG = colors.HexColor("#D5ECEF")
BORDER = colors.HexColor("#DCE5EC")
DANGER = colors.HexColor("#B42318")
DANGER_BG = colors.HexColor("#FDECEA")
WARNING = colors.HexColor("#854D0E")
WARNING_BG = colors.HexColor("#FFF4DF")

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
    """Calls the LLM (via backend.llm's multi-model fallback chain) for the
    report's prose. Returns a clearly-labeled placeholder (not an error) on
    any failure -- missing API key, every model exhausted, a timeout -- so
    the rest of the report still works end-to-end without it.

    Imports backend.llm lazily: that module builds its Gemini client at
    import time and raises immediately if GEMINI_API_KEY isn't set, so a
    top-level import here would take down the whole backend on startup
    whenever the key is missing, not just this one feature.
    """
    prompt = f"{system_instruction}\n\nDATA:\n{json.dumps(context, default=str)}"
    try:
        from backend.llm import call_model_with_fallbacks

        return (call_model_with_fallbacks(prompt) or "").strip()
    except Exception as exc:
        return f"[AI-generated narrative unavailable: {exc}]"


def parse_combined_narrative(text):
    """Splits a single Gemini response into its HPI and Summary sections.
    Falls back to showing the same text (including an error placeholder)
    in both slots if the model didn't follow the marker format."""
    _, hpi_marker, after_hpi = text.partition("===HPI===")
    hpi_text, summary_marker, summary_text = after_hpi.partition("===SUMMARY===")
    if not hpi_marker or not summary_marker:
        return {"hpi": text.strip(), "summary": text.strip()}
    return {"hpi": hpi_text.strip(), "summary": summary_text.strip()}


def build_report_data(header, period_label, start, end, overall, stats, previous, narrative):
    """Normalizes everything a report is made of into one JSON-serializable
    dict. Used both to drive the PDF layout and as the response body for the
    mobile app's in-app report preview screen, so the two views can never
    drift apart."""
    alerts = [
        {**reading, "severity": "URGENT"} for reading in overall.get("urgent_readings", [])
    ] + [
        {**reading, "severity": "WARNING"} for reading in overall.get("warning_readings", [])
    ]
    alerts.sort(key=lambda reading: reading["recorded_at"], reverse=True)
    return {
        "period_label": period_label,
        "start_date": start.date().isoformat(),
        "end_date": end.date().isoformat(),
        "patient": {
            "name": header["name"],
            "age": header["age"],
            "sex": header["sex"],
            "dob": header["dob"],
            "height_in": header["height_in"],
            "latest_weight_lbs": header["latest_weight_lbs"],
        },
        "narrative": {"hpi": narrative.get("hpi", ""), "summary": narrative.get("summary", "")},
        "previous_report": previous,
        "metrics": [
            {"metric_type": metric_type, "label": entry["label"], "unit": entry["unit"],
             "count": entry["count"], "fields": entry["fields"]}
            for metric_type, entry in stats.items()
        ],
        "alerts": [
            {
                "metric_type": reading["metric_type"],
                "classification": reading["classification"],
                "recorded_at": reading["recorded_at"].isoformat()
                if hasattr(reading["recorded_at"], "isoformat") else str(reading["recorded_at"]),
                "severity": reading["severity"],
            }
            for reading in alerts
        ],
    }


def _report_footer(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(PRIMARY_DARK)
    canvas_obj.drawString(0.75 * inch, 0.5 * inch, "VitalPilot")
    canvas_obj.setFillColor(TEXT_SECONDARY)
    canvas_obj.drawRightString(LETTER[0] - 0.75 * inch, 0.5 * inch, f"Page {canvas_obj.getPageNumber()}")
    canvas_obj.restoreState()


def build_report_pdf(header, period_label, start, end, overall, stats, previous, narrative):
    data = build_report_data(header, period_label, start, end, overall, stats, previous, narrative)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, topMargin=0.75 * inch, bottomMargin=0.85 * inch)
    styles = getSampleStyleSheet()
    body = styles["BodyText"]
    title_style = ParagraphStyle("ReportTitle", parent=styles["Title"], textColor=TITLE_COLOR)
    subtitle_style = ParagraphStyle("ReportSubtitle", parent=styles["BodyText"], textColor=TEXT_SECONDARY)
    heading = ParagraphStyle("SectionHeading", parent=styles["Heading2"], textColor=PRIMARY_DARK, spaceBefore=16, spaceAfter=4)
    small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8, textColor=TEXT_SECONDARY)
    table_style = TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, MINT]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ])

    title_block = [
        Paragraph("VitalPilot Health Report", title_style),
        Paragraph(f"{period_label} summary &middot; {start.date()} to {end.date()}", subtitle_style),
    ]
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=0.55 * inch, height=0.55 * inch)
        masthead = Table([[logo, title_block]], colWidths=[0.75 * inch, 420])
        masthead.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (0, 0), 0),
        ]))
        elements = [masthead]
    else:
        elements = [*title_block]
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY))
    elements.append(Spacer(1, 10))

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
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), PRIMARY_DARK),
        ("BACKGROUND", (0, 0), (-1, -1), MINT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)

    elements.append(Paragraph("History of Present Illness", heading))
    elements.append(HRFlowable(width="100%", thickness=0.75, color=BORDER))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(narrative.get("hpi", ""), body))
    if previous:
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(
            f"<i>Prior report on file: {previous['start_date']} to {previous['end_date']}.</i>", small,
        ))

    elements.append(Paragraph("Tracked Metrics This Period", heading))
    elements.append(HRFlowable(width="100%", thickness=0.75, color=BORDER))
    elements.append(Spacer(1, 6))
    data_rows = [["Metric", "Readings", "Range", "Average"]]
    for entry in data["metrics"]:
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
    elements.append(HRFlowable(width="100%", thickness=0.75, color=BORDER))
    elements.append(Spacer(1, 6))
    alerts = data["alerts"]
    if alerts:
        alert_rows = [["Date/Time", "Metric", "Classification"]]
        for alert in alerts:
            recorded = alert["recorded_at"]
            alert_rows.append([
                recorded[:16].replace("T", " ") if isinstance(recorded, str) else str(recorded),
                alert["metric_type"].replace("_", " ").title(),
                alert["classification"],
            ])
        alert_table = Table(alert_rows, colWidths=[140, 140, 170])
        alert_style = [
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
        ]
        for row_index, alert in enumerate(alerts, start=1):
            if alert["severity"] == "URGENT":
                alert_style.append(("BACKGROUND", (0, row_index), (-1, row_index), DANGER_BG))
                alert_style.append(("TEXTCOLOR", (2, row_index), (2, row_index), DANGER))
            else:
                alert_style.append(("BACKGROUND", (0, row_index), (-1, row_index), WARNING_BG))
                alert_style.append(("TEXTCOLOR", (2, row_index), (2, row_index), WARNING))
            alert_style.append(("FONTNAME", (2, row_index), (2, row_index), "Helvetica-Bold"))
        alert_table.setStyle(TableStyle(alert_style))
        elements.append(alert_table)
    else:
        elements.append(Paragraph("No urgent or warning alerts were triggered during this period.", body))

    elements.append(Paragraph("Summary", heading))
    elements.append(HRFlowable(width="100%", thickness=0.75, color=BORDER))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(narrative.get("summary", ""), body))

    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"<i>{AI_DISCLAIMER}</i>", small))

    elements.append(Spacer(1, 16))
    elements.append(Paragraph(
        "This report is generated from self-reported readings and is not a medical diagnosis. "
        "Discuss these results with a licensed healthcare professional.",
        small,
    ))

    doc.build(elements, onFirstPage=_report_footer, onLaterPages=_report_footer)
    return buffer.getvalue()
