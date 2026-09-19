-- ============================================================
-- AI Personal OS — Phase 6: RAG Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Enable pgvector extension ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════
-- TABLE: document_chunks
-- Stores individual text chunks with their vector embeddings.
-- Each chunk links back to its parent document.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id  UUID        NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  embedding    VECTOR(1536),                         -- text-embedding-3-small / ada-002
  metadata     JSONB       NOT NULL DEFAULT '{}',   -- page, source, chunk_index, etc.
  chunk_index  INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_user_id     ON public.document_chunks(user_id);

-- IVFFlat index for approximate nearest-neighbour search (cosine)
-- NOTE: Rebuild after inserting a large number of rows for best performance.
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own chunks" ON public.document_chunks
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: match_document_chunks
-- Called by the RAG backend to perform a cosine similarity search.
-- Returns the top-k most relevant chunks for the given embedding.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding  VECTOR(1536),
  user_id_filter   UUID,
  match_count      INT     DEFAULT 5,
  min_similarity   FLOAT   DEFAULT 0.4
)
RETURNS TABLE(
  id          UUID,
  document_id UUID,
  content     TEXT,
  metadata    JSONB,
  chunk_index INT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE
    dc.user_id = user_id_filter
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) >= min_similarity
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
