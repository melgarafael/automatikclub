# Context — Pedagogical Workflow

## 1. What this area owns

Pedagogical Workflow owns the **runtime state machines, publication gates, and review orchestration** that enforce the AutomatikLabs Educational System's doctrine at execution time. Concretely: the SQL functions that serve as the only write path to protected columns (`publish_lesson`, `record_competency_transition`, `transition_review_status`, `escalate_review`, `set_lesson_draft`), the advisory-lock strategy that prevents race conditions between concurrent reviewers, the backpressure mechanism that halts content generation when the review queue is saturated, and the domain event table that notifies downstream consumers (Personalization Router, Kirkpatrick dashboards, drift detectors).

This area does NOT own: the SQL table definitions and migrations (Schema Extensions), the pedagogical rubric criteria (Pedagogical QA), the competency catalog (Instructional Design), the UI rendering of unlock states (Lesson Experience), or the generation of lesson content (Content Production). The boundary is: Schema Extensions builds the rails; Pedagogical Workflow runs the trains.

---

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Part II (doctrine, esp. CBE §4.2 and pedagogical_reviews §4.4), Part IV §4.1–§4.5 (all architectural decisions), Part VIII (glossary).
- **Skill:** `automatiklabs-doctrine` — load before any task. Also load `senior-backend` and `tomik-db-doctrine` for SQL function work.
- **Sibling context docs:**
  - `schema-extensions.md` — canonical table names, append-only triggers, enums. Read this first; Pedagogical Workflow owns the functions but NOT the tables.
  - `pedagogical-qa.md` — owns the 8 hard-fail criteria that `fn_validate_lesson_doctrine` enforces.
  - `instructional-design.md` — competency DAG structure used in unlock logic.
  - `assessment-engine.md` — `fn_promote_competency` signature, evidence types.
  - `lesson-experience.md` — `unlock_state` enum consumed by UI.

---

## 3. Operating principles

1. **Publish is a consequence, never a write.** `lessons.is_published` is revoked from all roles. The only path to flip it is `publish_lesson(lesson_id, actor_id) SECURITY DEFINER` which re-runs every doctrinal gate from zero on every call.
2. **Gates are layered: DB enforces invariants, functions enforce workflow.** Schema Extensions handles what no write path can bypass (triggers, revokes). Pedagogical Workflow handles what evolves with doctrine (gate combination, routing, escalation logic). These two layers never duplicate each other.
3. **Append-only everywhere.** Every pedagogical review is a new row, never an UPDATE. Every competency transition is a new event row. `pedagogical_reviews`, `user_competency_progress_events`, `user_journey_history`, `domain_events` are all append-only (enforced by Schema Extensions triggers). Functions in this area only INSERT.
4. **SLA expires to escalation, never to approval.** If a human review is not completed within its SLA window, the review enters `escalated` state and notifies `pedagogical_admin`. The clock running never grants permission. Pressure goes up the chain, never around the gate.
5. **Defense against service_role bypass.** Workers Python run with service_role which ignores RLS. The append-only triggers (`RAISE EXCEPTION`) are plpgsql-level, not RLS, and block even service_role. The only bypass is a function setting `app.publish_via_function=true` inside a `SECURITY DEFINER` context.
6. **Idempotency via dedupe_key.** Every domain event produced by this area includes a `dedupe_key`. `UNIQUE (aggregate_type, aggregate_id, event_type, dedupe_key)` makes any function safe to retry. The producer sets the key; the consumer uses `ON CONFLICT DO NOTHING`.
7. **Backpressure is a hard gate, not a warning.** `create_lesson_variant()` returns `ERROR queue_overflow` when the human review queue exceeds 20 items for more than 3 days. No worker can "not know" about the backlog.
8. **Competency graph, not completion list.** The unlock function `unlock_lesson_for_user(user_id, lesson_id)` checks `ALL prerequisite competencies EXIST in user_competency_progress WHERE status IN ('approved','mastered')`. No time-based gate, no lesson-count gate.
9. **max 3 review cycles per lesson.** After 3 `needs_revision` cycles without approval, the lesson transitions automatically to `escalated` for `pedagogical_admin`. Authors cannot loop indefinitely.
10. **Agent reviewer runs once per lesson version.** After a human provides feedback and the lesson is revised, the agent re-runs on the new version. Agent does not retry after human overrides — one run per version, final.

