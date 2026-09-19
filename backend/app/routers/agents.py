"""
Agents Router — /api/v1/agents
API endpoints for triggering autonomous AI agents.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.services.agents import CoordinatorAgent

router = APIRouter(prefix="/agents", tags=["Agents"])

class AgentTaskRequest(BaseModel):
    task: str

@router.post("/execute")
async def execute_agent_task(
    payload: AgentTaskRequest,
    user: UserResponse = Depends(get_current_user)
):
    """
    Trigger the Coordinator Agent to execute a complex task using 
    the multi-agent workflow (Planner -> Researcher -> Summarizer -> Writer).
    """
    if not payload.task.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Task cannot be empty.")

    try:
        coordinator = CoordinatorAgent()
        result = await coordinator.execute(payload.task)
        return result
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Agent execution failed: {str(e)}")
