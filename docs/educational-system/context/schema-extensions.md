# Context — Schema Extensions (Database)

**Area owner:** Database terminal
**Sub-epic:** 02 — Schema Extensions (`docs/stories/epics/area-schema-extensions.md`)
**Audience:** any future agent touching the AutomatikLabs Educational System database layer.
**Prerequisite reading:** `automatiklabs/docs/educational-system/CHARTER.md` (Parts II, IV, VIII) and the `automatiklabs-doctrine` skill.

---

## 1. Purpose

Schema Extensions owns the **Postgres materialization of the pedagogical doctrine** for the AutomatikLabs Educational System. Every CBE rule, every Cubo 3D axis, every review gate, every Kirkpatrick metric must survive as a table, column, constraint, index, trigger, or RLS policy. If it does not, it is folklore.

Concretely: migrations under `automatiklabs/supabase/migrations/00012*.sql` through `00020*.sql`, the RLS policies that protect them, the SQL functions that enforce gates, and the views that expose state to Backend Dev and UI UX.

**Not our job:** app logic, orchestration timing, UX copy, assessment rubric content, lesson generation.

## 2. Key concepts (glossary for this area)

- **Append-only table:** table with a `BEFORE UPDATE OR DELETE` trigger that `RAISE EXCEPTION`. Used for `pedagogical_reviews`, `user_journey_history`, `user_competency_progress_events`, `domain_events`.
- **Publish as consequence:** `lessons.is_published` has `UPDATE` revoked from all roles. The only path to flip it is `publish_lesson(lesson_id, actor_id) SECURITY DEFINER` which re-runs every doctrinal gate.
- **Cubo 3D:** composite key `(journey_stage, learner_persona, mastery_layer)` stored as three enums. Lives on `user_profiles` (current state), `tracks` (target), and `lesson_variants` (variant key).
- **Variant:** single row in `lesson_variants` that holds `content_overrides jsonb` + `layout_overrides jsonb` for one cube cell. Variants are *wrappers*, not rewrites (Round 2/3 consensus).
- **Evidence chain:** `assessment_attempts → user_competency_progress_events → v_user_competency_graph`. Every CBE status transition must be traceable back to a concrete attempt artifact.
- **Doctrine gate:** SQL function that returns `TABLE(check_name text, passed bool, detail text)`. Canonical one is `fn_validate_lesson_doctrine(lesson_id)`.

Canonical terms (Estágio, Persona, Camada, Pilar, Formação, Competência) follow Charter Part VIII — do not redefine.

## 3. Canonical inputs/outputs

**Inputs (what Schema Extensions consumes):**
- Charter §4.1–§4.4 decisions (locked).
- Competency seed catalog from Arquiteto (slug, bloom_level, framework, parent).
- JSON schemas for `rubrics.criteria` (Núcleo 02) and `pedagogical_reviews.criterion_results` (QA Review).
- Role definitions from Security (`pedagogical_admin`, `content_author`, `reviewer_agent`).

**Outputs (what Schema Extensions produces):**
- Idempotent migration files in `automatiklabs/supabase/migrations/`.
- SQL functions (SECURITY DEFINER) as the *only* write path for protected tables.
- Views consumed by Backend Dev and frontend.
- RLS policies per table.
- Rollback SQL per migration, in a `-- ROLLBACK:` block comment.

## 4. Data shapes (the API of this area)

All shapes are final proposals; deltas require a new migration, never ALTER on a merged one.

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
CREATE TYPE review_status AS ENUM ('pending','approved','changes_requested','rejected','escalated');
```

### 4.2 Core tables (migrations 00013–00018)
```sql
-- 00013 competencies
CREATE TABLE public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                -- immutable post-insert
  title TEXT NOT NULL,
  description TEXT,
  bloom_level SMALLINT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  framework competency_framework NOT NULL DEFAULT 'generic',
  parent_competency_id UUID REFERENCES public.competencies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.lesson_competencies (
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  competency_id UUID REFERENCES competencies(id) ON DELETE RESTRICT,
  weight SMALLINT NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 5),
  PRIMARY KEY (lesson_id, competency_id)
);
CREATE TABLE public.competency_prerequisites (
  competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
  requires_id UUID REFERENCES competencies(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('hard','soft')),
  PRIMARY KEY (competency_id, requires_id)
);
-- 00014 cube axes on existing tables + journey history
ALTER TABLE tracks
  ADD COLUMN target_stage journey_stage,
  ADD COLUMN target_personas learner_persona[] DEFAULT '{}',
  ADD COLUMN mastery_layer mastery_layer;
ALTER TABLE user_profiles
  ADD COLUMN current_stage journey_stage,
  ADD COLUMN persona learner_persona,
  ADD COLUMN preferred_layer mastery_layer;
