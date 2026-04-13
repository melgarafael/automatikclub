"""Bridge between the Claude deep-dive agent and the Python engine.

The agent calls these helpers via CLI subcommands so it never has to
construct complex Python objects inline.  Every function reads JSON files,
delegates to the real engine modules, and writes JSON files back.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from .doc_generator import generate_research_output
from .models import (
    CommercializationStrategy,
    DeepDiveOpportunity,
    PracticalSolution,
    RawOpportunity,
    ResearchOutput,
    ScoredOpportunity,
)
from .scorer import load_weights, rank_opportunities, score_opportunity, select_top


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def score_and_rank(
    pipeline_json: str,
    scores_json: str,
    config_path: str = "config.yaml",
    top_n: int = 8,
) -> str:
    """Score every opportunity, rank, select top N, and write result.

    *pipeline_json* — path to ``pipeline_output.json`` from the pipeline.
    *scores_json* — path to a JSON file mapping ``{title -> {dim -> float}}``.

    Returns the path to the written ``scored_output.json`` in the same
    directory as *pipeline_json*.
    """
    research = ResearchOutput.from_json_file(pipeline_json)
    title_scores: dict[str, dict[str, float]] = json.loads(
        Path(scores_json).read_text()
    )
    weights = load_weights(config_path)

    scored: list[ScoredOpportunity] = []
    for opp in research.opportunities:
        dim_scores = title_scores.get(opp.title, {})
        # Build a clean RawOpportunity so scorer's model_dump doesn't clash.
        raw = RawOpportunity(
            title=opp.title,
            url=opp.url,
            summary=opp.summary,
            source=opp.source,
            relevance_hint=opp.relevance_hint,
        )
        s = score_opportunity(raw, dim_scores, weights)
        # Re-attach vault_matches that the pipeline already collected.
        s = s.model_copy(update={"vault_matches": opp.vault_matches})
        scored.append(s)

    ranked = rank_opportunities(scored)
    top = select_top(ranked, n=top_n)

    out_dir = Path(pipeline_json).parent
    out_path = str(out_dir / "scored_output.json")

    # Serialize as a simple list (not ResearchOutput — the agent still needs
    # to add deep-dive fields before building the final output).
    data = [s.model_dump(mode="json") for s in top]
    Path(out_path).write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"Scored {len(scored)} opportunities, selected top {len(top)}.")
    print(f"Output: {out_path}")
    return out_path


def build_enriched_output(
    scored_json: str,
    deep_dives_json: str,
    output_json: str,
) -> str:
    """Merge scored opportunities with deep-dive content.

    *scored_json* — path to ``scored_output.json`` (list of ScoredOpportunity).
    *deep_dives_json* — path to a JSON mapping
        ``{title -> {practical_solutions, commercialization_strategy, deep_analysis_md}}``.
    *output_json* — path where the final ``ResearchOutput`` will be written.

    Returns *output_json*.
    """
    scored_list: list[dict] = json.loads(Path(scored_json).read_text())
    dives: dict[str, dict] = json.loads(Path(deep_dives_json).read_text())

    # Recover direction & timestamp from the run directory layout.
    # scored_json sits at  .runs/<timestamp>/scored_output.json
    # pipeline_output.json is a sibling.
    run_dir = Path(scored_json).parent
    pipeline_path = run_dir / "pipeline_output.json"
    original = ResearchOutput.from_json_file(str(pipeline_path))

    enriched: list[DeepDiveOpportunity] = []
    for s in scored_list:
        title = s["title"]
        dive = dives.get(title, {})

        solutions = [
            PracticalSolution.model_validate(ps)
            for ps in dive.get("practical_solutions", [])
        ]
        cs_raw = dive.get("commercialization_strategy")
        cs = CommercializationStrategy.model_validate(cs_raw) if cs_raw else None

        deep = DeepDiveOpportunity(
            title=s["title"],
            url=s["url"],
            summary=s["summary"],
            source=s["source"],
            relevance_hint=s.get("relevance_hint", ""),
            scores=s["scores"],
            total_score=s["total_score"],
            rank=s["rank"],
            vault_matches=s.get("vault_matches", []),
            practical_solutions=solutions,
            commercialization_strategy=cs,
            deep_analysis_md=dive.get("deep_analysis_md", ""),
        )
        enriched.append(deep)

    research = ResearchOutput(
        direction=original.direction,
        timestamp=original.timestamp,
        opportunities=enriched,
        categories={
            "por-potencial-receita": [o.title for o in sorted(enriched, key=lambda o: o.scores.get("revenue_potential", 0), reverse=True)],
            "por-velocidade": [o.title for o in sorted(enriched, key=lambda o: o.scores.get("speed_to_result", 0), reverse=True)],
            "por-escalabilidade": [o.title for o in sorted(enriched, key=lambda o: o.scores.get("scalability", 0), reverse=True)],
            "por-fit-ia": [o.title for o in sorted(enriched, key=lambda o: o.scores.get("ai_fit", 0), reverse=True)],
            "por-demanda": [o.title for o in sorted(enriched, key=lambda o: o.scores.get("proven_demand", 0), reverse=True)],
        },
    )

    research.to_json_file(output_json)
    print(f"Enriched {len(enriched)} opportunities with deep-dive content.")
    print(f"Output: {output_json}")
    return output_json


def generate_obsidian(enriched_json: str, output_path: str) -> str:
    """Generate Obsidian vault output from enriched research.

    Returns the path to the created folder.
    """
    research = ResearchOutput.from_json_file(enriched_json)
    folder = generate_research_output(research, output_path)
    print(f"Obsidian docs generated: {folder}")
    return folder


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

_USAGE = """\
Usage: python -m opportunity_research.agent_bridge <command> [args...]

Commands:
  score-and-rank   <pipeline_json> <scores_json> [config_path]
  build-enriched   <scored_json> <deep_dives_json> <output_json>
  generate-obsidian <enriched_json> [output_path]
"""


def main() -> None:
    if len(sys.argv) < 2:
        print(_USAGE)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "score-and-rank":
        if len(sys.argv) < 4:
            print("Usage: score-and-rank <pipeline_json> <scores_json> [config_path]")
            sys.exit(1)
        config = sys.argv[4] if len(sys.argv) > 4 else "config.yaml"
        score_and_rank(sys.argv[2], sys.argv[3], config)

    elif cmd == "build-enriched":
        if len(sys.argv) < 5:
            print("Usage: build-enriched <scored_json> <deep_dives_json> <output_json>")
            sys.exit(1)
        build_enriched_output(sys.argv[2], sys.argv[3], sys.argv[4])

    elif cmd == "generate-obsidian":
        if len(sys.argv) < 3:
            print("Usage: generate-obsidian <enriched_json> [output_path]")
            sys.exit(1)
        out = sys.argv[3] if len(sys.argv) > 3 else "~/Documents/Obsidian Vault/Opportunity Research/"
        generate_obsidian(sys.argv[2], out)

    else:
        print(f"Unknown command: {cmd}")
        print(_USAGE)
        sys.exit(1)


if __name__ == "__main__":
    main()
