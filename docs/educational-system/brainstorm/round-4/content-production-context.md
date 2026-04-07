# Context — Content Production (Nucleo 01)

## 1. What this area owns

Content Production owns the **lesson generation pipeline**: turning a structured Lesson Design Document (LDD, produced by Instructional Design / Arquiteto) into a narrative `script_md` plus structured frontmatter, plus N persona/stage/layer variants of that script. We decide HOW the lesson is told (narrative spine, didactic structure, exemplos, microcopy embedded in script). We do NOT decide WHAT competency is taught (Arquiteto), HOW it is assessed (Nucleo 02), HOW it is rendered visually (Lesson Experience), WHERE it sits in the catalog (Scrum Master), or whether it can be published (Pedagogical QA + DB triggers). Our output is always provisional: every generated lesson enters as `is_published=false` with a `pedagogical_reviews` row pending.

## 2. Required pre-reading

- Charter: `automatiklabs/docs/educational-system/CHARTER.md` — **Part II** (doutrina pedagógica: Backward Design, Bloom, CBE, Cognitive Load, Kolb, Kirkpatrick + 5 metodologias proprietárias), **Part III** (Cubo 3D — Estágio × Persona × Camada), **Part IV §4.2 + §4.4 + §4.5 + §4.6** (competencies, pedagogical_reviews, workers locais, doctrine como skill), **Part VIII** (glossário canônico — vocabulário obrigatório).
- Skill: `automatiklabs-doctrine` — load BEFORE any generation task. Sub-skills `senior-prompt-engineer` (motor) e (futuras) `backward-design`, `bloom-calibrator` quando existirem.
- Sibling context docs (in `docs/educational-system/brainstorm/round-4/`):
  - `instructional-design-context.md` — define o LDD que consumimos.
  - `assessment-engine-context.md` — define `evidence_expected` e anchor concepts (schema co-autorado).
  - `pedagogical-qa-context.md` — define os 8 hard fails que validamos antes de submeter.
  - `schema-extensions-context.md` — define `lesson_variants`, `lesson_generator_runs`, RLS.
  - `pedagogical-workflow-context.md` — define a função `set_lesson_draft()` SECURITY DEFINER.
  - `lesson-experience-context.md` — define o que vive no chrome de runtime (NÃO no `script_md`).

## 3. Operating principles

1. **Backward only.** Geração SEM `desired_outcome` + `competencies_taught` + `evidence_expected` no LDD = aborto imediato. Forward design ("faça uma aula sobre X") é proibido.
2. **Spine + transformers, nunca 54 rewrites.** Um spine canônico em (Estágio 2 ou 3, Organizado, Lógica) + `spine-transformer(persona|stage|layer)` derivam variantes. Conteúdo duplicado por célula é dívida.
3. **1 conceito novo por lesson.** Sweller. Mais de um → quebrar em 2 lessons. Não negociável.
4. **Auto-rebaixar Bloom.** Se a competência permite, marcar Bloom 3 ao invés de 5. Marcar alto = mais fricção (humano obrigatório). Não inflar.
5. **Vocabulário canônico é input executável.** `canonical_vocabulary_must_use` e `forbidden_terms` do LDD viram regex check antes de submeter. Default proibido: "bot", "robô", "assistente virtual", "IA mágica".
6. **Nunca escrever direto no DB.** Toda persistência via `set_lesson_draft(payload jsonb, generator_run_id uuid)` (SECURITY DEFINER, ownership Backend Dev). Role do gerador NÃO tem UPDATE em `lessons.is_published`.
7. **Toda geração registra `lesson_generator_runs`.** Sem `prompt_version + model + inputs_hash + tokens + cost_usd`, a run não conta. Auditabilidade > velocidade.
8. **Tom/cadência/microcopy de chrome NÃO vivem no `script_md`.** "Olá, vamos juntos…" é responsabilidade do wrapper de runtime do Lesson Experience. Nosso markdown é neutro estruturalmente; persona-flavor vem do transformer + do chrome.
9. **Backpressure honesto.** Se a fila humana de revisão > 20 itens há > 3 dias, o gerador para sozinho. Não geramos pra cima de backlog.
10. **Self-validate antes de submeter.** Rodar `lesson-validator` localmente (8 hard fails de QA) antes de criar a row em `pedagogical_reviews`. Reduzir fila do reviewer ≈ 60%.

## 4. Key data structures / interfaces

### 4.1 Input — LDD (consumido do Arquiteto)

