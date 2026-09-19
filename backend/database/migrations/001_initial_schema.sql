-- ============================================================
-- AI Personal OS — Phase 4: Initial Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector will be enabled in Phase 6 (RAG):
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ── Helper: auto-update updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- TABLE 1: profiles
-- Extends auth.users — one row per registered user.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 2: chat_history
-- AI conversations — each row is one conversation thread.
-- Messages stored as JSONB array for Phase 5.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chat_history (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT 'New Chat',
  model      TEXT        NOT NULL DEFAULT 'gpt-4',
  messages   JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created  ON public.chat_history(created_at DESC);

CREATE TRIGGER trg_chat_updated_at
  BEFORE UPDATE ON public.chat_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own chats" ON public.chat_history
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 3: documents
-- Knowledge base documents — Phase 6 adds embedding column.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  file_type   TEXT        NOT NULL,                     -- pdf | md | docx | txt | csv
  file_size   BIGINT,                                   -- bytes
  storage_path TEXT,                                    -- Supabase Storage path
  content     TEXT,                                     -- extracted text
  metadata    JSONB       NOT NULL DEFAULT '{}',        -- pages, tags, etc.
  status      TEXT        NOT NULL DEFAULT 'pending',   -- pending | processing | indexed | failed
  -- embedding VECTOR(1536),                           -- Phase 6: pgvector
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status   ON public.documents(status);

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own documents" ON public.documents
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 4: tasks
-- Planner tasks with priority, status, due dates, and tags.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  priority    TEXT        NOT NULL DEFAULT 'medium',  -- low | medium | high
  status      TEXT        NOT NULL DEFAULT 'todo',    -- todo | in_progress | done
  due_date    DATE,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id   ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date  ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status    ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority  ON public.tasks(priority);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own tasks" ON public.tasks
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 5: images
-- AI-generated images — Phase 9 populates url from storage.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.images (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt          TEXT        NOT NULL,
  negative_prompt TEXT,
  model           TEXT        NOT NULL DEFAULT 'dall-e-3',
  style           TEXT        NOT NULL DEFAULT 'photorealistic',
  size            TEXT        NOT NULL DEFAULT '1024x1024',
  storage_path    TEXT,                               -- Supabase Storage path
  url             TEXT,                               -- public URL
  metadata        JSONB       NOT NULL DEFAULT '{}',  -- steps, cfg, seed, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_user_id   ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created   ON public.images(created_at DESC);

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own images" ON public.images
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- TABLE 6: token_usage
-- Tracks AI token consumption and cost per feature per request.
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.token_usage (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature       TEXT        NOT NULL,   -- chat | rag | image | agent | tool
  model         TEXT        NOT NULL,   -- gpt-4 | claude-3-5-sonnet | dall-e-3 | etc.
  input_tokens  INT         NOT NULL DEFAULT 0,
  output_tokens INT         NOT NULL DEFAULT 0,
  total_tokens  INT         GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd      NUMERIC(12,8) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_id  ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_feature  ON public.token_usage(feature);
CREATE INDEX IF NOT EXISTS idx_usage_created  ON public.token_usage(created_at DESC);

ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage"   ON public.token_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert usage"   ON public.token_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
