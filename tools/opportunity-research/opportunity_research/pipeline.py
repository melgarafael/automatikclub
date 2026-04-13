"""Orchestrator pipeline — deterministic wiring of SCAN → ENRICH phases.

The pipeline handles the mechanical work: web search via Firecrawl and vault
enrichment via ripgrep. Scoring and deep-dive analysis are left to the Claude
agent (OPP-08), which reads the serialized pipeline_output.json.
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import yaml

from opportunity_research.models import (
    DeepDiveOpportunity,
    ResearchOutput,
    VaultMatch,
)
from opportunity_research.scout_runner import search_opportunities
from opportunity_research.vault_scanner import scan_vault


def run_pipeline(
    direction: str,
    config_path: str = "config.yaml",
) -> tuple[ResearchOutput, str]:
    """Run the deterministic pipeline: SCAN → ENRICH → serialize.

    Returns the ResearchOutput and the path to the run directory containing
    ``pipeline_output.json``.
    """
    config = yaml.safe_load(Path(config_path).read_text())
    firecrawl_cfg = config.get("firecrawl", {})
    vault_path: str = config.get("vault_path", "~/Documents/Obsidian Vault/")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = Path(".runs") / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)

    # Phase 1 — SCAN
    print(f"Phase 1: Scanning for '{direction}'...")
    raw_opps = search_opportunities(
        direction,
        num_queries=firecrawl_cfg.get("num_queries", 5),
        results_per_query=firecrawl_cfg.get("results_per_query", 10),
    )
    print(f"  Found {len(raw_opps)} opportunities.")

    # Phase 2 — ENRICH (attach vault matches to each opportunity)
    print("Phase 2: Enriching with Obsidian vault context...")
    enriched: list[DeepDiveOpportunity] = []
    for opp in raw_opps:
        matches: list[VaultMatch] = scan_vault(
            opp.title,
            vault_path=vault_path,
        )
        deep = DeepDiveOpportunity(
            title=opp.title,
            url=opp.url,
            summary=opp.summary,
            source=opp.source,
            relevance_hint=opp.relevance_hint,
            scores={},
            total_score=0.0,
            vault_matches=matches,
        )
        enriched.append(deep)
    print(f"  Enriched {len(enriched)} opportunities with vault context.")

    # Build output
    research = ResearchOutput(
        direction=direction,
        timestamp=datetime.now(),
        opportunities=enriched,
    )

    output_path = str(run_dir / "pipeline_output.json")
    research.to_json_file(output_path)
    print(f"Pipeline complete. Output: {output_path}")

    return research, str(run_dir)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m opportunity_research.pipeline <direction> [config_path]")
        sys.exit(1)

    _direction = sys.argv[1]
    _config = sys.argv[2] if len(sys.argv) > 2 else "config.yaml"
    _research, _run_dir = run_pipeline(_direction, _config)
    print(f"Run directory: {_run_dir}")