```yaml
ldd_id: ldd-empresa-ia-fluxo-01-webhook-trigger
track_slug: empresa-com-ia-humanizada
course_slug: pilar-1-fluxo-de-trabalho-inteligente
module_slug: gatilhos-de-automacao
lesson_slug: webhook-trigger-no-n8n
position_in_module: 3

desired_outcome: |
  Aluno consegue receber webhook externo no n8n, extrair campo
  do payload, e usar numa decisão condicional do fluxo.
performance_task_seed: |
  Configure webhook que ao receber POST {"status":"paid"} dispara
  notificação. Submeta JSON do workflow exportado.

competencies_taught:
  - { competency_slug: comp-n8n-webhook-receive, weight: primary,   bloom_target: 3 }
  - { competency_slug: comp-n8n-conditional-node, weight: secondary, bloom_target: 2 }

evidence_expected:
  type: json_workflow      # json_workflow|video|url|file|text|quiz
  format: n8n_export_v1
  min_requirements:
    - "contém ao menos 1 Webhook node"
    - "contém ao menos 1 IF node referenciando body do webhook"
  reviewer_default: agent  # bloom>=5 → human

cognitive_load_budget:
  intrinsic_minutes: 8
  new_concepts_max: 1
  prerequisite_concepts: [comp-n8n-basic-navigation, comp-http-methods-basic]

kolb_phase: experimentation     # experience|reflection|concept|experimentation
kolb_predecessor_lesson: ldd-empresa-ia-fluxo-01-webhook-concept

target_cells:
  - { stage: 2, persona: organizado, layer: logica }   # SPINE (sempre)
  - { stage: 2, persona: zerado,     layer: tecnica }
  - { stage: 2, persona: autodidata, layer: logica }

methodology_context:
  framework: empresa-ia-humanizada
  pillar: 1-fluxo-trabalho-inteligente
  step_in_framework: null

canonical_vocabulary_must_use: ["agente humanizado", "fluxo de trabalho"]
forbidden_terms: ["bot", "robô", "IA mágica"]

anchor_concepts:
  - { concept: "webhook como porta de entrada", bloom_target: 2 }
  - { concept: "polling vs webhook",            bloom_target: 4 }
  - { concept: "extração via $json",            bloom_target: 3 }
```

LDD ausente ou incompleto → `ERROR: missing LDD fields [...]`. Sem fallback.

### 4.2 Output — `lesson_variants` row (uma por target_cell)

Frontmatter YAML do `script_md`:
```yaml
ldd_id: ldd-empresa-ia-fluxo-01-webhook-trigger
variant_cell: { stage: 2, persona: organizado, layer: logica }
is_spine: true                    # false em variantes derivadas
derived_from_variant_id: null     # uuid quando is_spine=false
competencies_taught: [comp-n8n-webhook-receive, comp-n8n-conditional-node]
bloom_target: 3
bloom_assessed_by_validator: 3    # nosso lesson-validator preenche
kolb_phase: experimentation
evidence_expected: { ... }        # ecoado do LDD, sem alterações
generator_run_id: <uuid>
prompt_version: lg-v0.4.1
```

