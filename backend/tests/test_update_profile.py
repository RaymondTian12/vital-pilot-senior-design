import os
from unittest.mock import patch

from argon2 import PasswordHasher
from fastapi.testclient import TestClient

os.environ.setdefault("jwt_secret_key", "isolated-update-profile-test-key")

from backend.app import app
from backend.models.User import User


class FakeConnection:
    def __init__(self, user):
        self.user = user
        self.updated = None

    def cursor(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass

    def execute(self, query, values):
        assert query.startswith("UPDATE Users SET first_name")
        self.updated = values

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


def _signed_in_client():
    password = "a-password-123"
    user = User("Original", "Name", "update-profile-test@example.invalid", PasswordHasher().hash(password), user_id=99)
    connection = FakeConnection(user)
    client = TestClient(app)
    with patch.object(User, "get_user_by_email", return_value=user):
        signed_in = client.post("/auth/login", json={"email": user.email, "password": password})
        assert signed_in.status_code == 200
        headers = {"Authorization": f"Bearer {signed_in.json()['access_token']}"}
    return client, headers, user, connection


def test_updating_name_persists_and_returns_the_new_value():
    client, headers, user, connection = _signed_in_client()
    with patch.object(User, "get_user_by_email", return_value=user), patch(
        "backend.routers.auth.get_db_connection", return_value=connection
    ):
        response = client.put(
            "/auth/me", json={"firstname": "Updated", "lastname": "Person"}, headers=headers
        )
    assert response.status_code == 200, response.text
    assert response.json()["firstname"] == "Updated"
    assert response.json()["lastname"] == "Person"
    assert connection.updated == ("Updated", "Person", user.user_id)


def test_blank_name_is_rejected_before_touching_the_database():
    client, headers, user, connection = _signed_in_client()
    with patch.object(User, "get_user_by_email", return_value=user), patch(
        "backend.routers.auth.get_db_connection", return_value=connection
    ):
        response = client.put("/auth/me", json={"firstname": "", "lastname": "Person"}, headers=headers)
    assert response.status_code == 422
    assert connection.updated is None


def test_update_requires_authentication():
    # A fresh client, not the one from _signed_in_client() -- that one's
    # cookie jar still holds the session cookie login sets, which would
    # authenticate this request even without the Authorization header.
    response = TestClient(app).put("/auth/me", json={"firstname": "Nope", "lastname": "Nope"})
    assert response.status_code in (401, 403)
