"""Admin review requires the admin role and an auditable, pending decision."""
import os
import unittest
from unittest.mock import patch

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
