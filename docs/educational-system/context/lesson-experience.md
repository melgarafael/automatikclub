# Context — Lesson Experience

## 1. What this area owns

Lesson Experience owns **everything the aluno sees, feels, and touches from the moment they open a lesson URL to the moment they receive feedback on their next action** — the frame inside the chrome. Concretely: lesson page layout, video player shell, chapter navigation, TL;DR/intro rendering, checkpoint UI, evidence submission component, unlock-state messaging, competency graph view, next-action dashboard, and the `PersonaWrapper` runtime that applies Cubo 3D overrides.

This area does NOT own: site chrome/nav/sidebar (Platform UI terminal), the actual lesson content text (Content Production), assessment grading logic (Assessment Engine), schema/migrations (Schema Extensions), or routing between alternative lessons for the same competency (Personalization Router, sub-epic 12). Edit scope is `automatiklabs/src/app/(platform)/learn/**` and `automatiklabs/src/shared/components/lesson/**`.

---

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Parts II (doctrine: Bloom, CBE, Cognitive Load, Kolb), III §3.2–§3.3 (Personas + Cubo 3D), IV §4.1–§4.2 (hierarchy + competencies first-class), VIII (canonical glossary — use these terms exactly).
- **Skill:** `automatiklabs-doctrine` — load before touching any Story in this area.
- **Sibling context docs:**
  - `schema-extensions.md` — canonical table names, function signatures, views. Frontend consumes these.
  - `content-production.md` — lesson spine + variant contract, chapter marks format, anchor concepts.
  - `assessment-engine.md` — evidence kinds, rubric shape, agent-reviewer streaming contract.
  - `pedagogical-workflow.md` — unlock state enum, publish gates.
  - `pedagogical-qa.md` — rubric the lesson must pass before publish.
- **Framework:** this is Next.js App Router **in a modified distribution** — read `node_modules/next/dist/docs/` before writing any route/component code (per `automatiklabs/AGENTS.md`). Do not assume stock Next.js APIs.

---

## 3. Operating principles

1. **CBE is visual, not just backend.** Never render `% watched` in primary surfaces. The primary progress number is `X of Y competencies demonstrated`. If the query returns `lessons_watched_count`, do not render it.
2. **Cubo 3D personalization is structural, not cosmetic.** Differences between personas must be measurable on 9 axes: layout sections visible, TL;DR presence, video default speed, scaffolding level, checkpoint presence, skip-and-prove availability, font scale, tone of next-action messages, evidence threshold. Changing only copy is theater.
3. **Persona is the strongest invariant in fallback.** When resolving a lesson variant, the fallback order relaxes stage first, then layer, last persona. A Zerado must never silently fall into Autodidata content.
4. **One round-trip per lesson render.** Frontend calls `resolve_lesson_for_user(user_id, lesson_id)` once. No fan-out of 5 fetches. If data is missing, expand the RPC — do not add a second fetch.
5. **Honest fallback.** If the exact cube cell does not exist and a fallback variant was served, the UI must show a `<FallbackNotice>`: "esta aula ainda não foi adaptada pro seu perfil — mostrando a versão mais próxima". Silent fallback is forbidden.
6. **Mobile-first.** Every component ships with a 375px layout first, desktop second. The competency graph, 7-Passos stepper, and annotations panel all have mobile variants.
7. **Immediate feedback on submit.** Evidence submission shows streaming agent-reviewer response in ≤5 seconds. Never leave the aluno staring at a generic spinner after submit.
8. **Tone is a design token, not prose.** Rejection/encouragement copy comes from per-persona tone tokens in `src/shared/lib/tone/tokens.ts`, not hand-written in each component.
9. **PersonaWrapper is a reducer, not a branch tree.** One `<PersonaWrapper>` server component reads `{user_context, layout_overrides}` and applies rules. No `if persona === 'zerado' then ComponentA else ComponentB` spread across files.
10. **Never write to `lesson_variants.content_overrides`.** That column belongs to Content Production. This area writes only to `layout_overrides` via role `ui_design_editor`.

