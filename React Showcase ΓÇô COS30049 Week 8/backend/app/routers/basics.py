"""
basics.py – every endpoint used by the "FastAPI Basics" page (/fastapi).

The file is ordered like the page, so you can read it top to bottom:

  1. Your first endpoint ........ GET  /api/basics/hello
  2. Path & query parameters .... GET  /api/basics/units/{unit_code}
  3. Request body + Pydantic .... POST /api/basics/feedback
  4. Status codes & errors ...... GET  /api/basics/status/{code}   GET /api/basics/crash
  5. response_model ............. GET  /api/basics/profiles/{user_id}   (+ an UNSAFE twin)
  6. Dependencies (Depends) ..... GET  /api/basics/units   /events   /staff/notes
  7. Slow responses ............. GET  /api/basics/slow   /slow/stats   /flaky

All data is fictional and lives in plain Python lists/dicts (no database), so each
example stays small. The "# region" / "# endregion" comments let the React page show
just the part of this file that belongs to each demo (VS Code can fold them too).
"""
import asyncio
import itertools
import os
import secrets
import time
from collections.abc import Callable
from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated, Any, Generic, Literal, TypeVar

from fastapi import APIRouter, Depends, Header, HTTPException, Path, Query, Request, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

# region router
# One APIRouter per feature file. main.py adds it to the app with app.include_router(router).
# Every path below starts with /api/basics, and /api/docs lists them under "basics".
router = APIRouter(prefix="/api/basics", tags=["basics"])


class ErrorOut(BaseModel):
    """The body of an HTTPException: {"detail": "..."}. Listing it in an endpoint's
    responses={404: {"model": ErrorOut}} makes /api/docs show that error too."""
    detail: str


def utc_now() -> datetime:
    # Always send times in UTC (with a timezone!) and let the browser convert them.
    return datetime.now(timezone.utc)
# endregion


# region hello
class Greeting(BaseModel):
    message: str
    server_time: datetime


@router.get("/hello", summary="Your first endpoint")
def hello(name: str = "World") -> Greeting:
    """`name` is a query parameter: /api/basics/hello?name=Mia"""
    # A plain `str` accepts ANY text – even "" or 20,000 characters. Real endpoints add
    # limits with Query(min_length=..., max_length=...), like get_unit() below.
    return Greeting(message=f"Hello, {name}!", server_time=utc_now())
# endregion


# region units
class Campus(StrEnum):
    # An Enum limits a parameter to fixed values – /api/docs shows them as a dropdown.
    hawthorn = "hawthorn"
    sarawak = "sarawak"
    online = "online"


class Assessment(BaseModel):
    title: str
    weight: int  # percent of the final mark
    due_week: int


class UnitInfo(BaseModel):
    code: str
    title: str
    credit_points: float
    semester: int
    year: int
    campus: Campus
    assessments: list[Assessment] | None = None  # only when include_assessments=true
    parsed: dict[str, str]  # teaching aid: the Python type FastAPI gave each parameter


