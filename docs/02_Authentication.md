# Phase 2 — Authentication (Supabase Auth)

## Overview

Full authentication layer using **Supabase Auth** on the frontend and **PyJWT** on the FastAPI backend. Sessions persist across page refreshes via `localStorage` (handled automatically by `supabase-js`).

---

## Auth Flow

```
┌─────────┐    email+password    ┌────────────────┐    JWT     ┌─────────────┐
│  Login  │ ─────────────────▶   │  Supabase Auth │ ────────▶  │ AuthContext │
│  Page   │ ◀──────────────────  │  (Hosted)      │            │  (React)    │
└─────────┘    session + JWT     └────────────────┘            └──────┬──────┘
                                                                      │
                                                              isAuthenticated=true
                                                                      │
                                                              ┌───────▼───────┐
                                                              │ ProtectedRoute│
                                                              │   → Layout    │
                                                              │   → Dashboard │
                                                              └───────────────┘
                                                                      │
                                              API calls with Authorization: Bearer <JWT>
                                                                      │
                                                              ┌───────▼───────┐
                                                              │  FastAPI      │
                                                              │ JWT Middleware│
                                                              │  (PyJWT)      │
                                                              └───────────────┘
```

---

## Prerequisites

1. A **Supabase project** — [create one free at supabase.com](https://supabase.com)
2. From **Supabase Dashboard → Project Settings → API**, collect:
   - `Project URL`
   - `anon` / `public` key
   - `JWT Secret` (under **JWT Settings**)

---

## Setup

### 1. Frontend — `.env`

```bash
# Copy the template
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 2. Backend — `.env`

```bash
# Copy the template
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

### 3. Install Dependencies

**Frontend** (already installed if you ran Phase 1 setup):
```bash
cd frontend && npm install
```

**Backend:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run Both Servers

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev
# → http://localhost:5173

# Terminal 2 — Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/api/docs
```

---

## New Files — Phase 2

### Frontend

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Vite env var template |
| `src/lib/supabase.js` | Supabase client singleton |
| `src/context/AuthContext.jsx` | Global auth state + actions |
| `src/hooks/useAuth.js` | `useAuth()` convenience hook |
| `src/components/auth/ProtectedRoute.jsx` | Route guard component |

### Modified

| File | Change |
|------|--------|
| `src/pages/Login.jsx` | Full rewrite — functional sign in/up |
| `src/components/layout/Navbar.jsx` | Shows real user email + sign out |
| `src/App.jsx` | Wrapped in `<AuthProvider>`, routes guarded |
| `frontend/package.json` | Added `@supabase/supabase-js` |

### Backend

| File | Purpose |
|------|---------|
| `app/middleware/auth.py` | JWT verification FastAPI dependency |
| `app/routers/auth.py` | `GET /api/v1/auth/me` |
| `app/models/auth.py` | `UserResponse`, `AuthVerifyResponse` |

### Modified

| File | Change |
|------|--------|
| `requirements.txt` | Added `PyJWT`, `cryptography` |
| `app/utils/config.py` | Added `SUPABASE_JWT_SECRET` |
| `app/main.py` | Registered auth router |

---

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/api/v1/auth/me` | ✅ | Returns current user from JWT |
| `GET` | `/api/v1/auth/verify` | ✅ | Alias for token validation |

### Example Request

```bash
# Replace <token> with the JWT from Supabase session
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/auth/me
```

### Example Response

```json
{
  "status": "ok",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com",
    "role": "authenticated",
    "aud": "authenticated"
  }
}
```

---

## AuthContext API

```jsx
const {
  user,             // Supabase User object (null if not logged in)
  session,          // Full session (includes access_token JWT)
  loading,          // true while hydrating from localStorage on mount
  isAuthenticated,  // boolean — shorthand for !!user
  signUp,           // async (email, password) → { data, error }
  signIn,           // async (email, password) → { data, error }
  signOut,          // async () → void
  getAccessToken,   // async () → string | null  — for API calls
} = useAuth()
```

### Making Authenticated API Calls

```js
import { useAuth } from '@/hooks/useAuth'

const { getAccessToken } = useAuth()

const token = await getAccessToken()
const res = await fetch('/api/v1/auth/me', {
  headers: { Authorization: `Bearer ${token}` },
})
```

---

## Backend — Protecting Routes

```python
from app.middleware.auth import get_current_user
from app.models.auth import UserResponse

@router.get("/protected-endpoint")
async def my_route(user: UserResponse = Depends(get_current_user)):
    return {"message": f"Hello, {user.email}"}
```

---

## Supabase Dashboard Settings

| Setting | Recommended for Development |
|---------|----------------------------|
| **Email Confirmations** | Disable (Settings → Auth → Email) for faster dev iteration |
| **Site URL** | `http://localhost:5173` |
| **Redirect URLs** | `http://localhost:5173/**` |

---

## Session Persistence

`supabase-js` automatically stores sessions in `localStorage` under the key `sb-<project-ref>-auth-token`.

On every page load, `AuthContext` calls `supabase.auth.getSession()` which reads from `localStorage` — no manual persistence needed.

Tokens auto-refresh 60 seconds before expiry via `autoRefreshToken: true`.

---

## Next Phase

➡️ **[Phase 3 — Dashboard & UI Components](./03_Dashboard.md)**
