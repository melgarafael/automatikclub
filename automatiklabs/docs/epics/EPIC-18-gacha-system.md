# Epic 18: Forja do Conhecimento — Sistema Gacha

## Objetivo
Implementar sistema completo de gacha meritocrático: duas moedas (Fragmentos + Créditos), banners rotativos com pity system, 5 categorias de itens (25+ itens), fusão 3→1, reciclagem, marketplace de assets tradáveis com piso/teto, animações de pull com 4 camadas, provably fair RNG via HMAC-SHA256, e integração total com gamificação existente (EPIC-07).

## Spec
`docs/specs/2026-04-13-gacha-forja-do-conhecimento.md`

## Dependências
- EPIC-07: Gamification (XP engine, badges, streaks, challenges)
- EPIC-04: Database Schema (user_profiles, base tables)
- EPIC-03: Auth & User System (auth.uid(), RLS)

## Fases de Execução

### Fase 1: Foundation (Stories 18.1-18.2)
Schema DB + RPC functions. Sem UI — tudo testável via SQL/RPC.

### Fase 2: Service Layer (Stories 18.3-18.4)
TypeScript services + server actions. Integração com gamificação existente.

### Fase 3: Design + UI Core (Stories 18.5, 18.8)
Design tokens + banner/pull screen (sem animações complexas).

### Fase 4: Animações + Polish (Story 18.6)
4 camadas de animação, som, acessibilidade.

### Fase 5: Inventory + Marketplace UI (Story 18.7)
Collection view, fusão UI, marketplace listing/purchase.

### Fase 6: Security Hardening (Story 18.9)
Provably fair, rate limiting, anti-cheat, compliance.

### Fase 7: Testing (Stories 18.10-18.11)
Unit/integration + E2E Playwright.

## Stories

<!-- Stories are composed from specialist files below -->
<!-- Each terminal writes its domain stories independently -->
<!-- Final assembly merges all into this file -->

### Story 18.1: Gacha DB Schema — Core Tables + Enums + RLS
> See: `docs/epics/stories/EPIC-18-stories-db.md`

### Story 18.2: Gacha RPC Functions — Pull, Fusion, Reciclagem
> See: `docs/epics/stories/EPIC-18-stories-db.md`

### Story 18.3: Gacha Service Layer — Pull Engine + Economy
> See: `docs/epics/stories/EPIC-18-stories-backend.md`

### Story 18.4: Gacha Service Layer — Marketplace + Inventory
> See: `docs/epics/stories/EPIC-18-stories-backend.md`

### Story 18.5: Gacha UI — Banner Selection + Pull Screen
> See: `docs/epics/stories/EPIC-18-stories-frontend.md`

### Story 18.6: Gacha UI — Pull Animation + Reveal
> See: `docs/epics/stories/EPIC-18-stories-frontend.md`

### Story 18.7: Gacha UI — Inventory + Collection + Fusion
> See: `docs/epics/stories/EPIC-18-stories-frontend.md`

### Story 18.8: Design System — Gacha Tokens, Components, Animation Specs
> See: `docs/epics/stories/EPIC-18-stories-design.md`

### Story 18.9: Security — Anti-Cheat, Rate Limiting, Provably Fair, Compliance
> See: `docs/epics/stories/EPIC-18-stories-security.md`

### Story 18.10: QA — Unit + Integration Tests (Vitest)
> See: `docs/epics/stories/EPIC-18-stories-qa.md`

### Story 18.11: QA — E2E Tests (Playwright)
> See: `docs/epics/stories/EPIC-18-stories-qa.md`

## Dependency Graph

```
18.1 (DB Schema)
  └── 18.2 (RPC Functions)
        ├── 18.3 (Service: Pull + Economy)
        │     └── 18.5 (UI: Banner + Pull)
        │           └── 18.6 (Animações)
        └── 18.4 (Service: Marketplace + Inventory)
              └── 18.7 (UI: Inventory + Fusion + Marketplace)
  
18.8 (Design Tokens) ── prereq for ── 18.5, 18.6, 18.7

18.9 (Security) ── after ── 18.2, 18.3

18.10 (Unit Tests) ── after ── 18.3, 18.4
18.11 (E2E Tests) ── after ── 18.5, 18.6, 18.7
```

## Wave Execution Order (for epic-executor)

| Wave | Story | Deps | Terminal Ideal |
|---|---|---|---|
| 1 | 18.8 Design Tokens | — | UI UX Design |
| 2 | 18.1 DB Schema | — | Database |
| 3 | 18.2 RPC Functions | 18.1 | Database |
| 4 | 18.3 Service Pull+Economy | 18.2 | Backend Dev |
| 5 | 18.4 Service Marketplace+Inventory | 18.2 | Backend Dev |
| 6 | 18.5 Banner+Pull UI | 18.3, 18.8 | Frontend Dev |
| 7 | 18.7 Inventory+Fusion+Marketplace UI | 18.4, 18.8 | Frontend Dev |
| 8 | 18.6 Pull Animations | 18.5, 18.8 | Frontend Dev |
| 9 | 18.9 Security Hardening | 18.2, 18.3 | Security |
| 10 | 18.10 Unit+Integration Tests | 18.3, 18.4 | QA Review |
| 11 | 18.11 E2E Tests | 18.5, 18.6, 18.7 | QA Review |
