"""Tests for the Obsidian doc generator."""

from __future__ import annotations

from datetime import datetime

import yaml

from opportunity_research.doc_generator import (
    _generate_category_doc,
    _generate_index,
    _generate_opportunity_doc,
    _slugify,
    _to_obsidian_frontmatter,
    generate_research_output,
)
from opportunity_research.models import (
    CommercializationStrategy,
    DeepDiveOpportunity,
    PracticalSolution,
    ResearchOutput,
    VaultMatch,
)


def _make_opportunity(
    rank: int, title: str, total: float, *, with_vault: bool = True
) -> DeepDiveOpportunity:
    scores = {
        "revenue_potential": 0.9,
        "time_to_result": 0.7,
        "scalability": 0.85,
        "ai_fit": 0.95,
        "market_demand": 0.8,
        "entry_barrier": 0.3,
        "competition": 0.6,
        "recurring_potential": 0.75,
        "expertise_match": 0.88,
    }
    vault = (
        [
            VaultMatch(
                file_path="vault/notas/agentes-ia.md",
                matched_content="Agentes de IA para automação",
                tags=["ia", "automação"],
                wikilinks=["agentes-ia"],
            )
        ]
        if with_vault
        else []
    )
    return DeepDiveOpportunity(
        title=title,
        url=f"https://example.com/{rank}",
        summary=f"Resumo da oportunidade {rank} com detalhes relevantes.",
        source="test",
        rank=rank,
        scores=scores,
        total_score=total,
        vault_matches=vault,
        deep_analysis_md=f"Análise profunda da oportunidade **{title}**.",
        practical_solutions=[
            PracticalSolution(
                name="Chatbot WhatsApp",
                description="Bot de atendimento com IA generativa.",
                tech_stack=["Python", "LangChain", "WhatsApp API"],
                effort_estimate="medium",
            ),
            PracticalSolution(
                name="Dashboard Analytics",
                description="Painel de métricas em tempo real.",
                tech_stack=["Next.js", "Supabase", "Chart.js"],
                effort_estimate="high",
            ),
        ],
        commercialization_strategy=CommercializationStrategy(
            target_audience="PMEs brasileiras",
            pricing_model="SaaS",
            price_range="R$197-497/mês",
            sales_channels=["Instagram", "LinkedIn", "Indicação"],
            packaging_suggestion="Plano starter + premium com white-label.",
        ),
    )


def _make_research() -> ResearchOutput:
    return ResearchOutput(
        direction="Automação de Contratos com IA",
        timestamp=datetime(2025, 6, 15, 10, 30, 0),
        opportunities=[
            _make_opportunity(1, "Automação de Contratos", 0.87),
            _make_opportunity(2, "Chatbot Jurídico", 0.82),
            _make_opportunity(3, "Análise de Cláusulas", 0.78),
        ],
        categories={"legal-tech": ["Automação de Contratos", "Chatbot Jurídico"]},
        metadata={"engine_version": "0.1.0"},
    )


# ── _slugify ────────────────────────────────────────────


class TestSlugify:
    def test_accents_removed(self):
        assert _slugify("Automação de Contratos") == "automacao-de-contratos"

    def test_special_chars(self):
        assert _slugify("AI/ML — the future!") == "ai-ml-the-future"

    def test_multiple_spaces(self):
        assert _slugify("  hello   world  ") == "hello-world"

    def test_already_slug(self):
        assert _slugify("already-a-slug") == "already-a-slug"


# ── _to_obsidian_frontmatter ────────────────────────────


class TestFrontmatter:
    def test_valid_yaml(self):
        opp = _make_opportunity(1, "Test Opp", 0.85)
        fm = _to_obsidian_frontmatter(opp)
        assert fm.startswith("---\n")
        assert fm.endswith("---\n")
        # Parse the YAML between the fences
        inner = fm.split("---")[1]
        parsed = yaml.safe_load(inner)
        assert parsed["title"] == "Test Opp"
        assert parsed["rank"] == 1
        assert parsed["total_score"] == 0.85

    def test_contains_individual_scores(self):
        opp = _make_opportunity(1, "Test Opp", 0.85)
        fm = _to_obsidian_frontmatter(opp)
        inner = fm.split("---")[1]
        parsed = yaml.safe_load(inner)
        assert "revenue_potential" in parsed
        assert "ai_fit" in parsed


# ── _generate_index ─────────────────────────────────────


class TestGenerateIndex:
    def test_frontmatter_parseable(self):
        research = _make_research()
        md = _generate_index(research)
        parts = md.split("---")
        parsed = yaml.safe_load(parts[1])
        assert parsed["direction"] == "Automação de Contratos com IA"
        assert parsed["total_found"] == 3

    def test_table_rows(self):
        research = _make_research()
        md = _generate_index(research)
        assert "| 1 |" in md
        assert "| 2 |" in md
        assert "| 3 |" in md

    def test_wikilinks_in_table(self):
        research = _make_research()
        md = _generate_index(research)
        assert "[[oportunidades/01-automacao-de-contratos]]" in md
        assert "[[oportunidades/02-chatbot-juridico]]" in md


