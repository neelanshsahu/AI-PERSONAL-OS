"""
JWT Authentication Middleware — FastAPI dependency for verifying Supabase JWTs.

Verifies tokens by calling the Supabase Auth REST API directly (GET /auth/v1/user)
using the `requests` library. This completely bypasses any httpx version conflicts.

Usage:
    from app.middleware.auth import get_current_user
    from app.models.auth import UserResponse

    @router.get("/protected")
    async def protected(user: UserResponse = Depends(get_current_user)):
        return {"user_id\": user.id}
"""

import requests

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.auth import UserResponse
from app.utils.config import settings

# ── HTTP Bearer scheme ────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=True)


def _verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase JWT by calling the Supabase Auth REST API directly.

    Calls: GET <SUPABASE_URL>/auth/v1/user
    with headers: Authorization: Bearer <token>, apikey: <service_role_key>

    This bypasses the supabase-py / gotrue / httpx version dependency entirely.

    Returns a dict with keys: sub, email, role, aud
    Raises HTTPException 401 if invalid.
    """
    supabase_url = settings.SUPABASE_URL.rstrip("/")
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY

    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase credentials are not configured on the server.",
        )

    url = f"{supabase_url}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": service_key,
        "Content-Type": "application/json",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=10)
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not reach Supabase Auth API: {exc}",
        )

    if resp.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not resp.ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth verification failed (Supabase {resp.status_code}): {resp.text[:200]}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = resp.json()
    return {
        "sub":   user_data.get("id", ""),
        "email": user_data.get("email", ""),
        "role":  user_data.get("role", "authenticated"),
        "aud":   user_data.get("aud", "authenticated"),
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserResponse:
    """
    FastAPI dependency — extracts and verifies the Bearer JWT from the
    Authorization header, returning the authenticated user.

    Inject into any route that requires authentication:
        user: UserResponse = Depends(get_current_user)
    """
    token = credentials.credentials
    payload = _verify_supabase_token(token)

    user_id: str = payload.get("sub", "")
    email: str   = payload.get("email", "")
    role: str    = payload.get("role", "authenticated")
    aud: str     = payload.get("aud", "authenticated")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identifier (sub).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserResponse(id=user_id, email=email, role=role, aud=aud)


# ── Optional auth (for endpoints that work both logged-in and anonymously) ────
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> UserResponse | None:
    """
    Same as get_current_user but returns None instead of raising 401
    when no token is provided. Useful for public endpoints with optional auth.
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
