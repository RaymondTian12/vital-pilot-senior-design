"""Integration contract for the incoming Gemini chat endpoint; no live AI calls."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch
os.environ.setdefault('jwt_secret_key','isolated-chatbot-test-signing-key-1234')
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend import llm

class ChatbotIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.previous=app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user]=lambda:SimpleNamespace(user_id=7)
        self.client=TestClient(app)
        self.addCleanup(self.client.close)
        self.addCleanup(lambda:(app.dependency_overrides.clear(),app.dependency_overrides.update(self.previous)))

    def test_reply_and_conversation_contract(self):
        with patch('backend.routers.chatbot.call_model_with_fallbacks',return_value=' Educational reply. ') as model:
            response=self.client.post('/chat',json={'message':'Explain my reading','history':[{'role':'user','content':'Earlier question'}]})
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(response.json(),{'reply':'Educational reply.'})
        self.assertIn('Earlier question',model.call_args.args[0])

    def test_unavailable_model_is_sanitized(self):
        with patch('backend.routers.chatbot.call_model_with_fallbacks',side_effect=RuntimeError('private error')):
            response=self.client.post('/chat',json={'message':'Hello'})
        self.assertEqual(response.status_code,503)
        self.assertNotIn('private error',response.text)

    def test_missing_key_never_constructs_client(self):
        with patch.dict(os.environ,{},clear=True),patch.object(llm.genai,'Client') as client:
            with self.assertRaises(RuntimeError):llm.call_model_with_fallbacks('Fictional test')
            client.assert_not_called()
