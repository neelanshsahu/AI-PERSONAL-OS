"""Pydantic schemas for the documents table."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    name:      str  = Field(..., max_length=255)
    file_type: str  = Field(..., max_length=20)   # pdf | md | docx | txt | csv
    file_size: Optional[int] = None               # bytes


class DocumentCreate(DocumentBase):
    storage_path: Optional[str] = None
    content:      Optional[str] = None
    metadata:     Dict[str, Any] = {}
    status:       str = "pending"


class DocumentUpdate(BaseModel):
    name:         Optional[str]          = None
    content:      Optional[str]          = None
    metadata:     Optional[Dict[str, Any]] = None
    status:       Optional[str]          = None   # pending|processing|indexed|failed
    storage_path: Optional[str]          = None


class DocumentResponse(DocumentBase):
    id:           str
    user_id:      str
    storage_path: Optional[str]          = None
    content:      Optional[str]          = None
    metadata:     Dict[str, Any]         = {}
    status:       str
    created_at:   datetime
    updated_at:   datetime

    class Config:
        from_attributes = True
