"""Scoring engine for the Opportunity Research Engine."""

from __future__ import annotations

from pathlib import Path

import yaml

from .models import RawOpportunity, ScoredOpportunity


def load_weights(config_path: str = "config.yaml") -> dict[str, float]:
    data = yaml.safe_load(Path(config_path).read_text())
    return data["scoring_weights"]


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def score_opportunity(
    opp: RawOpportunity,
    dimension_scores: dict[str, float],
    weights: dict[str, float] | None = None,
) -> ScoredOpportunity:
    if weights is None:
        weights = load_weights()

    normalized: dict[str, float] = {}
    for dim, raw in dimension_scores.items():
        clamped = _clamp(raw)
        normalized[dim] = (1.0 - clamped) if dim == "entry_barrier" else clamped

    weight_sum = sum(weights.get(dim, 1.0) for dim in normalized)
    total = sum(normalized[dim] * weights.get(dim, 1.0) for dim in normalized) / weight_sum

    return ScoredOpportunity(
        **opp.model_dump(),
        scores=normalized,
        total_score=round(total, 6),
    )


def rank_opportunities(opps: list[ScoredOpportunity]) -> list[ScoredOpportunity]:
    ranked = sorted(opps, key=lambda o: o.total_score, reverse=True)
    return [o.model_copy(update={"rank": i + 1}) for i, o in enumerate(ranked)]


def select_top(ranked: list[ScoredOpportunity], n: int = 8) -> list[ScoredOpportunity]:
    return ranked[:n]
