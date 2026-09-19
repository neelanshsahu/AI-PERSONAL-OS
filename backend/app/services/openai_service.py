"""
OpenAI Service — Phase 5: AI Chat
Handles streaming completions with async generator for SSE delivery.
"""

from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.utils.config import settings

SYSTEM_PROMPT = (
    "You are a helpful AI assistant integrated into an AI Personal Operating System. "
    "You help users with research, coding, writing, data analysis, and general questions. "
    "Format responses with Markdown where appropriate (code blocks, lists, headings) for clarity."
)

# ── Supported models ──────────────────────────────────────────────────────────
SUPPORTED_MODELS = {"gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"}
DEFAULT_MODEL = "gpt-4o"


def _get_client() -> AsyncOpenAI:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to backend/.env and restart the server."
        )
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def stream_completion(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
) -> AsyncGenerator[dict, None]:
    """
    Stream chat completion from OpenAI.
    Yields dicts with 'type'='text' or 'type'='usage'.
    """
    if model not in SUPPORTED_MODELS:
        model = DEFAULT_MODEL

    client = _get_client()

    stream = await client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, *messages],
        stream=True,
        stream_options={"include_usage": True},
        temperature=0.7,
        max_tokens=4096,
    )

    async for chunk in stream:
        if not chunk.choices:
            if chunk.usage:
                yield {
                    "type": "usage", 
                    "prompt_tokens": chunk.usage.prompt_tokens, 
                    "completion_tokens": chunk.usage.completion_tokens
                }
            continue

        delta = chunk.choices[0].delta
        if delta.content:
            yield {"type": "text", "content": delta.content}


async def generate_title(first_message: str, model: str = "gpt-4o-mini") -> tuple[str, int, int]:
    """
    Generate a short conversation title from the user's first message.
    Returns (title, prompt_tokens, completion_tokens).
    """
    client = _get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "Generate a very short (3-6 word) title for a chat conversation "
                    "based on the user's first message. Return ONLY the title — no quotes, "
                    "no punctuation at the end, no explanations."
                ),
            },
            {"role": "user", "content": first_message},
        ],
        max_tokens=20,
        temperature=0.5,
    )
    title = response.choices[0].message.content.strip()
    p_tokens = response.usage.prompt_tokens if response.usage else 0
    c_tokens = response.usage.completion_tokens if response.usage else 0
    return title, p_tokens, c_tokens
