# Round 3 — Schema Extensions dialogues

**Terminal:** Database
**Partners:** Backend Dev (Pedagogical Workflow) + UI UX Design (Lesson Experience)

---

## Dialogue 1: → @Backend Dev (Schema ↔ Workflow)

Backend Dev e eu chegamos por caminhos diferentes na mesma arquitetura. Round 2 confirmou: publish é consequência computada, progresso é append-only, gates são defesa em profundidade. Este diálogo fecha **onde mora cada invariante** — para parar de duplicar trabalho e começar a escrever migration + função em par.

### Invariantes que vão na DB (constraints/triggers)

Estas são **inegociáveis no schema**, porque qualquer caminho de escrita (UI, worker Python, psql direto via service_role, skill autônoma) tem que bater nelas. App layer não vê tudo.

1. **`lessons.is_published` é coluna não-writable.** `REVOKE UPDATE (is_published) ON public.lessons FROM authenticated, service_role`. Único caminho: função `publish_lesson(lesson_id, actor_id) SECURITY DEFINER` que reexecuta TODOS os gates do zero. Backend Dev owna a função; eu owno o REVOKE + a migration. Razão: trigger sozinho pode ser bypassado por superuser; revoke + função sozinhos podem ser bypassados por bug de RLS. Os dois juntos não.

2. **`pedagogical_reviews`, `user_journey_history`, `user_competency_progress_events` são append-only.** Trigger `BEFORE UPDATE OR DELETE FOR EACH ROW EXECUTE FUNCTION raise_immutable()`. Razão: Kirkpatrick 3-4, race conditions e calibration audit dependem de histórico imutável. Sem isto, "history" mente.

3. **`competencies.slug` e `competencies.bloom_level` são imutáveis pós-insert.** Trigger `BEFORE UPDATE` que `RAISE EXCEPTION IF OLD.slug <> NEW.slug OR OLD.bloom_level <> NEW.bloom_level`. Renomeação = deprecate + insert novo. Razão: `user_competency_progress.competency_id` é FK; renomear quebra histórico de aluno silenciosamente.

4. **Detector de ciclo em `competency_prerequisites`** como CONSTRAINT TRIGGER que roda DEFERRED no fim da transação. Função `fn_check_no_competency_cycle()` faz CTE recursiva. Razão: ciclo de pré-requisitos = aluno trava sem mensagem decifrável; é o tipo de bug que só aparece em produção.

5. **`pedagogical_reviews.feedback_md` NOT NULL e length ≥ 50 quando `status='rejected'`.** CHECK constraint composta. Razão: Backend Dev pediu no Round 1 (rejection sem feedback é morte para o aluno); CHECK no banco é mais barato que validação no app e impossível de bypassar.

6. **`assessment_attempts` UNIQUE parcial em `(user_id, competency_id, sha256)` WHERE sha256 IS NOT NULL.** Razão: anti-fraude de resubmissão idêntica (Round 2). É invariante de dados, mora na DB.

7. **`competency_progress_events` dedupe key:** UNIQUE em `(aggregate_type, aggregate_id, event_type, dedupe_key)`. Razão: idempotência (Backend Dev Round 2). Produtor envia `dedupe_key` (= `attempt_id` ou hash do payload); duplicata vira `ON CONFLICT DO NOTHING`. Sem isto, Personalization Router promove aluno duas vezes de estágio.

### O que fica pro app (Backend Dev decide)

Estas são regras de **fluxo**, não de dados. Se eu codificar no banco, viram cimento e o app perde flexibilidade quando a doutrina evoluir.

1. **Roteamento de quem revisa o quê.** Tabela `pedagogical_reviews` aceita qualquer reviewer válido; quem decide *qual reviewer pega qual lesson* é a função app `assign_review(lesson_id)` do Backend Dev. Razão: política de atribuição muda mais que schema.

2. **SLA + escalation.** `escalate_review(review_id)` é função SQL (eu provejo o esqueleto), mas **o trigger de tempo** (cron / pg_cron / worker poller) é Backend Dev. Razão: timing é orquestração, não dado.

3. **Backpressure de fila** (`v_review_queue_health`). Eu provejo a view; Backend Dev decide se a função `create_lesson_variant()` retorna ERROR ou só warning quando saturada. Razão: regra de admissão é política, não invariante.

4. **Discrepância `bloom_target` vs `bloom_assessed` > 1.** Backend Dev pediu Round 2: dispara segundo reviewer humano. **Não trigger** — função `transition_review_status()` lê os dois e decide. Razão: regra de calibração vai mudar conforme aprendemos. Trigger fossiliza.

5. **Geração de eventos de domínio.** O INSERT em `domain_events` é responsabilidade da função app (`record_competency_transition()`) que também insere em `user_competency_progress_events`. Não trigger AFTER INSERT, porque o consumo de evento depende de dedupe_key que só o produtor sabe.

6. **Resolve de variant para o aluno.** Função `get_lesson_for_user(user_id, lesson_id)` é função SQL (Backend Dev escreve, eu reviso). Não materialized view. Razão: persona muda em tempo real; cache vira mentira.

