import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app import app
from backend.security import get_current_user
from backend.routers import metrics, summary
from backend.metric_assessments import overall_result
from backend.tests.test_metrics import ConnectionAdapter

class AssessmentTests(unittest.TestCase):
    def setUp(self):
        self.conn = ConnectionAdapter()
        self.conn.database.executescript((Path(__file__).resolve().parents[2]/'database/seed_clinical_thresholds.sql').read_text())
        self.conn.database.executemany('INSERT INTO MetricGoals VALUES (?,?,?,?,?)',[(1,7,'Sleep',8,'2026-10-20'),(2,7,'Steps',8000,'2026-10-20'),(3,7,'Water',8,'2026-10-20')])
        self.conn.commit()
        self.previous = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        self.patches = [patch.object(module,'get_db_connection',return_value=self.conn) for module in (metrics,summary)]
        for item in self.patches: item.start(); self.addCleanup(item.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close);self.addCleanup(self.conn.database.close)
        self.addCleanup(lambda:(app.dependency_overrides.clear(),app.dependency_overrides.update(self.previous)))

    def save(self,kind,**values):
        result = self.client.post('/metrics',json={'metric_type':kind,**values})
        self.assertEqual(result.status_code,201,result.text)
        return result.json()

    def test_reference_boundaries_oxygen_glucose_bmi_and_peak(self):
        for value,label in [(89,'Severely Low Oxygen Saturation'),(90,'Low Oxygen Saturation'),(94,'Low Oxygen Saturation'),(95,'Normal Oxygen Saturation')]:
            with self.subTest(oxygen=value): self.assertEqual(self.save('BLOOD_OXYGEN',spo2_percentage=value)['classification']['classification'],label)
        for value,action in [(54,'urgent'),(55,'review'),(69,'review'),(70,'none'),(99,'none'),(100,'review'),(125,'review'),(126,'review')]:
            with self.subTest(glucose=value): self.assertEqual(self.save('BLOOD_GLUCOSE',glucose_mgdl=value,glucose_context='fasting')['classification']['next_action'],action)
        for value,label in [(249,'Red Zone (Medical Alert)'),(250,'Yellow Zone (Caution)'),(399,'Yellow Zone (Caution)'),(400,'Green Zone (Stable)')]:
            with self.subTest(peak=value): self.assertEqual(self.save('PEAK_FLOW_RATE',flow_rate_lmin=value,peak_personal_best=500)['classification']['classification'],label)
        self.assertEqual(self.save('BODY_MASS_INDEX',weight_lbs=150)['classification']['classification'],'Healthy Weight')

    def test_unknown_glucose_and_peak_context_never_appear_normal(self):
        self.assertEqual(self.save('BLOOD_GLUCOSE',glucose_mgdl=126)['classification']['status'],'needs_context')
        self.assertEqual(self.save('BLOOD_GLUCOSE',glucose_mgdl=126,glucose_context='nonfasting')['classification']['status'],'needs_context')
        self.assertEqual(self.save('BLOOD_GLUCOSE',glucose_mgdl=54)['classification']['next_action'],'urgent')
        self.assertEqual(self.save('PEAK_FLOW_RATE',flow_rate_lmin=450)['classification']['status'],'needs_context')
        self.conn.database.execute("UPDATE UserHealthProfiles SET date_of_birth='2010-01-01'")
        self.conn.commit()
        self.assertEqual(self.save('BODY_MASS_INDEX',weight_lbs=120)['classification']['status'],'needs_context')

    def test_goal_shortfall_is_not_a_clinical_referral_and_snapshot_survives_changes(self):
        saved=self.save('SLEEP',duration_hours=7)
        self.assertEqual(saved['classification']['category'],'goal')
        self.assertEqual(saved['classification']['next_action'],'none')
        self.assertEqual(saved['classification']['context']['goal_value'],8)
        self.conn.database.execute("UPDATE MetricGoals SET goal_value=6 WHERE metric_type='Sleep'")
        self.conn.commit()
        history=self.client.get('/metrics?metric_type=SLEEP').json()['records']
        self.assertEqual(history[0]['classification'],saved['classification'])
        app.dependency_overrides[get_current_user]=lambda:SimpleNamespace(user_id=999)
        self.assertEqual(self.client.get('/metrics?metric_type=SLEEP').json()['records'],[])

    def test_missing_threshold_and_overlapping_configuration_fail_closed(self):
        self.conn.database.execute("DELETE FROM ClinicalThresholds WHERE metric_type='BLOOD_OXYGEN'")
        self.conn.commit()
        self.assertEqual(self.save('BLOOD_OXYGEN',spo2_percentage=98)['classification']['status'],'unavailable')
        self.conn.database.execute("INSERT INTO ClinicalThresholds SELECT * FROM ClinicalThresholds WHERE metric_type='BLOOD_GLUCOSE' AND classification='Normal Fasting Blood Glucose'")
        self.conn.commit()
        self.assertEqual(self.save('BLOOD_GLUCOSE',glucose_mgdl=98,glucose_context='fasting')['classification']['status'],'unavailable')

    def test_invalid_context_is_rejected_and_legacy_entries_keep_unknown_context(self):
        self.assertEqual(self.client.post('/metrics',json={'metric_type':'BLOOD_GLUCOSE','glucose_mgdl':98,'glucose_context':'random_guess'}).status_code,422)
        self.conn.database.execute("INSERT INTO BloodGlucose VALUES (1,7,98,'2026-10-20 08:00:00')")
        self.conn.commit()
        legacy=self.client.get('/metrics?metric_type=BLOOD_GLUCOSE').json()['records'][0]
        self.assertEqual(legacy['classification']['status'],'needs_context')

    def test_assessment_write_failure_rolls_back_reading(self):
        self.conn.database.execute('DROP TABLE MetricAssessments')
        self.conn.commit()
        result=self.client.post('/metrics',json={'metric_type':'BLOOD_OXYGEN','spo2_percentage':98})
        self.assertEqual(result.status_code,500)
        self.assertEqual(self.conn.database.execute('SELECT COUNT(*) FROM BloodOxygenSaturation').fetchone()[0],0)

    def test_overall_priority_and_earlier_alerts(self):
        when='2026-10-20T08:00:00Z'
        oxygen=self.save('BLOOD_OXYGEN',spo2_percentage=88,recorded_at=when)
        self.save('BLOOD_OXYGEN',spo2_percentage=98,recorded_at='2026-10-20T09:00:00Z')
        result=self.client.get('/daily-summary',params={'start_at':'2026-10-14T00:00:00Z','today_start':'2026-10-20T00:00:00Z','end_at':'2026-10-21T00:00:00Z'}).json()
        self.assertEqual(result['overall_result']['status'],'urgent')
        self.assertEqual(result['overall_result']['urgent_readings'][0]['log_id'],oxygen['log_id'])
        self.assertIn('BLOOD_GLUCOSE',result['overall_result']['missing_health_metrics'])

    def test_additive_migration_preserves_existing_configuration_on_repeat(self):
        self.conn.database.execute("DELETE FROM ClinicalThresholds WHERE metric_type <> 'BLOOD_PRESSURE'")
        self.conn.commit()
        sql=(Path(__file__).resolve().parents[2]/'database/migrations/20261020_metric_assessments.sql').read_text()
        # Metadata fixture already exists; exercise the exact additive DML twice.
        sql=sql[sql.index('START TRANSACTION;'):].replace('START TRANSACTION;','BEGIN TRANSACTION;')
        for _ in range(2): self.conn.database.executescript(sql)
        self.assertEqual(self.conn.database.execute("SELECT COUNT(*) FROM ClinicalThresholds WHERE metric_type='BLOOD_PRESSURE'").fetchone()[0],9)
        self.assertEqual(self.conn.database.execute("SELECT COUNT(*) FROM ClinicalThresholds WHERE metric_type='BLOOD_GLUCOSE'").fetchone()[0],5)

