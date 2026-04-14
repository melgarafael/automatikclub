# Round 3 — Pedagogical Workflow dialogues

**Voz:** Backend Dev / Pedagogical Workflow.
**Premissa entrando no Round 3:** já está convergido com Database e QA que (a) `is_published` é consequência computada, (b) reviews são append-only, (c) `fn_validate_lesson_doctrine` filtra antes da fila humana. Round 3 fecha *boundaries* e *state machine*.

---

## Dialogue 1: → @Database (Schema ↔ Workflow boundaries)

### Invariantes que peço à DB enforçar (não negociáveis)

1. **`lessons.is_published` não é writable.** REVOKE UPDATE da coluna em todas as roles + trigger BEFORE UPDATE OF is_published que dá `RAISE EXCEPTION` exceto quando `current_setting('app.publish_via_function', true) = 'true'` (set apenas dentro de `publish_lesson()` SECURITY DEFINER). Defesa em camadas que você mesma propôs.
2. **`pedagogical_reviews` é append-only.** Trigger BEFORE UPDATE/DELETE → RAISE. Cada nova decisão = nova linha. `current_status` é VIEW agregada `latest_per_reviewer`, nunca coluna writable.
3. **`user_competency_progress_events` é append-only** (a tabela que você propôs no Round 2). Status atual vira VIEW. Eu acesso só via função `record_competency_transition(...)` — REVOKE INSERT direto, GRANT EXECUTE só na função.
4. **CONSTRAINT TRIGGER `fn_check_no_competency_cycle()`** em INSERT/UPDATE de `competency_prerequisites`. Falha o INSERT antes do ciclo existir.
5. **UNIQUE `(user_id, competency_id, sha256)` parcial em `evidence_artifacts`** — anti-resubmissão idêntica que você defendeu. Aceito sem ressalva.
6. **`competencies` é append-only em `slug` e `bloom_level`.** Trigger bloqueia UPDATE dessas colunas. Mudança de doutrina = nova competency + deprecate, nunca rename. Isso protege `user_competency_progress_events.competency_id` histórico.
7. **`competency_versions` table** (lacuna que QA levantou): `user_competency_progress_events.competency_version_id` aponta pra versão exata demonstrada. Upgrade de doutrina não invalida histórico — Kirkpatrick 3 sobrevive.
8. **Particionamento mensal por `created_at`** em `user_journey_history`, `user_competency_progress_events`, `pedagogical_reviews` desde o dia 1. Você propôs e eu precisava — sem isso a query "estágio em T" fica O(n) em 2 anos.
9. **CHECK constraint composto em `pedagogical_reviews`:** `(reviewer_type='human' AND reviewer_id IS NOT NULL) OR (reviewer_type='agent' AND agent_slug IS NOT NULL)`. Sem reviewer órfão.
10. **Tabela única `lesson_variants`** com `content_overrides jsonb` + `layout_overrides jsonb` (tua proposta de unificação Núcleo 01 / UI UX). Aceito — RLS por role controla quem escreve qual coluna. Uma migration, não duas.

### O que assumo (e por quê) deve ficar no app / na função SECURITY DEFINER

- **Orquestração da fila de review** (qual lesson vai pra qual reviewer, atribuição, notificação). Isso é estado de aplicação, não invariante de dados. Se virar trigger, fica não-debugável.
- **Cálculo de "gate aberto?"** — `publish_lesson(lesson_id, actor_id)` agrega: (a) `fn_validate_lesson_doctrine()` passa, (b) ≥1 review humana approved, (c) competencies têm evidence_spec, (d) advisory lock obtido. Cada um é checável em SQL puro mas a *combinação* é workflow, mora em função SECURITY DEFINER. **Retorna `TABLE(passed bool, failures jsonb)`**, não boolean — atendo o pedido da QA.
- **Backpressure de fila** (`v_review_queue_health` + função `create_lesson_variant` que rejeita com `queue_overflow`). Banco fornece a view; a decisão de bloquear é da função.
- **Idempotência de eventos de domínio** (dedupe_key na produção). É invariante, sim, mas implementado como `UNIQUE (aggregate_type, aggregate_id, event_type, dedupe_key)` parcial — schema dá o constraint, função decide a chave.
- **Roteamento agent vs human** (Bloom ≥5 → human obrigatório). Pode até virar trigger seu, mas eu prefiro mover pra função porque o critério vai mudar (ex: Bloom 4 também vira human depois). Constraint engessa, função evolui.
- **SLA / escalation** (Round 2: timeout vira escalation, não auto-approve). Cron worker local lê `v_overdue_reviews` e chama `escalate_review(review_id)`. Banco expõe a view, função muda estado.

