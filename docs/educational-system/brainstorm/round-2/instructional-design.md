# Round 2 — instructional-design reaction

**Terminal:** Arquiteto · **Área:** Instructional Design
**Lido:** schema-extensions, pedagogical-workflow, lesson-experience, pedagogical-qa, content-production, assessment-engine.
**Resultado curto:** convergência forte em 4 pontos doutrinais (matar progresso por tempo, spine + transformers, Bloom ≥ 5 = humano, doctrine como gate de banco). Divergência real em 2 (combinatória do cubo, ownership do catálogo de competências). Uma lacuna grave: ninguém modelou o **gate de Kirkpatrick 4 (renda)** como entidade.

---

## Pontos de acordo (que reforço)

- **Database (schema-extensions §3 + "três linhas que não podem cair")**: "Matar `auto_complete_lesson` ou o CBE é teatro" + trigger BEFORE UPDATE em `lessons.is_published` exigindo review humana aprovada. — **Minha extensão:** isso casa exatamente com o que defendi no meu Round 1 §3 (Bloom ≥ 5 demanda humano). Proponho elevar isso a **Doctrine Invariant #1** no Charter Part IV: nenhuma lesson publicada sem (a) `lesson_competencies` ≥ 1, (b) `competencies.bloom_level` ≥ 5 cobre algum nó terminal da trilha, (c) review humano aprovado para esses nós. Os três checks viram a função `fn_validate_lesson_doctrine` que Database propôs no §5 — eu forneço a lista canônica de checks.

- **Content Production (content-production §4)**: spine canônico + 3 transformers (`persona`, `stage`, `layer`) sobre um único golden master, em vez de 54 aulas autônomas. — **Minha extensão:** isto é a operacionalização exata do que chamei de "wrapper, não rewrite" no meu Round 1 §4. Eu adiciono a regra dura: **o spine é sempre escrito no eixo (Estágio 3, Organizado, Lógica)** — é o centro de gravidade do cubo, ponto de menor distorção em qualquer direção. Transformers nunca podem alterar `competency_id`, `bloom_target` ou `evidence_expected`; só ritmo, exemplos, scaffolding, microcopy. O `lesson-validator` do Nucleo 01 vira o guardião disso.

- **Pedagogical QA (pedagogical-qa §1, regra de revisão cruzada)**: "Bloom 5–6 = `reviewer_type='human'` obrigatório; Bloom 1–4 pode passar com `reviewer_type='agent'`. Inverte o incentivo: marcar alto = mais fricção." — **Minha extensão:** isto resolve elegantemente o risco de "Bloom inflation" que era meu maior medo do Round 1. Combino com a proposta do QA de `bloom_assessed` ≠ `bloom_target` em `pedagogical_reviews`: **a discrepância autor↔reviewer é métrica de calibração do autor**. Acumula em cima de N lessons → flag de drift do autor → retraining do prompt (se for Nucleo 01) ou conversa humana (se for professor).

- **Backend Dev (pedagogical-workflow §3, evidência por tipo + remediation_task)**: `evidence_type ENUM` + rejeição força criação automática de `remediation_task` com feedback ≥ 50 chars. — **Minha extensão:** isto fecha o loop de recuperação que o Charter Part III §3.1 deixava em aberto (aluno travado em Estágio 1 = "necessidade central: pequenas vitórias visíveis + suporte humano"). Operacional: a `remediation_task` carrega o `learner_stage` corrente — se o aluno é Estágio 1 ou Persona Zerado, a task automaticamente entra em **fila prioritária de revisão humana**, não em fila de agent. CBE com humanidade calibrada.

- **Assessment Engine (assessment-engine §3 + Topic 4, "competência constante, assessment variante" + test-out)**: a competência adquirida é a mesma; o `assessment_id` é diferente por persona; aluno Autodidata pode submeter evidência sem assistir aula. — **Minha extensão:** isto é coerente com o spine + transformers do Nucleo 01, mas no eixo de avaliação. Aceito como invariante doutrinal: **uma competência tem 1 `competency_id`, N `assessment_id`s (um por célula relevante do cubo), e 1 conjunto fechado de critérios de aprovação semanticamente equivalentes**. O Arquiteto (eu) garante a equivalência semântica via revisão das variantes Zerado — que o Nucleo 02 corretamente identifica como o ponto de maior risco de easy-mode.

---

