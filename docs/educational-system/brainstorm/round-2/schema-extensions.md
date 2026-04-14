# Round 2 — schema-extensions reaction

**Terminal:** Database
**Lido:** instructional-design, pedagogical-workflow, lesson-experience, pedagogical-qa, content-production, assessment-engine
**Não lido:** o meu próprio (schema-extensions.md)

---

## Pontos de acordo (que reforço)

- **Pedagogical Workflow (Backend Dev):** "REVOKE UPDATE em `lessons.is_published` de todas as roles exceto uma função SECURITY DEFINER `publish_lesson()`" — minha extensão: **adoto integralmente**. Isso é mais forte que o meu trigger BEFORE UPDATE do Round 1, porque trigger pode ser bypassado por superuser; permission revoke não. Vou redesenhar a migration `00019_doctrine_validator.sql` para fazer **as duas coisas em camadas**: REVOKE no GRANT layer + trigger no DML layer + função SECURITY DEFINER única. Defesa em profundidade real, não slogan.

- **Pedagogical Workflow (Backend Dev):** `pedagogical_reviews` é **append-only por reviewer** (cada nova revisão = nova linha; nunca UPDATE) + trigger `BEFORE UPDATE/DELETE` que dá `RAISE EXCEPTION` em `user_journey_history` — minha extensão: **estendo essa imutabilidade para `user_competency_progress.status` transitions**. Não permito UPDATE direto da coluna `status`; toda transição vira INSERT em uma tabela nova `user_competency_progress_events` (id, user_id, competency_id, from_status, to_status, actor_id, evidence_submission_id, created_at). O estado atual vira VIEW agregada. Isso destrava o `pg_advisory_xact_lock` que ele propõe sem race conditions.

- **Pedagogical QA:** `pedagogical_reviews` precisa de `review_round int`, `bloom_assessed smallint` (o que reviewer constatou ≠ o que autor declarou), `competency_evidence_link` — minha extensão: **adicionado à migration 00016 hoje**. Concordo 100% e adiciono também `criterion_results jsonb` (validado por JSON Schema) para a matriz de critérios que ela quer em `pedagogical_review_criteria`. Tabela separada para a matriz é overkill — JSONB com schema versionado serve.

- **Assessment Engine (Núcleo 02):** `evidence_url` do `user_competency_progress` deve apontar pro **melhor `assessment_attempt` aprovado**, não pra um upload solto — minha extensão: **isso valida a FK que propus no Round 1** (`evidence_submission_id`). Núcleo 02 nomeia diferente (`assessment_attempts` em vez de `user_exercise_submissions`), mas é a mesma estrutura. **Aceito o nome dele** — `assessment_attempts` é mais preciso. Migration 00017 vira `00017_assessments.sql` com seu shape (assessments, rubrics, assessment_attempts, rubric_scores, evidence_artifacts) e a FK em `user_competency_progress.evidence_attempt_id` aponta para `assessment_attempts(id)`.

- **Content Production (Núcleo 01):** `lesson_generator_runs (prompt_version, model, inputs_hash, outputs, tokens, cost, reviewer_feedback)` — minha extensão: **aceito como nova migration 00020_generator_runs.sql**, mas insisto em **não** criar `lesson_snippets` versionado git-like agora. Versionamento git-like de snippets em Postgres é uma armadilha de complexidade — começa simples e vira sistema de VCS amador. Proposta: `lesson_snippets` flat com `version smallint` + `superseded_by uuid`, sem branches, sem merges. Se a complexidade real exigir mais, migra-se depois.

- **Instructional Design (Arquiteto):** "competências podem ter pré-requisitos entre si" (grafo, não lista) — minha extensão: **crio `competency_prerequisites (competency_id, requires_id, kind enum('hard','soft'))`** + função `fn_check_no_competency_cycle()` como CONSTRAINT TRIGGER (que o Backend Dev também pediu no Topic 7). Hard prereq = bloqueia unlock; soft = exibe warning. View `v_user_unlocked_lessons` (que Backend Dev quer) consome esse grafo via CTE recursiva.

---

## Pontos de discordância ou refinamento

- **Lesson Experience (UI UX) e Content Production (Núcleo 01):** ambos propõem **`lesson_personalizations` / `lesson_variants`** como tabela separada com `(stage, persona, layer)` overrides — minha objeção: **duas tabelas distintas para o mesmo conceito vai virar guerra de naming.** Núcleo 01 quer `lesson_variants` (conteúdo gerado), UI UX quer `lesson_personalizations` (overrides de layout). Eles parecem coisas diferentes mas vão colidir na hora do JOIN. Minha proposta concreta: **uma única tabela `lesson_variants`** com duas colunas — `content_overrides jsonb` (Núcleo 01: script_md, kolb_phase_durations) e `layout_overrides jsonb` (UI UX: visible_sections, ordering, scaffolding_level). Mesmo PK composta `(lesson_id, stage, persona, layer)`. Quem escreve cada coluna é controlado por RLS por role, não por separação física. Se aceitarem, evitamos uma migração de unificação dolorosa em 6 meses.

- **Pedagogical QA:** "expiração de competências de ferramenta em 12 meses" (`expires_at`) — minha objeção: **expiração automática silenciosa é silent failure de UX**. Aluno vai abrir a plataforma um dia e ver competências "desaparecidas" sem ação dele. Minha proposta: **adicionar `expires_at` mas NÃO mudar `status` automaticamente**. Em vez disso, view `v_competency_freshness` calcula `is_stale boolean` em runtime; UI mostra "atualizar evidência" mas o `status='approved'` permanece até o aluno tomar ação OU até reviewer humano explicitamente reprocessar. Expiração é sinal pedagógico, não bytecode de revogação.

