"""
RAG Service — Phase 6
Handles document parsing, chunking, embeddings, and semantic search via LangChain.

Pipeline (with terminal logging):
  INDEXING:  PDF → PyPDF parse → RecursiveTextSplitter → OpenAI Embeddings → pgvector
  RETRIEVAL: Query embed → pgvector cosine search → RRF re-rank → keyword re-rank → GPT-4o stream
"""

import os
import tempfile
import json
import time
from datetime import datetime, timezone
from typing import AsyncGenerator, List, Dict, Any

from fastapi import UploadFile
from supabase import Client

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema.output_parser import StrOutputParser

from app.utils.config import settings
from app.database.client import get_supabase

# ── LangChain component factories ────────────────────────────────────────────

def get_embeddings():
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set.")
    return OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY, model="text-embedding-3-small")

def get_llm():
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set.")
    return ChatOpenAI(api_key=settings.OPENAI_API_KEY, model="gpt-4o", temperature=0.3, streaming=True)


# ── 1. Document Indexing Pipeline ─────────────────────────────────────────────

async def process_and_index_pdf(file: UploadFile, user_id: str, db: Client) -> dict:
    """
    Indexing Pipeline (5 steps):
    1. Receive PDF
    2. Parse with PyPDFLoader
    3. Chunk with RecursiveCharacterTextSplitter
    4. Create Supabase document record
    5. Generate OpenAI embeddings → insert into pgvector
    """
    if not file.filename.endswith(".pdf"):
        raise ValueError("Currently only PDF files are supported for RAG.")

    print(f"\n{'='*60}")
    print(f"📄  RAG INDEXING PIPELINE — {file.filename}")
    print(f"{'='*60}")

    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        # STEP 1 — Receive
        print(f"[STEP 1/5] 📥  Reading uploaded file...")
        content = await file.read()
        with os.fdopen(fd, 'wb') as f:
            f.write(content)
        print(f"            ✅  {len(content) / 1024:.1f} KB received")

        # STEP 2 — Parse
        print(f"\n[STEP 2/5] 📖  Parsing PDF with PyPDFLoader...")
        loader = PyPDFLoader(temp_path)
        docs = loader.load()
        print(f"            ✅  Extracted {len(docs)} page(s)")

        # STEP 3 — Chunk
        print(f"\n[STEP 3/5] ✂️   Chunking (size=1000, overlap=200, separators=[\\n\\n, \\n, space])...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200, separators=["\n\n", "\n", " ", ""]
        )
        chunks = splitter.split_documents(docs)
        print(f"            ✅  {len(chunks)} chunks created")
        for i, chunk in enumerate(chunks[:3]):
            print(f"            Chunk[{i}]: \"{chunk.page_content[:80].replace(chr(10),' ')}...\"")
        if len(chunks) > 3:
            print(f"            ... +{len(chunks) - 3} more chunks")
        if not chunks:
            raise ValueError("No text could be extracted from the PDF.")

        # STEP 4 — Save document record & Upload to Storage
        print(f"\n[STEP 4/5] 💾  Uploading to Storage & Inserting record into Supabase...")
        
        # Best effort bucket creation (ignore if fails/exists)
        try:
            db.storage.get_bucket("documents")
        except Exception:
            try:
                db.storage.create_bucket("documents", {"public": False})
            except Exception:
                pass

        storage_path = None
        try:
            attempt_path = f"{user_id}/{int(time.time())}_{file.filename}"
            db.storage.from_("documents").upload(
                path=attempt_path,
                file=content,
                file_options={"content-type": "application/pdf"}
            )
            storage_path = attempt_path
            print("            ✅  Successfully uploaded to Supabase Storage.")
        except Exception as e:
            print(f"            ⚠️  Storage upload failed (Bucket might not exist). Skipping storage. Error: {e}")

        doc_record = {
            "user_id": user_id, "name": file.filename, "file_type": "pdf",
            "file_size": len(content), "status": "indexed",
            "storage_path": storage_path,
            "metadata": {"pages": len(docs), "chunks": len(chunks)}
        }
        res = db.table("documents").insert(doc_record).execute()
        document_id = res.data[0]["id"]
        print(f"            ✅  Document ID: {document_id}")

        # STEP 5 — Embed & store vectors
        print(f"\n[STEP 5/5] 🔢  Generating embeddings (text-embedding-3-small)...")
        t0 = time.time()
        embeddings_model = get_embeddings()
        texts = [c.page_content for c in chunks]
        vectors = embeddings_model.embed_documents(texts)
        elapsed = time.time() - t0
        print(f"            ✅  {len(vectors)} vectors (dim={len(vectors[0])}) in {elapsed:.2f}s")
        print(f"            Sample vector[0][:5]: {[round(v,4) for v in vectors[0][:5]]}")

        db_chunks = [
            {"document_id": document_id, "user_id": user_id, "content": chunk.page_content,
             "embedding": vector, "metadata": chunk.metadata, "chunk_index": i}
            for i, (chunk, vector) in enumerate(zip(chunks, vectors))
        ]
        for i in range(0, len(db_chunks), 100):
            db.table("document_chunks").insert(db_chunks[i:i+100]).execute()

        print(f"\n{'='*60}")
        print(f"✅  INDEXING COMPLETE — {len(chunks)} chunks stored in pgvector")
        print(f"{'='*60}\n")
        return res.data[0]

    finally:
        os.remove(temp_path)


