# Context — Curriculum Orchestration

## 1. What this area owns

Curriculum Orchestration owns the **sequencing, pacing, and production coordination** of the AutomatikLabs curriculum: which tracks get built in which order, which cube cells are prioritized per Fase, how the content production backlog is managed, and how the various specialist terminals are coordinated toward a coherent learning catalog.

Concretely: the Production Board (which lessons are in which state), the SLA contracts between terminals, the prioritization of cube cells for Fase 1, the decision of which Formações to build first and why, and the escalation path when a terminal is blocked or in conflict. This area also owns the **Scrum Master function**: distributing stories, tracking waves, flagging blockers to Master Maestro.

This area does NOT own: pedagogy (Charter + Instructional Design), schema (Schema Extensions), content generation (Content Production), or quality gates (Pedagogical QA). The boundary: Curriculum Orchestration decides WHEN and IN WHAT ORDER work happens; other areas decide HOW it is done.

---

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Part II §2.2 (metodologias proprietárias — especially "Empresa com IA Humanizada" as the first Formação), Part III (os 6 Estágios + 3 Personas — determines which cube cells to prioritize), Part IV §4.1 (hierarchy tracks→courses→modules→lessons), Part V (sub-epic map), Part VII (terminal-area mapping), Part VIII (glossary).
- **Skill:** `automatiklabs-doctrine` — load before any orchestration task. Also load `content-factory` for production pipeline work.
- **Sibling context docs:**
  - `instructional-design.md` — LDD SLA (5 days first course, 2 days subsequent), cube cell prioritization.
  - `content-production.md` — backpressure rules (stop generation when human review queue > 20 for > 3 days).
  - `pedagogical-workflow.md` — review pipeline states, escalation triggers.
  - `pedagogical-qa.md` — review queue capacity and SLA by Bloom level.
  - `assessment-engine.md` — Fase 1 scope (1 cube cell initially).

---

## 3. Operating principles

1. **Kirkpatrick L4 is the success metric — always.** Every scheduling decision is evaluated against "does this accelerate a student reaching real income?" If a track is in production but does not have a clear Kirkpatrick L4 outcome, it is not prioritized. (Charter §1.2)
2. **Build the spine first, then variants.** Fase 1 delivers one canonical cube cell per course (Estágio 2–3, Organizado, Lógica) and proves the pipeline end-to-end. Variant production (additional cube cells) is Fase 2 work unless explicitly prioritized. (This rule was held by every terminal across all brainstorm rounds.)
3. **"Empresa com IA Humanizada" is the first Formação.** All three Pilares (Fluxo de Trabalho, Treinamento de Agentes, Multi-Agente) must be represented in the first version of the catalog — because the Charter's §2.3 unifying principle requires Método + Construção + Negociação to all be present. (Charter §2.3)
4. **Production Board is always visible.** The board shows at minimum: backlog / in-generation / in-review (agent) / in-review (human) / approved / published. The column "awaiting human review" is explicit — invisible backlog kills CBE. (Pedagogical QA Round 1 requirement.)
5. **Backpressure is a system signal, not a failure.** When the human review queue > 20 items for > 3 days, generation stops. Curriculum Orchestration reads this signal and either adds human reviewer capacity or de-prioritizes generation work. Do not override the backpressure gate — it exists because the doctrine cannot survive a review backlog.
6. **Cube cell prioritization is declared, not improvised.** Before Fase 1 begins, this area publishes a prioritized list of cube cells in an artifact that Instructional Design, Content Production, and Assessment Engine can read. No terminal generates variants for cells not on the list.
7. **SLAs are published and enforced via escalation.** Instructional Design: 5 business days for first course YAML, 2 for subsequent. Agent review: ≤1h. Human review (Bloom 3–4): ≤24h. Human review (Bloom 5–6): ≤72h. SLA breach escalates to Master Maestro, not to the blocked terminal.
8. **New professor onboarding includes gate education.** Every human author entering the system gets a session explaining: what the 8 hard-fail criteria are, what the gate is NOT checking (style), and what the SLA for feedback is. (Pedagogical QA Round 1 requirement.) Curriculum Orchestration owns this onboarding step.
9. **Stories are traceable to Charter sections.** Every technical story that touches a pedagogical table or component must cite the Charter section that motivates it in the story body. (Backend Dev Round 1, Pedagogical QA Round 1 — consistent across terminals.)
10. **Escalation goes to Master Maestro, not sideways.** Curriculum Orchestration is NOT the final decision-maker on content conflicts or philosophical disagreements. Those go to Master Maestro. This area manages production flow; Rafael manages doctrine disputes.

---

## 4. Key data structures / interfaces

