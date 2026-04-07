# Context — Assessment Engine (Núcleo 02)

## 1. What this area owns

Assessment Engine owns the **generation, storage, execution and grading of everything that produces evidence of a demonstrated competency**: rubrics, quizzes, performance tasks, agent reviewers, attempts, scores, and the promotion of `user_competency_progress.status` from `submitted → approved`. This area decides: what counts as valid evidence for a given competency, how that evidence is scored, what the passing threshold is, whether agent vs human review is required, and how re-attempts work. This area does NOT decide: which competencies exist (Arquiteto/Instructional Design), how lessons are authored (Núcleo 01/Content Production), how the UI presents submission (UI UX/Lesson Experience), or how the database stores tables (Database/Schema Extensions). Assessment Engine is a consumer of the competency catalog and a producer of rubrics, assessments, attempts and promotion events.

## 2. Required pre-reading

- Charter: `automatiklabs/docs/educational-system/CHARTER.md` — **Part II §2.1** (Bloom, CBE, Kirkpatrick, Cognitive Load), **Part III §3.3** (Cubo 3D — personalization axes), **Part IV §4.2** (competencies as first-class), **Part IV §4.4** (pedagogical_reviews), **Part IV §4.5** (workers Python locais).
- Skill: `automatiklabs-doctrine` — load before any task in this area. It is thin; the Charter is the source of truth it points to.
- Sibling context docs (read when cross-cutting):
  - `instructional-design-context.md` — for competency catalog schema and Bloom calibration decisions
  - `schema-extensions-context.md` — for canonical table names, migration order, and RLS patterns
  - `pedagogical-workflow-context.md` — for publish gates, advisory locks, and the `fn_promote_competency()` interface
  - `content-production-context.md` — for the `evidence_expected` YAML block in lesson front matter (co-authored with this area)
  - `pedagogical-qa-context.md` — for the drift detector and inter-rater calibration that audit this area

## 3. Operating principles

- **Competency is the unit of progress, not the lesson.** Writes go to `user_competency_progress`, never to `lesson_completions`. Telemetry of lesson watching is ignored by the promotion logic.
- **Bloom level determines the assessment shape, not the author's preference.** Bloom 1–3 may use `quiz_auto`. Bloom 4 requires `rubric_artifact` with `reviewer_type='agent'` allowed. Bloom 5–6 require `reviewer_type='human'` — enforced as CHECK constraint, not app-layer validation.
- **Competency is constant, assessment is variant.** A single `competency_id` may have N `assessment_id`s (one per relevant Cubo 3D cell) but all variants certify the same underlying capability. Variants recalibrate difficulty framing, not threshold.
- **Passing threshold travels with the competency, not with the variant.** Easy-mode by persona is forbidden by audit; the Zerado variant cannot have a lower `passing_threshold` than the Autodidata variant of the same competency.
- **Agent vs human review is split by dimension, not by attempt.** For Bloom 5–6 rubrics, agent grades auto-checkable dimensions (Funcionamento, Robustez), human grades semantic dimensions (Decisão, Reflexão). Agent alone can never promote a competency at Bloom ≥5.
- **Re-attempts require reflection.** An attempt whose `previous_attempt_id` is non-null must have a non-empty `reflection_md` on the prior attempt. Bloom 5–6 attempts have a 24h cooldown between retries; Bloom 1–3 are instant.
- **Rejection requires structured feedback**, not a free-text comment. Every rejected attempt must have at least one `rubric_scores` row with `score` below the criterion's passing level and a `comment_md` on that row.
- **Workers run locally via Claude Code Bash tool** (Charter §4.5). No external infra. No queues. Agent reviewer is a skill invoked synchronously when an attempt is submitted.
- **Negociação Bloom 6 (3 Cs) is not rubric-evaluable.** It is gated by `revenue_milestones` (co-owned with Arquiteto), not by this engine. Do not try to write a rubric for "closed a real deal" — it is a factual event, not an artifact score.
- **Cost discipline:** every agent-reviewer invocation has a token budget (4k input / 1k output default). Rubrics are cached by `competency_id`. No LLM call without a `competency_id` scoped cache key.

## 4. Key data structures / interfaces

### Tables (proposed; final names live in `schema-extensions-context.md`)

