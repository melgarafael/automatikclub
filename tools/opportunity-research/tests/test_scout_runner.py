"""Tests for scout_runner — OPP-05."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from opportunity_research.models import RawOpportunity
from opportunity_research.scout_runner import (
    ScoutError,
    _expand_direction,
    _validate_api_key,
    search_opportunities,
)


# ── _validate_api_key ──────────────────────────────────────────────


class TestValidateApiKey:
    def test_missing_key_raises(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("FIRECRAWL_API_KEY", raising=False)
        with pytest.raises(ScoutError, match="FIRECRAWL_API_KEY"):
            _validate_api_key()

    def test_empty_key_raises(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "   ")
        with pytest.raises(ScoutError, match="FIRECRAWL_API_KEY"):
            _validate_api_key()

    def test_valid_key_returns(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "fc-test-key")
        assert _validate_api_key() == "fc-test-key"


# ── _expand_direction ──────────────────────────────────────────────


class TestExpandDirection:
    def test_generates_at_least_5_queries(self):
        queries = _expand_direction("AI automation for clinics")
        assert len(queries) >= 5

    def test_queries_contain_direction(self):
        direction = "AI automation for clinics"
        queries = _expand_direction(direction)
        for q in queries:
            assert direction in q


# ── search_opportunities ───────────────────────────────────────────


FAKE_RESULTS = [
    {
        "url": "https://example.com/a",
        "title": "Opportunity A",
        "description": "Great market for AI automation.",
    },
    {
        "url": "https://example.com/b",
        "title": "Opportunity B",
        "markdown": "Detailed content about consulting services...",
    },
    {
        "url": "https://example.com/a",  # duplicate URL
        "title": "Opportunity A duplicate",
        "description": "Should be deduped.",
    },
]


class TestSearchOpportunities:
    @patch("opportunity_research.scout_runner.FirecrawlApp")
    def test_returns_raw_opportunities(
        self, mock_cls: MagicMock, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "fc-test-key")
        mock_app = MagicMock()
        mock_app.search.return_value = FAKE_RESULTS
        mock_cls.return_value = mock_app

        results = search_opportunities("AI clinics", num_queries=2)

        assert all(isinstance(r, RawOpportunity) for r in results)
        assert all(r.source == "firecrawl" for r in results)

    @patch("opportunity_research.scout_runner.FirecrawlApp")
    def test_deduplicates_by_url(
        self, mock_cls: MagicMock, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "fc-test-key")
        mock_app = MagicMock()
        mock_app.search.return_value = FAKE_RESULTS
        mock_cls.return_value = mock_app

        results = search_opportunities("AI clinics", num_queries=1)
        urls = [r.url for r in results]

        assert len(urls) == len(set(urls)), "Duplicate URLs found"

    @patch("opportunity_research.scout_runner.FirecrawlApp")
    def test_retries_on_failure(
        self, mock_cls: MagicMock, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "fc-test-key")
        mock_app = MagicMock()
        mock_app.search.side_effect = [
            RuntimeError("rate limit"),
            FAKE_RESULTS[:2],
        ]
        mock_cls.return_value = mock_app

        # Patch sleep to avoid real delays in tests
        with patch("opportunity_research.scout_runner.time.sleep"):
            results = search_opportunities("AI clinics", num_queries=1)

        assert len(results) == 2

    @patch("opportunity_research.scout_runner.FirecrawlApp")
    def test_raises_after_max_retries(
        self, mock_cls: MagicMock, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("FIRECRAWL_API_KEY", "fc-test-key")
        mock_app = MagicMock()
        mock_app.search.side_effect = RuntimeError("always fails")
        mock_cls.return_value = mock_app

        with patch("opportunity_research.scout_runner.time.sleep"):
            with pytest.raises(ScoutError, match="failed after"):
                search_opportunities("AI clinics", num_queries=1)
