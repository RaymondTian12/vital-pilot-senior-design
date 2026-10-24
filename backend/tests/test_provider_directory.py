import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
os.environ.setdefault('jwt_secret_key', 'isolated-provider-directory-test')
from fastapi.testclient import TestClient
from backend.app import app
from backend.routers import provider_directory
from backend.security import get_current_user

class ProviderDirectoryTests(unittest.TestCase):
    def test_authentication_required(self):
        self.assertEqual(TestClient(app).get('/care-team').status_code, 401)

    def test_database_results_and_parameterized_specialty(self):
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchall.return_value = [(7, '1234567890', 'Test', 'Provider', 'Cardiology', 'TX', 'Test Clinic', '5550100')]
        previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=1)
        try:
            with patch.object(provider_directory, 'get_db_connection', return_value=conn):
                result = TestClient(app).get('/care-team?specialty=Cardiology')
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()['doctors'][0]['provider_id'], 7)
            self.assertEqual(result.json()['source'], 'vitalpilot_database')
            sql, args = cursor.execute.call_args.args
            self.assertIn('JOIN Users', sql)
            self.assertEqual(args, ('%cardio%', '%cardiovascular%', 50))
            conn.close.assert_called_once()
        finally:
            app.dependency_overrides.clear()
            app.dependency_overrides.update(previous)

    def test_missing_connection_returns_error(self):
        with patch.object(provider_directory, 'get_db_connection', return_value=None):
            from fastapi import HTTPException
            with self.assertRaises(HTTPException) as raised:
                provider_directory.care_team(current_user=SimpleNamespace(user_id=1))
            self.assertEqual(raised.exception.status_code, 503)
