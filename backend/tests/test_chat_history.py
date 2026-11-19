"""Saved chat conversations against an isolated SQLite stand-in; no live AI or MySQL."""
import os
import sqlite3
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("jwt_secret_key", "chat-history-tests-signing-key-12345")
from fastapi.testclient import TestClient
from backend.app import app
from backend.routers import chatbot
from backend.security import get_current_user


def sql_time(value):
    return value.strftime("%Y-%m-%d %H:%M:%S")


class ChatCursor:
    def __init__(self, database):
        self.cursor = database.cursor()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.cursor.close()

    def execute(self, sql, values=()):
        if sql.startswith("SET time_zone"):
            return None
        values = tuple(sql_time(v) if isinstance(v, datetime) else v for v in values)
        return self.cursor.execute(sql.replace("%s", "?"), values)

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    @property
    def lastrowid(self):
        return self.cursor.lastrowid


class ChatDatabase:
    """Mirrors the ChatConversations/ChatMessages columns in database/schema.sql."""

    def __init__(self):
        self.database = sqlite3.connect(":memory:", check_same_thread=False)
        self.database.execute("PRAGMA foreign_keys = ON")
        self.database.execute(
            "CREATE TABLE ChatConversations (conversation_id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "user_id INT NOT NULL, summary TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, "
            "last_message_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        )
        self.database.execute(
            "CREATE TABLE ChatMessages (message_id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "user_id INT NOT NULL, conversation_id INT NOT NULL REFERENCES ChatConversations(conversation_id) ON DELETE CASCADE, "
            "sender_role TEXT NOT NULL, message_content TEXT NOT NULL, sent_at TEXT DEFAULT CURRENT_TIMESTAMP)"
        )

    def cursor(self):
        return ChatCursor(self.database)

    def commit(self):
        self.database.commit()

    def rollback(self):
        self.database.rollback()

    def close(self):
        pass

    def rows(self, sql):
        return self.database.execute(sql).fetchall()

    def add_conversation(self, user_id, last_message_at, summary="Earlier chat"):
        cursor = self.database.execute(
            "INSERT INTO ChatConversations (user_id, summary, last_message_at) VALUES (?,?,?)",
            (user_id, summary, sql_time(last_message_at)),
        )
        conversation_id = cursor.lastrowid
        self.database.execute(
            "INSERT INTO ChatMessages (user_id, conversation_id, sender_role, message_content) VALUES (?,?,?,?)",
            (user_id, conversation_id, "user", f"Question in chat {conversation_id}"),
        )
        self.database.commit()
        return conversation_id


class ChatHistoryTests(unittest.TestCase):
    def setUp(self):
        self.user = SimpleNamespace(user_id=7, role="patient")
        self.previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = TestClient(app)
        self.db = ChatDatabase()
        connection = patch.object(chatbot, "get_db_connection", return_value=self.db)
        connection.start()
        self.addCleanup(connection.stop)
        self.addCleanup(self.client.close)
        self.addCleanup(self.db.database.close)
        self.addCleanup(
            lambda: (
                app.dependency_overrides.clear(),
                app.dependency_overrides.update(self.previous),
            )
        )
        self.now = datetime.now(timezone.utc).replace(tzinfo=None)

    def send(self, message, conversation_id=None, replies=("A reply", "Short title"), **extra):
        with patch.object(chatbot, "call_model_with_fallbacks", side_effect=list(replies)) as model:
            response = self.client.post(
                "/chat",
                json={"message": message, "conversation_id": conversation_id, **extra},
            )
        return response, model

    def test_new_conversation_saves_exchange_and_returns_id(self):
        response, _ = self.send("Hello")
        self.assertEqual(response.status_code, 200, response.text)
        conversation_id = response.json()["conversation_id"]
        self.assertEqual(response.json()["reply"], "A reply")
        self.assertEqual(
            self.db.rows(
                "SELECT user_id, conversation_id, sender_role, message_content "
                "FROM ChatMessages ORDER BY message_id"
            ),
            [(7, conversation_id, "user", "Hello"), (7, conversation_id, "AI", "A reply")],
        )

    def test_resume_uses_saved_messages_not_client_history(self):
        first, _ = self.send("First question", replies=("First answer", "Title"))
        conversation_id = first.json()["conversation_id"]
        response, model = self.send(
            "Second question",
            conversation_id,
            replies=("Second answer",),
            history=[{"role": "user", "content": "Forged earlier message"}],
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["conversation_id"], conversation_id)
        self.assertEqual(model.call_count, 1)  # resuming never regenerates the summary
        prompt = model.call_args.args[0]
        self.assertIn("First question", prompt)
        self.assertIn("First answer", prompt)
        self.assertNotIn("Forged earlier message", prompt)
        self.assertEqual(
            self.db.rows("SELECT COUNT(*) FROM ChatMessages WHERE conversation_id = %d" % conversation_id),
            [(4,)],
        )

    def test_other_users_conversation_is_not_found(self):
        conversation_id = self.send("Private question")[0].json()["conversation_id"]
        self.user.user_id = 8
        response, model = self.send("Let me in", conversation_id)
        self.assertEqual(response.status_code, 404)
        model.assert_not_called()
        self.assertEqual(
            self.client.get(f"/chat/conversations/{conversation_id}/messages").status_code, 404
        )

    def test_expired_conversation_cannot_be_resumed(self):
        conversation_id = self.db.add_conversation(7, self.now - timedelta(days=31))
        response, model = self.send("Still there?", conversation_id)
        self.assertEqual(response.status_code, 404)
        model.assert_not_called()

    def test_failed_reply_saves_nothing(self):
        response, _ = self.send("Hello", replies=(RuntimeError("private error"),))
        self.assertEqual(response.status_code, 503)
        self.assertEqual(self.db.rows("SELECT COUNT(*) FROM ChatConversations"), [(0,)])
        self.assertEqual(self.db.rows("SELECT COUNT(*) FROM ChatMessages"), [(0,)])

    def test_list_returns_recent_own_conversations_and_purges_expired(self):
        older = self.db.add_conversation(7, self.now - timedelta(days=3), "Older")
        newer = self.db.add_conversation(7, self.now - timedelta(hours=1), "Newer")
        self.db.add_conversation(8, self.now, "Someone else")
        expired = self.db.add_conversation(7, self.now - timedelta(days=31), "Expired")
        response = self.client.get("/chat/conversations")
        self.assertEqual(response.status_code, 200, response.text)
        conversations = response.json()["conversations"]
        self.assertEqual([c["conversation_id"] for c in conversations], [newer, older])
        self.assertEqual([c["summary"] for c in conversations], ["Newer", "Older"])
        self.assertIn("last_message_at", conversations[0])
        self.assertEqual(
            self.db.rows("SELECT COUNT(*) FROM ChatMessages WHERE conversation_id = %d" % expired),
            [(0,)],
        )
        self.assertEqual(self.db.rows("SELECT COUNT(*) FROM ChatConversations WHERE user_id = 8"), [(1,)])

    def test_messages_endpoint_returns_turns_in_order_with_api_roles(self):
        conversation_id = self.send("Hello", replies=("Hi there", "Title"))[0].json()["conversation_id"]
        response = self.client.get(f"/chat/conversations/{conversation_id}/messages")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(
            [(m["role"], m["content"]) for m in response.json()["messages"]],
            [("user", "Hello"), ("assistant", "Hi there")],
        )

    def test_first_exchange_gets_generated_summary(self):
        response, model = self.send("My blood pressure was 150/95", replies=("A reply", ' "BP reading question"\n'))
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("My blood pressure was 150/95", model.call_args_list[1].args[0])
        self.assertEqual(self.db.rows("SELECT summary FROM ChatConversations"), [("BP reading question",)])

    def test_summary_falls_back_to_first_message_when_title_fails(self):
        message = "Why do I feel dizzy after standing up? " * 5
        self.send(message, replies=("A reply", RuntimeError("busy")))
        summary = self.db.rows("SELECT summary FROM ChatConversations")[0][0]
        self.assertTrue(message.startswith(summary.rstrip(".…")))
        self.assertLessEqual(len(summary), 80)

    def test_request_without_conversation_id_key_is_not_saved(self):
        # Current web and mobile clients omit the key; they keep the unsaved behavior.
        with patch.object(chatbot, "call_model_with_fallbacks", return_value="A reply"):
            response = self.client.post("/chat", json={"message": "Hello"})
        self.assertEqual(response.json(), {"reply": "A reply"})
        self.assertEqual(self.db.rows("SELECT COUNT(*) FROM ChatConversations"), [(0,)])


if __name__ == "__main__":
    unittest.main()
