import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException

from backend.google_auth import WEB_CLIENT_ID, google_user, verify_google_token


class GoogleAuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def claims(self, **changes):
        return {"iss": "https://accounts.google.com", "aud": WEB_CLIENT_ID,
                "sub": "google-subject", "email": "test@example.com",
                "email_verified": True, "iat": int(time.time()),
                "exp": int(time.time()) + 60, **changes}

    def verify(self, claims):
        token = jwt.encode(claims, self.key, algorithm="RS256")
        with patch("backend.google_auth.google_keys.get_signing_key_from_jwt",
                   return_value=SimpleNamespace(key=self.key.public_key())):
            return verify_google_token(token)

    def test_valid_google_token(self):
        self.assertEqual(self.verify(self.claims())["sub"], "google-subject")

    def test_reject_invalid_claims(self):
        for change in ({"aud": "another-app"}, {"iss": "https://attacker.example"},
                       {"exp": int(time.time()) - 60}, {"email_verified": False}, {"sub": ""}):
            with self.subTest(change=change), self.assertRaises(HTTPException) as error:
                self.verify(self.claims(**change))
            self.assertEqual(error.exception.status_code, 401)

    def test_reject_forged_signature(self):
        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        token = jwt.encode(self.claims(), other_key, algorithm="RS256")
        with patch("backend.google_auth.google_keys.get_signing_key_from_jwt",
                   return_value=SimpleNamespace(key=self.key.public_key())), self.assertRaises(HTTPException):
            verify_google_token(token)

    def test_existing_email_is_not_automatically_linked(self):
        from unittest.mock import MagicMock
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.side_effect = [None, (123,)]
        with patch("backend.google_auth.get_db_connection", return_value=conn), self.assertRaises(HTTPException) as error:
            google_user(self.claims())
        self.assertEqual(error.exception.status_code, 409)
        conn.commit.assert_not_called()
        conn.rollback.assert_called_once()
        conn.close.assert_called_once()

    def test_linked_subject_keeps_local_identity_when_google_email_changes(self):
        from unittest.mock import MagicMock
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = (123, "Test", "User", "original@example.com", "hash", "patient", None)
        with patch("backend.google_auth.get_db_connection", return_value=conn):
            user, is_new = google_user(self.claims(email="changed@example.com"))
        self.assertEqual(user.user_id, 123)
        self.assertEqual(user.email, "original@example.com")
        self.assertFalse(is_new)
        conn.commit.assert_not_called()
        conn.close.assert_called_once()

    def test_new_user_and_subject_are_committed_together(self):
        from unittest.mock import MagicMock
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.side_effect = [None, None]
        cursor.lastrowid = 321
        with patch("backend.google_auth.get_db_connection", return_value=conn):
            user, is_new = google_user(self.claims())
        self.assertTrue(is_new)
        self.assertEqual(user.user_id, 321)
        self.assertEqual(cursor.execute.call_count, 4)
        conn.commit.assert_called_once()
        conn.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
