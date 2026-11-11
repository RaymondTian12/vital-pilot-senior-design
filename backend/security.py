import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, Request, status

from backend.models.User import User

load_dotenv(override=True)

SECRET_KEY: str = os.getenv("jwt_secret_key") or ""
if not SECRET_KEY:
    raise RuntimeError("jwt_secret_key is not set in the environment")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day


def create_access_token(email: str, password_hash: Optional[str] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "exp": expire}
    if password_hash is not None:
        payload["pwd"] = hashlib.sha256(password_hash.encode("utf-8")).hexdigest()
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")


def get_current_user(request: Request) -> User:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ")
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

    user = User.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended. Contact the VitalPilot team.")
    fingerprint = payload.get("pwd")
    if fingerprint is not None and not hmac.compare_digest(
        str(fingerprint), hashlib.sha256(user.password_hash.encode("utf-8")).hexdigest()
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password changed. Please sign in again.")

    return user
