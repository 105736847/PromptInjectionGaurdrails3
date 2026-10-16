"""
database.py – the SQLite database connection.

- `engine` knows how to talk to the database file.
- `get_session()` is a FastAPI *dependency*: every request that needs the
  database receives its own Session, which is closed automatically afterwards.
  `SessionDep` is the short type hint endpoints use to ask for it.
- `init_db()` creates the tables and runs the "seeders" that fill an empty
  database with demo data. Feature modules register their own seeders with
  `@register_seeder`, so this file never has to change when a feature is added.
"""
from collections.abc import Callable, Iterator
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

from .config import settings

# check_same_thread=False: FastAPI may use the connection from different threads.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)

_seeders: list[Callable[[Session], None]] = []


def register_seeder(func: Callable[[Session], None]) -> Callable[[Session], None]:
    """Decorator: run `func(session)` at start-up to add demo data if needed."""
    _seeders.append(func)
    return func


def get_session() -> Iterator[Session]:
    """FastAPI dependency that opens one database session per request."""
    with Session(engine) as session:
        yield session


# Use it in an endpoint like this:   def list_things(session: SessionDep): ...
SessionDep = Annotated[Session, Depends(get_session)]


def init_db(target_engine=engine) -> None:
    """Create every table that has been imported, then seed demo data."""
    SQLModel.metadata.create_all(target_engine)
    with Session(target_engine) as session:
        for seed in _seeders:
            seed(session)
        session.commit()
