"""
test_auth.py – register, login, protected endpoints, roles, tokens and rate limiting.

Every success path has a matching failure path: 401 (who are you?), 403 (not
allowed), 409 (duplicate), 422 (invalid input) and 429 (slow down).
Run:  .venv/bin/python -m pytest tests/test_auth.py
"""
import base64
import json
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException

from app.config import settings
from app.models.user import User
from app.routers import auth
from app.routers.auth import login_limiter
from app.security import ALGORITHM, create_access_token, get_current_user


@pytest.fixture(autouse=True)
def fresh_rate_limiter():
    # The limiter lives in memory for the whole process. Clear it before AND after
    # each test so failures here can never block logins in other test files.
    login_limiter.clear()
    yield
    login_limiter.clear()


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def get_token(client, username="student", password="student123", **params) -> str:
    response = client.post("/api/auth/login", data={"username": username, "password": password}, params=params)
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def b64url_json(part: str) -> dict:
    return json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))


def b64url_encode(data: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(data).encode()).rstrip(b"=").decode()


def tamper(token: str, **changes) -> str:
    """Change claims in the payload but keep the ORIGINAL signature (what an attacker would try)."""
    header, payload, signature = token.split(".")
    claims = b64url_json(payload) | changes
    return f"{header}.{b64url_encode(claims)}.{signature}"


# ---------- register -------------------------------------------------------------
def test_register_creates_a_student_without_exposing_the_hash(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "jamie_lee", "full_name": "  Jamie Lee ", "password": "sunset2026"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "jamie_lee"
    assert body["full_name"] == "Jamie Lee"  # surrounding spaces stripped
    assert body["role"] == "student"
    assert "hashed_password" not in body and "password" not in body
    assert body["created_at"].endswith(("Z", "+00:00"))  # time zone included

    # …and the new account can log in straight away.
    assert get_token(client, "jamie_lee", "sunset2026")


def test_register_duplicate_username_is_409(client):
    response = client.post(
        "/api/auth/register", json={"username": "student", "full_name": "Copy Cat", "password": "abcdefg1"}
    )
    assert response.status_code == 409
    assert "already taken" in response.json()["detail"]


@pytest.mark.parametrize(
    ("payload", "field", "message_part"),
    [
        ({"username": "Bad Name!", "full_name": "X", "password": "abcdefg1"}, "username", "lowercase"),
        ({"username": "ab", "full_name": "X", "password": "abcdefg1"}, "username", "at least 3"),
        ({"username": "valid_name", "full_name": "X", "password": "short1"}, "password", "at least 8"),
        ({"username": "valid_name", "full_name": "X", "password": "onlyletters"}, "password", "letter and one digit"),
        ({"username": "valid_name", "full_name": "X", "password": "12345678"}, "password", "letter and one digit"),
        ({"username": "valid_name", "full_name": "   ", "password": "abcdefg1"}, "full_name", "at least 1"),
    ],
)
def test_register_invalid_input_is_422_with_the_field_name(client, payload, field, message_part):
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(e["loc"][-1] == field and message_part in e["msg"] for e in errors), errors


def test_register_cannot_choose_its_own_role(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "sneaky", "full_name": "Sneaky", "password": "abcdefg1", "role": "lecturer"},
    )
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "role"]


# ---------- login ----------------------------------------------------------------
def test_login_returns_a_bearer_token_and_the_user(client):
    response = client.post("/api/auth/login", data={"username": "student", "password": "student123"})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == settings.access_token_minutes * 60
    assert body["user"]["username"] == "student"
    assert "hashed_password" not in body["user"]

    claims = jwt.decode(body["access_token"], settings.secret_key, algorithms=[ALGORITHM])
    assert claims["sub"] == "student"
    assert claims["role"] == "student"
    assert claims["exp"] - claims["iat"] == settings.access_token_minutes * 60


def test_login_username_is_case_insensitive(client):
    assert get_token(client, "  Lecturer ", "lecturer123")


