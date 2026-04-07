# Round 3 — Lesson Experience dialogues

**Terminal:** UI UX Design (Lesson Experience)
**Partner:** @Database (Schema Extensions)
**Tópico:** DATA → EXPERIÊNCIA SENTIDA. Você tem as tabelas. Eu transformo em algo que o aluno sente diferente quando ele é Autodidata Estágio 4 vs Zerado Estágio 1. Este documento é o **contrato de consumo** do meu frontend sobre seu schema — se a query não existe, a UI não existe.

---

## Dialogue 1: → @Database (Personalização real)

### Preâmbulo — respondendo seus pedidos do Round 2

Antes de listar o que quero, respondo o que você me perguntou:

1. **"Wrappers de persona — código React puro ou tabela `persona_layout_rules`?"** — **Código React puro** para as regras determinísticas (fontes, velocidade de vídeo, densidade), MAS eu preciso que **3 colunas minhas** existam em `user_profiles`: `persona learner_persona`, `current_stage journey_stage`, `preferred_layer mastery_layer`. Sem tabela de regras — as regras vivem no front como design tokens por persona.

2. **`lesson_variants` unificada com `content_overrides jsonb` + `layout_overrides jsonb`** — **aceito**. Abandono minha proposta original `lesson_personalizations`. É a tabela única compartilhada com Nucleo 01. Minhas writes vão na coluna `layout_overrides` via role `ui_design_editor`; writes de Nucleo 01 na coluna `content_overrides` via role `content_author`. Concorde com RLS por coluna.

3. **Ordem de fallback preservando persona como invariante mais forte** — preciso que isto esteja na função SQL `resolve_variant()`, não no front. Detalhamento abaixo.

---

### Queries que peço (shapes concretos)

#### Q1 — `resolve_lesson_for_user(user_id uuid, lesson_id uuid) → jsonb`

A query-mãe. Frontend chama **uma** vez por lesson carregada. Retorna:

```json
{
  "lesson": {
    "id": "uuid",
    "title": "...",
    "canonical_spine_id": "uuid",
    "chapters": [{"start": 0, "end": 45, "kind": "context"}, ...],
    "video_url": "...",
    "cognitive_load": 3,
    "kolb_phase": "experimentation"
  },
  "variant_resolved": {
    "stage": "stage_4",
    "persona": "autodidata",
    "layer": "logica",
    "content_overrides": { "script_md": "...", "tldr": "..." },
    "layout_overrides": { "visible_sections": ["demo","practice"], "scaffolding_level": 1 },
    "fallback_applied": false,
    "fallback_reason": null
  },
  "user_context": {
    "persona": "autodidata",
    "current_stage": "stage_4",
    "preferred_layer": "logica"
  },
  "competencies_taught": [
    { "id": "uuid", "slug": "n8n-http-webhook", "bloom_level": 4, "status": "practicing",
      "framework": "empresa-ia-humanizada" }
  ],
  "unlock_state": {
    "unlocked": true,
    "blocked_by": null,
    "reason_human": null,
    "next_action": null
  },
  "evidence_requirements": [
    { "assessment_id": "uuid", "kind": "json_workflow", "persona_variant": "autodidata",
      "passing_threshold": 80, "prompt_md": "..." }
  ]
}
```

**Por que uma função única:** eu tenho um server component que renderiza a lesson. Não posso fazer 5 roundtrips pra montar a tela. Ou vem tudo em uma chamada ou a lesson sente *lag* mesmo em conexão boa.

**Implementação esperada:** PL/pgSQL SECURITY DEFINER que faz os JOINs entre `lessons`, `lesson_variants`, `user_profiles`, `lesson_competencies`, `user_competency_progress`, `competency_prerequisites`, `assessments`. Uso de CTEs. RLS bypass controlado — a função valida `user_id = auth.uid()` internamente.

---

#### Q2 — `get_competency_graph_for_track(user_id uuid, track_id uuid) → jsonb`

Alimenta o **grafo de competências** que substitui a lista de aulas (minha proposta Round 1, Topic 3).

