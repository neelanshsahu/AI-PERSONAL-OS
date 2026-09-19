# Phase 13 — Deployment

## Overview

The AI-Personal-OS project is fully configured for a modern, decoupled production deployment. The React frontend is configured for deployment on **Vercel**, and the FastAPI backend is configured for deployment on **Render**.

---

## 1. Frontend Deployment (Vercel)

The frontend uses Vite. The repository includes a `vercel.json` to handle Single Page Application (SPA) routing, ensuring that all non-asset routes are correctly pointed to `index.html`.

### Steps:
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and create a new project from your repository.
3. Set the **Framework Preset** to `Vite`.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `VITE_API_URL`: The production URL of your Render backend (e.g., `https://ai-personal-os-backend.onrender.com`). *Note: You can add this after deploying the backend.*
6. Deploy.

---

## 2. Backend Deployment (Render)

The backend uses FastAPI. The repository includes a `render.yaml` Blueprint which automatically defines the python environment, build commands, and start commands.

### Steps:
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
2. Connect your repository.
3. Render will automatically detect the `render.yaml` in the `backend` folder and provision a Web Service.
4. Render will prompt you to provide values for the non-synced environment variables:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_JWT_SECRET`: Your Supabase JWT Secret
   - `OPENAI_API_KEY`: Your OpenAI API Key (or Anthropic)
   - `CORS_ORIGINS`: A JSON array containing your Vercel frontend URL. Example: `["https://your-frontend.vercel.app"]`
5. Click **Apply** to deploy the backend.

---

## 3. Production Configuration Checklist

Before sending real users to the application, verify the following:

- [ ] **CORS**: Ensure `CORS_ORIGINS` on Render exactly matches your Vercel domain.
- [ ] **Supabase Security**: Verify that Row Level Security (RLS) is enabled on all tables (`profiles`, `chat_history`, `documents`, `tasks`, `images`, `token_usage`, `rate_limit_logs`).
- [ ] **Rate Limiting**: Monitor the `rate_limit_logs` table via Supabase dashboard to ensure legitimate users aren't being blocked.

---

## Next Step

➡️ **Phase 14 — Polish** — Final UI/UX improvements, animations, and system-wide cleanup.
