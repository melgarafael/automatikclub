# Context — Pedagogical Workflow

> Self-contained brief for a future Claude executing tasks in the **Pedagogical Workflow** area (sub-epic 03, Backend Dev terminal) of the AutomatikLabs Educational System. Read sections 1-3 always; sections 4-9 as needed for the task.

---

## 1. What this area owns

The **gates and state transitions** that decide whether educational content can move from draft to published, and whether a student's competency progress can advance. Concretely:

- The function `publish_lesson(lesson_id, actor_id)` and the invariant that `lessons.is_published` is a *computed consequence*, never a writable column.
- The function `record_competency_transition(...)` and the append-only event log `user_competency_progress_events`.
- The function `record_review_decision(...)` and the append-only `pedagogical_reviews` table.
- The state machine of the review pipeline (`draft → doctrine_gate → agent_review → bloom_gate → human_review → publishable → published`, plus `needs_revision`, `rejected`, `escalated`).
- Backpressure logic on the review queue (`v_review_queue_health`, `create_lesson_variant` rejection on overflow).
- Escalation logic (`escalate_review`) — never auto-approve.
- Idempotency of domain events (dedupe_key contracts).

What it does **not** own: schema/migrations (Database), the rubric criteria themselves (QA Review), how lessons are generated (Núcleo 01), how assessments are graded (Núcleo 02), UI rendering (Lesson Experience).

---

## 2. Required pre-reading

1. `automatiklabs/docs/educational-system/CHARTER.md` — Parts II, III, and especially Part IV §4.2, §4.3, §4.4, §4.5.
2. `automatiklabs/supabase/migrations/00003_learning.sql` — current (pre-doctrine) schema. Note `auto_complete_lesson` trigger ~line 295: that trigger is the canonical anti-pattern this area exists to neutralize.
3. Round 1-3 brainstorm docs in `docs/educational-system/brainstorm/round-{1,2,3}/` for: `pedagogical-workflow.md`, `schema-extensions.md`, `pedagogical-qa.md`. Convergence points there are decisions, not opinions.
4. Skill `automatiklabs-doctrine` (auto-loaded when working dir is `automatiklabs/`).

---

## 3. Operating principles

1. **Doctrine must be enforceable in SQL, not in app code.** If a rule cannot be expressed as a CHECK constraint, append-only trigger, SECURITY DEFINER function, or unique index, it is not a rule — it is a hope.
2. **Publication is a consequence, never a cause.** No code path writes `is_published=true` directly. Only `publish_lesson()` may, and only after re-running every gate.
3. **Append-only at the boundary.** `pedagogical_reviews`, `user_competency_progress_events`, `user_journey_history`, `domain_events` reject UPDATE/DELETE via BEFORE trigger. State is reconstructed via aggregating views (`latest_per_reviewer`, etc.).
4. **Escalation, never auto-approve.** Timeouts, conflicts, and overflows always route *up* the authority ladder. The clock never grants permissions.
5. **Defense in depth.** REVOKE on the column + trigger on DML + SECURITY DEFINER function with a session GUC. Service_role must hit the trigger, not bypass it.
6. **One write path per protected table.** `record_*` / `publish_*` / `escalate_*` functions are the only callers with INSERT permission.
7. **Append-only competencies** (slug, bloom_level immutable). Doctrine evolution = new competency + deprecate, never rename.

---

## 4. Key data structures / state machine

### 4.1 Tables (owned/touched; created by Database via migrations 00012-00020)

```sql
-- 00016
pedagogical_reviews (
  id uuid PK, lesson_id uuid FK, review_round int NOT NULL,
  reviewer_type enum('agent','human'), reviewer_id uuid NULL,
  agent_slug text NULL, reviewer_role enum('ux','pedagogy','assessment'),
  status enum('pending','approved','rejected','needs_revision','escalated'),
  bloom_assessed smallint, criterion_results jsonb, schema_version smallint,
  feedback_md text, agreement_with_previous bool,
  created_at timestamptz DEFAULT now(),
  CHECK ((reviewer_type='human' AND reviewer_id IS NOT NULL)
      OR (reviewer_type='agent' AND agent_slug IS NOT NULL)),
  CHECK (status<>'rejected' OR length(feedback_md)>=50)
)
-- BEFORE UPDATE/DELETE → RAISE EXCEPTION

-- 00015
user_competency_progress_events (
  id uuid PK, user_id uuid, competency_id uuid, competency_version_id uuid,
  from_status text, to_status text,
  evidence_attempt_id uuid FK assessment_attempts,
  actor_id uuid, dedupe_key text NOT NULL,
  created_at timestamptz,
  UNIQUE (user_id, competency_id, dedupe_key)
)
-- partitioned by created_at monthly; append-only
-- VIEW v_user_competency_status aggregates latest event per (user, competency)

-- 00012
CREATE ROLE pedagogical_admin, content_author, reviewer_agent;
REVOKE UPDATE (is_published) ON lessons FROM PUBLIC;
```

