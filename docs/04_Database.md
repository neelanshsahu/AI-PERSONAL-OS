# Phase 4 — Database

## Overview

Connected to Supabase PostgreSQL database using the `supabase` Python client. 
A comprehensive database schema has been applied with 6 tables supporting all current and future phases. Row Level Security (RLS) guarantees data privacy per user.

---

## Schema Setup

### 1. Execute SQL Migration

Navigate to your **Supabase Dashboard** → **SQL Editor** and execute the entire contents of:

[backend/database/migrations/001_initial_schema.sql](file:///Applications/Antigravity.app/backend/database/migrations/001_initial_schema.sql)

This script sets up:
- `profiles`: User information (auto-created on signup via a database trigger).
- `chat_history`: Stores AI conversations.
- `documents`: Knowledge base files for RAG.
- `tasks`: Tasks for the Planner.
- `images`: AI generated images.
- `token_usage`: Tracks token usage and costs.

All tables include:
- Foreign keys to `auth.users(id)`
- Auto-updating `updated_at` columns via triggers
- Row Level Security (RLS) policies scoped to `user_id`

### 2. Environment Variables

Your backend requires the Supabase Service Role Key to bypass RLS during server-to-server operations, while explicitly defining `user_id` in API calls. 

Add the following to `backend/.env`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

*(You can find these in the Supabase Dashboard under Project Settings → API).*

---

## Backend Infrastructure

### Database Client

The Supabase client is initialized as a singleton in [backend/app/database/client.py](file:///Applications/Antigravity.app/backend/app/database/client.py).
It uses `Depends(get_supabase)` to inject the client into FastAPI routers.

### Pydantic Models

All database tables have corresponding Pydantic validation schemas in `backend/app/models/`:
- `profiles.py`
- `chat.py`
- `documents.py`
- `tasks.py`
- `images.py`
- `token_usage.py`

### CRUD Routers

Fully functional REST endpoints have been implemented and registered in `backend/app/main.py`:

| Router | Path | Description |
|--------|------|-------------|
| **Profiles** | `/api/v1/profiles/me` | Fetch and update user profile. |
| **Chat** | `/api/v1/chat/*` | List, get, create, update, append messages, delete chats. |
| **Documents** | `/api/v1/documents/*` | Manage knowledge base document metadata. |
| **Tasks** | `/api/v1/tasks/*` | Complete planner CRUD with priority/status filtering. |
| **Images** | `/api/v1/images/*` | Gallery image records. |
| **Usage** | `/api/v1/usage/*` | Token usage logs and aggregations by feature/model. |

All routers verify authentication using `Depends(get_current_user)` and ensure the authenticated user ID strictly matches the table `user_id` when performing CRUD operations.

---

## Running

1. Ensure the Python virtual environment is active in the backend directory.
2. Install the new dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Restart the FastAPI server to expose the new API routes.

---

## Next Step

➡️ **Phase 5 — AI Chat** — Connect Large Language Models (LLMs) and enable AI messaging.
