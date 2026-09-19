# Phase 7 — AI Agents

## Overview

Introduced a multi-agent autonomous workflow utilizing LangChain. The system features several modular AI agents with specialized prompts and model parameters. They operate under a Coordinator pattern to collaboratively execute complex tasks without continuous user intervention.

---

## Agent Modules

All agents inherit from a `BaseAgent` class which handles OpenAI instantiation, model configuration, and LangChain LCEL (LangChain Expression Language) pipeline construction.

| Agent | Purpose | Model | Temperature |
|-------|---------|-------|-------------|
| **PlannerAgent** | Breaks complex requests into a numbered, step-by-step execution plan. | `gpt-4o` | 0.2 (Low variance, high logic) |
| **ResearchAgent** | Analyzes a specific step from the plan and synthesizes required facts, context, and actionable information. | `gpt-4o` | 0.4 (Moderate creativity) |
| **SummarizerAgent** | Condenses the verbose research notes into highly concise, fluff-free summaries. | `gpt-4o-mini` | 0.3 (Fast and precise) |
| **WriterAgent** | Combines the plan and the summarized research to draft the final, polished output. | `gpt-4o` | 0.7 (Creative and engaging) |

### Coordinator Agent

The **CoordinatorAgent** orchestrates the workflow. When given a complex task:
1. It queries the **PlannerAgent** to break it into steps.
2. It parses the steps.
3. It dispatches a concurrent batch of tasks to the **ResearchAgent** for every step via `asyncio.gather()`.
4. It dispatches another concurrent batch to the **SummarizerAgent** to refine the raw research.
5. It passes all synthesized context to the **WriterAgent** for the final artifact.

This pattern leverages asynchronous I/O to perform wide research quickly while maintaining a strictly linear logical progression (Plan → Execute → Review → Output).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/agents/execute` | Triggers the multi-agent Coordinator for a complex task. Returns the final written artifact along with the execution plan and intermediate summaries. |

**Payload:**
```json
{
  "task": "Analyze the impact of AI on open source software and draft a comprehensive blog post structure."
}
```

---

## File Structure

```text
backend/app/services/agents/
 ├── __init__.py
 ├── base_agent.py
 ├── coordinator_agent.py
 ├── planner_agent.py
 ├── research_agent.py
 ├── summarizer_agent.py
 └── writer_agent.py
```

---

## Usage

This phase builds the modular backend infrastructure for agentic workflows. To test it:

1. Start your backend FastAPI server.
2. Send a POST request to `/api/v1/agents/execute`.
3. Watch the terminal for asynchronous multi-agent coordination.

---

## Next Step

➡️ **Phase 8 — Tool Calling** — Extend agents with the ability to interact with the environment (e.g., executing code, scraping the web, running commands).
