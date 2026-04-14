# Round 1 — Assessment Engine (Núcleo 02)

**Owner:** Núcleo 02 — Assessment Engine
**Voice:** EVALUATION. Quizzes, projects, rubrics, evidence, CBE in operation.
**Charter refs:** Part II §2.1 (Bloom, CBE, Kirkpatrick), Part IV §4.2 (competencies + evidence_url).
**Premise:** progress is measured by *demonstrated competency*, not by time. My job is to make "demonstrated" operational — define what counts as evidence, how it is captured, how it is graded, and how it scales across the Cubo 3D.

---

## Topic 1: Metodologias

**Minha posição (Assessment Engine):**

Métodos pedagógicos só viram realidade quando atravessam um portão de avaliação. Para cada framework adotado no Charter, eu preciso definir o **artefato de evidência** correspondente:

- **Backward Design** → toda trilha começa com a definição de uma "performance task" final (artefato real do aluno: ex. fluxo n8n entregue, agente conversacional rodando, proposta comercial fechada). Essa task é o que minha engine grava em `user_competency_progress.evidence_url`. Sem performance task definida, a trilha não pode ser publicada.
- **Bloom** → quizzes auto-corrigidos cobrem níveis 1–3 (Lembrar, Compreender, Aplicar). Níveis 4–6 (Analisar, Avaliar, Criar) **exigem** rubric-graded artifact ou peer/agent review. Regra dura que vou impor: trilha que culmina em "criar" não pode ser certificada por múltipla escolha.
- **Kolb** → cada competência tem 4 tipos de check distintos: experiência (faz), reflexão (escreve), conceito (explica), experimentação (varia). Mapeio cada tipo a um formato de assessment.
- **Cognitive Load Theory** → uma aula NUNCA pode ter mais de 1 competência avaliada. Avaliação multi-competency vai pra projeto integrador no fim do módulo.
- **Kirkpatrick** → meu sistema gera dados pros 4 níveis: nível 1 (NPS pós-aula), nível 2 (quiz), nível 3 (artifact submetido + revisado), nível 4 (campo `monthly_revenue_self_reported` preenchido voluntariamente — minha engine pergunta a cada 30 dias após o aluno marcar Estágio 3+).

Metodologias proprietárias (3 Camadas, Empresa c/ IA Humanizada, 7 Passos, 3 Cs) cada uma vira um **rubric template** no meu motor:

- **3 Camadas da Maestria** → rubric com 3 colunas (Técnica/Lógica/Maestria) × N critérios. Eu não certifico Maestria sem evidência de decisão estratégica documentada (ex: "por que escolhi esse fluxo e não outro").
- **Empresa c/ IA Humanizada — 3 Pilares** → 3 projetos integrators obrigatórios, um por pilar. Sem os 3, a Formação inteira não fecha.
- **7 Passos do Script de Vendas** → checklist de 7 itens binários + análise qualitativa do agente conversacional rodando.
- **3 Cs da Monetização** → cada C tem um deliverable comercial (proposta, contrato, entrega documentada).

**O que preciso dos outros:**

- **Arquiteto:** lista canônica de competências por trilha, com Bloom level já calibrado. Eu não vou adivinhar — a trilha chega no meu motor já com `competency.bloom_level` preenchido. Preciso também da definição da "performance task" final por trilha.
- **Núcleo 01:** o conteúdo das aulas precisa explicitar quais perguntas/exercícios eu posso gerar a partir dele. Núcleo 01 me entrega "anchor concepts" por aula que viram seed pra geração de quiz.
- **Database:** schema de `assessments`, `assessment_attempts`, `rubric_criteria`, `rubric_scores`, `evidence_artifacts` (ver Topic 2).
- **Backend Dev:** endpoints pra submeter evidência, disparar review (agent ou humano), retornar resultado.
- **UI UX Design:** componentes de upload de artifact, visualização de rubric, dashboard de competências adquiridas.
- **QA Review:** pra cada quiz que eu gerar, QA roda smoke test de validade (perguntas ambíguas, gabarito errado, distratores fracos).
- **Scrum Master:** prioridade entre formatos de avaliação (começo por quiz ou por rubric?). Minha sugestão: começar pelos dois em paralelo, mas rubric primeiro porque é onde a doutrina aperta.

**Risco crítico:**

Construir um quiz engine bonito e cair na armadilha de "horas assistidas + quiz respondido = competência demonstrada". Isso reproduz o anti-padrão que o Charter Part I §1.3 explicitamente rejeita. Se eu não brigar desde o dia 1 pra que rubric-graded artifacts sejam o caminho default (não a exceção), o sistema vira mais um curso de Udemy.