### Failure modes que me preocupam

1. **Bypass via service_role.** Workers Python rodam locais (Charter §4.5) com service_role, e service_role ignora RLS. Isso é o caminho mais provável de violação dos invariantes acima. **Mitigação:** os triggers BEFORE UPDATE/DELETE em `pedagogical_reviews` e `user_competency_progress_events` **não** são RLS — são plpgsql RAISE. Eles bloqueiam até service_role. Service_role só passa se setar `app.publish_via_function=true`. Quero co-validação tua de que isso resiste.
2. **Migration order do `00012_pedagogical_roles.sql`.** Você listou no Round 2 — concordo, é o primeiro arquivo. Se 00013+ rodar antes das roles existirem, todos os GRANTs falham silenciosamente e a doutrina nasce sem dentes. CI tem que falhar a migration se a role referenciada não existe.
3. **Backfill destrutivo dos alunos legados.** A migration `00015b_backfill` (que eu propus no Round 2) tem que rodar `INSERT ... ON CONFLICT DO NOTHING` e ser **transacional por user_id**. Se ela for "INSERT em massa", crash no meio deixa o sistema metade-CBE metade-time-based. Quero co-design.
4. **Particionamento + FK cross-partition.** Se `user_competency_progress_events` é particionada por `created_at`, FKs dela apontando pra `assessment_attempts` (que **não** é particionada) podem performar mal em cascata DELETE. Decisão minha: nunca CASCADE em append-only. Só RESTRICT. Confirma?
5. **JSON Schema drift.** Você quer `criterion_results jsonb` validado por `jsonb_matches_schema(criteria, schema_version)`. Se a função de validação JSON ela mesma estiver desatualizada, dados ruins entram silenciosamente. **Mitigação:** schema_version é NOT NULL + CHECK contra um enum mantido em código (não em coluna `schemas` mutável). Schema imutável por versão.

---

## Dialogue 2: → @QA Review (Review pipeline state machine)

### State machine proposta (`pedagogical_reviews` agregado por `lesson_id`)

```
                    ┌──────────────┐
INSERT lesson ───►  │   draft      │  (default; nenhuma review existe)
                    └──────┬───────┘
                           │ submit_for_review(lesson_id)
                           ▼
                    ┌──────────────┐
                    │ doctrine_gate│  fn_validate_lesson_doctrine()
                    └──────┬───────┘
              fail │       │ pass
                   ▼       ▼
             needs_fix  agent_review   ◄── reviewer_type='agent', criterion-by-criterion
                           │
                   ┌───────┼───────────┐
              reject│   approved      │needs_revision
                   │       │           │
                   │       ▼           │
                   │  bloom_gate       │
                   │  (target ≥5?)     │
                   │   yes │ no        │
                   │       ▼           │
                   │  human_review     │ ◄── reviewer_type='human' obrigatória
                   │       │           │
                   │       ▼           │
                   │  parallel:        │
                   │  - ux_review      │ ◄── reviewer_role='ux' (Lesson Experience)
                   │  - pedagogy_review│ ◄── reviewer_role='pedagogy' (QA)
                   │       │           │
                   │  both approved    │
                   ▼       ▼           ▼
              rejected  publishable  needs_revision
                           │
                           │ publish_lesson(actor_id)
                           ▼
                       published
```

**States** (aggregate over latest review per reviewer):
- `draft` · `doctrine_gate` · `agent_review` · `bloom_gate` · `human_review` (paralelo ux+pedagogy) · `publishable` · `published` · `needs_revision` · `rejected` · `escalated`

**Transições autoritativas** todas via funções SECURITY DEFINER (`submit_for_review`, `record_review_decision`, `publish_lesson`, `escalate_review`). Nenhuma transição via UPDATE direto.

**Campos novos em `pedagogical_reviews`** (acordados Round 2):
`review_round int` · `reviewer_role enum('ux','pedagogy','assessment')` · `bloom_assessed smallint` · `criterion_results jsonb` · `agreement_with_previous bool`

### Disagreement resolution (agent vs human + human vs human)

