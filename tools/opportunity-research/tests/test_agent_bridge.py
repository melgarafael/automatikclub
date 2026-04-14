"""Tests for the agent bridge (OPP-08)."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import pytest

from opportunity_research.agent_bridge import (
    build_enriched_output,
    generate_obsidian,
    score_and_rank,
)
from opportunity_research.models import (
    DeepDiveOpportunity,
    ResearchOutput,
    VaultMatch,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_DIMENSION_NAMES = [
    "revenue_potential",
    "speed_to_result",
    "entry_barrier",
    "scalability",
    "ai_fit",
    "proven_demand",
    "durability",
    "practical_solutions",
    "commercialization",
]


def _make_pipeline_output(n: int = 3) -> ResearchOutput:
    """Simulate what pipeline.py produces: DeepDiveOpps with empty scores."""
    opps = [
        DeepDiveOpportunity(
            title=f"Opp {i}",
            url=f"https://example.com/{i}",
            summary=f"Summary {i}",
            source="firecrawl",
            relevance_hint="",
            scores={},
            total_score=0.0,
            vault_matches=[
                VaultMatch(
                    file_path=f"/vault/note-{i}.md",
                    matched_content="vault content",
                    tags=["ai"],
                    wikilinks=[f"[[Note {i}]]"],
                    relevance_score=0.5,
                ),
            ],
        )
        for i in range(1, n + 1)
    ]
    return ResearchOutput(
        direction="test direction",
        timestamp=datetime(2026, 4, 13, 14, 0, 0),
        opportunities=opps,
    )


def _make_scores(n: int = 3) -> dict[str, dict[str, float]]:
    """Agent-assigned dimension scores for each opportunity."""
    result = {}
    for i in range(1, n + 1):
        # Vary scores so ranking is deterministic: Opp 3 > Opp 2 > Opp 1
        base = 0.3 + (i * 0.15)
        result[f"Opp {i}"] = {dim: min(base, 1.0) for dim in _DIMENSION_NAMES}
    return result


def _make_deep_dives(titles: list[str]) -> dict:
    """Deep-dive content keyed by title."""
    dives = {}
    for title in titles:
        dives[title] = {
            "practical_solutions": [
                {
                    "name": f"Solução para {title}",
                    "description": "Descrição da solução com IA.",
                    "tech_stack": ["Python", "Claude API"],
                    "effort_estimate": "medium",
                },
            ],
            "commercialization_strategy": {
                "target_audience": "Agências de marketing digital",
                "pricing_model": "project",
                "price_range": "R$ 2.000 - R$ 10.000",
                "sales_channels": ["LinkedIn", "Cold email"],
                "packaging_suggestion": "Pacote mensal de automação",
            },
            "deep_analysis_md": (
                f"# Análise de {title}\n\n"
                "Esta oportunidade representa um mercado crescente "
                "com forte demanda por automação via IA. "
                "O potencial de receita é significativo dado o baixo "
                "custo de implementação e a alta escalabilidade. "
                "Recomenda-se foco em clientes mid-market que já "
                "usam ferramentas de produtividade mas ainda não "
                "adotaram IA de forma estruturada."
            ),
        }
    return dives


@pytest.fixture()
def run_dir(tmp_path: Path) -> Path:
    """Set up a fake run directory with pipeline_output.json and config."""
    rd = tmp_path / ".runs" / "20260413_140000"
    rd.mkdir(parents=True)

    research = _make_pipeline_output(3)
    research.to_json_file(str(rd / "pipeline_output.json"))

    # Config file at project root (tmp_path simulates project root)
    import yaml

    cfg = {
        "scoring_weights": {dim: 1.0 for dim in _DIMENSION_NAMES},
        "vault_path": "/tmp/vault",
        "output_base_path": str(tmp_path / "obsidian_output"),
        "firecrawl": {"num_queries": 2, "results_per_query": 5},
    }
    (tmp_path / "config.yaml").write_text(yaml.dump(cfg))

    return rd


# ---------------------------------------------------------------------------
# Tests — score_and_rank
# ---------------------------------------------------------------------------


class TestScoreAndRank:
    def test_produces_scored_output_file(self, run_dir: Path, tmp_path: Path):
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))

        result = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        assert Path(result).exists()
        assert Path(result).name == "scored_output.json"

    def test_ranked_order_is_correct(self, run_dir: Path, tmp_path: Path):
        """Opp 3 should rank #1 (highest scores)."""
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))

        result = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        data = json.loads(Path(result).read_text())
        assert data[0]["title"] == "Opp 3"
        assert data[0]["rank"] == 1
        assert data[-1]["title"] == "Opp 1"

    def test_vault_matches_preserved(self, run_dir: Path, tmp_path: Path):
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))

        result = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        data = json.loads(Path(result).read_text())
        for item in data:
            assert len(item["vault_matches"]) == 1

    def test_top_n_limits_output(self, run_dir: Path, tmp_path: Path):
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))

        result = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
            top_n=2,
        )

        data = json.loads(Path(result).read_text())
        assert len(data) == 2


# ---------------------------------------------------------------------------
# Tests — build_enriched_output
# ---------------------------------------------------------------------------


