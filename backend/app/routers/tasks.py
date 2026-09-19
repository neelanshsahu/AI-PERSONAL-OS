"""
Tasks router — /api/v1/tasks
CRUD for the public.tasks table.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.models.tasks import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])


import json
from openai import AsyncOpenAI
from app.utils.config import settings

# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    priority:  Optional[str]  = Query(None, pattern="^(low|medium|high)$"),
    status_q:  Optional[str]  = Query(None, alias="status", pattern="^(todo|in_progress|done)$"),
    completed: Optional[bool] = None,
    limit:     int            = 100,
    offset:    int            = 0,
    user:      UserResponse   = Depends(get_current_user),
    db:        Client         = Depends(get_supabase),
):
    """List tasks with optional priority / status / completed filters."""
    query = (
        db.table("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
    )
    if priority  is not None: query = query.eq("priority",  priority)
    if status_q  is not None: query = query.eq("status",    status_q)
    if completed is not None: query = query.eq("completed", completed)

    result = query.range(offset, offset + limit - 1).execute()
    return result.data


# ── AI SUGGESTIONS ────────────────────────────────────────────────────────────

class SuggestRequest(BaseModel):
    goal: str

@router.post("/suggest", response_model=List[TaskResponse])
async def suggest_tasks(
    payload: SuggestRequest,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Generate a list of actionable tasks to achieve a high-level goal using OpenAI."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "OPENAI_API_KEY not configured.")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    prompt = f"""
    You are an expert AI task planner. Break the following goal down into a logical list of discrete, actionable tasks.
    
    Goal: {payload.goal}
    
    Respond STRICTLY with a JSON object containing a single key "tasks", which is an array of objects. Each object must have:
    - title (string, max 100 chars)
    - description (string, optional)
    - priority (string: exactly 'low', 'medium', or 'high')
    - tags (array of strings, e.g. ["work", "research"])
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        parsed = json.loads(response.choices[0].message.content)
        tasks_list = parsed.get("tasks", [])
        
        # Log usage
        if response.usage:
            p_tok = response.usage.prompt_tokens
            c_tok = response.usage.completion_tokens
            cost = (p_tok * 0.15 + c_tok * 0.60) / 1000000
            try:
                db.table("usage_logs").insert({
                    "user_id": user.id,
                    "feature": "tasks",
                    "model": "gpt-4o-mini",
                    "tokens_in": p_tok,
                    "tokens_out": c_tok,
                    "cost_usd": cost
                }).execute()
            except Exception as e:
                print(f"Usage logging failed: {e}")
                
        
        created_tasks = []
        for t in tasks_list:
            task_data = {
                "user_id": user.id,
                "title": t.get("title", "Generated Task"),
                "description": t.get("description"),
                "priority": t.get("priority", "medium"),
                "tags": t.get("tags", []),
                "status": "todo",
                "completed": False
            }
            res = db.table("tasks").insert(task_data).execute()
            created_tasks.append(res.data[0])
            
        return created_tasks
        
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"AI suggestion failed: {str(e)}")


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    data = payload.model_dump()
    data["user_id"]  = user.id
    if data.get("due_date"):
        data["due_date"] = str(data["due_date"])  # DATE → ISO string

    result = db.table("tasks").insert(data).execute()
    return result.data[0]


# ── GET BY ID ─────────────────────────────────────────────────────────────────

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    result = (
        db.table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found.")
    return result.data


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update.")
    if updates.get("due_date"):
        updates["due_date"] = str(updates["due_date"])

    result = (
        db.table("tasks")
        .update(updates)
        .eq("id", task_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found.")
    return result.data[0]


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    db.table("tasks").delete().eq("id", task_id).eq("user_id", user.id).execute()