```json
{
  "track": { "id": "uuid", "title": "...", "target_stage": "stage_4" },
  "nodes": [
    { "competency_id": "uuid", "slug": "n8n-webhook", "title": "...",
      "bloom_level": 4, "framework": "3-camadas", "layer": "tecnica",
      "status": "approved", "evidence_attempt_id": "uuid", "approved_at": "..." },
    { "competency_id": "uuid", "slug": "n8n-error-handling", "title": "...",
      "bloom_level": 4, "status": "blocked", "blocked_by": ["uuid-webhook"] }
  ],
  "edges": [
    { "from": "uuid-webhook", "to": "uuid-error-handling", "kind": "hard" }
  ],
  "lessons_by_competency": {
    "uuid-webhook": [ { "lesson_id": "uuid", "title": "...", "variant_stage": "stage_4",
                        "variant_persona": "autodidata", "duration_min": 8 } ]
  },
  "suggested_next": { "competency_id": "uuid", "reason": "unblocks 3 downstream" }
}
```

**Uso:** renderizo `<CompetencyGraph nodes edges>` com react-flow. Aluno clica num nó → drawer lateral mostra as lessons que ensinam aquela competência, filtradas pela célula do cubo dele.

**Dependência:** a CTE recursiva sobre `competency_prerequisites` que você já previu no Round 2 — ótimo. Só peço que o campo `blocked_by` venha como array de IDs, não como prosa.

---

#### Q3 — `get_next_action_for_user(user_id uuid) → jsonb`

Pro dashboard pós-login (tela /learn). Retorna **o próximo movimento** que o aluno deveria fazer.

```json
{
  "kind": "submit_evidence" | "watch_lesson" | "wait_review" | "pick_track" | "resubmit_after_feedback",
  "lesson_id": "uuid | null",
  "competency_id": "uuid | null",
  "assessment_id": "uuid | null",
  "message_zerado": "Você está quase lá. Envie o JSON do seu workflow.",
  "message_autodidata": "Submit evidence for n8n-webhook.",
  "message_organizado": "Próximo passo: submeter evidência da competência n8n-webhook. Prazo sugerido: hoje.",
  "blocked_review_eta_minutes": null
}
```

**Por que as 3 mensagens no backend:** Nucleo 01 falou em `transformer_persona`. Eu quero que a mensagem de next-action seja **pré-calculada** pela função SQL a partir de templates por persona, não improvisada no front. Isso evita "frio" de tradução em runtime.

**Alternativa aceitável:** você me devolve só `kind` + `context` e eu faço o template no front a partir de design tokens. Mas aí preciso de **todos os campos de contexto** (prazo, nome da competência, motivo do bloqueio) tipados, não em prosa.

---

#### Q4 — `get_unlock_reason(user_id uuid, lesson_id uuid) → jsonb`

Quando o aluno clica numa lesson bloqueada. UI precisa explicar o porquê sem mentir.

```json
{
  "unlocked": false,
  "missing_competencies": [
    { "competency_id": "uuid", "slug": "n8n-basics", "title": "Conceitos básicos de n8n",
      "closest_lesson_id": "uuid", "closest_lesson_title": "..." }
  ],
  "pending_reviews": [
    { "competency_id": "uuid", "submitted_at": "...", "reviewer_type": "agent",
      "estimated_eta_minutes": 2 }
  ],
  "next_action_human": "Complete 'Conceitos básicos de n8n' primeiro."
}
```

**Crítico:** distinguir *"você ainda não tentou"* de *"sua submissão está em review"*. Mensagem UI é completamente diferente. Sem essa distinção estruturada, caio no modo genérico "bloqueado" e o aluno não sabe se ele deve esperar ou agir.

---

#### Q5 — `get_progress_snapshot(user_id uuid) → jsonb`

Pro header da plataforma (sempre visível). **Números honestos de CBE**, não % de vídeo.

```json
{
  "stage": "stage_4",
  "persona": "autodidata",
  "competencies_demonstrated": 14,
  "competencies_in_progress": 3,
  "competencies_total_current_track": 22,
  "tracks_completed": 2,
  "last_evidence_approved_at": "2026-04-05T18:23:00Z",
  "streak_days": 7
}
```

**Regra que peço:** **nunca** `lessons_watched_count`. Esse número não existe no header. Se você expor, alguém vai renderizar. Feature-flag: eu peço pra você **não criar a view** que retorna esse número até que CBE esteja em produção. Backpressure schema.

---

### Aggregates necessários (views materializadas)

Estas são caras em runtime. Preciso que rodem como **materialized views** refresh-on-write (trigger) ou refresh cron, não como queries live:

1. **`mv_user_competency_snapshot (user_id, competency_id, latest_status, latest_evidence_at, latest_bloom_demonstrated)`** — fonte de verdade derivada do append-only `user_competency_progress_events`. Q1, Q2, Q5 dependem disso. **Refresh:** trigger AFTER INSERT em events. Custo aceitável — INSERTs de eventos são raros comparado a leituras.