---

## 4. Key data structures / interfaces

### 4.1 Core SQL functions owned by this area

```sql
-- Primary publication gate
-- Returns TABLE(passed bool, failing_criteria jsonb) — NOT just a boolean
CREATE OR REPLACE FUNCTION public.publish_lesson(
  p_lesson_id UUID,
  p_actor_id UUID
) RETURNS TABLE(passed bool, failing_criteria jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- 1. fn_validate_lesson_doctrine(p_lesson_id) — all 8 hard-fail criteria pass
  -- 2. At least 1 approved human review exists in pedagogical_reviews
  -- 3. At least 1 competency mapped in lesson_competencies
  -- 4. Advisory lock obtained: pg_advisory_xact_lock(hashtext('lesson:' || p_lesson_id))
  -- 5. If all pass: UPDATE lessons SET is_published = true WHERE id = p_lesson_id
  -- Returns passing criteria list on failure, empty on success.
END; $$;

-- Competency progress transition
CREATE OR REPLACE FUNCTION public.record_competency_transition(
  p_user_id UUID,
  p_competency_id UUID,
  p_to_status competency_status,
  p_evidence_attempt_id UUID,
  p_bloom_demonstrated SMALLINT,
  p_actor_id UUID,
  p_rationale TEXT,
  p_dedupe_key TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Validates: competency exists, status transition is legal, Bloom ≥5 requires human actor
  -- Inserts: user_competency_progress_events row
  -- Emits: domain_events row with event_type='competency.acquired' if to_status='approved'
END; $$;

-- Review decision recording
CREATE OR REPLACE FUNCTION public.record_review_decision(
  p_review_id UUID,
  p_status review_status,
  p_criterion_results JSONB,
  p_bloom_assessed SMALLINT,
  p_feedback_md TEXT,
  p_actor_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Validates: actor authorized, feedback_md required on rejection (≥50 chars),
  --            bloom_assessed within range, criterion_results schema-valid
  -- Inserts: new row in pedagogical_reviews (append-only)
  -- Triggers escalation if bloom divergence > 1 level
END; $$;

-- Escalation
CREATE OR REPLACE FUNCTION public.escalate_review(
  p_lesson_id UUID,
  p_reason TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Inserts: pedagogical_reviews row with status='escalated'
  -- Notifies: domain_events row with event_type='review.escalated'
  -- Never auto-approves. Never downgrade. Pressure goes up.
END; $$;

-- Content Production entry point
CREATE OR REPLACE FUNCTION public.set_lesson_draft(
  p_payload JSONB,      -- {lesson_variants:[...], reviews:[...]}
  p_generator_run_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- Checks backpressure: if queue_overflow, RAISE EXCEPTION
  -- Inserts: lesson_variants rows (content_overrides from payload)
  -- Inserts: pedagogical_reviews rows with status='pending'
  -- All in one transaction; partial failure = full rollback
END; $$;
```

### 4.2 Review pipeline state machine

States (each transition = new `pedagogical_reviews` row, never UPDATE):

```
draft
  → doctrine_gate      (fn_validate_lesson_doctrine runs)
      → needs_fix        (hard-fail: author must fix, re-submit)
      → agent_review     (all 8 hard-fail criteria passed)
          → needs_revision (agent: feedback_md required ≥50 chars)
          → agent_approved
              → bloom_gate: bloom_target ≥ 5?
                  yes → human_review (reviewer_role='pedagogy' + 'ux' in parallel)
                  no  → publishable
          → rejected (terminal after 3 cycles)
  human_review (both 'pedagogy' and 'ux' must approve)
      → publishable
      → needs_revision (returns to author)
      → escalated (timeout or calibration_dispute)
  publishable
      → published (publish_lesson() succeeds)
```

### 4.3 Domain events table (produced here)

