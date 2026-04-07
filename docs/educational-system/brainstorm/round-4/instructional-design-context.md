# Context — Instructional Design

**Owner terminal:** Arquiteto · **Sub-epic:** 04 — Instructional Design
**Last update:** 2026-04-06 (Brainstorm Fase 0, post-Round 3)

---

## 1. What this area owns

Instructional Design owns the **pedagogical architecture** of every Formação, Track, and Course in the AutomatikLabs Educational System. Concretely, this area decides: (a) the canonical **competency catalog** (`competency_catalog_v1.yaml`), (b) the **`learning_design_doc.yaml`** for each course (Backward Design output: terminal outcome → terminal competencies → enabling competencies → lesson skeleton), (c) the Bloom level + Kolb phase + cognitive load budget of each lesson slot, (d) the cube cells (Estágio × Persona × Camada) a course is allowed to serve. **It does NOT own:** prose of lesson scripts (Nucleo 01), rubric construction (Nucleo 02), database schema (Database), UI rendering (Lesson Experience), publication gates as code (Backend Dev/QA Review). The boundary: Instructional Design says **what must be learned and how it decomposes**; others say how it gets produced, validated, stored, and rendered.

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Parts I (propósito), II (doutrina pedagógica — frameworks + metodologias proprietárias), III (modelo de aluno — Cubo 3D), IV (decisões arquiteturais §4.1–4.4), VIII (glossário canônico, vocabulário obrigatório).
- **Skill:** `automatiklabs-doctrine` — load before ANY task in this area.
- **Sibling context docs (load when work crosses boundaries):**
  - `schema-extensions-context.md` — when changing competencies/lesson_competencies/user_competency_progress shape
  - `content-production-context.md` — when emitting `learning_design_doc.yaml` (Nucleo 01 is the consumer)
  - `assessment-engine-context.md` — when defining `competency.yaml` rubric_requirements (Nucleo 02 is the consumer)
  - `pedagogical-qa-context.md` — when proposing checks for `fn_validate_lesson_doctrine`

## 3. Operating principles

1. **Backward Design is the spine — no exceptions.** Every course YAML starts with `desired_outcome` (Kirkpatrick L4 statement, ideally tied to a `revenue_milestone_slug`). Terminal competencies come next. Enabling competencies are derived from terminal ones, not the reverse. If a course cannot state its outcome in monetization-relevant terms, it is rejected.
2. **Bloom calibration is binding, not decorative.** Every competency declares `bloom_level ∈ 1..6` with `bloom_verb_anchors`. Terminal competencies of any track MUST include at least one with `bloom_level >= 5`. Authors who routinely overshoot Bloom (autor declara 5, reviewer constata 3) are flagged via `bloom_assessed` divergence.
3. **CBE: progress is competency, not time.** The unit of student advancement is `user_competency_progress.status='approved'`, never `lesson_completions`. Any artifact you author that implies "% concluído por tempo" is a doctrine violation.
4. **Cognitive load budget is per-lesson and hard.** `new_concepts_max: 1` per lesson (Sweller). If a competency requires 2 new concepts, split into 2 lessons. The skeleton enforces this; do not waive.
5. **Cube is sparse by design.** A competency does NOT need a variant in every (stage × persona × layer) cell. Some Bloom 5–6 competencies legitimately do not exist for Persona Zerado at early Estágios — that absence is doctrinally correct, not a gap to fill. Spine cell = `(stage:3, persona:organizado, layer:logica)` always.
6. **Vocabulário canônico (Charter Part VIII) is law.** Use "agente humanizado" — never "bot", "chatbot", "assistente virtual". Use "trilha"/"track", "formação"/"formation", "competência"/"competency". The `lesson-content-linter` will block PRs that violate this.
7. **Bloom ≥ 5 = `reviewer_type='human'` always.** No exceptions. Encoded in DB as CHECK constraint via `pedagogical_reviews`.
8. **Auto-rebaixamento de Bloom is preferred over inflation.** If a competency can be honestly taught at Bloom 3, write it at 3. Do not climb to 5 "for elegance" — it adds friction (mandatory human review) without pedagogical gain.
9. **Catalog is YAML in git, never ad-hoc DB edits.** `competency_catalog_v1.yaml` is the source of truth; the migration `00013_competencies.sql` seeds from it. Catalog changes go via PR with 2 reviewers (Arquiteto + QA Review).
10. **Three things, always: Método, Construção, Negociação.** Every Formação must teach all three (Charter §2.3). A course YAML missing one of the three is rejected at PR review.

## 4. Key data structures / interfaces

### 4.1 `competency_catalog_v1.yaml` (you produce, everyone consumes)

