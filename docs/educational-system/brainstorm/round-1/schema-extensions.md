# Round 1 — Schema Extensions (Database)

**Terminal:** Database
**Área:** Schema Extensions
**Data:** 2026-04-06
**Base lida:** CHARTER.md (Parts I–VIII), `supabase/migrations/00003_learning.sql`

Eu falo da perspectiva do que **sobrevive em Postgres**. Toda ideia pedagógica bonita que não vira tabela, coluna, constraint, índice e policy RLS é folclore. Meu trabalho neste round é apontar onde o schema atual **mente** sobre a doutrina, e onde ele **precisa crescer** para contá-la com precisão.

**Diagnóstico geral do schema atual (00003_learning.sql):**
- Progresso é 100% **time-based** (`progress_percentage`, auto-complete em 90%). Isto é o oposto direto de CBE (Charter §2.1). O trigger `auto_complete_lesson` na linha 300 é o bug doutrinal mais grave do sistema hoje.
- Não existe **nenhum eixo** do Cubo 3D no banco: nem `stage`, nem `persona`, nem `mastery_layer`. Personalização é invisível ao DB.
- Não existe `competencies`, `user_journey_history`, nem `pedagogical_reviews` — as três tabelas que a Part IV §4.2–§4.4 exige como first-class.
- Hierarquia `tracks→courses→modules→lessons` existe, mas **Formação** (tag) não tem lugar.
- Nenhum agrupamento para multi-professor (instructor_id existe em `courses` mas não há papel, permissão, nem review chain).

Com isso posto, vou tema por tema.

---

## Topic 1: Metodologias educacionais — operacionalização

**Minha posição (do ângulo de Schema Extensions):**

"Operacionalizar metodologia" para mim = **cada framework do Charter §2.1 tem que virar coluna ou tabela que o epic-executor consegue validar**. Proposta concreta:

1. **`competencies`** (Fase 2, já decidido §4.2) é o pivô de Backward Design + CBE + Bloom. Schema mínimo:
   ```sql
   CREATE TABLE public.competencies (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug TEXT UNIQUE NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     bloom_level SMALLINT NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
     framework TEXT, -- 'empresa-ia-humanizada' | '3-camadas' | '7-passos' | '3-cs' | null
     parent_competency_id UUID REFERENCES public.competencies(id), -- para composição
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```
   O `framework` amarra a competência à metodologia proprietária — sem isso é taxonomia solta.

2. **`lesson_competencies (lesson_id, competency_id, weight SMALLINT)`** — junction com peso. Peso importa porque uma lesson pode *tocar* 3 competências mas *ensinar de fato* uma só.

3. **Constraint dura** (CI / migration test, não check constraint): toda `tracks` publicada (is_published=true) deve ter ≥1 `track_competencies` mapeada a bloom_level ∈ {5,6} — a regra "culminar em Avaliar/Criar" do Charter §2.1 vira teste automatizado.

4. **Cognitive Load** precisa virar coluna em `lessons`:
   ```sql
   ALTER TABLE lessons ADD COLUMN cognitive_load SMALLINT CHECK (cognitive_load BETWEEN 1 AND 5);
   ALTER TABLE lessons ADD COLUMN kolb_phase TEXT CHECK (kolb_phase IN ('experience','reflection','concept','experimentation'));
   ```
   Sem isso o Arquiteto não consegue balancear trilha — Kolb vira wishful thinking.

5. **Kirkpatrick** não é tabela — é **view materializada** sobre `user_journey_history` + `user_competency_progress` + dados de receita (quando existirem). Não devo criar tabela para algo que é agregação.

**O que eu preciso dos outros:**
- **Arquiteto:** lista canônica de competências para pelo menos UMA formação (sugiro "Empresa com IA Humanizada") com bloom_level e framework setados, para eu ter seed de migração.
- **Backend Dev:** confirmação de que o caminho de escrita de `user_competency_progress` passa por uma função `SECURITY DEFINER` (não pelo cliente), para eu desenhar RLS restritiva.
- **Nucleo 01/02:** `evidence_url` é texto livre ou FK para uma tabela `evidences`? Isso muda muito o schema.
- **QA Review:** se eu adiciono `cognitive_load` e `kolb_phase` como NOT NULL, eu quebro todas as lessons existentes — ou começamos NULL-permissive + check de publicação?

