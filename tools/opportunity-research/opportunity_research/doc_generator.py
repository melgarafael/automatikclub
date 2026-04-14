"""Obsidian-flavored Markdown doc generator for research outputs."""

from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

import yaml

from .models import DeepDiveOpportunity, ResearchOutput

# Top-5 score dimensions used as category groupings.
_CATEGORY_DIMENSIONS = [
    ("por-potencial-receita", "revenue_potential"),
    ("por-velocidade-resultado", "time_to_result"),
    ("por-escalabilidade", "scalability"),
    ("por-fit-ia", "ai_fit"),
    ("por-demanda", "market_demand"),
]


def _slugify(text: str) -> str:
    """Lowercase, strip accents, replace non-alnum with hyphens."""
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_only = nfkd.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_only.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return re.sub(r"-{2,}", "-", slug)


def _to_obsidian_frontmatter(opp: DeepDiveOpportunity) -> str:
    """YAML frontmatter block for an individual opportunity doc."""
    fm: dict = {
        "title": opp.title,
        "url": opp.url,
        "date": opp.scores.get("_date", None),
        "rank": opp.rank,
        "total_score": round(opp.total_score, 4),
    }
    # Remove None values (date comes from metadata, may not exist)
    if fm["date"] is None:
        del fm["date"]
    # Individual score dimensions
    for dim, val in sorted(opp.scores.items()):
        if not dim.startswith("_"):
            fm[dim] = round(val, 4)
    return "---\n" + yaml.dump(fm, allow_unicode=True, sort_keys=False).rstrip("\n") + "\n---\n"


def _generate_index(research: ResearchOutput) -> str:
    """Generate index.md with frontmatter, title, and ranked table."""
    date_str = research.timestamp.strftime("%Y-%m-%d")
    fm = {
        "date": date_str,
        "direction": research.direction,
        "total_found": len(research.opportunities),
        "top_n": len(research.opportunities),
    }
    lines = [
        "---",
        yaml.dump(fm, allow_unicode=True, sort_keys=False).rstrip("\n"),
        "---",
        "",
        f"# {research.direction}",
        "",
        "| Rank | Nome | Score Total | Link |",
        "|------|------|-------------|------|",
    ]
    for opp in research.opportunities:
        slug = _slugify(opp.title)
        padded = f"{opp.rank:02d}-{slug}"
        score = f"{opp.total_score:.2f}"
        lines.append(f"| {opp.rank} | {opp.title} | {score} | [[oportunidades/{padded}]] |")
    lines.append("")
    return "\n".join(lines)


def _generate_opportunity_doc(opp: DeepDiveOpportunity, index: int) -> str:
    """Generate a full Obsidian doc for a single opportunity."""
    parts: list[str] = [_to_obsidian_frontmatter(opp), "", f"# {opp.title}", ""]

    # Análise
    parts.append("## Análise")
    parts.append("")
    parts.append(opp.deep_analysis_md if opp.deep_analysis_md else "_Sem análise disponível._")
    parts.append("")

    # Soluções Práticas
    parts.append("## Soluções Práticas com IA")
    parts.append("")
    for sol in opp.practical_solutions:
        parts.append(f"### {sol.name}")
        parts.append("")
        parts.append(sol.description)
        parts.append("")
        parts.append(f"- **Tech stack:** {', '.join(sol.tech_stack)}")
        parts.append(f"- **Esforço:** {sol.effort_estimate}")
        parts.append("")

    # Comercialização
    parts.append("## Comercialização")
    parts.append("")
    if opp.commercialization_strategy:
        cs = opp.commercialization_strategy
        parts.append(f"- **Público-alvo:** {cs.target_audience}")
        parts.append(f"- **Modelo de pricing:** {cs.pricing_model}")
        parts.append(f"- **Faixa de preço:** {cs.price_range}")
        parts.append(f"- **Canais de venda:** {', '.join(cs.sales_channels)}")
        parts.append(f"- **Sugestão de empacotamento:** {cs.packaging_suggestion}")
    else:
        parts.append("_Sem estratégia de comercialização definida._")
    parts.append("")

    # Scores
    parts.append("## Scores")
    parts.append("")
    parts.append("| Dimensão | Valor |")
    parts.append("|----------|-------|")
    for dim, val in sorted(opp.scores.items()):
        if not dim.startswith("_"):
            parts.append(f"| {dim} | {val:.2f} |")
    parts.append("")

    # Referências do Vault
    parts.append("## Referências do Vault")
    parts.append("")
    if opp.vault_matches:
        for vm in opp.vault_matches:
            name = Path(vm.file_path).stem
            parts.append(f"- [[{name}]]")
    else:
        parts.append("_Nenhuma referência encontrada no vault._")
    parts.append("")

    return "\n".join(parts)


def _generate_category_doc(
    category_name: str, opportunities: list[DeepDiveOpportunity]
) -> str:
    """Generate a category summary doc."""
    fm = {"category": category_name, "count": len(opportunities)}
    parts = [
        "---",
        yaml.dump(fm, allow_unicode=True, sort_keys=False).rstrip("\n"),
        "---",
        "",
        f"# {category_name}",
        "",
    ]
    for opp in opportunities:
        slug = _slugify(opp.title)
        padded = f"{opp.rank:02d}-{slug}"
        line = f"- [[oportunidades/{padded}]] — score {opp.total_score:.2f} — {opp.summary[:80]}"
        parts.append(line)
    parts.append("")
    return "\n".join(parts)


def generate_research_output(research: ResearchOutput, output_path: str) -> str:
    """Write full Obsidian vault structure and return the root folder path."""
    date_str = research.timestamp.strftime("%Y-%m-%d")
    slug = _slugify(research.direction)
    root = Path(output_path) / f"{date_str}-{slug}"
    opp_dir = root / "oportunidades"
    cat_dir = root / "por-categoria"
    opp_dir.mkdir(parents=True, exist_ok=True)
    cat_dir.mkdir(parents=True, exist_ok=True)

    # index.md
    (root / "index.md").write_text(_generate_index(research), encoding="utf-8")

    # Individual opportunity docs
    for i, opp in enumerate(research.opportunities, start=1):
        slug_opp = _slugify(opp.title)
        filename = f"{i:02d}-{slug_opp}.md"
        (opp_dir / filename).write_text(
            _generate_opportunity_doc(opp, i), encoding="utf-8"
        )

    # Category docs — top 5 score dimensions
    for cat_label, dim_key in _CATEGORY_DIMENSIONS:
        sorted_opps = sorted(
            research.opportunities,
            key=lambda o, d=dim_key: o.scores.get(d, 0.0),
            reverse=True,
        )
        (cat_dir / f"{cat_label}.md").write_text(
            _generate_category_doc(cat_label, sorted_opps), encoding="utf-8"
        )

    return str(root)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m opportunity_research.doc_generator <enriched_output.json>")
        sys.exit(1)
    data = ResearchOutput.from_json_file(sys.argv[1])
    result_path = generate_research_output(data, "output")
    print(result_path)