# A fictional unit catalogue (a real app would read this from a database).
UNITS: dict[str, dict[str, Any]] = {
    "WEB20001": {"title": "Web Front-End Foundations", "credit_points": 12.5, "assessments": [
        ("Portfolio: HTML & CSS", 20, 4), ("React component library", 30, 8),
        ("Accessibility audit", 15, 10), ("Final project", 35, 12)]},
    "DAT20002": {"title": "Data Wrangling with Python", "credit_points": 12.5, "assessments": [
        ("pandas lab book", 25, 5), ("Data cleaning report", 35, 9), ("Exam", 40, 14)]},
    "AIM30003": {"title": "Applied Machine Learning", "credit_points": 12.5, "assessments": [
        ("Model comparison notebook", 25, 5), ("Feature engineering quiz", 10, 7),
        ("Serving a model with FastAPI", 30, 10), ("Group project demo", 35, 12)]},
    "SEC20004": {"title": "Secure Web Services", "credit_points": 12.5, "assessments": [
        ("Threat model", 30, 6), ("Pen-test write-up", 30, 10), ("Exam", 40, 14)]},
    "UXD10005": {"title": "Designing for Users", "credit_points": 12.5, "assessments": [
        ("Persona & journey map", 30, 4), ("Usability test", 30, 8), ("Prototype pitch", 40, 12)]},
    "CLD30006": {"title": "Cloud Deployment Studio", "credit_points": 12.5, "assessments": [
        ("Dockerise an API", 30, 5), ("CI/CD pipeline", 30, 9), ("Production launch", 40, 12)]},
    "MOB20007": {"title": "Mobile App Prototyping", "credit_points": 12.5, "assessments": [
        ("Wireframes", 20, 3), ("Offline-first app", 40, 9), ("App store pitch", 40, 12)]},
    "NET10008": {"title": "Networks for Developers", "credit_points": 12.5, "assessments": [
        ("Packet capture lab", 30, 4), ("HTTP from scratch", 30, 8), ("Exam", 40, 14)]},
    "DBS20009": {"title": "Database Design & SQL", "credit_points": 12.5, "assessments": [
        ("ER diagram", 20, 4), ("SQL challenge set", 40, 8), ("Exam", 40, 14)]},
    "VIS30010": {"title": "Information Visualisation", "credit_points": 12.5, "assessments": [
        ("Chart critique", 20, 3), ("D3 dashboard", 45, 10), ("Showcase poster", 35, 12)]},
    "ETH10011": {"title": "Ethics in Computing", "credit_points": 12.5, "assessments": [
        ("Case study essay", 50, 7), ("Debate", 50, 11)]},
    "INN30012": {"title": "Innovation Capstone", "credit_points": 25.0, "assessments": [
        ("Proposal", 15, 3), ("Sprint reviews", 35, 10), ("Final showcase", 50, 12)]},
}

# Path(pattern=...) checks the text BEFORE your function runs: three capitals + five digits.
UnitCode = Annotated[
    str,
    Path(pattern=r"^[A-Z]{3}\d{5}$", description="Three capital letters + five digits", examples=["WEB20001"]),
]


@router.get("/units/{unit_code}", summary="Path & query parameters",
            responses={404: {"model": ErrorOut, "description": "The code is valid, but there is no such unit"}})
def get_unit(
    unit_code: UnitCode,                                              # path:  /units/WEB20001
    semester: Annotated[int, Query(ge=1, le=2)] = 1,                  # query: ?semester=2
    campus: Campus = Campus.hawthorn,                                 # query: ?campus=online
    include_assessments: bool = False,                                # query: ?include_assessments=true
    limit: Annotated[int, Query(ge=1, le=5, description="Max assessments")] = 3,
    year: Annotated[int | None, Query(ge=2020, le=2030)] = None,      # optional: may be missing
) -> UnitInfo:
    """Every parameter arrives as TEXT in the URL; FastAPI converts it to the type you declared."""
    unit = UNITS.get(unit_code)
    if unit is None:
        # The format was fine (so no 422) – the unit just doesn't exist → 404.
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"There is no unit {unit_code}. Try WEB20001 or AIM30003.")

    assessments = None
    if include_assessments:
        assessments = [Assessment(title=t, weight=w, due_week=d) for t, w, d in unit["assessments"][:limit]]

    params = {"unit_code": unit_code, "semester": semester, "campus": campus,
              "include_assessments": include_assessments, "limit": limit, "year": year}
    return UnitInfo(
        code=unit_code,
        title=unit["title"],
        credit_points=unit["credit_points"],
        semester=semester,
        year=year or utc_now().year,  # a missing optional parameter is None → use a default
        campus=campus,
        assessments=assessments,
        parsed={name: f"{type(value).__name__}: {value!r}" for name, value in params.items()},
    )
# endregion


# region feedback
Topic = Literal["content", "pace", "labs", "assessments", "resources", "other"]