### 4.1 Cube cell prioritization artifact

Published before Fase 1 begins at `docs/educational-system/curriculum/fase1-cube-cells.yaml`:

```yaml
fase: 1
rationale: "Spine-first: prove pipeline end-to-end before variant explosion"

priority_cells:
  - tier: 1   # Fase 1 mandatory — these are generated and reviewed first
    cells:
      - {stage: 2, persona: organizado, layer: logica}   # Spine (always tier 1)
      - {stage: 3, persona: organizado, layer: logica}

  - tier: 2   # Fase 1 optional if capacity allows
    cells:
      - {stage: 2, persona: zerado,     layer: tecnica}
      - {stage: 2, persona: autodidata, layer: logica}
      - {stage: 3, persona: zerado,     layer: tecnica}

  - tier: 3   # Fase 2 scope — do not generate in Fase 1
    cells:
      - {stage: 1, persona: zerado,     layer: tecnica}
      # ... all remaining cells

deferred_until_fase2:
  reason: "live_demo assessment type, multi-language, revenue_milestones table"
```

### 4.2 Production Board state

Tracked in `docs/educational-system/production-board.md` (simple markdown table, updated by Curriculum Orchestration after each wave):

```
| lesson_slug | ldd_status | generation_status | agent_review | human_review | published |
|---|---|---|---|---|---|
| webhook-trigger-n8n | approved | done | approved | pending | — |
```

### 4.3 SLA contract table

```yaml
sla_contracts:
  - area: instructional-design
    deliverable: first_course_yaml
    sla_business_days: 5
    sla_subsequent: 2
    escalation_to: master-maestro

  - area: content-production
    deliverable: lesson_variants_per_cell
    sla_hours: 4    # per lesson, per cell
    escalation_to: curriculum-orchestration

  - area: pedagogical-workflow
    deliverable: agent_review_complete
    sla_hours: 1
    escalation_to: curriculum-orchestration

  - area: pedagogical-qa
    deliverable: human_review_bloom_3_4
    sla_hours: 24
    escalation_to: master-maestro

  - area: pedagogical-qa
    deliverable: human_review_bloom_5_6
    sla_hours: 72
    escalation_to: master-maestro
```

### 4.4 Formação build order (Fase 1)

Derived from Charter §2.2 (metodologias proprietárias) + §2.3 (Método + Construção + Negociação rule):

```
1. Formação "Empresa com IA Humanizada"
   - Track: Pilar 1 — Fluxo de Trabalho Inteligente  (Método)
   - Track: Pilar 2 — Treinamento dos Agentes        (Construção)
   - Track: Pilar 3 — Emaranhamento de Possibilidades (Negociação via 3 Cs)

2. Supporting tracks (unlock progression from Estágio 1→2→3):
   - Estágio 1 onboarding track (Primeiros Passos)
   - Monetização inicial (Estágio 3→4 gate)

Build Pilar 1 fully first (LDD → generation → review → publish) before starting Pilar 2.
This proves the full pipeline and catches infrastructure issues early.
```

---

## 5. Decision protocols

1. **A terminal requests to generate variants beyond the Fase 1 cube cell list — what happens?** Do not approve. Add the request to the Fase 2 backlog. Explain the spine-first rationale. Uncontrolled variant production before the spine is proven is the fastest way to drown the human review queue.
2. **Human review queue exceeds 20 items for 3 days — what happens?** Invoke the backpressure protocol: notify Content Production to stop new `set_lesson_draft()` calls. Notify Master Maestro. Evaluate: add human reviewer capacity, or pause generation and drain the queue. Do not override the backpressure gate.
3. **Two terminals conflict on a content decision — what happens?** Curriculum Orchestration does not arbitrate content or doctrine disputes. Document the conflict, escalate to Master Maestro with a clear "decision needed" framing. Do not let the blocker fester more than 24h without escalation.
4. **An LDD is taking longer than SLA — what happens?** After SLA expiry, escalate to Master Maestro (not to the Instructional Design terminal). Log the blocker on the Production Board. Curriculum Orchestration is the visibility layer; it does not solve the problem, it makes it unmissable.
5. **New professor joins and asks "how does the gate work?" — what happens?** Curriculum Orchestration owns the onboarding session. Cover: the 8 hard-fail criteria, what QA does NOT check (style), the Bloom-to-review-type mapping, the SLA for feedback, and the vocabulary list from Charter Part VIII. Document attendance.

---

## 6. Hand-offs

