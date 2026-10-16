"""
test_students.py – tests for the Students CRUD API.

Every test gets a fresh in-memory database that the seeder filled with the 60
demo students (see conftest.py), so tests never affect each other or app.db.
"""
from datetime import date, datetime, timedelta, timezone
from typing import get_args

import pytest
from sqlmodel import func, select

from app.database import init_db
from app.models.student import SortField, Student
from app.routers import students

NEW_STUDENT = {
    "student_id": "109900001",
    "first_name": "Juno",
    "last_name": "Marsh",
    "email": "juno.marsh@student.example.edu",
    "major": "Data Science",
    "campus": "Online",
    "year": 2,
    "score": 88,
    "status": "active",
    "enrolled": "2025-02-24",
}


def first_student(client) -> dict:
    return client.get("/api/students", params={"sort": "id", "page_size": 1}).json()["items"][0]


# ---------- list: paging, sorting, filtering, searching ---------------------------------
def test_list_returns_first_page_with_paging_info(client):
    body = client.get("/api/students").json()
    assert body["total"] == 60
    assert body["page"] == 1 and body["page_size"] == 10 and body["pages"] == 6
    assert len(body["items"]) == 10
    assert {"id", "student_id", "email", "grade"} <= body["items"][0].keys()


def test_pages_do_not_overlap_and_cover_everything(client):
    ids = []
    for page in range(1, 5):
        body = client.get("/api/students", params={"page": page, "page_size": 20, "sort": "score"}).json()
        ids += [s["id"] for s in body["items"]]
    assert len(ids) == len(set(ids)) == 60  # the id tie-breaker keeps the order stable


@pytest.mark.parametrize("order", ["asc", "desc"])
def test_sort_by_score(client, order):
    items = client.get("/api/students", params={"sort": "score", "order": order, "page_size": 100}).json()["items"]
    scores = [s["score"] for s in items]
    assert scores == sorted(scores, reverse=order == "desc")


def test_sort_column_must_be_whitelisted(client):
    response = client.get("/api/students", params={"sort": "score; DROP TABLE student"})
    assert response.status_code == 422
    assert client.get("/api/students").json()["total"] == 60  # table still there


@pytest.mark.parametrize("sort", get_args(SortField))
def test_every_whitelisted_sort_column_works(client, sort):
    assert client.get("/api/students", params={"sort": sort, "order": "desc"}).status_code == 200


def test_ties_are_sorted_by_name(client):
    items = client.get("/api/students", params={"sort": "last_name", "page_size": 100}).json()["items"]
    names = [(s["last_name"], s["first_name"]) for s in items]
    assert names == sorted(names)  # "Ali, Caleb" before "Ali, Elif" – not in id order


@pytest.mark.parametrize(
    "params",
    [
        {"page_size": 101},
        {"page_size": 0},
        {"page": 0},
        {"page": 100_001},
        {"page": 4611686018427387904},  # (page - 1) × page_size would overflow SQLite's INTEGER
        {"year": 5},
        {"major": "Magic"},
        {"order": "sideways"},
        {"q": "a" * 101},
    ],
)
def test_invalid_query_parameters_are_rejected(client, params):
    assert client.get("/api/students", params=params).status_code == 422


def test_filters_combine_with_and(client):
    body = client.get("/api/students", params={"major": "Cybersecurity", "status": "active", "page_size": 100}).json()
    assert body["total"] == len(body["items"]) > 0
    assert all(s["major"] == "Cybersecurity" and s["status"] == "active" for s in body["items"])


def test_search_matches_full_name_email_and_student_id(client):
    student = first_student(client)
    full_name = f"{student['first_name']} {student['last_name']}".upper()  # case-insensitive
    for term in (full_name, student["email"].split("@")[0], student["student_id"][2:7]):
        ids = [s["id"] for s in client.get("/api/students", params={"q": term, "page_size": 100}).json()["items"]]
        assert student["id"] in ids, term


def test_search_treats_wildcards_and_quotes_literally(client):
    for term in ("%", "_", "' OR 1=1 --"):
        assert client.get("/api/students", params={"q": term}).json()["total"] == 0


def test_page_after_the_last_one_is_empty(client):
    body = client.get("/api/students", params={"page": 99}).json()
    assert body["items"] == [] and body["total"] == 60


