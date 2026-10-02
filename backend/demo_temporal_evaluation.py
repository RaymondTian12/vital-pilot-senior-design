"""
Proof-of-concept: runs the real temporal_engine + ClinicalThresholds
classification against the mock patient's backdated history seeded by
seed_mock_patient_history.py.

This is deliberately a standalone script, not a new API endpoint --
the point is to demonstrate the temporal/alerting logic is correct
before building the real logging endpoints around it.
"""

from datetime import datetime, timedelta

from db import get_db_connection
from engine.clinical_evaluator import classify_blood_pressure, is_at_least
from engine.temporal_engine import calculate_logging_streak, evaluate_consecutive_condition

from seed_mock_patient_history import MOCK_EMAIL


def fetch_user_id(cursor) -> int:
    cursor.execute("SELECT user_id FROM Users WHERE email = %s", (MOCK_EMAIL,))
    row = cursor.fetchone()
    if not row:
        raise SystemExit(
            f"No mock patient found for {MOCK_EMAIL}. Run seed_mock_patient_history.py first."
        )
    return row[0]


def main():
    connection = get_db_connection()
    if connection is None:
        print("Aborting: could not connect to the database.")
        return

    try:
        with connection.cursor() as cursor:
            user_id = fetch_user_id(cursor)

            cursor.execute(
                "SELECT systolic_mmhg, diastolic_mmhg, logged_at FROM BloodPressure "
                "WHERE user_id = %s ORDER BY logged_at",
                (user_id,),
            )
            bp_rows = cursor.fetchall()

            print(f"=== Blood pressure history for user_id={user_id} ===")
            bp_logs = []
            for systolic, diastolic, logged_at in bp_rows:
                result = classify_blood_pressure(cursor, systolic, diastolic)
                classification = result["overall"]["classification"]
                days_ago = (datetime.now().date() - logged_at.date()).days
                print(
                    f"  {logged_at.date()} ({days_ago:>2}d ago)  "
                    f"{systolic}/{diastolic} mmHg  ->  {classification}"
                )
                bp_logs.append({
                    "timestamp": logged_at,
                    "classification": classification,
                })

            elevated_or_worse = lambda log: is_at_least(log["classification"], "Stage 1 Hypertension")

            # seed_mock_patient_history.py engineers the 3-day elevated streak to
            # end 14 days ago (a separate, isolated Stage 2 spike sits at day 5,
            # closer to today, so it must not be used to infer the streak's end).
            streak_end_date = datetime.now().date() - timedelta(days=14)

            print("\n=== Sustained elevation check (k=3 consecutive days) ===")
            result_at_streak = evaluate_consecutive_condition(
                bp_logs, elevated_or_worse, k_consecutive_days=3,
                reference_date=streak_end_date,
            )
            print(f"Evaluated as-of {streak_end_date} (end of the engineered elevated streak):")
            print(f"  -> {result_at_streak}")
            assert result_at_streak["triggered"], "Expected the engineered 3-day streak to trigger"

            result_today = evaluate_consecutive_condition(
                bp_logs, elevated_or_worse, k_consecutive_days=3,
                reference_date=datetime.now().date(),
            )
            print(f"\nEvaluated as-of today (readings have since returned to normal):")
            print(f"  -> {result_today}")
            assert not result_today["triggered"], "Alert should have cleared after returning to normal"

            cursor.execute(
                "SELECT logged_at FROM Sleep WHERE user_id = %s ORDER BY logged_at",
                (user_id,),
            )
            sleep_dates = {row[0].date() for row in cursor.fetchall()}

            print("\n=== Sleep logging streak ===")
            streak_result = calculate_logging_streak(sleep_dates, today=datetime.now().date())
            print(f"  -> {streak_result}")
            assert streak_result["current_streak"] == 7
            assert "BADGE-STREAK-07" in streak_result["unlocked_badges"]

            print("\nAll temporal engine checks passed against real seeded data.")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
