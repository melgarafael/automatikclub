# AutomatikLabs Educational System — Brainstorm Refinements

**Status:** Post-Fase 0 synthesis · **Date:** 2026-04-06
**Audience:** Rafael + future Master Maestro (humans, not agent-zumbis)
**Charter:** `automatiklabs/docs/educational-system/CHARTER.md` (read-only; this doc records what changed relative to it)

This document is the meta-synthesis of a 4-round brainstorm across 7 specialist Maestri terminals. It records what the brainstorm changed, what was agreed, what was left unresolved, and what must happen next.

---

## 1. Process recap

| Parameter | Value |
|---|---|
| Rounds completed | 4 |
| Active terminals | 7 (Arquiteto, Database, Backend Dev, UI UX Design, QA Review, Nucleo 01, Nucleo 02) |
| Absent terminal | Scrum Master / Curriculum Orchestration (never participated) |
| R4 drafts produced | 5 of 7 (Backend Dev and QA Review jammed — R1–R3 outputs intact) |
| Approximate files generated | ~50 brainstorm files across 4 rounds |
| Synthesis engine | This document + 8 context docs in `docs/educational-system/context/` |

The absence of the Scrum Master terminal is the single biggest structural gap. The `curriculum-orchestration.md` context doc was reconstructed from the Charter + concerns visible in other terminals' outputs. The Scrum Master terminal must review and refine that document when connected.

---

## 2. Key refinements to the Charter

The Charter itself was not edited (by design). These are the refinements that emerged from the brainstorm and are now codified in the context documents. They represent interpretations, extensions, and clarifications that a future re-sync of the Charter should incorporate formally.

### 2.1 "Publish as consequence" became architecturally concrete

Charter §4.4 says lessons need approved reviews before `is_published=true`. The brainstorm concretized this into: `REVOKE UPDATE (is_published)` from all roles + `SECURITY DEFINER publish_lesson()` as the only write path + `fn_validate_lesson_doctrine()` running inside it. This is now the canonical pattern. The trigger-only approach (which some terminals initially proposed) was rejected: "trigger alone can be bypassed by superuser."

### 2.2 Bloom ≥ 5 = human review — encoded as an incentive structure

Charter §4.4 implies human review for important content. The brainstorm made this explicit and inverted as an incentive: marking Bloom 5 creates mandatory human review friction. Therefore, authors should auto-rebaixar (downgrade) Bloom when honest. Marking Bloom 3 is pedagogically correct if the competency permits it. This is now encoded as an operating principle in 4 context docs.

### 2.3 Cube variants are wrappers, not rewrites

The Charter describes the Cubo 3D (§3.3) but does not say how variants are implemented. The brainstorm converged on a clear rule: one canonical spine in (Estágio 2–3, Organizado, Lógica) + `spine-transformer` derives variants. Content is NOT duplicated 54 times. `lesson_variants` table holds `content_overrides jsonb` + `layout_overrides jsonb` in a single row per cube cell. This rule is now codified in `content-production.md` and `lesson-experience.md`.

### 2.4 State history is events, not columns

The Charter mentions `user_journey_history` (§4.3) but is silent on competency progress storage. The brainstorm produced a clear architecture: `user_competency_progress_events` (append-only event sourcing) + `v_user_competency_progress` (DISTINCT ON view for current state). This same pattern now applies to `pedagogical_reviews` (append-only rows, never UPDATE), `user_journey_history`, and `domain_events`. History is always the truth; current state is always derived.

### 2.5 Advisory locks before any concurrent write

Workers Python run with service_role, which bypasses RLS. The Charter does not address concurrency. The brainstorm added: `pg_advisory_xact_lock(hashtext('lesson:' || lesson_id))` wrapping any review operation, and `UNIQUE (user_id, competency_id, dedupe_key)` as idempotency on event tables. This is now a documented pattern in `pedagogical-workflow.md`.

### 2.6 SLA expiry = escalation, not auto-approve

The Charter does not specify what happens when review SLAs expire. QA Review initially proposed auto-approve on timeout; Pedagogical Workflow pushed back hard and this was rejected. Final doctrine: timeout triggers escalation to `pedagogical_admin` via `domain_events`. Pressure goes up the chain. The clock running never grants permissions.

### 2.7 The 8 hard-fail criteria are now enumerated

