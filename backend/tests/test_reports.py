import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
os.environ.setdefault('jwt_secret_key','report-test-key')
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import reports
from backend.report_generator import render_pdf, report_facts, ai_explanation


def sample():
    stamp=datetime(2026,11,2,12,tzinfo=timezone.utc)
    return {'start_at':stamp,'today_start':stamp,'end_at':datetime(2026,11,3,6,tzinfo=timezone.utc),'timezone_name':'America/Chicago','truncated_metrics':[],
            'records':[{'metric_type':'WATER_INTAKE','log_id':1,'recorded_at':stamp,'amount_cups':2.5,'classification':{'classification':'Below goal','alert_state':'LOG_WARNING_AND_BANNER','guidance':'Compare against your personal goal.','context':{'goal_value':8}}}]}

class ReportTests(unittest.TestCase):
    def setUp(self):
        reports._recent.clear()
        self.previous=app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user]=lambda:SimpleNamespace(user_id=7)
        self.client=TestClient(app)
        self.addCleanup(self.client.close)
        self.addCleanup(lambda:(app.dependency_overrides.clear(),app.dependency_overrides.update(self.previous)))
        self.directory=tempfile.TemporaryDirectory();self.addCleanup(self.directory.cleanup)
        self.storage_patch=patch.object(reports,'storage',return_value=Path(self.directory.name));self.storage_patch.start();self.addCleanup(self.storage_patch.stop)
        self.conn=MagicMock();self.cursor=self.conn.cursor.return_value.__enter__.return_value
        self.cursor.fetchone.return_value=(12,);self.cursor.lastrowid=23
        self.connection_patch=patch.object(reports,'get_db_connection',return_value=self.conn);self.connection_patch.start();self.addCleanup(self.connection_patch.stop)
        data=sample();self.payload={key:data[key].isoformat() for key in ['start_at','today_start','end_at']}
        self.payload['timezone_name']='America/Chicago'

    def test_pdf_and_ai_facts_have_saved_data_not_identity(self):
        data=sample();data['email']='private@example.com';facts=report_facts(data)
        self.assertNotIn('private@example.com',str(facts));self.assertNotIn('log_id',str(facts))
        self.assertEqual(facts['metrics'][-1]['latest_value'],'2.5')
        pdf=render_pdf(data,'Explain <script> & symbols safely.','included')
        self.assertTrue(pdf.startswith(b'%PDF-'));self.assertIn(b'%%EOF',pdf)
        self.assertGreater(len(pdf),1000)

    def test_no_consent_rejects_before_ai(self):
        with patch.object(reports,'ai_explanation') as ai:
            response=self.client.post('/reports',json={**self.payload,'include_ai':True})
        self.assertEqual(response.status_code,422);ai.assert_not_called()

    def test_generation_persists_private_pdf_and_rate_limits(self):
        with patch.object(reports,'build_summary',return_value=sample()),patch.object(reports,'ai_explanation') as ai:
            response=self.client.post('/reports',json=self.payload)
            self.assertEqual(response.status_code,201,response.text)
            ai.assert_not_called()
            self.assertEqual(self.client.post('/reports',json=self.payload).status_code,429)
        self.assertEqual(response.json()['report_id'],23)
        files=list(Path(self.directory.name).glob('*.pdf'));self.assertEqual(len(files),1)
        self.assertEqual(files[0].stat().st_mode & 0o777,0o600)
        self.assertIn('no-store',response.headers['cache-control'])
        self.conn.commit.assert_called_once()

    def test_ai_failure_still_generates_pdf(self):
        with patch.object(reports,'build_summary',return_value=sample()),patch.object(reports,'ai_explanation',return_value=(None,'unavailable')):
            response=self.client.post('/reports',json={**self.payload,'include_ai':True,'ai_consent':True})
        self.assertEqual(response.status_code,201,response.text)
        self.assertEqual(response.json()['ai_status'],'unavailable')

    def test_metadata_failure_removes_orphan_pdf(self):
        self.conn.commit.side_effect=RuntimeError('database failed')
        with patch.object(reports,'build_summary',return_value=sample()):
            response=self.client.post('/reports',json=self.payload)
        self.assertEqual(response.status_code,503)
        self.assertEqual(list(Path(self.directory.name).glob('*.pdf')),[])
        self.conn.rollback.assert_called_once()

    def test_missing_profile_and_empty_report(self):
        self.cursor.fetchone.return_value=None
        self.assertEqual(self.client.post('/reports',json=self.payload).status_code,409)
        reports._recent.clear();self.cursor.fetchone.return_value=(12,)
        with patch.object(reports,'build_summary',return_value={**sample(),'records':[]}):
            self.assertEqual(self.client.post('/reports',json=self.payload).status_code,400)

    def test_download_requires_ownership_and_rejects_paths(self):
        self.cursor.fetchone.return_value=None
        self.assertEqual(self.client.get('/reports/23/pdf').status_code,404)
        self.assertEqual(self.cursor.execute.call_args.args[1],(23,7))
        self.cursor.fetchone.return_value=('../.env',)
        self.assertEqual(self.client.get('/reports/23/pdf').status_code,404)
        name='a'*32+'.pdf';(Path(self.directory.name)/name).write_bytes(b'%PDF-test')
        self.cursor.fetchone.return_value=(name,)
        response=self.client.get('/reports/23/pdf')
        self.assertEqual(response.status_code,200);self.assertEqual(response.content,b'%PDF-test')

    def test_gemini_uses_team_model_and_keeps_key_in_header(self):
        response=MagicMock();response.json.return_value={'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':'Educational explanation.'}]}}]}
        with patch.dict(os.environ,{'GEMINI_API_KEY':'test-key'},clear=True),patch('backend.report_generator.httpx.post',return_value=response) as post:
            text,status=ai_explanation(report_facts(sample()))
        self.assertEqual(status,'included');self.assertIn('Educational',text)
        self.assertTrue(post.call_args.args[0].endswith('/gemini-2.5-flash:generateContent'))
        self.assertEqual(post.call_args.kwargs['headers']['x-goog-api-key'],'test-key')
        self.assertNotIn('test-key',post.call_args.args[0])
        self.assertNotIn('test-key',str(post.call_args.kwargs['json']))
        with patch.dict(os.environ,{},clear=True),patch('backend.report_generator.httpx.post') as post:
            self.assertEqual(ai_explanation(report_facts(sample())),(None,'unavailable'));post.assert_not_called()

    def test_gemini_blocked_empty_and_incomplete_outputs_fail_closed(self):
        for body in ({'candidates':[]},{'candidates':[{'finishReason':'MAX_TOKENS','content':{'parts':[{'text':'Partial output'}]}}]}, {'candidates':[{'finishReason':'STOP','content':{'parts':[]}}]}):
            response=MagicMock();response.json.return_value=body
            with patch.dict(os.environ,{'GEMINI_API_KEY':'test'},clear=True),patch('backend.report_generator.httpx.post',return_value=response):
                self.assertEqual(ai_explanation(report_facts(sample())),(None,'unavailable'))

    def test_stats_use_latest_daily_habit_total(self):
        from backend.report_generator import summarize_metric_stats
        data=sample();original=data['records'][0]
        later={**original,'log_id':2,'amount_cups':5,'recorded_at':datetime(2026,11,2,18,tzinfo=timezone.utc)}
        stats=summarize_metric_stats([original,later],data['timezone_name'])['WATER_INTAKE']
        self.assertEqual(stats['count'],1)
        self.assertEqual(stats['raw_count'],2)
        self.assertEqual(stats['fields']['amount_cups']['avg'],5)

    def test_openai_key_alone_never_enables_or_calls_gemini(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':'unused-test-key'},clear=True),patch('backend.report_generator.httpx.post') as post:
            self.assertFalse(self.client.get('/reports/capabilities').json()['ai_available'])
            self.assertEqual(ai_explanation(report_facts(sample())),(None,'unavailable'))
            post.assert_not_called()

    def test_gemini_timeout_does_not_leak_provider_error_or_break_pdf(self):
        import httpx
        with patch.dict(os.environ,{'GEMINI_API_KEY':'secret-test-key'},clear=True),patch('backend.report_generator.httpx.post',side_effect=httpx.ReadTimeout('private provider details')):
            self.assertEqual(ai_explanation(report_facts(sample())),(None,'unavailable'))
