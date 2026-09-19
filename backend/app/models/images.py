"""Pydantic schemas for the images table."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ImageBase(BaseModel):
    prompt:          str            = Field(..., max_length=1000)
    negative_prompt: Optional[str] = Field(None, max_length=500)
    model:           str            = Field(default="dall-e-3", max_length=100)
    style:           str            = Field(default="photorealistic", max_length=50)
    size:            str            = Field(default="1024x1024", max_length=20)


class ImageCreate(ImageBase):
    storage_path: Optional[str]      = None
    url:          Optional[str]      = None
    metadata:     Dict[str, Any]     = {}


class ImageResponse(ImageBase):
    id:           str
    user_id:      str
    storage_path: Optional[str]      = None
    url:          Optional[str]      = None
    metadata:     Dict[str, Any]     = {}
    created_at:   datetime

    class Config:
        from_attributes = True