class FeedbackIn(BaseModel):
    """What the client must send. Anything that doesn't fit is rejected with 422."""

    # extra="forbid": unknown keys (e.g. "is_admin": true) are an error, not silently ignored.
    # str_strip_whitespace: "  Mia  " becomes "Mia" before the length checks run.
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    # Optional (default None): an anonymous post doesn't need them – see the model_validator below.
    name: str | None = Field(default=None, min_length=2, max_length=40, examples=["Mia Chen"])
    email: EmailStr | None = Field(default=None, examples=["mia.chen@student.example.edu"])  # needs email-validator
    rating: int = Field(ge=1, le=5, description="1 = poor … 5 = excellent")
    comment: str = Field(default="", max_length=500)
    tags: list[Topic] = Field(default_factory=list, max_length=5)
    anonymous: bool = False

    @field_validator("name")
    @classmethod
    def name_has_no_digits(cls, value: str | None) -> str | None:
        # A rule Field() can't express → write a validator. Raise ValueError = 422 for this field.
        if value is not None and any(char.isdigit() for char in value):
            raise ValueError("Names can't contain digits")
        return value

    @field_validator("tags")
    @classmethod
    def remove_duplicate_tags(cls, value: list[str]) -> list[str]:
        # Validators may also CLEAN data: ["labs", "labs"] → ["labs"].
        return list(dict.fromkeys(value))

    @model_validator(mode="after")
    def name_and_email_unless_anonymous(self) -> "FeedbackIn":
        # A rule about SEVERAL fields. It only runs when every field above is valid.
        # Don't collect personal data you don't need: anonymous posts may leave both out.
        if not self.anonymous and (self.name is None or self.email is None):
            raise ValueError("Name and email are required unless you post anonymously")
        return self

    @model_validator(mode="after")
    def low_rating_needs_comment(self) -> "FeedbackIn":
        if self.rating <= 2 and len(self.comment) < 10:
            raise ValueError("A rating of 1 or 2 needs a comment of at least 10 characters")
        return self


class FeedbackOut(BaseModel):
    id: int                 # added by the server
    received_at: datetime   # added by the server
    name: str
    email: EmailStr | None
    rating: int
    comment: str
    tags: list[Topic]
    anonymous: bool


_feedback_ids = itertools.count(1)  # a real app would let the database create the id


@router.post("/feedback", status_code=status.HTTP_201_CREATED, summary="Request body + Pydantic validation")
def create_feedback(feedback: FeedbackIn) -> FeedbackOut:
    """Checks the JSON body against FeedbackIn, then answers 201 with the saved feedback."""
    # When this line runs, Pydantic has ALREADY checked every field – no if-statements needed.
    data = feedback.model_dump()
    if feedback.anonymous:
        data.update(name="Anonymous", email=None)  # even if a client sent them: don't keep them
    return FeedbackOut(id=next(_feedback_ids), received_at=utc_now(), **data)
# endregion


# region status
@router.get("/status/{code}", response_model=None, summary="Answer with the status code you ask for")
def status_example(
    code: Annotated[int, Path(ge=100, le=599, examples=[418])],  # examples → pre-filled in /api/docs
    response: Response,
) -> dict[str, Any] | Response:
    """Try 200, 201, 204, 400, 401, 403, 404, 409, 418, 429 or 500. For a 422, send something
    that is not a status code (/status/not-a-number, /status/99): FastAPI answers that itself."""
    match code:
        case 200:
            return {"message": "OK – here is the data you asked for."}
        case 201:
            response.status_code = status.HTTP_201_CREATED
            # Location = the URL of the new item. (A real API would answer GET /feedback/42;
            # this demo stores nothing, so here the URL is only an example.)
            response.headers["Location"] = "/api/basics/feedback/42"
            return {"id": 42, "message": "Created – a new item was saved."}
        case 204:
            return Response(status_code=status.HTTP_204_NO_CONTENT)  # success, but NO body at all
        case 400:
            raise HTTPException(400, "Bad request – the start date must be before the end date.")
        case 401:
            raise HTTPException(401, "Not logged in – send a valid token.", headers={"WWW-Authenticate": "Bearer"})
        case 403:
            raise HTTPException(403, "Forbidden – you are logged in, but only lecturers may do this.")
        case 404:
            raise HTTPException(404, "Not found – there is no student with id 999.")
        case 409:
            raise HTTPException(409, "Conflict – a student with this email already exists.")
        case 418:
            raise HTTPException(418, "I'm a teapot – I refuse to brew coffee (an old April Fools' joke).")
        case 429:
            raise HTTPException(429, "Too many requests – try again in 30 seconds.", headers={"Retry-After": "30"})
        case 500:
            raise HTTPException(500, "Server error – raised on purpose with HTTPException.")
        case _:
            # A real status code, but this demo has no example of it → "not found".
            raise HTTPException(404, f"No example for {code}. Try 200, 201, 204, 400, 401, 403, 404, 409, "
                                     "418, 429 or 500 – or /status/not-a-number for a 422.")


