"""
Tool Executor / Registry
Binds all tools to an LLM and manages the agentic loop via LangChain's AgentExecutor.

Architecture:
  User query → LLM decides which tool(s) to call → Tool executes → LLM synthesizes result
  This loop continues until the LLM has enough information to answer.
"""

import time
from typing import List, Any
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.globals import set_llm_cache
from langchain.cache import SQLiteCache

# Initialize SQLite Cache for LLM responses
set_llm_cache(SQLiteCache(database_path=".langchain.db"))

from app.utils.config import settings
from .calculator import calculate
from .calendar import get_current_datetime
from .weather import get_weather
from .web_search import search_web
from .kb_search import get_kb_search_tool


def execute_with_tools(prompt: str, user_id: str, db, chat_history: List[dict] = None) -> str:
    """
    Instantiate all tools, bind them to GPT-4o, and run the agentic loop.

    Tools available:
      - calculate           : Safe math expression evaluator
      - get_current_datetime: Returns the current date and time
      - get_weather         : Fetches weather via Open-Meteo (free, no key)
      - search_web          : DuckDuckGo web search (free, no key)
      - search_knowledge_base: User's personal RAG document search
    """
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set.")

    print(f"\n{'='*60}")
    print(f"🤖  TOOL-CALLING AGENT PIPELINE")
    print(f"{'='*60}")
    print(f"    Query: \"{prompt}\"")
    print(f"    Model: gpt-4o (temperature=0.0 for determinism)")

    llm = ChatOpenAI(api_key=settings.OPENAI_API_KEY, model="gpt-4o", temperature=0.0)

    # Register all tools
    kb_tool = get_kb_search_tool(user_id, db)
    tools = [calculate, get_current_datetime, get_weather, search_web, kb_tool]

    print(f"\n    Registered tools ({len(tools)}):")
    for t in tools:
        print(f"      • {t.name}: {t.description[:70]}...")

    prompt_template = ChatPromptTemplate.from_messages([
         ("system",
         "You are a helpful AI assistant equipped with various tools. "
         "Use your tools to answer the user's question accurately and completely. "
         "Always prefer using a tool over guessing. "
         "If you need coordinates for weather, use web_search first to find them. "
         "CRITICAL: When using the search_web tool, use concise, keyword-based search queries (e.g. 'IoT trends 2026'). "
         "CRITICAL PRESENTATION RULE: If a tool (like search_web) returns 'no results' or fails, DO NOT EVER mention that the search failed, that you couldn't find results, or apologize. Seamlessly provide the best possible answer using your own extensive knowledge, presenting it confidently as if it is the correct and requested information."),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # Convert simple dict history to langchain message format if provided
    langchain_history = []
    if chat_history:
        for msg in chat_history:
            if msg.get("role") == "user":
                langchain_history.append(("human", msg.get("content", "")))
            elif msg.get("role") == "assistant":
                langchain_history.append(("ai", msg.get("content", "")))

    # verbose=True makes LangChain print every tool call + result to terminal
    agent = create_tool_calling_agent(llm, tools, prompt_template)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=8)

    print(f"\n    Starting agentic loop (verbose=True)...")
    print(f"{'─'*60}")
    t0 = time.time()
    response = agent_executor.invoke({
        "input": prompt,
        "chat_history": langchain_history
    })
    elapsed = time.time() - t0

    print(f"{'─'*60}")
    print(f"✅  AGENT COMPLETE in {elapsed:.2f}s")
    print(f"    Answer: \"{str(response.get('output', ''))[:200]}...\"")
    print(f"{'='*60}\n")

    return response.get("output", "I could not generate an answer.")
