# Phase 8 — Tool Calling

## Overview

Added OpenAI tool calling (function calling) capabilities to the backend via LangChain's `create_tool_calling_agent`. The AI can now autonomously decide when and how to interact with external systems to answer user queries that require real-time data, complex computation, or personal context.

---

## Implemented Tools

Each tool is implemented as a modular function decorated with LangChain's `@tool` wrapper, located in `backend/app/services/tools/`.

1. **Calculator** (`calculator.py`): Performs complex mathematical operations safely using a sanitized AST evaluator.
2. **Calendar** (`calendar.py`): Retrieves the exact current date and time for any timezone (default UTC).
3. **Weather** (`weather.py`): Fetches real-time weather forecasts (temperature and wind speed) based on latitude and longitude using the free Open-Meteo API.
4. **Knowledge Base Search** (`kb_search.py`): A factory-generated tool that injects user context and Postgres connections to search the user's uploaded RAG documents.
5. **Web Search** (`web_search.py`): Queries DuckDuckGo for the top 3 live web search results, crucial for providing current events and real-time context.

---

## Architecture

```text
User Query -> POST /api/v1/tools/execute
                │
                ▼
        AgentExecutor (tool_executor.py)
                │
         [OpenAI gpt-4o Model]
         (binds tool schema)
                │
          <needs data?>
           /        \
        YES          NO
        /              \
 [Invokes Tool(s)]   [Final Answer]
       |
  [Tool Result]
       |
 [Re-evaluates]
```

The `AgentExecutor` automatically manages the multi-turn loop: executing the tool, passing the result back to the model, and determining if more tools are needed before formulating the final answer.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/tools/execute` | Submits a query to the tool-enabled agent. The agent will iteratively execute tools until it finds the answer. |

**Payload:**
```json
{
  "query": "What's the weather like in New York today and what is 12% of 4550?"
}
```

---

## Usage Requirements

Install the new dependencies required for web searching and HTTP requests:

```bash
cd backend
pip install -r requirements.txt
```

---

## Next Step

➡️ **Phase 9 — Image Generation** — Integrate AI image generation models to create visuals dynamically.
