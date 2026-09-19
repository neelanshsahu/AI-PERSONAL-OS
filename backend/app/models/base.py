"""
Base Pydantic Models — Shared response schemas used across all routers.
Extend these as new features are added in later phases.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    """Standard API response envelope."""

    status: str = Field(..., description="Response status: 'ok' or 'error'")
    message: str = Field(..., description="Human-readable status message")
    data: Optional[Any] = Field(default=None, description="Response payload")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "ok",
                "message": "Request completed successfully.",
                "data": None,
            }
        }


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(..., description="System health: 'ok' or 'degraded'")
    message: str = Field(..., description="Health status description")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    version: str = Field(..., description="API version")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "ok",
                "message": "AI-Personal-OS API is running.",
                "timestamp": "2026-01-01T00:00:00+00:00",
                "version": "1.0.0",
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    status: str = Field(default="error", description="Always 'error'")
    message: str = Field(..., description="Error description")
    detail: Optional[str] = Field(default=None, description="Additional error detail")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "message": "Resource not found.",
                "detail": "The requested item does not exist.",
            }
        }