---

## 4. Key data structures / interfaces

### 4.1 Primary RPC consumed

`resolve_lesson_for_user(user_id uuid, lesson_id uuid) → jsonb` — called by the lesson server component. Returns:

```ts
type ResolvedLesson = {
  lesson: {
    id: string;
    title: string;
    canonical_spine_id: string;
    chapters: Array<{
      start: number; end: number;
      kind: 'context'|'concept'|'demo'|'practice'|'synthesis'
    }>;
    video_url: string;
    cognitive_load: 1|2|3|4|5;
    kolb_phase: 'experience'|'reflection'|'concept'|'experimentation';
  };
  variant_resolved: {
    stage: 'stage_1'|'stage_2'|'stage_3'|'stage_4'|'stage_5'|'stage_6';
    persona: 'zerado'|'autodidata'|'organizado';
    layer: 'tecnica'|'logica'|'maestria';
    content_overrides: { script_md?: string; tldr?: string };
    layout_overrides: LayoutOverrides;
    fallback_applied: boolean;
    fallback_reason: string | null;
  };
  user_context: { persona; current_stage; preferred_layer };
  competencies_taught: Array<{
    id; slug; bloom_level: 1|2|3|4|5|6; status: CompetencyStatus; framework
  }>;
  unlock_state: {
    unlocked: boolean;
    blocked_by: string[] | null;
    reason_human: string | null;
    next_action: 'submit_evidence'|'watch_lesson'|'wait_review'|'resubmit_after_feedback'|null;
  };
  evidence_requirements: Array<{
    assessment_id; kind: EvidenceKind; passing_threshold; prompt_md
  }>;
};
```

### 4.2 LayoutOverrides contract (PersonaWrapper API)

```ts
type LayoutOverrides = {
  scaffolding_level: 0 | 1 | 2 | 3;      // 0=none, 3=maximum hand-holding
  visible_sections: Array<
    'context'|'concept'|'demo'|'practice'|'synthesis'|'extra_hints'
  >;
  show_checkpoints: boolean;
  video_default_speed: 0.9 | 1.0 | 1.25 | 1.5;
  font_scale: 0.95 | 1.0 | 1.15;
  show_skip_and_prove: boolean;
  show_tldr: boolean;
  annotations_panel: 'hidden'|'collapsed'|'always_open';
  tone_token: 'zerado_warm' | 'autodidata_terse' | 'organizado_structured';
};
```

Authored into `lesson_variants.layout_overrides jsonb`. When absent, defaults derived deterministically from `(persona, stage, layer)` via `deriveDefaultOverrides()` in `src/shared/lib/persona/derive-overrides.ts`. No lesson needs manual overrides to ship.

### 4.3 Secondary RPCs consumed

- `get_competency_graph_for_track(user_id, track_id)` → feeds `<CompetencyGraph>`
- `get_next_action_for_user(user_id)` → feeds dashboard post-login
- `get_unlock_reason(user_id, lesson_id)` → feeds blocked-lesson modal
- `get_progress_snapshot(user_id)` → feeds header progress chip

For all signatures, see `schema-extensions.md`.

### 4.4 Components owned by this area

