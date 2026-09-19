# Phase 1 — Project Setup

## Goal

Bootstrap the AI Personal OS monorepo with a clean, modular architecture that scales across all 14 phases.

## What Was Created

### Repository Structure

```
AI-Personal-OS/
├── frontend/   # React + Vite + Tailwind CSS
├── backend/    # FastAPI
├── docs/       # Phase documentation
├── .gitignore
└── README.md
```

### Frontend Architecture

| Path | Purpose |
|------|---------|
| `src/components/layout/` | Shell components (Sidebar, Navbar, Layout) |
| `src/components/ui/` | Reusable primitives (Card, Badge) |
| `src/pages/` | Route-level page components |
| `src/hooks/` | Custom React hooks |
| `src/utils/` | Utility functions |

**Design system highlights:**
- Dark theme by default (`class="dark"` on `<html>`)
- Brand palette: Indigo `brand-*` + Cyan `accent-*`
- Typography: Inter (UI) + JetBrains Mono (code)
- Glassmorphism cards with hover animations
- Collapsible sidebar (60px → 240px)

### Backend Architecture

| Path | Purpose |
|------|---------|
| `app/main.py` | FastAPI factory, CORS, lifecycle |
| `app/routers/` | API route handlers |
| `app/models/` | Pydantic request/response schemas |
| `app/services/` | Business logic layer |
| `app/utils/config.py` | Centralized settings (pydantic-settings) |

## Running Locally

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/api/docs
```

## Key Decisions

1. **Vite path aliases** (`@/`, `@components/`, `@pages/`) avoid brittle relative imports.
2. **Pydantic-settings** centralizes all env vars — no scattered `os.getenv()` calls.
3. **BaseService** abstract class enforces the service pattern from day one.
4. **React Router v6** with Layout-wrapped routes makes adding new pages a one-liner.
5. **All auth/AI/DB stubs** are present but inactive — ready to be connected in their respective phases.

## Next Phase

➡️ **[Phase 2 — Authentication](./02_Authentication.md)** — Supabase Auth integration.
