"""Authenticated report history/download; files never receive public URLs."""

import json
import os
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path
from threading import Lock
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, model_validator
from backend.db import get_db_connection
from backend.security import get_current_user
from backend.routers.summary import build_summary
from backend.report_generator import report_facts, ai_explanation, render_pdf

router = APIRouter(prefix="/reports", tags=["reports"])
_lock = Lock()
_recent = {}


class ReportRequest(BaseModel):
    start_at: datetime
    today_start: datetime
    end_at: datetime
    timezone_name: str = "UTC"
    include_ai: bool = False
    ai_consent: bool = False

    @model_validator(mode="after")
    def consent_required(self):
        if self.include_ai and not self.ai_consent:
            raise ValueError(
                "Explicit consent is required to send summary data to Google Gemini"
            )
        return self


def storage():
    return Path(
        os.getenv(
            "VITALPILOT_REPORT_DIR",
            str(Path(__file__).resolve().parents[2] / ".reports"),
        )
    ).resolve()


def connect():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Report storage unavailable")
    return conn


def metadata(row):
    report_id, title, start, end, size, created, summary = row
    try:
        status = json.loads(summary or "{}").get("ai_status", "not_requested")
    except (ValueError, TypeError):
        status = "not_requested"
    return {
        "report_id": report_id,
        "title": title,
        "start_date": str(start),
        "end_date": str(end),
        "file_size_kb": size,
        "created_at": str(created),
        "ai_status": status,
    }


@router.get("/capabilities")
def capabilities(current_user=Depends(get_current_user)):
    return {
        "ai_available": bool(os.getenv("GEMINI_API_KEY")),
        "ai_provider": "Google Gemini",
    }


@router.get("")
def history(offset: int = Query(0, ge=0), current_user=Depends(get_current_user)):
    conn = connect()
    try:
        with conn.cursor() as c:
            c.execute(
                "SELECT r.report_id, r.report_title, r.start_date, r.end_date, r.file_size_kb, r.created_at, r.summary_text FROM ClinicalReports r JOIN UserHealthProfiles p ON p.profile_id = r.patient_profile_id WHERE p.user_id = %s ORDER BY r.created_at DESC, r.report_id DESC LIMIT 20 OFFSET %s",
                (current_user.user_id, offset),
            )
            return {"reports": [metadata(row) for row in c.fetchall()]}
    except Exception:
        raise HTTPException(503, "Could not load report history")
    finally:
        conn.close()


@router.post("", status_code=201)
def generate(payload: ReportRequest, current_user=Depends(get_current_user)):
    now = time.monotonic()
    with _lock:
        if now - _recent.get(current_user.user_id, -1000) < 60:
            raise HTTPException(
                429,
                "Please wait a minute before generating another report. Check report history before retrying.",
            )
        _recent[current_user.user_id] = now
        for uid in list(_recent):
            if now - _recent[uid] > 3600:
                del _recent[uid]
    conn = None
    target = None
    commit_attempted = False
    try:
        conn = connect()
        with conn.cursor() as c:
            c.execute(
                "SELECT profile_id FROM UserHealthProfiles WHERE user_id = %s",
                (current_user.user_id,),
            )
            row = c.fetchone()
            if not row:
                raise HTTPException(
                    409, "Complete your health profile before generating a report"
                )
            profile_id = row[0]
        data = build_summary(
            payload.start_at,
            payload.today_start,
            payload.end_at,
            current_user,
            payload.timezone_name,
            92,
        )
        if not data["records"]:
            raise HTTPException(400, "No saved readings in this period")
        data["timezone_name"] = payload.timezone_name
        narrative, ai_status = (
            ai_explanation(report_facts(data))
            if payload.include_ai
            else (None, "not_requested")
        )
        pdf = render_pdf(data, narrative, ai_status)
        directory = storage()
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        name = uuid4().hex + ".pdf"
        target = directory / name
        with target.open("xb") as file:
            os.chmod(target, 0o600)
            file.write(pdf)
        title = "VitalPilot health report"
        with conn.cursor() as c:
            c.execute(
                "INSERT INTO ClinicalReports (patient_profile_id, generated_by_user_id, report_title, start_date, end_date, summary_text, file_url, file_size_kb) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    profile_id,
                    current_user.user_id,
                    title,
                    payload.start_at.astimezone(ZoneInfo(payload.timezone_name)).date(),
                    (
                        payload.end_at.astimezone(ZoneInfo(payload.timezone_name))
                        - timedelta(microseconds=1)
                    ).date(),
                    json.dumps({"ai_status": ai_status, "narrative": narrative}),
                    name,
                    max(1, (len(pdf) + 1023) // 1024),
                ),
            )
            report_id = c.lastrowid
        commit_attempted = True
        conn.commit()
        return {
            "report_id": report_id,
            "title": title,
            "ai_status": ai_status,
            "file_size_kb": max(1, (len(pdf) + 1023) // 1024),
        }
    except HTTPException:
        if conn:
            conn.rollback()
        if target:
            target.unlink(missing_ok=True)
        raise
    except Exception:
        if conn:
            conn.rollback()
        if target:
            target.unlink(missing_ok=True)
        raise HTTPException(
            503,
            "Report could not be created. Check history before retrying; your readings are unchanged.",
        )
    finally:
        if conn:
            conn.close()
        # A missing profile, validation failure or render failure did not create
        # a report. Release the reservation so the user can correct and retry.
        # Keep it after a commit attempt, whose outcome may be uncertain.
        if not commit_attempted:
            with _lock:
                if _recent.get(current_user.user_id) == now:
                    _recent.pop(current_user.user_id, None)


@router.get("/{report_id}/pdf")
def download(report_id: int, current_user=Depends(get_current_user)):
    conn = connect()
    try:
        with conn.cursor() as c:
            c.execute(
                "SELECT r.file_url FROM ClinicalReports r JOIN UserHealthProfiles p ON p.profile_id = r.patient_profile_id WHERE r.report_id = %s AND p.user_id = %s",
                (report_id, current_user.user_id),
            )
            row = c.fetchone()
        if not row:
            raise HTTPException(404, "Report not found")
        # Database filename is never treated as an arbitrary path or remote URL.
        import re

        name = row[0]
        if not re.fullmatch(r"[a-f0-9]{32}\.pdf", name):
            raise HTTPException(404, "Report file unavailable")
        path = storage() / name
        if not path.is_file():
            raise HTTPException(404, "Report file unavailable")
        return FileResponse(
            path,
            media_type="application/pdf",
            filename=f"VitalPilot-report-{report_id}.pdf",
            headers={"Cache-Control": "no-store"},
        )
    finally:
        conn.close()