@router.get("/crash", summary="A real bug: an unhandled exception → 500",
            responses={500: {"model": ErrorOut, "description": "Always – the bug is on purpose"}})
def crash() -> dict[str, int]:
    """Nobody catches this KeyError, so main.py's exception handler answers 500 (as JSON)."""
    cut_offs = {"HD": 80, "D": 70, "C": 60}
    return {"pass_mark": cut_offs["P"]}  # KeyError: 'P' – look at the uvicorn terminal!
# endregion


# region profiles
class PublicProfile(BaseModel):
    """What the outside world is allowed to see."""
    id: int
    username: str
    full_name: str
    role: str


class UserRecord(PublicProfile):
    """How a user is stored on the server – it has everything, including secrets."""
    email: str
    password_hash: str
    api_secret: str
    failed_logins: int
    internal_notes: str


# Fictional people; the hashes and secrets are fake strings made up for this demo.
PROFILES = {
    1: UserRecord(id=1, username="mchen", full_name="Mia Chen", role="student", email="mia.chen@student.example.edu",
                  password_hash="pbkdf2_sha256$200000$9c1e5a0f$4b7d0c2e91a8", api_secret="demo-secret-7f3a91c2",
                  failed_logins=2, internal_notes="Asked for an extension on Assignment 2."),
    2: UserRecord(id=2, username="aokafor", full_name="Dr Ada Okafor", role="lecturer", email="ada.okafor@example.edu",
                  password_hash="pbkdf2_sha256$200000$51d0b6e3$a93f10c7d2e4", api_secret="demo-secret-0b62d4e8",
                  failed_logins=0, internal_notes="Unit convenor, semester 2."),
    3: UserRecord(id=3, username="slee", full_name="Sam Lee", role="tutor", email="sam.lee@example.edu",
                  password_hash="pbkdf2_sha256$200000$e84a27c9$6c05be1f7a3d", api_secret="demo-secret-c4e19a57",
                  failed_logins=5, internal_notes="Account locked twice this month."),
}


def load_user(user_id: int) -> UserRecord:
    user = PROFILES.get(user_id)
    if user is None:
        raise HTTPException(404, f"No user with id {user_id}. Try 1, 2 or 3.")
    return user


NO_SUCH_USER = {404: {"model": ErrorOut, "description": "No user with this id"}}


@router.get("/profiles/{user_id}", response_model=PublicProfile, responses=NO_SUCH_USER,
            summary="Safe: response_model filters the output")
def get_profile(user_id: int) -> UserRecord:
    """Sends only the public fields of a user."""
    # The function returns the FULL record. FastAPI validates it against
    # response_model=PublicProfile and sends ONLY the fields declared there.
    # (Writing `-> PublicProfile` filters too; use response_model= when the function
    # returns a different type than the one you want to send – like here.)
    return load_user(user_id)


@router.get("/profiles/{user_id}/unsafe", responses=NO_SUCH_USER,
            summary="Anti-pattern: the response model is the full record (leaks secrets!)")
