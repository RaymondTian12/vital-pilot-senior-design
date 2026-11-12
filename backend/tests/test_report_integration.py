"""Contracts for the deployed report implementation, with Gemini and DB mocked."""

import json
import os
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

os.environ.setdefault("jwt_secret_key", "report-integration-test")
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import reports
from backend import report_generator


class ReportIntegrationTests(unittest.TestCase):
    def setUp(self):
        reports._last_generated.clear()
        self.overrides = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        self.addCleanup(
            lambda: (
                app.dependency_overrides.clear(),
                app.dependency_overrides.update(self.overrides),
            )
        )
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.conn = MagicMock()
        self.cursor = self.conn.cursor.return_value.__enter__.return_value
        self.cursor.lastrowid = 23
        mocks = {
            "get_db_connection": self.conn,
            "fetch_patient_header": {
                "profile_id": 12,
                "first_name": "PRIVATE_NAME",
                "age": 35,
                "sex": "Other",
            },
            "gather_period_records": [
                {"metric_type": "BLOOD_OXYGEN", "spo2_percentage": 98}
            ],
            "attach_assessments": None,
            "overall_result": {"urgent_readings": [], "warning_readings": []},
            "summarize_metric_stats": {"BLOOD_OXYGEN": {"count": 1}},
            "fetch_previous_report": None,
            "generate_narrative": "===HPI===\nGrounded explanation\n===SUMMARY===\nSummary",
            "build_report_pdf": b"%PDF-saved",
            "build_report_data": {"narrative": {}},
        }
        self.mocks = {}
        for name, value in mocks.items():
            patcher = patch.object(reports, name, return_value=value)
            self.mocks[name] = patcher.start()
            self.addCleanup(patcher.stop)

    def test_existing_report_contract_routes_remain(self):
        paths = self.client.get("/openapi.json").json()["paths"]
        for route in (
            "/reports/generate",
            "/reports/history",
            "/reports/{report_id}/preview",
            "/reports/{report_id}/download",
        ):
            self.assertIn("get", paths[route])
        self.assertNotIn("/reports", paths)

    def test_no_ai_report_uses_existing_blob_and_preview_storage(self):
        response = self.client.get(
            "/reports/generate?days=7&include_ai=false&ai_consent=false"
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.content, b"%PDF-saved")
        self.assertEqual(response.headers["x-report-id"], "23")
        self.mocks["generate_narrative"].assert_not_called()
        insert = next(
            call
            for call in self.cursor.execute.call_args_list
            if "INSERT INTO ClinicalReports" in call.args[0]
        )
        self.assertIn("pdf_data, report_data", insert.args[0])
        self.assertEqual(insert.args[1][-2], b"%PDF-saved")
        self.assertEqual(json.loads(insert.args[1][5])["ai_status"], "not_requested")
        self.conn.commit.assert_called_once()

    def test_new_ai_client_requires_consent_before_db_or_model(self):
        response = self.client.get("/reports/generate?days=30&include_ai=true")
        self.assertEqual(response.status_code, 422)
        self.mocks["get_db_connection"].assert_not_called()
        self.mocks["generate_narrative"].assert_not_called()

    def test_ai_consent_excludes_account_identity(self):
        response = self.client.get(
            "/reports/generate?days=90&include_ai=true&ai_consent=true"
        )
        self.assertEqual(response.status_code, 200)
        context = self.mocks["generate_narrative"].call_args.args[1]
        self.assertNotIn("PRIVATE_NAME", json.dumps(context))
        self.assertNotIn("profile_id", json.dumps(context))
        self.assertEqual(context["patient"], {"age": 35, "sex": "Other"})

    def test_legacy_callers_keep_existing_generation_contract(self):
        response = self.client.get("/reports/generate?days=7")
        self.assertEqual(response.status_code, 200)
        self.mocks["generate_narrative"].assert_called_once()

    def test_period_validation_and_duplicate_generation(self):
        self.assertEqual(self.client.get("/reports/generate?days=8").status_code, 422)
        self.assertEqual(
            self.client.get("/reports/generate?days=7&include_ai=false").status_code,
            200,
        )
        self.assertEqual(
            self.client.get("/reports/generate?days=7&include_ai=false").status_code,
            429,
        )

    def test_failure_releases_cooldown_and_sanitizes_error(self):
        self.mocks["build_report_pdf"].side_effect = RuntimeError(
            "private health content"
        )
        response = self.client.get("/reports/generate?days=7&include_ai=false")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private health", response.text)
        self.assertNotIn(7, reports._last_generated)
        self.conn.commit.assert_not_called()

    def test_uncertain_commit_keeps_cooldown(self):
        self.conn.commit.side_effect = RuntimeError("unknown outcome")
        self.assertEqual(
            self.client.get("/reports/generate?days=7&include_ai=false").status_code,
            503,
        )
        self.assertEqual(
            self.client.get("/reports/generate?days=7&include_ai=false").status_code,
            429,
        )

    def test_missing_database_does_not_reserve_cooldown(self):
        self.mocks["get_db_connection"].return_value = None
        self.assertEqual(
            self.client.get("/reports/generate?days=7&include_ai=false").status_code,
            503,
        )
        self.assertNotIn(7, reports._last_generated)

    def test_history_reads_existing_flags_and_names(self):
        self.cursor.fetchall.return_value = [
            (
                23,
                "7-Day Health Report",
                "2026-11-01",
                "2026-11-08",
                5,
                "2026-11-08",
                1,
                1,
            )
        ]
        row = self.client.get("/reports/history").json()["reports"][0]
        self.assertEqual(row["report_title"], "7-Day Health Report")
        self.assertTrue(row["downloadable"])
        self.assertTrue(row["previewable"])
        self.assertEqual(self.cursor.execute.call_args.args[1], (7,))

    def test_download_and_preview_require_ownership(self):
        self.cursor.fetchone.return_value = (
            8,
            "private",
            "2026-11-08",
            b"%PDF-private",
        )
        self.assertEqual(self.client.get("/reports/23/download").status_code, 404)
        self.cursor.fetchone.return_value = (8, '{"private": true}')
        self.assertEqual(self.client.get("/reports/23/preview").status_code, 404)
        self.cursor.fetchone.return_value = (7, "report", "2026-11-08", b"%PDF-saved")
        self.assertEqual(self.client.get("/reports/23/download").content, b"%PDF-saved")
        self.cursor.fetchone.return_value = (7, '{"narrative": {}}')
        self.assertEqual(
            self.client.get("/reports/23/preview").json(), {"narrative": {}}
        )

    def test_old_reports_without_bytes_or_preview_are_explained(self):
        self.cursor.fetchone.return_value = (7, "report", "2026-11-08", None)
        self.assertEqual(self.client.get("/reports/23/download").status_code, 410)
        self.cursor.fetchone.return_value = (7, None)
        self.assertEqual(self.client.get("/reports/23/preview").status_code, 410)

    def test_capabilities_and_unauthenticated_access(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test"}):
            self.assertEqual(
                self.client.get("/reports/capabilities").json(),
                {
                    "optional_ai": True,
                    "ai_available": True,
                    "ai_provider": "Google Gemini",
                },
            )
        app.dependency_overrides.clear()
        for route in (
            "/reports/history",
            "/reports/23/download",
            "/reports/23/preview",
            "/reports/capabilities",
        ):
            self.assertEqual(self.client.get(route).status_code, 401)

    def test_model_error_never_leaks_provider_details(self):
        with patch(
            "backend.llm.call_model_with_fallbacks",
            side_effect=RuntimeError("private-provider-error"),
        ):
            value = report_generator.generate_narrative("instructions", {})
        self.assertNotIn("private-provider-error", value)
        self.assertIn("unavailable", value)
