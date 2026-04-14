# Round 1 — Pedagogical Workflow (Backend Dev)

**Role:** Backend Dev — owner of Pedagogical Workflow (sub-epic 03).
**Voice:** WORKFLOW LOGIC. Gates, transitions, race conditions, failure modes, agent-vs-human disagreement.
**Anchors:** Charter Part II (doctrine), Part IV (decisões arquiteturais — esp. §4.2, §4.4, §4.5).

---

## Topic 1: Metodologias

**Minha posição (Pedagogical Workflow):**
Metodologias (Backward Design, Bloom, CBE, Kolb, 3 Camadas, 3 Cs, 7 Passos) só existem para mim como **constraints executáveis em tabelas e gates**. Não me importa se Bloom tem 6 níveis em prosa — me importa que `lessons.bloom_target SMALLINT CHECK BETWEEN 1 AND 6 NOT NULL`, e que nenhuma trilha pode ser marcada `is_complete` sem ter pelo menos uma lesson de nível 5 ou 6. Backward Design vira um trigger: ao criar uma `track`, exigir `outcome_statement` + `evidence_spec` antes de permitir inserção de courses. Kolb vira um campo `lesson.kolb_phase` que o QA Review pede pra balancear.

Operacionalmente: cada metodologia precisa de **um campo + uma constraint + um gate de publicação**. Se não couber nesse formato, não é doutrina, é decoração.

**O que preciso dos outros:**
- **Arquiteto:** lista fechada de quais metodologias geram campo no schema vs quais ficam como heurística pro QA. Não posso ter 7 metodologias com 7 colunas se 4 nunca são consultadas.
- **Database:** confirmar que `bloom_target`, `kolb_phase`, `camada_maestria` cabem em ENUMs ou tabelas-lookup, e qual padrão o tomik-db-doctrine prefere (ENUMs Postgres são o padrão atual).
- **Nucleo 01:** template de `outcome_statement` que satisfaz Backward Design — preciso saber o que validar no INSERT.

**Risco crítico:**
Metodologia vira lip-service. Time enche o schema de campos `bloom_level`, `kolb_phase`, `camada` e ninguém os preenche corretamente porque não há enforcement. **Mitigação:** NOT NULL + CHECK constraints + a publicação de qualquer lesson é bloqueada por trigger se algum campo doutrinário estiver vazio. Falhar cedo, falhar no INSERT.

---

## Topic 2: Arquitetura

**Minha posição (Pedagogical Workflow):**
Charter §4.1 trava a hierarquia em `tracks → courses → modules → lessons` e isso é bom — não vou tocar. Onde eu moro é nas **tabelas auxiliares de workflow**:

1. `pedagogical_reviews` (§4.4) — gate de publicação. **Estado é máquina finita:** `pending → in_review → approved | rejected | needs_revision`. Transições só via função SQL `transition_review_status(review_id, new_status, actor_id)` que valida quem pode mover o quê.
2. `user_competency_progress` (§4.2) — só aceita INSERT/UPDATE se `evidence_url IS NOT NULL` quando `status='demonstrated'`. CHECK constraint, não validação no app.
3. `user_journey_history` (§4.3) — append-only. **Sem UPDATE, sem DELETE.** Trigger `BEFORE UPDATE/DELETE` que dá `RAISE EXCEPTION`. Histórico imutável é o que sustenta Kirkpatrick 3-4.

Workers Python (§4.5) rodam local mas **escrevem no mesmo Postgres** que o app produção. Isso significa que dois terminais Maestri podem tentar revisar a mesma lesson ao mesmo tempo. Solução: `pg_advisory_xact_lock(hashtext('lesson:' || lesson_id))` no início de qualquer operação de review. Sem isso, o agent-reviewer e o human-reviewer pisam um no outro.

