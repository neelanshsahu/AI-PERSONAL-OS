# Phase 5 — AI Chat

## Overview

Full real-time AI chat powered by the OpenAI API. Responses stream token-by-token via Server-Sent Events (SSE). All conversations and messages are persisted in the Supabase `chat_history` table. Chat titles are auto-generated using GPT after the first message.

---

## Setup

### 1. Add OpenAI API Key

```env
# backend/.env
OPENAI_API_KEY=sk-...your-key-here
```

Get your key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 2. Add Backend API URL to Frontend

```env
# frontend/.env
VITE_API_URL=http://localhost:8000
```

### 3. Install Backend Dependency

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

## Architecture

```
User types message
       │
       ▼
Chat.jsx (frontend)
  POST /api/v1/chat/{id}/send
  { content, model }
       │
       ▼
FastAPI StreamingResponse (SSE)
  ├─ Loads history from Supabase
  ├─ Calls OpenAI stream_completion()
  ├─ Yields  data: {"type":"chunk","content":"..."}  per token
  ├─ On complete → saves user + assistant messages to Supabase
  ├─ Calls generate_title() on first message
  └─ Yields  data: {"type":"done","title":"..."}
       │
       ▼
Frontend ReadableStream reader
  ├─ Appends chunks to streamingContent state
  ├─ Shows typing cursor (blinking animation)
  ├─ On done → moves to messages[], clears streamingContent
  └─ Updates conversation title in sidebar
```

---

## SSE Event Format

Every event emitted by the backend:

| `type`  | Extra fields | Description |
|---------|-------------|-------------|
| `chunk` | `content: str` | A single streamed token |
| `done`  | `title: str`   | Stream complete; includes auto-generated title |
| `error` | `message: str` | OpenAI or server error |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/v1/chat/` | List all conversations (auth required) |
| `POST` | `/api/v1/chat/` | Create a new conversation thread |
| `GET`  | `/api/v1/chat/{id}` | Get conversation + full message history |
| `POST` | `/api/v1/chat/{id}/send` | **Stream** AI response (SSE) |
| `PUT`  | `/api/v1/chat/{id}` | Update title or model |
| `DELETE` | `/api/v1/chat/{id}` | Delete a conversation |

---

## Supported Models

| Model | Speed | Cost | Recommended for |
|-------|-------|------|----------------|
| `gpt-4o` | Fast | Medium | Default — best overall |
| `gpt-4o-mini` | Very fast | Low | Quick tasks |
| `gpt-4-turbo` | Moderate | High | Complex reasoning |
| `gpt-3.5-turbo` | Fast | Very low | Simple queries |

---

## Features

| Feature | Implementation |
|---------|---------------|
| Streaming | `StreamingResponse` + `fetch` + `ReadableStream` |
| Markdown | Self-contained parser — no external dependency |
| Code blocks | Language label + monospace rendering |
| Bold / Italic / Inline code | Inline regex transforms |
| Typing cursor | CSS `blink` keyframe animation |
| History | JSONB `messages[]` array in Supabase |
| Auto title | `generate_title()` call with `gpt-4o-mini` |
| Auto scroll | `ref.scrollIntoView({ behavior: 'smooth' })` |
| Auto resize | Textarea `scrollHeight` on input |
| Model selector | Dropdown in chat header |

---

## New Files

### Backend
| File | Purpose |
|------|---------|
| [app/services/openai_service.py](file:///Applications/Antigravity.app/backend/app/services/openai_service.py) | Async streaming + title generation |

### Frontend
| File | Purpose |
|------|---------|
| [src/services/api.js](file:///Applications/Antigravity.app/frontend/src/services/api.js) | Authenticated fetch wrapper |
| [src/components/chat/MarkdownRenderer.jsx](file:///Applications/Antigravity.app/frontend/src/components/chat/MarkdownRenderer.jsx) | Zero-dependency markdown parser |

### Modified
| File | Change |
|------|--------|
| `app/routers/chat.py` | Added `POST /{id}/send` SSE endpoint |
| `app/models/chat.py` | Added `SendMessageRequest` |
| `src/pages/Chat.jsx` | Full functional rewrite |
| `requirements.txt` | Added `openai==1.35.14` |
| `frontend/.env.example` | Added `VITE_API_URL` |

---

## Next Step

➡️ **Phase 6 — Knowledge Base (RAG)** — Index documents, generate embeddings, and enable semantic search across your files.
