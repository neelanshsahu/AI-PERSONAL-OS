"""
Profiles router — /api/v1/profiles
CRUD for the public.profiles table.
"""

from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.models.profiles import ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/profiles", tags=["Profiles"])


# ── GET /me ───────────────────────────────────────────────────────────────────

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    user: UserResponse = Depends(get_current_user),
    db:   Client       = Depends(get_supabase),
):
    """Return the current user's profile. Creates one if it doesn't exist yet."""
    result = db.table("profiles").select("*").eq("id", user.id).single().execute()

    if not result.data:
        # Auto-create profile if the trigger hasn't run yet
        created = db.table("profiles").insert({
            "id":    user.id,
            "email": user.email,
        }).execute()
        return created.data[0]

    return result.data


# ── PUT /me ───────────────────────────────────────────────────────────────────

@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Update the current user's profile fields."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update.")

    result = (
        db.table("profiles")
        .update(updates)
        .eq("id", user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found.")

    return result.data[0]


# ── GET /me/dashboard ─────────────────────────────────────────────────────────

_DASHBOARD_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 30

@router.get("/me/dashboard", response_model=Dict[str, Any])
async def get_dashboard_stats(
    user: UserResponse = Depends(get_current_user),
    db:   Client       = Depends(get_supabase),
):
    """Aggregate statistics for the user's dashboard."""
    # Check cache first
    now = datetime.now(timezone.utc)
    cached = _DASHBOARD_CACHE.get(user.id)
    if cached and (now - cached["timestamp"]).total_seconds() < CACHE_TTL_SECONDS:
        return cached["data"]

    # 1. Documents Indexed
    docs_result = db.table("documents").select("id", count="exact").eq("user_id", user.id).execute()
    documents_indexed = docs_result.count if docs_result.count is not None else 0

    # 2. Tasks Due Today
    today_date = datetime.now(timezone.utc).date().isoformat()
    tasks_result = (
        db.table("tasks")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .eq("completed", False)
        .lte("due_date", today_date)
        .execute()
    )
    tasks_due_today = tasks_result.count if tasks_result.count is not None else 0

    # 3. Images Generated
    images_result = db.table("images").select("id", count="exact").eq("user_id", user.id).execute()
    images_generated = images_result.count if images_result.count is not None else 0

    # 4. AI Queries Today
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    usage_result = (
        db.table("usage_logs")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .eq("feature", "chat")
        .gte("created_at", today.isoformat())
        .execute()
    )
    ai_queries_today = usage_result.count if usage_result.count is not None else 0

    data = {
        "ai_queries_today": ai_queries_today,
        "documents_indexed": documents_indexed,
        "tasks_due_today": tasks_due_today,
        "images_generated": images_generated
    }

    # Store in cache
    _DASHBOARD_CACHE[user.id] = {"timestamp": now, "data": data}

    return data

