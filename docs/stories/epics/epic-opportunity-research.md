# Epic — Opportunity Research Engine

> **For epic-executor:** This epic will be executed wave-by-wave with multi-terminal Maestri orchestration.
> **Required pre-reading by every wave's build subagent:**
> 1. Design spec: `docs/superpowers/specs/2026-04-13-opportunity-research-design.md` (will be created)
> 2. Skill: `senior-backend` (Python scripts), `senior-architect` (data contracts)
> 3. Context: AutomatikLabs is an educational platform focused on teaching AI monetization

## Goal

Build an internal intelligence tool (`/opportunity-research`) that discovers, evaluates, and documents profitable AI-solvable problems — producing structured Obsidian-compatible research documents that feed the AutomatikLabs curriculum pipeline.

## Scope

- Python engine: web search (Firecrawl SDK), Obsidian vault scanning (ripgrep), 9-dimension scoring, Obsidian doc generation
- Claude Code skill + orchestrator agent for synthesis, deep dive, and qualitative analysis
- Output: structured folders in `~/Documents/Obsidian Vault/Opportunity Research/`
- Does NOT build UI, does NOT integrate with Supabase, does NOT modify the educational platform

## Architecture (Approach 3 — Agent + Python Engine)

```
/opportunity-research "<direction>"
  │
  ├── Phase 1: SCAN ── scout_runner.py (Firecrawl SDK) → 20-30 raw opportunities
  ├── Phase 2: ENRICH ── vault_scanner.py (ripgrep) → cross-reference with Obsidian
  ├── Phase 2b: SCORE ── scorer.py (9 dimensions, configurable weights) → ranked list
  ├── Phase 3: DEEP DIVE ── Claude agent → top 5-8 with full analysis
  └── Phase 4: OUTPUT ── doc_generator.py → Obsidian folder structure
```

## Scoring Framework (9 Dimensions)

1. **revenue_potential** — How much money can someone make (weight: 1.5)
2. **speed_to_result** — Time to first revenue (weight: 1.3)
3. **entry_barrier** — Lower is better (weight: 1.0, inverted)
4. **scalability** — Solo freelancer to agency/SaaS (weight: 1.2)
5. **ai_fit** — How central is AI to the solution (weight: 1.4)
6. **proven_demand** — People already paying for this (weight: 1.3)
7. **durability** — Not a fad, 2-3+ year lifespan (weight: 1.0)
8. **practical_solutions** — Concrete AI solutions that can be built (weight: 1.2)
9. **commercialization** — How to find clients, sell, price, package (weight: 1.1)

## Stories

### Phase 1: Foundation

#### Story 1: Project scaffold + config schema
- **id:** OPP-01
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Directory `tools/opportunity-research/` exists with `pyproject.toml` (uv-compatible)
  - [ ] `uv sync` installs all dependencies: `firecrawl-py`, `pyyaml`, `pydantic`
  - [ ] Config file `tools/opportunity-research/config.yaml` defines: scoring weights (9 dimensions), vault_path, output_base_path, firecrawl settings
  - [ ] `python -c "import opportunity_research"` works without error
  - [ ] `.gitignore` includes `tools/opportunity-research/.venv/`

#### Story 2: Data contracts (Pydantic models)
- **id:** OPP-02
- **points:** S
- **deps:** [OPP-01]
- **acceptance_criteria:**
  - [ ] File `tools/opportunity-research/opportunity_research/models.py` exists
  - [ ] `RawOpportunity` model: title, url, summary, source, relevance_hint
  - [ ] `VaultMatch` model: file_path, matched_content, tags, wikilinks, relevance_score
  - [ ] `ScoredOpportunity` model: extends RawOpportunity with scores dict (9 dimensions), total_score, rank, vault_matches list
  - [ ] `DeepDiveOpportunity` model: extends ScoredOpportunity with practical_solutions list, commercialization_strategy, deep_analysis_md
  - [ ] `ResearchOutput` model: direction (original query), timestamp, opportunities list, categories dict, metadata
  - [ ] All models have `.model_dump()` (Pydantic v2) returning JSON-serializable dict
  - [ ] All models have `.to_json_file(path)` and `@classmethod from_json_file(path)` for agent↔Python serialization
  - [ ] Obsidian frontmatter generation is NOT in models (belongs to doc_generator) — models are pure data
  - [ ] Unit tests pass: `uv run pytest tests/test_models.py`

