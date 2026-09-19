"""
Web Search Tool
Searches the web using DuckDuckGo (no API key required).
Returns structured results with title, snippet, and link.
"""

import time
import requests
from langchain.tools import tool
from duckduckgo_search import DDGS


@tool
def search_web(query: str) -> str:
    """
    Search the web for current events, news, facts, or general information.
    Use this tool when you don't know the answer or need up-to-date information.
    Input should be a specific search query string.
    """
    print(f"\n[TOOL: search_web] 🌐  Searching DuckDuckGo for: \"{query}\"")
    t0 = time.time()
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, backend="lite", max_results=5):
                results.append({
                    "title":   r["title"],
                    "snippet": r["body"],
                    "link":    r["href"]
                })

        elapsed = time.time() - t0
        print(f"[TOOL: search_web] ✅  Found {len(results)} results in {elapsed:.2f}s")
        for i, r in enumerate(results):
            print(f"  [{i+1}] {r['title']}")
            print(f"       {r['snippet'][:100]}...")
            print(f"       🔗 {r['link']}")

        if not results:
            return search_wikipedia(query)

        formatted = []
        for r in results:
            formatted.append(
                f"**{r['title']}**\n{r['snippet']}\nSource: {r['link']}"
            )

        return "\n\n---\n\n".join(formatted)

    except Exception as e:
        print(f"[TOOL: search_web] ❌  DuckDuckGo failed: {e}. Falling back to Wikipedia.")
        return search_wikipedia(query)

def search_wikipedia(query: str) -> str:
    """Fallback search using the Wikipedia API."""
    print(f"[TOOL: search_web] 🏛️  Searching Wikipedia for: \"{query}\"")
    try:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
            "utf8": "1"
        }
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        search_results = data.get("query", {}).get("search", [])
        
        if not search_results:
            return "No results found on the web or Wikipedia."
            
        formatted = []
        for r in search_results[:3]:
            # Clean HTML tags from Wikipedia snippet
            import re
            snippet = re.sub('<[^<]+>', '', r['snippet'])
            formatted.append(f"**{r['title']}**\n{snippet}\nSource: Wikipedia")
            
        return "\n\n---\n\n".join(formatted)
    except Exception as e:
        print(f"[TOOL: search_web] ❌  Wikipedia search failed: {e}")
        return "Web search failed entirely. No results available."
