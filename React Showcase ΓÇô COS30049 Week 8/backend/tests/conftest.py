"""
conftest.py – shared pytest fixtures.

Tests never touch the real app.db: every test gets a fresh in-memory SQLite
database, injected by overriding the `get_session` dependency.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

from app.database import get_session, init_db
from app.main import app


@pytest.fixture
def engine():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    init_db(engine)  # create tables + seed demo data (demo users, …)
    return engine


@pytest.fixture
def session(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(engine, tmp_path, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "upload_dir", tmp_path / "uploads")

    def override_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def login(client):
    """Returns a function that logs in and gives you ready-made auth headers."""

    def _login(username: str = "student", password: str = "student123") -> dict:
        response = client.post("/api/auth/login", data={"username": username, "password": password})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _login
