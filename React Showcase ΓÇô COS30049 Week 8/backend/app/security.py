"""
security.py – password hashing and login tokens (JWT).

How login works:
  1. The user sends username + password to POST /api/auth/login.
  2. We check the password against the stored hash.
  3. We return a signed JSON Web Token (JWT). It contains the username and role
     and an expiry time, signed with SECRET_KEY so nobody can forge it.
  4. The front end sends it back on every request:  Authorization: Bearer <token>
  5. `get_current_user` (a dependency) verifies the signature and expiry.

A JWT is NOT encrypted – anyone can base64-decode it and read the claims.
What protects it is the SIGNATURE: change one character of the payload and
`jwt.decode()` refuses it. So: never put secrets in a token, and never trust
a claim the server did not verify.
"""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from functools import cache
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select

from .config import settings
from .database import SessionDep
from .models.user import User

ALGORITHM = "HS256"  # HMAC + SHA-256: one shared secret both signs and verifies
_ITERATIONS = 200_000

# Tells FastAPI (and the /api/docs page) where the login endpoint is.
# auto_error=False: a missing header gives us `None` so WE can choose the 401 message.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---------- passwords ---------------------------------------------------------
# PBKDF2 from Python's standard library keeps this project dependency-free.
# In production, prefer a dedicated library such as argon2-cffi or bcrypt.
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)  # a random salt per user → equal passwords get different hashes
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS).hex()
    return f"pbkdf2_sha256${_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations)).hex()
    return hmac.compare_digest(candidate, digest)  # constant-time comparison


@cache
def dummy_password_hash() -> str:
    """A throw-away hash used when a username does not exist.

    Checking the password against it takes as long as a real check, so the
    response time does not tell an attacker which usernames exist.
    (@cache: computed once, on first use.)
    """
    return hash_password(secrets.token_hex(16))


# ---------- tokens ------------------------------------------------------------
def create_access_token(user: User, minutes: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=minutes or settings.access_token_minutes)
    payload = {
        "sub": user.username,  # "subject" – who this token is about
        "role": user.role,  # used for authorisation (see require_role)
        "name": user.full_name,  # handy for the UI – a snapshot taken at login time
        "iat": now,  # "issued at"
        "exp": expires,  # "expires" – jwt.decode() rejects the token after this moment
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def _auth_error(detail: str, error: str | None = None) -> HTTPException:
    """401 + the WWW-Authenticate header the HTTP/OAuth2 standards ask for (RFC 6750)."""
    challenge = f'Bearer error="{error}"' if error else "Bearer"
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": challenge},
    )


# A FUNCTION, not a module-level `_unauthorized = _auth_error(...)` constant: never raise
# one shared exception object. Every `raise` adds the current stack frames to the SAME
# object's __traceback__, so it grows on every request and keeps every old request's
# objects (sessions, request data …) alive – a memory leak any anonymous client can trigger.
def _missing_token() -> HTTPException:
    return _auth_error("Not authenticated – no 'Authorization: Bearer <token>' header was sent. Please log in.")


def decode_access_token(token: str) -> dict[str, Any]:
    """Verify signature + expiry and return the claims – or raise 401.

    `algorithms=[ALGORITHM]` pins the algorithm: a forged token that says
    {"alg": "none"} (no signature at all) is rejected instead of trusted.
    """
    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise _auth_error("Token has expired – please log in again.", "invalid_token") from None
    except jwt.InvalidSignatureError:
        raise _auth_error(
            "Invalid token – the signature does not match the contents, so the token was changed or forged.",
            "invalid_token",
        ) from None
    except jwt.PyJWTError:
        raise _auth_error("Invalid token – it could not be decoded.", "invalid_token") from None


def get_current_user(token: Annotated[str | None, Depends(oauth2_scheme)], session: SessionDep) -> User:
    """Dependency: the logged-in user, or 401 if the token is missing/invalid/expired."""
    if not token:
        raise _missing_token()  # a fresh exception for every request
    claims = decode_access_token(token)
    # Load the user fresh from the database: the token may be older than the latest
    # changes (a renamed user, a deleted account, a changed role …).
    user = session.exec(select(User).where(User.username == claims["sub"])).first()
    if user is None:
        raise _auth_error("Not authenticated – this account no longer exists.", "invalid_token")
    return user


# Use it in an endpoint like this:   def profile(user: CurrentUser): ...
CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: str):
    """Dependency factory: `Depends(require_role("lecturer"))` → 403 for other roles.

    401 = "I don't know who you are"   (no / bad token)
    403 = "I know who you are, but you may not do this"   (wrong role)
    """

    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail=f"This action needs the role: {', '.join(roles)} (you are logged in as a {user.role}).",
            )
        return user

    return checker
