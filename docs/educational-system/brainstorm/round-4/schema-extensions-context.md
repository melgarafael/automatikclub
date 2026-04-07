# Context — Schema Extensions

**Area:** Schema Extensions (sub-epic 02)
**Owner terminal:** Database
**Audience:** future Claude with cleared memory executing Schema Extensions stories via `epic-executor`. Must act without asking humans.

---

## 1. What this area owns

Every `.sql` file under `automatiklabs/supabase/migrations/` numbered `00012_*` through `00020_*`, the RLS policies inside them, the `SECURITY DEFINER` functions that serve as single-entry write paths, the append-only triggers, the views consumed by Backend Dev and Frontend, and the JSON Schemas used in CHECK constraints on `jsonb` columns.

**Not owned:** app code, skill definitions, lesson content, rubric content, frontend components, orchestration timing, SLA policy, role creation (Security owns `CREATE ROLE`).

**Relationship to existing schema:** existing learning tables live in `automatiklabs/supabase/migrations/00003_learning.sql` (`tracks, courses, modules, lessons, user_lesson_progress, user_course_progress`). Schema Extensions adds **on top**; never rewrites. One surgical exception: drops the `auto_complete_lesson` trigger from `00003` in migration `00015`, because it encodes time-based completion which the Charter forbids.

## 2. Required pre-reading

Before writing any SQL, load these in order:

1. **Skill:** `automatiklabs-doctrine` (thin loader; gives glossary + pointer to Charter).
2. **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Parts II (doctrine), §4.1–§4.4 (committed architectural decisions), Part VIII (glossary).
3. **Current schema:** `automatiklabs/supabase/migrations/00003_learning.sql` — understand what exists before extending. Specifically note `lessons.is_published`, `user_lesson_progress`, and the `auto_complete_lesson` trigger at line ~295.
4. **Migration style guide:** `tomik-db-doctrine` skill (referenced in CLAUDE.md / AGENTS.md for Supabase migration conventions).
5. **Sibling context docs** (same directory): `pedagogical-workflow-context.md`, `lesson-experience-context.md`, `assessment-engine-context.md` — for hand-off contracts.
6. **AGENTS.md** at repo root: breaking changes warning for Next.js version — does not affect SQL but affects any edge function or RPC wrapper.

## 3. Operating principles

1. **Doctrine over convenience.** Every doctrinal invariant (Charter §2.1, §4.2–§4.4) lives as a DB-level constraint, trigger, or revoked GRANT. If it is only enforced in app code, it is folklore.
2. **Publish is a consequence, never a write.** `lessons.is_published` has UPDATE revoked; only `publish_lesson(lesson_id, actor_id) SECURITY DEFINER` flips it, and only after re-running all gates.
3. **Append-only for history.** `pedagogical_reviews`, `user_journey_history`, `user_competency_progress_events`, `domain_events` reject UPDATE and DELETE via BEFORE trigger. History is truth.
4. **Events, not UPDATE, for pedagogical state.** Competency status lives in an events table; current state is a `DISTINCT ON` view.
5. **Migrations are idempotent and immutable.** `IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`. Once merged, a migration is never edited — deltas go in a new file.
6. **RLS enabled on every new table**, with at least one explicit policy. No tables "open by default."
7. **`jsonb` requires a JSON Schema** + `schema_version smallint` + CHECK constraint. Unvalidated jsonb is landfill.
8. **Defense in depth.** REVOKE + SECURITY DEFINER function + trigger. Any one alone can be bypassed; all three cannot.
9. **Charter citation** in the migration header comment (e.g., `-- Charter §4.2 (competencies first-class)`).
10. **Rollback block** as a comment at the bottom of every migration.

## 4. Key data structures

### 4.1 Enums (migration 00012)

```sql
CREATE TYPE journey_stage AS ENUM ('stage_1','stage_2','stage_3','stage_4','stage_5','stage_6');
CREATE TYPE learner_persona AS ENUM ('zerado','autodidata','organizado');
CREATE TYPE mastery_layer AS ENUM ('tecnica','logica','maestria');
CREATE TYPE competency_framework AS ENUM
  ('empresa-ia-humanizada','3-camadas','7-passos','3-cs','jornada-7-fases','generic');
CREATE TYPE competency_status AS ENUM
  ('not_started','in_progress','submitted','approved','mastered','rejected');
CREATE TYPE reviewer_type AS ENUM ('agent','human');
CREATE TYPE review_status AS ENUM
  ('pending','approved','changes_requested','rejected','escalated');
```

