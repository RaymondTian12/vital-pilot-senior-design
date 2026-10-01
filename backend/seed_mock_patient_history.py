"""
Creates a dedicated mock patient with a deliberately backdated history,
for exercising temporal_engine against real date-based scenarios without
waiting for real time to pass.

Scenario (all dates relative to when this script is run):
- Blood pressure: normal for most of the last 20 days, except a
  3-consecutive-day elevation 14-16 days ago (Stage 1 Hypertension),
  which should trip the "k >= 3 consecutive elevated days" sustained-
  alert rule, and a single Stage 2 spike 5 days ago to show a one-off
  reading still gets classified correctly on its own.
- Sleep: logged every day for the last 7 days, to exercise the
  logging-streak calculation.

Safe to re-run: deletes this mock user's existing logs first.
"""

from datetime import datetime, timedelta

from argon2 import PasswordHasher

from db import get_db_connection

MOCK_EMAIL = "mockpatient@vitalpilot.test"
MOCK_PASSWORD = "MockPatient123!"


def get_or_create_mock_user(connection) -> int:
    with connection.cursor() as cursor:
        cursor.execute("SELECT user_id FROM Users WHERE email = %s", (MOCK_EMAIL,))
        row = cursor.fetchone()
        if row:
            return row[0]

        ph = PasswordHasher()
        cursor.execute(
            "INSERT INTO Users (first_name, last_name, email, password_hash, role) "
            "VALUES (%s, %s, %s, %s, 'patient')",
            ("Mock", "Patient", MOCK_EMAIL, ph.hash(MOCK_PASSWORD)),
        )
        connection.commit()
        return cursor.lastrowid


def seed_blood_pressure(connection, user_id: int, today: datetime):
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM BloodPressure WHERE user_id = %s", (user_id,))

        readings = []
        for days_ago in range(20, 0, -1):
            logged_at = today - timedelta(days=days_ago)

            if 14 <= days_ago <= 16:
                # Engineered 3-consecutive-day Stage 1 Hypertension streak.
                systolic, diastolic = 134, 86
            elif days_ago == 5:
                # One-off Stage 2 spike, isolated (not part of a streak).
                systolic, diastolic = 148, 94
            else:
                systolic, diastolic = 116, 75

            readings.append((user_id, systolic, diastolic, logged_at))

        cursor.executemany(
            "INSERT INTO BloodPressure (user_id, systolic_mmhg, diastolic_mmhg, logged_at) "
            "VALUES (%s, %s, %s, %s)",
            readings,
        )
        connection.commit()
        print(f"Seeded {len(readings)} BloodPressure readings.")


def seed_sleep(connection, user_id: int, today: datetime):
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM Sleep WHERE user_id = %s", (user_id,))

        readings = []
        for days_ago in range(6, -1, -1):  # last 7 days, inclusive of today
            logged_at = today - timedelta(days=days_ago)
            readings.append((user_id, 7.5, logged_at))

        cursor.executemany(
            "INSERT INTO Sleep (user_id, duration_hours, logged_at) VALUES (%s, %s, %s)",
            readings,
        )
        connection.commit()
        print(f"Seeded {len(readings)} Sleep entries (7-day streak).")


def main():
    connection = get_db_connection()
    if connection is None:
        print("Aborting: could not connect to the database.")
        return

    today = datetime.now()

    try:
        user_id = get_or_create_mock_user(connection)
        print(f"Mock patient user_id={user_id} ({MOCK_EMAIL})")
        seed_blood_pressure(connection, user_id, today)
        seed_sleep(connection, user_id, today)
    finally:
        connection.close()


if __name__ == "__main__":
    main()
