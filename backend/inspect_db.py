from db import get_db_connection


def inspect():
    connection = get_db_connection()
    if connection is None:
        print("Could not connect to the database.")
        return

    try:
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = [row[0] for row in cursor.fetchall()]

            print(f"{len(tables)} tables found:\n")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
                count = cursor.fetchone()[0]
                print(f"  {table}: {count} row(s)")
    finally:
        connection.close()


if __name__ == "__main__":
    inspect()
