# ⚡ AI Personal OS

> **An intelligent, unified personal operating system** powered by LLMs, autonomous agents, RAG pipelines, AI task planner, image generator, and real-time usage analytics — built with a modern React frontend and a robust FastAPI backend.

[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](#-license)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-38bdf8?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-Supabase%20%2B%20pgvector-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![LLM](https://img.shields.io/badge/AI-OpenAI%20%2B%20LangChain-6366f1?style=flat-square&logo=openai)](https://openai.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Database Setup](#2-database-setup-supabase)
  - [Frontend Setup](#3-frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Project Documentation](#-project-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 Overview

**AI Personal OS** is a full-stack dashboard designed as a personal AI operating system. It aggregates conversational AI models, personal document vector search (RAG), autonomous task management, AI image generation, and system telemetry into a single, cohesive, glassmorphism-styled web interface.

Whether you want to chat with custom LLM prompts, search through uploaded personal documents, manage tasks on an AI-powered Kanban board, or track token consumption costs in real-time, **AI Personal OS** provides an enterprise-grade foundation for personal AI productivity.

---

## ✨ Key Features

### 💬 1. Conversational AI Chat
- **Multi-Model Support**: Switch between OpenAI (GPT-4o, GPT-4-turbo, GPT-3.5) and Anthropic models seamlessly.
- **Streaming Responses**: Real-time server-sent token streaming for responsive interactions.
- **Rich Formatting**: Markdown rendering, syntax-highlighted code blocks, copy-to-clipboard, and conversation history persistence.

### 📚 2. Knowledge Base & RAG Pipeline
- **Document Ingestion**: Upload PDF, Markdown, and plain text files.
- **Vector Search**: Automatic text chunking, embedding generation, and vector similarity search powered by Supabase `pgvector`.
- **Context Injection**: Retrieve relevant source passages dynamically during chat sessions for source-grounded answers.

### 📅 3. AI Task Planner
- **Kanban & List Views**: Organize tasks by status (*Todo*, *In Progress*, *Completed*) and priority (*Low*, *Medium*, *High*, *Urgent*).
- **Smart Scheduling**: AI-generated task suggestions, subtasks, and deadline tracking.
- **Real-time Sync**: Direct integration with Supabase database for instant updates across devices.

### 🎨 4. AI Image Generation
- **Text-to-Image Synthesis**: Generate images from text prompts using AI image models.
- **Preset Styles & Aspect Ratios**: Choose target aspect ratios (1:1, 16:9, 9:16) and stylistic presets (Cyberpunk, Anime, Photorealistic, Minimalist).
- **Image Gallery**: View, download, and manage your generated image history.

### 📊 5. Analytics & Token Tracking
- **Telemetry**: Monitor daily API usage, total token consumption (prompt vs. completion), and document storage stats.
- **Cost Estimation**: Live breakdown of compute costs based on model usage rates.
- **Performance Health**: Built-in backend health checks and response latency monitoring.

### 🔒 6. Auth & Security
- **Supabase Authentication**: Email/Password authentication flow with signup, login, session persistence, and password reset.
- **JWT Protection**: FastAPI backend middleware validating Supabase JWT tokens on protected endpoints.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │      React 18 Frontend    │
                                  │ (Vite + Tailwind + Lucide)│
                                  └─────────────┬─────────────┘
                                                │
                                    HTTP / REST / Streaming
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │     FastAPI Backend       │
                                  │ (Python + Pydantic + JWT) │
                                  └──────┬──────────────┬─────┘
                                         │              │
                   ┌─────────────────────┘              └─────────────────────┐
                   ▼                                                          ▼
    ┌───────────────────────────┐                              ┌───────────────────────────┐
    │     Supabase Database     │                              │   External AI APIs        │
    │  - PostgreSQL + pgvector  │                              │  - OpenAI (GPT-4o, Embed) │
    │  - Auth & User Profiles   │                              │  - Anthropic / Pollinations│
    │  - Document Embeddings    │                              │  - DuckDuckGo Search      │
    └───────────────────────────┘                              └───────────────────────────┘
```

---

## 🛠️ Tech Stack

| Domain | Technology / Library | Description |
|---|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) | High-performance SPA with HMR |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Custom dark mode design system & micro-animations |
| **Routing & Auth** | [React Router v6](https://reactrouter.com/) + [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | Client-side routing and authentication context |
| **Backend Framework**| [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | Modern, high-async Python web framework |
| **Database & Vectors** | [Supabase](https://supabase.com/) (`pgvector`) | PostgreSQL database, Auth, vector embeddings |
| **AI & RAG** | [LangChain](https://www.langchain.com/) + [OpenAI SDK](https://platform.openai.com/) | LLM orchestration, text splitters, embeddings |
| **API Client & Auth** | `httpx` + `PyJWT` | Asynchronous HTTP requests & Supabase JWT verification |

---

## 📁 Project Structure

```
AI_Personal_Dashboard/
├── frontend/                        # React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/              # UI components
│   │   │   ├── analytics/           # Usage graphs & metric cards
│   │   │   ├── chat/                # Chat window, prompt bar, model switcher
│   │   │   ├── image/               # Image generator controls & gallery
│   │   │   ├── knowledge/           # Document uploader & file list
│   │   │   ├── layout/              # Navbar, Sidebar, App Shell layout
│   │   │   ├── planner/             # Task board & modal dialogs
│   │   │   └── ui/                  # Reusable UI primitives (Card, Badge, Button)
│   │   ├── context/                 # Auth & state providers
│   │   ├── hooks/                   # Custom hooks (useAuth, useSidebar, etc.)
│   │   ├── lib/                     # Supabase client setup
│   │   ├── pages/                   # Main view routes (Dashboard, Chat, RAG, etc.)
│   │   ├── services/                # API service modules
│   │   ├── App.jsx                  # Main router configuration
│   │   └── index.css                # Global styles & Tailwind utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                         # FastAPI Backend
│   ├── app/
│   │   ├── main.py                  # Application entrypoint & CORS setup
│   │   ├── database/                # Supabase Python client connection
│   │   ├── middleware/              # Auth & rate-limiting middleware
│   │   ├── models/                  # Pydantic schemas (Chat, RAG, Tasks, Usage)
│   │   ├── routers/                 # API endpoint handlers
│   │   │   ├── auth.py              # User authentication endpoints
│   │   │   ├── chat.py              # LLM streaming & completion router
│   │   │   ├── documents.py         # Document management
│   │   │   ├── health.py            # Health check endpoints
│   │   │   ├── images.py            # Image generation endpoints
│   │   │   ├── profiles.py          # User profile endpoints
│   │   │   ├── rag.py               # Vector search & embedding endpoints
│   │   │   ├── tasks.py             # Task CRUD & planner endpoints
│   │   │   ├── tools.py             # Web search & external tools
│   │   │   └── usage.py             # Token & analytics metrics
│   │   ├── services/                # Business logic (LLM, RAG, Task management)
│   │   └── utils/                   # Config management (pydantic-settings)
│   ├── database/
│   │   └── migrations/              # PostgreSQL & pgvector SQL setup scripts
│   ├── requirements.txt
│   ├── render.yaml                  # Backend deployment config for Render
│   └── .env.example
│
├── docs/                            # Detailed phase-by-phase documentation
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local environment:
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `v3.11` or higher
- **Supabase Account**: A free Supabase project with `pgvector` enabled.
- **OpenAI API Key**: For LLM chat and embedding generation.

---

### 1. Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On macOS/Linux
# venv\Scripts\activate        # On Windows

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Create your environment configuration file
cp .env.example .env

# Edit .env and supply your Supabase and OpenAI keys (see Environment Variables section)

# 5. Run the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

The FastAPI server will be available at `http://localhost:8000`. You can test the API by accessing the interactive docs at `http://localhost:8000/api/docs`.

---

### 2. Database Setup (Supabase)

1. Create a new project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Execute the migration SQL files located in `backend/database/migrations/` in order:
   - `001_initial_schema.sql` (Creates users, profiles, tasks, images, usage tables)
   - `002_rag_schema.sql` (Enables `vector` extension, creates `documents` and `document_chunks` vector table)
   - `003_rate_limit_logs.sql` (Creates rate limit logging tables)

---

### 3. Frontend Setup

```bash
# 1. Open a new terminal and navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Create your environment configuration file
cp .env.example .env.local

# Edit .env.local with your Supabase URL and Anon Key

# 4. Start the Vite development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`. The Vite development server automatically proxies backend requests to `http://localhost:8000`.

---

## 🔑 Environment Variables

### Backend `.env`

```env
APP_NAME=AI-Personal-OS
APP_VERSION=1.0.0
ENV=development
PORT=8000
DEBUG=true

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI Provider Keys
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend `.env.local`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000
```

---

## 📖 API Documentation

Once the backend is running, FastAPI automatically generates dynamic OpenAPI documentation:

- **Swagger UI**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc**: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

### Key API Routes Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/health` | System health check & service status | ❌ |
| `POST` | `/api/v1/chat/stream` | Stream AI chat response (OpenAI/Anthropic) | ✅ |
| `GET` | `/api/v1/chat/conversations` | Fetch user conversation history | ✅ |
| `POST` | `/api/v1/rag/upload` | Ingest document & generate vector chunks | ✅ |
| `POST` | `/api/v1/rag/query` | Perform vector similarity search | ✅ |
| `GET` | `/api/v1/tasks` | Get user task board items | ✅ |
| `POST` | `/api/v1/tasks` | Create new task item | ✅ |
| `POST` | `/api/v1/images/generate` | Generate AI image from text prompt | ✅ |
| `GET` | `/api/v1/usage/summary` | Fetch token usage & analytics summary | ✅ |

---

## 📚 Project Documentation

Detailed architecture specifications and feature breakdown documents are available in the [`docs/`](./docs) directory:

| Phase | Guide | Description |
|---|---|---|
| Phase 1 | [Project Setup](./docs/01_Project_Setup.md) | Initial scaffold & environment setup |
| Phase 2 | [Authentication](./docs/02_Authentication.md) | Supabase auth integration & JWT verification |
| Phase 3 | [Dashboard](./docs/03_Dashboard.md) | Glassmorphism UI components & layouts |
| Phase 4 | [Database](./docs/04_Database.md) | Schema design, relations, and RLS policies |
| Phase 5 | [AI Chat](./docs/05_AI_Chat.md) | Multi-model streaming chat integration |
| Phase 6 | [RAG Pipeline](./docs/06_RAG.md) | Vector embeddings & document retrieval |
| Phase 7 | [Agents](./docs/07_Agents.md) | Autonomous agent execution engine |
| Phase 8 | [Tool Calling](./docs/08_Tool_Calling.md) | External tool integration (Web search, duckduckgo) |
| Phase 9 | [Image Generation](./docs/09_Image_Generation.md) | Image generation integration & presets |
| Phase 10 | [AI Planner](./docs/10_Planner.md) | Task board management & smart scheduler |
| Phase 11 | [Analytics](./docs/11_Analytics.md) | Token usage telemetry & cost breakdown |
| Phase 12 | [Rate Limiting](./docs/12_Rate_Limit.md) | Token bucket rate limiting middleware |
| Phase 13 | [Deployment](./docs/13_Deployment.md) | Cloud hosting setup (Vercel & Render) |
| Phase 14 | [Polish & Launch](./docs/14_Polish.md) | UI polish, optimizations, and audit |

---

## 🚀 Deployment

### Frontend (Vercel)
The frontend includes a pre-configured `frontend/vercel.json` file for single-click deployment on [Vercel](https://vercel.com).
1. Connect your repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` to Vercel Environment Variables.

### Backend (Render / Railway)
The backend includes a `backend/render.yaml` configuration file for deployment on [Render](https://render.com).
1. Create a new Web Service on Render from your repository.
2. Set Root Directory to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure environment variables in the Render dashboard.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Crafted with ❤️ for personal AI productivity.
</p>