## Pontos de discordância ou refinamento

- **Lesson Experience (lesson-experience §2, "subconjunto mínimo de 12 células na Fase 1")** — **Minha objeção:** 12 células ainda é muito pra começar e mistura demais eixos. UI UX propõe Estágios 1–3 × {Zerado, Autodidata} × {Técnica, Lógica}. Isto força Nucleo 01 a produzir 12 spines completos antes de qualquer feedback real. **Minha proposta:** Fase 1 entrega **1 trilha completa** numa única célula central — (Estágio 2, Organizado, Lógica) — porque é o eixo onde a doutrina (Backward Design + Kolb completo) tem maior fidelidade. Só Fase 2 abre os eixos: primeiro o eixo Persona (vira 3 wrappers da mesma trilha), depois o eixo Camada (Técnica e Maestria como aprofundamentos opcionais), depois o eixo Estágio (filtros de elegibilidade). 1 → 3 → 9 → 27 → 54, jamais 12 de uma vez. Isto também atende o medo do Lesson Experience de "Nucleo 01 morre antes do lançamento".

- **Pedagogical QA (pedagogical-qa §3, "dois trilhos paralelos: `lesson_completions` como sinal fraco + `user_competency_progress` como sinal forte")** — **Minha objeção:** dois trilhos visíveis ao aluno é exatamente o cenário em que ele otimiza pelo trilho mais fácil (assistir vídeo) e ignora o trilho doutrinal. O próprio QA reconhece o risco no §3 do meu Round 1 ("UI vai continuar olhando o is_completed"). **Minha proposta:** os dois trilhos existem **no banco** (concordo com Database, Topic 3, view `v_user_lesson_watched`) mas a UI **só renderiza CBE** — `lesson_completions` vira telemetria interna, never user-facing. O dashboard do aluno mostra um único número: "X/Y competências demonstradas". Isto é não-negociável e vira invariante #2 da doutrina (alinhado com minha posição Round 1 §6).

- **Backend Dev (pedagogical-workflow §4, "Cubo é obrigatório por competency, não por lesson; lessons herdam por composição")** — **Minha objeção:** isto inverte a relação. Competency é taxonomia (CBE), não unidade de produção. Quem precisa de variantes é o **artefato pedagógico** (lesson + assessment), porque é ali que ritmo/profundidade/scaffolding mudam. Se variantes vivem em competency, eu perco a habilidade de ter uma única competência ensinada por 3 lessons distintas (cada uma cobrindo um momento Kolb diferente — experiência, conceito, experimentação). **Minha proposta:** mantém variantes em `lesson_variants` (proposta do Content Production §2) com `(stage, persona, layer)` nullable, e cria `competency_aliases` se um dia surgir necessidade de variar a *definição* da competência por estágio (não vejo necessidade hoje). Variantes são de **produto** (lesson), não de **taxonomia** (competency).

---

## Lacunas que ninguém cobriu

- **Gate de Kirkpatrick 4 (renda real do aluno) como entidade first-class.** O Charter Part I §1.2 declara renda como definição de sucesso, mas nenhum dos 6 terminais modelou isto além de menção tangencial. Assessment Engine é o que chega mais perto (`monthly_revenue_self_reported` em §1) mas trata como pesquisa periódica passiva. **Por que importa do meu ângulo:** Backward Design diz que toda trilha começa pelo resultado mensurável — e o resultado mensurável final do AutomatikLabs **é renda**. Se renda não é entidade com gate, então a "performance task" final de cada trilha é só mais um artefato e Kirkpatrick 4 vira folclore. Proposta: tabela `revenue_milestones (user_id, amount_brl, source_type ENUM('first_paid_project','recurring_client','product_sale'), evidence_url, attested_at, verified_by)` com gate explícito — atingir o milestone é o que **promove** o aluno do Estágio 3 para o 4. Sem isto, a transição de estágio depende de auto-declaração e o sistema mente sobre seu próprio sucesso.

- **Catálogo canônico de competências — quem é dono e quando ele nasce.** Quatro terminais (Database, Backend Dev, Content Production, Assessment Engine) explicitamente pedem "lista canônica de competências" e três deles me apontam como responsável. Eu aceito o ownership, mas ninguém modelou **o processo de criação e versionamento** desse catálogo. Sem isso, eu viro gargalo permanente. **Minha solução:** o catálogo é um arquivo `docs/educational-system/competencies/v1.yaml` versionado em git, com PR review obrigatório de 2 terminais (Arquiteto + QA Review), e o seed da tabela `competencies` é gerado a partir desse YAML pela migration `00013`. Mudanças de catálogo viram migrations subsequentes (`00013_competencies__add_v1.1.sql`), nunca edição direta no banco. Isto vai no meu sub-epic 04.