### 4.2 Review pipeline state machine (aggregate per `lesson_id`)

```
draft
  │ submit_for_review()
  ▼
doctrine_gate          (fn_validate_lesson_doctrine)
  │ pass         │ fail
  ▼              ▼
agent_review   needs_revision
  │ approved    │ rejected
  ▼             ▼
bloom_gate    rejected
  │ target<5   │ target>=5
  ▼            ▼
publishable  human_review (parallel: ux + pedagogy)
              │ both approved   │ either rejected
              ▼                 ▼
            publishable      needs_revision
              │
              │ publish_lesson(actor_id)
              ▼
            published
```

Side branches from any state: `escalated` (via `escalate_review()`), and from `published`: `flagged_post_publish` (agent rejects after the fact — never auto-unpublish).

### 4.3 Core function signatures

```sql
publish_lesson(lesson_id uuid, actor_id uuid)
  RETURNS TABLE(passed bool, failing_criteria jsonb)
  -- SECURITY DEFINER. Acquires pg_advisory_xact_lock(hashtext('lesson:'||lesson_id)).
  -- Sets app.publish_via_function='true'. Re-runs fn_validate_lesson_doctrine().
  -- Verifies ≥1 approved human review per required reviewer_role.
  -- If bloom_target>=5, requires reviewer_type='human' explicitly.
  -- On success: UPDATE lessons SET is_published=true; emit domain_event.
  -- On failure: returns failing criteria, never partial state.

record_review_decision(review_id uuid, status text,
                       criterion_results jsonb, bloom_assessed smallint,
                       feedback_md text)
  -- Only writer to pedagogical_reviews. Validates JSON Schema by schema_version.
  -- If |bloom_target - bloom_assessed| > 1: forces calibration_dispute path.

record_competency_transition(user_id, competency_id, to_status,
                             evidence_attempt_id, actor_id, dedupe_key)
  -- Only writer to user_competency_progress_events.
  -- ON CONFLICT (dedupe_key) DO NOTHING (idempotent).

escalate_review(review_id, reason)
  -- Moves to pedagogical_admin queue; emits domain_event; never approves.
```

---

## 5. Decision protocols

1. **Locking.** Any operation touching a single lesson's review chain takes `pg_advisory_xact_lock(hashtext('lesson:'||lesson_id))` first. Two terminals racing on the same lesson serialize cleanly. Never use row-level FOR UPDATE on `pedagogical_reviews` — it's append-only, there's nothing to lock.

2. **Agent vs human conflict.**
   - Agent approves → human rejects: rejection wins. Agent row gets `agreement_with_previous=false`. Skill `agent_human_agreement_rate < 0.80` over 30 days → skill disabled (`agent_reviewers.is_active=false`).
   - Human approves → agent rejects post-publish: do NOT unpublish. Create `flagged_post_publish` task for `pedagogical_admin`.
   - Two humans disagree: `escalate_review()` to `pedagogical_admin`. No voting.
   - `bloom_target` (author) vs `bloom_assessed` (reviewer) gap > 1: forced second human reviewer (`calibration_dispute`).

3. **Bloom routing.** `bloom_target >= 5` requires at least one `reviewer_type='human'` approval per `reviewer_role` in {ux, pedagogy}. Bloom ≤ 4 may pass with agent only. This gate lives in `publish_lesson`, not in a trigger (so the threshold can evolve).

4. **Retries.** Max 3 review cycles per lesson. Cycle 4 → automatic `escalated`. Within a cycle, agent reviewer runs exactly once per `review_round` (no loops).

5. **Backpressure.** If `v_review_queue_health.human_review_pending > 20` for 3 days, `create_lesson_variant()` raises `queue_overflow`. Producers hit the same wall regardless of identity.

6. **Idempotency.** Every domain event producer must compute a stable `dedupe_key` (e.g., `attempt_id` for `competency.acquired`). Consumers may re-process safely because UNIQUE constraint absorbs duplicates.

7. **Never CASCADE on append-only tables.** Always RESTRICT.

---

## 6. Hand-offs

