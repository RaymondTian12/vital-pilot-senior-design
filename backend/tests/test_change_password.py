import os
from unittest.mock import patch

from argon2 import PasswordHasher
from fastapi.testclient import TestClient

os.environ.setdefault("jwt_secret_key", "isolated-password-change-test-key")

from backend.app import app
from backend.models.User import User


class FakeConnection:
    def __init__(self, user):
        self.user = user
        self.rowcount = 0
        self.next_hash = None

    def cursor(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, *_):
        pass

    def execute(self, query, values):
        assert query.startswith("UPDATE Users SET password_hash")
        new_hash, user_id, old_hash = values
        self.rowcount = int(user_id == self.user.user_id and old_hash == self.user.password_hash)
        self.next_hash = new_hash if self.rowcount else None

    def commit(self):
        if self.next_hash:
            self.user.password_hash = self.next_hash

    def rollback(self):
        self.next_hash = None

    def close(self):
        pass


def test_authenticated_password_change_invalidates_prior_session():
    old_password = "old-password-123"
    new_password = "new-pass8"
    user = User("Test", "User", "change-test@example.invalid", PasswordHasher().hash(old_password), user_id=42)
    connection = FakeConnection(user)
    client = TestClient(app)
    with patch.object(User, "get_user_by_email", return_value=user), patch(
        "backend.routers.auth.get_db_connection", return_value=connection
    ):
        signed_in = client.post("/auth/login", json={"email": user.email, "password": old_password})
        assert signed_in.status_code == 200
        headers = {"Authorization": f"Bearer {signed_in.json()['access_token']}"}

        assert client.post("/auth/change-password", json={
            "current_password": "wrong", "new_password": new_password
        }, headers=headers).status_code == 401
        assert client.post("/auth/change-password", json={
            "current_password": old_password, "new_password": "1234567"
        }, headers=headers).status_code == 422
        assert client.post("/auth/change-password", json={
            "current_password": old_password, "new_password": old_password
        }, headers=headers).status_code == 400

        changed = client.post("/auth/change-password", json={
            "current_password": old_password, "new_password": new_password
        }, headers=headers)
        assert changed.status_code == 200
        assert client.get("/auth/me", headers=headers).status_code == 401
        assert client.post("/auth/login", json={"email": user.email, "password": old_password}).status_code == 401
        assert client.post("/auth/login", json={"email": user.email, "password": new_password}).status_code == 200
