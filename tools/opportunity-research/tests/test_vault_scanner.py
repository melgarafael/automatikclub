"""Tests for OPP-04 vault_scanner."""

from pathlib import Path

import pytest

from opportunity_research.vault_scanner import (
    _count_matches,
    _get_matched_content,
    _parse_md_file,
    scan_vault,
)

FIXTURES = str(Path(__file__).parent / "fixtures" / "vault")


class TestScanVault:
    def test_query_ia_returns_note1_first(self):
        results = scan_vault("IA", vault_path=FIXTURES)
        assert len(results) > 0
        # note1 has the most IA mentions + tags + wikilinks → highest score
        assert "note1.md" in results[0].file_path

    def test_note5_not_in_ia_results(self):
        results = scan_vault("IA", vault_path=FIXTURES)
        paths = [r.file_path for r in results]
        assert not any("note5.md" in p for p in paths)

    def test_max_results_limits_output(self):
        results = scan_vault("IA", vault_path=FIXTURES, max_results=1)
        assert len(results) <= 1

    def test_subdirs_filtering(self):
        # Create a subdir structure for testing
        subdir = Path(FIXTURES) / "subdir_a"
        subdir.mkdir(exist_ok=True)
        note = subdir / "sub_note.md"
        note.write_text("IA no subdiretório")
        try:
            results = scan_vault("IA", vault_path=FIXTURES, subdirs=["subdir_a/"])
            assert len(results) == 1
            assert "sub_note.md" in results[0].file_path
        finally:
            note.unlink(missing_ok=True)
            subdir.rmdir()

    def test_subdirs_nonexistent_returns_empty(self):
        results = scan_vault("IA", vault_path=FIXTURES, subdirs=["nope/"])
        assert results == []

    def test_empty_file_no_crash(self):
        results = scan_vault("anything", vault_path=FIXTURES)
        # Should not raise; note3.md is empty and won't match
        assert not any("note3.md" in r.file_path for r in results)

    def test_scores_normalized_to_one(self):
        results = scan_vault("IA", vault_path=FIXTURES)
        if results:
            assert results[0].relevance_score == 1.0
            for r in results:
                assert 0.0 <= r.relevance_score <= 1.0


class TestParseMdFile:
    def test_extracts_tags(self):
        note1 = str(Path(FIXTURES) / "note1.md")
        tags, _ = _parse_md_file(note1)
        assert "IA" in tags
        assert "automação" in tags

    def test_extracts_wikilinks(self):
        note1 = str(Path(FIXTURES) / "note1.md")
        _, wikilinks = _parse_md_file(note1)
        assert "Circuito da Realidade" in wikilinks
        assert "Automatik Labs" in wikilinks

    def test_empty_file_returns_empty(self):
        note3 = str(Path(FIXTURES) / "note3.md")
        tags, wikilinks = _parse_md_file(note3)
        assert tags == []
        assert wikilinks == []

    def test_encoding_safety(self):
        note4 = str(Path(FIXTURES) / "note4.md")
        tags, wikilinks = _parse_md_file(note4)
        assert "sentimento" in tags
        assert "Processamento de Linguagem Natural" in wikilinks


class TestCountMatches:
    def test_count_ia_in_note1(self):
        note1 = str(Path(FIXTURES) / "note1.md")
        count = _count_matches(note1, "IA")
        assert count >= 3  # IA appears multiple times

    def test_count_zero_for_no_match(self):
        note5 = str(Path(FIXTURES) / "note5.md")
        count = _count_matches(note5, "IA")
        assert count == 0


class TestGetMatchedContent:
    def test_returns_context(self):
        note1 = str(Path(FIXTURES) / "note1.md")
        content = _get_matched_content(note1, "IA")
        assert len(content) > 0
        assert len(content) <= 500

    def test_no_match_returns_empty(self):
        note5 = str(Path(FIXTURES) / "note5.md")
        content = _get_matched_content(note5, "quantum")
        assert content == ""