---

## Topic 2: Arquitetura

**Minha posição (Assessment Engine):**

Proposta de tabelas (extensão do Part IV §4.2):

```
assessments
  id, lesson_id (nullable, pode ser de módulo/trilha), competency_id,
  type enum('quiz_auto','rubric_artifact','peer_review','agent_review','live_demo'),
  bloom_target smallint, persona_variant text[], stage_target smallint,
  layer_target text, prompt_md text, rubric_id (nullable), passing_threshold numeric

rubrics
  id, title, criteria jsonb -- [{name, weight, levels:[{score,label,descriptor}]}]

assessment_attempts
  id, user_id, assessment_id, submitted_at, evidence_url, raw_payload jsonb,
  status enum('submitted','in_review','passed','failed','revise')

rubric_scores
  attempt_id, criterion_name, score, reviewer_type, reviewer_id, comment_md

evidence_artifacts
  id, attempt_id, kind enum('json_workflow','video','url','file','text'), uri, sha256
```

Pontos arquiteturais não-óbvios:

- **`assessment` é desacoplada de `lesson`.** Uma assessment pode pertencer a um módulo inteiro (projeto integrador), não só a uma aula. Isso é o que permite rubric multi-competency no fim do módulo enquanto mantém quiz single-competency dentro da aula.
- **`persona_variant` é array.** Uma assessment pode servir múltiplas personas com leve recalibragem de prompt — mas o critério de aprovação é o mesmo. Isso preserva a regra do Charter §3.3: "variantes calibradas preservam a competência final".
- **`evidence_url` do `user_competency_progress` (Part IV §4.2) aponta pro melhor `assessment_attempt` aprovado** — não pra um upload solto. Isso garante rastreabilidade total: toda competência marcada como adquirida tem um attempt certificado por trás.
- **Reviewer híbrido.** `pedagogical_reviews` (Part IV §4.4) cobre o lado *do conteúdo*; meu `rubric_scores.reviewer_type` cobre o lado *da avaliação do aluno*. São dois fluxos paralelos, não conflitam.
- **Workers Python locais** (Part IV §4.5) são quem geram drafts de quiz e rodam o agent reviewer. Sem infra externa, sem fila, invocação por Bash.

**O que preciso dos outros:**

- **Database:** validar a proposta acima como migrations idempotentes (ver doutrina Charter §4.5 + supabase migration patterns). Eu desenho o ER, Database aprova ou propõe diff.
- **Backend Dev:** endpoints `POST /assessments/:id/attempt`, `POST /attempts/:id/grade`, `GET /users/:id/competency-progress`. Validação de RLS (aluno só vê próprio attempt; reviewer vê o que foi atribuído a ele).
- **Security/Tier & RLS:** RLS pra `assessment_attempts` — aluno só lê o próprio, reviewer lê os designados, admin vê tudo. E policy contra fraude: aluno não pode reescrever attempt depois de `passed`.
- **Arquiteto:** confirmar que toda competência da trilha tem pelo menos uma assessment mapeada antes de a trilha ser publicada.
- **QA Review:** test plan e2e de submissão → revisão → progressão de competência.

**Risco crítico:**

Acoplar assessment a `lesson_id` obrigatório. Se eu fizer isso, quebro a possibilidade de projeto integrador de módulo/trilha — que é exatamente onde Bloom 5–6 vive. Tem que ser nullable desde a primeira migration, ou vou ter rework caro depois.

---

## Topic 3: Progressão CBE

**Minha posição (Assessment Engine):**

CBE operacional significa três coisas concretas:

1. **A unidade de progresso é a competência, não a aula.** Meu motor escreve em `user_competency_progress`, não em `lesson_completions`. O front pode mostrar "70% da aula" como instrumentação visual, mas o sistema de certificação ignora isso.
2. **Test-out é first-class.** Aluno autodidata (persona Autodidata, Charter §3.2) pode submeter evidência *sem assistir aula*. Minha engine aceita attempt vinculado a competency_id, independente de lesson_id. Se passa, marca como adquirida e libera o que estava bloqueado por essa competência.
3. **Re-attempt sem penalidade, com cooldown e reflexão.** Falhar um rubric-graded artifact requer reflexão escrita ("o que vou mudar?") antes de re-submeter. Isso aplica Kolb (reflexão obrigatória) e evita gaming.

