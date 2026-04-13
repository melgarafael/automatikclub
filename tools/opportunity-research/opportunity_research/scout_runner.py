"""Scout runner — web search via Firecrawl to discover raw opportunities."""

from __future__ import annotations

import os
import time

from firecrawl import FirecrawlApp

from opportunity_research.models import RawOpportunity

_QUERY_TEMPLATES = [
    "{direction} freelance opportunities 2026",
    "{direction} market trends and demand",
    "{direction} pricing models and revenue",
    "{direction} problems worth solving with AI",
    "{direction} business opportunities automation",
    "{direction} SaaS ideas and products",
    "{direction} consulting and agency services",
]


class ScoutError(Exception):
    """Raised when the scout runner encounters an unrecoverable failure."""


def _validate_api_key() -> str:
    key = os.environ.get("FIRECRAWL_API_KEY", "").strip()
    if not key:
        raise ScoutError(
            "FIRECRAWL_API_KEY is not set. "
            "Export it before running the scout runner."
        )
    return key


def _expand_direction(direction: str) -> list[str]:
    return [t.format(direction=direction) for t in _QUERY_TEMPLATES]


def search_opportunities(
    direction: str,
    num_queries: int = 5,
    results_per_query: int = 10,
    max_retries: int = 3,
) -> list[RawOpportunity]:
    key = _validate_api_key()
    app = FirecrawlApp(api_key=key)

    queries = _expand_direction(direction)[:num_queries]

    seen_urls: set[str] = set()
    opportunities: list[RawOpportunity] = []

    for query in queries:
        results = _search_with_retry(app, query, results_per_query, max_retries)
        for item in results:
            url = item.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            summary = (
                item.get("description")
                or item.get("markdown", "")[:500]
                or ""
            )
            opportunities.append(
                RawOpportunity(
                    title=item.get("title", url),
                    url=url,
                    summary=summary,
                    source="firecrawl",
                    relevance_hint=query,
                )
            )

    return opportunities


def _search_with_retry(
    app: FirecrawlApp,
    query: str,
    limit: int,
    max_retries: int,
) -> list[dict]:
    for attempt in range(max_retries):
        try:
            results = app.search(query, params={"limit": limit})
            return results if isinstance(results, list) else []
        except Exception as exc:
            if attempt == max_retries - 1:
                raise ScoutError(
                    f"Firecrawl failed after {max_retries} attempts: {exc}"
                ) from exc
            time.sleep(2 ** (attempt + 1))
    return []  # unreachable, satisfies type checker
