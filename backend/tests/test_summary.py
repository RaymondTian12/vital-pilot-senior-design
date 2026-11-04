import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch
os.environ.setdefault("jwt_secret_key", "isolated-summary-test")
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import summary
from backend.tests.test_metrics import ConnectionAdapter

class SummaryTests(unittest.TestCase):
    def setUp(self):
        self.conn = ConnectionAdapter()
        self.conn.database.executemany("INSERT INTO MetricGoals VALUES (?,?,?,?,?)", [(1,7,'Sleep',8,'2026-10-19'), (2,7,'Steps',6000,'2026-10-19'), (3,999,'Water',8,'2026-10-19'), (4,7,'Sleep',7.5,'2026-10-20')])
        self.conn.database.executemany("INSERT INTO BloodGlucose VALUES (?,?,?,?)", [(1,7,95,'2026-10-20 04:59:59'), (2,7,98,'2026-10-20 05:00:00'), (3,7,100,'2026-10-21 05:00:00'), (4,999,90,'2026-10-20 10:00:00')])
        self.conn.database.executemany("INSERT INTO BloodPressure VALUES (?,?,?,?,?)", [(1,7,190,125,'2026-10-20 06:00:00'), (2,7,118,76,'2026-10-20 08:00:00')])
        self.conn.commit()
        self.previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        self.patch = patch.object(summary, 'get_db_connection', return_value=self.conn)
        self.patch.start()
        self.client = TestClient(app)
        self.addCleanup(self.patch.stop)
        self.addCleanup(self.client.close)
        self.addCleanup(self.conn.database.close)
        self.addCleanup(lambda: (app.dependency_overrides.clear(), app.dependency_overrides.update(self.previous)))
        self.window = {'start_at':'2026-10-14T00:00:00-05:00','today_start':'2026-10-20T00:00:00-05:00','end_at':'2026-10-21T00:00:00-05:00'}

    def test_read_only_local_window_account_scope_and_latest_goals(self):
        result = self.client.get('/daily-summary', params=self.window)
        self.assertEqual(result.status_code, 200, result.text)
        data=result.json()
        glucose=[r for r in data['records'] if r['metric_type']=='BLOOD_GLUCOSE']
        self.assertEqual([r['glucose_mgdl'] for r in glucose],[98,95])
        self.assertEqual(data['goals'],{'SLEEP':7.5,'PHYSICAL_ACTIVITY':6000})
        bp=[r for r in data['records'] if r['metric_type']=='BLOOD_PRESSURE']
        self.assertEqual(bp[0]['classification']['overall']['classification'],'Normal Blood Pressure')
        self.assertEqual(bp[1]['classification']['overall']['classification'],'Hypertensive Crisis')
        self.assertEqual(data['today_start'].replace('Z','+00:00'),'2026-10-20T05:00:00+00:00')
        self.assertEqual(self.conn.database.execute('SELECT COUNT(*) FROM BloodGlucose').fetchone()[0],4)

    def test_authentication_and_invalid_windows(self):
        app.dependency_overrides.pop(get_current_user)
        self.assertEqual(self.client.get('/daily-summary',params=self.window).status_code,401)
        app.dependency_overrides[get_current_user]=lambda: SimpleNamespace(user_id=7)
        for change in [{'today_start':'2026-10-20T00:00:00'},{'start_at':'2026-09-01T00:00:00Z'},{'end_at':'2026-10-19T00:00:00Z'}]:
            self.assertEqual(self.client.get('/daily-summary',params={**self.window,**change}).status_code,400)

    def test_truncation_is_explicit(self):
        with patch.object(summary,'PER_METRIC_LIMIT',1):
            result=self.client.get('/daily-summary',params=self.window).json()
        self.assertIn('BLOOD_GLUCOSE',result['truncated_metrics'])
        self.assertEqual(len([r for r in result['records'] if r['metric_type']=='BLOOD_GLUCOSE']),1)

    def test_failure_never_reports_an_empty_success(self):
        with patch.object(summary,'get_db_connection',return_value=None):
            self.assertEqual(self.client.get('/daily-summary',params=self.window).status_code,503)