- **From Database (Schema Extensions):** all DDL (migrations 00012-00020), the JSON Schema validator function `jsonb_matches_schema`, partition maintenance, role definitions. Co-owned: `publish_lesson` body invokes `fn_validate_lesson_doctrine()` (Database-owned).
- **From QA Review (Pedagogical QA):** rubric criteria definitions, `criterion_results` JSON Schema (versioned), `pedagogical-drift-detector` worker output, inter-rater audit data populated into `review_calibration_samples`.
- **From Núcleo 01 (Content Production):** `lesson_generator_runs` rows; lessons enter `draft` state via `submit_for_review()`; `bloom_assessed_by_validator` in frontmatter feeds the calibration delta check.
- **From Núcleo 02 (Assessment Engine):** `assessment_attempts.id` referenced as `evidence_attempt_id` in `record_competency_transition`. Domain event `competency.acquired` consumed by Personalization Router.
- **To Frontend / Lesson Experience:** function `get_lesson_for_user(user_id, lesson_id) RETURNS jsonb` (resolves overrides live, never materialized). View `v_user_unlocked_lessons` (CTE recursive over `competency_prerequisites`).
- **To Personalization Router:** `domain_events` stream filtered by `event_type='competency.acquired'`; idempotent via `dedupe_key`.

---

## 7. Anti-patterns

- ❌ Writing `lessons.is_published=true` from anywhere except `publish_lesson()`.
- ❌ Auto-approving a review on timeout. Timeout → escalate.
- ❌ UPDATE on `pedagogical_reviews`, `user_competency_progress_events`, `user_journey_history`. Always INSERT a new row.
- ❌ Renaming `competencies.slug` or mutating `competencies.bloom_level`. Deprecate + new row.
- ❌ Materialized views for per-user resolution (stale right after stage transitions).
- ❌ Creating `lesson_variants` as duplicated lesson rows. Use `lesson_variants` with `content_overrides`/`layout_overrides` JSONB on a single row per (lesson, stage, persona, layer).
- ❌ Trigger-based bloom routing (engaves the threshold). Keep in function.
- ❌ CASCADE on append-only FKs.
- ❌ Bypassing validation by setting `app.publish_via_function='true'` outside `publish_lesson()`. Reviewable in code review.
- ❌ Letting Núcleo 01 / Núcleo 02 write `pedagogical_reviews` directly. Single function path only.

---

## 8. Verification checklist

- [ ] Migration includes `BEFORE UPDATE OR DELETE` trigger raising EXCEPTION on every append-only table touched.
- [ ] Every new write path goes through a `SECURITY DEFINER` function with a `RAISE EXCEPTION` on missing `app.publish_via_function` GUC where applicable.
- [ ] No new code references `auto_complete_lesson` or relies on `user_lesson_progress.is_completed` as a progression signal.
- [ ] `publish_lesson()` end-to-end test: lesson with `bloom_target=5`, single agent approval → publish FAILS; add human approval → publish SUCCEEDS.
- [ ] `record_competency_transition()` called twice with same `dedupe_key` → second call is no-op (verified by event count).
- [ ] Calibration drift test: insert review with `|bloom_target - bloom_assessed| = 2` → status forced to `calibration_dispute`, second reviewer required.
- [ ] Backpressure test: seed 21 pending human reviews → `create_lesson_variant()` raises `queue_overflow`.
- [ ] Cycle detection: `INSERT competency_prerequisites` creating a cycle → CONSTRAINT TRIGGER raises before commit.
- [ ] All new function grants are explicit (`GRANT EXECUTE ON FUNCTION ... TO content_author`); no PUBLIC.
- [ ] CI commit message references `Charter §4.X` for any change under `automatiklabs/supabase/migrations/` or `(platform)/learn/**`.

---

## 9. Open questions

- **Catalog ownership of `competencies`** — append-only enforced, but the *editing process* (who proposes new competencies, with what review) is not yet a workflow. Likely a `competency_proposals` table in a later phase.
- **Kirkpatrick level 4 evidence verification** — `monthly_revenue_self_reported` is honor system. No verification scheme designed yet (contract upload? Stripe integration? this is a system-wide blind spot, surfaced by QA in Round 2).
- **Backfill of legacy students** — `00015b_backfill` is sketched but the exact mapping (what `not_started` rows to seed for which existing enrollments) needs Arquiteto sign-off on the seed competency catalog first.
- **Scrum Master terminal** — was unreachable in Round 1; SLA values for human review by stage/track type are still placeholder (default 4h escalate, 72h hard timeout).
- **`pedagogical_admin` role definition** — the human(s) holding this role and their on-call rotation are undefined. Without it, escalation has no destination.
- **Cross-partition FK performance** — `user_competency_progress_events` partitioned monthly with FK to non-partitioned `assessment_attempts` is decided as RESTRICT-only; performance under load not yet measured.

DONE.