```sql
-- Schema Extensions creates this table; Pedagogical Workflow writes to it.
INSERT INTO public.domain_events (
  aggregate_type,  -- 'lesson' | 'competency' | 'review' | 'user_journey'
  aggregate_id,
  event_type,      -- 'lesson.published' | 'competency.acquired' | 'review.escalated' | etc.
  payload,         -- jsonb
  dedupe_key,      -- producer-set idempotency key
  occurred_at
) VALUES (...) ON CONFLICT DO NOTHING;
```

### 4.4 Unlock logic (view consumed by Lesson Experience)

```sql
-- View: user_unlocked_lessons
-- A lesson is unlocked for a user when ALL prerequisite competencies
-- for that lesson exist in v_user_competency_progress WHERE status IN ('approved','mastered').
-- Computed on-read (never cached): persona changes and competency changes affect this in real time.
CREATE VIEW public.v_user_unlocked_lessons AS
  SELECT u.id AS user_id, l.id AS lesson_id,
    BOOL_AND(
      EXISTS (
        SELECT 1 FROM v_user_competency_progress vp
        WHERE vp.user_id = u.id
          AND vp.competency_id = cp.requires_id
          AND vp.status IN ('approved','mastered')
      )
    ) AS is_unlocked
  FROM users u
  CROSS JOIN lessons l
  LEFT JOIN lesson_competencies lc ON lc.lesson_id = l.id
  LEFT JOIN competency_prerequisites cp ON cp.competency_id = lc.competency_id
  GROUP BY u.id, l.id;
```

---

## 5. Decision protocols

1. **DB constraint vs. function logic?** If a rule must survive any write path including psql and service_role — DB (Schema Extensions owns it). If it is about orchestration, routing, or escalation that will evolve as doctrine matures — function in this area.
2. **Agent reviewer approved; human reviewer rejects — who wins?** Rejection always wins. The agent approval row stays as historical record with flag `disagreed_with_human=true`. Lesson returns to `needs_revision`. No exceptions.
3. **Human approved; agent rejects post-publish — what happens?** No auto-depublish. Create `domain_events` row with `event_type='lesson.flagged_post_publish'`. `pedagogical_admin` handles it. Depublishing live content is always a human decision.
4. **Two humans disagree (ux vs pedagogy review)?** No majority vote. Call `escalate_review()`. Escalate to `pedagogical_admin`. Pedagogia não é democracia.
5. **Review SLA expires — what happens?** The cron worker reads `v_overdue_reviews` and calls `escalate_review()`. Never auto-approves. The escalation row notifies `pedagogical_admin` via `domain_events`. SLA pressure becomes visibility pressure, not bypass.

---

## 6. Hand-offs

- **From Schema Extensions:** table DDL + enums + append-only triggers + REVOKE on `lessons.is_published` + `v_review_queue_health` view. This area writes to tables it does not own — Schema Extensions must ship migrations before any function can run.
- **From Pedagogical QA:** the 8 hard-fail criterion JSON Schema (versioned) that `fn_validate_lesson_doctrine` enforces. Pedagogical QA defines the criteria; this area plugs them into the function.
- **From Assessment Engine:** `fn_promote_competency` call contract (§4.4 of `assessment-engine.md`) — this area calls it; Assessment Engine owns the function body but not the advisory lock wrapper.
- **From Content Production:** shape of `set_lesson_draft` payload; this area owns the function, Content Production is the caller.
- **To Schema Extensions:** exact signatures of `publish_lesson`, `transition_review_status`, `record_competency_transition` — Schema Extensions wires the REVOKE + GRANT EXECUTE for each.
- **To Lesson Experience:** `unlock_state` enum shape (`unlocked`, `blocked_by`, `reason_human`, `next_action`), `v_user_unlocked_lessons` view, `get_lesson_for_user()` RPC.
- **To Pedagogical QA:** `v_overdue_reviews`, `v_review_queue_health`, `review_audits` table — QA's drift detector reads these.
- **To Personalization Router / Kirkpatrick dashboards:** `domain_events` table — append-only, indexed by `(aggregate_type, occurred_at)`.

