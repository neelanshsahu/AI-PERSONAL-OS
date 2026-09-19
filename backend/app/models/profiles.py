"""Pydantic schemas for the profiles table."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    avatar_url:   Optional[str] = None
    bio:          Optional[str] = Field(None, max_length=500)


class ProfileUpdate(ProfileBase):
    """Fields the user may update — all optional."""
    pass


class ProfileResponse(ProfileBase):
    id:         str
    email:      Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