CREATE TABLE public.user_journey_history (   -- append-only
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  persona learner_persona,
  journey_stage journey_stage,
  preferred_layer mastery_layer,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  changed_by UUID REFERENCES user_profiles(id)
);
CREATE INDEX idx_journey_history_user_time ON user_journey_history(user_id, changed_at DESC);
-- 00015 competency progress as event sourcing
CREATE TABLE public.user_competency_progress_events (  -- append-only
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  from_status competency_status,
  to_status competency_status NOT NULL,
  evidence_attempt_id UUID,   -- FK added in 00017
  actor_id UUID REFERENCES user_profiles(id),
  rationale TEXT,
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, competency_id, dedupe_key)
);
-- View that the rest of the system reads:
CREATE VIEW v_user_competency_progress AS
  SELECT DISTINCT ON (user_id, competency_id)
    user_id, competency_id, to_status AS status, evidence_attempt_id, created_at AS updated_at
  FROM user_competency_progress_events
  ORDER BY user_id, competency_id, created_at DESC;
-- 00016 pedagogical_reviews + course_instructors (see Charter §4.4)
-- 00017 assessments, rubrics, assessment_attempts, evidence_artifacts
-- 00018 lesson_variants (content_overrides + layout_overrides jsonb)
-- 00019 fn_validate_lesson_doctrine + publish_lesson SECURITY DEFINER
-- 00020 lesson_generator_runs (Núcleo 01 provenance)
```

### 4.3 Cube resolution query (the canonical read path)
```sql
-- inside fn_resolve_variant(user_id, lesson_id)
WITH ctx AS (SELECT current_stage, persona, preferred_layer FROM user_profiles WHERE id = $1)
SELECT lv.id,
       (CASE WHEN lv.persona = ctx.persona THEN 0 ELSE 100 END)  -- persona weight 100x
       + ABS(COALESCE(lv.stage::int - ctx.current_stage::int, 0))
       + (CASE WHEN lv.layer = ctx.preferred_layer THEN 0
               WHEN lv.layer IS NULL THEN 1 ELSE 2 END) AS dist