Regra de desbloqueio: trilha avança quando `count(competencies_acquired) / count(competencies_required) >= threshold`, com `threshold = 1.0` por default. Não há "bypass por tempo".

Estágio do aluno (Part III §3.1) só avança quando um conjunto de competências do estágio anterior está marcado como adquirido. Minha engine emite o evento `competency.acquired` e o terminal de Personalização (Shell #3) decide se isso muda o estágio.

**O que preciso dos outros:**

- **Backend Dev:** event bus interno (pode ser tabela `domain_events` + worker poller, sem broker) pra eu emitir `competency.acquired` e Personalization Router consumir.
- **Arquiteto:** mapeamento competência ↔ estágio. Quais competências fecham o Estágio 1? Sem isso, eu não sei quando emitir evento de transição.
- **Frontend Dev / UI UX:** "Mapa de competências" visível pro aluno — diferente de "Mapa de aulas". Aluno tem que ver progresso CBE, não progresso de horas.
- **Database:** index em `user_competency_progress (user_id, status)` pra consulta rápida do mapa.

**Risco crítico:**

Fazer CBE no backend mas o front mostrar barra de progresso por aula. O aluno vai continuar otimizando "completar aula" e não "demonstrar competência". A interface dita o comportamento — se UI UX e Frontend não comprarem o mapa de competências como tela primária, CBE fica decorativo.

---

## Topic 4: Personalização Cubo 3D

**Minha posição (Assessment Engine):**

O Cubo (Estágio × Persona × Camada, Charter §3.3) afeta minha engine de uma forma específica e não-óbvia: **a competência é constante, o assessment é variante**.

Exemplo concreto — competência "construir fluxo n8n que dispara ao receber webhook":

| Persona | Formato do assessment | Critério de passagem |
|---|---|---|
| Zerado | Tutorial guiado + checklist binário de 8 itens; pode pedir hint sem penalidade | 8/8 |
| Autodidata | Briefing de 3 linhas, sem hint, submete JSON do workflow | rubric ≥ 80 |
| Organizado | Briefing + 2 perguntas reflexivas pré-submissão | rubric ≥ 75 + reflexão coerente |

A competência adquirida é a mesma. O `competency_id` registrado em `user_competency_progress` é o mesmo. O `assessment_id` que gerou o attempt é diferente.

**Geração:** não vou escrever 27 variantes à mão por competência. Worker Python local (Charter §4.5) recebe: `(competency, bloom_level, persona, stage, layer)` e gera draft de assessment via LLM, com base em template de rubric e em "anchor concepts" do Núcleo 01. Eu (Núcleo 02) reviso e publico.

Camada de Maestria (Técnica/Lógica/Maestria) muda o **tipo** de evidência:
- Técnica → screenshot/JSON do workflow rodando
- Lógica → diagrama + justificativa de arquitetura
- Maestria → documento estratégico ligando o fluxo à dor do negócio + métrica de impacto

**O que preciso dos outros:**

- **Shell #3 (Personalization Router):** quando aluno entra numa lesson, Router me diz `(persona, stage, layer)` e eu retorno o `assessment_id` certo. Sem esse contrato, não há roteamento.
- **Núcleo 01:** "anchor concepts" estruturados por aula — não posso gerar assessment a partir de markdown de aula sem âncoras explícitas.
- **Arquiteto:** validar que as variantes preservam a competência (não estão diluindo). Revisão pedagógica obrigatória das variantes Zerado, que tendem a virar fáceis demais.
- **UI UX Design:** UI única que aceita os 5 tipos de evidência (json_workflow, video, url, file, text) sem virar 5 telas diferentes.

**Risco crítico:**

Variante Zerado virar "easy mode" que certifica competência sem o aluno ter de fato a capacidade. Consequência: aluno chega no Estágio 3 com selo de competência mas sem a habilidade real, falha na monetização (Kirkpatrick nível 4 quebra), e a métrica de sucesso do sistema inteiro evapora. Vou precisar de auditoria periódica: comparar taxa de aprovação por persona vs taxa de monetização real por persona. Se Zerados aprovam mais e monetizam menos, a variante está mentindo.

---

## Topic 5: Skills educacionais eficientes

**Minha posição (Assessment Engine):**

Skills atômicas que eu, Núcleo 02, preciso ver criadas (algumas listadas no Charter §4.6 com asterisco, outras propostas por mim):

1. **`bloom-calibrator`** *(já prevista)* — recebe um objetivo de aprendizagem, retorna nível Bloom + sugestão de formato de assessment compatível. Sem isso, eu rejeito qualquer competência sem nível Bloom calibrado.
2. **`rubric-builder`** *(proposta)* — recebe (competência, bloom_level, layer), gera rubric com critérios, pesos e descritores. Output validado contra template.
3. **`quiz-from-anchors`** *(proposta)* — recebe anchor concepts do Núcleo 01 + bloom_level, gera N perguntas com distratores plausíveis. Bloom 1–3 only.
4. **`evidence-validator`** *(proposta)* — recebe artifact submetido pelo aluno + rubric, faz primeira passada de validação automática (formato correto? completude mínima?) antes de chamar reviewer.
5. **`agent-reviewer`** *(proposta)* — recebe attempt + rubric, devolve scores por critério com justificativa. Funciona como reviewer_type='agent' do Charter §4.4. Decisões dele são depois auditadas por humano.
6. **`competency-mapper`** *(proposta, compartilhada com Arquiteto)* — recebe descrição de uma trilha, devolve árvore de competências candidatas com Bloom levels. Eu uso pra validar que assessment cobre tudo.

Skills que NÃO devo criar (porque já existem ou são responsabilidade de outro):
- `backward-design` → Arquiteto
- `tres-camadas-maestria` → Arquiteto
- `senior-prompt-engineer` → já existe, uso direto

**Princípio de eficiência:** cada skill tem **um** input e **um** output. Skills compostas (ex: "gere assessment completo a partir de aula") são pipelines de skills atômicas, orquestrados por mim, não uma mega-skill.

**O que preciso dos outros:**

- **Arquiteto:** co-autoria das skills `bloom-calibrator` e `competency-mapper`. Sem alinhamento de definição de competência, as duas skills viram inúteis.
- **Núcleo 01:** formato canônico dos "anchor concepts" — sem isso, `quiz-from-anchors` não tem input estável.
- **Scrum Master:** priorização. Minha ordem sugerida: bloom-calibrator → rubric-builder → agent-reviewer → quiz-from-anchors → evidence-validator → competency-mapper. As 3 primeiras destravam tudo.

**Risco crítico:**

Criar mega-skills que tentam fazer tudo. Já vi isso em outros sistemas: a skill cresce, vira intratável, ninguém debugga, e o time abandona. Atomicidade é não-negociável.

---

## Topic 6: Skills de programação atreladas à metodologia

**Minha posição (Assessment Engine):**

Skills de programação que existem hoje (`senior-backend`, `senior-frontend`, `tomik-db-doctrine`, etc.) precisam ser **encapsuladas por wrappers pedagógicos** quando tocarem o domínio educacional. Não é que `senior-backend` seja proibida; é que quando ela cria um endpoint de assessment, precisa passar por um checklist pedagógico:

- O endpoint respeita a regra "não há bypass por tempo"?
- O endpoint emite o evento `competency.acquired` quando devido?
- A response inclui `competency_id` (não só `lesson_id`)?
- Há test que prova que aluno não pode marcar competência como adquirida sem attempt aprovado?

Proposta concreta: hook `pre-commit` (ou skill `pedagogical-lint`) que escaneia diffs em arquivos sob `automatiklabs/src/app/(platform)/api/assessments/` ou `competencies/` e bloqueia se as regras acima não forem satisfeitas.

Skills proprietárias atreladas à metodologia (todas a criar):

- **`assessment-endpoint-builder`** — wrapper de `senior-backend` que sempre gera endpoint com RLS, evento de domínio e teste de progressão CBE inclusos.
- **`rubric-ui-builder`** — wrapper de `senior-frontend` que gera componente de rubric com upload de evidence e estado de revisão.
- **`competency-migration-builder`** — wrapper de `tomik-db-doctrine` específico pra migrations de competency-related tables, garantindo idempotência e RLS.

**O que preciso dos outros:**

- **Backend Dev:** parceria pra escrever `assessment-endpoint-builder`. Backend Dev domina senior-backend; eu domino as regras pedagógicas. Sai uma skill conjunta.
- **Frontend Dev:** mesmo padrão pra `rubric-ui-builder`.
- **Database:** mesmo padrão pra `competency-migration-builder`.
- **QA Review:** suíte e2e que valida que todo endpoint pedagógico passa nos 4 checks acima.

**Risco crítico:**

Drift entre código e doutrina. Hoje funciona porque o time é pequeno e todos leem o Charter. Daqui a 6 meses alguém vai criar um endpoint que aceita `mark_lesson_complete` sem attempt e isso vai "funcionar" no front. Sem lint automatizado, a doutrina vira folclore. Eu preciso de hooks, não de boa vontade.

---

## Topic 7: Coordenação multi-professor

**Minha posição (Assessment Engine):**

"Multi-professor" no contexto AutomatikLabs significa três populações que produzem conteúdo e esperam que minha engine avalie:

1. **Núcleo 01 (Content Production)** — produz aulas em escala via LLM + revisão.
2. **Professores humanos especialistas** — gravam vídeo, escrevem markdown, esperam que quizzes sejam gerados pra eles.
3. **Agentes pedagógicos automatizados** — geram trilhas inteiras a partir de briefing.

Pra mim, todos os três são *fontes* que precisam entregar input no mesmo formato canônico:

```yaml
lesson_id: ...
competencies_taught: [comp_id_1, comp_id_2]
anchor_concepts:
  - concept: "webhook trigger no n8n"
    bloom_target: 3
    layer: tecnica
  - concept: "decisão de quando usar webhook vs polling"
    bloom_target: 5
    layer: logica
performance_task_seed: "monte um fluxo que..."
```

Se a lesson não chega com esse pacote, minha engine recusa gerar assessment. Hard gate. Isso força os 3 produtores ao mesmo padrão sem eu precisar negociar caso a caso.

**Coordenação operacional:**

- **Pedagogical reviews (Charter §4.4)** são o ponto de encontro. Toda lesson passa por uma review onde reviewer humano (ou agent) valida que o pacote acima está completo e que as competências declaradas batem com o conteúdo de fato.
- **Eu (Núcleo 02)** sou um dos reviewers default — minha review valida o lado da *avaliabilidade*: "essa aula é avaliável? as competências declaradas têm Bloom level testável?".
- **Núcleo 01** valida o lado do conteúdo. Arquiteto valida alinhamento com a trilha. Três reviewers, um workflow.

Conflitos esperados: Núcleo 01 vai querer publicar mais rápido ("a aula tá boa"), eu vou segurar ("falta anchor concept pra Bloom 5"). Resolução: Scrum Master arbitra, e a métrica que decide é "essa aula fecha alguma competência?". Se sim, segura. Se é só material de apoio sem competência atrelada, libera com flag `assessable=false`.

**O que preciso dos outros:**

- **Scrum Master:** SLA de revisão (proposta: 24h pra agent review, 72h pra human review).
- **Núcleo 01:** comprometimento com o formato canônico de anchor concepts. Sem isso, eu viro gargalo.
- **Arquiteto:** definição de "lesson não-avaliável" — quando é OK uma aula existir sem competência atrelada (provavelmente: introduções, contexto, motivação).
- **Backend Dev:** workflow de review com fila + atribuição + notificação.
- **Database:** tabela de fila de review e índice por reviewer_id + status.

**Risco crítico:**

Núcleo 01 produzindo em escala (LLM-generated) e eu não conseguindo escalar a revisão na mesma velocidade. Resultado: backlog de aulas não-avaliáveis publicadas com `assessable=false` que viram "horas de vídeo" — exatamente o anti-padrão do Charter §1.3. Mitigação: agent reviewer (skill `agent-reviewer`) tem que estar pronto antes de Núcleo 01 ligar a esteira. Sem isso, a fila explode na primeira semana.

---

## Síntese final — Núcleo 02

**Três coisas que vou defender em todas as rounds seguintes:**

1. **Competência é a unidade de progresso. Aula não é.** Backend, Frontend e UX precisam comprar isso.
2. **Bloom 5–6 = rubric-graded artifact. Sem exceção.** Quiz auto-corrigido não certifica criação.
3. **Variantes do Cubo preservam a competência.** Personalização não é dilution. Auditoria por taxa de monetização real.

**Três coisas que mais me assustam:**

1. **Variante Zerado virar easy mode** e quebrar Kirkpatrick nível 4.
2. **Núcleo 01 escalar antes de eu ter agent-reviewer pronto** e a fila virar pântano.
3. **CBE no backend mas UI por horas** — comportamento do aluno otimiza pelo que vê.

**O que vou escrever no meu sub-epic (Part V #11) na Fase 1:**
- Schema de assessments + rubrics + attempts + evidence (dependência: Schema Extensions área #02)
- 6 skills atômicas listadas em Topic 5
- Workflow de review em 3 reviewers (Núcleo 02 + Núcleo 01 + Arquiteto)
- Pedagogical lint hook
- Auditoria de variantes do Cubo (job recorrente)

**DONE.**
