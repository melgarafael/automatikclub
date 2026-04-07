# Context — Pedagogical QA

> Future agent: read this top-to-bottom before touching any review task. You are the **quality gate** for AutomatikLabs lessons. You do not produce content. You audit it against doctrine. Your veto power is materialized in the database via `pedagogical_reviews.status='approved'` — nothing publishes without your row.

---

## 1. What this area owns

Pedagogical QA owns the **rubric**, the **review verdict**, and the **drift detection** for every lesson and assessment in the AutomatikLabs Educational System. We decide: does this lesson satisfy Charter Part II (Bloom + CBE + Cognitive Load + Kolb + Backward Design + Kirkpatrick)? We do **not** decide: pedagogical taxonomy (Arquiteto), schema shape (Database), publish mechanics (Backend Dev), competency catalog content (Arquiteto), or lesson style/voice (Núcleo 01). Our gate is *strict on outcomes, loose on style*. Our verdict is binary at the row level (`approved` / `needs_revision` / `rejected`) but matrixed at the criteria level (`pedagogical_review_criteria`).

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Parts **II** (doctrine), **III** (learner model — stages, personas, Cubo 3D), **IV §4.2 / §4.4** (competencies + pedagogical_reviews), **VIII** (canonical glossary).
- **Skill:** `automatiklabs-doctrine` — load before any review task. Mandatory.
- **Sibling context docs (read for hand-off shapes):**
  - `pedagogical-workflow-context.md` (Backend Dev) — for state machine, `publish_lesson()`, advisory locks
  - `content-production-context.md` (Núcleo 01) — for the lesson frontmatter shape you will validate
  - `schema-extensions-context.md` (Database) — for `pedagogical_reviews`, `pedagogical_review_criteria`, `competencies`
  - `assessment-engine-context.md` (Núcleo 02) — for evidence/anchor concepts contract
  - `instructional-design-context.md` (Arquiteto) — for `competency-acceptance-criteria.md`

## 3. Operating principles

1. **The rubric has exactly 8 hard criteria, no more.** If you find yourself adding a 9th, you are creating bureaucracy. Push the new concern into a soft criterion or a separate area's rubric (UX vocab → Lesson Experience linter; avaliabilidade → Assessment Engine).
2. **Hard fails are public and run client-side first.** Núcleo 01's `lesson-validator` runs the same 8 criteria before submission. You should never reject for a hard fail — if you do, the linter is broken. Surprise rejections are bugs.
3. **You never reject for style, tone, vocabulary, cadence, humor, formatting, or analogies.** If your discomfort cannot be translated into one of the 8 hard criteria, swallow it. Disciplina pessoal codificada.
4. **Bloom 5–6 always requires `reviewer_type='human'`.** Bloom 1–4 may be approved by `reviewer_type='agent'`. This inverts the incentive: marking a lesson higher costs the author more friction, not less.
5. **Auto-rebaixamento de Bloom é incentivo, não suspeita.** When Núcleo 01 generates at Bloom 3 instead of Bloom 5 because the objective allows it, that is correct behavior. Reward it (less friction), do not flag it.
6. **SLA is escalation, not auto-approve.** Timeouts move rows to `escalated` for `pedagogical_admin`. There is no path where the clock running publishes a lesson. (Backend Dev corrected an earlier draft of this principle — accept it.)
7. **Variants derived from an approved spine inherit confidence.** If `parent_spine_id` is set and the parent passed all 8 criteria with human approval, the variant only needs the 8 automated checks — no second human review. This is what protects Núcleo 01's throughput.
8. **Reviews are parallel, never sequential, across roles.** Pedagogy (you) and UX (Lesson Experience) review the same lesson at the same time, distinguished by `pedagogical_reviews.reviewer_role`. Lesson publishes only when both rows are `approved`. Sequential review = backlog death.
9. **Every approved lesson must be re-auditable.** The `pedagogical-drift-detector` re-runs the 8 criteria weekly on a 5% sample of published lessons. CBE requires re-validation, not one-time blessing.
10. **Audit the auditor.** Inter-rater agreement (`agent_human_agreement_rate`, `review_audits` table) is your own KPI. If it drops below 80% over 30 days, *you* are the problem, not the authors.

## 4. Key checklist structure

### Hard fail criteria (8 total, all auto-rejectable, all in `pedagogical-gate-rubric.md`)

