---
name: add-course-materials-and-publish
description: Workflow command scaffold for add-course-materials-and-publish in automatikclub.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-course-materials-and-publish

Use this workflow when working on **add-course-materials-and-publish** in `automatikclub`.

## Goal

Adds new course lesson materials (HTML or docs), then deploys them to the public directory for serving (e.g., Vercel).

## Common Files

- `curso-openclaw/html/*.html`
- `curso-openclaw/super-kit/**/*`
- `automatiklabs/public/curso-openclaw/*.html`
- `automatiklabs/public/downloads/*.zip`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update lesson files in curso-openclaw/html/ or curso-openclaw/super-kit/
- Optionally update or add supporting documentation in curso-openclaw/
- Copy or move finalized HTML and package files to automatiklabs/public/curso-openclaw/ and automatiklabs/public/downloads/ for public access

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.