"""Tests for the scoring engine."""

from opportunity_research.models import RawOpportunity
from opportunity_research.scorer import (
    load_weights,
    rank_opportunities,
    score_opportunity,
    select_top,
)

WEIGHTS = {
    "revenue_potential": 1.5,
    "speed_to_result": 1.3,
    "entry_barrier": 1.0,
    "scalability": 1.2,
    "ai_fit": 1.4,
    "proven_demand": 1.3,
    "durability": 1.0,
    "practical_solutions": 1.2,
    "commercialization": 1.1,
}

DIMENSIONS = list(WEIGHTS.keys())

CONFIG_PATH = "config.yaml"


def _make_opp(title: str = "Test Opp", source: str = "test") -> RawOpportunity:
    return RawOpportunity(
        title=title,
        url=f"https://example.com/{title.lower().replace(' ', '-')}",
        summary=f"Summary for {title}",
        source=source,
    )


def _uniform_scores(value: float) -> dict[str, float]:
    return {dim: value for dim in DIMENSIONS}


def test_load_weights_returns_9_dimensions():
    weights = load_weights(CONFIG_PATH)
    assert len(weights) == 9
    assert all(dim in weights for dim in DIMENSIONS)
    assert all(isinstance(v, float) for v in weights.values())


def test_score_opportunity_synthetic():
    opp = _make_opp()
    scores = _uniform_scores(0.8)
    result = score_opportunity(opp, scores, weights=WEIGHTS)

    assert result.title == "Test Opp"
    assert len(result.scores) == 9
    assert 0.0 <= result.total_score <= 1.0
    # entry_barrier inverted: 0.8 -> 0.2, rest stay 0.8
    assert result.scores["entry_barrier"] == pytest.approx(0.2)
    assert result.scores["revenue_potential"] == pytest.approx(0.8)


def test_entry_barrier_inversion():
    opp = _make_opp()

    high_barrier = score_opportunity(opp, _uniform_scores(0.9), weights=WEIGHTS)
    low_barrier = score_opportunity(opp, _uniform_scores(0.1), weights=WEIGHTS)

    # High raw entry_barrier = bad = low normalized
    assert high_barrier.scores["entry_barrier"] == pytest.approx(0.1)
    # Low raw entry_barrier = good = high normalized
    assert low_barrier.scores["entry_barrier"] == pytest.approx(0.9)


def test_rank_opportunities_order():
    opps = []
    for i, val in enumerate([0.3, 0.9, 0.5, 0.7, 0.1]):
        opp = _make_opp(title=f"Opp {i}")
        scored = score_opportunity(opp, _uniform_scores(val), weights=WEIGHTS)
        opps.append(scored)

    ranked = rank_opportunities(opps)

    assert len(ranked) == 5
    assert ranked[0].rank == 1
    assert ranked[-1].rank == 5
    # Scores should be descending
    for i in range(len(ranked) - 1):
        assert ranked[i].total_score >= ranked[i + 1].total_score


def test_select_top_returns_n():
    opps = []
    for i in range(10):
        opp = _make_opp(title=f"Opp {i}")
        scored = score_opportunity(opp, _uniform_scores(i / 10), weights=WEIGHTS)
        opps.append(scored)

    ranked = rank_opportunities(opps)
    top3 = select_top(ranked, n=3)

    assert len(top3) == 3
    assert top3[0].rank == 1


def test_determinism():
    opp = _make_opp()
    scores = {
        "revenue_potential": 0.85,
        "speed_to_result": 0.60,
        "entry_barrier": 0.30,
        "scalability": 0.75,
        "ai_fit": 0.90,
        "proven_demand": 0.55,
        "durability": 0.40,
        "practical_solutions": 0.70,
        "commercialization": 0.65,
    }

    r1 = score_opportunity(opp, scores, weights=WEIGHTS)
    r2 = score_opportunity(opp, scores, weights=WEIGHTS)

    assert r1.total_score == r2.total_score
    assert r1.scores == r2.scores


import pytest