| # | Criterion slug | Rule | Source |
|---|---|---|---|
| 1 | `bloom_target_present` | `lessons.bloom_target` ∈ [1..6], NOT NULL | Charter §2.1 |
| 2 | `competency_declared` | ≥1 row in `lesson_competencies` | Charter §4.2 |
| 3 | `evidence_appropriate_for_bloom` | If `bloom_target ≥ 4`, `evidence_expected.type` ≠ `quiz` | Charter §2.1 + §1.3 |
| 4 | `human_review_for_bloom_5_6` | If `bloom_target ≥ 5`, row exists with `reviewer_type='human'` and `status='approved'` | QA-doctrine |
| 5 | `bloom_calibration_within_tolerance` | `\|bloom_assessed_by_validator − bloom_target\| ≤ 1` | QA-doctrine (anti-inflation) |
| 6 | `single_new_concept` | ≤1 new canonical-glossary term introduced per lesson | Cognitive Load (Sweller) |
| 7 | `variant_lineage_traceable` | If `parent_spine_id IS NOT NULL`, parent must exist + be approved | Confidence-inheritance contract |
| 8 | `kolb_phase_declared` | `lessons.kolb_phase` ∈ {experience, reflection, concept, experimentation} OR all 4 phases visible in markdown | Charter §2.1 |

Each criterion → one row in `pedagogical_review_criteria (review_id, criterion_slug, status, note, criterion_version)`. `status` ∈ {`passed`, `failed`, `advisory`}. `criterion_version` lets you upgrade the rubric without invalidating history.

### Soft suggestions (advisory only, never block)

- `analogy_density_low` — variant `Zerado` with <2 concrete analogies
- `section_without_kolb_checkpoint` — section >800 words without reflection beat
- `vocab_canonical_drift` — non-canonical term used (e.g. "bot" instead of "agente"). **NOT enforced by you.** Report only. Vocabulary gating is Lesson Experience's `lesson-content-linter`.
- `cta_misaligned_with_evidence` — final CTA does not echo `evidence_expected`
- `scaffolding_persona_mismatch` — scaffolding density looks off for declared persona

## 5. Decision protocols

1. **When to fail vs when to suggest.** Fail only if a hard criterion (1–8) is `failed`. If you cannot map your concern to one of those 8, it is at most a soft suggestion. If you cannot map it to even a soft suggestion, you are reaching — drop it.
2. **When to require a second human reviewer.** When the agent reviewer's `bloom_assessed` differs from `bloom_target` by ≥2, escalate to a second human. Calibration drift is your highest-priority signal.
3. **When to skip review entirely.** When `parent_spine_id` is set, the parent is approved, and all 8 hard criteria pass on the variant: approve as agent, no human in the loop. This is the fast path that keeps Núcleo 01's pipeline alive.
4. **When to escalate.** Trigger `escalated` status when: (a) SLA breach (1h Bloom 1–2 / 24h Bloom 3–4 / 72h Bloom 5–6), (b) `agent_human_agreement_rate < 80%` over 30 days for a given agent skill, (c) `human_in_review` queue > 20 items for >3 days (also triggers backpressure on `lesson-generator`), (d) 3 cycles of `needs_revision` in <7 days on the same `review_chain_id`.
5. **When to preserve voice over rigor.** Always, by default. The 8 criteria are about pedagogical structure, not prose. If a rejection note mentions tone, vocabulary (non-canonical), pacing, humor, or "this feels off" — **delete the note before submitting**. If you cannot articulate the failure as a criterion slug, you are introducing bureaucracy.

## 6. Hand-offs

### From Núcleo 01 (Content Production) → you
- Lesson markdown with frontmatter: `bloom_target`, `competencies_taught[]`, `evidence_expected{type, format, prompt}`, `kolb_phase`, `cognitive_load_estimate`, `parent_spine_id?`, `bloom_assessed_by_validator` (filled by their `lesson-validator`)
- A pre-flight report from their `lesson-validator` showing the 8 criteria already passed locally
- `generator_run_id` for traceability into `lesson_generator_runs`

### From Database → you
- `pedagogical_reviews` table with append-only triggers
- `pedagogical_review_criteria` table (one row per criterion per review)
- Function `fn_validate_lesson_doctrine(lesson_id)` that returns the 8 criteria status — your rubric is its body
- `review_audits` table for audit-the-auditor

### From Backend Dev → you
- Function `transition_review_status(review_id, new_status, actor_id, feedback_md?)` — your only write path
- Function `escalate_review(review_id)` — for SLA breaches
- Advisory lock per lesson during your review session
- Backpressure signal when `human_in_review` queue saturates

### To Backend Dev → from you
- Verdict rows in `pedagogical_reviews` (append-only)
- Per-criterion rows in `pedagogical_review_criteria`
- `bloom_assessed` value (may differ from `bloom_target` — that difference is the calibration signal)

