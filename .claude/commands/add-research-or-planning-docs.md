---
name: add-research-or-planning-docs
description: Workflow command scaffold for add-research-or-planning-docs in automatikclub.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-research-or-planning-docs

Use this workflow when working on **add-research-or-planning-docs** in `automatikclub`.

## Goal

Adds new research, planning, or deep-dive documentation for the course or product.

## Common Files

- `curso-openclaw/*.md`
- `curso-openclaw/pesquisa/*.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Write or update Markdown files in curso-openclaw/ or curso-openclaw/pesquisa/
- Commit with docs(curso-openclaw): message prefix

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.