def get_profile_unsafe(user_id: int) -> UserRecord:
    """The classic mistake: the stored model is used as the return type."""
    # DON'T do this in real code: the return type IS the response model, and
    # UserRecord declares every secret field – so every field is sent.
    return load_user(user_id)
# endregion


# region dependencies
class PageParams(BaseModel):
    q: str | None
    skip: int
    limit: int


def pagination(
    q: Annotated[str | None, Query(max_length=50, description="Search text")] = None,
    skip: Annotated[int, Query(ge=0, description="How many items to skip")] = 0,
    limit: Annotated[int, Query(ge=1, le=20, description="Page size")] = 5,
) -> PageParams:
    """A dependency is just a function. FastAPI calls it (with the request's query
    parameters) and passes the result to every endpoint that asks for it."""
    return PageParams(q=q, skip=skip, limit=limit)


# Write the type once, reuse it everywhere:  def endpoint(page: PaginationDep)
PaginationDep = Annotated[PageParams, Depends(pagination)]

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    total: int  # matches BEFORE skip/limit, so the UI can show "page 2 of 3"
    skip: int
    limit: int
    q: str | None
    items: list[T]


def paginate(rows: list[T], page: PageParams, text: Callable[[T], str]) -> Page[T]:
    if page.q:
        rows = [row for row in rows if page.q.lower() in text(row).lower()]
    return Page(total=len(rows), skip=page.skip, limit=page.limit, q=page.q,
                items=rows[page.skip: page.skip + page.limit])


class UnitSummary(BaseModel):
    code: str
    title: str


class CampusEvent(BaseModel):
    title: str
    week: int
    room: str


EVENTS = [CampusEvent(title=t, week=w, room=r) for t, w, r in [
    ("Hackathon kick-off", 1, "ATC 101"), ("React study group", 2, "Library L3"),
    ("Careers fair", 3, "Great Hall"), ("FastAPI workshop", 4, "EN 204"),
    ("Women in Tech meetup", 5, "AMDC 502"), ("Mid-semester trivia", 6, "Student lounge"),
    ("Machine learning clinic", 8, "EN 310"), ("Demo day rehearsal", 10, "ATC 101"),
    ("Innovation showcase", 12, "Great Hall"), ("End-of-semester BBQ", 13, "Quad"),
]]


@router.get("/units", summary="List units (uses the pagination dependency)")
def list_units(page: PaginationDep) -> Page[UnitSummary]:
    """Units, searchable by code or title. q, skip and limit come from pagination()."""
    rows = [UnitSummary(code=code, title=unit["title"]) for code, unit in UNITS.items()]
    return paginate(rows, page, text=lambda unit: f"{unit.code} {unit.title}")


@router.get("/events", summary="List events (the SAME dependency, zero copied code)")
def list_events(page: PaginationDep) -> Page[CampusEvent]:
    """Campus events – the same q, skip and limit, without declaring them again."""
    return paginate(EVENTS, page, text=lambda event: event.title)


# Keys are secrets: read them from the environment (like SECRET_KEY in config.py), never
# write them in code. The default only exists so the demo works out of the box.
TEACHING_API_KEY = os.getenv("TEACHING_API_KEY", "teaching-key")


def require_api_key(x_api_key: Annotated[str | None, Header()] = None) -> None:
    """Header dependency. FastAPI maps the parameter x_api_key to the header "X-API-Key"
    (underscores become hyphens; header names ignore upper/lower case).
    fastapi.security.APIKeyHeader reads a header too AND adds a padlock to /api/docs –
    the "Login & JWT" page shows that style with OAuth2PasswordBearer."""
    if x_api_key is None:
        raise HTTPException(401, "Missing X-API-Key header.", headers={"WWW-Authenticate": "ApiKey"})
    # compare_digest takes the same time for every wrong key, so timing leaks nothing.
    if not secrets.compare_digest(x_api_key.encode(), TEACHING_API_KEY.encode()):
        raise HTTPException(401, "Wrong API key.", headers={"WWW-Authenticate": "ApiKey"})


class StaffNote(BaseModel):
    author: str
    note: str