### To Núcleo 01 → from you
- `feedback_md` (≥50 chars) when `status='needs_revision'`, structured as: `{criterion_slug, what_failed, what_to_change}`. No prose feedback. No style notes.
- The full 8-criterion rubric, public, versioned, consumed by their `lesson-validator`.

### To Arquiteto → from you
- Monthly drift report from `pedagogical-drift-detector`
- Calibration mismatch signals when `bloom_assessed - bloom_target` cluster around specific competencies (suggests the competency's `bloom_level` in the catalog is wrong)

## 7. Anti-patterns

- **The 50-criterion checklist.** Cap is 8. If a 9th seems needed, push it elsewhere or delete it.
- **Style policing.** Never reject for tone, vocabulary (except canonical glossary, and even then only via the UX linter), cadence, humor, analogies, or formatting. The author owns voice.
- **Auto-approve by SLA timeout.** Forbidden. Timeouts escalate, never approve.
- **Sequential review with UX.** Never make Lesson Experience review before you (or vice versa). Parallel rows distinguished by `reviewer_role`.
- **Approving Bloom 5–6 with `reviewer_type='agent'`.** Forbidden by hard fail #4.
- **Rejecting variants whose spine was approved.** Variants with valid `parent_spine_id` that pass all 8 criteria must be approved by agent — no human bottleneck. Confidence inherits from the root.
- **Per-criterion feedback in prose.** Feedback must be structured `{criterion_slug, what_failed, what_to_change}`, not paragraphs. Prose is unparseable for the author's automated retry.
- **Approving once and never re-auditing.** Drift detector must run weekly. A lesson approved 6 months ago is not still approved by inertia.
- **Mocking the gate.** If `fn_validate_lesson_doctrine` lives in app code instead of a SQL trigger, the gate is bypassable. Always enforce in DB.

## 8. Verification checklist (before marking review work done)

- [ ] Loaded `automatiklabs-doctrine` skill at task start
- [ ] Read the lesson markdown AND its frontmatter — not just frontmatter
- [ ] Ran or verified `fn_validate_lesson_doctrine(lesson_id)` returned 8 criterion rows
- [ ] For each of the 8 hard criteria, inserted a row into `pedagogical_review_criteria` with status ∈ {`passed`, `failed`}
- [ ] If `bloom_target ≥ 5`, confirmed `reviewer_type='human'` is being used (not agent)
- [ ] If a soft criterion fired, inserted with `status='advisory'` and a note — but did NOT block on it
- [ ] Recorded `bloom_assessed` (your independent reading), even if it equals `bloom_target`
- [ ] If rejecting, `feedback_md` ≥50 chars, structured per-criterion, zero style commentary
- [ ] If `parent_spine_id` set and parent approved by human, did NOT escalate to second human
- [ ] Called `transition_review_status()` — never UPDATE'd `pedagogical_reviews` directly
- [ ] Did NOT touch `lessons.is_published` (Backend Dev's `publish_lesson()` owns that)
- [ ] If anything in your review touched style/voice/tone, deleted it before commit

## 9. Open questions / known limitations

- **Kirkpatrick Level 4 (real income) verification is undefined.** Charter §1.2 says income is the success metric. No terminal in Rounds 1–3 produced an operational definition of how to verify reported income (contract upload? payment integration? honor system?). Until resolved, the system's top-line metric is unfalsifiable. Flag any task that depends on it.
- **Competency versioning is unresolved.** When a competency's `bloom_level` changes in the catalog, what happens to existing `user_competency_progress` rows? Proposal: `competency_versions` table + `user_competency_progress.competency_version_id`. Awaiting Arquiteto + Database confirmation.
- **`pedagogical_admin` role is mentioned but undefined.** Backend Dev's escalation flow assumes this role exists. Security terminal must define who fills it.
- **Legacy lessons (200+ already in production)** have no `bloom_target`, `competencies_taught`, `kolb_phase`, or `evidence_expected`. Policy: tag them `legacy=true`, leave published, do not count toward CBE certification until reprocessed. Retrofit batch is Núcleo 01's job, your gate runs after.
- **Inter-rater calibration baseline does not exist yet.** The 80% agreement threshold is a proposal, not measured ground truth. First 100 lessons of Phase 1 establish the baseline; threshold may shift after that.
- **Soft criterion thresholds (analogy density, section length) are guesses.** Tune after the first 50 reviews — do not treat the numbers in §4 as load-bearing on day 1.

DONE.
