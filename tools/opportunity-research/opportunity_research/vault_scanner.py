"""OPP-04 — Obsidian Vault scanner using ripgrep for full-text search."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

from opportunity_research.models import VaultMatch

_TAG_RE = re.compile(r"(?<!`)#([\w-]+)")
_WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
_CODE_BLOCK_RE = re.compile(r"```[\s\S]*?```")


def scan_vault(
    query: str,
    vault_path: str = "~/Documents/Obsidian Vault/",
    max_results: int = 50,
    subdirs: list[str] | None = None,
) -> list[VaultMatch]:
    """Full-text search across an Obsidian vault using ripgrep."""
    base = Path(vault_path).expanduser()

    search_paths: list[str] = []
    if subdirs:
        for sd in subdirs:
            p = base / sd
            if p.is_dir():
                search_paths.append(str(p))
        if not search_paths:
            return []
    else:
        search_paths = [str(base)]

    matched_files: list[str] = []
    for sp in search_paths:
        result = subprocess.run(
            ["rg", "--files-with-matches", "--type", "md", "--ignore-case", query, sp],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            matched_files.extend(result.stdout.strip().splitlines())

    # Deduplicate preserving order
    seen: set[str] = set()
    unique_files: list[str] = []
    for f in matched_files:
        if f not in seen:
            seen.add(f)
            unique_files.append(f)

    # Build VaultMatch for each file
    raw_matches: list[VaultMatch] = []
    for fp in unique_files:
        tags, wikilinks = _parse_md_file(fp)
        matched_content = _get_matched_content(fp, query)
        match_count = _count_matches(fp, query)

        raw_score = match_count * 1.0 + len(tags) * 0.5 + len(wikilinks) * 0.3
        raw_matches.append(
            VaultMatch(
                file_path=fp,
                matched_content=matched_content,
                tags=tags,
                wikilinks=wikilinks,
                relevance_score=raw_score,
            )
        )

    # Normalize scores to 0.0-1.0
    if raw_matches:
        max_score = max(m.relevance_score for m in raw_matches)
        if max_score > 0:
            for m in raw_matches:
                m.relevance_score = round(m.relevance_score / max_score, 4)

    raw_matches.sort(key=lambda m: m.relevance_score, reverse=True)
    return raw_matches[:max_results]


def _count_matches(file_path: str, query: str) -> int:
    """Count occurrences of query in file (case insensitive)."""
    result = subprocess.run(
        ["rg", "--count", "--ignore-case", query, file_path],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        try:
            return int(result.stdout.strip().split(":")[-1])
        except ValueError:
            pass
    # Python fallback
    try:
        text = Path(file_path).read_text(errors="replace")
        return len(re.findall(re.escape(query), text, re.IGNORECASE))
    except OSError:
        return 0


def _parse_md_file(file_path: str) -> tuple[list[str], list[str]]:
    """Extract tags and wikilinks from a markdown file."""
    try:
        text = Path(file_path).read_text(errors="replace")
    except OSError:
        return [], []

    # Strip code blocks before extracting tags
    text_no_code = _CODE_BLOCK_RE.sub("", text)

    tags = _TAG_RE.findall(text_no_code)
    wikilinks = _WIKILINK_RE.findall(text)  # wikilinks can be inside code blocks

    return list(dict.fromkeys(tags)), list(dict.fromkeys(wikilinks))


def _get_matched_content(file_path: str, query: str, context_lines: int = 2) -> str:
    """Get context around the first match in a file."""
    result = subprocess.run(
        ["rg", "--ignore-case", "-C", str(context_lines), "--max-count", "1", query, file_path],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0 and result.stdout:
        return result.stdout.strip()[:500]
    # Fallback
    try:
        text = Path(file_path).read_text(errors="replace")
        match = re.search(re.escape(query), text, re.IGNORECASE)
        if match:
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            return text[start:end].strip()[:500]
    except OSError:
        pass
    return ""