```sql
-- Assessment definitions (one per Cubo 3D cell that needs a distinct variant)
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  lesson_id UUID NULL REFERENCES lessons(id),           -- NULL = module/track-level
  type TEXT NOT NULL CHECK (type IN
    ('quiz_auto','rubric_artifact','peer_review','agent_review','live_demo')),
  bloom_target SMALLINT NOT NULL CHECK (bloom_target BETWEEN 1 AND 6),
  persona_variant TEXT[] DEFAULT '{}',
  stage_target SMALLINT,
  layer_target TEXT CHECK (layer_target IN ('tecnica','logica','maestria')),
  rubric_id UUID REFERENCES rubrics(id),
  passing_threshold NUMERIC(5,2) NOT NULL,
  reviewer_type_required TEXT NOT NULL
    CHECK (reviewer_type_required IN ('agent','human','both')),
  -- Doctrine gate: Bloom 5-6 cannot be quiz_auto, cannot be agent-only
  CHECK (NOT (bloom_target >= 5 AND type = 'quiz_auto')),
  CHECK (NOT (bloom_target >= 5 AND reviewer_type_required = 'agent'))
);

CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  bloom_target SMALLINT NOT NULL,
  template TEXT NOT NULL,                                -- e.g. 'bloom-6-create-v1'
  dimensions JSONB NOT NULL,                             -- see shape below
  passing_threshold NUMERIC(5,2) NOT NULL
);

CREATE TABLE public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  previous_attempt_id UUID REFERENCES assessment_attempts(id),
  reflection_md TEXT,                                    -- required if previous_attempt_id not null
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_submission_id UUID REFERENCES user_exercise_submissions(id),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','in_review','passed','failed','revise')),
  final_score NUMERIC(5,2),
  CHECK (previous_attempt_id IS NULL OR reflection_md IS NOT NULL)
);

CREATE TABLE public.rubric_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL,                            -- e.g. 'D1', 'F1'
  score NUMERIC(5,2) NOT NULL,
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('agent','human')),
  reviewer_id UUID,
  agent_slug TEXT,
  comment_md TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Rubric JSONB shape (dimensions field)

```yaml
dimensions:
  - name: "Funcionamento"
    weight: 30
    grader: agent            # or 'human'
    criteria:
      - id: F1
        check: "<executable check>"
        levels:
          - {score: 0,   label: "..."}
          - {score: 50,  label: "..."}
          - {score: 100, label: "..."}
  # repeat for Decisão, Robustez, Reflexão
