"""
RAG Router — /api/v1/rag
Endpoints for uploading PDFs to the knowledge base and querying them.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.services.rag_service import process_and_index_pdf, stream_rag_response
from app.middleware.rate_limiter import RateLimitDependency, SlidingWindowRateLimiter

router = APIRouter(prefix="/rag", tags=["RAG"])

# Rate limit: max 5 requests per 30 seconds via sliding window
rag_rate_limit = RateLimitDependency(SlidingWindowRateLimiter(limit=5, window=30))


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_supabase)
):
    """
    Upload a PDF document.
    Parses, chunks, embeds, and stores in Supabase vector DB.
    """
    try:
        doc_record = await process_and_index_pdf(file, user.id, db)
        return {"message": "Document indexed successfully", "document": doc_record}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Indexing failed: {str(e)}")


@router.post("/chat", dependencies=[Depends(rag_rate_limit)])
async def rag_chat(
    query: str = Form(...),
    user: UserResponse = Depends(get_current_user),
    db: Client = Depends(get_supabase)
):
    """
    Query the knowledge base.
    Streams back the LLM answer using SSE, with document citations.
    """
    if not query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty.")

    return StreamingResponse(
        stream_rag_response(query, user.id, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