---

## 7. Anti-patterns

- **Writing `lessons.is_published = true` from anywhere other than `publish_lesson()`.** Revoke is in place but the intent matters: never attempt the bypass.
- **Auto-approving on SLA timeout.** The escalation path exists precisely to avoid this. Any code path that flips `status='approved'` without human actor is a doctrine violation.
- **Materialized view for `v_user_unlocked_lessons`.** Persona and competency status change in real time; a stale MV lies exactly when unlock state matters to the student.
- **`LOCK TABLE` anywhere.** Use `pg_advisory_xact_lock` per lesson/attempt instead.
- **Agent reviewer running more than once per lesson version.** One run per version. Re-run only when the author creates a new version (re-submit via `needs_revision → pending`).
- **Emitting domain events without a `dedupe_key`.** Any retry scenario will double-promote a student's stage. Always set the key.
- **Blocking on service_role assumption.** Workers run as service_role. The only safe assumption is that plpgsql RAISE in append-only triggers blocks service_role too. Do not rely on RLS for append-only protection.
- **Skipping the advisory lock on concurrent reviews.** Two terminal workers reviewing the same lesson simultaneously without `pg_advisory_xact_lock('review:lesson:' || lesson_id)` will produce duplicate review rows with conflicting states.

---

## 8. Verification checklist

- [ ] `publish_lesson()` returns `TABLE(passed bool, failing_criteria jsonb)`, not a boolean.
- [ ] `publish_lesson()` obtains `pg_advisory_xact_lock` before any write.
- [ ] `fn_validate_lesson_doctrine` called inside `publish_lesson()` before the review check.
- [ ] `record_competency_transition` validates `bloom_demonstrated >= competency.bloom_level` before allowing `to_status='approved'`.
- [ ] `record_review_decision` validates `feedback_md IS NOT NULL AND length(feedback_md) >= 50` when `status='rejected'`.
- [ ] `escalate_review` never sets `status='approved'` — only `status='escalated'`.
- [ ] `set_lesson_draft` checks `v_review_queue_health` and raises `queue_overflow` when saturated.
- [ ] All domain event inserts use `ON CONFLICT DO NOTHING` with a producer-set `dedupe_key`.
- [ ] The review state machine transition diagram (§4.2) is reflected exactly in `transition_review_status()` — no undocumented transitions.
- [ ] Cron worker for SLA escalation reads `v_overdue_reviews` and calls `escalate_review()`, never sets `status='approved'`.
- [ ] Legacy backfill migration (`00015b_backfill`) runs `INSERT ... ON CONFLICT DO NOTHING` transactionally per `user_id`.
- [ ] `v_user_unlocked_lessons` is a plain view, not materialized.

---

## 9. Open questions / known limitations

- **Legacy backfill (`00015b_backfill`).** Existing students need seed rows in `user_competency_progress_events` derived from their legacy `user_lesson_progress`. SQL not yet written; depends on Instructional Design finalizing which competencies map to which legacy tracks. Until it ships, legacy students have no CBE history.
- **Competency_versions table.** Brainstorm rounds 2/3 agreed this is needed so that doctrine upgrades (e.g., `bloom_level` increases from 3 to 4) don't invalidate student history. Not yet in any migration. Students who demonstrated competency v1 should still count. Track as dependency before any competency is modified post-publish.
- **Cron worker implementation.** The SLA escalation cron is described but not implemented. `pg_cron` availability on the target Supabase project is unverified. Until it exists, escalation requires manual triggering or a local Bash worker on a schedule.
- **`review_chain_id`** — groups all review rows for a single lesson across cycles for easier querying. Proposed in brainstorm but not yet in the `pedagogical_reviews` schema. Add in a new migration when the retry-cycle query needs it.
- **Backpressure threshold (20 items / 3 days)** is an operational estimate. Re-evaluate after the first month of real production. The threshold lives in the `set_lesson_draft` function body — change without a migration.
- **`skills_manifest.json`** — a proposed catalog of which tables each skill reads/writes, used to generate RLS policies per skill. Not yet written. Skills currently rely on role-based access only.
