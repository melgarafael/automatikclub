# Context — Content Production

## 1. What this area owns

Content Production owns the **lesson generation pipeline**: turning a structured Learning Design Document (LDD, produced by Instructional Design) into a narrative `script_md` plus structured frontmatter, plus persona/stage/layer variants of that script via `spine-transformer`. This area decides HOW the lesson is told (narrative spine, didactic structure, examples, microcopy embedded in script).

This area does NOT decide: WHAT competency is taught (Instructional Design), HOW it is assessed (Assessment Engine), HOW it is rendered visually (Lesson Experience), WHERE it sits in the catalog (Scrum Master / Curriculum Orchestration), or whether it can be published (Pedagogical QA + DB triggers). Every generated lesson is provisional: it enters as `is_published=false` with a `pedagogical_reviews` row at `status='pending'`.

---

## 2. Required pre-reading

- **Charter:** `automatiklabs/docs/educational-system/CHARTER.md` — Part II (all 6 frameworks + all 5 metodologias proprietárias), Part III (Cubo 3D — Estágio × Persona × Camada), Part IV §4.2 + §4.4 + §4.5 + §4.6 (competencies, pedagogical_reviews, workers locais, doctrine skill), Part VIII (glossário canônico — mandatory vocabulary).
- **Skill:** `automatiklabs-doctrine` — load BEFORE any generation task. Sub-skill `senior-prompt-engineer` (generation motor). Future skills `backward-design` and `bloom-calibrator` will replace manual application when they exist.
- **Sibling context docs:**
  - `instructional-design.md` — defines the LDD that this area consumes.
  - `assessment-engine.md` — defines `evidence_expected` and `anchor_concepts` (schema co-authored).
  - `pedagogical-qa.md` — defines the 8 hard-fail criteria checked before submission.
  - `schema-extensions.md` — defines `lesson_variants`, `lesson_generator_runs`, RLS.
  - `pedagogical-workflow.md` — defines the `set_lesson_draft()` SECURITY DEFINER function.
  - `lesson-experience.md` — defines what lives in the runtime chrome (NOT in `script_md`).

---

## 3. Operating principles

1. **Backward only.** Generation without `desired_outcome` + `competencies_taught` + `evidence_expected` in the LDD = abort immediately. Forward design ("make a lesson about X") is banned.
2. **Spine + transformers, never 54 rewrites.** One canonical spine in (Estágio 2 or 3, Organizado, Lógica) + `spine-transformer(persona|stage|layer)` derives variants. Content duplicated per cube cell is technical debt.
3. **1 new concept per lesson.** Sweller's Cognitive Load Theory. More than one → split into 2 lessons. Not negotiable. QA enforces this as hard-fail criterion #6.
4. **Auto-rebaixar Bloom.** If the competency allows, mark Bloom 3 instead of 5. Marking high = more friction (mandatory human reviewer). Do not inflate.
5. **Canonical vocabulary is an executable input.** `canonical_vocabulary_must_use` and `forbidden_terms` from the LDD become regex checks before submission. Default banned: "bot", "robô", "assistente virtual", "IA mágica".
6. **Never write directly to the DB.** All persistence is via `set_lesson_draft(payload jsonb, generator_run_id uuid)` (SECURITY DEFINER, owned by Pedagogical Workflow). The generator role does NOT have `UPDATE` on `lessons.is_published`.
7. **Every generation run registers `lesson_generator_runs`.** Without `prompt_version + model + inputs_hash + tokens + cost_usd`, the run does not count. Auditability > speed.
8. **Tone/cadence/chrome microcopy does NOT live in `script_md`.** "Olá, vamos juntos…" is the responsibility of Lesson Experience's runtime wrapper. The markdown is structurally neutral; persona-flavor comes from the transformer + the chrome.
9. **Backpressure is honest.** If the human review queue > 20 items for > 3 days, the generator stops. Do not generate on top of backlog.
10. **Self-validate before submitting.** Run `lesson-validator` locally (8 hard-fail criteria from Pedagogical QA) before creating a row in `pedagogical_reviews`. Reduces reviewer queue by ~60%.

---

## 4. Key data structures / interfaces

### 4.1 Input — LDD (consumed from Instructional Design)

