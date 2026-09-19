"""
Usage router — /api/v1/usage
Aggregation endpoints for the public.usage_logs table.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse

router = APIRouter(prefix="/usage", tags=["Usage"])


# ── Pydantic models ────────────────────────────────────────────────────────────

class UsageResponse(BaseModel):
    id:         str
    user_id:    str
    feature:    str
    model:      str | None = None
    tokens_in:  int = 0
    tokens_out: int = 0
    cost_usd:   float = 0.0
    created_at: str

    class Config:
        from_attributes = True


class UsageSummary(BaseModel):
    total_requests: int
    total_tokens:   int
    total_cost_usd: float
    by_feature:     dict
    by_model:       dict
    active_models:  int


class UsageCreate(BaseModel):
    feature:    str
    model:      str | None = None
    tokens_in:  int = 0
    tokens_out: int = 0
    cost_usd:   float = 0.0


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[UsageResponse])
async def list_usage(
    limit:  int = 100,
    offset: int = 0,
    user:   UserResponse = Depends(get_current_user),
    db:     Client       = Depends(get_supabase),
):
    """List raw usage records for the current user (newest first)."""
    result = (
        db.table("usage_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


# ── SUMMARY ───────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=UsageSummary)
async def get_usage_summary(
    user: UserResponse = Depends(get_current_user),
    db:   Client       = Depends(get_supabase),
):
    """Aggregate usage totals, breakdown by feature, and breakdown by model."""
    result = (
        db.table("usage_logs")
        .select("feature, model, tokens_in, tokens_out, cost_usd")
        .eq("user_id", user.id)
        .execute()
    )
    records = result.data or []

    total_requests = len(records)
    total_tokens   = sum(r.get("tokens_in", 0) + r.get("tokens_out", 0) for r in records)
    total_cost     = sum(r.get("cost_usd", 0) for r in records)

    by_feature: dict = {}
    by_model:   dict = {}

    for r in records:
        feat  = r.get("feature", "unknown")
        model = r.get("model",   "unknown")
        toks  = r.get("tokens_in", 0) + r.get("tokens_out", 0)
        cost  = r.get("cost_usd", 0)

        by_feature.setdefault(feat,  {"tokens": 0, "cost": 0, "requests": 0})
        by_model.setdefault(model,   {"tokens": 0, "cost": 0, "requests": 0})

        by_feature[feat]["tokens"]   += toks
        by_feature[feat]["cost"]     += cost
        by_feature[feat]["requests"] += 1

        by_model[model]["tokens"]    += toks
        by_model[model]["cost"]      += cost
        by_model[model]["requests"]  += 1

    return UsageSummary(
        total_requests = total_requests,
        total_tokens   = total_tokens,
        total_cost_usd = round(float(total_cost), 6),
        by_feature     = by_feature,
        by_model       = by_model,
        active_models  = len([m for m in by_model if m != "unknown"]),
    )


# ── CHART DATA ────────────────────────────────────────────────────────────────

@router.get("/chart")
async def get_usage_chart(
    days: int = 7,
    user: UserResponse = Depends(get_current_user),
    db:   Client       = Depends(get_supabase),
):
    """Aggregate usage and request count by day for chart rendering."""
    result = (
        db.table("usage_logs")
        .select("created_at, tokens_in, tokens_out, feature")
        .eq("user_id", user.id)
        .execute()
    )
    records = result.data or []

    daily_data: dict = {}
    for r in records:
        ts = r.get("created_at", "")
        if not ts:
            continue
        day_str = ts[:10]  # YYYY-MM-DD
        daily_data.setdefault(day_str, {"requests": 0, "tokens": 0})
        daily_data[day_str]["requests"] += 1
        daily_data[day_str]["tokens"]   += r.get("tokens_in", 0) + r.get("tokens_out", 0)

    sorted_days = sorted(daily_data.keys())[-days:] if days > 0 else sorted(daily_data.keys())

    return [
        {
            "date":     day,
            "requests": daily_data[day]["requests"],
            "tokens":   daily_data[day]["tokens"],
        }
        for day in sorted_days
    ]


# ── CREATE (internal) ─────────────────────────────────────────────────────────

@router.post("/", response_model=UsageResponse, status_code=status.HTTP_201_CREATED)
async def log_usage(
    payload: UsageCreate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Record a usage event. Called internally by AI service routers."""
    data = payload.model_dump()
    data["user_id"] = user.id
    result = db.table("usage_logs").insert(data).execute()
    return result.data[0]
