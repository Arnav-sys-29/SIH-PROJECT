"""Government Portals Web Search Tool.

Queries official Indian government domains (.gov.in and .nic.in) using DDGS.
"""

import asyncio
import logging
import warnings
from typing import List, Dict, Any

warnings.filterwarnings("ignore", category=RuntimeWarning)

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

# OpenAI Tool Definition for LLM Function Calling
GOV_SEARCH_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "search_gov_portals",
        "description": (
            "Search official Indian government portals (.gov.in and .nic.in) for circulars, "
            "rules, schemes, guidelines, PMFBY insurance details, and Ministry of Cooperation notifications."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search terms to look up on government portals.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of search results to return.",
                    "default": 4,
                },
            },
            "required": ["query"],
        },
    },
}


def _execute_sync_search(query: str, max_results: int = 4) -> List[Dict[str, str]]:
    """Synchronous worker that queries DDGS and enforces government domain restrictions.

    CRITICAL REQUIREMENT:
    Appends `site:gov.in OR site:nic.in` to ensure only official government portals are fetched.
    """
    clean_query = query.strip()
    gov_restricted_query = f"{clean_query} site:gov.in OR site:nic.in"
    logger.info("Executing official government web search: '%s'", gov_restricted_query)

    results: List[Dict[str, str]] = []
    raw_results = []

    try:
        with DDGS() as ddgs:
            # Try positional argument first (supported in latest ddgs 9+)
            try:
                raw_results = list(ddgs.text(gov_restricted_query, max_results=min(max_results, 8)))
            except TypeError:
                raw_results = list(ddgs.text(keywords=gov_restricted_query, max_results=min(max_results, 8)))

        # Fallback to site:gov.in if combined boolean returned 0 results
        if not raw_results:
            fallback_query = f"{clean_query} site:gov.in"
            with DDGS() as ddgs:
                try:
                    raw_results = list(ddgs.text(fallback_query, max_results=min(max_results, 8)))
                except TypeError:
                    raw_results = list(ddgs.text(keywords=fallback_query, max_results=min(max_results, 8)))

        for item in raw_results:
            url = item.get("href", "")
            title = item.get("title", "Government Portal Update")
            snippet = item.get("body", "")
            if url:
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                })

    except Exception as exc:
        logger.warning("Government search query encountered an error: %s", exc)

    return results


async def search_gov_portals(query: str, max_results: int = 4) -> Dict[str, Any]:
    """Asynchronous wrapper to perform search without blocking FastAPI's event loop."""
    results = await asyncio.to_thread(_execute_sync_search, query, max_results)

    if not results:
        return {
            "status": "no_results",
            "query_used": f"{query} site:gov.in OR site:nic.in",
            "message": "No direct matches found on .gov.in or .nic.in.",
            "results": [],
            "formatted_context": "",
        }

    formatted_snippets = []
    for idx, res in enumerate(results, 1):
        formatted_snippets.append(
            f"[{idx}] {res['title']}\nOfficial URL: {res['url']}\nSummary: {res['snippet']}"
        )

    return {
        "status": "success",
        "query_used": f"{query} site:gov.in OR site:nic.in",
        "count": len(results),
        "results": results,
        "formatted_context": "\n\n".join(formatted_snippets),
    }
