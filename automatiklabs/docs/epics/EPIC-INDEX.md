# AutomatikLabs — Epic Index

> **Versao:** 1.0.0
> **Data:** 2026-04-01
> **Total:** 18 Epics, 101 Stories

---

## Ordem de Execucao e Dependencias

| # | Epic | Stories | Depende de | Camada |
|---|---|---:|---|---|
| 01 | Project Scaffolding | 5 | — | Infra |
| 02 | Design System & Core UI | 6 | 01 | Frontend |
| 03 | Auth & User System | 6 | 01, 02 | Fullstack |
| 04 | Database Schema | 5 | 01 | Database |
| 05 | Learning Engine | 8 | 02, 03, 04 | Fullstack |
| 06 | Comments & Ratings | 5 | 04, 05 | Fullstack |
| 07 | Gamification | 6 | 03, 04 | Fullstack |
| 08 | Community Feed | 6 | 02, 03, 04 | Fullstack |
| 09 | AI Feed (MoltBook) | 5 | 04, 08 | Fullstack |
| 10 | Marketplace | 6 | 03, 04, 07 | Fullstack |
| 11 | Contributor Lessons | 5 | 05, 07 | Fullstack |
| 12 | Recommendation Engine | 4 | 04, 05 | Backend |
| 13 | Newsletter | 4 | 02, 03 | Fullstack |
| 14 | Book Recommendations | 3 | 02, 04 | Fullstack |
| 15 | Admin Panel | 7 | 03, 04, 05, 06, 07, 08, 09, 10, 11, 13, 14 | Fullstack |
| 16 | AI Comment Responder | 4 | 06 | Backend |
| 17 | Polish & Performance | 5 | All (01-16) | Frontend/Infra |
| 18 | Gacha System (Forja do Conhecimento) | 11 | 03, 04, 07 | Fullstack |

---

## Fases de Execucao

### Fase 1 — Fundacao (paralelo)
- **EPIC-01:** Project Scaffolding
- **EPIC-04:** Database Schema (apos 01)

### Fase 2 — Core UI + Auth (paralelo apos Fase 1)
- **EPIC-02:** Design System & Core UI
- **EPIC-03:** Auth & User System

### Fase 3 — Features Primarias (paralelo apos Fase 2)
- **EPIC-05:** Learning Engine
- **EPIC-07:** Gamification
- **EPIC-08:** Community Feed

### Fase 4 — Features Secundarias (paralelo apos Fase 3)
- **EPIC-06:** Comments & Ratings
- **EPIC-09:** AI Feed
- **EPIC-10:** Marketplace
- **EPIC-11:** Contributor Lessons
- **EPIC-12:** Recommendation Engine
- **EPIC-13:** Newsletter
- **EPIC-14:** Book Recommendations

### Fase 4b — Gacha (apos EPIC-07)
- **EPIC-18:** Gacha System (Forja do Conhecimento)

### Fase 5 — Consolidacao
- **EPIC-15:** Admin Panel
- **EPIC-16:** AI Comment Responder

### Fase 6 — Polish
- **EPIC-17:** Polish & Performance

---

## Arquivos

| Epic | Arquivo |
|---|---|
| 01 | [EPIC-01-project-scaffolding.md](./EPIC-01-project-scaffolding.md) |
| 02 | [EPIC-02-design-system.md](./EPIC-02-design-system.md) |
| 03 | [EPIC-03-auth-user-system.md](./EPIC-03-auth-user-system.md) |
| 04 | [EPIC-04-database-schema.md](./EPIC-04-database-schema.md) |
| 05 | [EPIC-05-learning-engine.md](./EPIC-05-learning-engine.md) |
| 06 | [EPIC-06-comments-ratings.md](./EPIC-06-comments-ratings.md) |
| 07 | [EPIC-07-gamification.md](./EPIC-07-gamification.md) |
| 08 | [EPIC-08-community-feed.md](./EPIC-08-community-feed.md) |
| 09 | [EPIC-09-ai-feed.md](./EPIC-09-ai-feed.md) |
| 10 | [EPIC-10-marketplace.md](./EPIC-10-marketplace.md) |
| 11 | [EPIC-11-contributor-lessons.md](./EPIC-11-contributor-lessons.md) |
| 12 | [EPIC-12-recommendation-engine.md](./EPIC-12-recommendation-engine.md) |
| 13 | [EPIC-13-newsletter.md](./EPIC-13-newsletter.md) |
| 14 | [EPIC-14-book-recommendations.md](./EPIC-14-book-recommendations.md) |
| 15 | [EPIC-15-admin-panel.md](./EPIC-15-admin-panel.md) |
| 16 | [EPIC-16-ai-comment-responder.md](./EPIC-16-ai-comment-responder.md) |
| 17 | [EPIC-17-polish-performance.md](./EPIC-17-polish-performance.md) |
| 18 | [EPIC-18-gacha-system.md](./EPIC-18-gacha-system.md) |
| — | [DEPENDENCY-GRAPH.md](./DEPENDENCY-GRAPH.md) |
