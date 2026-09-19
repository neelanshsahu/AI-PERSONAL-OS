# Phase 11 — Analytics

## Overview

Transformed the Analytics Dashboard into a live, real-time data visualization hub. The system aggregates backend token usage and API request events, presenting them beautifully on the frontend using custom CSS-driven charts and metrics.

---

## Architecture & Features

### 1. Database & Tracking
- Inherits the `token_usage` table configured in Phase 4.
- Every major AI action (Chat, RAG, Image Generation, Tool Execution) internally calls a usage logging utility to write an event containing the `feature`, `model`, `input_tokens`, `output_tokens`, and `cost_usd`.

### 2. Backend Endpoints (`app/routers/usage.py`)
- **`GET /api/v1/usage/`**: Retrieves raw, paginated session events.
- **`GET /api/v1/usage/summary`**: Performs server-side aggregations for total requests, tokens, costs, and breakdown groupings by active feature and model.
- **`GET /api/v1/usage/chart`**: Aggregates time-series data over the last N days for visualization.

### 3. Frontend Dashboard (`Analytics.jsx`)
- **Top Metrics**: Displays real-time aggregate totals (Total Requests, Tokens Used, Total Cost, Active Models).
- **Daily Usage Chart**: A custom CSS flex-based bar chart visualizing query volume over the past 7 days (complete with tooltips and max-height scaling).
- **Tool Usage Distribution**: Visual progress bars representing the percentage breakdown of tokens consumed by different features (e.g., chat, rag, agents).
- **Recent Sessions Table**: A clear, sortable ledger of recent requests detailing exact token counts and costs.

---

## Setup

No additional packages are required. The charts are built purely via React and standard CSS utilities (Tailwind), ensuring maximum performance without heavy dependencies like Recharts or Chart.js.

---

## Next Step

➡️ **Phase 12 — Rate Limit** — Protect backend endpoints against abuse by implementing a sliding-window rate limiter via Redis or purely memory-based strategies.
