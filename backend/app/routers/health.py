"""
Health Router — System status and readiness checks.
GET /api/v1/health  →  Overall system health
GET /api/v1/health/ping  →  Simple liveness probe
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.base import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health Check",
    description="Returns the overall health status of the AI-Personal-OS API.",
)
async def health_check() -> HealthResponse:
    """Full health check with timestamp and version info."""
    return HealthResponse(
        status="ok",
        message="AI-Personal-OS API is running.",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0",
    )


@router.get(
    "/health/ping",
    summary="Liveness Probe",
    description="Minimal liveness probe for load balancers and uptime monitors.",
)
async def ping() -> dict:
    """Minimal ping — returns pong."""
    return {"ping": "pong"}