**Risco crítico:**
Se a gente coloca `competencies` só como tag "bonitinha" sem amarrar a publicação de track a ela, vira campo opcional que ninguém preenche. **Em 6 meses o banco terá `competencies` com 3 linhas e 400 lessons sem mapeamento.** A doutrina morre no mock e o progresso continua por tempo. A correção é: `is_published` de track = trigger que checa `track_competencies`; sem mapeamento, bloqueia.

---

## Topic 2: Arquitetura das soluções — skills/agents/workers + AutomatikLabs

**Minha posição:**

O schema hoje trata `lessons.content_md` como texto livre. Para o mundo skills/agents/workers isso é insuficiente. Preciso de:

1. **`lesson_artifacts`** — anexos estruturados por lesson:
   ```sql
   CREATE TABLE public.lesson_artifacts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
     artifact_type TEXT NOT NULL CHECK (artifact_type IN
       ('n8n_workflow','prompt','agent_spec','dataset','rubric','worker_script')),
     title TEXT NOT NULL,
     content JSONB NOT NULL, -- JSON validado por tipo
     schema_version SMALLINT NOT NULL DEFAULT 1,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX idx_lesson_artifacts_lesson ON lesson_artifacts(lesson_id);
   CREATE INDEX idx_lesson_artifacts_type ON lesson_artifacts(artifact_type);
   ```
   Por quê JSONB e não texto: o worker Python (Charter §4.5) precisa parsear isso deterministicamente.

2. **`skills_registry`** — espelho leve no DB das skills que a doctrine referencia. Não é para substituir o filesystem, é para permitir JOIN entre `lessons` e skills no epic-executor:
   ```sql
   CREATE TABLE public.skills_registry (
     slug TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     category TEXT, -- 'atomic-doctrine' | 'worker' | 'generic'
     doctrine_linked BOOLEAN NOT NULL DEFAULT false,
     last_synced_at TIMESTAMPTZ
   );
   CREATE TABLE public.lesson_skills (
     lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
     skill_slug TEXT REFERENCES skills_registry(slug) ON DELETE RESTRICT,
     usage TEXT CHECK (usage IN ('required','referenced','produced_by')),
     PRIMARY KEY (lesson_id, skill_slug)
   );
   ```
   `produced_by` captura o caso "esta lesson foi gerada por esta skill" — rastreabilidade crítica.

3. **Workers rodam locais** (§4.5) — então eu **não crio** tabela `workers_runs`. Se precisar de log, é arquivo no filesystem. Resisto a qualquer impulso de botar logs de worker no DB; cresce sem bound.

**O que eu preciso dos outros:**
- **Arquiteto:** decidir se `n8n_workflow` armazena o JSON completo do n8n ou só o link. JSON completo explode tamanho da row; link externo cria lixo órfão.
- **Backend Dev:** API para sync de `skills_registry` (quem faz o POST? é um cron? é manual via seed?).
- **Scrum Master:** se `lesson_artifacts` é o produto do Content Production, eu preciso do fluxo de aprovação antes de criar as RLS.

**Risco crítico:**
JSONB sem validação vira lixo. Preciso de **JSON Schema por `artifact_type`** versionado (daí o `schema_version`). Sem isso, qualquer skill pode escrever qualquer coisa e o consumidor (aluno, player de lesson, worker) quebra silenciosamente. **Silent failure no conteúdo educacional = aluno vê lesson quebrada = churn.**

---

## Topic 3: Progressão dos alunos — avanço por evidência (CBE)

**Minha posição:**

Este é o tema onde o schema atual **mais contradiz** a doutrina. Preciso de três mudanças cirúrgicas:

1. **Deprecar semanticamente `user_lesson_progress.is_completed` como sinal de avanço.** Não remover (quebra apps), mas renomear conceitualmente para `watched` via view:
   ```sql
   CREATE VIEW v_user_lesson_watched AS
     SELECT user_id, lesson_id, is_completed AS watched, completed_at AS watched_at
     FROM user_lesson_progress;
   ```
   O código novo consulta isso, sinalizando que é telemetria, não avanço.

