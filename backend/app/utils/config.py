"""
Application Configuration — Centralized settings via pydantic-settings.

All environment variables are read from .env (see .env.example).
Never hardcode secrets — always use this settings object.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "AI-Personal-OS"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"  # development | staging | production
    PORT: int = 8000
    DEBUG: bool = True

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # ── Database (Phase 4 — not yet active) ──────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""          # Project Settings → API → JWT Secret
    DATABASE_URL: str = ""

    # ── AI / LLM (Phase 5+ — not yet active) ─────────────────────────────────
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.ENV == "development"


# Singleton instance — import this everywhere
settings = Settings()