**O que preciso dos outros:**
- **Database:** as 3 tabelas acima como migrations idempotentes (já temos a convenção do `00013_*.sql`). Quero RLS desde o dia 1, não retrofit.
- **Security:** policy RLS pra `pedagogical_reviews`: só `reviewer_id = auth.uid()` ou role `pedagogical_admin` pode UPDATE. Workers locais usam service_role — confirmar que isso é aceitável.
- **Arquiteto:** decidir se `competencies` é flat ou hierárquica (pré-requisitos entre competências). Isso muda completamente o algoritmo de "pode avançar?".

**Risco crítico:**
Race condition entre worker local (agent reviewer) e UI (human reviewer) aprovando/rejeitando o mesmo review. Sem advisory lock, o último write ganha e o histórico mente. **Mitigação:** advisory lock + a tabela `pedagogical_reviews` é append-only por reviewer (cada nova revisão é uma nova linha, não UPDATE da anterior). `is_published` é função: `SELECT bool_and(latest_per_reviewer.status='approved') FROM ...`.

---

## Topic 3: Progressão CBE

**Minha posição (Pedagogical Workflow):**
"Aluno avança por evidência demonstrável" (§4.2) só funciona se eu tiver uma resposta determinística pra: **quando o aluno desbloqueia a próxima lesson?** Minha proposta:

```
unlock(user, lesson) :=
  ALL competencies in lesson.prerequisites EXIST in user_competency_progress
  WHERE status='demonstrated' AND evidence_url IS NOT NULL
```

Implementação: VIEW `user_unlocked_lessons` que o frontend consulta. **Não é cache** — é computado on-read porque o estado muda quando uma evidence é aceita. Cache vira bug.

Estados de competency: `not_started → in_progress → submitted → demonstrated | rejected`. `submitted → demonstrated` requer review aprovada (reuso da máquina do Topic 2). `rejected` volta pra `in_progress` automaticamente após N dias OU manual pelo aluno (decisão pro Arquiteto).

**Crítico:** evidência é `evidence_url` mas tipos variam (vídeo, repo git, deploy URL, screenshot). Coluna adicional `evidence_type ENUM('video','repo','deploy','artifact','quiz_score')` + validação por tipo (quiz_score precisa de threshold, repo precisa ser URL git válida, etc.).

**O que preciso dos outros:**
- **Nucleo 02 (Assessment Engine):** quem decide o threshold de quiz_score por competency? É campo da `competencies` ou da `assessments`? Eu preciso que seja consultável em SQL puro pro gate funcionar sem chamar app.
- **Arquiteto:** competencies têm pré-requisitos entre si? (ex: "Maestria-Multi-Agente" exige "Lógica-Fluxo" antes). Se sim, o unlock é grafo, não lista.
- **UI UX Design:** como o aluno vê "esta lesson está bloqueada porque você precisa demonstrar X"? Preciso expor o motivo do bloqueio na view, não só o boolean.

**Risco crítico:**
Aluno fica permanentemente travado porque uma evidência foi rejeitada e não há caminho de recuperação claro. **Mitigação:** toda rejeição cria automaticamente uma `remediation_task` ligada ao reviewer que rejeitou — não pode rejeitar sem dizer o que falta. Constraint: `pedagogical_reviews.status='rejected' REQUIRES feedback_md IS NOT NULL AND length(feedback_md) > 50`.

---

## Topic 4: Personalização Cubo 3D (Estágio × Persona × Camada)

**Minha posição (Pedagogical Workflow):**
O Cubo é uma **chave composta de roteamento**, não uma feature visual. Minha proposta de tabela:

```
content_variants (
  id, lesson_id, stage SMALLINT, persona ENUM, camada ENUM,
  content_md, video_url, estimated_minutes,
  UNIQUE(lesson_id, stage, persona, camada)
)
```

A função `resolve_variant(user_id, lesson_id)` lê `users.current_stage`, `users.persona`, `users.target_camada` (do `user_journey_history` mais recente) e retorna a variant exata. **Fallback hierárquico** quando a célula exata não existe: primeiro tenta exato, depois afrouxa `camada`, depois `persona`, depois `stage`. Sem fallback default genérico — se nada bate, o frontend mostra "conteúdo em produção pra seu perfil".

