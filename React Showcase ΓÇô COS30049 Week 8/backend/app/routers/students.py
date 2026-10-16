"""
students.py – a complete CRUD API for the Student table (FastAPI + SQLModel + SQLite).

    GET    /api/students         list: search, filter, sort, paginate
    GET    /api/students/stats   aggregates computed IN SQL (COUNT, AVG, GROUP BY)
    POST   /api/students/reset   restore the 60 demo students (handy in class)
    GET    /api/students/{id}    one student                     (404 if missing)
    POST   /api/students         create          (201 · 409 duplicate · 422 invalid)
    PATCH  /api/students/{id}    partial update  (only the fields that were sent)
    DELETE /api/students/{id}    delete          (204 No Content)

Every endpoint asks for `session: SessionDep`, so each request gets its own
database session that FastAPI closes automatically afterwards.
Docs: https://fastapi.tiangolo.com/tutorial/sql-databases/
"""
from math import ceil
from typing import Annotated, get_args

from fastapi import APIRouter, HTTPException, Path, Query, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, case, col, delete, func, or_, select

from ..database import SessionDep
from ..models.student import (
    CAMPUSES,
    GRADE_BANDS,
    MAJORS,
    STATUSES,
    Bucket,
    Conflict,
    NotFound,
    ResetResult,
    Student,
    StudentCreate,
    StudentPage,
    StudentQuery,
    StudentRead,
    StudentStats,
    StudentUpdate,
    SortField,
    load_seed_students,
)

router = APIRouter(prefix="/api/students", tags=["students"])

# The client sends a column NAME (?sort=score) and we look up the column
# object here. User input never becomes part of the SQL text → no SQL injection.
# The whitelist itself is the SortField Literal (FastAPI answers 422 for any
# other name); building the lookup FROM it means the two can never disagree.
SORTABLE_COLUMNS = {name: getattr(Student, name) for name in get_args(SortField)}

# le=2**31 - 1: the largest id a 32-bit INTEGER column holds (PostgreSQL's
# INTEGER). Without an upper limit a huge number crashes the database driver
# → 500 instead of a clear 422.
StudentPk = Annotated[int, Path(ge=1, le=2**31 - 1, description="The database id – not the 9-digit student ID")]

# Error bodies for /api/docs (the `model` is only documentation – HTTPException builds the JSON).
NOT_FOUND = {404: {"model": NotFound, "description": "No student with this id"}}
CONFLICT = {409: {"model": Conflict, "description": "Student ID or email already exists (per field, like a 422)"}}


# ---------- helpers ------------------------------------------------------------------
def get_or_404(session: Session, id: int) -> Student:
    student = session.get(Student, id)  # SELECT … WHERE id = ? (by primary key)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Student {id} not found – it may have been deleted.")
    return student


def ensure_unique(session: Session, *, student_id: str | None, email: str | None, exclude_id: int | None = None):
    """409 Conflict if another row already uses this student ID or email.

    The error list uses the SAME shape as FastAPI's 422 errors
    ({loc, msg, type}), so the React form shows it next to the right field.
    """
    errors = []
    for field, value, column in (("student_id", student_id, Student.student_id), ("email", email, Student.email)):
        if value is None:
            continue
        statement = select(Student.id).where(column == value)
        if exclude_id is not None:
            statement = statement.where(Student.id != exclude_id)
        if session.exec(statement).first() is not None:
            label = "Student ID" if field == "student_id" else "Email"
            errors.append({"loc": ["body", field], "msg": f"{label} {value} already exists.", "type": "duplicate"})
    if errors:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=errors)


def commit_or_409(session: Session, *, student_id: str | None, email: str | None, exclude_id: int | None = None):
    """Commit – and if the database's UNIQUE constraint says no, answer 409.

    Two requests can pass ensure_unique() at the same moment; the constraint is
    the final guard. By the time it fires, the other row IS committed, so asking
    ensure_unique() again finds it and gives the same per-field 409 as always.
    """
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        ensure_unique(session, student_id=student_id, email=email, exclude_id=exclude_id)
        raise  # not a duplicate (e.g. NOT NULL) → a real bug: let it become a 500


def _round(value: float | None, digits: int = 1) -> float | None:
    return None if value is None else round(value, digits)


# ---------- READ: list ------------------------------------------------------------
@router.get("", response_model=StudentPage, summary="List students (search, filter, sort, paginate)")
def list_students(session: SessionDep, params: Annotated[StudentQuery, Query()]) -> StudentPage:
    """All query parameters are optional, e.g. `?q=chen&major=Data Science&sort=score&order=desc&page=2`."""
    # 1. WHERE – build the conditions once, use them for the rows AND the count.
    filters = []
    if params.q and params.q.strip():
        term = params.q.strip()
        full_name = Student.first_name + " " + Student.last_name  # SQL: first_name || ' ' || last_name
        # icontains → LIKE '%term%' with the value sent as a bound PARAMETER.
        # autoescape=True makes % and _ in the search text match literally.
        filters.append(
            or_(
                full_name.icontains(term, autoescape=True),
                col(Student.email).icontains(term, autoescape=True),
                col(Student.student_id).contains(term, autoescape=True),
            )
        )
    for field in ("major", "campus", "status", "year"):
        value = getattr(params, field)
        if value is not None:
            filters.append(getattr(Student, field) == value)

    # 2. COUNT(*) of all matching rows – the pager needs it.
    total = session.exec(select(func.count()).select_from(Student).where(*filters)).one()

    # 3. ORDER BY a whitelisted column, then the tie-breakers: rows with the same
    #    value (e.g. 12 × "Data Science") are sorted by name, and the unique id
    #    keeps the order stable between pages. 4. LIMIT/OFFSET = one page.
    column = SORTABLE_COLUMNS[params.sort]
    tie_breakers = [SORTABLE_COLUMNS[name] for name in ("last_name", "first_name", "id") if name != params.sort]
    statement = (
        select(Student)
        .where(*filters)
        .order_by(column.desc() if params.order == "desc" else column.asc(), *tie_breakers)
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
    )
    students = session.exec(statement).all()

    return StudentPage(
        items=students,  # Student rows → StudentRead (adds the computed grade)
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=ceil(total / params.page_size),
    )


