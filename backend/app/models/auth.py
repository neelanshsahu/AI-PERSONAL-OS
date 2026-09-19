"""
Auth Pydantic Models — Request/response schemas for authentication endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """Authenticated user info extracted from verified JWT."""

    id: str = Field(..., description="Supabase user UUID")
    email: str = Field(..., description="User's email address")
    role: str = Field(default="authenticated", description="Supabase role")
    aud: str = Field(default="authenticated", description="JWT audience")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "email": "user@example.com",
                "role": "authenticated",
                "aud": "authenticated",
            }
        }


class AuthVerifyResponse(BaseModel):
    """Response for token verification endpoint."""

    status: str = Field(default="ok")
    user: UserResponse


class TokenPayload(BaseModel):
    """Raw decoded JWT payload from Supabase."""

    sub: str                          # User UUID
    email: Optional[str] = None
    role: Optional[str] = "authenticated"
    aud: Optional[str] = "authenticated"
    exp: Optional[int] = None
    iat: Optional[int] = None
