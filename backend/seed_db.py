import os
from db import get_db_connection

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "seed_clinical_thresholds.sql")


def run_seed():
    with open(SEED_PATH, "r") as f:
        statements = [s.strip() for s in f.read().split(";") if s.strip()]

    connection = get_db_connection()
    if connection is None:
        print("Aborting: could not connect to the database.")
        return

    try:
        with connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
        connection.commit()
        print(f"Applied {len(statements)} statements from {SEED_PATH}.")
    finally:
        connection.close()


if __name__ == "__main__":
    run_seed()
