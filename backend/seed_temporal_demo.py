"""
Seeds a dedicated demo account with a backdated history engineered to trip
both temporal_engine.py rules, for showing the sustained/chronic alert
system live without waiting for real time to pass.

Scenario (all dates relative to when this script is run):
- Blood pressure: normal (116/75) most days, elevated (Stage 1
  Hypertension, 132-138/85-88) on the 3 most recent days (1-3 days ago --
  a currently-active streak, since the sustained rule counts backward
  from today) plus days 20 and 12 ago (-> 5 elevated days total in the
  last 30, trips the "chronic" rule too).
- Blood oxygen: normal (97%) most days, low (90-95% range, e.g. 93%) on
  five separate, NON-consecutive days (25, 19, 14, 9, 3 days ago) --
  never 3 in a row, so only the chronic rule fires here, not the
  sustained one. Demonstrates the chronic rule catching a scattered
  pattern the sustained rule would miss.

After seeding the raw readings, this calls the real
backend.notifications.evaluate_temporal_alerts() for both metrics, so the
actual Sustained/Chronic Alert notifications are created exactly as they
would be from live use -- open the Notifications screen on this account
to see them.

Safe to re-run: deletes this demo user's existing readings and
notifications first.

Run with: python3 -m backend.seed_temporal_demo
"""

from datetime import datetime, timedelta

from argon2 import PasswordHasher

if __package__:
    from .db import get_db_connection
    from .notifications import evaluate_temporal_alerts
    from .routers.auth import Vitals
else:
    from db import get_db_connection
    from notifications import evaluate_temporal_alerts
    from routers.auth import Vitals

DEMO_EMAIL = "demo.patient@vitalpilot.test"
DEMO_PASSWORD = "DemoPatient123!"


def get_or_create_demo_user(connection) -> int:
    with connection.cursor() as cursor:
        cursor.execute("SELECT user_id FROM Users WHERE email = %s", (DEMO_EMAIL,))
        row = cursor.fetchone()
        if row:
            return row[0]

        ph = PasswordHasher()
        cursor.execute(
            "INSERT INTO Users (first_name, last_name, email, password_hash, role) "
            "VALUES (%s, %s, %s, %s, 'patient')",
            ("Demo", "Patient", DEMO_EMAIL, ph.hash(DEMO_PASSWORD)),
        )
        connection.commit()
        return cursor.lastrowid


def ensure_demo_profile(connection, user_id: int):
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT profile_id FROM UserHealthProfiles WHERE user_id = %s", (user_id,)
        )
        if cursor.fetchone():
            return
        cursor.execute(
            "INSERT INTO UserHealthProfiles (user_id, baseline_height_in, sex, date_of_birth) VALUES (%s, %s, %s, %s)",
            (user_id, 66, "Female", "1985-06-15"),
        )
    connection.commit()


def seed_blood_pressure(connection, user_id: int, today: datetime):
    elevated_days = {20: (138, 88), 12: (136, 87), 3: (134, 86), 2: (136, 87), 1: (132, 85)}
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM BloodPressure WHERE user_id = %s", (user_id,))
        readings = []
        for days_ago in range(30, 0, -1):
            logged_at = today - timedelta(days=days_ago)
            systolic, diastolic = elevated_days.get(days_ago, (116, 75))
            readings.append((user_id, systolic, diastolic, logged_at))
        cursor.executemany(
            "INSERT INTO BloodPressure (user_id, systolic_mmhg, diastolic_mmhg, logged_at) VALUES (%s, %s, %s, %s)",
            readings,
        )
    connection.commit()
    print(f"Seeded {len(readings)} BloodPressure readings (sustained + chronic pattern).")


def seed_blood_oxygen(connection, user_id: int, today: datetime):
    low_days = {25: 93, 19: 92, 14: 94, 9: 93, 3: 93}
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM BloodOxygenSaturation WHERE user_id = %s", (user_id,))
        readings = []
        for days_ago in range(30, 0, -1):
            logged_at = today - timedelta(days=days_ago)
            spo2 = low_days.get(days_ago, 97)
            readings.append((user_id, spo2, logged_at))
        cursor.executemany(
            "INSERT INTO BloodOxygenSaturation (user_id, spo2_percentage, logged_at) VALUES (%s, %s, %s)",
            readings,
        )
    connection.commit()
    print(f"Seeded {len(readings)} BloodOxygenSaturation readings (chronic-only pattern).")


def clear_existing_alerts(connection, user_id: int):
    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM Notifications WHERE user_id = %s AND category = 'health-alert'",
            (user_id,),
        )
    connection.commit()


def main():
    connection = get_db_connection()
    if connection is None:
        print("Aborting: could not connect to the database.")
        return

    today = datetime.now()

    try:
        user_id = get_or_create_demo_user(connection)
        print(f"Demo patient user_id={user_id} ({DEMO_EMAIL} / {DEMO_PASSWORD})")
        ensure_demo_profile(connection, user_id)
        clear_existing_alerts(connection, user_id)
        seed_blood_pressure(connection, user_id, today)
        seed_blood_oxygen(connection, user_id, today)

        with connection.cursor() as cursor:
            evaluate_temporal_alerts(cursor, user_id, Vitals.BLOOD_PRESSURE)
            evaluate_temporal_alerts(cursor, user_id, Vitals.BLOOD_OXYGEN)
        connection.commit()
        print("Evaluated temporal rules and created matching notifications.")
        print("Log into the app with the demo account above to see the charts and the Sustained/Chronic alerts in Notifications.")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
