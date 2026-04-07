# Context — Instructional Design

## 1. What this area owns

Instructional Design owns the **pedagogical architecture** of every Formação, Track, and Course in the AutomatikLabs Educational System. Concretely, this area decides: (a) the canonical **competency catalog** (`competency_catalog_v1.yaml`), (b) the **`learning_design_doc.yaml`** for each course (Backward Design output: terminal outcome → terminal competencies → enabling competencies → lesson skeleton), (c) the Bloom level + Kolb phase + cognitive load budget of each lesson slot, and (d) the Cubo 3D cells (Estágio × Persona × Camada) a course is authorized to serve.

This area does NOT own: prose of lesson scripts (Content Production), rubric construction (Assessment Engine), database schema (Schema Extensions), UI rendering (Lesson Experience), or publication gates as code (Pedagogical Workflow / Pedagogical QA). The boundary: Instructional Design says **what must be learned and how it decomposes**; others say how it gets produced, validated, stored, and rendered.

---

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Parts I (propósito), II (doutrina pedagógica — all 6 frameworks + 5 metodologias proprietárias), III (modelo de aluno — Cubo 3D), IV §4.1–§4.4 (decisões arquiteturais), VIII (glossário canônico — vocabulary is law).
- **Skill:** `automatiklabs-doctrine` — load before ANY task in this area. This is not optional.
- **Sibling context docs** (load when work crosses boundaries):
  - `schema-extensions.md` — when changing `competencies`, `lesson_competencies`, `competency_prerequisites`, or `user_competency_progress` shape
  - `content-production.md` — when emitting `learning_design_doc.yaml` (Content Production is the consumer)
  - `assessment-engine.md` — when defining `competency.yaml` `rubric_requirements` (Assessment Engine is the consumer)
  - `pedagogical-qa.md` — when proposing criteria for `fn_validate_lesson_doctrine`

---

## 3. Operating principles

1. **Backward Design is the spine — no exceptions.** Every course YAML starts with `desired_outcome` (Kirkpatrick L4 statement tied to a `revenue_milestone_slug`). Terminal competencies come next; enabling competencies are derived from terminal ones, never the reverse. A course that cannot state its outcome in monetization-relevant terms is rejected.
2. **Bloom calibration is binding, not decorative.** Every competency declares `bloom_level ∈ 1..6` with `bloom_verb_anchors`. Terminal competencies of any track MUST include at least one with `bloom_level >= 5`. Auto-rebaixamento (downgrading to Bloom 3 if honest) is preferred over inflation — inflating Bloom adds mandatory human review friction without pedagogical gain.
3. **CBE: progress is competency, not time.** The unit of student advancement is `user_competency_progress.status='approved'`, never `lesson_completions`. Any artifact you author that implies "% concluído por tempo" is a doctrine violation.
4. **Cognitive load budget per lesson is hard.** `new_concepts_max: 1` per lesson (Sweller). If a competency requires 2 new concepts, split into 2 lessons. This rule is not negotiable and is enforced by QA's hard-fail criteria.
5. **Bloom ≥ 5 = `reviewer_type='human'` always.** No exceptions. Encoded in DB as CHECK constraint. Marking Bloom 5 means the author accepts mandatory human review. Marking Bloom 3 when honest is doctrinally correct.
6. **Cube is sparse by design.** A competency does NOT need a variant in every (stage × persona × layer) cell. Spine cell is always `(stage:3, persona:organizado, layer:logica)`. Absence from a cube cell is doctrinally correct if the competency genuinely doesn't apply there — it is not a gap to fill.
7. **Vocabulary is law.** Charter Part VIII terms are mandatory: "agente humanizado" (not "bot"), "trilha"/"track", "formação"/"formation", "competência"/"competency". The `lesson-content-linter` blocks PRs that violate this.
8. **Catalog is YAML in git, never ad-hoc DB edits.** `competency_catalog_v1.yaml` is the source of truth; migration `00013_competencies.sql` seeds from it. Catalog changes require a PR with Arquiteto + QA Review as reviewers.
9. **Three things, always: Método, Construção, Negociação.** Every Formação must teach all three (Charter §2.3). A course YAML missing one of the three is rejected at PR review.
10. **Kolb cycle coverage per module is mandatory.** No module should be purely conceptual or purely experiential. All 4 Kolb phases (experience / reflection / concept / experimentation) must be visible across a module's lessons.

---

## 4. Key data structures / interfaces

### 4.1 `competency_catalog_v1.yaml` (produced here, consumed by all areas)

Lives at `automatiklabs/docs/educational-system/curriculum/competency_catalog_v1.yaml`.