2. **Criar `user_competency_progress`** — o avanço REAL:
   ```sql
   CREATE TYPE competency_status AS ENUM ('not_started','practicing','submitted','approved','mastered');
   CREATE TABLE public.user_competency_progress (
     user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
     competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
     status competency_status NOT NULL DEFAULT 'not_started',
     evidence_url TEXT, -- ou FK depois
     evidence_submitted_at TIMESTAMPTZ,
     approved_by UUID REFERENCES user_profiles(id),
     approved_at TIMESTAMPTZ,
     bloom_demonstrated SMALLINT CHECK (bloom_demonstrated BETWEEN 1 AND 6),
     PRIMARY KEY (user_id, competency_id)
   );
   ```
   Campo `bloom_demonstrated` ≠ `competencies.bloom_level` — o aluno pode ter demonstrado num nível menor. Isso captura **progresso parcial honesto**.

3. **Matar `auto_complete_lesson` trigger** (linha 295 do 00003). Ele codifica "90% = completo" — anti-padrão do Charter §1.3. Substituir por: progresso de lesson **nunca** aciona progresso de competência automaticamente. Só review pedagógica (review chain) promove `status` de `submitted` → `approved`.

4. **Track completion** passa a ser calculada assim:
   ```sql
   CREATE VIEW v_user_track_completion AS
     SELECT u.user_id, t.track_id,
            COUNT(*) FILTER (WHERE ucp.status IN ('approved','mastered'))::float /
            NULLIF(COUNT(*),0) AS competency_completion
     FROM user_profiles u
     CROSS JOIN tracks t
     JOIN track_competencies tc ON tc.track_id = t.id
     LEFT JOIN user_competency_progress ucp
       ON ucp.user_id = u.id AND ucp.competency_id = tc.competency_id
     GROUP BY u.user_id, t.track_id;
   ```

**O que eu preciso dos outros:**
- **Backend Dev:** concordância que a promoção de status é API-only (não trigger), e que a API exige `reviewer_id` presente.
- **QA Review:** definir o schema da `evidence_url` — link para Github? upload no Supabase Storage? isso muda política de storage.
- **Arquiteto:** decidir se "mastered" é humano ou se basta approved após N ciclos (eu prefiro explícito).
- **Nucleo 02:** o Assessment Engine gera evidências ou só rubrics? Se gera, preciso de FK para `assessments`.

**Risco crítico:**
Manter `is_completed` como fonte de verdade em paralelo gera **duas verdades**. Dashboards e billing vão continuar olhando para `is_completed` porque é mais fácil. Tenho que forçar deprecation via **lint em queries** ou via remoção progressiva. Senão, a doutrina CBE vira camada decorativa e o produto continua time-based por baixo.

---

## Topic 4: Personalização do estudo — Cubo 3D (Estágio × Persona × Camada)

**Minha posição:**

Hoje o banco é **cubo-cego**. Quatro mudanças:

1. **Enums canônicos** (bloqueiam drift de string):
   ```sql
   CREATE TYPE journey_stage AS ENUM ('stage_1','stage_2','stage_3','stage_4','stage_5','stage_6');
   CREATE TYPE learner_persona AS ENUM ('zerado','autodidata','organizado');
   CREATE TYPE mastery_layer AS ENUM ('tecnica','logica','maestria');
   ```

2. **Colunas no conteúdo** — onde o cubo 3D vive de verdade:
   ```sql
   ALTER TABLE tracks
     ADD COLUMN target_stage journey_stage,
     ADD COLUMN target_personas learner_persona[] DEFAULT '{}',
     ADD COLUMN mastery_layer mastery_layer;
   ALTER TABLE lessons
     ADD COLUMN variant_stage journey_stage,
     ADD COLUMN variant_persona learner_persona,
     ADD COLUMN variant_layer mastery_layer;
   ```
   Track declara *para qual célula do cubo serve*; lesson pode ter **variantes** para personas diferentes (a mesma competência ensinada 3x, uma por persona). `variant_*` NULL = genérico.