### 4.2 `competencies` and junctions (migration 00013)

```sql
CREATE TABLE public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- immutable after insert (trigger)
  title TEXT NOT NULL,
  description TEXT,
  bloom_level SMALLINT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  framework competency_framework NOT NULL DEFAULT 'generic',
  parent_competency_id UUID REFERENCES public.competencies(id) ON DELETE RESTRICT,
  deprecated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lesson_competencies (
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  competency_id UUID REFERENCES public.competencies(id) ON DELETE RESTRICT,
  weight SMALLINT NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 5),
  PRIMARY KEY (lesson_id, competency_id)
);

CREATE TABLE public.competency_prerequisites (
  competency_id UUID REFERENCES public.competencies(id) ON DELETE CASCADE,
  requires_id   UUID REFERENCES public.competencies(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('hard','soft')),
  PRIMARY KEY (competency_id, requires_id),
  CHECK (competency_id <> requires_id)
);

-- immutability trigger
CREATE OR REPLACE FUNCTION public.fn_competency_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.slug <> NEW.slug OR OLD.bloom_level <> NEW.bloom_level THEN
    RAISE EXCEPTION 'competencies.slug and bloom_level are immutable post-insert';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_competency_immutable
  BEFORE UPDATE ON public.competencies
  FOR EACH ROW EXECUTE FUNCTION public.fn_competency_immutable();
```

### 4.3 Cube axes + `user_journey_history` (migration 00014)

```sql
ALTER TABLE public.tracks
  ADD COLUMN target_stage journey_stage,
  ADD COLUMN target_personas learner_persona[] NOT NULL DEFAULT '{}',
  ADD COLUMN mastery_layer mastery_layer;

ALTER TABLE public.user_profiles
  ADD COLUMN current_stage journey_stage,
  ADD COLUMN persona learner_persona,
  ADD COLUMN preferred_layer mastery_layer;

CREATE TABLE public.user_journey_history (          -- append-only
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  persona learner_persona,
  journey_stage journey_stage,
  preferred_layer mastery_layer,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  changed_by UUID REFERENCES public.user_profiles(id)
);
CREATE INDEX idx_journey_history_user_time
  ON public.user_journey_history (user_id, changed_at DESC);

-- append-only enforcement (reused for other history tables)
CREATE OR REPLACE FUNCTION public.fn_raise_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'table % is append-only', TG_TABLE_NAME; END; $$;

CREATE TRIGGER trg_journey_history_immutable
  BEFORE UPDATE OR DELETE ON public.user_journey_history
  FOR EACH ROW EXECUTE FUNCTION public.fn_raise_immutable();

-- auto-log on user_profiles change
CREATE OR REPLACE FUNCTION public.fn_log_journey_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_stage IS DISTINCT FROM OLD.current_stage
     OR NEW.persona IS DISTINCT FROM OLD.persona
     OR NEW.preferred_layer IS DISTINCT FROM OLD.preferred_layer THEN
    INSERT INTO public.user_journey_history
      (user_id, persona, journey_stage, preferred_layer, reason, changed_by)
    VALUES
      (NEW.id, NEW.persona, NEW.current_stage, NEW.preferred_layer,
       'profile_update', auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_profile_journey_log
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_journey_change();
```

### 4.4 Competency progress as events (migration 00015)

```sql
-- drop the time-based anti-pattern
DROP TRIGGER IF EXISTS auto_complete_lesson_trigger ON public.user_lesson_progress;

CREATE TABLE public.user_competency_progress_events (   -- append-only
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT,
  from_status competency_status,
  to_status competency_status NOT NULL,
  evidence_attempt_id UUID,        -- FK added in 00017
  bloom_demonstrated SMALLINT CHECK (bloom_demonstrated BETWEEN 1 AND 6),
  actor_id UUID REFERENCES public.user_profiles(id),
  rationale TEXT,
  dedupe_key TEXT NOT NULL,        -- idempotency (Round 2)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, competency_id, dedupe_key)
);
CREATE INDEX idx_ucpe_user_comp_time
  ON public.user_competency_progress_events (user_id, competency_id, created_at DESC);

CREATE TRIGGER trg_ucpe_immutable
  BEFORE UPDATE OR DELETE ON public.user_competency_progress_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_raise_immutable();

-- current state as a view
CREATE VIEW public.v_user_competency_progress AS
  SELECT DISTINCT ON (user_id, competency_id)
    user_id, competency_id,
    to_status AS status,
    evidence_attempt_id,
    bloom_demonstrated,
    created_at AS updated_at
  FROM public.user_competency_progress_events
  ORDER BY user_id, competency_id, created_at DESC;
```

