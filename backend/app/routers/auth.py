"""
Auth Router — Endpoints for JWT verification and current-user retrieval.

Routes:
    GET  /api/v1/auth/me      — Return authenticated user (requires valid JWT)
    GET  /api/v1/auth/verify  — Alias for token validation health check
"""

from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.models.auth import AuthVerifyResponse, UserResponse

router = APIRouter()


@router.get(
    "/auth/me",
    response_model=AuthVerifyResponse,
    summary="Get Current User",
    description=(
        "Returns the authenticated user extracted from the verified Supabase JWT. "
        "Requires a valid `Authorization: Bearer <token>` header."
    ),
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> AuthVerifyResponse:
    """
    Protected endpoint — validates the JWT and returns user info.
    Use this on the frontend to confirm a session is still valid.
    """
    return AuthVerifyResponse(status="ok", user=current_user)


@router.get(
    "/auth/verify",
    response_model=AuthVerifyResponse,
    summary="Verify JWT Token",
    description="Alias for /auth/me — useful as a lightweight token validity check.",
)
async def verify_token(
    current_user: UserResponse = Depends(get_current_user),
) -> AuthVerifyResponse:
    """Verify that a JWT is valid and not expired."""
    return AuthVerifyResponse(status="ok", user=current_user)
