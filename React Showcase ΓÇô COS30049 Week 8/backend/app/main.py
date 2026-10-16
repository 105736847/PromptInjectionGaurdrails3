"""
main.py – creates the FastAPI application.

Run it (from the backend/ folder, with the virtual environment active):
    uvicorn app.main:app --reload --port 8000

Then open http://localhost:8000/api/docs for interactive documentation.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import init_db
from .routers import auth, basics, files, health, jobs, ml, realtime, students


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code before `yield` runs once at start-up, code after it at shut-down.
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="The back end for the COS30049 React Showcase – every endpoint is used by a page in the front end.",
    lifespan=lifespan,
    # Everything lives under /api so the React dev server can proxy one prefix.
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS: allow the React app (a different origin: port 3000) to call this API
# from the browser. Without this the browser blocks the responses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    # Always answer with JSON (never an HTML error page) so the front end can show it.
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on the server."})


# Each feature lives in its own router module.
for module in (health, basics, students, auth, ml, realtime, files, jobs):
    app.include_router(module.router)
