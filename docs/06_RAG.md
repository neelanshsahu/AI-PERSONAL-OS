# Phase 6 — Knowledge Base (RAG)

## Overview

Implemented Retrieval-Augmented Generation (RAG) using LangChain and Supabase `pgvector`. Users can upload PDF documents, which are processed, chunked, and stored as vector embeddings. The Knowledge Base UI includes an integrated RAG Chat Widget that performs semantic search against indexed documents to stream answers with specific page citations.

---

## Infrastructure

### 1. Vector Database
- Enabled the Supabase `pgvector` extension.
- Created `document_chunks` table with `VECTOR(1536)` columns to store embeddings from `text-embedding-3-small`.
- Configured IVFFlat index using `vector_cosine_ops` for fast nearest-neighbor search.
- Created Postgres RPC function `match_document_chunks()` for cosine similarity queries.

### 2. LangChain Pipeline
1. **Load**: `PyPDFLoader` extracts raw text from PDF files.
2. **Split**: `RecursiveCharacterTextSplitter` breaks text into 1,000-character chunks with 200-character overlap.
3. **Embed**: `OpenAIEmbeddings` (`text-embedding-3-small`) vectorizes the chunks.
4. **Store**: Vectors and metadata (page numbers, source) are batch-inserted into Supabase.
5. **Retrieve**: Semantic similarity search retrieves the top-5 most relevant chunks.
6. **Generate**: `ChatOpenAI` streams an answer strictly grounded in the retrieved context using a custom `PromptTemplate`.

---

## API Endpoints

| Method | Path | Description | Payload / Response |
|--------|------|-------------|-------------------|
| `POST` | `/api/v1/rag/upload` | Process, chunk, embed, and index a PDF | `multipart/form-data` with `file` |
| `POST` | `/api/v1/rag/chat` | Query knowledge base (Semantic Search) | `multipart/form-data` with `query`. Returns Server-Sent Events (SSE) with `citations` payload at completion |

---

## Usage Requirements

You must install the new LangChain and PyPDF backend dependencies. Ensure your virtual environment is active:

```bash
cd backend
pip install -r requirements.txt
```

Your `backend/.env` must contain a valid `OPENAI_API_KEY`. No additional vector DB configuration is needed, as the Supabase connection from Phase 4 is reused automatically.

---

## Features Implemented

- [x] **PDF Processing**: Uploads directly to FastAPI via `UploadFile`, processed entirely in memory/temp storage.
- [x] **LangChain Integration**: Fully integrated LangChain primitives (`OpenAIEmbeddings`, `ChatOpenAI`, `StrOutputParser`).
- [x] **Semantic Search**: Direct RAG lookup via pgvector `match_document_chunks`.
- [x] **Streaming Responses**: Answers stream via SSE, ensuring fast time-to-first-token.
- [x] **Page Citations**: RAG responses include precise page numbers from the source PDFs ensuring factual grounding.
- [x] **Frontend Widget**: Added floating "Ask Knowledge Base" RAG chat inside `KnowledgeBase.jsx`.

---

## Next Step

➡️ **Phase 7 — AI Agents** — Introduce autonomous agent logic for complex, multi-step problem solving.