# ── 2. Re-ranking Helpers ─────────────────────────────────────────────────────

def _reciprocal_rank_fusion(results: List[Dict], k: int = 60) -> List[Dict]:
    """
    Reciprocal Rank Fusion (RRF):
    RRF_score(doc) = sum( 1 / (rank + k) )
    Promotes documents that consistently rank high.
    k=60 is the standard constant that dampens the effect of outlier high ranks.
    """
    scores: Dict[str, float] = {}
    chunk_map: Dict[str, Dict] = {}
    for rank, doc in enumerate(results):
        doc_id = str(doc.get("id", rank))
        chunk_map[doc_id] = doc
        scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (rank + 1 + k)
    reranked_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    return [chunk_map[did] for did in reranked_ids]


def _keyword_rerank(chunks: List[Dict], query: str) -> List[Dict]:
    """
    Lightweight keyword re-ranker:
    Boosts chunks that contain exact query terms.
    Combined score = vector_similarity + (keyword_hits * 0.05)
    Fast post-retrieval filter before expensive LLM call.
    """
    query_terms = set(query.lower().split())
    scored = []
    for chunk in chunks:
        text_lower = chunk.get("content", "").lower()
        keyword_hits = sum(1 for term in query_terms if term in text_lower)
        sim = chunk.get("similarity", 0)
        scored.append((sim + keyword_hits * 0.05, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored]


# ── 3. Format context ─────────────────────────────────────────────────────────

def _format_docs(docs: List[Dict[str, Any]]) -> str:
    """Format retrieved chunks into a structured context block for the LLM prompt."""
    formatted = []
    for i, d in enumerate(docs):
        src = d.get("metadata", {}).get("source", "Unknown")
        page = d.get("metadata", {}).get("page", "?")
        formatted.append(f"--- Document [{i+1}] (Source: {src}, Page: {page}) ---\n{d['content']}")
    return "\n\n".join(formatted)


# ── 4. RAG Query Pipeline ─────────────────────────────────────────────────────

_RAG_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 600  # 10 minute cache

async def stream_rag_response(
    query: str,
    user_id: str,
    db: Client
) -> AsyncGenerator[str, None]:
    """
    Full RAG Query Pipeline with terminal logging & caching:

    [STEP 1] Embed query       — text-embedding-3-small
    [STEP 2] Vector retrieval  — pgvector cosine similarity (top-10)
    [STEP 3] RRF re-ranking    — Reciprocal Rank Fusion
    [STEP 4] Keyword re-rank   — Query term frequency boost
    [STEP 5] LLM streaming     — GPT-4o with retrieved context
    """
    print(f"\n{'='*60}")
    print(f"🔍  RAG QUERY PIPELINE")
    print(f"{'='*60}")
    print(f"    Query: \"{query}\"")

    # ── Check Cache First ──────────────────────────────────────────────
    cache_key = f"{user_id}::{query.strip().lower()}"
    cached = _RAG_CACHE.get(cache_key)
    if cached and (time.time() - cached["timestamp"]) < CACHE_TTL_SECONDS:
        print(f"\n[CACHE HIT] ⚡ Returning cached RAG response immediately.")
        yield f"data: {json.dumps({'type': 'chunk', 'content': cached['response']})}\n\n"
        
        if cached.get("sources"):
            yield f"data: {json.dumps({'type': 'sources', 'data': cached['sources']})}\n\n"
            
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    try:
        # ── STEP 1: Embed Query ──────────────────────────────────────────────
        print(f"\n[STEP 1/5] 🔢  Embedding query (text-embedding-3-small)...")
        t0 = time.time()
        embeddings_model = get_embeddings()
        query_vector = embeddings_model.embed_query(query)
        print(f"            ✅  Vector dim={len(query_vector)}, took {time.time()-t0:.2f}s")
        print(f"            Sample: {[round(v,4) for v in query_vector[:5]]}")

        # ── STEP 2: pgvector Cosine Similarity Search ────────────────────────
        print(f"\n[STEP 2/5] 🗄️   pgvector retrieval (cosine sim, top-10, min_sim=0.3)...")
        t0 = time.time()
        res = db.rpc(
            "match_document_chunks",
            {"query_embedding": query_vector, "user_id_filter": user_id,
             "match_count": 10, "min_similarity": 0.3}
        ).execute()
        matched_chunks = res.data
        print(f"            ✅  {len(matched_chunks)} chunks retrieved in {time.time()-t0:.2f}s")
        for i, c in enumerate(matched_chunks):
            sim = c.get("similarity", 0)
            preview = c.get("content", "")[:60].replace("\n", " ")
            print(f"            [{i+1:2d}] sim={sim:.4f} | \"{preview}...\"")

        if not matched_chunks:
            print(f"            ⚠️  No chunks matched — returning fallback message")
            no_results = "I couldn't find any relevant information in your knowledge base to answer this query."
            yield f"data: {json.dumps({'type': 'chunk', 'content': no_results})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # ── STEP 3: RRF Re-ranking ───────────────────────────────────────────
        print(f"\n[STEP 3/5] 🔀  Reciprocal Rank Fusion (RRF, k=60)...")
        rrf_ranked = _reciprocal_rank_fusion(matched_chunks)
        print(f"            ✅  RRF re-ranking complete. New order:")
        for i, c in enumerate(rrf_ranked[:5]):
            preview = c.get("content", "")[:60].replace("\n", " ")
            print(f"            [{i+1}] \"{preview}...\"")

        # ── STEP 4: Keyword Re-ranking ───────────────────────────────────────
        print(f"\n[STEP 4/5] 🔑  Keyword re-ranking (query term boost × 0.05)...")
        reranked = _keyword_rerank(rrf_ranked, query)
        top_chunks = reranked[:5]
        print(f"            ✅  Final top {len(top_chunks)} chunks after keyword re-rank:")
        for i, c in enumerate(top_chunks):
            preview = c.get("content", "")[:60].replace("\n", " ")
            print(f"            [{i+1}] \"{preview}...\"")

        # ── STEP 5: Build Context & Stream LLM ──────────────────────────────
        print(f"\n[STEP 5/5] 💬  Building context ({len(top_chunks)} chunks) → streaming GPT-4o...")
        context_text = _format_docs(top_chunks)
        print(f"            Context length: {len(context_text)} characters")

        sources = [
            {"id": c["document_id"], "page": c.get("metadata", {}).get("page", "?"),
             "content_preview": c["content"][:100] + "..."}
            for c in top_chunks
        ]

        llm = get_llm()
        prompt = PromptTemplate.from_template(
            "You are a helpful AI assistant connected to a user's personal knowledge base.\n"
            "Answer the user's question based ONLY on the following retrieved context.\n"
            "If the answer is not in the context, say 'I cannot answer this based on the provided documents.'\n"
            "When providing facts, cite the source document intuitively.\n\n"
            "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer:"
        )
        chain = prompt | llm | StrOutputParser()

        full_response = ""
        prompt_text = prompt.format(context=context_text, question=query)
        prompt_tokens = int(len(prompt_text) / 4)

        async for chunk in chain.astream({"context": context_text, "question": query}):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"

        completion_tokens = int(len(full_response) / 4)
        cost = (prompt_tokens * 5.0 + completion_tokens * 15.0) / 1_000_000

        # Save to cache
        _RAG_CACHE[cache_key] = {
            "timestamp": time.time(),
            "response": full_response,
            "sources": sources
        }

        print(f"\n{'='*60}")
        print(f"✅  RAG PIPELINE COMPLETE")
        print(f"    Prompt tokens  : {prompt_tokens}")
        print(f"    Response tokens: {completion_tokens}")
        print(f"    Estimated cost : ${cost:.6f}")
        print(f"{'='*60}\n")

        try:
            db.table("usage_logs").insert({
                "user_id": user_id, "feature": "rag", "model": "gpt-4o",
                "tokens_in": prompt_tokens, "tokens_out": completion_tokens, "cost_usd": cost
            }).execute()
        except Exception as e:
            print(f"Usage logging failed: {e}")

        yield f"data: {json.dumps({'type': 'done', 'citations': sources})}\n\n"

    except Exception as e:
        print(f"\n❌  RAG PIPELINE ERROR: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
