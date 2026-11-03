"""Admin review requires the admin role and an auditable, pending decision."""
import os
import unittest
from unittest.mock import MagicMock, patch

os.environ.setdefault("jwt_secret_key", "isolated-admin-test-key")
from fastapi.testclient import TestClient
from backend.app import app
from backend.models.User import User, UserRole
from backend.security import get_current_user
from backend.security import create_access_token


class FakeCursor:
    def __init__(self, status="PENDING", row=None, rows=None):
        self.status = status
        self.row = row
        self.rows = rows
        self.queries = []

    def __enter__(self): return self
    def __exit__(self, *args): pass
    def execute(self, query, values=()): self.queries.append((query, values))
    def fetchone(self): return self.row if self.row is not None else (self.status,)
    def fetchall(self):
        if self.rows is not None: return self.rows
        return [(7, "Doc", "Example", "doc@example.com", "1234567890", "Cardiology", "TX", "ABC", "PENDING", "2026-11-02")]


class FakeConnection:
    def __init__(self, status="PENDING", row=None, rows=None):
        self.fake_cursor = FakeCursor(status, row, rows)
        self.committed = False
        self.rolled_back = False
    def cursor(self): return self.fake_cursor
    def commit(self): self.committed = True
    def rollback(self): self.rolled_back = True
    def close(self): pass


