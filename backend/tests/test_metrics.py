"""Exercise real metrics routes/classifier with an isolated SQLite SQL adapter.

Threshold boundaries come from the repository seed, not a second hand-written
clinical policy. These tests never connect to the deployed MySQL database.
"""
import os
import re
import sqlite3
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("jwt_secret_key", "isolated-metrics-test-key-not-for-production")
from fastapi.testclient import TestClient
from backend.app import app
from backend.routers import metrics
from backend.security import get_current_user


class CursorAdapter:
    def __init__(self, owner):
        self.owner = owner
        self.cursor = owner.database.cursor()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.cursor.close()

    def execute(self, sql, values=()):
        if sql.startswith("SET time_zone"):
            return None
        if "ClinicalThresholds" in sql and self.owner.fail_threshold_lookup:
            raise RuntimeError("Simulated threshold lookup failure")
        return self.cursor.execute(sql.replace("%s", "?"), values)

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    @property
    def lastrowid(self):
        return self.cursor.lastrowid


class ConnectionAdapter:
    def __init__(self):
        self.database = sqlite3.connect(":memory:", check_same_thread=False)
        self.fail_threshold_lookup = False
        self.rollbacks = 0
        self.database.execute("CREATE TABLE BloodPressure (log_id INTEGER PRIMARY KEY, user_id INT, systolic_mmhg INT, diastolic_mmhg INT, logged_at TEXT)")
        self.database.execute("CREATE TABLE ClinicalThresholds (metric_type TEXT, sub_metric TEXT, classification TEXT, min_value REAL, max_value REAL, alert_state TEXT, alert_message TEXT)")
        seed = Path(__file__).resolve().parents[2] / "database/seed_clinical_thresholds.sql"
        pattern = r"\('BLOOD_PRESSURE', '(SYSTOLIC|DIASTOLIC)', '([^']+)', (-?[\d.]+), (-?[\d.]+), '([^']+)', '([^']*)'\)"
        rows = re.findall(pattern, seed.read_text())
        if len(rows) != 9:
            raise AssertionError("Update the test adapter to load the changed BP seed format")
        self.database.executemany("INSERT INTO ClinicalThresholds VALUES (?,?,?,?,?,?,?)", [
            ("BLOOD_PRESSURE", sub, label, float(lo), float(hi), alert, message)
            for sub, label, lo, hi, alert, message in rows
        ])
        self.database.commit()

    def cursor(self):
        return CursorAdapter(self)

    def commit(self):
        self.database.commit()

    def rollback(self):
        self.rollbacks += 1
        self.database.rollback()

    def close(self):
        # Routes release their logical connection; retain the test database
        # until tearDown so POST persistence/rollback can be asserted.
        pass


