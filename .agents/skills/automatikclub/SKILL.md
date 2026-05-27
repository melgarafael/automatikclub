```markdown
# automatikclub Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill documents the development patterns and workflows used in the `automatikclub` repository. The codebase is primarily written in TypeScript and focuses on managing course materials, documentation, and publishing workflows. While no major frameworks are detected, the repository emphasizes clear coding conventions, structured commit messages, and repeatable processes for adding and deploying course content.

## Coding Conventions

**File Naming**
- Use kebab-case for file names.
  - Example: `course-materials.ts`, `lesson-one.html`

**Imports**
- Use relative import paths.
  - Example:
    ```typescript
    import { getLessonData } from './lesson-utils';
    ```

**Exports**
- Use named exports.
  - Example:
    ```typescript
    // lesson-utils.ts
    export function getLessonData(id: string) { /* ... */ }
    ```

**Commit Messages**
- Follow [Conventional Commits](https://www.conventionalcommits.org/) with prefixes like `feat` and `docs`.
  - Example: `feat(course): add new lesson on async patterns`
  - Example: `docs(curso-openclaw): update research blueprint`

## Workflows

### Add Course Materials and Publish
**Trigger:** When you want to add new course lesson materials (HTML or docs) and make them live for users.  
**Command:** `/publish-course-materials`

1. Create or update lesson files in `curso-openclaw/html/` or `curso-openclaw/super-kit/`.
2. Optionally update or add supporting documentation in `curso-openclaw/`.
3. Copy or move finalized HTML and package files to:
    - `automatiklabs/public/curso-openclaw/` (for HTML)
    - `automatiklabs/public/downloads/` (for ZIP packages)
4. Commit your changes with a descriptive message, e.g.:
    ```
    feat(curso-openclaw): add lesson 3 HTML and super-kit update
    ```
5. Push your changes to the repository.
6. The new materials are now live and accessible (e.g., via Vercel).

**Example Directory Structure:**
```
curso-openclaw/
  html/
    lesson-3.html
  super-kit/
    assets/
      image.png
automatiklabs/
  public/
    curso-openclaw/
      lesson-3.html
    downloads/
      super-kit-v3.zip
```

---

### Add Research or Planning Docs
**Trigger:** When you want to document research, planning, blueprints, or best practices.  
**Command:** `/add-research-doc`

1. Write or update Markdown files in `curso-openclaw/` or `curso-openclaw/pesquisa/`.
2. Use the `docs(curso-openclaw):` prefix in your commit message.
    ```
    docs(curso-openclaw): add research on new teaching methods
    ```
3. Push your changes to the repository.

**Example:**
```
curso-openclaw/
  teaching-methods.md
  pesquisa/
    blueprint-2024.md
```

## Testing Patterns

- Test files use the pattern `*.test.*` (e.g., `lesson-utils.test.ts`).
- The specific testing framework is not detected, but tests should be colocated with the code they verify.
- Example test file:
    ```typescript
    // lesson-utils.test.ts
    import { getLessonData } from './lesson-utils';

    describe('getLessonData', () => {
      it('returns correct data for a valid lesson ID', () => {
        // test implementation
      });
    });
    ```

## Commands

| Command                  | Purpose                                                        |
|--------------------------|----------------------------------------------------------------|
| /publish-course-materials| Add and publish new course materials to the public directory    |
| /add-research-doc        | Add or update research, planning, or documentation markdown    |
```