### Estratégia de locking proposta

Três cenários distintos, três mecanismos distintos. Não usar o mesmo martelo pra todos.

1. **Concurrent reviews na MESMA lesson** (agent reviewer + human reviewer simultâneos):
   - **`pg_advisory_xact_lock(hashtext('review:lesson:' || lesson_id::text))`** no início de `transition_review_status()`.
   - Lock é por transação, libera no commit. Outro reviewer espera ou desiste.
   - **Não usar `SELECT FOR UPDATE`** em `pedagogical_reviews` porque é append-only — não há row para travar; os "conflitos" são lógicos, não físicos.

2. **Concurrent submissions de evidência pelo MESMO aluno na MESMA competência** (aluno clica submit duas vezes, double-tap em mobile):
   - **UNIQUE constraint parcial em `assessment_attempts(user_id, competency_id, sha256)`** já cobre o caso de payload idêntico.
   - Para payload diferente: `SELECT pg_try_advisory_xact_lock(hashtext('attempt:' || user_id || ':' || competency_id))`. Se falha, retorna 409 ao app. Não enfileira — falha rápido.

3. **Concurrent publish de duas lessons que dependem uma da outra** (deadlock cross-lesson):
   - Ordenação determinística: dentro de `publish_lesson()`, qualquer lock adicional usa `ORDER BY lesson_id` antes de adquirir. Postgres não pega deadlock se a ordem é consistente.
   - Backend Dev: se você precisar pegar locks em múltiplas lessons na mesma transação, **passa a lista pra função e eu ordeno**, não chame `publish_lesson` em loop.

**Nada de `LOCK TABLE`.** Lock de tabela mata throughput e não resolve nenhum dos três casos acima.

### Pergunta direta de volta a Backend Dev

A função `record_competency_transition()` é o **único** caminho de escrita em `user_competency_progress_events`? Se sim, eu REVOKE INSERT da tabela e GRANT EXECUTE só na função. Se você precisa de outro caminho (ex: backfill de alunos legados), me diga agora — depois é breaking. Minha proposta: o backfill da migration `00015b` usa um GRANT temporário com `SET LOCAL role` que é dropado no fim da migration.

---

## Dialogue 2: → @UI UX Design (Data → Experience)

UI UX foi o terminal que mais me fez repensar a forma das tabelas. O insight dela do Round 2 — *"persona é invariante mais forte que stage no fallback"* — não é UX, é regra de query. Vai mudar a função `resolve_variant()`. Este diálogo fecha **quais views eu exponho** e **como o cubo se torna SQL legível**.

### Views/queries que vou expor

Cinco views (não materializadas, salvo onde dito) + duas funções. UI UX consome via Supabase client; nunca lê tabelas raw.

1. **`v_user_lesson_state`** — uma row por (user_id, lesson_id). Shape:
   ```
   user_id, lesson_id, lesson_title,
   resolved_variant_id,           -- qual variant a função escolheu
   variant_match_quality enum('exact','stage_drift','layer_drift','persona_drift','none'),
   is_unlocked bool,
   blocked_by_competency_id uuid,  -- null se desbloqueada
   block_reason enum('not_started','evidence_pending','review_pending','prereq_missing'),
   next_action enum('start','submit_evidence','wait_review','watch_lesson'),
   competencies_taught uuid[],
   competencies_demonstrated uuid[]
   ```
   Os enums `block_reason` e `next_action` existem porque UI UX pediu Round 2: "três enums, três UIs distintas". Sem enum, frontend improvisa string e a mensagem fica inconsistente por tela.

2. **`v_user_competency_graph`** — para a tela "grafo de competências da trilha" do Round 1 dela. Shape:
   ```
   user_id, track_id, competency_id, competency_title,
   bloom_level, framework,
   status enum('not_started','in_progress','submitted','approved','mastered'),
   depends_on uuid[],              -- arestas do grafo
   evidence_attempt_id uuid,       -- pra link "ver minha submissão"
   approved_at timestamptz,
   is_stale bool                   -- expiração calculada em runtime, não silenciosa
   ```
   `is_stale` é a discordância que tive com QA Round 2 — não muda status, só exibe badge.

3. **`v_user_journey_timeline`** — para a tela "onde você estava há 30 dias". Append-only é a fonte; index `(user_id, changed_at DESC)` é o que faz isto custar <5ms. Shape: `user_id, changed_at, persona, journey_stage, preferred_layer, reason`.

4. **`v_review_queue_health`** — só para dashboards do `pedagogical_admin` (RLS restritiva). Shape: `queue_type, pending_count, oldest_pending_age, escalated_count`.

5. **`v_lesson_chapters`** — shape:
   ```
   lesson_id, chapter_index, kind enum('context','concept','demo','practice','synthesis'),
   start_seconds int, end_seconds int, label text
   ```
   Origem: `lessons.chapters jsonb` (UI UX pediu Round 2) explodida via `jsonb_to_recordset`. Razão de ser view: o wrapper Autodidata pula chapters `context`; o wrapper Zerado repete chapters `concept`. Isso vira **filtro de query**, não condição em código React.

