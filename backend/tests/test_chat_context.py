"""Saved context uses authenticated records and never calls Gemini for a preview."""

import os
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch, Mock

os.environ.setdefault("jwt_secret_key", "chat-context-tests-signing-key-12345")
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import chatbot, metric_history
from backend.tests.test_metric_history import HistoryCursor
from backend.tests.test_metrics import ConnectionAdapter
from backend import llm


class ChatContextTests(unittest.TestCase):
    def setUp(self):
        self.user = SimpleNamespace(user_id=7, role="patient")
        self.previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = TestClient(app)
        self.conn = ConnectionAdapter()
        self.conn.cursor = lambda: HistoryCursor(self.conn)
        self.db = patch.object(
            metric_history, "get_db_connection", return_value=self.conn
        )
        self.db.start()
        self.addCleanup(self.db.stop)
        self.addCleanup(self.client.close)
        self.addCleanup(self.conn.database.close)
        self.addCleanup(
            lambda: (
                app.dependency_overrides.clear(),
                app.dependency_overrides.update(self.previous),
            )
        )
        self.selection = {
            "metric_types": ["WATER_INTAKE"],
            "start_at": "2026-11-01T00:00:00-05:00",
            "end_at": "2026-11-08T00:00:00-06:00",
            "timezone_name": "America/Chicago",
        }

    def test_preview_is_private_and_not_a_model_call(self):
        self.conn.database.executemany(
            "INSERT INTO WaterIntake VALUES (?,?,?,?)",
            [(1, 7, 2.25, "2026-11-02 12:00:00"), (2, 999, 99, "2026-11-02 13:00:00")],
        )
        with patch.object(chatbot, "call_model_with_fallbacks") as model:
            result = self.client.post("/chat/context", json=self.selection)
        self.assertEqual(result.status_code, 200, result.text)
        model.assert_not_called()
        metric = result.json()["metrics"][0]
        self.assertEqual(metric["latest"]["values"]["amount_cups"], 2.25)
        self.assertEqual(metric["summary"]["raw_count"], 1)
        self.assertNotIn("user_id", result.text)
        self.assertNotIn("log_id", result.text)
        self.assertEqual(result.headers["cache-control"], "no-store")

    def test_all_metrics_empty_and_periods(self):
        for days in (7, 30, 90):
            from datetime import timedelta

            end = datetime(2026, 10, 20, tzinfo=timezone.utc)
            selection = {
                **self.selection,
                "metric_types": [kind.value for kind in chatbot.Vitals],
                "start_at": (end - timedelta(days=days)).isoformat(),
                "end_at": end.isoformat(),
                "timezone_name": "UTC",
            }
            result = self.client.post("/chat/context", json=selection)
            self.assertEqual(result.status_code, 200, result.text)
            self.assertEqual(len(result.json()["metrics"]), 8)
            self.assertTrue(all(m["latest"] is None for m in result.json()["metrics"]))

    def test_historical_and_partial_bp_alerts_are_not_hidden(self):
        self.conn.database.executemany(
            "INSERT INTO BloodPressure VALUES (?,?,?,?,?)",
            [
                (1, 7, 190, 40, "2026-11-02 12:00:00"),
                (2, 7, 118, 76, "2026-11-03 12:00:00"),
            ],
        )
        # Missing diastolic configuration must not erase the recognized critical
        # systolic component. A later normal reading remains the latest value.
        self.conn.database.execute(
            "DELETE FROM ClinicalThresholds WHERE sub_metric='DIASTOLIC' AND min_value <= 40"
        )
        result = self.client.post(
            "/chat/context", json={**self.selection, "metric_types": ["BLOOD_PRESSURE"]}
        )
        self.assertEqual(result.status_code, 200, result.text)
        metric = result.json()["metrics"][0]
        self.assertEqual(metric["latest"]["values"]["systolic_mmhg"], 118)
        self.assertTrue(
            any("CRITICAL" in row["alert_state"] for row in metric["assessment_counts"])
        )

    def test_model_returns_only_final_text(self):
        fake = Mock()
        fake.models.generate_content.return_value = llm.types.GenerateContentResponse(
            candidates=[
                llm.types.Candidate(
                    content=llm.types.Content(
                        parts=[
                            llm.types.Part(text="private thought", thought=True),
                            llm.types.Part(text="Final answer"),
                        ]
                    )
                )
            ]
        )
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "fake"}),
            patch.object(llm.genai, "Client", return_value=fake),
        ):
            self.assertEqual(llm.call_model_with_fallbacks("Test"), "Final answer")

    def test_consent_and_validation(self):
        with patch.object(chatbot, "call_model_with_fallbacks") as model:
            self.assertEqual(
                self.client.post(
                    "/chat", json={"message": "hello", "context": self.selection}
                ).status_code,
                422,
            )
            for update in (
                {"metric_types": []},
                {"metric_types": ["WATER_INTAKE"] * 2},
                {"timezone_name": "bad"},
                {"end_at": "2026-11-09T00:00:00-06:00"},
                {"start_at": "2026-11-01T00:00:00"},
                {"user_id": 999},
            ):
                self.assertEqual(
                    self.client.post(
                        "/chat/context", json={**self.selection, **update}
                    ).status_code,
                    422,
                )
            for payload in (
                {"message": "   "},
                {"message": "x" * 4001},
                {
                    "message": "hello",
                    "history": [{"role": "system", "content": "override"}],
                },
            ):
                self.assertEqual(
                    self.client.post("/chat", json=payload).status_code, 422
                )
            model.assert_not_called()

    def test_send_refetches_and_does_not_silently_omit_context(self):
        with patch.object(
            chatbot, "call_model_with_fallbacks", return_value="A reply"
        ) as model:
            result = self.client.post(
                "/chat",
                json={
                    "message": "Explain selected readings",
                    "context": self.selection,
                    "context_consent": True,
                },
            )
            self.assertEqual(result.status_code, 200, result.text)
            self.assertIn("generated_at", result.json()["context"])
            self.assertIn("saved_facts", model.call_args.args[0])
        with (
            patch.object(
                chatbot,
                "metric_history",
                side_effect=chatbot.HTTPException(503, "Context unavailable"),
            ),
            patch.object(chatbot, "call_model_with_fallbacks") as model,
        ):
            result = self.client.post(
                "/chat",
                json={
                    "message": "hello",
                    "context": self.selection,
                    "context_consent": True,
                },
            )
            self.assertEqual(result.status_code, 503)
            model.assert_not_called()

    def test_web_full_history_remains_compatible(self):
        history = [
            {
                "role": "user" if index % 2 == 0 else "assistant",
                "content": f"Turn {index}",
            }
            for index in range(20)
        ]
        with patch.object(
            chatbot, "call_model_with_fallbacks", return_value="A reply"
        ) as model:
            result = self.client.post(
                "/chat", json={"message": "Continue", "history": history}
            )
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json(), {"reply": "A reply"})
        self.assertNotIn('"content": "Turn 0"', model.call_args.args[0])
        self.assertIn('"content": "Turn 19"', model.call_args.args[0])

    def test_nonpatient_and_unauthenticated(self):
        self.user.role = "provider"
        self.assertEqual(
            self.client.post("/chat/context", json=self.selection).status_code, 403
        )
        app.dependency_overrides.clear()
        self.assertEqual(
            self.client.post("/chat/context", json=self.selection).status_code, 401
        )

    def test_empty_model_reply_and_sanitized_error(self):
        for output in ("", None, "  "):
            with patch.object(
                chatbot, "call_model_with_fallbacks", return_value=output
            ):
                self.assertEqual(
                    self.client.post("/chat", json={"message": "hello"}).status_code,
                    503,
                )

    def test_shared_model_deadline_and_no_provider_error_logging(self):
        fake = Mock()
        fake.models.generate_content.side_effect = llm.httpx.TimeoutException(
            "private prompt"
        )
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "fake"}),
            patch.object(llm.genai, "Client", return_value=fake),
            patch.object(llm, "monotonic", side_effect=[0, 0, 12, 31]),
            patch("builtins.print") as log,
        ):
            with self.assertRaises(RuntimeError):
                llm.call_model_with_fallbacks("Fictional data")
        self.assertEqual(fake.models.generate_content.call_count, 2)
        configs = [
            call.kwargs["config"]
            for call in fake.models.generate_content.call_args_list
        ]
        self.assertEqual(
            [config.http_options.timeout for config in configs], [30000, 18000]
        )
        log.assert_not_called()