# ---------- read one ---------------------------------------------------------------------
def test_get_one_and_404(client):
    student = first_student(client)
    assert client.get(f"/api/students/{student['id']}").json() == student
    response = client.get("/api/students/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_stats_route_is_not_mistaken_for_an_id(client):
    assert client.get("/api/students/stats").status_code == 200
    assert client.get("/api/students/abc").status_code == 422


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
@pytest.mark.parametrize("id", [0, 2**31, 9223372036854775808, 10**22])
def test_out_of_range_id_is_422_not_500(client, method, id):
    # Too big for the database's INTEGER → must be rejected before any SQL runs.
    kwargs = {"json": {"score": 50}} if method == "patch" else {}
    assert client.request(method, f"/api/students/{id}", **kwargs).status_code == 422


def test_rows_that_break_newer_rules_can_still_be_read(client, session):
    # A row from DB Browser for SQLite or from before a rule was tightened.
    # Table models skip validation, so this goes straight into the database.
    # "1099000001" is a 10-digit legacy ID – longer than the column's max_length=9.
    old = Student(student_id="1099000001", first_name="Ada", last_name="Aaron", email="not-an-email",
                  major="Robotics", campus="Hawthorn", year=7, score=50, enrolled=date(1990, 1, 1))
    session.add(old)
    session.commit()
    assert client.get(f"/api/students/{old.id}").json()["student_id"] == "1099000001"
    assert client.get("/api/students", params={"page_size": 100}).json()["total"] == 61


# ---------- create ----------------------------------------------------------------------
def test_create_returns_201_with_id_and_grade(client):
    response = client.post("/api/students", json={**NEW_STUDENT, "email": "Juno.Marsh@Student.Example.edu"})
    assert response.status_code == 201
    body = response.json()
    assert body["id"] > 60 and body["grade"] == "HD"
    assert body["email"] == "juno.marsh@student.example.edu"  # normalised to lower case
    assert client.get(f"/api/students/{body['id']}").status_code == 200


def test_create_duplicate_returns_409_per_field(client):
    existing = first_student(client)
    response = client.post(
        "/api/students", json={**NEW_STUDENT, "student_id": existing["student_id"], "email": existing["email"].upper()}
    )
    assert response.status_code == 409
    fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert fields == {"student_id", "email"}


def test_create_invalid_returns_422_with_field_locations(client):
    bad = {**NEW_STUDENT, "student_id": "12ab", "email": "nope", "score": 120, "year": 9, "enrolled": "2999-01-01"}
    response = client.post("/api/students", json=bad)
    assert response.status_code == 422
    errors = {error["loc"][-1]: error["msg"] for error in response.json()["detail"]}
    assert set(errors) == {"student_id", "email", "score", "year", "enrolled"}
    assert errors["student_id"] == "Student ID must be exactly 9 digits."


@pytest.mark.parametrize("student_id", ["١٢٣٤٥٦٧٨٩", "１０９９００００２", "²²²²²²²²²", "10990000 ", "1099000001"])
def test_student_id_means_nine_ascii_digits(client, student_id):
    # Python's str.isdigit() and \d accept the digits of other scripts – [0-9] does not.
    response = client.post("/api/students", json={**NEW_STUDENT, "student_id": student_id})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "student_id"]


@pytest.mark.parametrize(
    "field, value",
    [("year", True), ("year", "2"), ("score", True), ("enrolled", "0001-01-01"), ("enrolled", "1999-12-31")],
)
def test_no_type_juggling_or_implausible_dates(client, field, value):
    response = client.post("/api/students", json={**NEW_STUDENT, field: value})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", field]


def test_enrolment_date_uses_the_latest_time_zone(client):
    # A user in Melbourne may already be on a date that is still "tomorrow" in UTC.
    latest_today = datetime.now(timezone(timedelta(hours=14))).date()
    ok = client.post("/api/students", json={**NEW_STUDENT, "enrolled": latest_today.isoformat()})
    assert ok.status_code == 201
    tomorrow = (latest_today + timedelta(days=1)).isoformat()
    too_late = client.post("/api/students", json={**NEW_STUDENT, "student_id": "109900002", "enrolled": tomorrow})
    assert too_late.status_code == 422


def test_client_cannot_choose_the_id(client):
    body = client.post("/api/students", json={**NEW_STUDENT, "id": 1}).json()
    assert body["id"] != 1


def test_race_condition_still_gives_a_per_field_409(client, monkeypatch):
    # Simulate two requests at the same moment: the friendly pre-check misses the
    # duplicate (the other request had not committed yet), so the database's
    # UNIQUE constraint fires. The answer must still name the field.
    existing = first_student(client)
    real_check = students.ensure_unique
    calls = []

    def misses_the_first_time(*args, **kwargs):
        calls.append(kwargs)
        if len(calls) > 1:
            real_check(*args, **kwargs)

    monkeypatch.setattr(students, "ensure_unique", misses_the_first_time)
    response = client.post("/api/students", json={**NEW_STUDENT, "student_id": existing["student_id"]})
    assert response.status_code == 409
    assert [error["loc"][-1] for error in response.json()["detail"]] == ["student_id"]
    assert len(calls) == 2


