"""Generates a clinical-style PDF health report for a 7/30/90-day period."""
import json
import time
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from backend.db import get_db_connection
from backend.metric_assessments import attach_assessments, overall_result
from backend.report_generator import (
    build_report_data,
    build_report_pdf,
    fetch_patient_header,
    fetch_previous_report,
    gather_period_records,
    generate_narrative,
    parse_combined_narrative,
    summarize_metric_stats,
)
from backend.security import get_current_user

router = APIRouter()

# One combined call (not two) to stay within Gemini's free-tier daily request
# quota -- this doubles how many reports a day the quota actually covers.
COMBINED_INSTRUCTIONS = (
    "You are drafting two sections of a patient's self-monitoring health report, in a clear, "
    "professional clinical tone. You are given structured JSON data about the patient, the "
    "metrics they tracked over a period, and any urgent/warning alerts from that period.\n\n"
    "Write exactly two sections, each starting on its own line with the exact marker shown:\n\n"
    "===HPI===\n"
    "1-2 short paragraphs: state the patient's age and sex, the length of the tracked period, "
    "and which metrics they tracked. If prior-period data is included, briefly note how this "
    "period compares.\n\n"
    "===SUMMARY===\n"
    "One short paragraph synthesizing the overall picture: what stands out, what's reassuring, "
    "and what's worth discussing with a healthcare professional. End with a brief reminder that "
    "this is not a medical diagnosis.\n\n"
    "Do not invent any number not present in the provided data. Do not diagnose or prescribe. "
    "Use the exact markers '===HPI===' and '===SUMMARY===' verbatim, each on its own line, "
    "before each section."
)

# Per-user cooldown between report generations -- each one makes an AI call
# and writes a full PDF, so this keeps a slow double-tap from the client from
# burning Gemini quota or hammering the database.
_RATE_LIMIT_SECONDS = 60
_rate_lock = Lock()
_last_generated: dict[int, float] = {}


def _enforce_rate_limit(user_id: int):
    now = time.monotonic()
    with _rate_lock:
        last = _last_generated.get(user_id, -_RATE_LIMIT_SECONDS)
        if now - last < _RATE_LIMIT_SECONDS:
            raise HTTPException(429, "Please wait a minute before generating another report. Check report history before retrying.")
        _last_generated[user_id] = now
        # Bound the dict's growth -- drop entries that are well outside any
        # plausible window instead of tracking every user forever.
        stale = [uid for uid, ts in _last_generated.items() if now - ts > 3600]
        for uid in stale:
            del _last_generated[uid]


@router.get("/reports/generate")
def generate_report(days: int = Query(...), current_user=Depends(get_current_user)):
    if days not in (7, 30, 90):
        raise HTTPException(status_code=422, detail="days must be 7, 30, or 90")
    _enforce_rate_limit(current_user.user_id)
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Report generation is temporarily unavailable.")
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET time_zone = %s", ("+00:00",))
            header = fetch_patient_header(cursor, current_user.user_id)
            if not header:
                raise HTTPException(400, "Complete your health profile before generating a report.")

            records = gather_period_records(cursor, current_user.user_id, start, end)
            attach_assessments(cursor, current_user.user_id, records)
            overall = overall_result(records, start, end)
            stats = summarize_metric_stats(records)
            previous = fetch_previous_report(cursor, header["profile_id"], start)

            narrative_context = {
                "patient": {"first_name": header["first_name"], "age": header["age"], "sex": header["sex"]},
                "period_days": days,
                "start": start.date().isoformat(),
                "end": end.date().isoformat(),
                "metrics_tracked": {k: v for k, v in stats.items() if v["count"] > 0},
                "previous_period": previous,
                "urgent_readings": overall["urgent_readings"],
                "warning_readings": overall["warning_readings"],
            }
            combined_text = generate_narrative(COMBINED_INSTRUCTIONS, narrative_context)
            narrative = parse_combined_narrative(combined_text)

            pdf_bytes = build_report_pdf(
                header, f"{days}-day", start, end, overall, stats, previous, narrative,
            )
            report_data = build_report_data(
                header, f"{days}-day", start, end, overall, stats, previous, narrative,
            )

            report_summary = json.dumps({
                "metrics_tracked": {k: v["count"] for k, v in stats.items()},
                "urgent_count": len(overall["urgent_readings"]),
                "warning_count": len(overall["warning_readings"]),
            })
            cursor.execute(
                "INSERT INTO ClinicalReports (patient_profile_id, generated_by_user_id, report_title, "
                "start_date, end_date, summary_text, file_url, file_size_kb, pdf_data, report_data) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    header["profile_id"], current_user.user_id, f"{days}-Day Health Report",
                    start.date(), end.date(), report_summary,
                    "pending", max(1, len(pdf_bytes) // 1024), pdf_bytes, json.dumps(report_data),
                ),
            )
            report_id = cursor.lastrowid
            cursor.execute(
                "UPDATE ClinicalReports SET file_url = %s WHERE report_id = %s",
                (f"/reports/{report_id}/download", report_id),
            )
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        print(f"Error occurred while generating report. Error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate report")
    finally:
        conn.close()

    filename = f"vitalpilot-report-{days}day-{end.date()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Report-Id": str(report_id),
        },
    )