The Charter mentions a review gate (§4.4) but does not specify what it checks. The brainstorm produced exactly 8 hard-fail criteria (now in `pedagogical-qa.md` §4.1). The deliberate limit of 8 (not 50, not 200) is a design decision: value is in consistent application, not granularity. The local `lesson-validator` in Content Production mirrors these 8 exactly.

### 2.8 `publish_lesson` returns a list of failures, not a boolean

Several terminals requested this. The function signature was changed from `RETURNS VOID` (naive) to `RETURNS TABLE(passed bool, failing_criteria jsonb)` so authors see exactly which criterion failed, not just "review failed." This is now in `pedagogical-workflow.md` §4.1.

---

## 3. Major agreements across all 7 terminals

These points achieved explicit convergence — no terminal dissented across all 4 rounds:

1. **CBE real, not time-based.** Drop `auto_complete_lesson` trigger. Progress by demonstrated competency, not by time watched. Every terminal arrived at this conclusion independently.
2. **Publish is a consequence, never a write.** REVOKE + SECURITY DEFINER + trigger. Defense in depth. No single layer is sufficient.
3. **History is append-only.** `pedagogical_reviews`, `user_journey_history`, `user_competency_progress_events` — no UPDATE or DELETE, ever. History is the truth that Kirkpatrick 3–4 depends on.
4. **Cubo 3D via wrappers, not rewrites.** Spine canonical + transformers for variants. Content is not duplicated 54x.
5. **Bloom ≥ 5 = human reviewer mandatory.** Encoded as CHECK constraint + incentive structure (author pays the friction).
6. **Auto-approve on timeout is a doctrine violation.** Unanimous. SLA expiry → escalation → `pedagogical_admin`.
7. **Agent reviewer runs once per lesson version.** Not in a loop. Human feedback triggers a new version, which triggers a new agent run — not a recursive loop between agent and human.
8. **`fn_validate_lesson_doctrine` runs before the human review queue.** Automated pre-screening reduces human reviewer load by ~60%.
9. **Competencies are a DAG (not a flat list).** `competency_prerequisites` table with a CONSTRAINT TRIGGER to detect cycles. The brainstorm on this was initially a question (Pedagogical Workflow R1) and was answered by all terminals in R2/R3.

---

## 4. Major tensions / unresolved trade-offs

These are points where terminals disagreed or left decisions open. Each needs a decision from Rafael / Master Maestro before Fase 1 stories are finalized.

### T1: competency_versions — when does a doctrine upgrade invalidate student history?

QA Review (R2) proposed a `competency_versions` table so that students who demonstrated v1 of a competency still count after the bloom_level is raised. Backend Dev (R3) accepted the need but no migration was written. **Decision needed:** when a competency's `bloom_level` is raised post-publish, do past demonstrations count? Current assumption: yes, they count (Kirkpatrick 3 integrity). But the enforcement schema is missing.

### T2: revenue_milestones table — co-ownership and schema undefined

Instructional Design (R2) proposed `revenue_milestones` as the anchor for Kirkpatrick L4 outcomes. Assessment Engine (R3) accepted co-ownership. No migration exists. Bloom 6 of Negociação (3 Cs) is explicitly unrubric-able — it gates on this table. **Decision needed:** is `revenue_milestones` in scope for Fase 1? If yes, who writes the migration?

### T3: RLS split for `lesson_variants.content_overrides` vs `layout_overrides`

Same table, two jsonb columns, two different owner roles (`content_author` writes `content_overrides`, `ui_design_editor` writes `layout_overrides`). RLS policy DDL not written. **Decision needed:** does Supabase RLS support column-level grants via jsonb key? Or do we split into two tables? Security terminal input required.

### T4: legacy lesson backfill policy

200+ existing lessons. No policy for whether and how they get CBE competency mappings. Content Production proposed `legacy=true` flag. Backend Dev proposed `00015b_backfill` migration. **Decision needed:** do legacy lessons count toward CBE until reprocessed? Is a formal backfill planned for Fase 1 or deferred?

### T5: Kirkpatrick L4 evidence — how is "renda real" verified?

QA Review (R2) explicitly flagged this as their biggest blind spot: Charter §1.2 says real income is the success metric, but nobody defined how to verify it. Is it self-reported? Requires contract upload? Integrated with a payment processor? **Decision needed before the first Formação ships:** the success metric of the entire system is undefined at the evidence level.

### T6: `pg_cron` and cron worker availability on Supabase target project