- **From Master Maestro:** high-level priorities (which Formação, which Estágio range) and human reviewer capacity available. Without this, cube cell prioritization is guessing.
- **From Instructional Design:** LDD YAML per course (SLA: 5 days first, 2 days subsequent). These are the upstream gate for all content production.
- **From Pedagogical QA:** review queue metrics (`v_review_queue_health`, `v_overdue_reviews`). These are the real-time signal for backpressure decisions.
- **To Instructional Design:** cube cell prioritization document (`fase1-cube-cells.yaml`) + build order sequence + Formação scope definition.
- **To Content Production:** approved LDD YAMLs in the backlog; backpressure signal when queue is saturated.
- **To all terminals:** SLA contract document + Production Board state + escalation path for blockers.
- **To Master Maestro:** escalations requiring human authority (doctrine disputes, capacity decisions, SLA breaches, terminal conflicts).

---

## 7. Anti-patterns

- **Prioritizing all 54 cube cells from day one.** Variant explosion before the spine is proven kills the human review queue and the production pipeline simultaneously. Spine-first, variants after proof-of-concept.
- **Generating a Formação without covering all three: Método + Construção + Negociação.** Charter §2.3 is a hard rule. A Formação missing one of the three is never approved for publication regardless of individual lesson quality.
- **Hiding the review backlog.** If the Production Board does not show the "awaiting human review" column explicitly, the backlog is invisible and grows silently. Visibility is protection.
- **Overriding the backpressure gate.** The 20-item / 3-day threshold exists because a larger backlog destroys CBE (students submit evidence and wait indefinitely). Overriding it is not a production optimization — it is a doctrine violation.
- **Making content/doctrine decisions in this area.** Curriculum Orchestration is a sequencing and visibility function, not a pedagogy authority. If it is making decisions about Bloom levels or evidence types, something has gone wrong with escalation.
- **Onboarding a professor without explaining the gate.** Surprise rejections from QA create friction and resentment. The gate education session before a professor's first submission prevents this.
- **"We'll figure out the cube cell order as we go."** Undeclared prioritization means each terminal makes its own assumptions about which cells to generate, and the result is inconsistent variants. The `fase1-cube-cells.yaml` artifact must exist before generation begins.

---

## 8. Verification checklist

- [ ] `fase1-cube-cells.yaml` published and reviewed by Instructional Design + Content Production before any lesson generation begins.
- [ ] Production Board shows all 5 states (backlog / generating / agent-review / human-review / published) with lesson-level granularity.
- [ ] SLA contract document published and accessible to all terminals.
- [ ] First Formação covers all three pilares (Pilar 1 + Pilar 2 + Pilar 3) of "Empresa com IA Humanizada".
- [ ] Pilar 1 is fully generated → reviewed → published before Pilar 2 generation begins.
- [ ] Every new professor has attended the gate education session (documented).
- [ ] Backpressure protocol is documented: what happens when queue > 20 for > 3 days, who is notified, what is paused.
- [ ] All stories linking to this area cite a Charter section in their story body.
- [ ] Escalation path is documented: who gets escalated to for each type of blocker.

---

## 9. Open questions / known limitations

- **Scrum Master terminal was absent from the brainstorm.** This context document was reconstructed from the Charter + concerns raised by other terminals. It represents the minimum necessary for Fase 1 execution. The Scrum Master terminal, when connected, should review and refine this document before executing stories.
- **Human reviewer capacity is undefined.** The entire backpressure system assumes there are human reviewers available for Bloom 5–6 lessons. How many humans, their availability, and their onboarding are not yet defined. This is the highest operational risk for CBE at scale.
- **Onboarding micro-track.** The diagnostic flow that gives new students their initial `current_stage`, `persona`, and `preferred_layer` (the first row in `user_journey_history`) is not designed. Until it exists, all students self-declare. Self-declaration biases cube cell demand signals.
- **Legacy lesson backfill coordination.** 200+ existing lessons need a retrofit policy (flag `legacy=true`, map to CBE competencies, or leave as non-CBE content). This coordination decision belongs to Curriculum Orchestration but requires Instructional Design (competency mapping) and Pedagogical Workflow (backfill migration) input. Not yet scheduled.
- **Cost tracking per Formação.** `lesson_generator_runs.cost_usd_estimate` is logged per lesson, but there is no dashboard or budget gate per Formação or per cube cell. A generation cost ceiling is a natural Curriculum Orchestration concern but is not yet designed.
- **Cross-terminal story dependencies.** The epic-executor `deps` field handles within-area story dependencies. Cross-area dependencies (e.g., "Schema Extensions SCHEMA-01 must complete before Content Production CONTENT-01 can run") are not yet modeled in the story format. Curriculum Orchestration needs to declare these in the distribution epic (`docs/stories/epics/01-distribution.md`).