```yaml
- competency_id: comp-fluxo-justificar-arquitetura
  slug: fluxo-justificar-arquitetura
  title: "Justificar a arquitetura de um fluxo de automação para stakeholder não-técnico"
  description: "..."
  bloom_level: 5
  bloom_verb_anchors: [justificar, defender, comparar, recomendar, criticar]
  framework: empresa-ia-humanizada    # or: 3-camadas | 7-passos | 3-cs | null
  pilar: 1                            # only when framework=empresa-ia-humanizada
  maestria_layer: maestria            # tecnica | logica | maestria
  prerequisites: [comp-fluxo-mapear-end-to-end, comp-fluxo-identificar-gargalo]
  unlocks_stage_transition: 3_to_4   # null if not stage-gating
  reviewer_type: human                # human required when bloom_level >= 5
  performance_task:
    artifact_kind: written_decision_document
    duration_estimate_min: 60
    prompt: "..."
  rubric_requirements:
    must_assess:
      - {criterion: justificacao_explicita, passing_threshold: required}
      - {criterion: alternativas_consideradas, passing_threshold: required}
      - {criterion: linguagem_acessivel, passing_threshold: weighted}
    must_not_accept:
      - "Resposta puramente descritiva sem julgamento (Bloom 2, não 5)"
  acceptable_assessment_variants:
    - {persona: organizado,  format_hint: "documento estruturado"}
    - {persona: autodidata,  format_hint: "bullets densos + tabela trade-offs"}
  audit_signals:
    approval_rate_target_range: [0.55, 0.85]
    persona_approval_variance_max: 0.15
```

### 4.2 `learning_design_doc.yaml` (produced here, consumed by Content Production)

One file per course at `automatiklabs/docs/educational-system/curriculum/<formation>/<track>/<course>.yaml`.

```yaml
course_id: course-empresa-ia-pilar1-fluxo-v1
track_id: track-empresa-ia-humanizada-v1
formation_tag: empresa-com-ia-humanizada
version: 1.0.0
status: draft   # draft | review | approved | locked

desired_outcome:
  kirkpatrick_level: 4
  statement: "Aluno fecha primeiro contrato pago de mapeamento de fluxo de trabalho..."
  evidence_milestone_slug: revenue-first-paid-flow-mapping

terminal_competencies:    # Bloom >= 5 required
  - {competency_id: comp-fluxo-mapear-end-to-end, bloom_level: 6}
  - {competency_id: comp-fluxo-justificar-arquitetura, bloom_level: 5}
enabling_competencies:    # DAG, prerequisites listed
  - {competency_id: comp-fluxo-identificar-gargalo, bloom_level: 4, prerequisites: [comp-fluxo-entrevistar-stakeholder]}

target_cube_cells:
  spine_cell: {stage: 3, persona: organizado, layer: logica}
  required_variants:
    - {stage: 3, persona: zerado, layer: tecnica}

lesson_skeleton:
  - lesson_slug: 01-mapeando-processo-atual
    teaches_competencies: [comp-fluxo-identificar-gargalo]
    bloom_target: 3
    kolb_focus: experiencia_concreta    # | observacao_reflexiva | conceituacao | experimentacao_ativa
    cognitive_load_budget_min: 12
    new_concepts_max: 1
    methodology_step: {framework: empresa-ia-humanizada, pilar: 1, position: 1}

terminal_performance_task:
  artifact_kind: client_proposal_with_flow_diagram
  prompt: "..."
  graded_by: human
```

### 4.3 Inputs consumed

- `competencies` table (read-only) — verify catalog is in sync with DB seed
- `pedagogical_reviews` (read) — detect `bloom_assessed` divergence from `bloom_target` to flag author calibration drift

---

## 5. Decision protocols

1. **Where does the spine cell of a new course go?** Always `(stage:3, persona:organizado, layer:logica)`. This is the center of gravity of the cube — do not improvise.
2. **A course requires 2 new concepts in one lesson — what to do?** Split the lesson. Update `lesson_skeleton` to add a new entry. Re-check Kolb cycle coverage across the module afterwards.
3. **A competency has no honest Bloom 5 framing for Persona Zerado at Estágio 3 — generate a variant anyway?** No. Leave the cube cell empty. Document the absence in the course YAML under `target_cube_cells` (do not list it in `required_variants`). Move the competency forward to a later stage if needed.
4. **A new competency emerges during course design — add it directly to the catalog?** No. Open a PR against `competency_catalog_v1.yaml` with the full spec (§4.1 shape). PR requires Arquiteto + QA Review approval. Migration follows as `00013_competencies__add_v1.X.sql`.
5. **Author requests Bloom 5 for a lesson that looks like Bloom 3 — what to do?** Push back via the `bloom_assessed` mechanism: approve the lesson at Bloom 3, document the divergence. Do not relabel to keep the author happy — calibration drift is a tracked signal.
6. **A track's `desired_outcome` cannot be tied to a `revenue_milestone_slug` — can it still publish?** No, unless explicitly marked `kirkpatrick_level: 2` or `3` AND the track is tagged as scaffolding (not a full Formação). A standalone Formação MUST have a Kirkpatrick L4 outcome.

---

## 6. Hand-offs

