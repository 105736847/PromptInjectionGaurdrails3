"""
user.py – the User table, its public "view" and the demo accounts.

Passwords are NEVER stored as plain text – only a salted hash (see security.py).

Two models, two jobs (the pattern from the SQLModel docs):
  User        – the database TABLE. It contains hashed_password.
  UserPublic  – what the API sends back. It has NO password field, so using it
                as `response_model` guarantees the hash can never leak.
"""
from datetime import datetime, timezone

from pydantic import field_validator
from sqlmodel import Field, Session, SQLModel, select

from ..database import register_seeder


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, min_length=3, max_length=32)
    full_name: str
    role: str = Field(default="student")  # "student" or "lecturer"
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserPublic(SQLModel):
    """The safe, public shape of a user (used as response_model)."""

    id: int
    username: str
    full_name: str
    role: str
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def assume_utc(cls, value: datetime) -> datetime:
        # SQLite forgets the time zone. Without this the JSON would say
        # "2026-09-28T07:55:00" and the browser would read it as LOCAL time.
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# Demo accounts for the teaching pages (fictional people, well-known passwords).
DEMO_USERS = [
    {"username": "student", "full_name": "Alex Student", "role": "student", "password": "student123"},
    {"username": "lecturer", "full_name": "Dr Sam Lecturer", "role": "lecturer", "password": "lecturer123"},
]


@register_seeder
def seed_demo_users(session: Session) -> None:
    from ..security import hash_password  # local import avoids a circular import

    for demo in DEMO_USERS:
        exists = session.exec(select(User).where(User.username == demo["username"])).first()
        if not exists:
            session.add(
                User(
                    username=demo["username"],
                    full_name=demo["full_name"],
                    role=demo["role"],
                    hashed_password=hash_password(demo["password"]),
                )
            )