STAFF_NOTES = [StaffNote(author=a, note=n) for a, n in [
    ("Dr Ada Okafor", "Lab 5 moves to EN 310 next week."),
    ("Sam Lee", "Remind teams to push their FastAPI code before the demo."),
    ("Dr Ada Okafor", "Marking rubric v2 is on the staff drive."),
    ("Priya Das", "Two extra consultation slots on Friday."),
    ("Sam Lee", "The ML model endpoint needs a /health check."),
    ("Priya Das", "Book the Great Hall for the showcase."),
    ("Dr Ada Okafor", "Moderation meeting in week 13."),
]]


# dependencies=[...] runs a dependency only for its side effect (here: 401 or nothing).
@router.get("/staff/notes", dependencies=[Depends(require_api_key)], summary="Protected: needs X-API-Key",
            responses={401: {"model": ErrorOut, "description": "Missing or wrong X-API-Key header"}})
def staff_notes(page: PaginationDep) -> Page[StaffNote]:
    """Staff-only notes. require_api_key() runs first and answers 401 without a valid key."""
    return paginate(STAFF_NOTES, page, text=lambda item: f"{item.author} {item.note}")
# endregion


# region slow
class SlowResult(BaseModel):
    requested_seconds: float
    waited_seconds: float
    started_at: datetime
    finished_at: datetime


SLOW_STATS = {"completed": 0, "stopped_early": 0}


@router.get("/slow", summary="Deliberately slow (async def + asyncio.sleep)")
async def slow(
    request: Request,
    seconds: Annotated[float, Query(ge=0, le=10, description="How long to wait (max 10 s)")] = 2,
) -> SlowResult:
    """Waits `seconds` without blocking the server – and stops early if the client hangs up."""
    # async def + await asyncio.sleep(): while THIS request waits, the server keeps
    # answering others. (time.sleep() here would freeze the whole server!)
    started, clock = utc_now(), time.perf_counter()
    stopped_early = False
    while (waited := time.perf_counter() - clock) < seconds:
        # Check every 0.1 s whether the browser gave up (Cancel button / timeout).
        # If so, stop working – nobody will read the answer anyway.
        if await request.is_disconnected():
            stopped_early = True
            break
        await asyncio.sleep(min(0.1, seconds - waited))
    SLOW_STATS["stopped_early" if stopped_early else "completed"] += 1
    return SlowResult(requested_seconds=seconds, waited_seconds=round(waited, 2), started_at=started,
                      finished_at=utc_now())


@router.get("/slow/stats", summary="How many slow requests finished vs. were abandoned")
def slow_stats() -> dict[str, int]:
    """Counters since the server started (they reset when uvicorn reloads)."""
    return SLOW_STATS


class FlakyResult(BaseModel):
    attempt: int
    message: str


_flaky_attempts: dict[str, int] = {}


RETRY_LATER = {503: {
    "model": ErrorOut,
    "description": "Temporarily unavailable – try again after Retry-After seconds",
    "headers": {"Retry-After": {"description": "Seconds to wait", "schema": {"type": "integer"}}},
}}


@router.get("/flaky", responses=RETRY_LATER, summary="Fails the first N calls with 503 (for retry demos)")
def flaky(
    key: Annotated[str, Query(min_length=1, max_length=40, description="Any id – one counter per key")],
    fail_times: Annotated[int, Query(ge=0, le=5)] = 2,
) -> FlakyResult:
    """Answers 503 for the first `fail_times` calls with the same `key`, then 200."""
    if len(_flaky_attempts) > 1000:
        _flaky_attempts.clear()  # keep memory bounded – it's only a demo counter
    attempt = _flaky_attempts[key] = _flaky_attempts.get(key, 0) + 1
    if attempt <= fail_times:
        # 503 = "temporarily unavailable": a retry later may well succeed.
        raise HTTPException(503, f"Temporarily unavailable (attempt {attempt}). Please retry.",
                            headers={"Retry-After": "1"})
    return FlakyResult(attempt=attempt, message=f"Success on attempt {attempt}.")
# endregion
