"""Admin-only CLI for creating a provider account after identity checks."""
import argparse
import getpass

from argon2 import PasswordHasher
from backend.db import get_db_connection


def main():
    parser = argparse.ArgumentParser(description="Create a verified VitalPilot provider account")
    parser.add_argument("--first-name", required=True)
    parser.add_argument("--last-name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--npi", required=True)
    parser.add_argument("--specialty", required=True)
    parser.add_argument("--license-state", required=True)
    parser.add_argument("--license-number", required=True)
    args = parser.parse_args()
    if len(args.npi) != 10 or not args.npi.isdigit():
        parser.error("NPI must be 10 digits")
    if len(args.license_state) != 2 or not args.license_state.isalpha():
        parser.error("License state must be two letters")
    print("Confirm the clinician's identity, NPI, and active license before continuing.")
    if input("Type VERIFIED to create the account: ").strip() != "VERIFIED":
        parser.error("Verification was not confirmed")
    password = getpass.getpass("Temporary password: ")
    if len(password) < 12:
        parser.error("Temporary password must be at least 12 characters")
    conn = get_db_connection()
    if not conn:
        parser.error("Database unavailable")
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO Users (first_name, last_name, email, password_hash, role) "
                "VALUES (%s, %s, %s, %s, 'provider')",
                (args.first_name.strip(), args.last_name.strip(), args.email.strip().lower(), PasswordHasher().hash(password)))
            user_id = cursor.lastrowid
            cursor.execute(
                "INSERT INTO Providers (user_id, npi, specialty, license_state, license_number, verification_status) "
                "VALUES (%s, %s, %s, %s, %s, 'APPROVED')",
                (user_id, args.npi, args.specialty.strip(), args.license_state.upper(), args.license_number.strip()))
        conn.commit()
        print(f"Created provider account {user_id}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
