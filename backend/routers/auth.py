from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.User import User, UserRole

router = APIRouter()

@router.post("/register")
def register_user(firstname: str, lastname: str, email: str, password: str):
    # Check if the user already exists in the database
    existing_user = User.get_user_by_email(email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    # Hash the password using Argon2
    ph = PasswordHasher()
    password_hash = ph.hash(password)

    # Create a new user object
    new_user = User(
        user_id=None,
        firstname=firstname,
        lastname=lastname,
        email=email,
        password_hash=password_hash,
        role=UserRole.default()
    )

    # Save the new user to the database
    new_user.save_user_to_database()

    return {"message": "User registered successfully", "user": new_user.to_dict()}