class AdminTests(unittest.TestCase):
    def setUp(self):
        self.user = User("Admin", "Example", "admin@example.com", "", UserRole.ADMIN, 3)
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = TestClient(app)

    def tearDown(self): app.dependency_overrides.clear()

    def test_only_admin_can_list_and_review(self):
        self.user.role = UserRole.PROVIDER
        self.assertEqual(self.client.get("/admin/providers").status_code, 403)
        self.assertEqual(self.client.post("/admin/providers/7/review", json={"decision": "REJECTED", "note": "Invalid license"}).status_code, 403)

    def test_admin_lists_pending_applications(self):
        conn = FakeConnection()
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            response = self.client.get("/admin/providers")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["providers"][0]["npi"], "1234567890")
        self.assertEqual(response.headers.get("Cache-Control"), "no-store")

    def test_approval_requires_verification_and_records_review(self):
        conn = FakeConnection()
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            self.assertEqual(self.client.post("/admin/providers/7/review", json={"decision": "APPROVED", "note": "Checked license"}).status_code, 422)
            response = self.client.post("/admin/providers/7/review", json={"decision": "APPROVED", "note": "Checked license", "identity_and_license_verified": True})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(conn.committed)
        self.assertTrue(any("INSERT INTO ProviderReviews" in q for q, _ in conn.fake_cursor.queries))

    def test_review_cannot_be_repeated(self):
        conn = FakeConnection("APPROVED")
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            response = self.client.post("/admin/providers/7/review", json={"decision": "REJECTED", "note": "Duplicate review"})
        self.assertEqual(response.status_code, 409)
        self.assertFalse(conn.committed)

    def test_rejected_doctor_can_be_approved_after_new_verification(self):
        conn = FakeConnection("REJECTED")
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            denied = self.client.post("/admin/providers/7/review", json={"decision": "APPROVED", "note": "Rechecked license"})
            approved = self.client.post("/admin/providers/7/review", json={"decision": "APPROVED", "note": "Rechecked license", "identity_and_license_verified": True})
        self.assertEqual(denied.status_code, 422)
        self.assertEqual(approved.status_code, 200)
        self.assertTrue(conn.committed)
        self.assertTrue(any("ProviderReviews" in q and values[2] == "APPROVED" for q, values in conn.fake_cursor.queries if values))

    def test_removal_revokes_patient_grants_and_needs_confirmation(self):
        conn = FakeConnection("APPROVED")
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            denied = self.client.post("/admin/providers/7/review", json={"decision": "REMOVED", "note": "License expired"})
            removed = self.client.post("/admin/providers/7/review", json={"decision": "REMOVED", "note": "License expired", "confirm_revoke_patient_access": True})
        self.assertEqual(denied.status_code, 422)
        self.assertEqual(removed.status_code, 200)
        self.assertTrue(conn.committed)
        self.assertTrue(any("UPDATE PatientProviderAssignments" in q and "REVOKED" in q for q, _ in conn.fake_cursor.queries))
        self.assertTrue(any("ProviderReviews" in q and values[2] == "REMOVED" for q, values in conn.fake_cursor.queries if values))

    def test_reapproval_after_removal_does_not_restore_old_grants(self):
        conn = FakeConnection("REMOVED")
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            response = self.client.post("/admin/providers/7/review", json={"decision": "APPROVED", "note": "Rechecked credentials", "identity_and_license_verified": True})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(any("PatientProviderAssignments" in q for q, _ in conn.fake_cursor.queries))

    def test_only_admin_can_issue_and_revoke_invitation(self):
        payload = {"first_name": "New", "last_name": "Admin", "email": "new@example.invalid"}
        self.user.role = UserRole.PATIENT
        self.assertEqual(self.client.post("/admin/invitations", json=payload).status_code, 403)
        self.user.role = UserRole.ADMIN
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.side_effect = [None, None]
        cursor.lastrowid = 12
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            issued = self.client.post("/admin/invitations", json=payload)
        self.assertEqual(issued.status_code, 201)
        self.assertGreaterEqual(len(issued.json()["code"]), 40)
        self.assertNotIn(issued.json()["code"], str(cursor.execute.call_args_list))
        conn.commit.assert_called_once()

        cursor.rowcount = 1
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            revoked = self.client.post("/admin/invitations/12/revoke")
        self.assertEqual(revoked.status_code, 200)

    def test_invitation_acceptance_creates_separate_admin_and_is_one_time(self):
        app.dependency_overrides.clear()
        payload = {"email": "new@example.invalid", "code": "example-test-code-that-is-long-enough", "password": "long-private-password-123"}
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = (12, "New", "Admin")
        with patch("backend.routers.auth.get_db_connection", return_value=conn):
            accepted = self.client.post("/auth/accept-admin-invite", json=payload)
        self.assertEqual(accepted.status_code, 201)
        self.assertTrue(any("INSERT INTO Users" in call.args[0] and "'admin'" in call.args[0] for call in cursor.execute.call_args_list))
        self.assertTrue(any("used_at" in call.args[0] for call in cursor.execute.call_args_list))
        conn.commit.assert_called_once()
        cursor.fetchone.return_value = None
        with patch("backend.routers.auth.get_db_connection", return_value=conn):
            replay = self.client.post("/auth/accept-admin-invite", json=payload)
        self.assertEqual(replay.status_code, 400)

    def test_account_directory_does_not_return_health_records(self):
        conn = FakeConnection(rows=[(9, "Pat", "Example", "pat@example.com", "patient", "2026-11-02", 1)])
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            response = self.client.get("/admin/accounts?search=pat&role=patient")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["accounts"][0]["email"], "pat@example.com")
        query = conn.fake_cursor.queries[0][0]
        self.assertNotIn("UserHealthProfiles", query)
        self.assertNotIn("password_hash", query)

    def test_suspension_is_audited_and_admins_cannot_be_suspended(self):
        conn = FakeConnection(row=("patient", 1))
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            response = self.client.post("/admin/accounts/9/status", json={"active": False, "reason": "Requested by support"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(conn.committed)
        self.assertTrue(any("AdminAccountActions" in q for q, _ in conn.fake_cursor.queries))

        admin_conn = FakeConnection(row=("admin", 1))
        with patch("backend.routers.admin.get_db_connection", return_value=admin_conn):
            response = self.client.post("/admin/accounts/10/status", json={"active": False, "reason": "Requested by support"})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(admin_conn.committed)

    def test_only_admin_can_edit_public_welcome_copy(self):
        self.user.role = UserRole.PATIENT
        self.assertEqual(self.client.put("/admin/welcome-slides/1", json={"eyebrow": "Hello", "title": "Welcome", "description": "Description"}).status_code, 403)
        self.user.role = UserRole.ADMIN
        conn = FakeConnection()
        with patch("backend.routers.admin.get_db_connection", return_value=conn):
            response = self.client.put("/admin/welcome-slides/1", json={"eyebrow": "Hello", "title": "Welcome", "description": "Description"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(conn.committed)

    def test_suspended_account_cannot_sign_in_or_use_existing_token(self):
        app.dependency_overrides.clear()
        suspended = User("Pat", "Example", "pat@example.com", "hash", UserRole.PATIENT, 9, is_active=False)
        with patch.object(User, "get_user_by_email", return_value=suspended):
            response = self.client.post("/auth/login", json={"email": "pat@example.com", "password": "anything"})
            self.assertEqual(response.status_code, 403)
            response = self.client.get("/auth/me", headers={"Authorization": f"Bearer {create_access_token(suspended.email)}"})
            self.assertEqual(response.status_code, 403)


if __name__ == "__main__": unittest.main()
