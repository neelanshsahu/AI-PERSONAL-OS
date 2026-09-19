"""Pydantic schemas for the token_usage table."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class UsageCreate(BaseModel):
    feature:       str            = Field(..., description="chat | rag | image | agent | tool")
    model:         str            = Field(..., description="Model name e.g. gpt-4")
    input_tokens:  int            = Field(default=0, ge=0)
    output_tokens: int            = Field(default=0, ge=0)
    cost_usd:      float          = Field(default=0.0, ge=0)


class UsageResponse(UsageCreate):
    id:           str
    user_id:      str
    total_tokens: int
    created_at:   datetime

    class Config:
        from_attributes = True


class UsageSummary(BaseModel):
    """Aggregated usage statistics for a user."""
    total_requests:  int
    total_tokens:    int
    total_cost_usd:  float
    by_feature:      dict
    by_model:        dict