- **Onboarding pedagógico do aluno (definição inicial da célula do cubo).** Lesson Experience assume que (`current_stage`, `persona`, `preferred_layer`) já existem; Database modela as colunas; ninguém define **como** o aluno chega nelas no primeiro login. Isto é decisão pedagógica, não técnica: persona auto-declarada gera viés (todo mundo se acha "Autodidata"); estágio precisa de evidência mínima; camada é preferência mas tem que fazer sentido com estágio. Proposta para meu sub-epic 04: **Story `INSTR-ONBOARD-01` — desenhar o "diagnóstico inicial" como uma micro-trilha de 3 atividades (uma por eixo) que produz a tripla inicial e cria o primeiro registro em `user_journey_history`**. Sem isto, todo aluno entra como NULL/NULL/NULL e o cubo morre no primeiro request.

---

## Pedidos diretos a outros terminals

- **@schema-extensions (Database):** preciso que `competencies.parent_competency_id` (que você propôs em §1) seja **DAG**, não árvore — pré-requisitos podem ter múltiplos pais (uma competência de "Lógica de Multi-Agente" depende de "Lógica de Fluxo" E "Técnica de Prompt"). Adiciona `competency_prerequisites (competency_id, prerequisite_id)` separado de `parent_competency_id` (que fica só pra agrupamento taxonômico). E confirma se topas o YAML versionado como source of truth do seed.

- **@pedagogical-workflow (Backend Dev):** sobre seu §3, "rejected após N dias volta para `in_progress`" — eu **discordo do automático**. Proponho: rejected fica rejected até o aluno explicitamente clicar "tentar de novo" (consciência ativa do retake, alinha com Kolb reflexão). N dias automático escapa do ciclo reflexivo. Topa?

- **@content-production (Nucleo 01):** o spine que você gera é escrito em qual eixo? Eu defendo **(Estágio 3, Organizado, Lógica)** como centro de gravidade — confirma que serve pra você ou propõe outro?

- **@assessment-engine (Nucleo 02):** o `revenue_milestones` que propus na lacuna #1 — você topa ser co-owner comigo? Você já mencionou `monthly_revenue_self_reported`; eu quero elevar a entidade com gate. Sem você, vira só mais uma tabela órfã.

- **@pedagogical-qa (QA Review):** sua `pedagogical-gate-rubric` (12–15 critérios) é a interface dura entre minha doutrina e seu gate. Topa que eu escreva a primeira versão dos critérios e você refina? Eu quero que os 12 sejam exatamente os checks do `fn_validate_lesson_doctrine` do Database — uma fonte só.

- **@lesson-experience (UI UX):** sua proposta de "stepper dos 7 Passos no footer" só funciona se acoplada ao gate de competência (você mesma diz no §1). Topa que `methodology_step` em `lessons` seja **derivado** de `lesson_competencies.position_in_framework`, não campo livre? Senão um autor pode botar "Passo 5" numa lesson que ensina a competência do Passo 2.

---

## Síntese minha (pós-leitura)

Saio do Round 1 mais convicto: a doutrina sobrevive **se e somente se** ela vira **constraint de banco** (Database + Backend Dev + QA Review estão alinhados nisto), e a personalização sobrevive **se e somente se** ela é **transformação aplicada sobre um spine único** (Content Production cristalizou o que eu tinha como intuição em Round 1). Refino minha posição em três pontos: (1) Fase 1 entrega **1 célula** (Estágio 2, Organizado, Lógica), não 12 — escala combinatória é Fase 2+; (2) o catálogo de competências precisa ser **YAML versionado em git** com 2 reviewers obrigatórios, não negociação ad-hoc; (3) **Kirkpatrick 4 (renda) precisa de tabela `revenue_milestones` com gate** — sem isto, o Norte Verdadeiro do Charter §1.1 não tem instrumentação. Minha briga principal pro Round 3 vai ser contra os "dois trilhos visíveis" do Pedagogical QA: na UI, só CBE existe.

DONE.
