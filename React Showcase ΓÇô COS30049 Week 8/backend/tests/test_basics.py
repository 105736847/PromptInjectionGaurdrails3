"""
test_basics.py – tests for app/routers/basics.py (the "FastAPI Basics" page).

Each test sends a real HTTP request to the app (in memory, no server needed)
and checks the status code and the JSON – the same things the React page relies on.
Run:  .venv/bin/python -m pytest tests/test_basics.py
"""
import asyncio
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import basics

# A front-end origin that config.py allows (CORS). Browsers send it with every cross-origin request.
FRONT_END = "http://localhost:3000"

VALID_FEEDBACK = {
    "name": "Mia Chen",
    "email": "mia.chen@student.example.edu",
    "rating": 4,
    "comment": "The FastAPI lab was great.",
    "tags": ["labs", "pace"],
    "anonymous": False,
}


# ---------- 1. hello ----------------------------------------------------------
def test_hello_uses_the_query_parameter(client):
    response = client.get("/api/basics/hello", params={"name": "Mia"})
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Hello, Mia!"
    assert body["server_time"].endswith("Z") or "+00:00" in body["server_time"]


def test_hello_has_a_default_name(client):
    assert client.get("/api/basics/hello").json()["message"] == "Hello, World!"


# ---------- 2. path & query parameters ---------------------------------------
def test_unit_parameters_are_converted_to_python_types(client):
    response = client.get(
        "/api/basics/units/AIM30003",
        params={"semester": "2", "campus": "online", "include_assessments": "true", "limit": "2", "year": "2027"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Applied Machine Learning"
    assert (body["semester"], body["campus"], body["year"]) == (2, "online", 2027)
    assert len(body["assessments"]) == 2
    assert body["parsed"]["semester"] == "int: 2"
    assert body["parsed"]["include_assessments"] == "bool: True"
    assert body["parsed"]["year"] == "int: 2027"


def test_unit_defaults_apply_when_parameters_are_missing(client):
    body = client.get("/api/basics/units/WEB20001").json()
    assert body["semester"] == 1
    assert body["campus"] == "hawthorn"
    assert body["assessments"] is None  # include_assessments defaults to false
    assert body["parsed"]["year"] == "NoneType: None"


@pytest.mark.parametrize(
    ("path", "params", "loc", "error_type"),
    [
        ("/api/basics/units/web20001", {}, ["path", "unit_code"], "string_pattern_mismatch"),
        ("/api/basics/units/WEB20001", {"semester": "3"}, ["query", "semester"], "less_than_equal"),
        ("/api/basics/units/WEB20001", {"semester": "one"}, ["query", "semester"], "int_parsing"),
        ("/api/basics/units/WEB20001", {"campus": "mars"}, ["query", "campus"], "enum"),
        ("/api/basics/units/WEB20001", {"include_assessments": "maybe"}, ["query", "include_assessments"], "bool_parsing"),
        ("/api/basics/units/WEB20001", {"limit": "0"}, ["query", "limit"], "greater_than_equal"),
        ("/api/basics/units/WEB20001", {"limit": "6"}, ["query", "limit"], "less_than_equal"),
        ("/api/basics/units/WEB20001", {"year": "2019"}, ["query", "year"], "greater_than_equal"),
        ("/api/basics/units/WEB20001", {"year": "2031"}, ["query", "year"], "less_than_equal"),
    ],
)
def test_wrong_parameter_types_give_422(client, path, params, loc, error_type):
    response = client.get(path, params=params)
    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == loc
    assert error["type"] == error_type
    assert error["msg"]


def test_unknown_unit_with_a_valid_code_is_404(client):
    response = client.get("/api/basics/units/ZZZ99999")
    assert response.status_code == 404
    assert "ZZZ99999" in response.json()["detail"]


# ---------- 3. request body + Pydantic ----------------------------------------
def test_valid_feedback_is_created_with_server_fields(client):
    response = client.post("/api/basics/feedback", json=VALID_FEEDBACK)
    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert body["received_at"]
    assert body["name"] == "Mia Chen"
    assert body["tags"] == ["labs", "pace"]


def test_feedback_ids_increase(client):
    first = client.post("/api/basics/feedback", json=VALID_FEEDBACK).json()["id"]
    second = client.post("/api/basics/feedback", json=VALID_FEEDBACK).json()["id"]
    assert second > first


def test_anonymous_feedback_needs_no_name_or_email(client):
    response = client.post("/api/basics/feedback", json={"rating": 4, "anonymous": True})
    assert response.status_code == 201
    assert (response.json()["name"], response.json()["email"]) == ("Anonymous", None)


def test_anonymous_feedback_throws_away_a_name_and_email_it_was_sent(client):
    body = client.post("/api/basics/feedback", json={**VALID_FEEDBACK, "anonymous": True}).json()
    assert body["name"] == "Anonymous"
    assert body["email"] is None


@pytest.mark.parametrize("missing", ["name", "email"])
def test_name_and_email_are_required_unless_anonymous(client, missing):
    feedback = {key: value for key, value in VALID_FEEDBACK.items() if key != missing}
    response = client.post("/api/basics/feedback", json=feedback)
    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body"]  # a model_validator rule → the whole body, not one field
    assert "anonymously" in error["msg"]


def test_feedback_strips_whitespace_and_removes_duplicate_tags(client):
    body = client.post(
        "/api/basics/feedback", json={**VALID_FEEDBACK, "name": "  Mia  ", "tags": ["labs", "labs", "pace"]}
    ).json()
    assert body["name"] == "Mia"
    assert body["tags"] == ["labs", "pace"]


def error_fields(response) -> dict[str, str]:
    """{last part of loc: type} – the same mapping client.js's fieldErrors uses."""
    return {error["loc"][-1]: error["type"] for error in response.json()["detail"]}


def test_feedback_field_errors_point_at_each_field(client):
    bad = {"name": "M", "email": "not-an-email", "rating": 9, "comment": "x" * 501, "tags": ["food"], "anonymous": "nah"}
    response = client.post("/api/basics/feedback", json=bad)
    assert response.status_code == 422
    fields = error_fields(response)
    assert fields["name"] == "string_too_short"
    assert fields["email"] == "value_error"
    assert fields["rating"] == "less_than_equal"
    assert fields["comment"] == "string_too_long"
    assert fields[0] == "literal_error"  # tags[0] → loc ends with the list index
    assert fields["anonymous"] == "bool_parsing"


def test_feedback_field_validator_rejects_digits_in_name(client):
    response = client.post("/api/basics/feedback", json={**VALID_FEEDBACK, "name": "Mia 2"})
    assert response.status_code == 422
    assert "digits" in response.json()["detail"][0]["msg"]


def test_feedback_rejects_more_than_five_tags_and_extra_fields(client):
    too_many = ["content", "pace", "labs", "assessments", "resources", "other"]
    response = client.post("/api/basics/feedback", json={**VALID_FEEDBACK, "tags": too_many, "is_admin": True})
    assert response.status_code == 422
    fields = error_fields(response)
    assert fields["tags"] == "too_long"
    assert fields["is_admin"] == "extra_forbidden"


def test_feedback_model_validator_needs_a_comment_for_low_ratings(client):
    response = client.post("/api/basics/feedback", json={**VALID_FEEDBACK, "rating": 1, "comment": "bad"})
    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body"]  # a model-level error belongs to no single field
    assert "comment" in error["msg"]


def test_feedback_requires_a_json_body(client):
    response = client.post("/api/basics/feedback")
    assert response.status_code == 422


# ---------- 4. status codes ---------------------------------------------------
@pytest.mark.parametrize("code", [200, 201, 400, 401, 403, 404, 409, 418, 429, 500])
def test_status_endpoint_answers_with_the_requested_code(client, code):
    response = client.get(f"/api/basics/status/{code}")
    assert response.status_code == code
    body = response.json()
    assert ("detail" in body) == (code >= 400)


def test_status_extras(client):
    assert client.get("/api/basics/status/201").headers["location"] == "/api/basics/feedback/42"
    no_content = client.get("/api/basics/status/204")
    assert no_content.status_code == 204
    assert no_content.content == b""
    assert client.get("/api/basics/status/401").headers["www-authenticate"] == "Bearer"
    assert client.get("/api/basics/status/429").headers["retry-after"] == "30"
    no_example = client.get("/api/basics/status/302")
    assert no_example.status_code == 404
    assert "not-a-number" in no_example.json()["detail"]  # points you to the 422 example
    # Path(ge=100, le=599): anything that is not an HTTP status code is a 422.
    for not_a_code in ("not-a-number", "99", "600"):
        assert client.get(f"/api/basics/status/{not_a_code}").status_code == 422


def test_http_errors_carry_cors_headers(client):
    # An HTTPException becomes a normal response INSIDE CORSMiddleware, so a React app on
    # another origin (VITE_API_URL in production) may read the error.
    response = client.get("/api/basics/status/500", headers={"Origin": FRONT_END})
    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == FRONT_END


def test_crash_is_turned_into_a_json_500():
    # The shared `client` fixture re-raises server errors; this one behaves like a real
    # browser. (No `with` block: the endpoint needs no database, so skip the start-up code.)
    browser_like = TestClient(app, raise_server_exceptions=False)
    response = browser_like.get("/api/basics/crash")
    assert response.status_code == 500
    assert response.json() == {"detail": "Something went wrong on the server."}


@pytest.mark.xfail(reason="main.py's catch-all 500 handler runs in ServerErrorMiddleware, OUTSIDE "
                          "CORSMiddleware, so a crash answer has no CORS headers (a cross-origin "
                          "browser reports it as a network error). Passes once main.py is fixed.")
def test_crash_500_reaches_a_front_end_on_another_origin():
    browser_like = TestClient(app, raise_server_exceptions=False)
    response = browser_like.get("/api/basics/crash", headers={"Origin": FRONT_END})
    assert response.status_code == 500
    assert response.headers.get("access-control-allow-origin") == FRONT_END


# ---------- 5. response_model -------------------------------------------------
def test_response_model_hides_secret_fields(client):
    safe = client.get("/api/basics/profiles/1").json()
    unsafe = client.get("/api/basics/profiles/1/unsafe").json()
    assert set(safe) == {"id", "username", "full_name", "role"}
    assert {"password_hash", "api_secret", "internal_notes"} <= set(unsafe)
    assert set(safe) < set(unsafe)


def test_unknown_profile_is_404(client):
    assert client.get("/api/basics/profiles/99").status_code == 404
    assert client.get("/api/basics/profiles/99/unsafe").status_code == 404


# ---------- 6. dependencies ---------------------------------------------------
def test_pagination_dependency_is_shared_by_two_endpoints(client):
    for path in ("/api/basics/units", "/api/basics/events"):
        body = client.get(path, params={"skip": 2, "limit": 3}).json()
        assert (body["skip"], body["limit"], len(body["items"])) == (2, 3, 3)
        assert body["total"] >= 5


def test_pagination_search_and_validation(client):
    body = client.get("/api/basics/units", params={"q": "machine"}).json()
    assert body["total"] == 1
    assert body["items"][0]["code"] == "AIM30003"
    assert client.get("/api/basics/events", params={"limit": 50}).status_code == 422
    assert client.get("/api/basics/units", params={"skip": -1}).status_code == 422


def test_api_key_header_dependency(client):
    missing = client.get("/api/basics/staff/notes")
    assert missing.status_code == 401
    assert "X-API-Key" in missing.json()["detail"]
    wrong = client.get("/api/basics/staff/notes", headers={"X-API-Key": "guess"})
    assert wrong.status_code == 401
    ok = client.get("/api/basics/staff/notes", headers={"x-api-key": "teaching-key"}, params={"limit": 2})
    assert ok.status_code == 200
    assert len(ok.json()["items"]) == 2


# ---------- 7. slow & flaky ---------------------------------------------------
def test_slow_waits_and_counts(client):
    before = client.get("/api/basics/slow/stats").json()["completed"]
    body = client.get("/api/basics/slow", params={"seconds": 0.2}).json()
    assert body["requested_seconds"] == 0.2
    assert body["waited_seconds"] >= 0.2
    assert client.get("/api/basics/slow/stats").json()["completed"] == before + 1


class GoneRequest:
    """A stand-in for fastapi.Request whose client has already hung up."""

    async def is_disconnected(self) -> bool:
        return True


def test_slow_stops_early_when_the_client_disconnects():
    # Call the endpoint function directly (no HTTP): with a client that is gone it must
    # stop at the first check instead of sleeping for 5 seconds.
    before = basics.SLOW_STATS["stopped_early"]
    result = asyncio.run(basics.slow(GoneRequest(), seconds=5))
    assert result.waited_seconds < 0.2
    assert basics.SLOW_STATS["stopped_early"] == before + 1


def test_slow_is_capped(client):
    assert client.get("/api/basics/slow", params={"seconds": 11}).status_code == 422
    assert client.get("/api/basics/slow", params={"seconds": -1}).status_code == 422


def test_flaky_fails_then_succeeds(client):
    key = uuid.uuid4().hex
    codes = [client.get("/api/basics/flaky", params={"key": key, "fail_times": 2}).status_code for _ in range(3)]
    assert codes == [503, 503, 200]
    assert client.get("/api/basics/flaky", params={"key": key}).json()["attempt"] == 4


def test_flaky_says_when_to_retry_and_checks_its_parameters(client):
    failed = client.get("/api/basics/flaky", params={"key": uuid.uuid4().hex, "fail_times": 1})
    assert failed.status_code == 503
    assert failed.headers["retry-after"] == "1"
    assert client.get("/api/basics/flaky", params={"key": "x", "fail_times": 6}).status_code == 422
    assert client.get("/api/basics/flaky").status_code == 422  # key is required


# ---------- docs --------------------------------------------------------------
def test_endpoints_are_documented_in_openapi(client):
    paths = client.get("/api/openapi.json").json()["paths"]
    for path in ("/api/basics/hello", "/api/basics/units/{unit_code}", "/api/basics/feedback",
                 "/api/basics/status/{code}", "/api/basics/profiles/{user_id}", "/api/basics/staff/notes",
                 "/api/basics/slow", "/api/basics/flaky"):
        assert path in paths
    assert paths["/api/basics/hello"]["get"]["tags"] == ["basics"]
    # The header dependency shows up as a documented header parameter.
    params = paths["/api/basics/staff/notes"]["get"]["parameters"]
    assert any(p["in"] == "header" and p["name"] == "x-api-key" for p in params)


def test_openapi_documents_descriptions_and_error_responses(client):
    paths = client.get("/api/openapi.json").json()["paths"]
    operations = [op for path, item in paths.items() if path.startswith("/api/basics") for op in item.values()]
    assert all(op.get("summary") and op.get("description") for op in operations)  # docstrings → docs
    expected_errors = {
        "/api/basics/units/{unit_code}": "404",
        "/api/basics/profiles/{user_id}": "404",
        "/api/basics/staff/notes": "401",
        "/api/basics/flaky": "503",
        "/api/basics/crash": "500",
    }
    for path, code in expected_errors.items():
        documented = paths[path]["get"]["responses"][code]
        assert documented["content"]["application/json"]["schema"] == {"$ref": "#/components/schemas/ErrorOut"}
    assert "Retry-After" in paths["/api/basics/flaky"]["get"]["responses"]["503"]["headers"]
    # Path(examples=[...]) pre-fills /api/docs and the page's playground with a code that has an example.
    code = paths["/api/basics/status/{code}"]["get"]["parameters"][0]["schema"]
    assert client.get(f"/api/basics/status/{code['examples'][0]}").status_code == code["examples"][0]