```

### Bloom 6 rubric template (canonical, 4 dimensions)

Every Bloom 6 rubric MUST have exactly these 4 dimensions: **Funcionamento** (30%, agent), **Decisão** (35%, human), **Robustez** (20%, agent), **Reflexão** (15%, human). Bloom 5 swaps the weights: Funcionamento 20, Decisão 45, Robustez 20, Reflexão 15.

### Promotion interface (called from Backend Dev's workflow)

```sql
-- Only path to write user_competency_progress.status
fn_promote_competency(
  p_user_id UUID,
  p_competency_id UUID,
  p_attempt_id UUID,
  p_reviewer_id UUID
) RETURNS VOID;
-- Validates: attempt exists, attempt.status='passed',
--            attempt.final_score >= assessments.passing_threshold,
--            Bloom ≥5 → has human rubric_scores row,
--            reviewer_id authorized.
-- Writes: user_competency_progress.evidence_submission_id,
--         bloom_demonstrated, approved_by, approved_at.
```

## 5. Decision protocols

1. **"What assessment type for this competency?"** → look at `competency.bloom_level`. 1–3: `quiz_auto` allowed. 4: `rubric_artifact` with agent reviewer allowed. 5–6: `rubric_artifact` with human reviewer required. Never negotiate.
2. **"The author declared Bloom 5 but the content looks like Bloom 3."** → generate the rubric against the *declared* level, but flag the assessment for drift detection. Do not silently downgrade. Arquiteto + QA own the recalibration conversation.
3. **"Multiple personas need to assess the same competency."** → create N `assessments` rows, one per `(persona, stage, layer)` cell that has real demand. All point to the same `competency_id` and the same `passing_threshold`. Variants may differ only in prompt framing and scaffolding, not in the rubric's passing bar.
4. **"Student wants to re-attempt a failed rubric."** → enforce the `reflection_md` CHECK. If Bloom ≥5 and `now() - last_attempt < 24h`, reject with cooldown message. Never auto-reset status after N days — require explicit student action (retake button).
5. **"Agent reviewer and human reviewer disagree on a criterion."** → human wins. Record both in `rubric_scores` with distinct `reviewer_type`; `final_score` uses the human values for overlapping criteria. Record the discrepancy for QA's drift detector.
6. **"Competency involves closing a real deal / real revenue."** → do NOT generate a rubric. Route to `revenue_milestones` (co-owned with Arquiteto). Rubric-based engine is for artifacts; revenue is factual attestation.

## 6. Hand-offs

- **From Instructional Design (Arquiteto):** canonical `competencies` YAML in `docs/educational-system/competencies/v1.yaml` with `slug`, `bloom_level`, `framework`, `performance_task {intent, deliverable_kind, constraints, success_signal}`, `anti_patterns`, `evidence_kinds_accepted`, `reviewer_type_required`. Entries with `bloom_level >= 5` must pass this area's PR review before merge.
- **From Content Production (Núcleo 01):** lesson front matter containing the `evidence_expected: {competency_id, type, format, prompt, rubric_template_slug}` YAML block, one block per competency the lesson certifies. Co-authored schema; breaking changes require joint PR.
- **From Schema Extensions (Database):** the tables in §4, idempotent migrations, RLS policies, and the `fn_promote_competency()` function signature.
- **From Pedagogical Workflow (Backend Dev):** `pg_advisory_xact_lock(hashtext('attempt:' || attempt_id))` wrapping any agent-reviewer run; REVOKE UPDATE on `user_competency_progress.status` so only `fn_promote_competency` writes.
- **From Pedagogical QA:** the `pedagogical-drift-detector` runs weekly against this area's outputs. Provide it read access to `assessment_attempts`, `rubric_scores`, and approval-rate-by-persona views.
- **To Lesson Experience (UI UX):** the rubric JSONB shape must be renderable pre-submit (student sees criteria before submitting). Provide a `GET /assessments/:id/rubric` endpoint that returns dimensions + criteria + levels.
- **To Backend Dev:** the `fn_promote_competency` call contract, and the `competency.acquired` domain event emitted after promotion.
- **To Pedagogical QA:** every `rubric_scores` row is queryable by criterion for drift analysis. Expose `v_criterion_failure_rate` view.
- **To Arquiteto:** the reverse gate — entries with `bloom_level >= 5` missing `performance_task` are rejected in PR review of the catalog.

## 7. Anti-patterns

- **Writing `user_competency_progress` directly.** Always go through `fn_promote_competency`. Direct writes bypass the Bloom≥5 human-reviewer check.
- **Using `quiz_auto` for Bloom 4+ because it is cheaper.** CHECK constraint rejects it; do not try to find a workaround.
- **Writing a "Zerado" variant with a lower `passing_threshold` than the canonical.** This is the easy-mode trap — it certifies students who cannot actually do the thing, breaking Kirkpatrick L4 silently.
- **Letting the agent reviewer grade Decisão or Reflexão dimensions alone at Bloom ≥5.** Those are semantic; agents drift; QA will flag.
- **Length-based feedback validation (`len(comment_md) > 50`).** Use structured rubric_scores rows instead. Length is gameable.
- **Creating a rubric for Negociação Bloom 6 (closing a sale).** Use `revenue_milestones`. A rubric here is a lie.
- **Ignoring `previous_attempt_id` + `reflection_md` on retries.** Enables gaming via brute-force resubmission.
- **Calling an LLM without a `competency_id` cache key.** Cost explodes linearly with students, not with content.

## 8. Verification checklist

- [ ] Every assessment created has `competency_id`, `bloom_target`, `passing_threshold`, `reviewer_type_required` populated.
- [ ] No `assessments` row exists where `bloom_target >= 5 AND type='quiz_auto'`.
- [ ] No `assessments` row exists where `bloom_target >= 5 AND reviewer_type_required='agent'`.
- [ ] Every Bloom 6 rubric has exactly the 4 canonical dimensions with the canonical weights.
- [ ] Every retry attempt has non-null `previous_attempt_id` AND non-null `reflection_md` on the previous attempt.
- [ ] Every rejected attempt has at least one `rubric_scores` row below passing with a `comment_md`.
- [ ] `fn_promote_competency` is the only path that writes `user_competency_progress.status`. REVOKE UPDATE is in place.
- [ ] Agent reviewer respects token budget (4k in / 1k out); logs `cost_tokens` per invocation.
- [ ] Rubric is cached by `competency_id` and served pre-submit via `GET /assessments/:id/rubric`.
- [ ] Every new competency in the catalog with `bloom_level >= 5` has `performance_task` fully populated.

## 9. Open questions / known limitations

- **Originality / plagiarism detection.** Not implemented. Two students submitting the same copied JSON will both pass. Mitigation: `text_reflection` forces personal articulation; human reviewer may escalate to live demo. No corpus similarity search in Fase 1.
- **Inter-rater calibration cadence.** Decisão and Reflexão dimensions are semantic; two humans may disagree. QA Review owns the calibration audit but the cadence is not yet set. Default assumption: sample 10 of every 50 approvals.
- **Revenue milestones schema.** Co-owned with Arquiteto; not yet designed. Blocks Bloom 6 of Negociação (3 Cs). Track as dependency, do not inline it into this area.
- **Token cost projection at scale.** Estimated at 1000 users × 50 competencies × 1.3 attempts = 65k agent-reviewer runs. Actual cost depends on rubric complexity and caching hit rate; needs measurement after first trilha ships.
- **Live demo type (`live_demo`).** Enum value exists but execution flow (scheduling, recording, reviewer assignment) is deferred to Fase 2. Do not create assessments of this type in Fase 1.
- **Cubo 3D variant production volume.** Fase 1 entregable per Arquiteto R2: 1 célula only (Estágio 2, Organizado, Lógica). Do not generate all 27–54 assessment variants upfront. Generate on demand when a new cell is opened.

**DONE.**
