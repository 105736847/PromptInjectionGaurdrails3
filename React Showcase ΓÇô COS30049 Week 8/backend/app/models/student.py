"""
student.py – the Student table and the schemas (data shapes) of the Students API.

SQLModel lets ONE class be both a Pydantic model (validation + JSON) and a
database table. We use the "multiple models" pattern from the SQLModel docs
(https://sqlmodel.tiangolo.com/tutorial/fastapi/multiple-models/):

    StudentFields      the columns: names and plain types
    ├── Student        table=True → the real SQLite table (adds the id)
    └── StudentRead    what we send back   (id + the computed grade)
    StudentCreate      what POST accepts   (every rule; no id – the DATABASE chooses it)
    StudentUpdate      what PATCH accepts  (the same rules, every field optional)
    StudentQuery       the query parameters of GET /api/students
    StudentPage        one page of results + paging information
    StudentStats       the aggregates for the dashboard
    NotFound, Conflict the bodies of our 404 and 409 errors (shown in /api/docs)

Why so many classes? Each one is a CONTRACT for one direction of data flow:
a client must never choose the id, and a PATCH must be able to send only the
fields that changed.

Validate what comes IN, trust what is already stored: the rules live on
StudentCreate and StudentUpdate only. If StudentRead checked them again, one
old row that breaks a newer rule (or was edited in DB Browser for SQLite)
would turn every GET that includes it into a 500.
"""
import json
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Literal, get_args

from pydantic import AfterValidator, EmailStr, Strict, StringConstraints, WithJsonSchema, computed_field
from pydantic_core import PydanticCustomError
from sqlmodel import Field, Session, SQLModel, func, select

from ..database import register_seeder

# ---------- allowed values -----------------------------------------------------
# Literal types become dropdowns in /api/docs and are validated automatically.
Major = Literal["Artificial Intelligence", "Cybersecurity", "Software Development", "Data Science", "Internet of Things"]
Campus = Literal["Hawthorn", "Sarawak", "Online"]
Status = Literal["active", "at_risk", "graduated"]

MAJORS: tuple[str, ...] = get_args(Major)
CAMPUSES: tuple[str, ...] = get_args(Campus)
STATUSES: tuple[str, ...] = get_args(Status)

# Grade bands (minimum score for each grade). Used in Python AND in SQL (stats).
GRADE_BANDS = (("HD", 80), ("D", 70), ("C", 60), ("P", 50), ("N", 0))


def grade_for(score: float) -> str:
    return next(label for label, minimum in GRADE_BANDS if score >= minimum)


# ---------- reusable field types = the input rules ---------------------------------
# Annotated[type, rule…] packs a type and its validation into one name, so
# StudentCreate AND StudentUpdate share the exact same rules without copy-paste.
# PydanticCustomError gives a clean message (ValueError would add "Value error, ").
def _nine_digits(value: str) -> str:
    # [0-9], not \d or str.isdigit(): in Python both also accept the digits of
    # other scripts, e.g. "١٢٣" (Arabic-Indic) or "１２３" (full-width).
    if not re.fullmatch(r"[0-9]{9}", value):
        raise PydanticCustomError("student_id", "Student ID must be exactly 9 digits.")
    return value


FIRST_ENROLMENT = date(2000, 1, 1)
# Servers usually run in UTC, but a new day starts up to 14 hours EARLIER in
# other time zones (Melbourne: 10–11 hours). Comparing with the date in UTC+14,
# the latest time zone on Earth, never rejects a date that is "today" for the user.
LATEST_TIME_ZONE = timezone(timedelta(hours=14))


def _plausible_enrolment(value: date) -> date:
    if value < FIRST_ENROLMENT:
        raise PydanticCustomError("enrolled", "Enrolment date must be in 2000 or later.")
    if value > datetime.now(LATEST_TIME_ZONE).date():
        raise PydanticCustomError("enrolled", "Enrolment date cannot be in the future.")
    return value


# WithJsonSchema = what /api/docs shows for the field (the check is the function).
StudentId = Annotated[str, AfterValidator(_nine_digits), WithJsonSchema({"type": "string", "pattern": "^[0-9]{9}$"})]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Email = Annotated[EmailStr, AfterValidator(str.lower)]  # store lower-case → uniqueness ignores case
Year = Annotated[int, Field(ge=1, le=4)]
# Strict() = no type juggling in JSON bodies: without it Pydantic turns `true`
# into 1. (Query strings are always text, so StudentQuery uses the plain Year.)
StrictYear = Annotated[Year, Strict()]
Score = Annotated[float, Strict(), Field(ge=0, le=100)]
Enrolled = Annotated[date, AfterValidator(_plausible_enrolment)]