### Phase 2: Core Engines (parallelizable)

#### Story 3: Scoring engine
- **id:** OPP-03
- **points:** M
- **deps:** [OPP-02]
- **acceptance_criteria:**
  - [ ] File `tools/opportunity-research/opportunity_research/scorer.py` exists
  - [ ] `score_opportunity(opp: RawOpportunity, scores: dict[str, float]) -> ScoredOpportunity` works
  - [ ] `rank_opportunities(opps: list[ScoredOpportunity]) -> list[ScoredOpportunity]` returns sorted by total_score desc
  - [ ] Scores normalized to 0.0-1.0 before weight application (prevents dimension dominance)
  - [ ] Weights loaded from `config.yaml`, overridable per-call
  - [ ] `select_top(ranked: list, n: int = 8) -> list` returns top N for deep dive
  - [ ] Unit tests with 5 synthetic opportunities, verifying ranking is deterministic and correct

#### Story 4: Vault scanner
- **id:** OPP-04
- **points:** M
- **deps:** [OPP-02]
- **acceptance_criteria:**
  - [ ] File `tools/opportunity-research/opportunity_research/vault_scanner.py` exists
  - [ ] Uses `subprocess` + `rg` (ripgrep) for full-text search — NOT Python file I/O
  - [ ] `scan_vault(query: str, vault_path: str, max_results: int = 50) -> list[VaultMatch]` works
  - [ ] Filters only `.md` files, handles encoding errors gracefully (errors="replace")
  - [ ] Extracts tags (`#tag`), wikilinks (`[[Link]]`), and YAML frontmatter from matched files
  - [ ] Scoped search option: can limit to specific vault subdirectories (e.g., `Automatik Labs/`, `Circuito da Realidade/`)
  - [ ] Returns results sorted by relevance (number of term matches)
  - [ ] Unit tests use a fixtures vault at `tests/fixtures/vault/` with 5+ known .md files (with tags, wikilinks, frontmatter)
  - [ ] Integration test (optional, requires real vault): searches for "IA" in `~/Documents/Obsidian Vault/` and returns >0 results

#### Story 5: Scout runner (web search)
- **id:** OPP-05
- **points:** M
- **deps:** [OPP-02]
- **acceptance_criteria:**
  - [ ] File `tools/opportunity-research/opportunity_research/scout_runner.py` exists
  - [ ] Uses `firecrawl-py` SDK directly (NOT Claude skill — Python-native)
  - [ ] `search_opportunities(direction: str, num_queries: int = 5, results_per_query: int = 10) -> list[RawOpportunity]` works
  - [ ] Generates multiple search queries from a single direction using hardcoded template expansions (NOT LLM): e.g., `f"{direction} freelance opportunities"`, `f"{direction} market trends"`, `f"{direction} pricing models"` — at least 5 templates
  - [ ] Implements retry with exponential backoff for rate limits (max 3 retries, 2s/4s/8s)
  - [ ] Deduplicates results by URL
  - [ ] Returns JSON-serializable list of `RawOpportunity`
  - [ ] Handles Firecrawl API errors gracefully: raises `ScoutError` with message, never silent failure
  - [ ] Missing or invalid `FIRECRAWL_API_KEY` raises clear error at startup, not mid-search
  - [ ] Unit tests with mocked Firecrawl responses (no API key needed)
  - [ ] Integration test (optional, requires FIRECRAWL_API_KEY): searches for a real query, returns >0 results

