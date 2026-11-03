"""The doctor route must check role and current patient permission."""
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("jwt_secret_key", "isolated-portal-test-key")
from fastapi.testclient import TestClient
from backend.app import app
from backend.models.User import User, UserRole
from backend.security import get_current_user


class FakeCursor:
    def __init__(self, allowed=True, verification="APPROVED"):
        self.allowed = allowed
        self.verification = verification
        self.query = ""
        self.values = ()

    def __enter__(self): return self
    def __exit__(self, *args): pass
    def execute(self, query, values=()):
        self.query, self.values = query, values
    def fetchone(self):
        if "SELECT verification_status FROM Providers" in self.query:
            return (self.verification,)
        if "SELECT profile_id FROM UserHealthProfiles" in self.query:
            return (5,)
        if "SELECT p.provider_id FROM Providers p JOIN Users u" in self.query:
            return (17,)
        if "FROM Providers WHERE user_id" in self.query:
            return (17, self.verification)
        if "FROM PatientProviderAssignments a" in self.query:
            return (7, "Pat", "Example", "1990-01-01") if self.allowed and self.values == (17, 7) else None
        return None
    def fetchall(self):
        if "FROM BloodPressure" in self.query:
            return [(1, 120, 80, "2026-01-01 12:00:00")]
        return []


class FakeConnection:
    def __init__(self, allowed=True, verification="APPROVED"): self.fake_cursor = FakeCursor(allowed, verification)
    def cursor(self): return self.fake_cursor
    def commit(self): pass
    def rollback(self): pass
    def close(self): pass


class PortalTests(unittest.TestCase):
    def setUp(self):
        self.user = User("Doc", "Example", "doctor@example.com", "", UserRole.PROVIDER, 9)
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_approved_provider_can_read_patient_metric(self):
        with patch("backend.routers.portal.get_db_connection", return_value=FakeConnection()):
            response = self.client.get("/portal/patients/7/metrics?metric_type=BLOOD_PRESSURE")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["records"][0]["systolic_mmhg"], 120)
        self.assertEqual(response.headers.get("Cache-Control"), "no-store")

    def test_revoked_provider_cannot_read_patient_metric(self):
        with patch("backend.routers.portal.get_db_connection", return_value=FakeConnection(False)):
            response = self.client.get("/portal/patients/7/metrics?metric_type=BLOOD_PRESSURE")
        self.assertEqual(response.status_code, 404)

    def test_patient_role_cannot_read_doctor_route(self):
        self.user.role = UserRole.PATIENT
        response = self.client.get("/portal/patients/7/metrics?metric_type=BLOOD_PRESSURE")
        self.assertEqual(response.status_code, 403)

    def test_other_patient_id_denied(self):
        with patch("backend.routers.portal.get_db_connection", return_value=FakeConnection()):
            response = self.client.get("/portal/patients/8/metrics?metric_type=BLOOD_PRESSURE")
        self.assertEqual(response.status_code, 404)

    def test_pending_provider_cannot_read_patient_metric(self):
        with patch("backend.routers.portal.get_db_connection", return_value=FakeConnection(verification="PENDING")):
            response = self.client.get("/portal/patients/7/metrics?metric_type=BLOOD_PRESSURE")
        self.assertEqual(response.status_code, 403)

    def test_patient_can_grant_provider(self):
        self.user.role = UserRole.PATIENT
        with patch("backend.routers.portal.get_db_connection", return_value=FakeConnection()):
            response = self.client.put("/portal/my-providers/17")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ACTIVE")

    def test_provider_cannot_grant_access_for_patient(self):
        response = self.client.put("/portal/my-providers/17")
        self.assertEqual(response.status_code, 403)