```yaml
ldd_id: ldd-empresa-ia-fluxo-01-webhook-trigger
track_slug: empresa-com-ia-humanizada
course_slug: pilar-1-fluxo-de-trabalho-inteligente
module_slug: gatilhos-de-automacao
lesson_slug: webhook-trigger-no-n8n
position_in_module: 3

desired_outcome: |
  Aluno consegue receber webhook externo no n8n, extrair campo do payload,
  e usar numa decisão condicional do fluxo.

competencies_taught:
  - { competency_slug: comp-n8n-webhook-receive, weight: primary,    bloom_target: 3 }
  - { competency_slug: comp-n8n-conditional-node, weight: secondary, bloom_target: 2 }

evidence_expected:
  type: json_workflow      # json_workflow | video | url | file | text | quiz
  format: n8n_export_v1
  min_requirements:
    - "contém ao menos 1 Webhook node"
    - "contém ao menos 1 IF node referenciando body do webhook"
  reviewer_default: agent  # bloom >= 5 → human

cognitive_load_budget:
  intrinsic_minutes: 8
  new_concepts_max: 1
  prerequisite_concepts: [comp-n8n-basic-navigation, comp-http-methods-basic]

kolb_phase: experimentation
kolb_predecessor_lesson: ldd-empresa-ia-fluxo-01-webhook-concept

target_cells:
  - { stage: 2, persona: organizado, layer: logica }   # SPINE (always)
  - { stage: 2, persona: zerado,     layer: tecnica }
  - { stage: 2, persona: autodidata, layer: logica }

canonical_vocabulary_must_use: ["agente humanizado", "fluxo de trabalho"]
forbidden_terms: ["bot", "robô", "IA mágica"]

anchor_concepts:
  - { concept: "webhook como porta de entrada", bloom_target: 2 }
  - { concept: "extração via $json",            bloom_target: 3 }
```

LDD absent or incomplete → `ERROR: missing LDD fields [...]`. No fallback.

### 4.2 Output — `lesson_variants` row (one per target_cell)

Frontmatter YAML in `script_md`:

```yaml
ldd_id: ldd-empresa-ia-fluxo-01-webhook-trigger
variant_cell: { stage: 2, persona: organizado, layer: logica }
is_spine: true
derived_from_variant_id: null     # uuid when is_spine=false
competencies_taught: [comp-n8n-webhook-receive, comp-n8n-conditional-node]
bloom_target: 3
bloom_assessed_by_validator: 3    # lesson-validator fills this
kolb_phase: experimentation
evidence_expected: { ... }        # echoed from LDD, not changed
generator_run_id: <uuid>
prompt_version: lg-v0.4.1
```

Body of `script_md` follows **mandatory Kolb 5-section structure**:

```
## Contexto         (experiência concreta — situação real do estágio)
## Conceito         (1 conceito novo, anchored in anchor_concepts)
## Demonstração    (observação reflexiva — guided step-by-step)
## Prática         (experimentação ativa — produces evidence_expected)
## Síntese         (volta à experiência — checkpoint + próximo passo)
```

### 4.3 Output — `lesson_generator_runs` row

```sql
INSERT INTO lesson_generator_runs (
  id, ldd_id, prompt_version, model, inputs_hash,
  tokens_in, tokens_out, cost_usd_estimate,
  variant_cells jsonb, status, created_at
) VALUES (...);
```

### 4.4 Persistence call (not a direct INSERT)

```sql
SELECT set_lesson_draft(
  payload          => $1::jsonb,   -- {lesson_variants:[...], reviews:[...]}
  generator_run_id => $2::uuid
);
```

`set_lesson_draft()` is SECURITY DEFINER (owned by Pedagogical Workflow). It creates `lesson_variants` rows + `pedagogical_reviews(status='pending')` in a single transaction.

---

## 5. Decision protocols

1. **Which cell is the spine?** Always `(stage: 2 or 3, persona: organizado, layer: logica)`. If `target_cells` from the LDD doesn't include this center of gravity, generate the spine anyway as the golden master reference — even if not delivered as a final variant.
2. **`bloom_target` is 5 or 6?** The `evidence_expected.type` MUST be something other than `quiz`. If it is `quiz`, abort and request LDD correction.
3. **Multiple competencies in `competencies_taught`?** The `primary` one defines `bloom_target` and the Kolb structure. `secondary` competencies appear as context, not objectives. Never more than 1 `primary`.
4. **New concepts > 1?** Abort. Recommend LDD split into 2 lessons. Do not try to compress.
5. **`kolb_phase` is not `experimentation` but `evidence_expected` is an executable artifact?** Conflict — `concept` or `reflection` phases produce textual/diagram evidence, not executable artifacts. Abort with a suggested diff.
6. **Derived variant fails `lesson-validator`?** Do NOT adjust the spine. Fix the transformer. The spine only changes if the spine itself fails — variant failure is a transformer problem.
7. **Human review queue > 20 for > 3 days?** Do not call `set_lesson_draft`. Log the backpressure condition and stop.

