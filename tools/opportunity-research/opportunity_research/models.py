"""Data contracts for the Opportunity Research Engine."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Literal, Self

from pydantic import BaseModel


class _JsonFileMixin:
    """Serialization to/from JSON files."""

    def to_json_file(self, path: str) -> None:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_text(
            json.dumps(self.model_dump(mode="json"), indent=2, ensure_ascii=False)  # type: ignore[attr-defined]
        )

    @classmethod
    def from_json_file(cls, path: str) -> Self:
        data = json.loads(Path(path).read_text())
        return cls.model_validate(data)


class RawOpportunity(_JsonFileMixin, BaseModel):
    title: str
    url: str
    summary: str
    source: str
    relevance_hint: str = ""


class VaultMatch(_JsonFileMixin, BaseModel):
    file_path: str
    matched_content: str
    tags: list[str] = []
    wikilinks: list[str] = []
    relevance_score: float = 0.0


class ScoredOpportunity(RawOpportunity):
    scores: dict[str, float]
    total_score: float
    rank: int = 0
    vault_matches: list[VaultMatch] = []


class PracticalSolution(_JsonFileMixin, BaseModel):
    name: str
    description: str
    tech_stack: list[str]
    effort_estimate: Literal["low", "medium", "high"]


class CommercializationStrategy(_JsonFileMixin, BaseModel):
    target_audience: str
    pricing_model: Literal["hourly", "project", "SaaS", "subscription", "hybrid"]
    price_range: str
    sales_channels: list[str]
    packaging_suggestion: str


class DeepDiveOpportunity(ScoredOpportunity):
    practical_solutions: list[PracticalSolution] = []
    commercialization_strategy: CommercializationStrategy | None = None
    deep_analysis_md: str = ""


class ResearchOutput(_JsonFileMixin, BaseModel):
    direction: str
    timestamp: datetime
    opportunities: list[DeepDiveOpportunity]
    categories: dict[str, list[str]] = {}
    metadata: dict = {}