# ---------- the table ------------------------------------------------------------
class StudentFields(SQLModel):
    """The columns, with plain types. The rules are checked when data comes IN."""

    # unique=True + index=True → SQLite itself refuses duplicates (our safety net).
    student_id: str = Field(unique=True, index=True, max_length=9)
    first_name: str
    last_name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    major: str = Field(index=True)
    campus: str
    year: int
    score: float
    status: str = "active"
    enrolled: date


class Student(StudentFields, table=True):
    # AUTOINCREMENT: SQLite never re-uses the id of a deleted row, so an old
    # link (/api/students/42) can never point at a DIFFERENT student later.
    __table_args__ = {"sqlite_autoincrement": True}

    id: int | None = Field(default=None, primary_key=True)


# ---------- request / response schemas -------------------------------------------
class StudentCreate(SQLModel):
    """POST body: every field is required (status defaults to "active") and checked."""

    student_id: StudentId
    first_name: Name
    last_name: Name
    email: Email
    major: Major
    campus: Campus
    year: StrictYear
    score: Score
    status: Status = "active"
    enrolled: Enrolled

    # Shown as the example body in /api/docs → "Try it out" works immediately.
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "student_id": "109912345",
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
            ]
        }
    }


class StudentRead(StudentFields):
    id: int
    # Declared again WITHOUT max_length=9 (that one only sizes the column):
    # a stored 10-digit legacy ID must not turn every list into a 500.
    student_id: str

    # Derived from score – computed when the JSON is built, never stored twice.
    @computed_field
    @property
    def grade(self) -> str:
        return grade_for(self.score)


class StudentUpdate(SQLModel):
    """PATCH body: send only the fields you want to change.

    `= None` WITHOUT `| None` in the type: a field may be LEFT OUT (it keeps the
    default and exclude_unset drops it), but an explicit null fails the type
    check → 422, because null would try to erase a required column.
    """

    student_id: StudentId = None
    first_name: Name = None
    last_name: Name = None
    email: Email = None
    major: Major = None
    campus: Campus = None
    year: StrictYear = None
    score: Score = None
    status: Status = None
    enrolled: Enrolled = None


# The ONLY column names a client may sort by (students.py maps them to columns).
SortField = Literal["id", "student_id", "first_name", "last_name", "email", "major", "campus", "year", "score", "status", "enrolled"]


class StudentQuery(SQLModel):
    """Query parameters of GET /api/students (FastAPI reads them from the URL)."""

    q: str | None = Field(default=None, max_length=100, description="Search names, email and student ID")
    major: Major | None = None
    campus: Campus | None = None
    status: Status | None = None
    year: Year | None = None
    sort: SortField = "last_name"
    order: Literal["asc", "desc"] = "asc"
    # Upper limits protect the server: a huge page number would overflow the
    # 64-bit OFFSET inside the database driver → a 500 instead of a clear 422.
    page: int = Field(default=1, ge=1, le=100_000)
    page_size: int = Field(default=10, ge=1, le=100)


class StudentPage(SQLModel):
    items: list[StudentRead]
    total: int  # rows matching the filters (all pages)
    page: int
    page_size: int
    pages: int


class Bucket(SQLModel):
    label: str
    count: int
    average_score: float | None = None


class StudentStats(SQLModel):
    total: int
    average_score: float | None
    pass_rate: float | None  # share of students with score ≥ 50 (0–1)
    by_major: list[Bucket]
    by_status: list[Bucket]
    by_campus: list[Bucket]
    grades: list[Bucket]  # always in the order HD, D, C, P, N


class ResetResult(SQLModel):
    restored: int


# ---------- error bodies (declared in `responses=` so /api/docs shows them) --------
class FieldError(SQLModel):
    loc: list[str | int]  # e.g. ["body", "email"] – the same shape as FastAPI's own 422 errors
    msg: str
    type: str


class Conflict(SQLModel):
    detail: list[FieldError]


class NotFound(SQLModel):
    detail: str


# ---------- demo data ------------------------------------------------------------
SEED_FILE = Path(__file__).resolve().parent.parent / "data" / "students_seed.json"


def load_seed_students() -> list[Student]:
    """Read the JSON file and validate every row with the SAME rules as the API."""
    rows = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    # Fixed ids 1…60 → after a reset, shared links such as /api/students/7 work again.
    return [
        Student.model_validate(StudentCreate.model_validate(row), update={"id": index})
        for index, row in enumerate(rows, start=1)
    ]


@register_seeder
def seed_students(session: Session) -> None:
    # Idempotent: only fill an EMPTY table, never duplicate or overwrite data.
    if session.exec(select(func.count()).select_from(Student)).one() == 0:
        session.add_all(load_seed_students())