Several areas (Schema Extensions, Pedagogical Workflow, Pedagogical QA drift detector) depend on scheduled jobs. `pg_cron` availability on the specific Supabase project is not verified. **Action needed:** Rafael to check Supabase project capabilities before Fase 1 starts. If unavailable, cron workers run as local Bash scripts on a schedule.

### T7: human reviewer capacity

The entire CBE system has a single human review bottleneck for Bloom 5–6 content. Who are the human reviewers? How many? What is their availability? What happens when one takes a vacation? The brainstorm assumed human reviewers exist but never defined them. This is the highest operational risk for the entire system.

---

## 5. New entities/concepts that emerged from the brainstorm

These were NOT in the original Charter and were produced by the brainstorm. They are now codified in the context documents.

| New entity | Proposed by | Where codified |
|---|---|---|
| `domain_events` table | Nucleo 02 (R2), extended by Backend Dev | `pedagogical-workflow.md`, `schema-extensions.md` |
| `review_audits` table | Backend Dev (R2) | `pedagogical-qa.md` §4.3 |
| `lesson_generator_runs` | Nucleo 01 (R1) | `content-production.md` §4.3 |
| `bloom_assessed` column on `pedagogical_reviews` | QA Review (R1) | `schema-extensions.md` §4.5 |
| `review_round` column on `pedagogical_reviews` | QA Review (R1) | `schema-extensions.md` §4.5 |
| `criterion_results JSONB` on `pedagogical_reviews` | QA Review (R1) | `schema-extensions.md` §4.5 |
| `competency_prerequisites` DAG table | Backend Dev (R1), confirmed by Arquiteto (R3) | `schema-extensions.md` §4.2 |
| `revenue_milestones` table | Instructional Design (R2) | `instructional-design.md` §9 (open question) |
| `competency_versions` table | QA Review (R2) | `pedagogical-qa.md` §9 (open question) |
| `LayoutOverrides` contract for PersonaWrapper | UI UX Design (R2) | `lesson-experience.md` §4.2 |
| `spine-transformer` pattern | QA Review (R1), accepted by all in R2 | `content-production.md` §3 |
| 8 hard-fail criteria (enumerated rubric) | QA Review (R1/R3) | `pedagogical-qa.md` §4.1 |
| `agent_human_agreement_rate` KPI | QA Review (R2) | `pedagogical-qa.md` §4.5 |
| `dedupe_key` on events tables | Backend Dev (R2) | `schema-extensions.md` §4.4 |
| `backpressure gate` at 20 items / 3 days | Nucleo 01 (R1), formalized by Backend Dev (R2) | `pedagogical-workflow.md` §3 |
| `publication_board` (lessons awaiting review column) | QA Review (R1) | `curriculum-orchestration.md` §4.2 |
| `fase1-cube-cells.yaml` prioritization artifact | Multiple terminals (R2/R3) | `curriculum-orchestration.md` §4.1 |

---

## 6. Skill creation priorities (ranked)

Based on which atomic skills were most urgently requested across multiple terminals:

| Priority | Skill | Who needs it | Current status |
|---|---|---|---|
| P0 | `bloom-calibrator` | QA Review (automates 60% of reviews), Content Production, Instructional Design | Does not exist |
| P0 | `pedagogical-gate-rubric` (8-criteria skill) | Content Production (self-validation), QA Review gate | Must be created as part of Fase 1 — QA's rubric is published; skill wraps it |
| P1 | `backward-design` | Instructional Design | Does not exist |
| P1 | `competency-evidence-validator` | Assessment Engine, QA Review | Does not exist |
| P2 | `tres-camadas-maestria` | Instructional Design, Content Production | Does not exist |
| P2 | `empresa-ia-humanizada` | Instructional Design, Content Production | Does not exist |
| P2 | `cognitive-load-estimator` | QA Review (soft gate automation) | Does not exist |
| P3 | `7-passos-script-vendas` | Monetization tracks (Fase 2) | Does not exist |
| P3 | `learner-personas` | Personalization Router (Fase 2) | Does not exist |

**Note:** `automatiklabs-doctrine` already exists. All agents must load it. The starred skills in Charter §4.6 are the same list as above.

---

## 7. Risks identified

These risks were called out explicitly by multiple terminals. They are ranked by blast radius.

