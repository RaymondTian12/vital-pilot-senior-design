"""Verify Google credentials and map the stable Google subject to a local user."""
import os
import secrets

import jwt
import pymysql
from argon2 import PasswordHasher
from fastapi import HTTPException

from backend.db import get_db_connection
from backend.models.User import User, UserRole

WEB_CLIENT_ID = "123952545473-fk0i639tdqtgh3cm98sh17d1474vrqlc.apps.googleusercontent.com"
google_keys = jwt.PyJWKClient("https://www.googleapis.com/oauth2/v3/certs", timeout=10)


def verify_google_token(token: str) -> dict:
    try:
        key = google_keys.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token, key, algorithms=["RS256"],
            audience=os.getenv("GOOGLE_WEB_CLIENT_ID", WEB_CLIENT_ID),
            options={"require": ["exp", "iat", "iss", "aud", "sub", "email"]},
        )
        if claims["iss"] not in ("accounts.google.com", "https://accounts.google.com"):
            raise jwt.InvalidTokenError("Invalid issuer")
        if claims.get("email_verified") is not True:
            raise jwt.InvalidTokenError("Email is not verified")
        if not isinstance(claims["sub"], str) or not claims["sub"] or len(claims["sub"]) > 255:
            raise jwt.InvalidTokenError("Invalid subject")
        if not isinstance(claims["email"], str) or len(claims["email"]) > 255:
            raise jwt.InvalidTokenError("Invalid email")
        return claims
    except jwt.PyJWKClientConnectionError:
        raise HTTPException(503, "Cannot verify Google sign-in right now. Please try again.")
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired Google sign-in token")


def google_user(claims: dict) -> tuple[User, bool]:
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Database unavailable")
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT u.user_id, u.first_name, u.last_name, u.email, u.password_hash, u.role, u.date_created
                   FROM UserAuthIdentities i JOIN Users u ON u.user_id = i.user_id
                   WHERE i.provider = 'google' AND i.provider_subject = %s""", (claims["sub"],),
            )
            row = cursor.fetchone()
            if row:
                return User(row[1], row[2], row[3], row[4], UserRole(row[5]), row[0], row[6]), False
            email = claims["email"].strip().lower()
            cursor.execute("SELECT user_id FROM Users WHERE email = %s", (email,))
            if cursor.fetchone():
                raise HTTPException(409, "An account with this email already exists. Sign in with your password. Google account linking is not available yet.")
            # Keep the existing NOT NULL password schema. This random credential is
            # never returned or stored in plaintext and cannot be used by the user.
            password_hash = PasswordHasher().hash(secrets.token_urlsafe(64))
            first = str(claims.get("given_name") or claims.get("name") or "VitalPilot")[:50]
            last = str(claims.get("family_name") or "")[:50]
            cursor.execute(
                "INSERT INTO Users (first_name, last_name, email, password_hash, role) VALUES (%s, %s, %s, %s, 'patient')",
                (first, last, email, password_hash),
            )
            user_id = cursor.lastrowid
            cursor.execute(
                "INSERT INTO UserAuthIdentities (user_id, provider, provider_subject) VALUES (%s, 'google', %s)",
                (user_id, claims["sub"]),
            )
        conn.commit()
        return User(first, last, email, password_hash, user_id=user_id), True
    except HTTPException:
        conn.rollback()
        raise
    except pymysql.err.IntegrityError:
        conn.rollback()
        raise HTTPException(409, "Account registration changed while signing in. Please try again.")
    except pymysql.err.ProgrammingError:
        conn.rollback()
        raise HTTPException(503, "Google sign-in database setup is incomplete. Contact the VitalPilot team.")
    finally:
        conn.close()
