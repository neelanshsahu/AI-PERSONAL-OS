"""
Documents router — /api/v1/documents
CRUD for the public.documents table.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.database.client import get_supabase
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse
from app.models.documents import DocumentCreate, DocumentUpdate, DocumentResponse

router = APIRouter(prefix="/documents", tags=["Documents"])


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit:         int           = 50,
    offset:        int           = 0,
    user:          UserResponse  = Depends(get_current_user),
    db:            Client        = Depends(get_supabase),
):
    """List documents for the current user. Optionally filter by status."""
    query = (
        db.table("documents")
        .select("id, name, file_type, file_size, metadata, status, storage_path, created_at, updated_at, user_id")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
    )
    if status_filter:
        query = query.eq("status", status_filter)

    result = query.range(offset, offset + limit - 1).execute()
    return result.data


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    payload: DocumentCreate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    """Register a document in the database."""
    data = payload.model_dump()
    data["user_id"] = user.id
    result = db.table("documents").insert(data).execute()
    return result.data[0]


# ── GET BY ID ─────────────────────────────────────────────────────────────────

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    user:   UserResponse = Depends(get_current_user),
    db:     Client       = Depends(get_supabase),
):
    result = (
        db.table("documents")
        .select("*")
        .eq("id", doc_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    return result.data


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id:  str,
    payload: DocumentUpdate,
    user:    UserResponse = Depends(get_current_user),
    db:      Client       = Depends(get_supabase),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update.")

    result = (
        db.table("documents")
        .update(updates)
        .eq("id", doc_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    return result.data[0]


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str,
    user:   UserResponse = Depends(get_current_user),
    db:     Client       = Depends(get_supabase),
):
    doc = db.table("documents").select("storage_path").eq("id", doc_id).eq("user_id", user.id).single().execute()
    if doc.data and doc.data.get("storage_path"):
        try:
            db.storage.from_("documents").remove([doc.data["storage_path"]])
        except Exception:
            pass # Best effort cleanup

    db.table("documents").delete().eq("id", doc_id).eq("user_id", user.id).execute()

# ── URL ───────────────────────────────────────────────────────────────────────

@router.get("/{doc_id}/url")
async def get_document_url(
    doc_id: str,
    user:   UserResponse = Depends(get_current_user),
    db:     Client       = Depends(get_supabase),
):
    """Get a signed URL to view/download the document."""
    result = (
        db.table("documents")
        .select("storage_path")
        .eq("id", doc_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data or not result.data.get("storage_path"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document or file not found.")

    res = db.storage.from_("documents").create_signed_url(result.data["storage_path"], 3600)
    if not res.get("signedURL"):
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate URL.")
        
    return {"url": res["signedURL"]}
