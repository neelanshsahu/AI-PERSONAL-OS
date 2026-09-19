"""Pydantic schemas for the tasks table."""

from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title:       str            = Field(..., max_length=300)
    description: Optional[str] = None
    priority:    str            = Field(default="medium", pattern="^(low|medium|high)$")
    due_date:    Optional[date] = None
    tags:        List[str]      = []


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title:       Optional[str]       = None
    description: Optional[str]       = None
    priority:    Optional[str]       = Field(None, pattern="^(low|medium|high)$")
    status:      Optional[str]       = Field(None, pattern="^(todo|in_progress|done)$")
    due_date:    Optional[date]      = None
    tags:        Optional[List[str]] = None
    completed:   Optional[bool]      = None


class TaskResponse(TaskBase):
    id:         str
    user_id:    str
    status:     str
    completed:  bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