#### Story 6: Doc generator (Obsidian output)
- **id:** OPP-06
- **points:** M
- **deps:** [OPP-02]
- **acceptance_criteria:**
  - [ ] File `tools/opportunity-research/opportunity_research/doc_generator.py` exists
  - [ ] `generate_research_output(research: ResearchOutput, output_path: str) -> str` creates folder structure
  - [ ] Output structure:
    ```
    Opportunity Research/
      2026-04-13-claude-code/
        index.md                    # Overview with scores table + links
        oportunidades/
          01-nome-oportunidade.md   # Individual deep dive doc
          02-nome-oportunidade.md
          ...
        por-categoria/
          por-potencial-receita.md  # Grouped view with [[wikilinks]]
          por-velocidade.md
          por-escalabilidade.md
          ...
    ```
  - [ ] `index.md` has: YAML frontmatter (date, direction, total_found, top_n), scores table (sortable), links to each opportunity doc
  - [ ] Individual docs have: YAML frontmatter (all 9 scores), practical solutions section, commercialization section, vault cross-references as `[[wikilinks]]`
  - [ ] Category docs aggregate opportunities with `[[wikilinks]]` to individual docs
  - [ ] All markdown passes validation: YAML frontmatter parses with `yaml.safe_load()`, wikilinks match pattern `\[\[[\w\s-]+\]\]`, no broken internal links within the output folder
  - [ ] Unit test: generates from synthetic ResearchOutput, verifies folder structure exists, files are non-empty, frontmatter is valid YAML, wikilinks resolve within output

### Phase 3: Intelligence Layer

#### Story 7: Orchestrator pipeline (wiring)
- **id:** OPP-07
- **points:** M
- **deps:** [OPP-03, OPP-04, OPP-05]
- **acceptance_criteria:**
  - [ ] File `tools/opportunity-research/opportunity_research/pipeline.py` exists
  - [ ] `run_pipeline(direction: str, config_path: str) -> ResearchOutput` orchestrates: scout → vault scan → score → rank → select top → return
  - [ ] Given the same list of `RawOpportunity` and same scores, ranking output is deterministic (web search results may vary between runs — that is expected)
  - [ ] Intermediate results serialized to `tools/opportunity-research/.runs/{timestamp}/pipeline_output.json` — this is the agent↔Python contract file
  - [ ] Pipeline returns `ResearchOutput` ready for deep dive enrichment by Claude agent
  - [ ] CLI entry point: `uv run python -m opportunity_research.pipeline "query here"` works
  - [ ] Unit test with mocked scout/vault returns: verifies pipeline wiring produces valid ResearchOutput
  - [ ] Integration test (optional): runs full pipeline with real query

#### Story 8: Claude analysis agent (deep dive + synthesis)
- **id:** OPP-08
- **points:** L
- **deps:** [OPP-07]
- **acceptance_criteria:**
  - [ ] Agent definition file exists at `tools/opportunity-research/agents/deep-dive-agent.md`
  - [ ] Agent receives: `pipeline_output.json` from `.runs/{timestamp}/` (the serialized ResearchOutput)
  - [ ] For each top opportunity, agent produces:
    - `practical_solutions`: list of 3-5 dicts, each with: `name`, `description` (2-3 sentences), `tech_stack` (list of tools/frameworks), `effort_estimate` (low/medium/high)
    - `commercialization_strategy`: dict with: `target_audience` (who buys), `pricing_model` (hourly/project/SaaS/subscription), `price_range` (min-max BRL), `sales_channels` (list), `packaging_suggestion` (how to productize)
    - `deep_analysis_md`: 1-2 page markdown qualitative analysis covering all 9 dimensions in depth
  - [ ] Agent writes enriched output to `.runs/{timestamp}/enriched_output.json` (serialized list of DeepDiveOpportunity)
  - [ ] Agent calls `doc_generator.py` via `uv run python -m opportunity_research.doc_generator .runs/{timestamp}/enriched_output.json` to produce Obsidian output
  - [ ] Output folder appears in `~/Documents/Obsidian Vault/Opportunity Research/`

### Phase 4: Integration

#### Story 9: Skill `/opportunity-research` (Claude Code entry point)
- **id:** OPP-09
- **points:** M
- **deps:** [OPP-08]
- **acceptance_criteria:**
  - [ ] Skill file exists and is registered in Claude Code (user can run `/opportunity-research`)
  - [ ] Skill parses user direction from command args
  - [ ] Skill orchestrates: run Python pipeline → pass results to deep dive agent → agent produces final output
  - [ ] Skill prints status messages to terminal at each phase: "Phase 1: Scanning web...", "Phase 2: Enriching with vault...", "Phase 3: Deep diving top N...", "Phase 4: Generating Obsidian docs..."
  - [ ] Skill handles errors gracefully: missing API key → clear message, Firecrawl failure → partial results continue, vault not found → skip vault enrichment with warning
  - [ ] Skill outputs final path to generated Obsidian folder
  - [ ] Skill handles edge cases: empty direction → error message, 0 web results → informative message (not crash), vault has no matches → pipeline continues without vault data

