import os
from db import get_db_connection

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "schema.sql")


def run_schema():
    with open(SCHEMA_PATH, "r") as f:
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
        print(f"Applied {len(statements)} statements from {SCHEMA_PATH}.")
    finally:
        connection.close()


if __name__ == "__main__":
    run_schema()