class TestBuildEnrichedOutput:
    def test_merge_produces_enriched_file(self, run_dir: Path, tmp_path: Path):
        # First score
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))
        scored_path = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        # Build deep dives for scored titles
        scored_data = json.loads(Path(scored_path).read_text())
        titles = [s["title"] for s in scored_data]
        dives_path = str(run_dir / "deep_dives.json")
        Path(dives_path).write_text(json.dumps(_make_deep_dives(titles)))

        output_path = str(run_dir / "enriched_output.json")
        result = build_enriched_output(scored_path, dives_path, output_path)

        assert Path(result).exists()
        research = ResearchOutput.from_json_file(result)
        assert len(research.opportunities) == 3
        assert research.direction == "test direction"

    def test_deep_dive_fields_populated(self, run_dir: Path, tmp_path: Path):
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))
        scored_path = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        scored_data = json.loads(Path(scored_path).read_text())
        titles = [s["title"] for s in scored_data]
        dives_path = str(run_dir / "deep_dives.json")
        Path(dives_path).write_text(json.dumps(_make_deep_dives(titles)))

        output_path = str(run_dir / "enriched_output.json")
        build_enriched_output(scored_path, dives_path, output_path)

        research = ResearchOutput.from_json_file(output_path)
        for opp in research.opportunities:
            assert len(opp.practical_solutions) >= 1
            assert opp.commercialization_strategy is not None
            assert len(opp.deep_analysis_md) > 100

    def test_categories_populated(self, run_dir: Path, tmp_path: Path):
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))
        scored_path = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        scored_data = json.loads(Path(scored_path).read_text())
        titles = [s["title"] for s in scored_data]
        dives_path = str(run_dir / "deep_dives.json")
        Path(dives_path).write_text(json.dumps(_make_deep_dives(titles)))

        output_path = str(run_dir / "enriched_output.json")
        build_enriched_output(scored_path, dives_path, output_path)

        research = ResearchOutput.from_json_file(output_path)
        assert "por-potencial-receita" in research.categories
        assert "por-fit-ia" in research.categories
        assert len(research.categories) == 5


# ---------------------------------------------------------------------------
# Tests — generate_obsidian
# ---------------------------------------------------------------------------


class TestGenerateObsidian:
    def test_creates_folder_structure(self, run_dir: Path, tmp_path: Path):
        # Full round-trip: score → enrich → obsidian
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))
        scored_path = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        scored_data = json.loads(Path(scored_path).read_text())
        titles = [s["title"] for s in scored_data]
        dives_path = str(run_dir / "deep_dives.json")
        Path(dives_path).write_text(json.dumps(_make_deep_dives(titles)))

        enriched_path = str(run_dir / "enriched_output.json")
        build_enriched_output(scored_path, dives_path, enriched_path)

        obsidian_out = str(tmp_path / "obsidian_output")
        folder = generate_obsidian(enriched_path, obsidian_out)

        root = Path(folder)
        assert root.exists()
        assert (root / "index.md").exists()
        assert (root / "oportunidades").is_dir()
        assert (root / "por-categoria").is_dir()

    def test_individual_docs_created(self, run_dir: Path, tmp_path: Path):
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))
        scored_path = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        scored_data = json.loads(Path(scored_path).read_text())
        titles = [s["title"] for s in scored_data]
        dives_path = str(run_dir / "deep_dives.json")
        Path(dives_path).write_text(json.dumps(_make_deep_dives(titles)))

        enriched_path = str(run_dir / "enriched_output.json")
        build_enriched_output(scored_path, dives_path, enriched_path)

        obsidian_out = str(tmp_path / "obsidian_output")
        folder = generate_obsidian(enriched_path, obsidian_out)

        opp_docs = list(Path(folder, "oportunidades").glob("*.md"))
        assert len(opp_docs) == 3


# ---------------------------------------------------------------------------
# Tests — full round-trip
# ---------------------------------------------------------------------------


class TestRoundTrip:
    def test_pipeline_to_obsidian(self, run_dir: Path, tmp_path: Path):
        """Full chain: pipeline_output → scores → enriched → obsidian."""
        # 1. Score
        scores_path = str(run_dir / "scores.json")
        Path(scores_path).write_text(json.dumps(_make_scores(3)))
        scored_path = score_and_rank(
            str(run_dir / "pipeline_output.json"),
            scores_path,
            config_path=str(tmp_path / "config.yaml"),
        )

        # 2. Enrich
        scored_data = json.loads(Path(scored_path).read_text())
        titles = [s["title"] for s in scored_data]
        dives_path = str(run_dir / "deep_dives.json")
        Path(dives_path).write_text(json.dumps(_make_deep_dives(titles)))
        enriched_path = str(run_dir / "enriched_output.json")
        build_enriched_output(scored_path, dives_path, enriched_path)

        # 3. Generate obsidian
        obsidian_out = str(tmp_path / "obsidian_output")
        folder = generate_obsidian(enriched_path, obsidian_out)

        # 4. Verify round-trip
        research = ResearchOutput.from_json_file(enriched_path)
        assert research.direction == "test direction"
        assert len(research.opportunities) == 3
        assert research.opportunities[0].rank == 1
        assert research.opportunities[0].total_score > research.opportunities[-1].total_score

        # Verify obsidian output integrity
        root = Path(folder)
        index_content = (root / "index.md").read_text()
        assert "test direction" in index_content
        assert "Opp 3" in index_content  # Top ranked

        cat_docs = list((root / "por-categoria").glob("*.md"))
        assert len(cat_docs) == 5
