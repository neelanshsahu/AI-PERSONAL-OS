"""
Images router — /api/v1/images
CRUD for the public.images table.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.models.images import ImageCreate, ImageResponse

router = APIRouter(prefix="/images", tags=["Images"])


from openai import AsyncOpenAI
from app.utils.config import settings

# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ImageResponse])
async def list_images(
    limit:  int = 50,
    offset: int = 0,
    user:   UserResponse = Depends(get_current_user),
    db:     Client       = Depends(get_supabase),
):
    result = (
        db.table("images")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


from app.middleware.rate_limiter import RateLimitDependency, FixedWindowRateLimiter

# Rate limit: max 5 requests per 60 seconds via fixed window
image_rate_limit = RateLimitDependency(FixedWindowRateLimiter(limit=5, window=60))

# ── GENERATE ──────────────────────────────────────────────────────────────────

class GenerateImageRequest(BaseModel):
    prompt: str
    model: str = "gpt-image-1"
    size: str = "1024x1024"
    style: str = "vivid"

@router.post("/generate", response_model=ImageResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(image_rate_limit)])
async def generate_image(
    payload: GenerateImageRequest,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Call OpenAI DALL-E 3 to generate an image, and store the metadata in Supabase."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "OPENAI_API_KEY not configured.")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # gpt-image-1 is the only model available on this API key
        prompt_text = payload.prompt
        if payload.style:
            prompt_text = f"{payload.prompt}, rendered in a {payload.style} style"

        generate_kwargs: dict = {
            "model":  "gpt-image-1",
            "prompt": prompt_text,
            "n":      1,
            "size":   payload.size,
        }

        response = await client.images.generate(**generate_kwargs)

        item = response.data[0]

        # gpt-image-1 always returns base64
        import base64
        b64 = item.b64_json
        image_url = f"data:image/png;base64,{b64}"

        revised = getattr(item, "revised_prompt", None)

        # Try to save to DB (images table optional — won't crash if missing)
        image_record = {
            "user_id":  user.id,
            "prompt":   payload.prompt,
            "model":    payload.model,
            "size":     payload.size,
            "style":    payload.style,
            "url":      image_url,
            "metadata": {"openai_revised_prompt": revised} if revised else {},
        }
        
        metadata = {
            "revised_prompt": revised,
            "cost_usd":       0.040 if payload.model == "dall-e-3" else 0.080 # roughly
        }

        # Insert into DB
        db_res = (
            db.table("images")
            .insert({
                "user_id":  user.id,
                "prompt":   payload.prompt,
                "model":    payload.model,
                "size":     payload.size,
                "style":    payload.style,
                "url":      image_url,
                "metadata": metadata
            })
            .execute()
        )
        
        # Log usage to Analytics
        try:
            db.table("usage_logs").insert({
                "user_id": user.id,
                "feature": "images",
                "model": payload.model,
                "tokens_in": 0,
                "tokens_out": 0,
                "cost_usd": metadata["cost_usd"]
            }).execute()
        except Exception as e:
            print(f"Failed to log usage: {e}")

        return db_res.data[0]

    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Image generation failed: {str(e)}")


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
async def create_image(
    payload: ImageCreate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Register a generated image record (URL populated by AI service in Phase 9)."""
    data = payload.model_dump()
    data["user_id"] = user.id
    result = db.table("images").insert(data).execute()
    return result.data[0]


# ── GET BY ID ─────────────────────────────────────────────────────────────────

@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: str,
    user:     UserResponse = Depends(get_current_user),
    db:       Client       = Depends(get_supabase),
):
    result = (
        db.table("images")
        .select("*")
        .eq("id", image_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found.")
    return result.data


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    user:     UserResponse = Depends(get_current_user),
    db:       Client       = Depends(get_supabase),
):
    db.table("images").delete().eq("id", image_id).eq("user_id", user.id).execute()