def test_login_minutes_parameter_shortens_the_token(client):
    response = client.post(
        "/api/auth/login", data={"username": "student", "password": "student123"}, params={"minutes": 1}
    )
    assert response.status_code == 200
    assert response.json()["expires_in"] == 60
    claims = b64url_json(response.json()["access_token"].split(".")[1])
    assert claims["exp"] - claims["iat"] == 60


def test_login_minutes_can_only_shorten_the_servers_policy(client, monkeypatch):
    # "Never trust the client": ?minutes= may shorten the lifetime, but never extend it.
    monkeypatch.setattr(settings, "access_token_minutes", 5)
    response = client.post(
        "/api/auth/login", data={"username": "student", "password": "student123"}, params={"minutes": 30}
    )
    assert response.status_code == 200
    assert response.json()["expires_in"] == 5 * 60


@pytest.mark.parametrize("minutes", [0, 31, "abc"])
def test_login_minutes_out_of_range_is_422(client, minutes):
    response = client.post(
        "/api/auth/login", data={"username": "student", "password": "student123"}, params={"minutes": minutes}
    )
    assert response.status_code == 422


def test_login_wrong_password_and_unknown_user_get_the_same_401(client):
    wrong = client.post("/api/auth/login", data={"username": "student", "password": "nope-nope1"})
    unknown = client.post("/api/auth/login", data={"username": "nobody_here", "password": "nope-nope1"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"detail": "Incorrect username or password."}
    assert wrong.headers["WWW-Authenticate"] == "Bearer"


def test_login_needs_form_data_not_json(client):
    # OAuth2PasswordRequestForm reads form fields – a JSON body means "fields missing".
    response = client.post("/api/auth/login", json={"username": "student", "password": "student123"})
    assert response.status_code == 422
    missing = {e["loc"][-1] for e in response.json()["detail"]}
    assert {"username", "password"} <= missing


# ---------- rate limiting --------------------------------------------------------
class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def test_five_failures_then_429_with_retry_after(client, monkeypatch):
    clock = FakeClock()
    monkeypatch.setattr(login_limiter, "clock", clock)
    bad = {"username": "student", "password": "wrong-pass1"}

    for _ in range(5):
        assert client.post("/api/auth/login", data=bad).status_code == 401
        clock.now += 1

    # 6th attempt – blocked even with the CORRECT password.
    blocked = client.post("/api/auth/login", data={"username": "student", "password": "student123"})
    assert blocked.status_code == 429
    retry_after = int(blocked.headers["Retry-After"])
    assert 1 <= retry_after <= login_limiter.window_seconds
    assert blocked.json()["detail"]["retry_after"] == retry_after
    assert "Too many" in blocked.json()["detail"]["message"]

    # Other usernames are not affected.
    assert client.post("/api/auth/login", data={"username": "lecturer", "password": "lecturer123"}).status_code == 200

    # After the window has passed, the right password works again.
    clock.now += login_limiter.window_seconds
    assert client.post("/api/auth/login", data={"username": "student", "password": "student123"}).status_code == 200


def test_parallel_guesses_cannot_slip_past_the_limit(client, monkeypatch):
    # Make every password check slow, then fire 10 guesses at the same moment. If the limiter
    # only recorded failures AFTER the slow check, all 10 would get through (401) – not 5.
    real_verify = auth.verify_password

    def slow_verify(password, stored):
        time.sleep(0.2)
        return real_verify(password, stored)

    monkeypatch.setattr(auth, "verify_password", slow_verify)

    def guess(n):
        return client.post("/api/auth/login", data={"username": "nobody_here", "password": f"guess-{n}"}).status_code

    with ThreadPoolExecutor(max_workers=10) as pool:
        codes = list(pool.map(guess, range(10)))
    assert codes.count(401) == login_limiter.max_failures
    assert codes.count(429) == 10 - login_limiter.max_failures


def test_acquire_is_atomic_across_threads():
    key = ("student", "127.0.0.1")
    with ThreadPoolExecutor(max_workers=10) as pool:
        waits = list(pool.map(lambda _: login_limiter.acquire(key), range(10)))
    assert waits.count(0) == login_limiter.max_failures  # exactly 5 attempts allowed


def test_old_usernames_are_forgotten(monkeypatch):
    # Password spraying tries MANY usernames. Keys whose attempts have all left the window
    # must be dropped, or memory grows for as long as the server runs.
    clock = FakeClock()
    monkeypatch.setattr(login_limiter, "clock", clock)
    for name in ("spray_a", "spray_b", "spray_c"):
        login_limiter.acquire((name, "10.0.0.9"))
    assert len(login_limiter._failures) == 3

    clock.now += login_limiter.window_seconds + 1
    login_limiter.acquire(("spray_d", "10.0.0.9"))
    assert list(login_limiter._failures) == [("spray_d", "10.0.0.9")]


def test_a_huge_username_is_401_and_stored_short(client):
    response = client.post("/api/auth/login", data={"username": "x" * 100_000, "password": "whatever1"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password."}
    assert max(len(username) for username, _ in login_limiter._failures) == 32


def test_a_successful_login_resets_the_failure_count(client):
    bad = {"username": "student", "password": "wrong-pass1"}
    for _ in range(4):
        client.post("/api/auth/login", data=bad)
    assert get_token(client)  # success → counter reset
    for _ in range(4):
        assert client.post("/api/auth/login", data=bad).status_code == 401  # still 401, not 429


# ---------- protected endpoints (401) --------------------------------------------
def test_me_without_a_token_is_401(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert "Authorization" in response.json()["detail"]


def test_missing_token_error_is_a_fresh_exception_each_time(session):
    # Raising ONE shared exception object again and again makes its traceback grow on every
    # request (a memory leak). Each request must get its own HTTPException.
    errors = []
    for _ in range(3):
        with pytest.raises(HTTPException) as caught:
            get_current_user(None, session)
        errors.append(caught.value)
    assert len({id(error) for error in errors}) == 3
    assert all(error.status_code == 401 for error in errors)
    depths = [len(traceback.extract_tb(error.__traceback__)) for error in errors]
    assert depths[0] == depths[-1]  # the traceback does not grow


def test_me_with_a_valid_token(client, login):
    response = client.get("/api/auth/me", headers=login())
    assert response.status_code == 200
    assert response.json()["username"] == "student"
    assert "hashed_password" not in response.json()


def test_tampered_token_is_401(client):
    token = get_token(client)
    forged = tamper(token, role="lecturer")
    # The forged payload READS fine – decoding is not verifying …
    assert b64url_json(forged.split(".")[1])["role"] == "lecturer"
    # … but the signature no longer matches, so the server refuses it.
    for path in ("/api/auth/me", "/api/auth/lecturer-only", "/api/auth/token-info"):
        response = client.get(path, headers=bearer(forged))
        assert response.status_code == 401, path
        assert "signature" in response.json()["detail"]
        assert response.headers["WWW-Authenticate"] == 'Bearer error="invalid_token"'


def test_expired_token_is_401(client):
    student = User(username="student", full_name="Alex Student", role="student", hashed_password="x")
    expired = create_access_token(student, minutes=-1)  # expired one minute ago
    response = client.get("/api/auth/me", headers=bearer(expired))
    assert response.status_code == 401
    assert "expired" in response.json()["detail"]


IN_FIVE_MINUTES = datetime.now(timezone.utc) + timedelta(minutes=5)
# Signed correctly – but with somebody else's secret.
WRONG_SECRET_TOKEN = jwt.encode(
    {"sub": "student", "exp": IN_FIVE_MINUTES}, "not-our-secret-key-but-32-bytes!", algorithm="HS256"
)
# "alg": "none" means "no signature at all" – a classic attack that pinning algorithms=[...] blocks.
UNSIGNED_TOKEN = ".".join(
    [b64url_encode({"alg": "none", "typ": "JWT"}), b64url_encode({"sub": "lecturer", "exp": 4102444800}), ""]
)


@pytest.mark.parametrize("token", ["not-a-jwt", WRONG_SECRET_TOKEN, UNSIGNED_TOKEN])
def test_forged_or_malformed_tokens_are_401(client, token):
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 401


def test_token_for_a_deleted_user_is_401(client):
    ghost = User(username="ghost", full_name="Gone", role="student", hashed_password="x")
    response = client.get("/api/auth/me", headers=bearer(create_access_token(ghost)))
    assert response.status_code == 401
    assert "no longer exists" in response.json()["detail"]


# ---------- PATCH /me --------------------------------------------------------------
def test_update_my_full_name(client, login):
    headers = login()
    response = client.patch("/api/auth/me", json={"full_name": "  Alex Q. Student "}, headers=headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Alex Q. Student"
    assert client.get("/api/auth/me", headers=headers).json()["full_name"] == "Alex Q. Student"

    # The token still carries the OLD name: claims are a snapshot from login time.
    info = client.get("/api/auth/token-info", headers=headers).json()
    assert info["claims"]["name"] == "Alex Student"
    assert info["user_in_database"]["full_name"] == "Alex Q. Student"


@pytest.mark.parametrize(
    "payload",
    [{"full_name": ""}, {"full_name": "   "}, {"full_name": "x" * 81}, {}, {"full_name": "Ok", "role": "lecturer"}],
)
def test_update_me_invalid_is_422(client, login, payload):
    assert client.patch("/api/auth/me", json=payload, headers=login()).status_code == 422


def test_update_me_without_token_is_401(client):
    assert client.patch("/api/auth/me", json={"full_name": "Hacker"}).status_code == 401


# ---------- roles (403) ----------------------------------------------------------
def test_lecturer_only_as_student_is_403(client, login):
    response = client.get("/api/auth/lecturer-only", headers=login("student", "student123"))
    assert response.status_code == 403
    assert "lecturer" in response.json()["detail"]


def test_lecturer_only_as_lecturer(client, login):
    response = client.get("/api/auth/lecturer-only", headers=login("lecturer", "lecturer123"))
    assert response.status_code == 200
    body = response.json()
    assert body["viewer"] == "Dr Sam Lecturer"
    assert body["unit_code"] == "COS30049"
    assert len(body["assessments"]) == 3


def test_lecturer_only_without_token_is_401_not_403(client):
    assert client.get("/api/auth/lecturer-only").status_code == 401


# ---------- token-info -----------------------------------------------------------
def test_token_info_shows_the_verified_claims(client):
    token = get_token(client, "lecturer", "lecturer123", minutes=5)
    response = client.get("/api/auth/token-info", headers=bearer(token))
    assert response.status_code == 200
    info = response.json()
    assert info["algorithm"] == "HS256"
    assert info["header"] == {"alg": "HS256", "typ": "JWT"}
    assert info["claims"]["sub"] == "lecturer"
    assert info["claims"]["role"] == "lecturer"
    assert 0 < info["expires_in_seconds"] <= 300
    assert info["user_in_database"]["username"] == "lecturer"


def test_token_info_without_token_is_401(client):
    assert client.get("/api/auth/token-info").status_code == 401


# ---------- documentation --------------------------------------------------------
def test_auth_endpoints_are_documented(client):
    schema = client.get("/api/openapi.json").json()
    paths = schema["paths"]
    assert {"post"} <= set(paths["/api/auth/register"]) and {"post"} <= set(paths["/api/auth/login"])
    assert {"get", "patch"} <= set(paths["/api/auth/me"])
    assert "403" in paths["/api/auth/lecturer-only"]["get"]["responses"]
    # The 429 answer documents its body ({detail: {message, retry_after}}) and its header.
    too_many = paths["/api/auth/login"]["post"]["responses"]["429"]
    assert too_many["content"]["application/json"]["schema"]["$ref"].endswith("/RateLimitedError")
    assert too_many["headers"]["Retry-After"]["schema"]["type"] == "integer"
    # The Authorize button in /api/docs knows where to log in.
    scheme = schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]
    assert scheme["flows"]["password"]["tokenUrl"] == "/api/auth/login"