#### Story 10: End-to-end integration test
- **id:** OPP-10
- **points:** M
- **deps:** [OPP-09]
- **acceptance_criteria:**
  - [ ] **Happy path:** Run `/opportunity-research "encontre oportunidades para quem domina Claude Code em 2026"` — pipeline completes, output folder exists with: index.md, >=3 individual opportunity docs, >=2 category docs
  - [ ] **Markdown validity:** All output files have valid YAML frontmatter, all `[[wikilinks]]` resolve within the output folder
  - [ ] **Substantive content:** Each opportunity doc has >=3 practical solutions (with name + description + tech_stack), commercialization section has all 5 fields filled
  - [ ] **Error: no API key:** Run without `FIRECRAWL_API_KEY` → clear error message, no stack trace
  - [ ] **Error: empty direction:** Run `/opportunity-research ""` → informative error, no crash
  - [ ] **Graceful degradation:** Run with valid query but vault path pointing to empty dir → pipeline completes with vault_matches=[] for all opportunities
  - [ ] **Idempotency:** Running same query twice creates two separate timestamped folders (no overwrite)
  - [ ] **Performance:** Total execution time < 10 minutes on normal network conditions (not a hard gate — network dependent)

## Wave Execution Plan

```
Wave 1: OPP-01 (Scaffold)                                             → Foundation
Wave 2: OPP-02 (Data contracts)                                       → Foundation (blocks all Phase 2)
Wave 3: OPP-03 + OPP-04 + OPP-05 + OPP-06 (parallel, multi-terminal) → Core Engines
Wave 4: OPP-07 (Pipeline wiring — depends on 03+04+05, NOT 06)        → Intelligence Layer
Wave 5: OPP-08 (Deep dive agent — depends on 07)                      → Intelligence Layer
Wave 6: OPP-09 (Skill — depends on 08)                                → Integration
Wave 7: OPP-10 (E2E test — depends on 09)                             → Integration
```

Note: OPP-07 does NOT depend on OPP-06 (doc_generator). The pipeline returns ResearchOutput; doc generation happens after the agent enriches it (OPP-08 calls doc_generator). This means Wave 4 can start as soon as OPP-03+04+05 are done, even if OPP-06 is still in progress — though in practice Wave 3 parallel execution should complete all 4 together.

## Multi-Terminal Assignment (Maestri)

| Wave | Terminal | Story | Rationale |
|------|----------|-------|-----------|
| 1 | Backend Dev | OPP-01 Scaffold | Python project setup expertise |
| 2 | Backend Dev | OPP-02 Data contracts | Pydantic modeling |
| 3a | Backend Dev | OPP-03 Scoring engine | Algorithmic Python |
| 3b | Nucleo 01 | OPP-04 Vault scanner | System integration (ripgrep) |
| 3c | Nucleo 02 | OPP-05 Scout runner | API integration (Firecrawl) |
| 3d | Frontend Dev | OPP-06 Doc generator | Markdown/template generation |
| 4 | Arquiteto | OPP-07 Pipeline wiring | System architecture |
| 5 | Arquiteto | OPP-08 Deep dive agent | Agent design + prompting |
| 6 | Backend Dev | OPP-09 Skill | Claude Code skill integration |
| 7 | QA Review | OPP-10 E2E test | Independent validation |

## Notes for the executor agent

- **Firecrawl API key** must be set as `FIRECRAWL_API_KEY` env var before running stories OPP-05 and OPP-10.
- **Obsidian vault path**: `~/Documents/Obsidian Vault/` — hardcoded in config.yaml but overridable.
- **ripgrep** (`rg`) must be installed on the system (standard on macOS with Homebrew).
- **Python version**: 3.12+ (via `uv`).
- **All Python scripts** must import models from `opportunity_research.models` — no standalone dict formats.
- **Scoring weights** are defaults that Rafael will calibrate over time — make them easy to change via config.yaml.
- **Category groupings** for output: por-potencial-receita, por-velocidade-resultado, por-escalabilidade, por-fit-ia, por-demanda. Not all 9 dimensions need a category doc — only the top 5 most decision-relevant.