**Caso A — Agent aprova → Human rejeita:**
- Rejection wins. Lesson volta a `needs_revision`. Agent review fica histórico **com flag `disagreed_with_human=true`**. Métrica `agent_human_agreement_rate` por `agent_slug` (lacuna que tu levantou no Round 2). Se rate < 80% por 30 dias, `agent_slug` perde permissão de aprovar — `is_active=false` em `agent_reviewers` table. Recalibração obrigatória.

**Caso B — Human aprova → Agent rejeita depois (pós-publish):**
- Não despublica automático. Cria `flagged_post_publish` task pro `pedagogical_admin`. Mantenho minha posição do Round 1: despublicar conteúdo ao vivo é decisão humana, sempre.

**Caso C — Bloom_target (autor) ≠ bloom_assessed (reviewer) > 1 nível:**
- Trigger automático: a transição `pending → approved` é bloqueada e a review entra em `calibration_dispute`. Exige um **segundo human reviewer** automaticamente. Calibration drift vira escalation, não warning. (Round 2.)

**Caso D — Dois humanos discordam (ux vs pedagogy):**
- Não há voting. Vai pra `pedagogical_admin` via `escalate_review()`. Pedagogia não é democracia.

**Caso E — Mesmo reviewer round muda de ideia em 24h:**
- Permitido (novo INSERT é nova linha). Agregação `latest_per_reviewer` pega a última. Histórico preservado. Sem UPDATE.

### Max retries / cycles

- **Máximo 3 ciclos** `submit → review → needs_revision → resubmit`. No 4º submit da mesma lesson sem aprovação, transição automática pra `escalated`. Coluna calculada `current_round = count(distinct review_round)`.
- **Por ciclo**, agent reviewer tem 1 tentativa (não fica em loop se humano deu feedback). Regra que Arquiteto pediu no Round 1: agent só roda 1 vez por versão de lesson.
- **Hard stop:** após 3 ciclos sem aprovação, lesson vai pra fila do `pedagogical_admin` com sumário automatizado das objeções. Master Maestro decide: re-scope, kill, ou override.

### Escalation rules (when, to whom)

| Trigger | Destino | SLA do destino |
|---|---|---|
| Timeout 4h em `human_review` (QA SLA) | `pedagogical_admin` queue + Maestro notify | 24h |
| `calibration_dispute` (autor vs reviewer Bloom gap) | Segundo human reviewer | 24h |
| Round 4 sem aprovação | `pedagogical_admin` + Master Maestro | sem SLA — decisão humana |
| `agent_human_agreement_rate < 80%` por skill | Skill desabilitada + revisão da skill | até recalibrar |
| `flagged_post_publish` (agent rejeita lesson publicada) | `pedagogical_admin` | 72h |
| Rejection sem `feedback_md` ≥50 chars | Bloqueado no INSERT (CHECK constraint) | n/a |
| `evidence_url` ausente em `status='approved'` | Bloqueado no INSERT | n/a |
| Backlog `human_review > 20` por 3 dias | Backpressure: bloqueia novos `create_lesson_variant` | até esvaziar |

**Princípio do escalation:** nunca faz auto-approve. Sempre move pra fila humana com mais autoridade, nunca pra menos. O relógio rodando aumenta pressão, nunca permissões.

### O que preciso de ti pra fechar a state machine

1. **Co-ownership da função `publish_lesson()`**: tu defines os critérios da rubric (12-15), eu defino a função que invoca `fn_validate_lesson_doctrine` + agrega + retorna `TABLE(passed bool, failing_criteria jsonb)`. Topa eu owno o controle de fluxo, tu owna os critérios?
2. **Confirma que `reviewer_role='ux'` e `reviewer_role='pedagogy'` rodam em paralelo, ambos obrigatórios**, não sequenciais. Round 2 tu já assinou — fechado.
3. **Avaliabilidade vira critério dentro do teu rubric**, não review separada do Núcleo 02. Round 2 tu propôs. Aceito. Núcleo 02 escreve o critério, tu aplica no rubric único.
4. **Inter-rater audit table** (`review_calibration_samples`): Database vai criar a tabela; o `pedagogical-drift-detector` (teu worker) roda mensal e popula. Eu plugo a métrica `agent_human_agreement_rate` na função de bloqueio de skill. Confirma que tu ownha o worker e eu ownho o gate?
5. **`record_review_decision(review_id, status, criterion_results, bloom_assessed, feedback_md)`** é a única função de escrita em `pedagogical_reviews`. Eu owno a função, tu owna a validação dos critérios via JSON Schema versionado (Database vai exigir schema_version NOT NULL).

DONE.
