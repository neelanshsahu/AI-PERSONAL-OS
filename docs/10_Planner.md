# Phase 10 — AI Planner

## Overview

Upgraded the static Planner UI into a fully functional AI-assisted task management system. The planner connects directly to the Supabase backend to persist task data. It features real-time filtering, task completion tracking, and an integrated AI task breakdown tool that converts high-level goals into actionable, prioritized subtasks.

---

## Architecture & Features

### 1. Database & CRUD
- Uses the `tasks` table created in Phase 4.
- Implements standard REST endpoints (`GET`, `POST`, `PUT`, `DELETE` at `/api/v1/tasks/`) for viewing, creating, updating (e.g. toggling `completed`), and deleting tasks.
- Supports filtering via query parameters (`priority`, `status`, `completed`).

### 2. AI Suggestions Engine
- Built a new `POST /api/v1/tasks/suggest` endpoint.
- Accepts a high-level goal from the user (e.g., *"Plan a surprise birthday party"*).
- Prompts OpenAI (`gpt-4o-mini`) using `response_format={"type": "json_object"}` to enforce a strict JSON output schema.
- The AI autonomously generates a list of logically sequenced tasks with assigned priorities and relevant tags.
- The generated tasks are parsed, formatted, and instantly inserted into the database as pending tasks.

### 3. Frontend Planner (`Planner.jsx`)
- **Quick Add**: Easily add new medium-priority tasks straight from the header.
- **Smart Filtering**: Switch between "All", "Today", "Upcoming", and "Completed" dynamically based on `due_date` fields.
- **AI Modal**: An elegant overlay to enter large goals, which triggers the AI suggestion pipeline and updates the task list optimistically.
- **Dynamic Stats**: Calculates total tasks, overdue counts, and completion metrics dynamically in the UI.

---

## Usage

1. Open the Planner from the sidebar.
2. Click **AI Suggest** in the top right.
3. Type a large project or goal.
4. Watch as the AI breaks it down and populates your planner with structured, prioritized tasks.

---

## Next Step

➡️ **Phase 11 — Analytics** — Integrate usage tracking and dashboard data visualization.
