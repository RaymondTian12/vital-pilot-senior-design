import os

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from backend.models.User import User, UserRole
from backend.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_current_user

router = APIRouter()

COOKIE_SECURE = os.getenv("environment") == "production"


class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register_user(payload: RegisterRequest):
    # Check if the user already exists in the database
    existing_user = User.get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    # Hash the password using Argon2
    ph = PasswordHasher()
    password_hash = ph.hash(payload.password)

    # Create a new user object
    new_user = User(
        user_id=None,
        firstname=payload.firstname,
        lastname=payload.lastname,
        email=payload.email,
        password_hash=password_hash,
        role=UserRole.default()
    )

    # Save the new user to the database
    if not new_user.save_user_to_database():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to register user")

    return {"message": "User registered successfully", "user": new_user.to_dict()}


# login route
@router.post("/login")
def login_user(payload: LoginRequest, response: Response):
    # Fetch the user from the database
    user = User.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Verify the password using Argon2
    ph = PasswordHasher()
    try:
        ph.verify(user.password_hash, payload.password)
    except VerifyMismatchError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # create a jwt token, http only for web clients. return it in the body for mobile clients to store and send back
    # as an "Authorization: Bearer <token>" header.
    token = create_access_token(user.email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"message": "Login successful", "access_token": token, "user": user.to_dict()}


@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()