2. **`mv_track_completion_by_user (user_id, track_id, competencies_done, competencies_total, percent)`** — alimenta Q5 e o grafo. Refresh: trigger na `mv_user_competency_snapshot`.

3. **`mv_lesson_variant_index (lesson_id, stage, persona, layer, variant_id, has_content_override, has_layout_override)`** — índice de quais células do cubo existem por lesson. Sem isso, `resolve_variant()` faz scan em `lesson_variants` toda vez. Refresh: trigger em `lesson_variants` INSERT/UPDATE.

4. **`mv_review_queue_eta (competency_id, avg_review_time_seconds, p95_review_time_seconds)`** — alimenta o `estimated_eta_minutes` de Q4. Calculado a partir de `pedagogical_reviews` históricas agrupadas por tipo de reviewer. Sem isso, o aluno vê "em revisão" sem horizonte e presume que é bug.

5. **`mv_daily_engagement_by_persona (date, persona, active_users, evidences_submitted, evidences_approved)`** — pra mim monitorar se a personalização está enviesando comportamento. Se Zerado submete 1/5 do que Autodidata, eu quero ver **antes** do churn.

---

### Cell-level differentiation example — concreto

Vou tornar isto tangível. **Mesma lesson** (slug `n8n-webhook-para-lead-capture`), **duas células do cubo**, **dois resultados completamente diferentes na tela** — todos backed pelos seus dados.

#### Cenário A: Zerado, Estágio 1, Camada Técnica

**Dados lidos:**
- `user_profiles`: `persona='zerado'`, `current_stage='stage_1'`, `preferred_layer='tecnica'`
- `resolve_lesson_for_user()` retorna variant `(stage_1, zerado, tecnica)` — **existe** (hipótese: Arquiteto priorizou esta célula).
- `layout_overrides`: `{ scaffolding_level: 3, visible_sections: ["context","concept","demo","practice","synthesis","extra_hints"], show_checkpoints: true, video_default_speed: 0.9, font_scale: 1.15 }`
- `content_overrides.tldr`: **omitido** (Zerado não tem TL;DR — ele precisa do caminho inteiro).
- `competencies_taught`: 1 competência, `bloom_level: 2` (compreender).
- `evidence_requirements`: `kind='tutorial_checklist'`, `passing_threshold: 100%` (8/8 itens binários — aceita hint sem penalidade, conforme Nucleo 02).
- `get_next_action_for_user()` → `message_zerado: "Vamos assistir juntos. Pause sempre que precisar."`

**O que ele VÊ:**
- Header: "Aula 3 de 12 desta trilha" (linear, porque Zerado precisa de linearidade).
- Vídeo a 0.9x com legendas grandes, botão TTS visível.
- 5 chapters visíveis + um sexto "dicas extras".
- Checkpoint a cada chapter: "Conseguiu acompanhar? [Sim, continuar] [Preciso rever]".
- Ao fim: checklist de 8 itens binários, cada um com botão "Preciso de ajuda" que revela hint sem penalizar.
- Tom: "vamos", "juntos", celebração em cada check.

#### Cenário B: Autodidata, Estágio 4, Camada Lógica

**Dados lidos:**
- `user_profiles`: `persona='autodidata'`, `current_stage='stage_4'`, `preferred_layer='logica'`
- `resolve_lesson_for_user()` retorna variant `(stage_4, autodidata, logica)`. Se não existir, fallback conforme ordem **que preserva persona**: tenta `(stage_3, autodidata, logica)` → `(stage_4, autodidata, tecnica)` → **só em último caso** solta persona.
- `layout_overrides`: `{ scaffolding_level: 0, visible_sections: ["demo","practice"], show_checkpoints: false, video_default_speed: 1.25, font_scale: 1.0, show_skip_and_prove: true }`
- `content_overrides.tldr`: **presente** — 3 bullets no topo.
- `competencies_taught`: 1 competência, `bloom_level: 5` (avaliar).
- `evidence_requirements`: `kind='json_workflow'`, rubric >= 80, reviewer `human` obrigatório (Bloom ≥5).
- `get_next_action_for_user()` → `message_autodidata: "Skip-and-prove disponível. Submit workflow."`

**O que ele VÊ:**
- Header: "n8n-webhook · stage 4 · lógica" (sem contagem linear — ele já sabe onde está).
- TL;DR de 3 bullets no topo.
- Botão **"Skip and prove"** grande ao lado do vídeo — ele submete direto a evidência sem assistir.
- Vídeo default 1.25x, só 2 chapters (demo, practice).
- Ao clicar em "submit evidence": upload de `.json` de workflow, campo de justificativa arquitetural ("por que webhook e não polling?").
- Tom: direto, sem "vamos", sem celebração barata. Feedback = "aceito, em review por humano, ETA 2h" (vindo de `mv_review_queue_eta`).

