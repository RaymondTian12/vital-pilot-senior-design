import os
import unittest
from unittest.mock import MagicMock, patch

os.environ.setdefault("jwt_secret_key", "isolated-provider-registration-test-key")
from fastapi.testclient import TestClient
from backend.app import app


PAYLOAD = {
    "firstname": "Morgan", "lastname": "Example", "email": "morgan@example.test",
    "password": "a-long-test-password", "npi": "1234567890", "specialty": "Primary care",
    "license_state": "TX", "license_number": "TEST-123",
}


class ProviderRegistrationTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_registration_creates_pending_provider_without_session(self):
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.lastrowid = 44
        with patch("backend.routers.auth.get_db_connection", return_value=conn):
            response = self.client.post("/auth/register-provider", json=PAYLOAD)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "PENDING")
        self.assertNotIn("access_token", response.json())
        self.assertIn("'provider'", cursor.execute.call_args_list[0].args[0])
        self.assertIn("'PENDING'", cursor.execute.call_args_list[1].args[0])
        conn.commit.assert_called_once()

    def test_invalid_npi_is_rejected_before_database_access(self):
        with patch("backend.routers.auth.get_db_connection") as db:
            response = self.client.post("/auth/register-provider", json={**PAYLOAD, "npi": "bad"})
        self.assertEqual(response.status_code, 422)
        db.assert_not_called()
