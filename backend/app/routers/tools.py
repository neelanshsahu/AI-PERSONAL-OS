"""
Tools Router — /api/v1/tools
Endpoints for testing OpenAI tool calling.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.services.tools import execute_with_tools

router = APIRouter(prefix="/tools", tags=["Tools"])

class ToolQueryRequest(BaseModel):
    query: str

@router.post("/execute")
async def run_tool_agent(
    payload: ToolQueryRequest,
    user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_supabase)
):
    """
    Pass a query to the AI agent equipped with tools.
    The agent will autonomously decide which tools to use to find the answer.
    """
    if not payload.query.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Query cannot be empty.")

    try:
        # execute_with_tools spins up the LangChain AgentExecutor
        result = execute_with_tools(payload.query, user.id, db)
        return {"query": payload.query, "result": result}
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Agent tool execution failed: {str(e)}")