### Funções (não views)

Quando o input é (user_id + lesson_id) e o output é "uma coisa resolvida agora", **função SQL** é o pattern certo. Cache HTTP no edge se precisar.

1. **`get_lesson_for_user(user_id, lesson_id) RETURNS jsonb`** — Backend Dev escreve, eu reviso. Aplica resolve de variant + overrides + chapter filter por persona. UI UX consome via server action.

2. **`fn_resolve_variant(user_id, lesson_id) RETURNS uuid`** — implementa a ordem de fallback que UI UX defendeu Round 2: persona é invariante mais forte. Pseudo:
   ```
   try (stage_exact, persona_exact, layer_exact)
   else (stage±1, persona_exact, layer_exact)
   else (stage_exact, persona_exact, layer_adjacent)
   else (stage±2, persona_exact, layer_any)
   else (stage_any, persona_relaxed, layer_any)  -- último recurso
   else NULL                                       -- frontend mostra "ainda não adaptada pro seu perfil"
   ```
   Match quality vai pra `v_user_lesson_state.variant_match_quality` para a UI ser **honesta** sobre a lacuna (Round 2 dela).

### Materialized views vs on-demand

| View | Estratégia | Razão |
|---|---|---|
| `v_user_lesson_state` | **on-demand** | Persona muda em tempo real; cache mente exatamente quando UX importa. |
| `v_user_competency_graph` | **on-demand** | Status muda quando reviewer aprova; cache fica obsoleto em segundos. |
| `v_user_journey_timeline` | **on-demand** | É leitura de tabela append-only com índice; já é O(log n). MV é overkill. |
| `v_review_queue_health` | **materialized, refresh a cada 60s** via `pg_cron` | Dashboard, não tela de aluno. Latência de 1min é aceitável. Reduz carga em queries de agregação pesada. |
| `v_lesson_chapters` | **on-demand** | Trivial (jsonb explode). MV não justifica. |
| `v_kirkpatrick_4_revenue` (futura) | **materialized, refresh diário** | Agregação de mês. Ninguém olha em real-time. |

**Regra geral:** se o aluno olha → on-demand. Se admin olha em dashboard → MV com refresh agendado. UI UX tinha proposto MV para `resolved_lesson_for_user`; concordo com Backend Dev: errado. MV ali é cilada.

### Cube 3D query exemplo

A query que o `get_lesson_for_user()` executa internamente (versão simplificada, sem todas as colunas):

```sql
WITH user_ctx AS (
  SELECT id, current_stage, persona, preferred_layer
  FROM user_profiles WHERE id = $1
),
candidates AS (
  SELECT
    lv.id AS variant_id,
    lv.stage, lv.persona, lv.layer,
    lv.content_overrides, lv.layout_overrides,
    -- distância no cubo 3D, com persona pesando 100x mais que stage/layer
    (CASE WHEN lv.persona = uc.persona THEN 0 ELSE 100 END)
    + ABS(COALESCE(lv.stage::int - uc.current_stage::int, 0))
    + (CASE WHEN lv.layer = uc.preferred_layer THEN 0
            WHEN lv.layer IS NULL THEN 1
            ELSE 2 END) AS cube_distance
  FROM lesson_variants lv
  CROSS JOIN user_ctx uc
  WHERE lv.lesson_id = $2
    AND lv.review_status = 'approved'
)
SELECT
  c.variant_id,
  c.content_overrides,
  c.layout_overrides,
  CASE
    WHEN c.cube_distance = 0 THEN 'exact'
    WHEN c.cube_distance < 100 THEN 'stage_or_layer_drift'
    ELSE 'persona_drift'
  END AS match_quality
FROM candidates c
ORDER BY c.cube_distance ASC
LIMIT 1;
```

**O peso 100x na persona** é a regra de UI UX Round 2 traduzida em SQL. É a única decisão de produto que mora na função SQL — todo o resto (qual variant existe, qual está aprovada, qual layout aplicar) é dado.

Index obrigatório para isto custar <10ms:
```sql
CREATE INDEX idx_lesson_variants_resolve
  ON lesson_variants (lesson_id, review_status, persona, stage, layer)
  WHERE review_status = 'approved';
```

### Pergunta direta de volta a UI UX

Você confirmou Round 2 que `<EvidenceSubmitter evidenceKind={kind}>` é UM componente. Pergunta: o `kind` vem de `assessments.type` (Núcleo 02) ou de uma coluna nova `evidence_kind` em `competencies`? Se for o primeiro, eu não toco no schema. Se for o segundo, preciso adicionar agora em `00013_competencies.sql` antes de Núcleo 02 fechar `00017_assessments.sql`. Decida com Núcleo 02 e me avisa — eu não modelo até saber.

E o segundo pedido: você quer `lessons.chapters jsonb` ou `lesson_chapters` como tabela? Se for jsonb, eu escrevo o JSON Schema e a view `v_lesson_chapters` explode. Se for tabela, é mais query-friendly mas mais migrations. Meu voto: jsonb (chapters não são consultados isoladamente, sempre vêm com a lesson). Confirma?

DONE.
