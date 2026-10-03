import os

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from backend.models.User import User, UserRole
from backend.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_current_user
from backend.db import get_db_connection
from typing import Literal, Optional
from enum import Enum
from datetime import date, datetime

router = APIRouter()

COOKIE_SECURE = os.getenv("environment") == "production"


class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str
    
class Vitals(Enum):
    BLOOD_PRESSURE = "BLOOD_PRESSURE"
    BLOOD_GLUCOSE = "BLOOD_GLUCOSE"
    BLOOD_OXYGEN = "BLOOD_OXYGEN"
    BODY_MASS_INDEX = "BODY_MASS_INDEX"
    PEAK_FLOW_RATE = "PEAK_FLOW_RATE"
    WATER_INTAKE = "WATER_INTAKE"
    PHYSICAL_ACTIVITY = "PHYSICAL_ACTIVITY"
    SLEEP = "SLEEP"


# vitals that need a goal value collected alongside them, mapped to
# (MetricGoals.metric_type, QuestionnaireRequest goal field name)
GOAL_FIELD_MAP = {
    Vitals.PHYSICAL_ACTIVITY: ("Steps", "steps_goal"),
    Vitals.WATER_INTAKE: ("Water", "water_goal"),
    Vitals.SLEEP: ("Sleep", "sleep_goal"),
    Vitals.PEAK_FLOW_RATE: ("Peak Flow", "peak_flow_goal"),
}


class LoginRequest(BaseModel):
    email: str
    password: str

class QuestionnaireRequest(BaseModel):
    gender: Literal["male", "female", "other"]
    dob: date = Field(le=date.today()) # prevent dates from the future as a dob
    height_feet: int = Field(ge=0, le=9)
    height_inches: int = Field(ge=0, le= 11)
    weight: float = Field(gt=0)
    selectedVitals: list[Vitals]
    # only required when the corresponding vital above is selected
    steps_goal: Optional[int] = Field(default=None, gt=0)
    water_goal: Optional[float] = Field(default=None, gt=0)
    sleep_goal: Optional[float] = Field(default=None, gt=0)
    peak_flow_goal: Optional[int] = Field(default=None, gt=0)

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

@router.post("/questionnare")
def fill_questionnare(payload: QuestionnaireRequest, current_user: User = Depends(get_current_user)):
    # UserHealthProfiles.sex only supports Male/Female -- reject "other" rather
    # than letting an invalid enum value fail at the DB layer.
    if payload.gender == "other":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="gender must be male or female")

    user_id = current_user.user_id
    baseline_height_in = (payload.height_feet * 12) + payload.height_inches
    bmi_value = round((payload.weight / (baseline_height_in ** 2)) * 703, 1)

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO UserHealthProfiles (user_id, baseline_height_in, sex, date_of_birth)
                   VALUES (%s, %s, %s, %s)""",
                (user_id, baseline_height_in, payload.gender.upper(), payload.dob),
            )

            cursor.execute(
                """INSERT INTO BodyMassIndex (user_id, weight_lbs, bmi_value, recorded_at)
                   VALUES (%s, %s, %s, %s)""",
                (user_id, payload.weight, bmi_value, datetime.now()),
            )

            cursor.executemany(
                "INSERT INTO UserTrackedVitals (user_id, metric_type) VALUES (%s, %s)",
                [(user_id, vital.value) for vital in payload.selectedVitals],
            )

            goal_rows = []
            for vital in payload.selectedVitals:
                mapping = GOAL_FIELD_MAP.get(vital)
                if mapping is None:
                    continue
                metric_type, field_name = mapping
                goal_value = getattr(payload, field_name)
                if goal_value is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"{field_name} is required when {vital.value} is selected",
                    )
                goal_rows.append((user_id, metric_type, goal_value))

            if goal_rows:
                cursor.executemany(
                    "INSERT INTO MetricGoals (user_id, metric_type, goal_value) VALUES (%s, %s, %s)",
                    goal_rows,
                )

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(f"Error occurred while saving questionnaire. Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save questionnaire")
    finally:
        conn.close()

    return {"message": "Questionnaire saved"}
