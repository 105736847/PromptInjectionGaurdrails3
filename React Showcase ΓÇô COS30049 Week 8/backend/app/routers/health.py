"""
health.py – GET /api/health

A tiny endpoint the front end calls to check that the back end is running.
Real systems use the same idea for load balancers and uptime monitors.
"""
import platform
import time
from datetime import datetime, timezone

import fastapi
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import text

from ..config import settings
from ..database import SessionDep

router = APIRouter(prefix="/api", tags=["health"])

STARTED_AT = time.monotonic()


class Health(BaseModel):
    status: str
    app: str
    version: str
    uptime_seconds: float
    server_time: datetime
    python: str
    fastapi: str
    database: str


@router.get("/health", response_model=Health, summary="Is the API up?")
def health(session: SessionDep) -> Health:
    try:
        session.exec(text("SELECT 1"))
        database = "ok"
    except Exception:  # the API can still answer even if the DB is broken
        database = "unavailable"
    return Health(
        status="ok",
        app=settings.app_name,
        version=settings.version,
        uptime_seconds=round(time.monotonic() - STARTED_AT, 1),
        server_time=datetime.now(timezone.utc),
        python=platform.python_version(),
        fastapi=fastapi.__version__,
        database=database,
    )