Body do `script_md` segue **estrutura Kolb obrigatória** (5 seções nomeadas):
```
## Contexto         (experiência concreta — situação real do estágio)
## Conceito         (1 conceito novo, ancorado em anchor_concepts)
## Demonstração    (observação reflexiva — passo a passo guiado)
## Prática         (experimentação ativa — produz evidence_expected)
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

### 4.4 Persistence call (não INSERT direto)

```sql
SELECT set_lesson_draft(
  payload      => $1::jsonb,   -- {lesson_variants:[...], reviews:[...]}
  generator_run_id => $2::uuid
);
```
Função SECURITY DEFINER (Backend Dev) cria `lesson_variants` + `pedagogical_reviews(status='pending')` em transação única.

## 5. Decision protocols

1. **Qual é a célula do spine?** Sempre `(stage: 2 ou 3, persona: organizado, layer: logica)`. Se `target_cells` do LDD não inclui esse centro de gravidade, gerar o spine ASSIM MESMO (mesmo que não seja entregue como variante final) — é o golden master de referência.
2. **`bloom_target` declarado é 5 ou 6?** A `evidence_expected.type` DEVE ser ≠ `quiz`. Se for quiz, abort com erro pedindo correção do LDD.
3. **Múltiplas competências em `competencies_taught`?** A `primary` define o `bloom_target` e a estrutura Kolb. As `secondary` aparecem como contexto, não como objetivo. Nunca mais de 1 `primary`.
4. **Conceito novo > 1?** Abort. Recomendar split do LDD em 2 lessons. Não tentar comprimir.
5. **`kolb_phase` ≠ `experimentation` mas a `evidence_expected` é artefato real?** Conflito — fase `concept` ou `reflection` produz evidência textual/diagrama, não artefato executável. Abort com diff sugerido.
6. **Variante derivada falha no `lesson-validator`?** NÃO ajustar o spine. Ajustar o transformer. Spine só muda se o spine falhar — variante falhar é problema do transformer.
7. **Fila humana > 20 há > 3 dias?** Não chamar `set_lesson_draft`. Logar e parar.

## 6. Hand-offs

- **From Instructional Design (Arquiteto):** LDD YAML completo (§4.1), `competency catalog v1` (YAML versionado em git), `LDD template v1`. Sem esses dois arquivos, este terminal não opera.
- **From Schema Extensions (Database):** tabelas `lesson_variants`, `lesson_generator_runs`, ENUMs `journey_stage` / `learner_persona` / `mastery_layer`, REVOKE em `lessons.is_published` para nosso role.
- **From Pedagogical Workflow (Backend Dev):** função `set_lesson_draft()` SECURITY DEFINER.
- **From Pedagogical QA:** `pedagogical-gate-rubric` v1 com exatamente 8 hard fails (espelhamos no `lesson-validator` local).
- **To Assessment Engine (Nucleo 02):** o frontmatter do `lesson_variants` (especialmente `evidence_expected` e `anchor_concepts` ecoados) é input do gerador de assessment. Schema co-autorado, fonte única.
- **To Pedagogical QA:** rows em `pedagogical_reviews(status='pending')`, ordenadas por prioridade (humano só nas Bloom ≥ 5 + sample 5% das variantes derivadas).
- **To Lesson Experience (UI UX):** `script_md` neutro de tom. NÃO embutir microcopy de persona — eles aplicam no chrome.

## 7. Anti-patterns

- Gerar lesson sem LDD ("o usuário pediu uma aula sobre X").
- Inserir direto em `lessons` ou marcar `is_published=true`.
- Inflar `bloom_target` "pra parecer ambicioso" — humano vira gargalo, doutrina morre.
- Embutir tom/microcopy/saudações persona-específicas no `script_md`. Vai no chrome.
- Gerar 54 variantes upfront. Só gerar `target_cells` declarados pelo Arquiteto.
- Reescrever o spine inteiro pra corrigir uma variante. Corrija o transformer.
- Pular `lesson-validator` local "porque QA pega depois". Multiplica a fila.
- Editar `evidence_expected` no caminho — é contrato com Nucleo 02, ecoa sem mudar.
- Criar lessons com mais de 1 conceito novo. Split.
- Gerar quando fila humana está em backpressure.

## 8. Verification checklist

- [ ] LDD validado: todos os campos NOT NULL presentes (§4.1).
- [ ] `lesson-validator` local rodado e os 8 hard fails passaram.
- [ ] Spine canônico em (stage 2 ou 3, organizado, logica) gerado, mesmo se não solicitado como entrega final.
- [ ] Cada `target_cell` solicitado tem `lesson_variants` row criada via `set_lesson_draft()`.
- [ ] Todas as variantes derivadas têm `derived_from_variant_id` apontando ao spine.
- [ ] `lesson_generator_runs` row registrada com `prompt_version`, `tokens_in/out`, `cost_usd_estimate`.
- [ ] `script_md` segue as 5 seções Kolb literalmente nomeadas.
- [ ] Vocabulário: zero ocorrências de `forbidden_terms` (regex check).
- [ ] `bloom_assessed_by_validator` preenchido e == `bloom_target`. Discrepância = re-gerar.
- [ ] `pedagogical_reviews(status='pending')` criado por variante. Bloom ≥ 5 → `reviewer_type='human'` exigido.
- [ ] Fila humana checada antes de iniciar (backpressure).
- [ ] Nenhum `is_published=true` foi setado por este terminal.

## 9. Open questions / known limitations

- **Lessons legacy (200+ existentes hoje).** Política de retrofit ainda não decidida. Provável: flag `legacy=true`, não conta para CBE até reprocessar. Aguarda decisão Master Maestro.
- **Custo de geração não orçado.** `cost_usd_estimate` é registrado mas não há teto enforced. Scrum Master pode adicionar gate por trilha em fase posterior.
- **Multi-idioma.** Hoje só PT-BR. Schema deveria reservar `language` em `lesson_variants` antes que a primeira tradução vire migration dolorosa.
- **Skills atômicas faltantes.** `backward-design` e `bloom-calibrator` ainda não existem (Charter §4.6 marca com `*`). Enquanto não existirem, o gerador improvisa com lista hardcoded de verbos-âncora — subótimo, registrado como dívida.
- **`spine-transformer` vs `lesson-validator` co-design com QA.** A rubric de "diff estruturalmente verificável" (densidade conceito/min, número checkpoints) ainda precisa ser cravada com QA Review na primeira semana da Fase 1.
- **Backpressure threshold (20 itens / 3 dias)** é palpite operacional. Reavaliar após primeiro mês de produção real.
- **Onboarding do aluno** (definição inicial da célula do cubo) é escopo do Arquiteto, mas afeta quais `target_cells` o LDD vai pedir. Sem onboarding desenhado, target_cells vai ser conservador.

DONE.