FROM lesson_variants lv CROSS JOIN ctx
WHERE lv.lesson_id = $2 AND lv.review_status = 'approved'
ORDER BY dist ASC LIMIT 1;
```

### 4.4 Non-negotiable invariants enforced in DB
1. `lessons.is_published`: UPDATE revoked from all roles; only `publish_lesson()` writes.
2. `pedagogical_reviews`, `user_journey_history`, `user_competency_progress_events`: append-only via BEFORE UPDATE/DELETE trigger.
3. `competencies.slug` and `bloom_level`: immutable post-insert.
4. `competency_prerequisites`: CONSTRAINT TRIGGER `fn_check_no_competency_cycle` on INSERT.
5. `assessment_attempts`: UNIQUE `(user_id, competency_id, sha256) WHERE sha256 IS NOT NULL`.
6. `pedagogical_reviews.feedback_md`: NOT NULL and `length >= 50` when `status = 'rejected'`.
7. `auto_complete_lesson` trigger from `00003_learning.sql`: **DROPPED** in 00015. Time-based completion is doctrinally forbidden.

## 5. Decision protocols

1. **"Should this rule live in DB or app?"** → If any write path (UI, worker, psql, skill) could bypass it and the invariant is about *data integrity or doctrinal truth*, it goes in the DB (constraint/trigger/revoked grant). If it is about *flow, timing, or policy that may evolve*, it goes in the app as a SECURITY DEFINER function. See Round 3 dialogue with Backend Dev.

2. **"Should this be a view or a materialized view?"** → If a student looks at it, **on-demand view** (cache lies exactly when UX matters). If only admins look at it in a dashboard, **materialized view with `pg_cron` refresh**. Never MV for `resolved_lesson_for_user`.

3. **"Should this state transition be an UPDATE or an INSERT into an events table?"** → If the history is needed for Kirkpatrick, audit, race-condition resolution, or calibration — INSERT into events, read via `DISTINCT ON` view. Otherwise UPDATE is fine. Default to events for any pedagogical state.

4. **"How do I rename a competency slug?"** → You don't. `UPDATE` is blocked by trigger. Insert a new row with the new slug, mark old row `deprecated_at`, migrate `lesson_competencies` and events manually in a new migration file.

5. **"Where does a new doctrinal column go: tracks, lessons, or lesson_variants?"** → Ask: does it declare *intent* (which cube cell the content serves)? Then `tracks` or `lessons`. Does it carry a *variant-specific* payload? Then `lesson_variants.content_overrides` or `layout_overrides` (jsonb), not a new column.

## 6. Hand-offs

- **From Instructional Design (Arquiteto):** seed catalog of competencies (`slug, title, bloom_level, framework, parent_competency_id`) as YAML/markdown. Without seed, `00013` ships empty.
- **From Assessment Engine (Núcleo 02):** JSON Schema (versioned) for `rubrics.criteria` and `evidence_artifacts` shape; enum of evidence kinds.
- **From Pedagogical QA:** JSON Schema for `pedagogical_reviews.criterion_results`; list of criteria slugs.
- **From Backend Dev:** exact signature of `publish_lesson`, `transition_review_status`, `record_competency_transition` — they own the functions, we own the REVOKE + GRANT EXECUTE wiring.
- **From Security:** `CREATE ROLE` statements for `pedagogical_admin`, `content_author`, `reviewer_agent`.

- **To Backend Dev:** migrations, append-only triggers, view `v_user_lesson_state`, cube resolution query.
- **To UI UX / Frontend:** views `v_user_competency_graph`, `v_user_journey_timeline`, `v_lesson_chapters`, `v_user_lesson_state` (with enums `block_reason`, `next_action`).
- **To Pedagogical QA:** `fn_validate_lesson_doctrine` + `v_lesson_doctrine_status` + `review_audits` table.
- **To Content Production (Núcleo 01):** table `lesson_generator_runs` and write path to `lesson_variants`.
- **To Assessment Engine:** table `assessment_attempts` with FK wiring into `user_competency_progress_events.evidence_attempt_id`.

## 7. Anti-patterns

- **Time-based completion.** Any `is_completed := true WHEN progress >= X` trigger is forbidden. The `auto_complete_lesson` trigger in `00003` is the canonical example of what not to do.
- **ALTER on merged migrations.** Once a migration is merged, deltas go in a new file. Never edit `00013` after it lands.
- **Materialized view for per-student resolved state.** Persona changes in real time; MV lies precisely when it matters.
- **Renaming `competency.slug`** to "fix naming." Slugs are PKs for user history. Deprecate and create new.
- **Writing `is_published = true` from app code or skill.** Only `publish_lesson()` writes it. Period.
- **`jsonb` columns without a versioned JSON Schema** (`schema_version smallint` + CHECK). Unvalidated jsonb becomes landfill.
- **NOT NULL on a doctrinal column added to a pre-existing table** without a backfill plan. You will break production writes on deploy.
- **`SELECT FOR UPDATE` on append-only tables.** There is no row to lock. Use `pg_advisory_xact_lock` instead.
- **`LOCK TABLE`** anywhere. Never.

## 8. Verification checklist

- [ ] Migration file is idempotent (`IF NOT EXISTS`, `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`).
- [ ] Migration has a `-- ROLLBACK:` block with reverse DDL.
- [ ] Every new table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) and at least one explicit policy.
- [ ] Every FK has `ON DELETE` clause explicit (`CASCADE`, `RESTRICT`, or `SET NULL`).
- [ ] Every jsonb column has a JSON Schema check constraint + `schema_version smallint` column.
- [ ] Append-only tables have BEFORE UPDATE/DELETE trigger raising exception.
- [ ] New indexes justified by a concrete query (not speculative).
- [ ] No ALTER of a previously merged migration file.
- [ ] Ran `supabase db reset` locally and all migrations apply clean.
- [ ] `fn_validate_lesson_doctrine` returns at least one new check if the migration adds a doctrinal column.
- [ ] If columns are added to existing non-empty tables, a `_backfill.sql` companion migration exists.
- [ ] Charter §reference cited in the migration header comment.

## 9. Open questions / known limitations

- **Partitioning of `user_journey_history` and `user_competency_progress_events`:** proposed monthly range partitioning but not yet scheduled in a migration. Revisit before first 10k active users.
- **Who owns edits to the competency catalog in production?** Process not defined. Current stance: append-only table, but governance (who can insert, how is it reviewed) is a Scrum Master question unanswered in Round 2.
- **Legacy backfill (`00015b_backfill`):** plan to seed `user_competency_progress_events` for existing students exists in prose, no SQL yet. Depends on Arquiteto finalizing which seed competencies map to which legacy tracks.
- **JSON Schema validator function:** Postgres does not ship with one. Need to pick between `pg_jsonschema` extension, custom plpgsql, or CHECK-on-application. Not decided.
- **`lesson_variants.content_overrides` vs `layout_overrides` separation by RLS role:** proposal is one table, two jsonb columns, role-gated writes. RLS policies not yet written. Needs Security terminal input.
- **Kirkpatrick 4 revenue table:** out of scope for Fase 1. Placeholder only.

DONE.