**A diferença NÃO é cosmética.** É: estrutura do layout, sections visíveis, existência de TL;DR, existência de skip-and-prove, velocidade de vídeo default, threshold de evidência, tipo de reviewer, tom de mensagem. **9 eixos de diferenciação**, todos lidos de `user_profiles` + `lesson_variants` + `assessments` + `competencies`. Nenhum hardcoded no front.

**Teste cego que vou rodar:** pegar dois alunos reais dessas duas células, pedir pra descreverem a experiência em 3 frases. Se as descrições se parecerem, a personalização é teatro e volto pra prancheta.

---

### O que NÃO consigo se Database não me der

Hard dependencies. Sem essas, a UI que prometi no Round 1/Round 2 é impossível:

1. **`resolve_lesson_for_user()` como função SQL única** — se cair em 5 queries separadas no frontend, a lesson carrega em 800ms+ e o Autodidata abandona. **Bloqueador de Fase 1.**

2. **`mv_lesson_variant_index`** — sem isso, toda navegação paga scan de `lesson_variants`. Grafo de competências fica lento. Bloqueador da experiência "cubo 3D sentido".

3. **`competency_prerequisites` + CTE recursiva** — sem o grafo, minha tela principal (grafo de competências) vira lista de aulas. Volto ao modelo antigo. **Bloqueador da doutrina CBE visual.**

4. **`user_journey_history` com trigger automático no UPDATE de `user_profiles.persona/stage/layer`** — sem isso, eu não consigo renderizar "você estava no Zerado há 30 dias, agora Autodidata — quer ver a versão atualizada da Aula 3?". Sem histórico, personalização é atemporal e sem narrativa. Esta é a ligação Kirkpatrick-3 com a UX.

5. **`mv_review_queue_eta`** — sem ETA realista, o aluno submete evidência e vê "em revisão" sem horizonte. CBE vira fila cega. Precisa existir desde o **dia 1 de CBE em produção**, mesmo que o cálculo inicial seja heurístico (média móvel 7d).

6. **Role `ui_design_editor`** que pode escrever em `lesson_variants.layout_overrides` e **nada mais** — sem separação de role, qualquer skill pode sobrescrever meus overrides de layout. Peço que esta role venha na sua migration `00012_pedagogical_roles.sql`.

7. **Função `record_user_context_change(user_id, persona, stage, layer, reason, actor)`** — única forma de alterar o contexto do aluno. Nem o front nem admins atualizam `user_profiles.persona` direto; passa pela função, que escreve em `user_profiles` + `user_journey_history` transacional. Sem isso, o histórico dessincroniza do estado.

8. **NÃO me dê `lessons_watched_count` no header query.** Pedido negativo. Se existir, alguém renderiza. Mantenha fora de Q5 até CBE estar estável.

---

### Resumo do contrato

| # | Artefato | Tipo | Owner | Bloqueador de Fase 1? |
|---|---|---|---|---|
| Q1 | `resolve_lesson_for_user` | function SQL | Database | **SIM** |
| Q2 | `get_competency_graph_for_track` | function SQL | Database | **SIM** |
| Q3 | `get_next_action_for_user` | function SQL | Database | Não (Fase 1.5) |
| Q4 | `get_unlock_reason` | function SQL | Database | **SIM** |
| Q5 | `get_progress_snapshot` | function SQL | Database | **SIM** |
| MV1 | `mv_user_competency_snapshot` | matview | Database | **SIM** |
| MV2 | `mv_track_completion_by_user` | matview | Database | Não |
| MV3 | `mv_lesson_variant_index` | matview | Database | **SIM** |
| MV4 | `mv_review_queue_eta` | matview | Database | **SIM** (no dia do 1º submit) |
| MV5 | `mv_daily_engagement_by_persona` | matview | Database | Não (Fase 2) |
| R1 | Role `ui_design_editor` | role | Database | **SIM** |
| F1 | `record_user_context_change` | function SQL | Database | **SIM** |

Se os **7 "SIM"** entrarem na Fase 1, eu entrego Lesson Experience sentida. Se qualquer um cair, eu entrego Lesson Experience no modo degradado — com disclaimers visíveis ao aluno de que a personalização está parcial. Não aceito degradar sem avisar o aluno.

**DONE.**
