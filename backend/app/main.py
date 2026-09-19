"""
AI-Personal-OS — FastAPI Application Entry Point
Phase 1: Project Scaffold (no auth, no AI, no DB)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    health_router,
    auth_router,
    profiles_router,
    chat_router,
    documents_router,
    tasks_router,
    images_router,
    usage_router,
    rag_router,
    agents_router,
    tools_router,
)
from app.utils.config import settings

# ─── Application Factory ──────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI Personal Operating System — Backend API",
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # ── CORS Middleware ────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health_router,    prefix="/api/v1", tags=["Health"])
    app.include_router(auth_router,      prefix="/api/v1", tags=["Auth"])
    app.include_router(profiles_router,  prefix="/api/v1", tags=["Profiles"])
    app.include_router(chat_router,      prefix="/api/v1", tags=["Chat"])
    app.include_router(documents_router, prefix="/api/v1", tags=["Documents"])
    app.include_router(tasks_router,     prefix="/api/v1", tags=["Tasks"])
    app.include_router(images_router,    prefix="/api/v1", tags=["Images"])
    app.include_router(usage_router,     prefix="/api/v1", tags=["Usage"])
    app.include_router(rag_router,       prefix="/api/v1", tags=["RAG"])
    app.include_router(agents_router,    prefix="/api/v1", tags=["Agents"])
    app.include_router(tools_router,     prefix="/api/v1", tags=["Tools"])

    # ── Startup / Shutdown Events ──────────────────────────────────────────────
    @app.on_event("startup")
    async def on_startup():
        print(f"🚀  {settings.APP_NAME} v{settings.APP_VERSION} started")
        print(f"📖  Docs: http://localhost:{settings.PORT}/api/docs")

    @app.on_event("shutdown")
    async def on_shutdown():
        print("🛑  Application shutting down...")

    return app


app = create_app()