class OverallTests(unittest.TestCase):
    def test_no_alert_requires_complete_health_context_and_does_not_treat_habit_deficit_as_referral(self):
        start=datetime(2026,10,20,tzinfo=timezone.utc);end=datetime(2026,10,21,tzinfo=timezone.utc)
        rows=[]
        for i,kind in enumerate(['BLOOD_GLUCOSE','BLOOD_OXYGEN','BODY_MASS_INDEX','PEAK_FLOW_RATE']):
            rows.append({'log_id':i+1,'metric_type':kind,'recorded_at':start,'classification':{'status':'classified','classification':'Test within range','next_action':'none'}})
        comp={'alert_state':'LOG_SUCCESS_AND_BANNER','classification':'Normal Blood Pressure'}
        rows.append({'log_id':1,'metric_type':'BLOOD_PRESSURE','recorded_at':start,'systolic_mmhg':118,'diastolic_mmhg':76,'classification':{'status':'classified','systolic':comp,'diastolic':comp,'overall':comp}})
        rows.append({'log_id':1,'metric_type':'SLEEP','recorded_at':start,'classification':{'status':'classified','alert_state':'LOG_WARNING_AND_BANNER'}})
        self.assertEqual(overall_result(rows,start,end)['status'],'no_alerts')
        self.assertEqual(overall_result(rows,start,end)['habit_goals_below'],1)
        rows[0]['classification']['status']='needs_context'
        self.assertEqual(overall_result(rows,start,end)['status'],'incomplete')
        rows[1]['classification']['next_action']='review'
        self.assertEqual(overall_result(rows,start,end)['status'],'needs_review')
        self.assertEqual(overall_result([],start,end)['status'],'incomplete')
