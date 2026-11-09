"""Full-period chart aggregates against the isolated SQLite route adapter."""

import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("jwt_secret_key", "metric-history-test-signing-key-12345")
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import metric_history
from backend.tests.test_metrics import ConnectionAdapter, CursorAdapter
from backend.metric_history import HistoryAggregate
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


class HistoryCursor(CursorAdapter):
    def fetchmany(self, size):
        return self.cursor.fetchmany(size)


class MetricHistoryTests(unittest.TestCase):
    def setUp(self):
        self.conn = ConnectionAdapter()
        self.conn.cursor = lambda: HistoryCursor(self.conn)
        self.previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        self.client = TestClient(app)
        self.patch = patch.object(
            metric_history, "get_db_connection", return_value=self.conn
        )
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.addCleanup(self.client.close)
        self.addCleanup(self.conn.database.close)
        self.addCleanup(
            lambda: (
                app.dependency_overrides.clear(),
                app.dependency_overrides.update(self.previous),
            )
        )
        self.window = {
            "metric_type": "WATER_INTAKE",
            "start_at": "2026-11-01T00:00:00-05:00",
            "end_at": "2026-11-08T00:00:00-06:00",
            "timezone_name": "America/Chicago",
        }

    def get(self, **params):
        return self.client.get("/metrics/history", params={**self.window, **params})

    def test_latest_habit_snapshot_missing_days_zero_and_account_scope(self):
        self.conn.database.executemany(
            "INSERT INTO WaterIntake VALUES (?,?,?,?)",
            [
                (1, 7, 1, "2026-11-01 06:00:00"),
                (2, 7, 2.25, "2026-11-01 08:00:00"),
                (3, 7, 0, "2026-11-03 07:00:00"),
                (4, 999, 99, "2026-11-03 08:00:00"),
                (5, 7, 8, "2026-11-08 06:00:00"),
            ],
        )
        result = self.get()
        self.assertEqual(result.status_code, 200, result.text)
        data = result.json()
        self.assertEqual(data["summary"]["raw_count"], 3)
        self.assertEqual(data["summary"]["count"], 2)
        self.assertEqual(data["summary"]["values"]["amount_cups"]["avg"], 1.125)
        self.assertEqual(len(data["daily"]), 7)
        self.assertEqual(data["daily"][0]["values"]["amount_cups"]["avg"], 2.25)
        self.assertEqual(data["daily"][1]["values"], {})
        self.assertEqual(data["daily"][2]["values"]["amount_cups"]["avg"], 0)

    def test_pagination_never_changes_full_period_statistics(self):
        self.conn.database.executemany(
            "INSERT INTO BloodGlucose VALUES (?,?,?,?)",
            [(i, 7, 80 + i, "2026-11-03 12:00:00") for i in range(1, 36)],
        )
        first = self.get(metric_type="BLOOD_GLUCOSE").json()
        second = self.get(metric_type="BLOOD_GLUCOSE", offset=20).json()
        self.assertEqual(len(first["records"]), 20)
        self.assertEqual(len(second["records"]), 15)
        self.assertTrue(first["more"])
        self.assertFalse(second["more"])
        self.assertEqual(first["summary"], second["summary"])
        self.assertEqual(first["summary"]["count"], 35)
        self.assertEqual(first["summary"]["values"]["glucose_mgdl"]["avg"], 98)
        self.assertEqual(first["daily"][2]["contexts"]["unknown"]["count"], 35)

    def test_90_days_and_validation(self):
        result = self.get(
            start_at="2026-08-10T00:00:00-05:00", end_at="2026-11-08T00:00:00-06:00"
        )
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(len(result.json()["daily"]), 90)
        for args in (
            {"start_at": "2026-11-01"},
            {"timezone_name": "Bad/Zone"},
            {"start_at": "2020-01-01T00:00:00Z"},
            {"offset": -1},
        ):
            self.assertEqual(self.get(**args).status_code, 422)

    def test_all_eight_metrics_and_blood_pressure_components(self):
        self.conn.database.execute(
            "INSERT INTO BloodPressure VALUES (1,7,130,85,'2026-11-03 12:00:00')"
        )
        for kind in metric_history.METRIC_TABLES:
            result = self.get(metric_type=kind.value)
            self.assertEqual(result.status_code, 200, result.text)
        values = self.get(metric_type="BLOOD_PRESSURE").json()["summary"]["values"]
        self.assertEqual(values["systolic_mmhg"]["avg"], 130)
        self.assertEqual(values["diastolic_mmhg"]["avg"], 85)

    def test_glucose_contexts_and_daylight_saving_dates(self):
        start = datetime.fromisoformat("2026-11-01T00:00:00-05:00")
        end = datetime.fromisoformat("2026-11-03T00:00:00-06:00")
        aggregate = HistoryAggregate(
            "BLOOD_GLUCOSE", start, end, ZoneInfo("America/Chicago")
        )
        for i, (stamp, context, value) in enumerate(
            [
                ("2026-11-01T07:30:00+00:00", "fasting", 90),
                ("2026-11-01T06:30:00+00:00", "nonfasting", 130),
            ]
        ):
            aggregate.add(
                {
                    "log_id": i,
                    "recorded_at": datetime.fromisoformat(stamp),
                    "glucose_mgdl": value,
                    "classification": {"context": {"glucose_context": context}},
                }
            )
        result = aggregate.result()
        self.assertEqual(len(result["daily"]), 2)
        self.assertEqual(
            result["daily"][0]["contexts"]["fasting"]["values"]["glucose_mgdl"]["avg"],
            90,
        )
        self.assertEqual(result["daily"][0]["values"]["glucose_mgdl"]["avg"], 110)
