"""
config.py – settings read from environment variables (with safe defaults).

Never hard-code secrets in source code. Set them in the environment instead:
    macOS/Linux:  export SECRET_KEY="something-long-and-random"
    Windows:      set SECRET_KEY=something-long-and-random
"""
import os
from pathlib import Path

# Folder that contains app/, tests/, requirements.txt …
BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings:
    app_name: str = "React Showcase API"
    version: str = "1.0.0"

    # SQLite file next to this project. Any SQLAlchemy URL works (e.g. PostgreSQL).
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'app.db'}")

    # Used to sign login tokens (JWT). The default is ONLY for local development.
    secret_key: str = os.getenv("SECRET_KEY", "dev-only-secret-change-me-in-production")
    access_token_minutes: int = int(os.getenv("ACCESS_TOKEN_MINUTES", "30"))

    # Front-end origins that may call this API from the browser (CORS).
    cors_origins: list[str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")

    # Where uploaded files are stored.
    upload_dir: Path = Path(os.getenv("UPLOAD_DIR", BACKEND_DIR / "uploads"))


settings = Settings()
