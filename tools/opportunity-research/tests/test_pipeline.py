"""Tests for the orchestrator pipeline (OPP-07)."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import pytest

from opportunity_research.models import (
    DeepDiveOpportunity,
    RawOpportunity,
    ResearchOutput,
    VaultMatch,
)
from opportunity_research.pipeline import run_pipeline

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_CONFIG = {
    "firecrawl": {"num_queries": 2, "results_per_query": 5},
    "vault_path": "/tmp/fake-vault",
    "scoring_weights": {"revenue_potential": 1.5},
}


def _make_raw_opportunities(n: int = 3) -> list[RawOpportunity]:
    return [
        RawOpportunity(
            title=f"Opportunity {i}",
            url=f"https://example.com/{i}",
            summary=f"Summary for opportunity {i}",
            source="firecrawl",
            relevance_hint=f"hint-{i}",
        )
        for i in range(1, n + 1)
    ]


def _make_vault_matches() -> list[VaultMatch]:
    return [
        VaultMatch(
            file_path="/vault/note-a.md",
            matched_content="Relevant content about AI",
            tags=["ai", "automation"],
            wikilinks=["[[AI Tools]]"],
            relevance_score=0.8,
        ),
        VaultMatch(
            file_path="/vault/note-b.md",
            matched_content="Market trends for agents",
            tags=["market"],
            wikilinks=["[[Agents]]"],
            relevance_score=0.5,
        ),
    ]


@pytest.fixture()
def config_file(tmp_path: Path) -> Path:
    import yaml

    cfg_path = tmp_path / "config.yaml"
    cfg_path.write_text(yaml.dump(SAMPLE_CONFIG))
    return cfg_path


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_run_pipeline_returns_research_output(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """run_pipeline returns a ResearchOutput with correct opportunity count."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = _make_raw_opportunities(3)
    mock_vault.return_value = _make_vault_matches()

    research, run_dir = run_pipeline("test direction", str(config_file))

    assert isinstance(research, ResearchOutput)
    assert len(research.opportunities) == 3
    assert research.direction == "test direction"


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_opportunities_have_vault_matches(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """Each opportunity is enriched with vault matches."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = _make_raw_opportunities(3)
    mock_vault.return_value = _make_vault_matches()

    research, _ = run_pipeline("test direction", str(config_file))

    for opp in research.opportunities:
        assert len(opp.vault_matches) == 2
        assert opp.vault_matches[0].file_path == "/vault/note-a.md"


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_pipeline_output_json_exists(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """Pipeline serializes output to .runs/{timestamp}/pipeline_output.json."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = _make_raw_opportunities(3)
    mock_vault.return_value = _make_vault_matches()

    _, run_dir = run_pipeline("test direction", str(config_file))

    output_file = Path(run_dir) / "pipeline_output.json"
    assert output_file.exists()
    assert output_file.stat().st_size > 0


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_round_trip_json(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """ResearchOutput can be deserialized from the pipeline_output.json."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = _make_raw_opportunities(3)
    mock_vault.return_value = _make_vault_matches()

    _, run_dir = run_pipeline("test direction", str(config_file))

    output_file = str(Path(run_dir) / "pipeline_output.json")
    loaded = ResearchOutput.from_json_file(output_file)

    assert loaded.direction == "test direction"
    assert len(loaded.opportunities) == 3
    assert isinstance(loaded.opportunities[0], DeepDiveOpportunity)
    assert len(loaded.opportunities[0].vault_matches) == 2


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_opportunities_are_deep_dive_type(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """Opportunities are DeepDiveOpportunity with placeholder scores."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = _make_raw_opportunities(2)
    mock_vault.return_value = []

    research, _ = run_pipeline("test direction", str(config_file))

    for opp in research.opportunities:
        assert isinstance(opp, DeepDiveOpportunity)
        assert opp.scores == {}
        assert opp.total_score == 0.0
        assert opp.practical_solutions == []
        assert opp.commercialization_strategy is None
        assert opp.deep_analysis_md == ""


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_search_called_with_config_params(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """search_opportunities receives params from config.yaml."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = []
    mock_vault.return_value = []

    run_pipeline("any direction", str(config_file))

    mock_search.assert_called_once_with(
        "any direction",
        num_queries=2,
        results_per_query=5,
    )


@patch("opportunity_research.pipeline.scan_vault")
@patch("opportunity_research.pipeline.search_opportunities")
def test_vault_scan_called_per_opportunity(
    mock_search, mock_vault, config_file, tmp_path, monkeypatch
):
    """scan_vault is called once per opportunity with opp title as query."""
    monkeypatch.chdir(tmp_path)
    mock_search.return_value = _make_raw_opportunities(3)
    mock_vault.return_value = []

    run_pipeline("test", str(config_file))

    assert mock_vault.call_count == 3
    titles = [call.args[0] for call in mock_vault.call_args_list]
    assert titles == ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