Lives at `automatiklabs/docs/educational-system/curriculum/competency_catalog_v1.yaml`. One entry per competency.

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
  unlocks_stage_transition: 3_to_4    # null if not stage-gating
  reviewer_type: human                # human required when bloom_level >= 5
  performance_task:
    artifact_kind: written_decision_document
    duration_estimate_min: 60
    prompt: "..."
  rubric_requirements:
    must_assess:
      - {criterion: justificacao_explicita, passing_threshold: required, ...}
      - {criterion: alternativas_consideradas, passing_threshold: required, ...}
      - {criterion: linguagem_acessivel, passing_threshold: weighted, ...}
    must_not_accept:
      - "Resposta puramente descritiva sem julgamento (Bloom 2, não 5)"
  acceptable_assessment_variants:
    - {persona: organizado,  format_hint: "documento estruturado"}
    - {persona: autodidata,  format_hint: "bullets densos + tabela trade-offs"}
  audit_signals:
    approval_rate_target_range: [0.55, 0.85]
    persona_approval_variance_max: 0.15
```

Full shape: see `round-3/instructional-design.md` Dialogue 2.

### 4.2 `learning_design_doc.yaml` (you produce, Nucleo 01 consumes)

One file per course at `automatiklabs/docs/educational-system/curriculum/<formation>/<track>/<course>.yaml`. Required fields (full example in `round-3/instructional-design.md` Dialogue 1):

```yaml
course_id: course-empresa-ia-pilar1-fluxo-v1
track_id: track-empresa-ia-humanizada-v1
formation_tag: empresa-com-ia-humanizada
version: 1.0.0
status: draft   # draft | review | approved | locked

desired_outcome:
  kirkpatrick_level: 4
  statement: "..."
  evidence_milestone_slug: revenue-first-paid-flow-mapping

terminal_competencies:    # Bloom >= 5 required
  - {competency_id: ..., bloom_level: 6}
enabling_competencies:    # DAG, prerequisites listed
  - {competency_id: ..., bloom_level: 4, prerequisites: [...]}

target_cube_cells:
  spine_cell: {stage: 3, persona: organizado, layer: logica}
  required_variants:
    - {stage: 3, persona: zerado, layer: tecnica}

lesson_skeleton:
  - lesson_slug: 01-mapeando-processo-atual
    teaches_competencies: [...]
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

### 4.3 Inputs you consume

- `competencies` table (read-only) — to verify catalog is in sync with DB seed
- `pedagogical_reviews` (read) — to detect `bloom_assessed` divergence from `bloom_target` and flag author calibration drift

## 5. Decision protocols

1. **Where do I put the spine cell of a new course?** Always `(stage:3, persona:organizado, layer:logica)`. This is the center of gravity of the cube — minimum distortion in any direction. Do not improvise.
2. **A course requires 2 new concepts in one lesson — what do I do?** Split the lesson. Update `lesson_skeleton` to add a new entry. Re-check Kolb cycle coverage across the module afterwards.
3. **A competency has no honest Bloom 5 framing for Persona Zerado at Estágio 3 — do I generate a variant anyway?** No. Leave the cube cell empty. Document the absence in the course YAML under `target_cube_cells` (do not list it in `required_variants`). Move that competency forward to a later stage if needed.
4. **A new competency emerges during course design — do I add it to the catalog directly?** No. Open a PR against `competency_catalog_v1.yaml` with the full spec (§4.1 shape). PR requires Arquiteto + QA Review approval. Migration follows as `00013_competencies__add_v1.X.sql`.
5. **Author (Nucleo 01 or human professor) requests Bloom 5 for a lesson that I think is Bloom 3 — what do I do?** Push back via the `bloom_assessed` mechanism: approve the lesson at Bloom 3, document the divergence, and let the drift detector accumulate signal. Do not relabel to keep the author happy.
6. **A track's `desired_outcome` cannot be tied to a `revenue_milestone_slug` — can it still be published?** No, unless explicitly marked `kirkpatrick_level: 2` or `3` AND the track is tagged as scaffolding (not a full Formação). A standalone Formação MUST have a Kirkpatrick L4 outcome.
7. **Three of the 6 Charter frameworks (Backward Design, Bloom, Kolb) seem to overlap — which wins on conflict?** They don't conflict if applied in pipeline order: Backward Design (defines outcome) → CBE (defines unit of progress) → Bloom (calibrates depth) → Cognitive Load (budgets capacity) → Kolb (sequences moments). If you find a conflict, you skipped a step.

## 6. Hand-offs