@router.get("/reports/history")
def report_history(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Report history is temporarily unavailable.")
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT report_id, report_title, start_date, end_date, file_size_kb, created_at, "
                "pdf_data IS NOT NULL AS downloadable, report_data IS NOT NULL AS previewable "
                "FROM ClinicalReports WHERE generated_by_user_id = %s "
                "ORDER BY created_at DESC",
                (current_user.user_id,),
            )
            rows = cursor.fetchall()
    except Exception as exc:
        print(f"Error occurred while loading report history. Error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to load report history")
    finally:
        conn.close()
    return {
        "reports": [
            {
                "report_id": row[0],
                "report_title": row[1],
                "start_date": row[2],
                "end_date": row[3],
                "file_size_kb": row[4],
                "created_at": row[5],
                "downloadable": bool(row[6]),
                "previewable": bool(row[7]),
            }
            for row in rows
        ]
    }


@router.get("/reports/{report_id}/preview")
def preview_report(report_id: int, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Report preview is temporarily unavailable.")
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT generated_by_user_id, report_data "
                "FROM ClinicalReports WHERE report_id = %s",
                (report_id,),
            )
            row = cursor.fetchone()
    except Exception as exc:
        print(f"Error occurred while loading report preview. Error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to load report preview")
    finally:
        conn.close()
    # 404 (not 403) for both "doesn't exist" and "not yours" -- don't reveal
    # that a report_id belonging to someone else exists.
    if not row or row[0] != current_user.user_id:
        raise HTTPException(404, "Report not found.")
    _, report_data = row
    if report_data is None:
        raise HTTPException(410, "This report was generated before in-app preview was added and can't be previewed. Generate a new one.")
    return json.loads(report_data)


@router.get("/reports/{report_id}/download")
def download_report(report_id: int, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Report download is temporarily unavailable.")
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT generated_by_user_id, report_title, end_date, pdf_data "
                "FROM ClinicalReports WHERE report_id = %s",
                (report_id,),
            )
            row = cursor.fetchone()
    except Exception as exc:
        print(f"Error occurred while downloading report. Error: {exc}")
        raise HTTPException(status_code=500, detail="Failed to download report")
    finally:
        conn.close()
    # 404 (not 403) for both "doesn't exist" and "not yours" -- don't reveal
    # that a report_id belonging to someone else exists.
    if not row or row[0] != current_user.user_id:
        raise HTTPException(404, "Report not found.")
    _, title, end_date, pdf_data = row
    if pdf_data is None:
        raise HTTPException(410, "This report was generated before PDF storage was added and can't be re-downloaded. Generate a new one.")
    filename = f"vitalpilot-report-{report_id}-{end_date}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
