"""Tests for Opportunity Research data contracts."""

import json
from datetime import datetime, timezone

from opportunity_research.models import (
    CommercializationStrategy,
    DeepDiveOpportunity,
    PracticalSolution,
    RawOpportunity,
    ResearchOutput,
    ScoredOpportunity,
    VaultMatch,
)

SCORING_DIMENSIONS = [
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


def test_all_models_importable():
    assert RawOpportunity is not None
    assert VaultMatch is not None
    assert ScoredOpportunity is not None
    assert PracticalSolution is not None
    assert CommercializationStrategy is not None
    assert DeepDiveOpportunity is not None
    assert ResearchOutput is not None


def test_raw_opportunity_dump():
    opp = RawOpportunity(
        title="AI Chatbot Agency",
        url="https://example.com/chatbot",
        summary="Build chatbots for SMBs",
        source="firecrawl",
    )
    d = opp.model_dump()
    assert d["title"] == "AI Chatbot Agency"
    assert d["relevance_hint"] == ""
    assert set(d.keys()) == {"title", "url", "summary", "source", "relevance_hint"}


def test_vault_match_dump():
    vm = VaultMatch(
        file_path="Notes/AI.md",
        matched_content="chatbot market growing",
        tags=["ai", "business"],
        wikilinks=["[[AI Trends]]"],
        relevance_score=0.85,
    )
    d = vm.model_dump()
    assert d["relevance_score"] == 0.85
    assert "[[AI Trends]]" in d["wikilinks"]


def test_scored_opportunity_with_9_scores():
    scores = {dim: round(0.5 + i * 0.05, 2) for i, dim in enumerate(SCORING_DIMENSIONS)}
    opp = ScoredOpportunity(
        title="SaaS Analytics",
        url="https://example.com/saas",
        summary="Analytics platform",
        source="firecrawl",
        scores=scores,
        total_score=sum(scores.values()),
        rank=1,
    )
    d = opp.model_dump()
    assert len(d["scores"]) == 9
    assert all(dim in d["scores"] for dim in SCORING_DIMENSIONS)
    assert d["rank"] == 1
    assert d["total_score"] == sum(scores.values())


def test_deep_dive_inherits_scored():
    scores = {dim: 0.8 for dim in SCORING_DIMENSIONS}
    dd = DeepDiveOpportunity(
        title="Automation Agency",
        url="https://example.com/auto",
        summary="Automate workflows",
        source="firecrawl",
        scores=scores,
        total_score=7.2,
        practical_solutions=[
            PracticalSolution(
                name="Zapier Clone",
                description="Build a workflow tool",
                tech_stack=["Python", "FastAPI"],
                effort_estimate="medium",
            )
        ],
        commercialization_strategy=CommercializationStrategy(
            target_audience="SMBs",
            pricing_model="SaaS",
            price_range="$49-199/mo",
            sales_channels=["LinkedIn", "Cold Email"],
            packaging_suggestion="Tier-based plans",
        ),
    )
    d = dd.model_dump()
    assert d["title"] == "Automation Agency"  # inherited from RawOpportunity
    assert len(d["practical_solutions"]) == 1
    assert d["commercialization_strategy"]["pricing_model"] == "SaaS"


def test_round_trip_research_output(tmp_path):
    scores = {dim: 0.7 for dim in SCORING_DIMENSIONS}
    original = ResearchOutput(
        direction="AI Consulting",
        timestamp=datetime(2026, 4, 13, 12, 0, 0, tzinfo=timezone.utc),
        opportunities=[
            DeepDiveOpportunity(
                title="AI Audit Service",
                url="https://example.com/audit",
                summary="Audit AI readiness",
                source="firecrawl",
                scores=scores,
                total_score=sum(scores.values()),
                rank=1,
                vault_matches=[
                    VaultMatch(
                        file_path="Notes/AI-Audit.md",
                        matched_content="audit frameworks",
                        tags=["ai"],
                    )
                ],
                practical_solutions=[
                    PracticalSolution(
                        name="Audit Framework",
                        description="Structured AI audit",
                        tech_stack=["Python"],
                        effort_estimate="low",
                    )
                ],
                commercialization_strategy=CommercializationStrategy(
                    target_audience="Enterprises",
                    pricing_model="project",
                    price_range="$5k-20k",
                    sales_channels=["Referrals"],
                    packaging_suggestion="Fixed-price engagements",
                ),
                deep_analysis_md="# Deep Dive\nDetailed analysis here.",
            )
        ],
        categories={"consulting": ["AI Audit Service"]},
        metadata={"engine_version": "0.1.0"},
    )

    path = str(tmp_path / "output.json")
    original.to_json_file(path)

    loaded = ResearchOutput.from_json_file(path)

    assert loaded.direction == original.direction
    assert loaded.timestamp == original.timestamp
    assert len(loaded.opportunities) == 1
    assert loaded.opportunities[0].title == "AI Audit Service"
    assert loaded.opportunities[0].vault_matches[0].file_path == "Notes/AI-Audit.md"
    assert loaded.opportunities[0].commercialization_strategy.pricing_model == "project"
    assert loaded.categories == original.categories
    assert loaded.metadata == original.metadata

    # Verify JSON file is valid
    with open(path) as f:
        raw = json.load(f)
    assert raw["direction"] == "AI Consulting"
