"""Admin-only CLI to approve or reject a pending clinician application."""
import argparse
from backend.db import get_db_connection


def main():
    parser = argparse.ArgumentParser(description="Review a pending doctor registration")
    parser.add_argument("email", nargs="?")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--approve", action="store_true")
    action.add_argument("--reject", action="store_true")
    action.add_argument("--list", action="store_true")
    args = parser.parse_args()
    if not args.list and not args.email:
        parser.error("An email is required to approve or reject")
    conn = get_db_connection()
    if not conn:
        parser.error("Database unavailable")
    try:
        with conn.cursor() as cursor:
            if args.list:
                cursor.execute(
                    "SELECT u.email, u.first_name, u.last_name, p.npi "
                    "FROM Providers p JOIN Users u ON u.user_id = p.user_id "
                    "WHERE p.verification_status = 'PENDING' ORDER BY p.created_at"
                )
                for email, first, last, npi in cursor.fetchall():
                    print(f"{email} | {first} {last} | NPI {npi}")
                return
            cursor.execute(
                "SELECT p.provider_id, u.first_name, u.last_name, p.npi, p.specialty, "
                "p.license_state, p.license_number, p.verification_status "
                "FROM Providers p JOIN Users u ON u.user_id = p.user_id WHERE u.email = %s FOR UPDATE",
                (args.email.strip().lower(),),
            )
            row = cursor.fetchone()
            if not row or row[7] != "PENDING":
                parser.error("No pending application for that email")
            print(f"Applicant: {row[1]} {row[2]} | NPI: {row[3]} | Specialty: {row[4]} | License: {row[5]} {row[6]}")
            if args.approve and input("After independently verifying identity and active license, type VERIFIED: ").strip() != "VERIFIED":
                parser.error("Verification was not confirmed")
            status = "APPROVED" if args.approve else "REJECTED"
            cursor.execute("UPDATE Providers SET verification_status = %s WHERE provider_id = %s", (status, row[0]))
        conn.commit()
        print(f"Application {status.lower()}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