3. **Estado do aluno** em `user_profiles` (ou tabela dedicada):
   ```sql
   ALTER TABLE user_profiles
     ADD COLUMN current_stage journey_stage,
     ADD COLUMN persona learner_persona,
     ADD COLUMN preferred_layer mastery_layer;
   ```

4. **`user_journey_history`** (Charter §4.3, obrigatório):
   ```sql
   CREATE TABLE public.user_journey_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
     persona learner_persona,
     journey_stage journey_stage,
     preferred_layer mastery_layer,
     changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     reason TEXT,
     changed_by UUID REFERENCES user_profiles(id) -- self | admin | agent
   );
   CREATE INDEX idx_journey_history_user_time
     ON user_journey_history(user_id, changed_at DESC);
   ```
   Este índice é crítico: a query "qual era o estágio em T" é a pergunta Kirkpatrick-4 base.

5. **Trigger** que, ao UPDATE de `user_profiles.current_stage|persona|preferred_layer`, **insere** automaticamente em `user_journey_history`. Sem isso, toda a análise longitudinal vira ficção.

**O que eu preciso dos outros:**
- **Shell #3 (Personalization Router):** algoritmo de match — dado (stage, persona, layer) do aluno, como escolher a lesson variant? Eu só preciso saber se o match é em SQL (view) ou em app code.
- **Arquiteto:** confirmar que `mastery_layer` é coluna única em track (track inteira é "técnica") ou por lesson (mix). Meu palpite: ambos — track declara foco, lesson pode desviar.
- **UI UX:** quem edita o persona? o aluno mesmo ou admin? Muda RLS.
- **Security:** `user_journey_history` é PII sensível (estado emocional/financeiro do aluno). Precisa RLS `user_id = auth.uid()` + service-role.

**Risco crítico:**
Se o cubo é só coluna em `lessons` sem variantes reais, vira filtro de busca e nada mais. **A doutrina exige variantes de verdade — a mesma competência ensinada 3 vezes.** Isso é caro de produzir. O schema precisa **permitir** sem **obrigar**. Minha solução: `variant_*` é opcional; uma lesson sem variant serve a todos. Senão, aprovamos o schema e ninguém escreve 3 versões.

---

## Topic 5: Skills educacionais eficientes

**Minha posição:**