| Risk | Severity | Called out by | Mitigation status |
|---|---|---|---|
| Human reviewer capacity undefined — single bottleneck kills CBE at scale | Critical | QA (R1/R2/R3), Backend Dev (R1), Nucleo 01 (R1) | No mitigation yet |
| `pedagogical-drift-detector` not built — doctrine approves well day 1 then degrades silently | High | QA (R1/R2), Backend Dev (R2) | Design in `pedagogical-qa.md`; not yet implemented |
| Bloom inflation (authors mark Bloom 5 everywhere) — human review becomes unsustainable | High | QA (R1), Arquiteto (R1/R3) | Inverse incentive encoded; `bloom_assessed` divergence tracking planned |
| Combinatorial cube explosion if 54-cell generation is approved prematurely | High | QA (R1), Backend Dev (R1), UI UX (R1) | Spine-first rule + `fase1-cube-cells.yaml` mitigates |
| Race condition between agent reviewer + human reviewer on same lesson | High | Backend Dev (R1/R2) | Advisory lock pattern designed; not yet implemented |
| Kirkpatrick L4 verification undefined — "renda real" is an honor system | High | QA (R2) | Open question (§T5 above) — no mitigation |
| Legacy backfill creates half-CBE / half-time-based state during Fase 1 → 2 transition | Medium | Backend Dev (R2) | Migration design in `pedagogical-workflow.md`; SQL not written |
| `service_role` bypasses RLS — workers can write anywhere | Medium | Backend Dev (R2), Database (R3) | plpgsql RAISE in append-only triggers covers this |
| Skills that write to the DB are not constrained to go through SECURITY DEFINER functions | Medium | Backend Dev (R1), QA (R1) | REVOKE pattern designed; needs CI enforcement |
| Dependency cycles in competency DAG if detector is not wired before first insert | Medium | Backend Dev (R1/R3) | CONSTRAINT TRIGGER `fn_check_no_competency_cycle` designed |

---

## 8. Next steps for Rafael

Ordered by urgency. The first 3 are blocking for Fase 1 start.

1. **Decide human reviewer capacity (T7 above).** Before the first Bloom 5–6 lesson enters the pipeline, define: who are the human reviewers, how many, what is their availability, and what happens when they are unavailable. This is the single point of failure for CBE.

2. **Verify `pg_cron` on the Supabase project (T6 above).** Several cron workers (SLA escalation, drift detector, MV refresh) depend on this. Check in the Supabase dashboard and decide: use `pg_cron` or run workers as Bash scripts on a local schedule.

3. **Decide `revenue_milestones` scope for Fase 1 (T2 above).** If Bloom 6 of Negociação needs to be teachable in Fase 1, the table must be designed. If it is Fase 2, mark all Bloom 6 Negociação competencies as `deferred` in the catalog.

4. **Connect the Scrum Master terminal.** The Curriculum Orchestration context doc was reconstructed from the Charter. It is functional but thin on operational detail. The Scrum Master terminal, when connected, should read `curriculum-orchestration.md` and refine it with their own patterns before executing stories.

5. **Create the `pedagogical-gate-rubric` skill.** QA Review's 8 criteria are published in `pedagogical-qa.md`. Wrap them in an atomic skill so Content Production's `lesson-validator` and `fn_validate_lesson_doctrine` can both import from a single source of truth.

6. **Publish `fase1-cube-cells.yaml`.** Before any generation begins, Curriculum Orchestration (or Rafael) must publish the prioritized list of cube cells for Fase 1. Without it, each terminal makes its own assumptions.

7. **Create `bloom-calibrator` skill (P0).** This is the highest-leverage skill in the system — it automates 60% of QA's review work. Start here before the first lesson enters the review queue.

8. **Write `00015b_backfill` migration plan.** Legacy students need at minimum `user_competency_progress_events` seed rows before CBE is active. Decide: honest start (no artificial "demonstrated" rows, only `not_started`) or full retrofit mapping. Draft the SQL.

9. **Review context documents with each area owner.** Each of the 8 context docs was written by the synthesis engine. Arquiteto, Database, Backend Dev, UI UX, QA, Nucleo 01, and Nucleo 02 should each review their context doc in their first Fase 1 session and flag any disagreements before executing stories.

10. **Define the Kirkpatrick L4 evidence gate (T5 above).** This is the most philosophically important open question in the system. Even if the mechanism is simple (self-reported revenue with periodic spot-checks), it must be explicit before the first Formação ships.

---

*End of BRAINSTORM-REFINEMENTS.md — for human review, not for agent execution.*