**Importante:** persona/stage podem mudar no meio de uma trilha. Se aluno passa de Estágio 2→3 no meio do curso, ele NÃO perde progresso; o `user_competency_progress` é por competency, não por variant. O que muda é qual variant ele vê das próximas lessons.

**O que preciso dos outros:**
- **Arquiteto:** confirmar a regra de fallback. 6×3×3 = 54 células por lesson é caro; nem toda lesson terá todas. Qual é o mínimo aceitável (eu defendo: ao menos 1 variant por estágio do range alvo da trilha).
- **Scrum Master:** processo de produção — Nucleo 01 produz quais variants primeiro? Não pode ser "todas pra cada lesson" porque mata a vazão.
- **Database:** índice composto em `(lesson_id, stage, persona, camada)` é óbvio, mas preciso medir custo de UNIQUE em INSERTs em massa do worker de seed.

**Risco crítico:**
Combinatorial explosion. 100 lessons × 54 células = 5400 conteúdos. **Mitigação dura:** o Cubo não é obrigatório por lesson. É obrigatório por **competency**. Cada competency tem N variants; lessons herdam por composição. Reduz pra dezenas, não milhares. Isso depende de aceite do Arquiteto — se ele recusar, eu preciso de uma regra de "lesson canônica + diff por persona" pra não duplicar 54x o markdown.

---

## Topic 5: Skills educacionais eficientes