Skills educacionais (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`…) rodam **fora** do Postgres. Meu papel aqui é fornecer o **substrato** que elas consomem e escrevem:

1. **Todas as skills pedagógicas leem/escrevem via 3 tabelas apenas:**
   - `competencies` (referência taxonômica)
   - `lesson_competencies` (mapping produzido pelo bloom-calibrator)
   - `lessons` com as novas colunas (cognitive_load, kolb_phase, variant_*)

2. **Não criar tabela `skill_invocations`.** Tentação forte; resisto. Log de invocação é filesystem. Caso queiramos analytics, view materializada sobre `pedagogical_reviews.reviewer_type='agent'`.

3. **Função utilitária** `public.fn_validate_lesson_doctrine(lesson_id UUID)` que retorna `TABLE(check_name TEXT, passed BOOLEAN, detail TEXT)`. Roda:
   - Tem ≥1 competência mapeada?
   - `cognitive_load` preenchido?
   - `kolb_phase` preenchido?
   - Se é parte de track publicada, a track culmina em Bloom ≥5?
   - Todo framework declarado existe no enum?

   Isso é a **interface dura entre doctrine e DB**. Skills chamam esta função; CI/CD chama esta função. Uma fonte de verdade.

4. **View `v_lesson_doctrine_status`** que roda esta função para todas as lessons publicadas e expõe um "doctrine score" 0-100. QA consome diretamente.

**O que eu preciso dos outros:**
- **Arquiteto:** lista final dos checks doutrinais. Eu traduzo 1:1 para função SQL.
- **Nucleo 01:** quando a skill Content Production gera lesson, ela preenche as colunas novas ou deixa o Arquiteto fazer? Isso define se a função precisa tolerar NULLs ou não.
- **QA Review:** o "score" é apenas informativo ou bloqueia publicação? Meu voto: bloqueia (via trigger em `is_published`).

**Risco crítico:**
Se `fn_validate_lesson_doctrine` é chamada só no UI e não no banco, é burlável. **Precisa ser um trigger BEFORE UPDATE OF is_published em lessons.** Essa é a linha vermelha entre doctrine real e doctrine simbólica.

---

## Topic 6: Skills de programação atreladas à metodologia

**Minha posição:**

Skills como `senior-frontend`, `senior-backend`, `tomik-db-doctrine` são usadas **durante** a produção de conteúdo (pelo Content Production) e **durante** a entrega (pelo player). Do ponto de vista de schema:

1. **`lesson_skills.usage = 'produced_by'`** já captura "quem gerou" (Topic 2).

2. **Precisamos de um conceito de "exercício de código" first-class** — hoje não existe. Proposta minimal:
   ```sql
   CREATE TYPE exercise_type AS ENUM
     ('code','automation_flow','prompt','agent_design','negotiation_roleplay');

   CREATE TABLE public.exercises (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
     competency_id UUID NOT NULL REFERENCES competencies(id),
     exercise_type exercise_type NOT NULL,
     prompt_md TEXT NOT NULL,
     rubric JSONB NOT NULL, -- criteria, bloom level target
     auto_gradable BOOLEAN NOT NULL DEFAULT false,
     skill_slug TEXT REFERENCES skills_registry(slug), -- skill que avalia
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE TABLE public.user_exercise_submissions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
     exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
     submission JSONB NOT NULL,
     auto_score NUMERIC(5,2),
     human_score NUMERIC(5,2),
     status TEXT CHECK (status IN ('pending','auto_graded','human_reviewed','approved','rejected')),
     submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```
   **Esta é a ponte entre skill de programação e evidência de CBE:** uma submission aprovada é `evidence_url` (ou melhor, FK) em `user_competency_progress`.

3. **Tripé de Bloom + exercise_type + skill_slug** garante que eu consigo dizer "esta competência é demonstrada resolvendo exercício do tipo X avaliado pela skill Y" — requisito mínimo de CBE acionável.

**O que eu preciso dos outros:**
- **Nucleo 02 (Assessment Engine):** shape do `rubric` JSON. Proponho schema versionado. Sem definição, JSONB vira lixo.
- **Backend Dev:** rota `POST /api/exercises/:id/submit` é o único ponto de escrita? Confirma RLS.
- **Arquiteto:** os 3 Cs da Monetização (Criar/Capturar/Entregar) viram `exercise_type`? Ou ficam como `competencies.framework`? Eu prefiro o segundo.

**Risco crítico:**
Se eu criar `exercises` mas o `user_competency_progress.evidence_url` continuar sendo TEXT livre, **não vai ter link real entre submissão e evidência CBE**. Preciso de:
```sql
ALTER TABLE user_competency_progress
  ADD COLUMN evidence_submission_id UUID REFERENCES user_exercise_submissions(id);
```
Esta FK é o que faz o sistema ser auditável. Sem ela é "confia em mim".

---

## Topic 7: Coordenação multi-professor

**Minha posição:**

O schema atual tem `courses.instructor_id` (uma única pessoa). Insuficiente para multi-professor + revisão pedagógica + Nucleo 01/02. Preciso:

1. **`course_instructors`** — many-to-many com papel:
   ```sql
   CREATE TYPE instructor_role AS ENUM
     ('lead','co_author','reviewer','content_ops');
   CREATE TABLE public.course_instructors (
     course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
     user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
     role instructor_role NOT NULL,
     since TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (course_id, user_id, role)
   );
   ```
   `courses.instructor_id` vira view derivada: "lead do curso". Não remover coluna (quebra app).

2. **`pedagogical_reviews`** (Charter §4.4, obrigatório):
   ```sql
   CREATE TYPE reviewer_type AS ENUM ('agent','human');
   CREATE TYPE review_status AS ENUM
     ('pending','approved','changes_requested','rejected');
   CREATE TABLE public.pedagogical_reviews (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
     reviewer_type reviewer_type NOT NULL,
     reviewer_id UUID, -- NULL se agent; user_profiles se human
     agent_slug TEXT, -- skill slug se agent
     status review_status NOT NULL DEFAULT 'pending',
     feedback_md TEXT,
     doctrine_score SMALLINT, -- 0-100 do fn_validate_lesson_doctrine
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     CHECK (
       (reviewer_type = 'human' AND reviewer_id IS NOT NULL) OR
       (reviewer_type = 'agent' AND agent_slug IS NOT NULL)
     )
   );
   CREATE INDEX idx_pedagogical_reviews_lesson_status
     ON pedagogical_reviews(lesson_id, status);
   ```

3. **Trigger de publicação** — o ponto mais importante de todo este documento:
   ```sql
   CREATE OR REPLACE FUNCTION fn_require_review_before_publish()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.is_published = true AND OLD.is_published = false THEN
       IF NOT EXISTS (
         SELECT 1 FROM pedagogical_reviews
         WHERE lesson_id = NEW.id
           AND reviewer_type = 'human'
           AND status = 'approved'
       ) THEN
         RAISE EXCEPTION
           'Lesson % cannot be published: needs ≥1 approved human review', NEW.id;
       END IF;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
   **Publicação sem review humana aprovada vira ERRO de banco, não warning de app.** É aqui que a doutrina ganha dentes.

4. **RLS** por papel: `lead` pode editar tudo do curso; `co_author` edita só lessons; `reviewer` só insere em `pedagogical_reviews`; `content_ops` edita metadata. Cada uma dessas regras vira policy.

**O que eu preciso dos outros:**
- **Arquiteto:** o review chain é "agent primeiro, humano depois" obrigatório, ou pode ser só humano? Isso muda a validação do trigger.
- **Security:** matrix role×permission. Eu escrevo as policies, mas preciso da tabela de decisão.
- **Scrum Master:** quando o review é rejected, o estado da lesson volta para draft automaticamente? Ou fica "changes_requested"? Meu voto: fica em `is_published=false` + status separado.
- **Backend Dev:** invocação de review automática (agent) — cron? trigger? API call? Prefiro API call explícita para manter rastreabilidade.

**Risco crítico:**
Se eu deixo `reviewer_id` nullable sem o CHECK composto, aparecem reviews órfãs e auditoria é impossível. Mais grave: **se o trigger de publicação não existe, a regra "não publica sem review" fica no app layer e alguém vai fazer bypass via SQL direto em produção.** (Isso já aconteceu em outros projetos do monorepo.) Trigger é não-negociável.

---

## Resumo executivo das migrations propostas

Se tudo acima vira Fase 2, eu projeto as seguintes migrations, nesta ordem:

| # | Arquivo | Tabelas/alterações | Deps |
|---|---|---|---|
| 00013 | `00013_competencies.sql` | `competencies`, `lesson_competencies`, `track_competencies` | — |
| 00014 | `00014_journey_cube.sql` | enums (stage/persona/layer), ALTER tracks/lessons/user_profiles, `user_journey_history` + trigger | — |
| 00015 | `00015_competency_progress.sql` | `user_competency_progress`, view `v_user_track_completion`, deprecate `auto_complete_lesson` | 00013, 00014 |
| 00016 | `00016_pedagogical_reviews.sql` | `pedagogical_reviews`, `course_instructors`, trigger de publicação | 00013 |
| 00017 | `00017_exercises.sql` | `exercises`, `user_exercise_submissions`, FK em `user_competency_progress` | 00015 |
| 00018 | `00018_lesson_artifacts.sql` | `lesson_artifacts`, `skills_registry`, `lesson_skills` | — |
| 00019 | `00019_doctrine_validator.sql` | `fn_validate_lesson_doctrine`, view `v_lesson_doctrine_status`, trigger em lessons.is_published | 00013–00018 |

Cada migration é idempotente (IF NOT EXISTS / DROP TRIGGER IF EXISTS, seguindo o padrão do 41a2534 recente), tem RLS declarada no mesmo arquivo, e tem rollback documentado.

## Três linhas que não podem cair

1. **Matar `auto_complete_lesson` ou o CBE é teatro.**
2. **Trigger de publicação exigindo review humana aprovada ou a doctrine é decoração.**
3. **`user_journey_history` com trigger automático ou Kirkpatrick nível 3–4 é impossível.**

Tudo o mais é negociável. Esses três não.

---

DONE.
