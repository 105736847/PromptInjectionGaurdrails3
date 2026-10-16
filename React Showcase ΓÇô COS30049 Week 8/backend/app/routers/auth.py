"""
auth.py – register, log in, and endpoints that need a login (JWT).

    POST  /api/auth/register        create a student account        → 201 user (never the hash)
    POST  /api/auth/login           OAuth2 password form → JWT      → 200 token | 401 | 429
    GET   /api/auth/me              who am I?                       → 200 | 401
    PATCH /api/auth/me              change my full name             → 200 | 401 | 422
    GET   /api/auth/lecturer-only   lecturers only                  → 200 | 401 | 403
    GET   /api/auth/token-info      the server's view of your token → 200 | 401

Authentication = WHO are you?        no / bad / expired token → 401 Unauthorized
Authorisation  = WHAT may you do?    valid token, wrong role  → 403 Forbidden

Docs: https://fastapi.tiangolo.com/tutorial/security/
"""
import math
import re
import time
from collections import deque
from collections.abc import Callable
from datetime import datetime, timezone
from threading import Lock
from typing import Annotated, Any

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from ..config import settings
from ..database import SessionDep
from ..models.user import User, UserPublic
from ..security import (
    CurrentUser,
    create_access_token,
    decode_access_token,
    dummy_password_hash,
    hash_password,
    oauth2_scheme,
    require_role,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERNAME_MAX_LENGTH = 32  # the same limit RegisterRequest enforces – no longer name can exist

# Documented error answers, so /api/docs shows them next to each endpoint.
UNAUTHORIZED = {401: {"description": "Missing, invalid or expired token"}}
FORBIDDEN = {403: {"description": "Logged in, but your role is not allowed"}}


# ---------- request / response models -------------------------------------------
class RegisterRequest(BaseModel):
    # extra="forbid": a client that sends {"role": "lecturer"} gets 422 instead of
    # silently choosing its own role. The SERVER decides roles ("never trust the client").
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={"examples": [{"username": "jamie_lee", "full_name": "Jamie Lee", "password": "sunset2026"}]},
    )

    username: str = Field(
        min_length=3, max_length=USERNAME_MAX_LENGTH, description="3–32 lowercase letters, digits or _"
    )
    full_name: str = Field(min_length=1, max_length=80)
    # max_length: an upper bound keeps request bodies and error messages a sane size, and
    # bcrypt (a popular alternative to our PBKDF2) silently IGNORES every byte after the 72nd.
    # It is not about speed: PBKDF2 hashes the password only once, however long it is. What
    # makes hashing deliberately slow is the iteration count (_ITERATIONS in security.py).
    password: str = Field(min_length=8, max_length=128, description="At least 8 characters with a letter and a digit")

    @field_validator("username", "full_name", mode="before")
    @classmethod
    def strip_spaces(cls, value: Any) -> Any:
        # mode="before" runs BEFORE the length checks, so "   " counts as empty.
        return value.strip() if isinstance(value, str) else value

    @field_validator("username")
    @classmethod
    def username_characters(cls, value: str) -> str:
        if not re.fullmatch(r"[a-z0-9_]+", value):
            raise ValueError("Use only lowercase letters, digits and underscores.")
        return value

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Password must contain at least one letter and one digit.")
        return value


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")  # only full_name may be changed here

    full_name: str = Field(min_length=1, max_length=80)

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_spaces(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value


class RateLimited(BaseModel):
    message: str
    retry_after: int = Field(description="Seconds to wait – the same number as the Retry-After header")


class RateLimitedError(BaseModel):
    """The 429 body. Unlike other errors, `detail` is an object, so /api/docs must show its shape."""

    detail: RateLimited


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # OAuth2: send it back as "Authorization: Bearer <token>"
    expires_in: int = Field(description="Seconds until the token expires")
    user: UserPublic


class AssessmentStat(BaseModel):
    name: str
    due_week: int
    submitted: int
    average_mark: float | None


class ClassSummary(BaseModel):
    unit_code: str
    unit_name: str
    enrolled: int
    at_risk: int
    assessments: list[AssessmentStat]
    viewer: str
    generated_at: datetime


class TokenInfo(BaseModel):
    algorithm: str
    header: dict[str, Any]
    claims: dict[str, Any]
    issued_at: datetime | None
    expires_at: datetime
    expires_in_seconds: int
    user_in_database: UserPublic
    note: str


# ---------- a tiny login rate limiter -----------------------------------------------
class LoginRateLimiter:
    """At most `max_failures` failed logins per (username, IP) within `window_seconds`.

    Kept in memory: fine for ONE server process like this demo. With several
    workers or servers, store the counters somewhere shared (e.g. Redis).
    """

    def __init__(self, max_failures: int = 5, window_seconds: int = 60, clock: Callable[[], float] = time.monotonic):
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self.clock = clock  # replaceable, so tests can "fast-forward" time
        self._failures: dict[tuple[str, str], deque[float]] = {}
        self._lock = Lock()  # `def` endpoints run in a thread pool → protect the dict
        self._next_sweep = -math.inf

    def acquire(self, key: tuple[str, str]) -> int:
        """Reserve one login attempt: 0 = go ahead, otherwise the seconds to wait.

        The attempt is counted as a failure UP FRONT, and reset() forgives it when the
        password turns out to be right. Why not "check first, record the failure later"?
        The password check in between is slow (~60 ms), so 30 requests sent at the same
        moment would ALL pass the check before the first failure was recorded.
        Check-then-act across a slow call is a race – so check AND record under one lock.
        """
        with self._lock:
            now = self.clock()
            self._forget_old_keys(now)
            attempts = self._failures.setdefault(key, deque())
            while attempts and now - attempts[0] >= self.window_seconds:
                attempts.popleft()  # forget failures that left the time window
            if len(attempts) >= self.max_failures:
                return max(1, math.ceil(attempts[0] + self.window_seconds - now))
            attempts.append(now)
            return 0

    def _forget_old_keys(self, now: float) -> None:
        # Only called from acquire(), so the lock is already held.
        # Without this, every (username, IP) ever tried – e.g. an attacker "spraying" one
        # password over thousands of usernames – would stay in memory until the server stops.
        # Once per window is enough to keep the dict small, and keeps each request cheap.
        if now < self._next_sweep:
            return
        self._next_sweep = now + self.window_seconds
        stale = [
            key
            for key, attempts in self._failures.items()
            if not attempts or now - attempts[-1] >= self.window_seconds  # newest attempt is old
        ]
        for key in stale:
            del self._failures[key]

    def reset(self, key: tuple[str, str]) -> None:
        with self._lock:
            self._failures.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._failures.clear()
            self._next_sweep = -math.inf


login_limiter = LoginRateLimiter()


def _find_user(session: Session, username: str) -> User | None:
    return session.exec(select(User).where(User.username == username)).first()


# ---------- endpoints ---------------------------------------------------------------
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserPublic,  # the filter: hashed_password is NOT in UserPublic
    summary="Create a student account",
    responses={409: {"description": "Username already taken"}},
)
def register(data: RegisterRequest, session: SessionDep) -> User:
    # Honest trade-off: this 409 tells ANYONE whether a username exists – the very thing
    # login() hides. Sign-up (and "forgot password") forms always leak it somehow, so real
    # systems rate-limit them per IP, or sign up by e-mail and always answer the same way
    # ("If this address is new, we've sent you a link").
    if _find_user(session, data.username):
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"The username '{data.username}' is already taken.")

    user = User(
        username=data.username,
        full_name=data.full_name,
        role="student",  # everyone who signs up is a student – never taken from the request
        hashed_password=hash_password(data.password),
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:  # two sign-ups with the same name at the same moment
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"The username '{data.username}' is already taken.")
    session.refresh(user)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in with username + password (form data) and receive a JWT",
    responses={
        401: {"description": "Incorrect username or password"},
        429: {
            "model": RateLimitedError,
            "description": "Too many failed attempts – wait `retry_after` seconds",
            "headers": {"Retry-After": {"description": "Seconds to wait", "schema": {"type": "integer"}}},
        },
    },
)
def login(
    # OAuth2PasswordRequestForm reads FORM fields (application/x-www-form-urlencoded),
    # not JSON – that is what the OAuth2 "password flow" and the /api/docs Authorize button use.
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    session: SessionDep,
    minutes: Annotated[
        int | None,
        Query(ge=1, le=30, description="Teaching demo only: a SHORTER lifetime (capped at ACCESS_TOKEN_MINUTES)"),
    ] = None,
) -> TokenResponse:
    username = form.username.strip().lower()
    # No registered username is longer than 32 characters. Cap the limiter key (and the
    # name echoed in the 429 message) so a 1 MB "username" can't cost us 1 MB of memory.
    too_long = len(username) > USERNAME_MAX_LENGTH
    client_ip = request.client.host if request.client else "unknown"
    key = (username[:USERNAME_MAX_LENGTH], client_ip)

    # 1. Refuse BEFORE checking the password – otherwise an attacker could keep guessing.
    #    acquire() also counts this attempt, so parallel requests can't slip past the limit.
    wait = login_limiter.acquire(key)
    if wait:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            # A structured detail: a readable message AND the number, because browsers can
            # only read the Retry-After header cross-origin if CORS exposes it.
            detail={
                "message": f"Too many failed login attempts for '{key[0]}'. Try again in {wait} s.",
                "retry_after": wait,
            },
            headers={"Retry-After": str(wait)},
        )

    # 2. Always run the slow hash check – even for unknown users – so the response
    #    time does not reveal which usernames exist.
    user = None if too_long else _find_user(session, username)
    password_ok = verify_password(form.password, user.hashed_password if user else dummy_password_hash())
    if user is None or not password_ok:
        # The attempt was already counted by acquire(). The SAME message for
        # "no such user" and "wrong password": no hints for attackers.
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    login_limiter.reset(key)  # the right password → forgive the earlier failures
    # The client may only SHORTEN the lifetime, never go past the server's own policy
    # (ACCESS_TOKEN_MINUTES might be 5 in production). Never trust the client.
    lifetime = min(minutes, settings.access_token_minutes) if minutes else settings.access_token_minutes
    return TokenResponse(
        access_token=create_access_token(user, minutes=lifetime),
        expires_in=lifetime * 60,
        user=UserPublic.model_validate(user, from_attributes=True),
    )