# ---------- update ----------------------------------------------------------------------
def test_patch_changes_only_the_fields_sent(client):
    student = first_student(client)
    response = client.patch(f"/api/students/{student['id']}", json={"score": 45.5, "status": "at_risk"})
    assert response.status_code == 200
    updated = response.json()
    assert updated["score"] == 45.5 and updated["grade"] == "N" and updated["status"] == "at_risk"
    unchanged = {k: v for k, v in updated.items() if k not in ("score", "status", "grade")}
    assert unchanged == {k: v for k, v in student.items() if k not in ("score", "status", "grade")}


def test_patch_rejects_null_and_invalid_values(client):
    student = first_student(client)
    response = client.patch(f"/api/students/{student['id']}", json={"first_name": None, "score": -1})
    assert response.status_code == 422
    assert {error["loc"][-1] for error in response.json()["detail"]} == {"first_name", "score"}


@pytest.mark.parametrize("field", ["email", "student_id"])
def test_patch_duplicate_is_409_but_own_value_is_fine(client, field):
    first, second = client.get("/api/students", params={"sort": "id", "page_size": 2}).json()["items"]
    response = client.patch(f"/api/students/{first['id']}", json={field: second[field]})
    assert response.status_code == 409
    assert response.json()["detail"][0]["loc"] == ["body", field]
    assert client.patch(f"/api/students/{first['id']}", json={field: first[field]}).status_code == 200


def test_patch_missing_student_is_404(client):
    assert client.patch("/api/students/99999", json={"score": 50}).status_code == 404


# ---------- delete ----------------------------------------------------------------------
def test_delete_returns_204_then_404(client):
    student = first_student(client)
    response = client.delete(f"/api/students/{student['id']}")
    assert response.status_code == 204 and response.content == b""
    assert client.get(f"/api/students/{student['id']}").status_code == 404
    assert client.delete(f"/api/students/{student['id']}").status_code == 404


def test_deleted_ids_are_never_reused(client):
    created = client.post("/api/students", json=NEW_STUDENT).json()
    client.delete(f"/api/students/{created['id']}")
    again = client.post("/api/students", json=NEW_STUDENT).json()  # "undo" = create again
    assert again["id"] > created["id"]


# ---------- stats + reset ---------------------------------------------------------------
def test_stats_are_consistent(client):
    stats = client.get("/api/students/stats").json()
    assert stats["total"] == 60
    assert [g["label"] for g in stats["grades"]] == ["HD", "D", "C", "P", "N"]
    for group in ("grades", "by_major", "by_status", "by_campus"):
        assert sum(bucket["count"] for bucket in stats[group]) == 60
    assert 0 <= stats["pass_rate"] <= 1 and 0 <= stats["average_score"] <= 100
    passed = sum(g["count"] for g in stats["grades"] if g["label"] != "N")
    assert stats["pass_rate"] == pytest.approx(passed / 60, abs=0.001)


def test_stats_follow_changes(client):
    before = client.get("/api/students/stats").json()
    client.post("/api/students", json=NEW_STUDENT)  # an HD student
    after = client.get("/api/students/stats").json()
    assert after["total"] == before["total"] + 1
    assert after["grades"][0]["count"] == before["grades"][0]["count"] + 1


def test_reset_restores_the_seed_data(client):
    student = first_student(client)
    client.delete(f"/api/students/{student['id']}")
    client.post("/api/students", json=NEW_STUDENT)
    response = client.post("/api/students/reset")
    assert response.status_code == 200 and response.json() == {"restored": 60}
    assert client.get("/api/students").json()["total"] == 60
    assert client.get(f"/api/students/{student['id']}").json() == student  # same id and data again


def test_seeding_twice_does_not_duplicate(engine, session):
    init_db(engine)  # e.g. the server restarts – the table is not empty any more
    assert session.exec(select(func.count()).select_from(Student)).one() == 60


def test_endpoints_are_documented(client):
    openapi = client.get("/api/openapi.json").json()
    paths, schemas = openapi["paths"], openapi["components"]["schemas"]
    assert set(paths["/api/students"]) == {"get", "post"}
    assert set(paths["/api/students/{id}"]) == {"get", "patch", "delete"}
    assert "/api/students/stats" in paths and "/api/students/reset" in paths
    # The error bodies and the rules are part of the contract, so /api/docs shows them.
    assert "content" in paths["/api/students"]["post"]["responses"]["409"]
    assert "content" in paths["/api/students/{id}"]["delete"]["responses"]["404"]
    assert schemas["StudentCreate"]["properties"]["student_id"]["pattern"] == "^[0-9]{9}$"
    assert schemas["StudentUpdate"]["properties"]["first_name"]["type"] == "string"  # null is not allowed
