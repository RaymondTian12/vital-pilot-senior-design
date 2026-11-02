"""Create the first administrator from a trusted backend terminal."""
import argparse
import getpass

from argon2 import PasswordHasher

from backend.db import get_db_connection


def main():
    parser = argparse.ArgumentParser(description="Create the first VitalPilot admin account")
    parser.add_argument("--first-name", required=True)
    parser.add_argument("--last-name", required=True)
    parser.add_argument("--email", required=True)
    args = parser.parse_args()
    if not args.first_name.strip() or not args.last_name.strip() or "@" not in args.email:
        parser.error("Enter a name and valid email")
    conn = get_db_connection()
    if not conn:
        parser.error("Database unavailable")
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM Users WHERE role = 'admin'")
            if cursor.fetchone()[0]:
                parser.error("An admin already exists; bootstrap is disabled")
            password = getpass.getpass("Admin password (12+ characters): ")
            if len(password) < 12 or password != getpass.getpass("Confirm password: "):
                parser.error("Passwords must match and contain at least 12 characters")
            cursor.execute(
                "INSERT INTO Users (first_name, last_name, email, password_hash, role) "
                "VALUES (%s, %s, %s, %s, 'admin')",
                (args.first_name.strip(), args.last_name.strip(), args.email.strip().lower(), PasswordHasher().hash(password)))
        conn.commit()
        print("Admin account created. Sign in through the normal app screen.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