---

## 6. Hand-offs

- **From Instructional Design:** LDD YAML complete (§4.1), `competency_catalog_v1.yaml` (YAML versioned in git), LDD template v1. Without these two files, this area does not operate.
- **From Schema Extensions:** tables `lesson_variants`, `lesson_generator_runs`, ENUMs `journey_stage` / `learner_persona` / `mastery_layer`, REVOKE on `lessons.is_published` for the generator role.
- **From Pedagogical Workflow:** function `set_lesson_draft()` SECURITY DEFINER.
- **From Pedagogical QA:** `pedagogical-gate-rubric` v1 with exactly 8 hard-fail criteria (mirrored in local `lesson-validator`).
- **To Assessment Engine:** `lesson_variants` frontmatter (especially `evidence_expected` and `anchor_concepts` echoed from LDD) is input for assessment generation. Schema co-authored, single source.
- **To Pedagogical QA:** rows in `pedagogical_reviews(status='pending')`, ordered by priority (human only for Bloom ≥ 5 + 5% sample of derived variants).
- **To Lesson Experience:** `script_md` neutral of tone. Do NOT embed persona-specific microcopy — they apply it in the chrome.

---

## 7. Anti-patterns

- Generating a lesson without an LDD ("the user asked for a lesson about X").
- Inserting directly into `lessons` or setting `is_published=true`.
- Inflating `bloom_target` "to seem ambitious" — human becomes the bottleneck, doctrine dies.
- Embedding tone/microcopy/persona-specific greetings in `script_md`. That goes in the chrome.
- Generating 54 variants upfront. Only generate `target_cells` declared by Instructional Design.
- Rewriting the entire spine to fix a variant. Fix the transformer.
- Skipping the local `lesson-validator` "because QA will catch it later." That multiplies the review queue.
- Modifying `evidence_expected` in transit — it is a contract with Assessment Engine, echoed without change.
- Creating lessons with more than 1 new concept. Split.
- Generating when the human review queue is in backpressure.

---

## 8. Verification checklist

- [ ] LDD validated: all required NOT NULL fields present (§4.1 shape).
- [ ] Local `lesson-validator` run and all 8 hard-fail criteria passed.
- [ ] Canonical spine in (stage 2 or 3, organizado, logica) generated, even if not requested as a final deliverable.
- [ ] Each requested `target_cell` has a `lesson_variants` row created via `set_lesson_draft()`.
- [ ] All derived variants have `derived_from_variant_id` pointing to the spine.
- [ ] `lesson_generator_runs` row registered with `prompt_version`, `tokens_in/out`, `cost_usd_estimate`.
- [ ] `script_md` follows the 5 Kolb sections with their exact names.
- [ ] Zero occurrences of `forbidden_terms` (regex check).
- [ ] `bloom_assessed_by_validator` filled and equals `bloom_target`. Discrepancy = regenerate.
- [ ] `pedagogical_reviews(status='pending')` created per variant. Bloom ≥ 5 → `reviewer_type='human'` required.
- [ ] Human review queue checked before starting (backpressure check).
- [ ] No `is_published=true` was set by this area.

---

## 9. Open questions / known limitations

- **Legacy lessons (200+ existing today).** Retrofit policy not decided. Working assumption: flag `legacy=true`, not counted for CBE until reprocessed. Awaiting Master Maestro decision.
- **Generation cost not budgeted.** `cost_usd_estimate` is recorded but no enforced ceiling exists. Curriculum Orchestration may add a per-track gate in a later phase.
- **Multi-language.** Only PT-BR today. Schema should reserve a `language` field in `lesson_variants` before the first translation becomes a painful migration.
- **Missing atomic skills.** `backward-design` and `bloom-calibrator` do not yet exist (Charter §4.6 marks with `*`). Until they do, the generator uses a hardcoded list of Bloom verb anchors — suboptimal, tracked as debt.
- **`spine-transformer` vs `lesson-validator` co-design with Pedagogical QA.** The rubric for "structurally verifiable diff" (concept density/min, checkpoint count) still needs to be agreed with QA Review in the first week of Fase 1.
- **Backpressure threshold (20 items / 3 days)** is an operational estimate. Re-evaluate after the first month of real production.
- **Onboarding flow** (how a new aluno gets their initial cube cell) is Instructional Design scope, but affects which `target_cells` appear in LDDs. Without onboarding designed, `target_cells` will be conservative.
