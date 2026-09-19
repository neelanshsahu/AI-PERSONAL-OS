"""
Chat router — /api/v1/chat
CRUD for the public.chat_history table.
Phase 5: Adds POST /{chat_id}/send for OpenAI streaming.
"""

import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.models.chat import ChatCreate, ChatUpdate, ChatResponse, AddMessageRequest, SendMessageRequest
from app.services.openai_service import stream_completion, generate_title
from app.services.tools.tool_executor import execute_with_tools
import asyncio

from app.middleware.rate_limiter import RateLimitDependency, TokenBucketRateLimiter

router = APIRouter(prefix="/chat", tags=["Chat"])

# Rate limit: max 10 requests per minute via token bucket
chat_rate_limit = RateLimitDependency(TokenBucketRateLimiter(limit=10, window=60))


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ChatResponse])
async def list_chats(
    limit:  int = 20,
    offset: int = 0,
    user:   UserResponse = Depends(get_current_user),
    db:     Client       = Depends(get_supabase),
):
    """List all conversations for the current user (newest first)."""
    result = (
        db.table("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    payload: ChatCreate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Create a new conversation thread."""
    data = payload.model_dump()
    data["user_id"]  = user.id
    data["messages"] = [m.model_dump() for m in payload.messages]

    result = db.table("chat_history").insert(data).execute()
    return result.data[0]


# ── GET BY ID ─────────────────────────────────────────────────────────────────

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Retrieve a single conversation by ID."""
    result = (
        db.table("chat_history")
        .select("*")
        .eq("id", chat_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")
    return result.data


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: str,
    payload: ChatUpdate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Update title, model, or messages of a conversation."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update.")

    result = (
        db.table("chat_history")
        .update(updates)
        .eq("id", chat_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")
    return result.data[0]


# ── APPEND MESSAGE ────────────────────────────────────────────────────────────

@router.post("/{chat_id}/messages", response_model=ChatResponse)
async def add_message(
    chat_id: str,
    payload: AddMessageRequest,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Append a single message to an existing conversation."""
    # Fetch current messages
    existing = (
        db.table("chat_history")
        .select("messages")
        .eq("id", chat_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")

    messages = existing.data.get("messages", [])
    messages.append(payload.model_dump())

    result = (
        db.table("chat_history")
        .update({"messages": messages})
        .eq("id", chat_id)
        .eq("user_id", user.id)
        .execute()
    )
    return result.data[0]


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: str,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Delete a conversation."""
    db.table("chat_history").delete().eq("id", chat_id).eq("user_id", user.id).execute()


# ── AI STREAMING SEND ───────────────────────────────────────────────────────────────

@router.post("/{chat_id}/send", dependencies=[Depends(chat_rate_limit)])
async def send_message(
    chat_id: str,
    payload: SendMessageRequest,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """
    Send a user message and stream the AI response via Server-Sent Events.

    SSE event format:
      data: {"type": "chunk",  "content": "..."}
      data: {"type": "done",   "title":   "..."}
      data: {"type": "error",  "message": "..."}
    """
    # 1. Load the conversation (verify ownership)
    row = (
        db.table("chat_history")
        .select("messages, title")
        .eq("id", chat_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")

    existing_messages: list = row.data.get("messages", []) or []
    is_first_message = len(existing_messages) == 0
    now = datetime.now(timezone.utc).isoformat()

    # 2. Build OpenAI message history
    openai_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in existing_messages
    ]
    openai_messages.append({"role": "user", "content": payload.content})

    async def generate():
        full_response = ""
        prompt_tokens = 0
        completion_tokens = 0
        try:
            # Execute with tools asynchronously to prevent blocking the event loop
            # Pass existing_messages for context
            full_response = await asyncio.to_thread(
                execute_with_tools, 
                payload.content, 
                user.id, 
                db, 
                existing_messages
            )
            
            # Send the entire response as a single chunk to satisfy the frontend's SSE parser
            yield f"data: {json.dumps({'type': 'chunk', 'content': full_response})}\n\n"

            # 3. Save both messages to Supabase
            user_msg = {
                "role": "user",
                "content": payload.content,
                "created_at": now,
            }
            assistant_msg = {
                "role": "assistant",
                "content": full_response,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            updated_messages = existing_messages + [user_msg, assistant_msg]

            update_payload: dict = {"messages": updated_messages}

            # 4. Auto-generate title on first message
            new_title = row.data.get("title", "New Chat")
            if is_first_message:
                try:
                    new_title, t_p_tok, t_c_tok = await generate_title(payload.content)
                    update_payload["title"] = new_title
                    
                    # Log title generation usage
                    title_cost = (t_p_tok * 0.15 + t_c_tok * 0.60) / 1000000
                    db.table("usage_logs").insert({
                        "user_id": user.id,
                        "feature": "chat_title",
                        "model": "gpt-4o-mini",
                        "tokens_in": t_p_tok,
                        "tokens_out": t_c_tok,
                        "cost_usd": title_cost
                    }).execute()
                except Exception as e:
                    print(f"Title generation failed: {e}")
                    new_title = payload.content[:50]  # fallback
                    update_payload["title"] = new_title

            db.table("chat_history") \
              .update(update_payload) \
              .eq("id", chat_id) \
              .execute()

            # 5. Log Chat Usage
            if prompt_tokens > 0 or completion_tokens > 0:
                cost = 0.0
                if payload.model == "gpt-4o":
                    cost = (prompt_tokens * 5.0 + completion_tokens * 15.0) / 1000000
                elif payload.model == "gpt-4o-mini":
                    cost = (prompt_tokens * 0.15 + completion_tokens * 0.60) / 1000000
                elif payload.model == "gpt-4-turbo":
                    cost = (prompt_tokens * 10.0 + completion_tokens * 30.0) / 1000000
                
                try:
                    db.table("usage_logs").insert({
                        "user_id": user.id,
                        "feature": "chat",
                        "model": payload.model,
                        "tokens_in": prompt_tokens,
                        "tokens_out": completion_tokens,
                        "cost_usd": cost
                    }).execute()
                except Exception as e:
                    print(f"Usage logging failed: {e}")

            yield f"data: {json.dumps({'type': 'done', 'title': new_title})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
