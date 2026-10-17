"""Opt-in real-MySQL API checks. Requires a dedicated test server, never .env.

Set VITALPILOT_TEST_MYSQL_HOST/USER/PASSWORD (PORT defaults to 3306).
The supplied user must create/drop a uniquely named disposable test database.
"""
import os
import re
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault('jwt_secret_key', 'isolated-mysql-test-key-not-for-production')
import pymysql
from fastapi.testclient import TestClient
from backend.app import app
from backend.routers import metrics
from backend.security import get_current_user


@unittest.skipUnless(os.environ.get('VITALPILOT_TEST_MYSQL_HOST'), 'Dedicated MySQL test server not configured')
class MetricsMySQLTests(unittest.TestCase):
    def test_real_mysql_persistence_utc_and_account_isolation(self):
        config = dict(host=os.environ['VITALPILOT_TEST_MYSQL_HOST'],
                      port=int(os.environ.get('VITALPILOT_TEST_MYSQL_PORT', '3306')),
                      user=os.environ['VITALPILOT_TEST_MYSQL_USER'],
                      password=os.environ.get('VITALPILOT_TEST_MYSQL_PASSWORD', ''),
                      connect_timeout=10)
        name = 'vitalpilot_test_' + uuid.uuid4().hex
        admin = pymysql.connect(**config, autocommit=True)
        self.addCleanup(admin.close)
        with admin.cursor() as cursor:
            cursor.execute(f'CREATE DATABASE `{name}`')
        def drop_owned_database():
            with admin.cursor() as cursor:
                cursor.execute(f'DROP DATABASE `{name}`')
        self.addCleanup(drop_owned_database)
        database = pymysql.connect(**config, database=name)
        try:
            with database.cursor() as cursor:
                cursor.execute('CREATE TABLE Users (user_id BIGINT UNSIGNED PRIMARY KEY)')
                schema = (Path(__file__).resolve().parents[2] / 'database/schema.sql').read_text()
                for table in ('ClinicalThresholds', 'BloodPressure'):
                    match = re.search(r'CREATE TABLE IF NOT EXISTS ' + table + r'\s*\(.*?\);', schema, re.S)
                    self.assertIsNotNone(match)
                    cursor.execute(match.group())
                cursor.execute('INSERT INTO Users VALUES (7), (8)')
                seed = (Path(__file__).resolve().parents[2] / 'database/seed_clinical_thresholds.sql').read_text()
                sql = re.search(r'INSERT INTO ClinicalThresholds[^;]*\(\x27BLOOD_PRESSURE\x27[^;]*;', seed, re.S)
                self.assertIsNotNone(sql)
                cursor.execute(sql.group())
            database.commit()
        finally:
            database.close()
        previous = app.dependency_overrides.copy()
        self.addCleanup(lambda: (app.dependency_overrides.clear(), app.dependency_overrides.update(previous)))
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=7)
        with patch.object(metrics, 'get_db_connection', side_effect=lambda: pymysql.connect(**config, database=name)):
            with TestClient(app) as client:
                response = client.post('/metrics', json={'metric_type': 'BLOOD_PRESSURE', 'systolic_mmhg': 116,
                                       'diastolic_mmhg': 75, 'recorded_at': '2026-10-17T03:15:00-05:00'})
                self.assertEqual(response.status_code, 201, response.text)
                saved = response.json()
            # A fresh client and fresh database connection must read the saved row.
            with TestClient(app) as client:
                history = client.get('/metrics?metric_type=BLOOD_PRESSURE').json()['records']
                self.assertEqual(history[0]['log_id'], saved['log_id'])
                self.assertEqual(history[0]['recorded_at'].replace('Z', '+00:00'), '2026-10-17T08:15:00+00:00')
                self.assertEqual(history[0]['classification']['status'], 'classified')
                app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(user_id=8)
                self.assertEqual(client.get('/metrics?metric_type=BLOOD_PRESSURE').json()['records'], [])