### 4.5 `pedagogical_reviews` (migration 00016)

```sql
CREATE TABLE public.pedagogical_reviews (                -- append-only
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  reviewer_type reviewer_type NOT NULL,
  reviewer_id UUID REFERENCES public.user_profiles(id),
  agent_slug TEXT,
  review_round SMALLINT NOT NULL DEFAULT 1,
  status review_status NOT NULL DEFAULT 'pending',
  feedback_md TEXT,
  bloom_assessed SMALLINT CHECK (bloom_assessed BETWEEN 1 AND 6),
  criterion_results JSONB NOT NULL DEFAULT '{}'::jsonb,  -- JSON-schema-validated
  criterion_schema_version SMALLINT NOT NULL DEFAULT 1,
  doctrine_score SMALLINT CHECK (doctrine_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (reviewer_type = 'human' AND reviewer_id IS NOT NULL) OR
    (reviewer_type = 'agent' AND agent_slug  IS NOT NULL)
  ),
  CHECK (
    status <> 'rejected' OR (feedback_md IS NOT NULL AND length(feedback_md) >= 50)
  )
);
CREATE INDEX idx_pedrev_lesson_status
  ON public.pedagogical_reviews (lesson_id, status);

CREATE TRIGGER trg_pedrev_immutable
  BEFORE UPDATE OR DELETE ON public.pedagogical_reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_raise_immutable();
```

### 4.6 Publish gate (migration 00019)

```sql
REVOKE UPDATE (is_published) ON public.lessons FROM PUBLIC, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.publish_lesson(p_lesson_id UUID, p_actor_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  -- 1. require at least one approved human review
  IF NOT EXISTS (
    SELECT 1 FROM public.pedagogical_reviews
    WHERE lesson_id = p_lesson_id AND reviewer_type = 'human' AND status = 'approved'
  ) THEN RAISE EXCEPTION 'lesson % lacks approved human review', p_lesson_id;
  END IF;
  -- 2. require at least one competency mapped
  IF NOT EXISTS (
    SELECT 1 FROM public.lesson_competencies WHERE lesson_id = p_lesson_id
  ) THEN RAISE EXCEPTION 'lesson % has no competencies mapped', p_lesson_id;
  END IF;
  -- 3. doctrine validator must pass
  IF EXISTS (
    SELECT 1 FROM public.fn_validate_lesson_doctrine(p_lesson_id)
    WHERE passed = false
  ) THEN RAISE EXCEPTION 'lesson % fails doctrine validator', p_lesson_id;
  END IF;
  UPDATE public.lessons SET is_published = true WHERE id = p_lesson_id;
END; $$;
REVOKE ALL ON FUNCTION public.publish_lesson(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_lesson(UUID, UUID) TO authenticated;
```

## 5. Decision protocols

1. **DB constraint vs app logic?** If any write path (UI, worker, skill, psql) could bypass it AND it is about data truth — DB. If about timing/policy — app.
2. **View or materialized view?** Student-facing → on-demand view. Admin dashboard → MV with `pg_cron`. Never MV for per-student resolved lesson state.
3. **UPDATE column or INSERT event?** If history is needed for Kirkpatrick, audit, or race resolution — events + `DISTINCT ON` view.
4. **Rename a competency slug?** You don't. Insert new row, set `deprecated_at` on old row, migrate FKs in a new migration.
5. **New doctrinal column — where?** Intent (cube target) → `tracks` / `lessons`. Variant payload → `lesson_variants.content_overrides` / `layout_overrides` jsonb. Never add 54 columns.
6. **Locking strategy?** Concurrent reviews → `pg_advisory_xact_lock(hashtext('review:lesson:' || id))`. Concurrent submissions → UNIQUE `(user_id, comp_id, sha256)` + `pg_try_advisory_xact_lock`. Never `LOCK TABLE`. Never `SELECT FOR UPDATE` on append-only tables.

## 6. Hand-offs