- **From Schema Extensions:** confirmation that `competencies`, `lesson_competencies`, `competency_prerequisites` (DAG), `user_competency_progress_events`, `pedagogical_reviews`, and `revenue_milestones` exist with the shapes agreed in brainstorm rounds 2/3. The function `fn_validate_lesson_doctrine(lesson_id)` is the canonical interface — this area supplies the criteria list; Schema Extensions implements it.
- **From Pedagogical QA:** the 8 hard-fail criteria of the `pedagogical-gate-rubric` (QA owns these; Instructional Design writes the first version and QA refines). Criteria must map 1:1 with checks inside `fn_validate_lesson_doctrine`.
- **To Content Production:** `learning_design_doc.yaml` per course, `competency_catalog_v1.yaml` (read-only). SLA: first complete course YAML within 5 business days of Fase 1 start; subsequent courses within 2 business days each.
- **To Assessment Engine:** `competency.yaml` shape with `rubric_requirements` (`must_assess` + `must_not_accept` + `acceptable_assessment_variants`). Assessment Engine builds rubrics from this; Instructional Design does not build rubrics.
- **To Pedagogical Workflow:** the list of state transitions that must be enforced as `fn_promote_competency` checks (e.g., `bloom_demonstrated >= competency.bloom_level` to mark `mastered`).
- **To Lesson Experience:** confirmation that `methodology_step` in `lessons` is derived from `lesson_competencies.position_in_framework`, not a free field, so the 7-Passos stepper cannot lie.

---

## 7. Anti-patterns

- **Forward design.** Starting with "vamos fazer um curso sobre n8n" without first defining the outcome and terminal competencies. Always open with `desired_outcome` or stop.
- **Bloom inflation.** Marking everything Bloom 5–6 "to raise the bar." Increases human review friction without pedagogical gain and corrupts the inverse-incentive designed into the system.
- **Adding competencies directly in the database.** Always via YAML + PR, never via direct DB insert.
- **Generating 54 cube cells.** Cube is sparse. Generate only `spine_cell` + cells explicitly listed in `target_cube_cells.required_variants`.
- **"% concluído por tempo" in any user-facing artifact.** Banned. UI shows competencies, never minutes watched.
- **Using "bot", "chatbot", or "assistente virtual"** in any YAML or markdown field. Vocabulary is doctrine.
- **Writing the `script_md` yourself.** Instructional Design's jurisdiction ends at the lesson skeleton + metadata. Prose belongs to Content Production.
- **Allowing a Formação to ship without all three: Método + Construção + Negociação** (Charter §2.3).

---

## 8. Verification checklist

- [ ] `learning_design_doc.yaml` validates against the §4.2 shape: all required fields present.
- [ ] All `competency_id`s referenced exist in `competency_catalog_v1.yaml`.
- [ ] `terminal_competencies` includes at least one with `bloom_level >= 5`.
- [ ] `desired_outcome.kirkpatrick_level == 4` AND `evidence_milestone_slug` is set (or scaffolding exception is documented).
- [ ] `target_cube_cells.spine_cell == {stage:3, persona:organizado, layer:logica}`.
- [ ] Every `lesson_skeleton` entry has `bloom_target`, `kolb_focus`, `cognitive_load_budget_min`, `new_concepts_max <= 1`.
- [ ] Kolb cycle (4 phases) is covered across the lessons of each module — no module is purely conceptual or purely experiential.
- [ ] Three pillars (Método, Construção, Negociação) are all covered somewhere in the Formação's tracks.
- [ ] `competency_prerequisites` form a DAG (no cycles); verified by inspection or `bin/check-competency-dag.sh`.
- [ ] No banned vocabulary in any string field (run `lesson-content-linter` if available).
- [ ] If a new competency was added: catalog PR + DB migration `00013_competencies__add_v1.X.sql` are linked.
- [ ] PR includes link to Charter section justifying any new framework field.

---

## 9. Open questions / known limitations

- **`revenue_milestones` table** — accepted in brainstorm Round 3 (co-owned with Assessment Engine) but not yet in any agreed migration. Until it exists, `evidence_milestone_slug` in course YAMLs is a forward reference. Do not block course authoring on it; document the dependency.
- **Onboarding diagnostic micro-trilha** — the story that gives new users their initial `current_stage`, `persona`, and `preferred_layer` is not yet written. Until it is, assume self-declaration with the first `user_journey_history` row created at signup with `reason='self_declared'`.
- **Starred skills** in Charter §4.6 (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`, `empresa-ia-humanizada`) do not exist yet. Until they do, operate with the doctrine skill + manual application of the frameworks. Do not invoke a starred skill — it will fail.
- **Catalog versioning beyond v1** — a multi-version policy (v1.1, v2) is undefined. Decide when needed.
- **Multi-language** — system is PT-BR only. Do not introduce a `language` field speculatively.
- **Backpressure on the lesson generator** (Content Production proposal: stop generation when human review queue > 20 for 3 days) — accepted in principle but not yet wired. Tracked as dependency on Pedagogical Workflow.
