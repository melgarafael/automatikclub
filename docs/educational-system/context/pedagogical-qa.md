# Context — Pedagogical QA

## 1. What this area owns

Pedagogical QA owns the **quality gate for every lesson and track in the AutomatikLabs Educational System**: the `pedagogical-gate-rubric` (8 hard-fail criteria), the `pedagogical-drift-detector` (weekly audit worker), the inter-rater calibration protocol between agent and human reviewers, and the escalation triggers that fire when calibration degrades or backlogs accumulate.

Concretely: the JSON schema for `pedagogical_reviews.criterion_results`, the criterion slugs that `fn_validate_lesson_doctrine` enforces, the `review_audits` table that tracks human↔agent agreement, and the `v_lesson_doctrine_status` view that makes doctrine health visible to the Master Maestro.

This area does NOT own: the pedagogical doctrine itself (the Charter + Instructional Design), the SQL tables and migrations (Schema Extensions), the state machine transitions (Pedagogical Workflow), the lesson content (Content Production), or the rubric construction for specific competencies (Assessment Engine). The boundary: Pedagogical QA defines WHAT passes and HOW to audit compliance; others build and run the gates.

---

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Part II §2.1 (all 6 frameworks — each generates at least one gate criterion), Part IV §4.4 (pedagogical_reviews table and review gate design), Part VIII (canonical vocabulary — vocabulary violations are tracked here).
- **Skill:** `automatiklabs-doctrine` — load before any task. Also load `e2e-product-qa` for E2E test work.
- **Sibling context docs:**
  - `instructional-design.md` — for competency catalog, Bloom definitions, and the `competency-acceptance-criteria.md` that defines what "competency demonstrated" means.
  - `schema-extensions.md` — for `pedagogical_reviews` table shape, `review_audits` table, `criterion_results` jsonb schema.
  - `pedagogical-workflow.md` — for `fn_validate_lesson_doctrine`, `record_review_decision`, escalation functions.
  - `content-production.md` — for `lesson-validator` mirror (Content Production mirrors QA's 8 hard-fail criteria locally).
  - `assessment-engine.md` — for the "avaliabilidade" criterion inside QA's rubric.

---

## 3. Operating principles

1. **Gate on structure, never on style.** The 8 hard-fail criteria are about Bloom calibration, CBE evidence, Kolb structure, and cognitive load. Tone, vocabulary choice (except canonical terms), narrative style, humor, and formatting are never gate criteria. A lesson passes or fails on pedagogy, not aesthetics.
2. **8 hard-fail criteria, not 200.** Value is in consistent application, not granularity. Every criterion must be automated or semi-automated. If QA cannot decide a criterion without reading the full lesson as a human, it is not a hard-fail criterion — it is a soft suggestion at most.
3. **`fn_validate_lesson_doctrine` runs before the review queue.** The function filters ~60% of lessons before they reach the human reviewer. QA only touches what passes automated checks but still requires judgment.
4. **Bloom ≥ 5 = human review always.** No exceptions. Marking Bloom 5 creates mandatory human review friction by design — this is the inverse incentive that discourages Bloom inflation. The CHECK constraint in `pedagogical_reviews` encodes this.
5. **Drift detection is a weekly KPI.** The `pedagogical-drift-detector` worker runs weekly: re-runs the rubric on 5% of published lessons, computes `agent_human_agreement_rate` per agent skill slug, and checks approval-rate-by-persona vs. real revenue outcomes. If QA does not audit itself, it degrades silently.
6. **Disagreement resolution: rejection always wins.** Agent approves → human rejects: rejection wins. Two humans disagree: escalate to `pedagogical_admin`. No majority vote. No auto-approve. The most conservative decision always prevails until a human with more authority overrides it.
7. **Parallel reviews, not sequential.** `reviewer_role='pedagogy'` and `reviewer_role='ux'` reviews run in parallel, both required, in separate rows of `pedagogical_reviews`. Sequential review doubles backlog.
8. **"Avaliabilidade" is a criterion inside QA's rubric, not a separate review.** Assessment Engine writes this criterion; QA applies it as part of the standard rubric. This keeps the number of mandatory reviewers at one (QA), with escalation to Assessment Engine when ambiguous.
9. **Transparency is non-negotiable.** The rubric is fully public (8 criteria in a YAML file). Any rejection must cite a criterion slug. Authors are never surprised. "Ficou estranho" is not a valid rejection reason.
10. **SLA with escalation, never SLA with auto-approve.** QA Review has a 4h SLA for Bloom 3–4, 72h for Bloom 5–6. Timeout triggers escalation to `pedagogical_admin`, never automatic approval.

---

## 4. Key data structures / interfaces

### 4.1 The 8 hard-fail criteria (rubric)

Stored as `automatiklabs/docs/educational-system/curriculum/pedagogical-gate-rubric.yaml` (QA owns, Instructional Design co-reviews, version-controlled). Content Production mirrors these in their local `lesson-validator`.

```yaml
criteria:
  - slug: bloom-target-present
    description: "bloom_target is present, non-null, and in [1..6]"
    automated: true
    charter_ref: "§2.1 Bloom Taxonomy"

  - slug: competencies-taught-present
    description: "competencies_taught is non-empty in lesson frontmatter"
    automated: true
    charter_ref: "§4.2 Competency as first-class"

  - slug: evidence-type-bloom-match
    description: "evidence_expected.type != 'quiz' when bloom_target >= 4"
    automated: true
    charter_ref: "§2.1 CBE — evidence must be verifiable artifact at Bloom 4+"

  - slug: bloom5-requires-human-flag
    description: "bloom_target >= 5 has requires_human_review=true OR reviewer_type='human'"
    automated: true
    charter_ref: "§4.4 human review required for Bloom 5–6"

  - slug: bloom-assessed-divergence
    description: "bloom_assessed_by_validator diverges <= 1 level from bloom_target"
    automated: true
    charter_ref: "§2.1 Bloom calibration — inflation detection"

  - slug: cognitive-load-single-concept
    description: "new_concepts_max <= 1 in lesson frontmatter"
    automated: true
    charter_ref: "§2.1 Cognitive Load Theory — Sweller"

  - slug: variant-spine-traceable
    description: "derived variants have parent_spine_id set and traceable"
    automated: true
    charter_ref: "§4.1 variant as wrapper not rewrite"

  - slug: kolb-phase-declared
    description: "at least one Kolb phase is named in frontmatter (kolb_phase) OR as a markdown heading"
    automated: semi  # checks frontmatter automatically; heading detection requires regex
    charter_ref: "§2.1 Kolb Experiential Cycle"
```

### 4.2 Soft suggestions (advisory, not blocking)

These appear in `pedagogical_reviews.criterion_results` with `status='advisory'` and never block publication:
- Variant Zerado has fewer than 2 concrete analogies.
- A section exceeds 800 words without a Kolb checkpoint.
- Vocabulary canonical terms (Charter Part VIII) are missing from the lesson.
- CTA narrative does not align with `evidence_expected`.

### 4.3 `review_audits` table (Schema Extensions creates, QA writes)

```sql
CREATE TABLE public.review_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES pedagogical_reviews(id),
  audited_by UUID NOT NULL REFERENCES user_profiles(id),
  agreed BOOLEAN NOT NULL,
  delta_notes TEXT,
  audited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

QA's `pedagogical-drift-detector` worker samples 10 of every 50 approved lessons, sends to a senior human, records agreement. If `agreed < 80%` over 30 days, QA flags itself as miscalibrated.

### 4.4 Key views consumed

- `v_lesson_doctrine_status` (Schema Extensions) — per-lesson doctrine health snapshot.
- `v_overdue_reviews` (Schema Extensions / Pedagogical Workflow) — reviews past their SLA.
- `v_criterion_failure_rate` (Assessment Engine) — `rubric_scores` failure rates per criterion.
- `pedagogical_reviews` with `bloom_target` vs `bloom_assessed` discrepancy column — drift signal.

### 4.5 `pedagogical-drift-detector` worker interface

```python
# runs weekly via Bash tool (Charter §4.5 — workers run locally)
# inputs: read access to pedagogical_reviews, assessment_attempts, rubric_scores
# outputs: INSERT into review_audits; UPDATE agent_reviewers.is_active if agreement < 0.80
# escalates: domain_events row if drift detected
```

---

## 5. Decision protocols

1. **Hard-fail triggered — what happens?** `fn_validate_lesson_doctrine` returns a failing criterion slug. The lesson enters `needs_fix` state (not `needs_revision` — author must fix before the review queue is entered). Content Production's `lesson-validator` should have caught this first; if it didn't, flag it as a gap in their local validator.
2. **Bloom divergence of more than 1 level detected (author declared 5, validator assessed 3) — what happens?** The transition `pending → approved` is blocked. The review enters `calibration_dispute` state. A second human reviewer is triggered automatically (via `record_review_decision` in Pedagogical Workflow). QA does not re-label to match the author; the divergence is recorded and the rubric runs against the declared level.
3. **Agent approves; QA (human) rejects — who wins?** Rejection wins. The agent approval row stays as historical record. The discrepancy feeds `agent_human_agreement_rate`. If that rate falls below 80% for 30 days for that agent slug, the agent is deactivated pending recalibration.
4. **Lesson is in its 3rd `needs_revision` cycle — what happens?** After the 3rd cycle without approval, `escalate_review()` is called. The lesson enters `escalated` state with a summary of all rejection reasons. `pedagogical_admin` decides: re-scope, kill, or override. QA does not make this decision.
5. **Drift detector finds a published lesson that now fails hard-fail criteria — what happens?** Escalation immediate. No auto-depublish. `domain_events` row with `event_type='lesson.drift_detected'`. `pedagogical_admin` handles with 72h SLA.

---

## 6. Hand-offs

- **From Instructional Design:** `competency-acceptance-criteria.md` v1 — defines what "competency demonstrated" means at each Bloom level. QA applies these definitions in the "avaliabilidade" criterion. This document is a blocking dependency before Content Production generates the first lesson.
- **From Schema Extensions:** `pedagogical_reviews` table with `criterion_results JSONB`, `bloom_assessed SMALLINT`, `review_round SMALLINT`; `review_audits` table; `v_lesson_doctrine_status` view.
- **From Pedagogical Workflow:** `record_review_decision` function (QA calls this to write review decisions); `fn_validate_lesson_doctrine` (QA defines the criteria it checks); `escalate_review` function.
- **From Content Production:** `bloom_assessed_by_validator` field in lesson frontmatter — this is the pre-submission self-assessment that feeds criterion #5 (bloom divergence check).
- **To Schema Extensions:** JSON Schema for `pedagogical_reviews.criterion_results` (QA defines, Schema Extensions enforces as CHECK constraint) + list of criterion slugs.
- **To Pedagogical Workflow:** the 8 criterion slugs and their automated-check logic that `fn_validate_lesson_doctrine` must implement.
- **To Content Production:** `pedagogical-gate-rubric.yaml` (the same 8 criteria they mirror in `lesson-validator`). Any change to the rubric requires a PR that updates both.
- **To Assessment Engine:** the "avaliabilidade" criterion spec (Assessment Engine writes it, QA applies it). Breaking changes require joint PR.

---

## 7. Anti-patterns

- **Gate on style, tone, or narrative choice.** If a rejection cannot be mapped to one of the 8 criterion slugs, it is not a valid rejection. Discipline: if it cannot be written down as a criterion, it does not exist.
- **Sequential review (QA after Lesson Experience).** Double backlog with no gain. QA and Lesson Experience run in parallel in separate `pedagogical_reviews` rows.
- **Auto-approve on timeout.** Ever. Under any circumstances. The clock escalates, never approves.
- **Using QA authority to adjudicate content disputes between professors.** QA is a gate, not a judge. "n8n is better than Make" is a product decision, not a pedagogical one. Escalate conflicts to Master Maestro.
- **Allowing drift detector to run without a sample of published lessons.** If `pedagogical-drift-detector` only runs on new submissions, the system approves well at day 1 and degrades silently. Weekly re-audit of published content is non-optional.
- **Treating "avaliabilidade" as a separate mandatory review from Núcleo 02.** Three mandatory human reviewers = backlog death. The criterion is inside QA's rubric; Assessment Engine is only escalated when QA flags ambiguity.
- **Calibration without the audit table.** If `review_audits` rows are not being written, the `agent_human_agreement_rate` metric is blind. Rate = 100% on empty data = false confidence.
- **Rejecting lessons on behalf of other reviewers' concerns.** QA only covers pedagogical structure. If Lesson Experience has a UX concern, that is `reviewer_role='ux'`, a different row.

---

## 8. Verification checklist

- [ ] `pedagogical-gate-rubric.yaml` is published and all 8 criteria have `slug`, `description`, `automated`, `charter_ref`.
- [ ] `fn_validate_lesson_doctrine` is updated to check all 8 criteria (or the latest version of the rubric).
- [ ] `pedagogical_reviews.criterion_results` JSON Schema version matches `criterion_schema_version` in QA's rubric.
- [ ] Content Production's `lesson-validator` mirrors exactly the same 8 criteria (check by diff of criterion slugs).
- [ ] `pedagogical-drift-detector` worker runs are logged; last run timestamp visible to Master Maestro.
- [ ] `review_audits` table has at least one row after every 50 lesson approvals.
- [ ] `agent_human_agreement_rate` per agent slug is queryable from `review_audits`.
- [ ] No lesson with `bloom_target >= 5` was approved without a `reviewer_type='human'` row in `pedagogical_reviews`.
- [ ] No rejection exists in `pedagogical_reviews` without a criterion slug in `criterion_results`.
- [ ] Any criterion change in `pedagogical-gate-rubric.yaml` has a corresponding PR updating Content Production's `lesson-validator` and `fn_validate_lesson_doctrine`.

---

## 9. Open questions / known limitations

- **`competency-acceptance-criteria.md` v1** — Instructional Design owes this document as a blocking dependency before lesson generation begins. Until it exists, the "avaliabilidade" criterion (hard-fail #3 edge case for Bloom 4) is enforced by approximation.
- **Drift detector threshold (80% inter-rater agreement)** is a starting estimate. After 6 months of real data, this threshold should be recalibrated based on actual distribution.
- **Kirkpatrick Level 4 verification.** Charter §1.2 defines real revenue as the success metric. Nobody has defined HOW to verify "renda real" — honor system, contract upload, payment integration? Until this is decided, Kirkpatrick L4 is a declared goal without an evidence gate. This is QA's blind spot for the entire system.
- **`formation_completion` view.** Kirkpatrick L3/L4 measurement requires aggregating tracks by `formation_tag`. The view is proposed but not yet in any migration.
- **Competency versions and history.** If a competency's `bloom_level` is raised after some students have already demonstrated it, those students' history should still count. `competency_versions` table is proposed in rounds 2/3 but not yet in any migration. QA's drift detector needs to be updated when this ships.
- **QA terminal capacity.** Blast radius of a QA bottleneck is system-wide. If only one human is reviewing Bloom 5–6 lessons, a vacation kills the pipeline. Capacity planning for the human review queue is not yet defined.