**Minha posição (Pedagogical Workflow):**
Skills mencionadas no Charter (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`, etc.) ainda não existem. Do meu lado, o que importa é que **toda skill que escreve no banco passa pelos meus gates**. Não vou ter uma skill `bloom-calibrator` que faz UPDATE direto em `lessons.bloom_target` sem validação. Proposta:

1. Skills educacionais **nunca** escrevem direto. Chamam funções SQL versionadas: `set_lesson_bloom(lesson_id, level, rationale_md, actor)`. A função valida, registra em `audit_log`, e só então persiste.
2. Cada skill tem um **contrato de side-effects declarado** — quais tabelas toca, em que modo (read/append/upsert). Isso vai num `skills_manifest.json` que eu uso pra gerar policies RLS por skill.
3. Skills que fazem revisão pedagógica (agent reviewer) **devem** escrever em `pedagogical_reviews` com `reviewer_type='agent'` e nunca diretamente em `lessons.is_published`. O publish é consequência, nunca causa.

**O que preciso dos outros:**
- **Arquiteto:** lista priorizada das skills atômicas — quais 2-3 são P0 pra Fase 1? Eu preciso saber pra modelar as funções SQL primeiro.
- **Nucleo 01/02:** as skills que vocês usam pra produzir conteúdo — quais campos elas precisam ler vs escrever? Quero antecipar o contrato.
- **QA Review:** quero uma skill `pedagogical-gate-check` que roda **antes** de qualquer publish e retorna a lista de gates falhando, sem efeito colateral. Vocês topam ownership?

**Risco crítico:**
Skill autônoma faz `is_published=true` em massa por bug ou prompt injection. **Mitigação:** REVOKE UPDATE em `lessons.is_published` de todas as roles exceto uma função SECURITY DEFINER `publish_lesson(lesson_id, actor_id)` que reexecuta todos os gates do zero. A coluna não é writable, o estado é.

---

## Topic 6: Skills de programação atreladas à metodologia

**Minha posição (Pedagogical Workflow):**
Skills como `senior-backend`, `tomik-db-doctrine`, `e2e-product-qa` já existem no stack do terminal. O que falta é **amarrar elas à metodologia educacional** sem virar dois sistemas paralelos. Minha proposta:

1. **Hooks no skill loader:** quando uma skill de código é invocada num contexto educacional (working dir = `automatiklabs/`), o loader também carrega `automatiklabs-doctrine`. Já está no Charter §4.6 mas precisa ser enforced — sugiro um pre-tool hook que checa.
2. **Migrations educacionais têm sufixo doutrinário no nome:** `00013_competencies__cbe.sql`, `00014_pedagogical_reviews__gate.sql`. Isso me dá grep instantâneo pra "quais migrations afetam workflow pedagógico" sem ler todas.
3. **Testes E2E pedagógicos** (do QA Review) rodam contra um seed determinístico do Cubo 3D. Preciso de um fixture canônico: 1 trilha, 2 cursos, 3 lessons, 1 lesson com 3 variants (Estágio 2 × 3 personas × Lógica). Esse fixture é o "hello world" do sistema.

**O que preciso dos outros:**
- **Database:** migrations seguem `tomik-db-doctrine` — confirmar que o sufixo `__cbe`, `__gate` não quebra o naming convention atual.
- **QA Review:** topa manter o fixture canônico em `automatiklabs/supabase/seed-fixtures/cubo-hello-world.sql`? Eu construo a primeira versão.
- **Frontend Dev:** o frontend precisa consumir a VIEW `user_unlocked_lessons` ao invés de calcular unlock no cliente. Confirmação de aceite.

**Risco crítico:**
Skills de código são genéricas (servem qualquer projeto) e perdem o contexto pedagógico. Backend Dev escreve uma migration "limpa" que viola um gate doutrinário sem perceber. **Mitigação:** lint custom no CI: qualquer PR que toca `automatiklabs/supabase/migrations/*` ou `automatiklabs/src/app/(platform)/learn/**` exige menção a Charter section no commit message (`Charter §4.X`). Sem isso, CI bloqueia.

---

## Topic 7: Coordenação multi-professor

**Minha posição (Pedagogical Workflow):**
Múltiplos professores (humanos + agents) revisando/criando conteúdo é o cenário onde a workflow logic fica exposta. Charter §4.4 já permite `reviewer_type ∈ {agent, human}` mas não diz o que acontece quando **discordam**. Minha máquina:

1. **Agent reviewer aprova → human reviewer rejeita:** rejection wins. Lesson volta pra `needs_revision`. Agent review fica histórico.
2. **Human aprova → agent rejeita depois:** rejection wins **se ainda não publicada**. Se já publicada, vira `flagged_post_publish` e abre task pro pedagogical_admin. Não despublica automático — despublicar conteúdo ao vivo é decisão humana.
3. **Dois humans discordam:** escalation pro `pedagogical_admin` (role). Não há voting majoritário. Pedagogia não é democracia, é responsabilidade.

Cada lesson precisa de **N revisões mínimas** configurável por trilha: trilha de Estágio 1 (Zerado) talvez exija 1 agent + 1 human. Trilha de Estágio 5-6 (Maestria) exige 2 humans + 1 agent. Coluna `tracks.min_reviews_config JSONB` com schema validado.

Locks distribuídos: enquanto uma review está `in_review`, outros reviewers veem "em revisão por X" mas podem **adicionar comentários assíncronos** que viram input pra revisor ativo. Não bloqueia, informa.

**O que preciso dos outros:**
- **Arquiteto:** decisão sobre se "discordância" gera retry automático do agent reviewer com o feedback humano como contexto, ou se agent só roda 1 vez por versão da lesson. Eu prefiro 1 vez por versão — senão vira loop infinito de IA reescrevendo.
- **Security:** role `pedagogical_admin` precisa ser definida. Quem é? Quantos? Audit trail completo.
- **Scrum Master:** SLA por tipo de review. Agent é instantâneo, human pode demorar dias. Preciso de timeouts: review `in_review` há > N dias vira `stale` e notifica. N por trilha? Por estágio?

**Risco crítico:**
Deadlock de revisões. Lesson A precisa que a competência X esteja "demonstrated" no curriculum, mas a evidência da competência X depende de uma lesson B que está bloqueada por uma review pendente da lesson A. **Mitigação:** detector de ciclo no momento de criar dependências entre competencies/lessons — função `check_no_competency_cycle()` rodada como CONSTRAINT TRIGGER em INSERT/UPDATE de `lesson_competencies` e `competency_prerequisites`. Falha o INSERT antes de criar o ciclo, nunca depois.

---

**DONE** — Backend Dev / Pedagogical Workflow / Round 1.