**From Instructional Design (Arquiteto):** seed competency catalog (YAML → SQL `INSERT`) with `slug, title, bloom_level, framework, parent_competency_id` before `00013` ships non-empty.
**From Assessment Engine (Núcleo 02):** JSON Schema for `rubrics.criteria` (versioned); evidence-kind enum; FK direction on `user_competency_progress_events.evidence_attempt_id → assessment_attempts.id`.
**From Pedagogical QA:** JSON Schema for `pedagogical_reviews.criterion_results`; list of criterion slugs.
**From Backend Dev (Pedagogical Workflow):** exact signatures of `publish_lesson`, `transition_review_status`, `record_competency_transition`. Backend Dev owns the function bodies; Schema Extensions owns the REVOKE + GRANT EXECUTE wiring and the migration file.
**From Security:** `CREATE ROLE pedagogical_admin`, `content_author`, `reviewer_agent` before any RLS policy referencing them ships.
**From Content Production (Núcleo 01):** shape of `lesson_generator_runs` columns (inputs_hash, prompt_version, model, tokens, cost).

**To Backend Dev:** migration files, append-only triggers, `fn_validate_lesson_doctrine`, function skeletons with SECURITY DEFINER wrappers.
**To UI UX / Frontend:** views `v_user_lesson_state`, `v_user_competency_graph`, `v_user_journey_timeline`, `v_lesson_chapters` with enum fields `block_reason`, `next_action`, `variant_match_quality`.
**To Pedagogical QA:** `v_lesson_doctrine_status`, `review_audits` table, discrepancy columns (`bloom_target` vs `bloom_assessed`).
**To Assessment Engine:** `assessment_attempts` table, evidence FK wiring.

## 7. Anti-patterns

- Time-based completion (`auto_complete_lesson` in `00003` is the canonical wrong example — drop it).
- Editing a merged migration file. Always a new file.
- ALTER columns to NOT NULL on a non-empty table without a backfill companion migration.
- Materialized view for per-student resolved lesson state.
- `jsonb` without versioned JSON Schema + CHECK constraint.
- Renaming `competencies.slug` via UPDATE.
- Writing `lessons.is_published = true` from anywhere other than `publish_lesson()`.
- `SELECT FOR UPDATE` on append-only tables.
- `LOCK TABLE`, ever.
- RLS disabled or "add policy later."
- Skipping `ON DELETE` clause on a FK.
- NOT NULL doctrinal columns added without defaults on tables that may have existing rows.
- Auto-approve-on-timeout for reviews (must be escalation, not approval).
- Materialized history that is not append-only.

## 8. Verification checklist

- [ ] Migration numbered sequentially; file name matches convention `000NN_<area>.sql`.
- [ ] Header comment cites Charter section (e.g. `-- Charter §4.2`).
- [ ] Idempotent: `IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`.
- [ ] `-- ROLLBACK:` block at the bottom with reverse DDL.
- [ ] Every new table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + at least one explicit policy.
- [ ] Every FK has explicit `ON DELETE`.
- [ ] Every jsonb column has `schema_version smallint` + CHECK constraint.
- [ ] Append-only tables have BEFORE UPDATE OR DELETE trigger using `fn_raise_immutable()`.
- [ ] New indexes justified by a named query in the migration comment.
- [ ] `supabase db reset` applies cleanly locally; no errors.
- [ ] `fn_validate_lesson_doctrine` updated if new doctrinal column was added.
- [ ] Non-empty existing tables get a `*_backfill.sql` companion migration before any NOT NULL add.
- [ ] No edits to previously merged migration files.
- [ ] Grants/revokes match the "publish as consequence" principle for any protected column.
- [ ] Dedupe key present on any new events table.

## 9. Open questions

- **Partitioning** of `user_journey_history` and `user_competency_progress_events` by month — planned, not scheduled. Revisit before 10k active users.
- **Governance of the competency catalog** — who inserts, who deprecates, what review process. Append-only is decided; the workflow around it is not.
- **JSON Schema validator** — `pg_jsonschema` extension vs custom plpgsql vs app-side. Not decided. Blocks jsonb CHECK constraints.
- **Legacy backfill (`00015b_backfill`)** — inferring `user_competency_progress_events` rows for already-enrolled users. SQL not written; depends on Arquiteto finalizing which competencies map to which legacy tracks.
- **RLS split for `lesson_variants`** — `content_overrides` written by Núcleo 01 role, `layout_overrides` written by UI UX role, same table. Policy DDL pending Security terminal input.
- **`pg_cron`** availability on the target Supabase project — needed for MV refresh on `v_review_queue_health`. Not verified.
- **Unified `lesson_variants` table vs separate Núcleo 01 / UI UX tables** — Round 2/3 consensus is unified, but Núcleo 01 has not explicitly confirmed abandoning their `lesson_variants` name.

DONE.
