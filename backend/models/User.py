import typing
from enum import Enum
from datetime import datetime
from backend.db import get_db_connection

class UserRole(Enum):
    PATIENT = "patient"
    PROVIDER = "provider"
    ADMIN = "admin"

    @classmethod
    def default(cls) -> 'UserRole':
        return cls.PATIENT

class User:
    def __init__(self, firstname: str, lastname: str, email: str, password_hash: str, role: UserRole = UserRole.default(), user_id: typing.Optional[int] = None, created_at: typing.Optional[datetime] = None):
        self.user_id = user_id
        self.firstname = firstname
        self.lastname = lastname
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.created_at = created_at or datetime.now()

    def to_dict(self) -> typing.Dict[str, typing.Any]:
        return {
            "user_id": self.user_id,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at
        }

    @staticmethod
    def get_user_by_email(email: str) -> typing.Optional['User']:
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    query = "SELECT user_id, first_name, last_name, email, password_hash, role, date_created FROM Users WHERE email = %s"
                    cursor.execute(query, (email,))
                    result = cursor.fetchone()
                    if result:
                        user_id, firstname, lastname, email, password_hash, role, created_at = result
                        return User(
                            user_id=user_id,
                            firstname=firstname,
                            lastname=lastname,
                            email=email,
                            password_hash=password_hash,
                            role=UserRole(role),
                            created_at=created_at
                        )
            except Exception as e:
                print(f"Error occurred while fetching user by email. Error: {e}")
        return None

    def save_user_to_database(self) -> bool:
        conn = get_db_connection()
        if not conn:
            return False

        try:
            with conn.cursor() as cursor:
                query = "INSERT INTO Users (first_name, last_name, email, password_hash, role, date_created) VALUES (%s, %s, %s, %s, %s, %s)"
                cursor.execute(query, (self.firstname, self.lastname, self.email, self.password_hash, self.role.value, self.created_at))
                conn.commit()
                self.user_id = cursor.lastrowid
                return True
        except Exception as e:
            print(f"Error occurred while saving user to database. Error: {e}")
            return False