| Component | Path | Purpose |
|---|---|---|
| `<PersonaWrapper>` | `src/shared/components/lesson/persona-wrapper.tsx` | Applies LayoutOverrides to children. Server component. |
| `<LessonPlayer>` | `src/shared/components/lesson/player.tsx` | Video + chapter marks + speed control. |
| `<ChapterNav>` | `src/shared/components/lesson/chapter-nav.tsx` | Auto-skips `context` chapters for Autodidata. |
| `<EvidenceSubmitter>` | `src/shared/components/lesson/evidence-submitter.tsx` | Single component, 5 evidence kinds. Co-owned with Assessment Engine. |
| `<CompetencyGraph>` | `src/shared/components/learn/competency-graph.tsx` | react-flow graph of competencies for a track. Replaces lesson list. |
| `<UnlockReasonModal>` | `src/shared/components/learn/unlock-reason.tsx` | Shown when clicking a blocked lesson. Distinguishes "not tried" vs "in review". |
| `<NextActionCard>` | `src/shared/components/learn/next-action.tsx` | Post-login dashboard card. Uses tone tokens per persona. |
| `<FallbackNotice>` | `src/shared/components/lesson/fallback-notice.tsx` | Honest "showing closest variant" banner. |

---

## 5. Decision protocols

**D1 — Missing variant for user's cube cell.**
Call `resolve_lesson_for_user`, trust the `variant_resolved`. If `fallback_applied=true`, render `<FallbackNotice>` above the lesson. Never hide it. Never short-circuit to a generic layout on the client.

**D2 — Which tone token to use.**
Read `layout_overrides.tone_token`. If absent, derive from `user_context.persona`: zerado → `zerado_warm`, autodidata → `autodidata_terse`, organizado → `organizado_structured`. Never hand-write copy directly in a component.

**D3 — Bloom ≥ 5 evidence submission.**
If `competencies_taught[*].bloom_level >= 5`, the `<EvidenceSubmitter>` must disable `kind='quiz'` (Assessment Engine enforces server-side too — UI enforces so the aluno never sees the option). Show "este conteúdo exige entrega de artefato" hint.

**D4 — Blocked lesson click.**
Always call `get_unlock_reason`. If `pending_reviews.length > 0`, show "em revisão, ETA ~X min" using `mv_review_queue_eta`. If `missing_competencies.length > 0`, show "falta demonstrar: [links to closest lessons]". Never show a generic "bloqueado".

**D5 — Mobile vs desktop layout.**
If viewport < 768px: `<CompetencyGraph>` collapses to a vertical timeline with current + next 3 nodes. `<LessonPlayer>` fills viewport, chapter nav slides up from bottom. Annotations panel becomes a bottom sheet.

**D6 — Evidence submit feedback.**
On submit, open SSE stream to `POST /api/assessments/:id/attempt` (Pedagogical Workflow owns the endpoint). Render partial agent-reviewer output in a dedicated pane under the form. Never a generic spinner.

---

## 6. Hand-offs

### From other areas

- **From Schema Extensions:** SQL functions `resolve_lesson_for_user`, `get_competency_graph_for_track`, `get_next_action_for_user`, `get_unlock_reason`, `get_progress_snapshot`; materialized views `mv_user_competency_snapshot`, `mv_lesson_variant_index`, `mv_review_queue_eta`; role `ui_design_editor`; enums `journey_stage`, `learner_persona`, `mastery_layer`.
- **From Content Production:** videos with chapter marks (`context|concept|demo|practice|synthesis`) and anchor concepts in lesson frontmatter. Without chapter marks, the Autodidata/Zerado wrappers degrade.
- **From Assessment Engine:** the 5 evidence kinds schema + SSE agent-reviewer contract + rubric display data for pre-submit view.
- **From Instructional Design:** canonical wrapper contract document (which `layout_overrides` fields are required per persona) + the list of cube cells prioritized for Fase 1.
- **From Pedagogical Workflow:** `unlock_state` enum shape, publish gates.

### To other areas