class MetricTests(unittest.TestCase):
    def setUp(self):
        self.connection = ConnectionAdapter()
        self.patch = patch.object(metrics, "get_db_connection", return_value=self.connection)
        self.patch.start()
        self.previous_overrides = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        self.client = TestClient(app)
        self.addCleanup(self.connection.database.close)
        self.addCleanup(self.patch.stop)
        self.addCleanup(self.client.close)
        self.addCleanup(self.restore_overrides)

    def restore_overrides(self):
        app.dependency_overrides.clear()
        app.dependency_overrides.update(self.previous_overrides)

    def post_reading(self, systolic=116, diastolic=75, **extra):
        return self.client.post("/metrics", json={
            "metric_type": "BLOOD_PRESSURE", "systolic_mmhg": systolic,
            "diastolic_mmhg": diastolic, **extra,
        })

    def history(self):
        return self.client.get("/metrics?metric_type=BLOOD_PRESSURE")

    def assert_unclassified(self, response, missing):
        self.assertEqual(response.status_code, 201, response.text)
        result = response.json()["classification"]
        self.assertEqual(result["status"], "unclassified")
        self.assertIsNone(result["overall"])
        self.assertEqual(result["unclassified_components"], missing)
        stored = self.history().json()["records"][0]["classification"]
        self.assertEqual(stored, result)
        return result

    def test_seed_boundaries_and_worse_component_on_post_and_read(self):
        cases = [
            (119, 79, "Normal Blood Pressure"), (120, 79, "Elevated Blood Pressure"),
            (129, 79, "Elevated Blood Pressure"), (130, 79, "Stage 1 Hypertension"),
            (139, 79, "Stage 1 Hypertension"), (140, 79, "Stage 2 Hypertension"),
            (180, 79, "Stage 2 Hypertension"), (181, 79, "Hypertensive Crisis"),
            (116, 80, "Stage 1 Hypertension"), (116, 89, "Stage 1 Hypertension"),
            (116, 90, "Stage 2 Hypertension"), (116, 120, "Stage 2 Hypertension"),
            (116, 121, "Hypertensive Crisis"), (182, 124, "Hypertensive Crisis"),
            (150, 85, "Stage 2 Hypertension"), (125, 95, "Stage 2 Hypertension"),
        ]
        expected = {}
        for systolic, diastolic, label in cases:
            with self.subTest(systolic=systolic, diastolic=diastolic):
                response = self.post_reading(systolic, diastolic)
                self.assertEqual(response.status_code, 201, response.text)
                result = response.json()
                self.assertEqual(result["classification"]["overall"]["classification"], label)
                self.assertEqual(result["classification"]["status"], "classified")
                expected[result["log_id"]] = result["classification"]
        records = self.history().json()["records"]
        self.assertEqual(len(records), len(cases))
        for record in records:
            self.assertEqual(record["classification"], expected[record["log_id"]])

    def test_outside_seed_range_is_not_reported_as_normal(self):
        result = self.assert_unclassified(self.post_reading(100000, 75), ["systolic"])
        self.assertIsNone(result["systolic"])
        self.assertEqual(result["diastolic"]["classification"], "Normal Blood Pressure")

    def test_missing_threshold_is_explicit_and_preserves_raw_reading(self):
        self.connection.database.execute("DELETE FROM ClinicalThresholds WHERE sub_metric='SYSTOLIC' AND classification='Hypertensive Crisis'")
        self.connection.commit()
        self.assert_unclassified(self.post_reading(182, 75), ["systolic"])
        self.assertEqual(self.history().json()["records"][0]["systolic_mmhg"], 182)

    def test_unrecognized_tier_is_not_ranked_below_normal(self):
        self.connection.database.execute("UPDATE ClinicalThresholds SET classification='Unrecognized tier' WHERE sub_metric='DIASTOLIC' AND classification='Stage 2 Hypertension'")
        self.connection.commit()
        self.assert_unclassified(self.post_reading(116, 95), ["diastolic"])

    def test_no_thresholds_is_explicitly_unclassified(self):
        self.connection.database.execute("DELETE FROM ClinicalThresholds")
        self.connection.commit()
        self.assert_unclassified(self.post_reading(), ["systolic", "diastolic"])

    def test_known_high_component_is_preserved_if_other_component_is_unknown(self):
        result = self.assert_unclassified(self.post_reading(182, 100000), ["diastolic"])
        self.assertEqual(result["systolic"]["classification"], "Hypertensive Crisis")

    def test_authentication_validation_and_cross_account_isolation(self):
        del app.dependency_overrides[get_current_user]
        self.assertEqual(self.post_reading().status_code, 401)
        self.assertEqual(self.history().status_code, 401)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        self.assertEqual(self.post_reading(user_id=999).status_code, 201)
        self.assertEqual(self.post_reading(diastolic=None).status_code, 400)
        self.assertEqual(self.post_reading(systolic=0).status_code, 422)
        self.assertEqual(self.client.post("/metrics", json={"metric_type": "SLEEP"}).status_code, 400)
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=999)
        self.assertEqual(self.history().json()["records"], [])

    def test_recorded_at_is_normalized_to_explicit_utc_on_save_and_read(self):
        response = self.post_reading(recorded_at="2026-10-17T03:15:00-05:00")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["recorded_at"].replace("Z", "+00:00"), "2026-10-17T08:15:00+00:00")
        record = self.history().json()["records"][0]
        self.assertEqual(record["recorded_at"].replace("Z", "+00:00"), "2026-10-17T08:15:00+00:00")
        default = self.post_reading().json()["recorded_at"]
        self.assertTrue(default.endswith("Z") or default.endswith("+00:00"))

    def test_classifier_database_failure_rolls_back_insert(self):
        self.connection.fail_threshold_lookup = True
        self.assertEqual(self.post_reading().status_code, 500)
        self.assertEqual(self.connection.rollbacks, 1)
        self.assertEqual(self.connection.database.execute("SELECT COUNT(*) FROM BloodPressure").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