# ── _generate_opportunity_doc ───────────────────────────


class TestGenerateOpportunityDoc:
    def test_all_sections_present(self):
        opp = _make_opportunity(1, "Test", 0.85)
        md = _generate_opportunity_doc(opp, 1)
        assert "## Análise" in md
        assert "## Soluções Práticas com IA" in md
        assert "## Comercialização" in md
        assert "## Scores" in md
        assert "## Referências do Vault" in md

    def test_practical_solutions_listed(self):
        opp = _make_opportunity(1, "Test", 0.85)
        md = _generate_opportunity_doc(opp, 1)
        assert "### Chatbot WhatsApp" in md
        assert "### Dashboard Analytics" in md
        assert "LangChain" in md

    def test_commercialization_fields(self):
        opp = _make_opportunity(1, "Test", 0.85)
        md = _generate_opportunity_doc(opp, 1)
        assert "PMEs brasileiras" in md
        assert "SaaS" in md
        assert "R$197-497/mês" in md

    def test_vault_wikilinks(self):
        opp = _make_opportunity(1, "Test", 0.85)
        md = _generate_opportunity_doc(opp, 1)
        assert "[[agentes-ia]]" in md

    def test_no_vault_matches(self):
        opp = _make_opportunity(1, "Test", 0.85, with_vault=False)
        md = _generate_opportunity_doc(opp, 1)
        assert "Nenhuma referência" in md

    def test_scores_table(self):
        opp = _make_opportunity(1, "Test", 0.85)
        md = _generate_opportunity_doc(opp, 1)
        assert "| revenue_potential |" in md
        assert "| ai_fit |" in md


# ── _generate_category_doc ──────────────────────────────


class TestGenerateCategoryDoc:
    def test_frontmatter(self):
        opps = [_make_opportunity(i, f"Opp {i}", 0.9 - i * 0.05) for i in range(1, 3)]
        md = _generate_category_doc("por-potencial-receita", opps)
        inner = md.split("---")[1]
        parsed = yaml.safe_load(inner)
        assert parsed["category"] == "por-potencial-receita"
        assert parsed["count"] == 2

    def test_wikilinks_present(self):
        opps = [_make_opportunity(1, "Automação de Contratos", 0.9)]
        md = _generate_category_doc("por-fit-ia", opps)
        assert "[[oportunidades/01-automacao-de-contratos]]" in md


# ── generate_research_output (integration) ──────────────


class TestGenerateResearchOutput:
    def test_creates_folder_structure(self, tmp_path):
        research = _make_research()
        result = generate_research_output(research, str(tmp_path))
        root = tmp_path / "2025-06-15-automacao-de-contratos-com-ia"
        assert root.exists()
        assert (root / "index.md").exists()
        assert (root / "oportunidades").is_dir()
        assert (root / "por-categoria").is_dir()
        assert result == str(root)

    def test_individual_docs_created(self, tmp_path):
        research = _make_research()
        generate_research_output(research, str(tmp_path))
        opp_dir = tmp_path / "2025-06-15-automacao-de-contratos-com-ia" / "oportunidades"
        files = sorted(f.name for f in opp_dir.iterdir())
        assert files == [
            "01-automacao-de-contratos.md",
            "02-chatbot-juridico.md",
            "03-analise-de-clausulas.md",
        ]

    def test_category_docs_created(self, tmp_path):
        research = _make_research()
        generate_research_output(research, str(tmp_path))
        cat_dir = tmp_path / "2025-06-15-automacao-de-contratos-com-ia" / "por-categoria"
        files = sorted(f.name for f in cat_dir.iterdir())
        assert "por-potencial-receita.md" in files
        assert "por-fit-ia.md" in files
        assert "por-escalabilidade.md" in files
        assert len(files) == 5

    def test_index_frontmatter_valid(self, tmp_path):
        research = _make_research()
        generate_research_output(research, str(tmp_path))
        index = (tmp_path / "2025-06-15-automacao-de-contratos-com-ia" / "index.md").read_text()
        inner = index.split("---")[1]
        parsed = yaml.safe_load(inner)
        assert parsed["top_n"] == 3

    def test_wikilinks_resolve_to_files(self, tmp_path):
        research = _make_research()
        generate_research_output(research, str(tmp_path))
        root = tmp_path / "2025-06-15-automacao-de-contratos-com-ia"
        index = (root / "index.md").read_text()
        # Extract all [[...]] wikilinks
        import re
        links = re.findall(r"\[\[([^\]]+)\]\]", index)
        for link in links:
            assert (root / f"{link}.md").exists(), f"Wikilink [[{link}]] does not resolve"