- **From Database (`schema-extensions`):** confirmation that `competencies`, `lesson_competencies`, `competency_prerequisites` (DAG, separate from `parent_competency_id`), `user_competency_progress`, `pedagogical_reviews`, `revenue_milestones` exist with the shapes agreed in Round 2/3. The function `fn_validate_lesson_doctrine(lesson_id)` is the canonical interface — you supply the list of checks; Database implements.
- **From QA Review (`pedagogical-qa`):** the 12-15 critérios of `pedagogical-gate-rubric`. You write the first version of those critérios; QA refines and owns ongoing maintenance. They must be 1:1 with the checks inside `fn_validate_lesson_doctrine`.
- **To Nucleo 01 (`content-production`):** `learning_design_doc.yaml` per course, `competency_catalog_v1.yaml` (read-only). SLA: first complete course YAML in ≤5 business days after Fase 1 starts; subsequent courses in ≤2 business days each.
- **To Nucleo 02 (`assessment-engine`):** `competency.yaml` shape with `rubric_requirements` (must_assess + must_not_accept + acceptable_assessment_variants). They build rubrics from this; you do not build rubrics.
- **To Backend Dev (`pedagogical-workflow`):** the list of state transitions that must be enforced as `fn_promote_competency` checks (e.g., `bloom_demonstrated >= competency.bloom_level` to mark `mastered`).
- **To Lesson Experience (`lesson-experience`):** confirmation that `methodology_step` in `lessons` is **derived** from `lesson_competencies.position_in_framework`, not a free field, so the 7-Passos stepper cannot lie.

## 7. Anti-patterns

- **Forward design.** "Vamos fazer um curso sobre n8n" without first defining the outcome and terminal competencies. Always reject — open with `desired_outcome` or stop.
- **Bloom inflation.** Marking everything Bloom 5–6 to "raise the bar". Increases human review friction without pedagogical gain; corrupts the inverse-incentive.
- **Adding competencies directly in the database.** Always go via YAML + PR.
- **Generating 54 cube cells.** Cube is sparse. Generate only `spine_cell` + cells listed in `target_cube_cells.required_variants`.
- **"% concluído por tempo" anywhere in user-facing artifacts.** Banido. UI shows competencies, never minutes watched.
- **Treating "agente humanizado" as a synonym for "bot"** in YAML, lesson markdown, or any artifact. Vocabulary is doctrine.
- **Writing the script_md yourself.** Your jurisdiction ends at the lesson skeleton + metadata. Prose belongs to Nucleo 01 and human authors.
- **Allowing a Formação to ship without all three: Método + Construção + Negociação** (Charter §2.3).

## 8. Verification checklist

Before considering an Instructional Design task done:

- [ ] `learning_design_doc.yaml` validates against schema (use `bin/validate-curriculum-yaml.sh` if it exists, else manual check against §4.2 shape).
- [ ] All `competency_id`s referenced exist in `competency_catalog_v1.yaml`.
- [ ] `terminal_competencies` includes at least one with `bloom_level >= 5`.
- [ ] `desired_outcome.kirkpatrick_level == 4` AND `evidence_milestone_slug` is set (or scaffolding exception is documented).
- [ ] `target_cube_cells.spine_cell == {stage:3, persona:organizado, layer:logica}`.
- [ ] Every `lesson_skeleton` entry has `bloom_target`, `kolb_focus`, `cognitive_load_budget_min`, `new_concepts_max <= 1`.
- [ ] Kolb cycle (4 phases) is covered across the lessons of each module — no module is purely "conceito" or purely "experiência".
- [ ] Three pillars (Método, Construção, Negociação) are all covered somewhere in the Formação's tracks.
- [ ] `competency_prerequisites` form a DAG (no cycles); verified by inspection or `bin/check-competency-dag.sh`.
- [ ] PR includes link to Charter section justifying any new framework field.
- [ ] No vocabulário banido in any string field (run `lesson-content-linter` if available).
- [ ] If a new competency was added: catalog PR + DB migration `00013_competencies__add_v1.X.sql` are linked.

## 9. Open questions / known limitations

- **`revenue_milestones` table** — proposed in my Round 2 lacuna, accepted in Round 3 dialogue with Nucleo 02 as co-owner, but not yet in any agreed migration. Until it exists, `evidence_milestone_slug` in course YAMLs is a forward reference. Do not block course authoring on it; document the dependency.
- **Onboarding diagnostic micro-trilha** (how a new user gets initial `current_stage` / `persona` / `preferred_layer`) — story `INSTR-ONBOARD-01` is unwritten. Until then, assume users self-declare and that the first `user_journey_history` row is created at signup with `reason='self_declared'`.
- **Skill atomicas marcadas com `*`** in Charter §4.6 (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`, `empresa-ia-humanizada`) **do not exist yet**. Until they do, this area operates with the doctrine skill + manual application of frameworks. Do not invoke a starred skill — it will fail.
- **Catalog versioning policy beyond v1** — single-version catalog is fine for Fase 1; multi-version (v1.1, v2) policy is undefined. When the second version is needed, decide then.
- **Multi-language** — system is PT-BR only. `language` field is not in any YAML shape. Do not introduce it speculatively.
- **Backpressure on the lesson generator** (Nucleo 01 R1 proposal: stop generation when human review queue > 20 for 3 days) — not yet endorsed by Backend Dev or QA. Open in Round 4+.

DONE.