@router.get("/me", response_model=UserPublic, summary="The logged-in user", responses=UNAUTHORIZED)
def read_me(user: CurrentUser) -> User:
    # CurrentUser already did the work: header → token → signature + expiry → user row.
    return user


@router.patch("/me", response_model=UserPublic, summary="Change my full name", responses=UNAUTHORIZED)
def update_me(changes: ProfileUpdate, user: CurrentUser, session: SessionDep) -> User:
    # Users can only ever edit THEMSELVES: the id comes from the verified token, not the URL.
    user.full_name = changes.full_name
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get(
    "/lecturer-only",
    response_model=ClassSummary,
    summary="Lecturers only – role-based authorisation",
    responses={**UNAUTHORIZED, **FORBIDDEN},
)
def lecturer_only(lecturer: Annotated[User, Depends(require_role("lecturer"))]) -> ClassSummary:
    # Fictional class numbers. The point is WHO may see them, not the data.
    return ClassSummary(
        unit_code="COS30049",
        unit_name="Computing Technology Innovation Project",
        enrolled=126,
        at_risk=9,
        assessments=[
            AssessmentStat(name="Assignment 1 – Project proposal", due_week=4, submitted=124, average_mark=72.4),
            AssessmentStat(name="Assignment 2 – ML prototype", due_week=8, submitted=119, average_mark=68.9),
            AssessmentStat(name="Assignment 3 – Full-stack app", due_week=12, submitted=0, average_mark=None),
        ],
        viewer=lecturer.full_name,
        generated_at=datetime.now(timezone.utc),
    )


@router.get(
    "/token-info",
    response_model=TokenInfo,
    summary="What the server sees in your (verified) token",
    responses=UNAUTHORIZED,
)
def token_info(token: Annotated[str | None, Depends(oauth2_scheme)], user: CurrentUser) -> TokenInfo:
    # `user: CurrentUser` has already rejected missing, forged and expired tokens with 401,
    # so decoding again here is safe. (FastAPI runs oauth2_scheme only once per request.)
    claims = decode_access_token(token)
    expires_at = datetime.fromtimestamp(claims["exp"], timezone.utc)
    issued_at = datetime.fromtimestamp(claims["iat"], timezone.utc) if "iat" in claims else None
    return TokenInfo(
        algorithm=jwt.get_unverified_header(token)["alg"],
        header=jwt.get_unverified_header(token),
        claims=claims,
        issued_at=issued_at,
        expires_at=expires_at,
        expires_in_seconds=max(0, round((expires_at - datetime.now(timezone.utc)).total_seconds())),
        user_in_database=UserPublic.model_validate(user, from_attributes=True),
        note=(
            "Signature valid and not expired. 'claims' were frozen when you logged in; "
            "'user_in_database' is read fresh on every request."
        ),
    )
