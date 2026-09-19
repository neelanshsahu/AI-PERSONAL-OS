"""Pydantic schemas for the chat_history table."""

from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    """A single message inside a conversation."""
    role:    str  # 'user' | 'assistant' | 'system'
    content: str
    created_at: Optional[str] = None


class ChatBase(BaseModel):
    title: str = Field(default="New Chat", max_length=200)
    model: str = Field(default="gpt-4", max_length=100)


class ChatCreate(ChatBase):
    messages: List[MessageItem] = []


class ChatUpdate(BaseModel):
    title:    Optional[str]             = Field(None, max_length=200)
    model:    Optional[str]             = None
    messages: Optional[List[Any]]       = None


class ChatResponse(ChatBase):
    id:         str
    user_id:    str
    messages:   List[Any] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddMessageRequest(BaseModel):
    """Append one message to a conversation."""
    role:    str
    content: str


class SendMessageRequest(BaseModel):
    """Payload for POST /{chat_id}/send — triggers AI streaming."""
    content: str = Field(..., min_length=1, max_length=32_000)
    model:   str = Field(default="gpt-4o", max_length=100)