- **To Pedagogical QA:** rendered lesson structure that passes their `pedagogical-gate-rubric` (structural check only). Expose `data-testid` attribute on every Kolb phase section so E2E can audit structure.
- **To Platform UI (Frontend Dev):** the outer frame (chrome) leaves a `<main id="lesson-frame">` slot where this area mounts. This area declares required CSS custom properties (`--lesson-font-scale`, `--lesson-tone-color`).
- **To Personalization Router (Shell #3):** telemetry on `fallback_applied` events so the router can learn which cube cells are most needed.

---

## 7. Anti-patterns

- **Rendering `%` of video watched as a primary progress signal.** Dead on sight.
- **Writing `if (persona === 'zerado')` inside components.** Use `<PersonaWrapper>` and tone tokens. Branching belongs in `src/shared/lib/persona/` only.
- **Hiding a fallback.** If `fallback_applied=true` and `<FallbackNotice>` is not rendered, it is a bug.
- **Making 2+ RPC calls to render a lesson.** Expand the RPC or add a field — do not fan out.
- **Adding copy strings directly in JSX.** Copy lives in `src/shared/lib/tone/tokens.ts` keyed by tone_token.
- **Writing to `lesson_variants.content_overrides`.** Not our column. RLS will reject, but do not attempt it.
- **Shipping a component without a 375px layout.** Mobile-first is a ship gate.
- **Generic spinners on submit.** Must stream agent feedback.
- **Rendering "bloqueado" without reason.** Always call `get_unlock_reason`.
- **Relaxing persona first in fallback order.** Persona is the strongest invariant. Relaxing persona in fallback is a doctrine violation.

---

## 8. Verification checklist

- [ ] Component has a 375px layout (tested in Playwright at viewport 375px).
- [ ] Component uses `<PersonaWrapper>` and/or tone tokens — no inline persona branches.
- [ ] Only `resolve_lesson_for_user` (or one of the 4 secondary RPCs) is called; no extra fetches for personalization data.
- [ ] `<FallbackNotice>` is rendered when `fallback_applied=true`.
- [ ] No `% watched` or `lessons_watched_count` rendered on primary surfaces.
- [ ] Evidence submission shows streaming feedback (or a documented stub for Fase 1 pre-SSE).
- [ ] Blocked-lesson clicks route through `<UnlockReasonModal>` with distinction between "not tried" and "in review".
- [ ] Tone tokens imported from `src/shared/lib/tone/tokens.ts` — no hardcoded PT strings.
- [ ] `data-testid` attributes on each Kolb section for QA E2E.
- [ ] Playwright test exercises two canonical cells: `(stage_1, zerado, tecnica)` and `(stage_4, autodidata, logica)`, asserting at least 5 of the 9 differentiation axes differ.
- [ ] No write to `lesson_variants.content_overrides` (grep the diff).
- [ ] No new `if (persona === ...)` conditionals outside `src/shared/lib/persona/`.

---

## 9. Open questions / known limitations

- **Streaming agent-reviewer contract** — Assessment Engine has not finalized the SSE event shape. Fase 1 stub: polling endpoint returning partial state every 2 seconds. Replace with SSE when Assessment Engine ships.
- **Cube cells prioritized for Fase 1** — Instructional Design has not yet published the definitive list. Working assumption: 12 cells = stages 1–3 × {zerado, autodidata} × {tecnica, logica}. Confirm before producing variant-specific UI copy.
- **Wrapper contract document** — Instructional Design owes the canonical list of required `layout_overrides` per persona. Until it lands, use `deriveDefaultOverrides()` fallback defaults.
- **`record_user_context_change` function** — required for persona/stage self-change UI. Confirm with Schema Extensions before building the settings screen.
- **ETA data for `mv_review_queue_eta`** — the matview is empty until real reviews accumulate. Seed with a heuristic constant (agent=2min, human=4h) during Fase 1.
- **Next.js distribution quirks** — this codebase uses a non-stock Next.js distribution. Any new route, layout, or server-component API must be verified against `node_modules/next/dist/docs/` before use.
- **Annotations persistence for Organizado** — not yet scoped. Assume per-user lesson notes stored in `user_lesson_notes` (table not yet created). Flag as blocker if a Story requires it.
- **Inter-persona migration** — if a user changes persona mid-track, past lessons keep the variant they were consumed in. Revisit if feedback contradicts this assumption.
