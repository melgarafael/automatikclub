# Round 2 — pedagogical-workflow reaction

**Voz:** Backend Dev / Pedagogical Workflow. Eu sou o dono dos gates.
**Lente desta rodada:** depois de ler os 6 outros round-1, onde eu reforço, onde eu refino, e o que ninguém viu.

---

## Pontos de acordo (que reforço)

- **Schema Extensions (Database) — "matar `auto_complete_lesson` ou CBE é teatro" + trigger SQL exigindo review humana aprovada antes de `is_published`.**
  Minha extensão: as duas coisas são a *mesma* arquitetura defendida no meu Round 1 (publish como consequência, não causa). Vou casar com a proposta dele: a função `fn_require_review_before_publish` dele é exatamente o ponto onde eu plugo a `SECURITY DEFINER publish_lesson(lesson_id, actor_id)` que reexecuta todos os gates. Não duplicar — eu owno a função, ele owna a migration. Combinamos a interface: a função dele só checa "tem review aprovada?"; a minha agrega isso + os outros gates (cognitive_load preenchido, evidence_url presente nas competencies, ciclo de pré-requisitos OK).

- **Pedagogical QA — "review aprovada não é booleano, é uma matriz" + `pedagogical_review_criteria` + `bloom_assessed` (constatado pelo reviewer, não declarado pelo autor).**
  Minha extensão: isso resolve um buraco que eu não tinha visto. A discrepância `bloom_target` (autor) vs `bloom_assessed` (reviewer) vira um *trigger* na minha máquina de transição: se a diferença for > 1 nível, a transição `pending → approved` exige um segundo reviewer humano automaticamente. Calibration drift vira escalation, não warning. Eu adiciono na função `transition_review_status`.

- **Instructional Design (Arquiteto) — separação dura entre "matriz pedagógica = consistência (bloqueante)" e "voz do professor = liberdade (livre)".**
  Minha extensão: isso me dá a régua exata pra desenhar o que minha API rejeita vs o que ela só registra. Endpoints de mutation em campos da matriz (`bloom_target`, `competency_id`, `evidence_spec`) passam por gates duros. Endpoints em campos de voz (`title`, `script_md`, `video_url`) passam por gate só de existência, não de conteúdo. Implementação: dois conjuntos de RLS policies, dois conjuntos de funções SECURITY DEFINER. A linha entre os dois é a fronteira do meu sub-epic.

- **Content Production (Núcleo 01) — backpressure explícito ("se fila humana > 20 itens por 3 dias, orchestrator para de gerar").**
  Minha extensão: isso vira uma view `v_review_queue_health` + um gate na função `create_lesson_variant(...)` que retorna ERROR `queue_overflow` quando a fila do tipo correspondente está saturada. Backpressure no banco, não no orchestrator — assim qualquer worker (Núcleo 01, Núcleo 02, agent reviewer) que tente inserir bate na mesma parede. Nenhum worker pode "não saber" da fila.

- **Assessment Engine (Núcleo 02) — `competency.acquired` como evento de domínio + tabela `domain_events` consumida por poller, sem broker.**
  Minha extensão: aceito e amplio. Eu já precisava de um lugar pra registrar transições de `pedagogical_reviews.status`, transições de `user_competency_progress.status` e mudanças de `user_journey_history`. Tudo isso vira `domain_events (id, aggregate_type, aggregate_id, event_type, payload jsonb, occurred_at, consumed_by[])`. Append-only, indexado por `(aggregate_type, occurred_at)`. Personalization Router, dashboards Kirkpatrick e drift detector consomem do mesmo lugar. Uma tabela, N consumidores.

---

## Pontos de discordância ou refinamento

- **Lesson Experience (UI UX Design) — "view materializada `resolved_lesson_for_user` que já aplica overrides pelo contexto corrente do aluno".**
  Minha objeção: view *materializada* aqui é cilada. O contexto do aluno (`current_stage`, `persona`) muda; uma materialized view é congelada até REFRESH. Vou ter dados velhos no momento crítico (logo após o aluno mudar de estágio) — exatamente quando UX precisa estar correta.
  Minha proposta: **view normal** (não materializada) + função `get_lesson_for_user(user_id, lesson_id) RETURNS jsonb` que faz o resolve em tempo real. Cache HTTP no edge se precisar performance, nunca cache no banco. Append-only no histórico, leitura sempre fresh no presente.

- **Núcleo 01 (Content Production) — "lesson_variants apontam para uma `lessons` canônica via `lesson_id` (mãe) + 3 eixos do cubo".**
  Minha objeção: isso me obriga a duas hierarquias paralelas (`lessons` canônica e `lesson_variants` derivadas) e cria ambiguidade no gate de publicação — publica a mãe ou a variant? Os reviews são da mãe ou da variant? RLS fica confusa.
  Minha proposta (alinhada com o que QA defendeu em Topic 4): variantes são **wrappers**, não rewrites. O conteúdo bruto vive em `lessons` (uma linha), o cubo vive em `lesson_personalizations (lesson_id, stage, persona, layer, overrides_jsonb)` — essa é a tabela do UI UX. O `lesson_generator_runs` do Núcleo 01 continua existindo, mas grava overrides JSONB, não duplicatas de markdown. Publicação é uma só (da lesson). Reviews são da lesson + dos overrides separadamente. Anti-explosão: 1 lesson + N overrides ≪ 1+54 lessons.

- **Pedagogical QA — "se eu não responder em 4h úteis, passa default approve" (SLA com auto-approve).**
  Minha objeção: auto-approve por timeout viola o invariante do meu trigger ("publica só com review aprovada explicitamente"). Pior: cria o anti-padrão "espera o relógio rodar" — exatamente o oposto de CBE.
  Minha proposta: SLA continua, mas o que acontece no estouro é **escalation**, não approve. Após 4h, a review entra em fila `escalated` visível pro `pedagogical_admin` e notifica o Master Maestro. O autor vê "em escalation" no dashboard, não vê "aprovada por timeout". Pressão social, não bypass técnico.

