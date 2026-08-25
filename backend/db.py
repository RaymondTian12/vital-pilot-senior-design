from dotenv import load_dotenv
import os
import pymysql
load_dotenv()


def get_db_connection():
    name = os.getenv("dbname")
    host = os.getenv("dbhost")
    port = os.getenv("dbport")
    user = os.getenv("dbuser")
    password = os.getenv("dbpassword")

    try:
        connection = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=name,
            ssl = { 'ssl': {}} # empty dict forces standard ssl settings
        )

        return connection

    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None

        
def test_db_connection_w_query(connection):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("Database query successful!")
            else:
                print("Database query failed.")
    except Exception as e:
        print(f"Error executing query: {e}")
    
if __name__ == "__main__":
    conn = get_db_connection()
    if conn:
        print("Database connection successful!")
        test_db_connection_w_query(conn)
        conn.close()
    else:
        print("Database connection failed.")    