- **Assessment Engine (Núcleo 02):** `evidence_artifacts` separada de `assessment_attempts` com `sha256` próprio — minha objeção parcial: **separar artifacts em tabela própria é correto, mas o `sha256` precisa de constraint UNIQUE para detectar resubmissão idêntica** (anti-fraude). Minha proposta: `UNIQUE (user_id, competency_id, sha256)` parcial (sem null), e o trigger de submissão rejeita com mensagem "evidência idêntica já submetida em <data>". Sem isso, aluno re-submete o mesmo arquivo após rejeição esperando reviewer diferente aprovar — gaming clássico de CBE.

---

## Lacunas que ninguém cobriu

- **Migration ordering vs RLS bootstrap:** ninguém falou em qual ordem as policies RLS são criadas em relação às tabelas que dependem de roles ainda não existentes. Pedagogical QA quer role `pedagogical_admin`; Backend Dev quer service_role para workers; Núcleo 01 quer role `pending_review`-only. Isso são **3 roles novas** que precisam existir ANTES das migrations 00016/00017/00018, ou tudo quebra. Eu vou criar uma migration `00012_pedagogical_roles.sql` (anterior a tudo) com `CREATE ROLE` idempotente + GRANTs base. Sem isso, o resto é teatro.

- **Backup/restore de `user_journey_history` e `user_competency_progress_events`:** essas tabelas são append-only e crescem sem teto. Em 2 anos × 10k alunos × 50 transições = 500k rows fáceis. Nenhum terminal mencionou estratégia de retenção ou particionamento. Do ângulo de schema: **proponho particionamento por `created_at` mensal desde o dia 1** (PARTITION BY RANGE). Migrar de tabela não particionada para particionada depois é caro. Decidir agora é grátis.

- **Auditoria do auditor (Pedagogical QA mencionou inter-rater agreement, mas sem schema):** se QA Review vai medir agreement entre ela e humano sênior, **isso é uma tabela**: `review_calibration_samples (review_id, original_decision, recalibration_decision, reviewer_id, agreement_score)`. Sem schema, "calibração" vira planilha solta. Eu adiciono à migration 00016.

- **`competencies.framework` enum vs livre:** Eu propus no Round 1 como TEXT livre. Lendo Núcleo 02 e Núcleo 01, vejo que **eles consomem como discriminador de comportamento** ("se framework=`7-passos`, gere stepper"). Isso exige enum estável. Vou converter para `competency_framework enum('empresa-ia-humanizada','3-camadas','7-passos','3-cs','jornada-7-fases','generic')`. Drift de string é o tipo de bug que mata pipelines silenciosamente.

---

## Pedidos diretos a outros terminals

- **@Arquiteto (Instructional Design):** preciso do **catálogo seed de competências** (mesmo que sejam 20) com `slug, title, bloom_level, framework, parent_competency_id` antes de eu finalizar `00013_competencies.sql`. Sem seed, a migration nasce vazia e ninguém testa. Pode ser markdown — eu converto para SQL.

- **@Backend Dev (Pedagogical Workflow):** confirma se **toda escrita em `user_competency_progress_events` passa por uma única função `record_competency_transition(user_id, comp_id, to_status, evidence_attempt_id, actor_id, rationale)`**. Se sim, eu REVOKE INSERT direto na tabela e GRANT EXECUTE só na função. Se você precisa de outros caminhos de escrita, me diga agora — depois é breaking.

- **@Núcleo 02 (Assessment Engine):** o **JSON Schema do `rubrics.criteria`** — eu preciso disso antes de 00017. Não aceito `jsonb` sem schema versionado por `schema_version smallint`. Me manda o draft, eu adiciono `CHECK (jsonb_matches_schema(criteria, schema_version))` via função.

- **@Núcleo 01 (Content Production):** **fecha comigo a tabela `lesson_variants` unificada** (a proposta da seção de discordância acima). Se você insistir em tabela separada de UI UX, eu cedo, mas preciso saber agora para criar a FK certa em `lesson_generator_runs`.

- **@QA Review (Pedagogical QA):** o **JSON Schema do `pedagogical_reviews.criterion_results`** — mesma exigência. Schema versionado ou não vai pra produção. E me confirma se o `bloom_assessed` é coluna SMALLINT solta ou subcampo do JSON.

- **@UI UX Design (Lesson Experience):** os "wrappers de persona" (Zerado/Autodidata/Organizado) — eles são código React puro consumindo `user_profiles.persona`, ou precisam de uma tabela `persona_layout_rules`? Se for tabela, eu preciso modelar agora; se for código, eu não toco.

---

## Síntese minha (pós-leitura)

A leitura dos 6 confirma minha tese central do Round 1 — **o schema atual mente sobre a doutrina** — e me força a apertar três coisas: (1) **transições de estado viram eventos append-only** (`user_competency_progress_events` em vez de UPDATE no status), porque três terminais distintos pediram imutabilidade por motivos diferentes (auditoria, race conditions, Kirkpatrick); (2) **`lesson_variants` precisa ser uma tabela única** servindo Núcleo 01 e UI UX, ou viramos guerra de FKs em 6 meses; (3) **defesa em profundidade na publicação** — REVOKE + função SECURITY DEFINER + trigger, não só trigger como propus inicialmente. Mantenho meus três não-negociáveis (matar `auto_complete_lesson`, exigir review humana via DB, auto-log de jornada), e adiciono um quarto: **CREATE ROLE pedagogical_admin/content_author/reviewer_agent vem ANTES de qualquer outra migration** — sem roles, RLS é decoração e tudo quebra em produção. Próximo round: fecho as 8 migrations (00012–00020) com FKs cruzadas resolvidas e levo um diagrama ER pra todo mundo bater o martelo.

DONE.
