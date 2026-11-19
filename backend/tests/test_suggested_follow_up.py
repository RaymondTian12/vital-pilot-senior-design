"""Follow-up policy and response parity using isolated patient records."""

import copy
import unittest
from unittest.mock import patch

from backend.suggested_follow_up import attach_follow_up, suggested_follow_up
from backend.tests import test_metric_assessments as assessment_tests
from backend.tests.test_metric_history import HistoryCursor
from backend.routers import metric_history


class FollowUpPolicyTests(unittest.TestCase):
    def test_all_health_metrics_use_primary_care_and_existing_alternatives(self):
        for kind in (
            "BLOOD_GLUCOSE",
            "BLOOD_OXYGEN",
            "BODY_MASS_INDEX",
            "PEAK_FLOW_RATE",
        ):
            for action in ("none", "review", "urgent"):
                with self.subTest(kind=kind, action=action):
                    assessment = {
                        "status": "classified",
                        "category": "health",
                        "next_action": action,
                    }
                    result = suggested_follow_up(kind, assessment)
                    if action == "none":
                        self.assertIsNone(result)
                        continue
                    self.assertEqual(result["status"], action)
                    self.assertEqual(result["primary_specialty_group"], "primary_care")
                    self.assertEqual(
                        result["alternative_specialty_groups"],
                        ["pulmonology"] if kind == "PEAK_FLOW_RATE" else [],
                    )
                    if action == "urgent":
                        self.assertIn("Do not wait", result["explanation"])

    def test_habits_never_become_medical_recommendations(self):
        for kind in ("SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"):
            for assessment in (None, {"status": "classified", "next_action": "urgent"}):
                self.assertIsNone(suggested_follow_up(kind, assessment))

    def test_incomplete_assessments_have_no_directory_recommendation(self):
        for kind in (
            "BLOOD_PRESSURE",
            "BLOOD_GLUCOSE",
            "BLOOD_OXYGEN",
            "BODY_MASS_INDEX",
            "PEAK_FLOW_RATE",
        ):
            for status in ("needs_context", "unavailable"):
                with self.subTest(kind=kind, status=status):
                    result = suggested_follow_up(
                        kind, {"status": status, "guidance": "Missing context"}
                    )
                    self.assertEqual(result["status"], "needs_context")
                    self.assertIsNone(result["primary_specialty_group"])
                    self.assertEqual(result["alternative_specialty_groups"], [])

    def test_bp_partial_critical_survives_but_partial_warning_does_not_infer_specialty(
        self,
    ):
        for flag in ("SUCCESS", "WARNING", "CRITICAL"):
            component = {"alert_state": f"LOG_{flag}_AND_BANNER"}
            partial = {
                "status": "unclassified",
                "systolic": component,
                "diastolic": None,
                "overall": None,
            }
            result = suggested_follow_up("BLOOD_PRESSURE", partial)
            self.assertEqual(
                result["status"], "urgent" if flag == "CRITICAL" else "needs_context"
            )
            complete = {
                **partial,
                "status": "classified",
                "overall": component,
                "diastolic": component,
            }
            result = suggested_follow_up("BLOOD_PRESSURE", complete)
            if flag == "SUCCESS":
                self.assertIsNone(result)
            else:
                self.assertEqual(result["alternative_specialty_groups"], ["cardiology"])

    def test_enrichment_does_not_mutate_saved_assessment(self):
        assessment = {
            "status": "classified",
            "category": "health",
            "next_action": "review",
            "context": {"glucose_context": "fasting"},
        }
        before = copy.deepcopy(assessment)
        record = {"metric_type": "BLOOD_GLUCOSE", "classification": assessment}
        attach_follow_up([record])
        self.assertEqual(assessment, before)
        self.assertIn("suggested_follow_up", record)


class FollowUpResponseTests(unittest.TestCase):
    setUp = assessment_tests.AssessmentTests.setUp
    save = assessment_tests.AssessmentTests.save

    def test_save_history_range_and_home_have_identical_follow_up(self):
        self.conn.cursor = lambda: HistoryCursor(self.conn)
        cases = [
            ("BLOOD_PRESSURE", {"systolic_mmhg": 150, "diastolic_mmhg": 95}),
            ("BLOOD_GLUCOSE", {"glucose_mgdl": 126, "glucose_context": "fasting"}),
            ("BLOOD_OXYGEN", {"spo2_percentage": 88}),
            ("BODY_MASS_INDEX", {"weight_lbs": 150}),
            ("PEAK_FLOW_RATE", {"flow_rate_lmin": 300, "peak_personal_best": 500}),
            ("SLEEP", {"duration_hours": 6}),
            ("WATER_INTAKE", {"amount_cups": 3}),
            ("PHYSICAL_ACTIVITY", {"steps_taken": 500}),
        ]
        bounds = {"start_at": "2026-10-20T00:00:00Z", "end_at": "2026-10-21T00:00:00Z"}
        with patch.object(metric_history, "get_db_connection", return_value=self.conn):
            for kind, fields in cases:
                with self.subTest(kind=kind):
                    saved = self.save(
                        kind, recorded_at="2026-10-20T08:00:00Z", **fields
                    )
                    expected = saved["suggested_follow_up"]
                    responses = [
                        self.client.get("/metrics", params={"metric_type": kind}),
                        self.client.get(
                            "/metrics/history", params={"metric_type": kind, **bounds}
                        ),
                        self.client.get(
                            "/daily-summary",
                            params={"today_start": bounds["start_at"], **bounds},
                        ),
                    ]
                    for response in responses:
                        self.assertEqual(response.status_code, 200, response.text)
                        record = next(
                            r
                            for r in response.json()["records"]
                            if r["metric_type"] == kind
                            and r["log_id"] == saved["log_id"]
                        )
                        self.assertEqual(record["suggested_follow_up"], expected)
                        self.assertEqual(
                            record["classification"], saved["classification"]
                        )

    def test_legacy_context_remains_unknown_and_patient_owned(self):
        self.conn.database.execute(
            "INSERT INTO BloodGlucose VALUES (1,7,126,'2026-10-20 08:00:00')"
        )
        self.conn.database.execute(
            "INSERT INTO BloodGlucose VALUES (2,999,126,'2026-10-20 09:00:00')"
        )
        self.conn.commit()
        records = self.client.get("/metrics?metric_type=BLOOD_GLUCOSE").json()[
            "records"
        ]
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["suggested_follow_up"]["status"], "needs_context")
        self.assertIsNone(records[0]["suggested_follow_up"]["primary_specialty_group"])