# ---------- READ: aggregates ------------------------------------------------------
# Declared BEFORE "/{id}": routes are matched top to bottom, and "stats" is not a
# valid integer id, so "/{id}" would answer 422 if it came first.
@router.get("/stats", response_model=StudentStats, summary="Counts and averages computed by SQL")
def student_stats(session: SessionDep) -> StudentStats:
    """The database does the maths (COUNT, AVG, GROUP BY) – we never load every row into Python."""
    passed = case((Student.score >= 50, 1.0), else_=0.0)
    total, average, pass_rate = session.exec(
        select(func.count(), func.avg(Student.score), func.avg(passed)).select_from(Student)
    ).one()

    def grouped(column, labels) -> list[Bucket]:
        # SELECT major, COUNT(*), AVG(score) FROM student GROUP BY major
        rows = session.exec(select(column, func.count(), func.avg(Student.score)).group_by(column)).all()
        found = {label: (count, avg) for label, count, avg in rows}
        buckets = []
        for label in labels:  # every label in a fixed order, even with count 0 → stable charts
            count, avg = found.get(label, (0, None))
            buckets.append(Bucket(label=label, count=count, average_score=_round(avg)))
        return buckets

    # A CASE expression turns scores into grades INSIDE the query:
    # CASE WHEN score >= 80 THEN 'HD' WHEN score >= 70 THEN 'D' … ELSE 'N' END
    grade = case(*[(Student.score >= minimum, label) for label, minimum in GRADE_BANDS[:-1]], else_="N")

    return StudentStats(
        total=total,
        average_score=_round(average),
        pass_rate=_round(pass_rate, 3),
        by_major=grouped(Student.major, MAJORS),
        by_status=grouped(Student.status, STATUSES),
        by_campus=grouped(Student.campus, CAMPUSES),
        grades=grouped(grade, [label for label, _ in GRADE_BANDS]),
    )


# ---------- demo helper -----------------------------------------------------------
@router.post("/reset", response_model=ResetResult, summary="Restore the demo data")
def reset_students(session: SessionDep) -> ResetResult:
    """Deletes every student and re-inserts the seed file. In a real app only an
    admin could do this – see the Login & JWT page: `Depends(require_role("lecturer"))`."""
    session.exec(delete(Student))
    students = load_seed_students()
    session.add_all(students)
    session.commit()  # both steps succeed together, or neither does (one transaction)
    return ResetResult(restored=len(students))


# ---------- READ: one -------------------------------------------------------------
@router.get("/{id}", response_model=StudentRead, summary="Get one student", responses=NOT_FOUND)
def get_student(id: StudentPk, session: SessionDep) -> Student:
    return get_or_404(session, id)


# ---------- CREATE ----------------------------------------------------------------
@router.post(
    "",
    response_model=StudentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a student",
    responses=CONFLICT,
)
def create_student(payload: StudentCreate, session: SessionDep) -> Student:
    # By the time we get here Pydantic has ALREADY validated the body (else: 422).
    ensure_unique(session, student_id=payload.student_id, email=payload.email)
    student = Student.model_validate(payload)  # schema → table row (id is still None)
    session.add(student)
    commit_or_409(session, student_id=payload.student_id, email=payload.email)
    session.refresh(student)  # reload → now it has the id SQLite chose
    return student


# ---------- UPDATE (partial) ------------------------------------------------------
@router.patch(
    "/{id}",
    response_model=StudentRead,
    summary="Update some fields of a student",
    responses={**NOT_FOUND, **CONFLICT},
)
def update_student(id: StudentPk, payload: StudentUpdate, session: SessionDep) -> Student:
    student = get_or_404(session, id)
    # exclude_unset=True → ONLY the keys the client actually sent. Without it,
    # every missing field would be None and would overwrite real data.
    changes = payload.model_dump(exclude_unset=True)
    ensure_unique(session, student_id=changes.get("student_id"), email=changes.get("email"), exclude_id=id)
    student.sqlmodel_update(changes)
    session.add(student)
    commit_or_409(session, student_id=changes.get("student_id"), email=changes.get("email"), exclude_id=id)
    session.refresh(student)
    return student


# ---------- DELETE ----------------------------------------------------------------
@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a student",
    responses=NOT_FOUND,
)
def delete_student(id: StudentPk, session: SessionDep) -> None:
    student = get_or_404(session, id)
    session.delete(student)
    session.commit()
    # 204 No Content: success, and there is deliberately no response body.
