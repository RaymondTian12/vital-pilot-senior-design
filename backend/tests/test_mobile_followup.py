import os
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock as Mock, patch
os.environ.setdefault('jwt_secret_key', 'mobile-followup-test')
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import goals, metrics
from backend.tests.test_metrics import ConnectionAdapter, CursorAdapter

class DailyCursor(CursorAdapter):
    def execute(self, sql, values=()):
        if sql.startswith('SELECT user_id FROM Users'):
            return self.cursor.execute('SELECT 7')
        return super().execute(sql, values)

class FollowupTests(unittest.TestCase):
    def setUp(self):
        self.previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7,role='patient')
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.addCleanup(lambda:(app.dependency_overrides.clear(), app.dependency_overrides.update(self.previous)))



    def test_daily_habit_replaces_only_same_local_day(self):
        conn=ConnectionAdapter();conn.cursor=lambda: DailyCursor(conn)
        self.addCleanup(conn.database.close)
        with patch.object(metrics,'get_db_connection',return_value=conn):
            def save(value,stamp):
                response=self.client.post('/metrics',json={'metric_type':'WATER_INTAKE','amount_cups':value,'recorded_at':stamp,'timezone':'America/Chicago'})
                self.assertEqual(response.status_code,201,response.text)
                return response.json()
            first=save(1,'2026-11-02T06:30:00Z')
            second=save(2.5,'2026-11-03T05:59:00Z')
            third=save(3,'2026-11-03T06:00:00Z')
            self.assertEqual(first['log_id'],second['log_id'])
            self.assertNotEqual(second['log_id'],third['log_id'])
            self.assertEqual(conn.database.execute('SELECT COUNT(*) FROM WaterIntake').fetchone()[0],2)
            self.assertEqual(conn.database.execute('SELECT COUNT(*) FROM MetricAssessments').fetchone()[0],2)
            self.assertEqual(second['amount_cups'],2.5)

    def test_goals_validation_and_transaction(self):
        for data in [{},{'SLEEP':25},{'PHYSICAL_ACTIVITY':1.5},{'PEAK_FLOW_RATE':0}]:
            self.assertEqual(self.client.patch('/goals',json=data).status_code,422)
        conn=Mock();cursor=conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.side_effect=[(7,), (8000,'2026-11-01')]
        cursor.fetchall.return_value=[('Steps',10000)]
        with patch.object(goals,'get_db_connection',return_value=conn):
            response=self.client.patch('/goals',json={'PHYSICAL_ACTIVITY':10000})
        self.assertEqual(response.status_code,200,response.text)
        conn.commit.assert_called_once()
        self.assertEqual(response.json()['goals']['PHYSICAL_ACTIVITY'],10000)
        self.assertTrue(any('MetricGoalsHistory' in call.args[0] for call in cursor.execute.call_args_list))

    def test_invalid_timezone_does_not_save(self):
        conn=ConnectionAdapter();self.addCleanup(conn.database.close)
        with patch.object(metrics,'get_db_connection',return_value=conn):
            response=self.client.post('/metrics',json={'metric_type':'SLEEP','duration_hours':7,'timezone':'Bad/Zone'})
        self.assertEqual(response.status_code,422)
        self.assertEqual(conn.database.execute('SELECT COUNT(*) FROM Sleep').fetchone()[0],0)

    def test_report_90_days_and_live_temporal_engine(self):
        from backend.routers import summary
        conn=ConnectionAdapter();self.addCleanup(conn.database.close)
        conn.database.execute("INSERT INTO Sleep VALUES (1,7,7.5,'2026-11-02 12:00:00')")
        with patch.object(summary,'get_db_connection',return_value=conn):
            response=self.client.get('/metric-report',params={'start_at':'2026-08-05T05:00:00Z','today_start':'2026-11-02T06:00:00Z','end_at':'2026-11-03T06:00:00Z','timezone_name':'America/Chicago'})
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(response.json()['temporal']['current_streak'],1)
        self.assertEqual(len(response.json()['records']),1)

    def test_saved_peak_personal_best_used_without_retyping(self):
        conn=ConnectionAdapter();self.addCleanup(conn.database.close)
        conn.database.execute("INSERT INTO MetricGoals VALUES (1,7,'Peak Flow',500,'2026-11-01')")
        with patch.object(metrics,'get_db_connection',return_value=conn):
            response=self.client.post('/metrics',json={'metric_type':'PEAK_FLOW_RATE','flow_rate_lmin':450})
        self.assertEqual(response.status_code,201,response.text)
        self.assertEqual(response.json()['classification']['context']['peak_personal_best'],500)

    def test_admin_directory_uses_role_guard_and_pagination(self):
        from backend.routers import admin_directory
        from backend.models.User import UserRole
        with patch.object(admin_directory, 'get_db_connection') as db:
            self.assertEqual(self.client.get('/admin/users').status_code,403)
            db.assert_not_called()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=9,role=UserRole.ADMIN)
        conn=Mock();cursor=conn.cursor.return_value.__enter__.return_value
        cursor.fetchall.return_value=[(7,'Test','Patient','patient')]
        with patch.object(admin_directory,'get_db_connection',return_value=conn):
            response=self.client.get('/admin/users?offset=50')
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(cursor.execute.call_args.args[1],(50,50))
        self.assertEqual(response.json()['users'][0]['firstname'],'Test')