---

## Lacunas que ninguém cobriu

- **Migrations destrutivas em produção viva.** Database propõe `00015` que deprecia `auto_complete_lesson` e introduz `user_competency_progress`. Mas hoje há alunos com progresso em `user_lesson_progress.is_completed`. Ninguém escreveu o **plano de migração de dados** (não de schema): quem gera as primeiras `user_competency_progress` rows pros alunos legados? Eles "perdem" o progresso? Isso é um problema de Pedagogical Workflow porque eu sou quem responde pelo gate de transição. Proposta: migration `00015b_backfill` que insere 1 row `competency_status='not_started'` por (user, competency) inferida das tracks já matriculadas. Sem dados artificiais de "demonstrated" — começamos honestos.

- **Idempotência de eventos de domínio.** Núcleo 02 propõe `domain_events` mas ninguém falou em **deduplicação**. Worker poller pode reprocessar. Se `competency.acquired` for emitido duas vezes, Personalization Router pode promover o aluno duas vezes de estágio. Proposta minha: chave única `(aggregate_type, aggregate_id, event_type, dedupe_key)` onde dedupe_key é o `attempt_id` ou hash do payload. Idempotência é responsabilidade do produtor, não do consumidor.

- **Quem owna o catálogo de competências.** Todo mundo (Arquiteto, QA, Núcleo 01, Núcleo 02, Database) pediu o catálogo como input. Ninguém disse quem **edita** ele em produção, com que processo, com que review. Risco operacional: mês 3, alguém renomeia uma competência slug e quebra `user_competency_progress.competency_id`. Proposta minha: `competencies` é append-only. Renomeação = deprecate + create new + migration manual. Slug é PK lógica imutável. Trigger bloqueia UPDATE de `slug` ou `bloom_level`.

- **Auditoria do auditor.** QA mencionou inter-rater reliability ("a cada 50 lessons, sample de 10 pra humano sênior re-revisar"). Isso precisa de **tabela**, não só processo. Proposta: `review_audits (review_id, audited_by, agreed BOOL, delta_notes, audited_at)`. Se agreement < 80% por 30 dias, gate automático: o reviewer perde permissão de aprovar Bloom ≥5 até recalibrar. RLS + role demotion automática.

---

## Pedidos diretos a outros terminals

- **@Database (Schema Extensions):** aceitar minha contraproposta: as tabelas `user_journey_history`, `pedagogical_reviews` e `user_competency_progress` são **append-only por design** (BEFORE UPDATE/DELETE trigger que dá `RAISE EXCEPTION`). Sua migration `00014`/`00015`/`00016` precisa incluir esses triggers. Sem isso eu não consigo garantir Kirkpatrick 3-4 nem auditoria de calibração.

- **@Pedagogical QA:** aceitar que o SLA é **escalation, não auto-approve**, e co-desenhar comigo a função `escalate_review(review_id)` que move pra fila do `pedagogical_admin`. Eu owno a função, você owna a rubric. Topa?

- **@Instructional Design (Arquiteto):** preciso da decisão sobre **competencies têm pré-requisitos entre si?** (grafo) ou são flat (lista). Isso muda completamente o algoritmo de unlock e o detector de ciclo. Sem essa decisão eu não escrevo a função `unlock_lesson_for_user`. Voto: grafo, com `competency_prerequisites (competency_id, depends_on)` + CONSTRAINT TRIGGER de detecção de ciclo no INSERT.

- **@Content Production (Núcleo 01):** aceitar o modelo de **wrappers/overrides** ao invés de `lesson_variants` como linha duplicada. Seu `lesson_generator_runs` continua exatamente como você descreveu — só que o output dele preenche `lesson_personalizations.overrides_jsonb`, não uma nova `lessons`. RLS, gate de publicação e rastreabilidade ficam unificados.

- **@Assessment Engine (Núcleo 02):** confirmar que **assessment_attempts** vai ter FK para `user_competency_progress.evidence_submission_id` (a coluna que Database propôs no Topic 6 do round-1 dele). Eu preciso que essa FK exista pra fazer o gate `unlock_lesson` ler attempt status sem JOIN gigante. Estamos alinhados?

- **@Lesson Experience (UI UX Design):** aceitar que `get_lesson_for_user(...)` é função, não materialized view, e que o frontend consome via server action. Cache HTTP no edge. Topa?

---

## Síntese minha (pós-leitura)

Minha posição do Round 1 (publish como consequência computada, não coluna writable; competency progress como append-only com evidence_url obrigatório; advisory locks contra race entre workers) **sobreviveu** intacta a todos os 6 documentos — três deles (Database, QA, Núcleo 02) chegaram a conclusões idênticas por caminhos diferentes, o que aumenta minha confiança. O ajuste real é abandonar minha noção implícita de "lesson variant como linha duplicada" e adotar o modelo **wrapper/override** que QA + UI UX defenderam — isso desambigua todo o gate de publicação e elimina a explosão combinatória sem custar rastreabilidade. Os dois pontos cegos que eu não tinha visto e agora viram trabalho do meu sub-epic: (a) **plano de backfill** dos alunos legados pra `user_competency_progress` — sem isso, a Fase 2 quebra a UX de quem já está dentro; e (b) **idempotência de eventos de domínio** com dedupe_key, antes que Personalization Router promova alguém duas vezes. Por fim, o `escalation em vez de auto-approve` é a única discordância onde eu não cedo: o gate só vale se ninguém puder esperar o relógio rodar pra publicar.

DONE.
