# Round 1 — Content Production (Nucleo 01)

**Terminal:** Nucleo 01
**Área:** Content Production (Sub-Epic 10)
**Skill stack:** `automatiklabs-doctrine` + `senior-prompt-engineer`
**Voz que trago à mesa:** geração de aulas. Eu sou o terminal que transforma `(objective + Bloom + persona + estágio + camada)` em um **script de aula** com estrutura narrativa (contexto → conceito → demo → prática → síntese) e metadata estruturada acoplada. Minha métrica é qualidade por unidade de tempo-professor-humano economizada sem introduzir slop.

---

## Topic 1: Metodologias

**Minha posição (Content Production):**

As 6 metodologias do Charter (Backward Design, Bloom, CBE, Cognitive Load, Kolb, Kirkpatrick) + as 5 proprietárias (3 Camadas, Empresa c/ IA Humanizada, 7 Passos, 3 Cs, Jornada 7 Fases) não são "inspirações" para mim — são **restrições duras no prompt de geração**. Cada uma vira uma seção obrigatória do system prompt do lesson-generator:

- **Backward Design** → o prompt RECEBE o resultado mensurável primeiro, gera a lesson de trás pra frente. Nunca o contrário. Se o chamador não passar `desired_outcome`, a skill aborta.
- **Bloom** → vira um slot obrigatório `bloom_target: 1..6`. O gerador usa verbos-âncora por nível (nível 3=aplicar → "implemente, configure, execute"; nível 6=criar → "projete, componha, arquitete"). Sem verbo-âncora certo, o script falha validação.
- **CBE** → a lesson precisa terminar num **artefato demonstrável** (arquivo n8n.json, print do fluxo rodando, transcript de conversa com agente). Não termina em "você aprendeu X". Termina em "você produziu Y — upload aqui".
- **Cognitive Load** → regra dura no gerador: **1 conceito novo por aula**. Se o outline tenta introduzir 2, o gerador quebra em 2 lessons. Carga extrínseca (jargão, digressão) é proibida por checklist no validator.
- **Kolb** → o esqueleto narrativo de 5 partes que uso (contexto→conceito→demo→prática→síntese) É o ciclo de Kolb renomeado (experiência concreta → observação reflexiva → conceituação abstrata → experimentação ativa → [síntese volta à experiência]). Isso não é negociável — é a estrutura.
- **Kirkpatrick** → não me afeta na geração de UMA lesson, mas afeta COMO encadeio lessons numa trilha: a última lesson de qualquer trilha tem que apontar pra uma ação de nível 3/4 (comportamento/renda), não de nível 1/2 (reação/aprendizagem).

Sobre as proprietárias: eu preciso tratá-las como **templates de spine** — cada metodologia tem um esqueleto de aula padrão. Ex: uma aula de "Empresa c/ IA Humanizada, Pilar 1 (Fluxo de Trabalho)" tem uma estrutura canônica (mapear processo atual → identificar gargalo → desenhar fluxo → validar com stakeholder). Não posso deixar o LLM "criar" essa estrutura do zero toda vez.

**O que preciso dos outros:**

- **Arquiteto (Instructional Design):** me entrega o *learning design document* de cada curso ANTES de eu gerar aulas. Preciso de: objetivo final mensurável, lista ordenada de competências intermediárias, Bloom target por competência, e pré-requisitos. Sem esse doc eu **não gero** — me recuso a improvisar.
- **Nucleo 02 (Assessment):** precisa me dizer quais evidências serão cobradas na avaliação ANTES de eu escrever a prática. A prática da lesson tem que ser ensaio do assessment, não uma atividade paralela. Contrato: Assessment gera a rubric primeiro, eu gero a prática depois, alinhadas.
- **Scrum Master (Curriculum Orchestration):** me dá ordem de prioridade. Eu não decido sozinho qual trilha gerar primeiro — Scrum decide com base no Production Board.
- **Database:** schema de `lessons` precisa ter colunas pra: `script_md`, `methodology_tags[]`, `kolb_phase_durations jsonb`, `cognitive_load_budget int` (minutos de carga intrínseca estimada), `bloom_level smallint`. Se só tiver `content_md`, perco o contrato com Bloom/CBE.

**Risco crítico:**

**Metodologia virar decoração.** O risco real é o gerador começar a cuspir aulas que "dizem" que seguem Kolb mas na prática são aula expositiva disfarçada. Precisa de um **validator automatizado** (eu proponho ser responsável por ele, é parte do meu epic) que faz grep estrutural: "tem seção 'prática'? a seção 'prática' tem imperativo verbal? tem artefato de saída nomeado?". Sem validator, a metodologia vira label, não prática.

---

## Topic 2: Arquitetura

**Minha posição (Content Production):**

A arquitetura do Charter (tracks→courses→modules→lessons + competencies first-class + pedagogical_reviews + user_journey_history) está **quase** certa pra mim, mas falta uma camada crítica: **lesson variants**. Eu não gero "a lesson X". Eu gero "a lesson X para a célula (Estágio 2, Autodidata, Camada Lógica)". Preciso de uma tabela ou de colunas que permitam múltiplas variantes da mesma lesson apontando pro mesmo `competency_id`.

Proposta concreta que vou defender para o Database:
```
lesson_variants (
  id uuid pk,
  lesson_id uuid fk,          -- lesson "canônica" (a ideia-mãe)
  journey_stage smallint,     -- 1..6 ou null = qualquer
  persona text,               -- 'zerado'|'autodidata'|'organizado'|null
  maestria_layer text,        -- 'tecnica'|'logica'|'maestria'|null
  script_md text,
  duration_minutes int,
  generator_run_id uuid,      -- qual run do gerador produziu isso
  review_status text          -- pending|approved|rejected
)
```

Sem isso, acabo com 54 `lessons` duplicadas ou com uma `lessons` gigante com markdown condicional dentro — ambos ruins.

Outra coisa arquitetural: preciso de um **lesson_generator_runs** que registra `(prompt_version, model, inputs_hash, outputs, tokens, cost, reviewer_feedback)`. Isso é o meu anel de retroalimentação pra melhorar o prompt do gerador ao longo do tempo. Senão fico no escuro sobre o que funciona.

Por fim: **workers Python locais no Claude Code** (Decisão 4.5 do Charter) me servem bem. Eu não preciso de infra. Meu worker é um script invocado via Bash tool que chama `senior-prompt-engineer`, valida output, grava em Supabase, emite `pedagogical_review` pendente. Zero deploy.

**O que preciso dos outros:**

- **Database:** aprovação da tabela `lesson_variants` e `lesson_generator_runs`. Se forem recusadas, preciso de contra-proposta — não posso viver só com `lessons`.
- **Backend Dev:** endpoint (ou RPC) pra criar uma variant + marcar review pendente num único call transacional. Não quero fazer 3 inserts do Python e ficar torcendo.
- **Frontend Dev / UI UX Design:** a plataforma precisa saber escolher QUAL variant mostrar pro aluno logado (com base em `user_journey_history.persona` e `user_journey_history.journey_stage`). Eu não cuido disso, mas o esquema que eu proponho precisa ser consumível por eles. Preciso de confirmação que o shape serve.
- **QA Review:** playbook de como validar uma variant gerada automaticamente. Não basta "está publicada?" — precisa ser "a variant Autodidata realmente pula os fundamentos que a Zerado detalha?".

**Risco crítico:**

**Explosão combinatória sem tooling.** 6 estágios × 3 personas × 3 camadas = 54 variantes por lesson. Uma trilha com 40 lessons = 2160 variantes. Mesmo com LLM barato, isso é ingerível sem:
1. Geração em **batch com diff** (gerar só o delta entre variantes, não 54 aulas do zero).
2. Regra de **"quando uma variante herda"** (ex: a Camada Técnica do Autodidata pode reutilizar 80% da Camada Técnica do Organizado, só muda prática e ritmo).
3. Cache agressivo de partes invariantes do script.

Se Database/Backend recusarem a tabela de variants, o risco é eu virar um script que cospe markdown condicional gigante dentro de `lessons.content_md` e todo mundo perder rastreabilidade de qual versão foi gerada quando.

---

## Topic 3: Progressão CBE

**Minha posição (Content Production):**

CBE muda **radicalmente** como eu escrevo aulas. Numa plataforma de horas assistidas, a aula termina com "você assistiu, parabéns". Numa plataforma CBE, a aula termina com "você produziu X, faça upload, o assessment vai verificar". Isso significa que **toda lesson que eu gerar tem um `output_artifact` obrigatório** no front matter.

Meu contrato comigo mesmo:
- Toda lesson declara `evidence_expected: {type: 'file'|'url'|'transcript'|'screenshot', prompt: '...'}`.
- Se a célula do cubo é de Camada Técnica, a evidência tende a ser um arquivo (`.json` de fluxo n8n, vídeo rodando).
- Se é Camada Lógica, tende a ser um diagrama + explicação (markdown com mermaid, ou screenshot de miro).
- Se é Camada Maestria, tende a ser uma decisão justificada (texto curto: "escolhi X ao invés de Y porque...").

O avanço do aluno não é "lesson completada". É "evidência aprovada pro `competency_id` Z". Uma competência pode ter N lessons de preparação; uma lesson pode contribuir pra múltiplas competências (por isso `lesson_competencies` é many-to-many no Charter).

**Proposta operacional:** toda lesson que eu gero inclui um bloco YAML cabeçalho:
```yaml
competencies_taught: [comp-n8n-http-request, comp-api-auth-basic]
evidence_expected:
  type: file
  format: json
  prompt: "Exporte seu fluxo n8n com pelo menos 3 nodes encadeados e faça upload"
  validation_hint: "verificar presença de HTTP Request node + credencial configurada"
bloom_target: 3
kolb_focus: experimentação_ativa
```
Esse bloco é o contrato com Nucleo 02 (Assessment) e com QA.

**O que preciso dos outros:**

- **Arquiteto:** me dá o **catálogo de competências** antes de eu gerar qualquer aula. Eu não invento `competency slugs` — consumo de um catálogo canônico. Se não existe catálogo, eu paro. Proponho que Fase 1 tenha uma story "Arquiteto publica competency catalog v1" como bloqueante pra toda geração.
- **Nucleo 02:** se a lesson declara `evidence_expected.type=file`, o assessment tem que ter um validator que consegue LER esse file. Contrato: eu não declaro um tipo de evidência que Nucleo 02 ainda não suporta. Precisamos de uma matriz `evidence_type × validator_available`.
- **Database:** a tabela `user_competency_progress` do Charter (§4.2) precisa de uma coluna `evidence_url` (ótimo, já tem) MAS também `validated_by` (`auto`|`peer`|`human`) e `validated_at`. Vou pedir.
- **Backend Dev:** precisa de um job que, quando aluno faz upload de evidência, dispara o validator certo (escolhido pelo `evidence_type`) e atualiza `user_competency_progress`.

**Risco crítico:**

**CBE virar "quiz de múltipla escolha disfarçado".** Fácil demais cair na tentação de trocar `evidence_type=file` por `evidence_type=quiz` em toda lesson porque quiz é fácil de auto-validar. Isso mata a doutrina (Kirkpatrick nível 2, não 3/4). Preciso de uma **regra dura no gerador**: em trilhas de estágio ≥3, NO MAX 30% das lessons podem ter `evidence_type=quiz`. O resto tem que ser artefato real. Essa regra entra no validator automático.

---

## Topic 4: Personalização Cubo 3D

**Minha posição (Content Production):**

O Cubo 3D é onde eu mais tenho opinião forte, porque é onde o risco de slop é maior. Posição: **não existe "gerar 54 aulas". Existe "gerar 1 lesson-spine canônica + 3 eixos de transformação aplicados"**.

Minha proposta arquitetural de geração:

1. **Spine canônico** — uma única versão "neutra" da lesson, escrita no nível Organizado + Camada Lógica + estágio central (3 ou 4). Essa é a versão que o Arquiteto + QA aprovam primeiro. É o "golden master".

2. **Transformers por eixo** — três prompts de transformação, cada um especializado em UM eixo:
   - `transformer_persona(spine, target_persona)` → reescreve ritmo, profundidade didática, quantidade de exemplos.
     - Zerado: adiciona analogias, repete conceitos-chave, quebra em passos menores, adiciona "antes de começar, certifique-se que..."
     - Autodidata: corta analogias, vira tópicos, TL;DR no topo, pula warnings óbvios.
     - Organizado: mantém o spine, só ajusta pra tom mais formal e adiciona checkpoints entre seções.
   - `transformer_stage(spine, target_stage)` → ajusta as **referências monetárias e de contexto**. Estágio 1 fala em "sua primeira automação funcionando", Estágio 5 fala em "delegando isso pro seu operador".
   - `transformer_layer(spine, target_layer)` → muda a profundidade técnica. Camada Técnica mostra cliques e configs. Camada Lógica mostra o "por que desse node, não daquele". Camada Maestria discute trade-offs estratégicos ("quando NÃO automatizar isso").

3. **Composição** — pra gerar a célula (Estágio 4, Autodidata, Maestria), aplico os 3 transformers em sequência sobre o spine. Cada transformação gera um diff rastreável, não um rewrite do zero.

4. **Validator pós-transformação** — checa que a transformação preservou: (a) competency_id, (b) bloom_target, (c) evidence_expected. Se algum mudou, rejeita e regenera.

**Por que não gerar 54 do zero:** custo, inconsistência e perda do "golden master". Se o professor humano corrigir o spine, os 54 se regeneram. Se cada célula for independente, corrigir vira 54 edições manuais = morte.

**O que preciso dos outros:**

- **Shell #3 (Personalization Router, se existir):** precisa me dizer QUAIS células do cubo são prioritárias pra cada trilha. Não preciso gerar as 54 imediatamente — só as que têm demanda real (ex: primeiras trilhas só precisam de Estágio 1–3 × Organizado × Técnica+Lógica = 6 variants, não 54).
- **Arquiteto:** ao entregar o learning design, diz quais estágios/personas/camadas o curso PRETENDE servir. Um curso de "primeiros passos em n8n" provavelmente só serve Estágios 1–2, não 5–6. Sem esse escopo, eu gero variants inúteis.
- **UI UX Design:** precisa confirmar que a plataforma sabe mostrar "esta aula não existe ainda na sua célula — mostrando a variante mais próxima (Organizado/Lógica)" sem quebrar o layout. Senão o aluno cai em 404.
- **Database:** `lesson_variants` precisa ter colunas `journey_stage`, `persona`, `maestria_layer` nullable — null = "serve qualquer valor desse eixo". Assim uma variant pode ser "Zerado, qualquer estágio, Camada Técnica".

**Risco crítico:**

**Transformação sem validação semântica = slop disfarçado de personalização.** O risco é o `transformer_persona(Zerado)` só adicionar emojis e chamar o aluno de "você tá indo bem!" — virar condescendência, não didática. A diferença entre Zerado e Autodidata tem que ser **estrutural** (quantos passos intermediários, quantos exemplos, quantas verificações), não cosmética. Preciso de uma rubrica de validação pós-transform que mede: densidade de conceitos/minuto, número de checkpoints, número de analogias, número de warnings. Se o diff só mexeu em tom, rejeito.

---

## Topic 5: Skills educacionais eficientes

**Minha posição (Content Production):**

Skills educacionais que EU (Content Production) preciso que existam, em ordem de prioridade:

1. **`lesson-generator`** (a criar — minha) — input: `{course_spec, competency_id, bloom_target, spine_mode|variant_spec}`. Output: script markdown + front matter + evidence spec. Internamente usa `senior-prompt-engineer` como subagente mas tem system prompt específico carregando a doutrina. Esta é a skill-mãe.

2. **`lesson-validator`** (a criar — minha, complementar) — input: script gerado. Output: `{passes: bool, failures: [...], suggestions: [...]}`. Checks automatizados: tem Kolb 5 fases? tem verbo-âncora Bloom correto? tem evidence_expected? tem 1 conceito novo? duration estimada é compatível com cognitive_load_budget? Sem isso, o gerador não tem feedback loop.

3. **`spine-transformer`** (a criar — minha) — aplica um dos 3 eixos do cubo num spine existente. Três invocações: `persona`, `stage`, `layer`.

4. **`backward-design`** (Charter marca como `*` — ainda não existe) — PRECISO que Arquiteto crie primeiro. Recebe `desired_outcome` e cospe a árvore de competências intermediárias em ordem. Sem isso, eu fico recebendo specs incompletos e compensando no prompt — é aí que o slop entra.

5. **`bloom-calibrator`** (também `*`) — dado um rascunho de objetivo, retorna qual nível Bloom ele está e qual verbo usar. Eu consumo isso na geração. Se Arquiteto não criar, eu improviso com lista de verbos hardcoded — subótimo.

Skills **que eu NÃO devo criar** (escopo de outros):
- Assessment rubrics → Nucleo 02.
- Quiz generation → Nucleo 02.
- Syllabus planning → Arquiteto.
- Course ordering / curriculum tree → Scrum Master.

**Princípio de eficiência:** cada skill é **uma função pura**: input → output determinístico (dado o mesmo `model+prompt_version+inputs_hash`). Sem estado escondido. Isso permite cache, replay, auditoria. Se uma skill depende de contexto implícito ("você sabe do curso X"), está errada.

**Tamanho certo:** skill de ≤ 150 linhas de instrução. Se passar disso, quebrar. O `senior-prompt-engineer` é meu "motor"; as minhas skills são configuradores finos em cima dele.

**O que preciso dos outros:**

- **Arquiteto:** criar `backward-design` e `bloom-calibrator` como stories bloqueantes da minha epic. Sem elas, minha `lesson-generator` nasce mancando.
- **Nucleo 02:** definir o **contrato de evidência** (esquema YAML do `evidence_expected`) em co-autoria comigo. Não dá pra eu propor e ela implementar depois — tem que ser conjunto.
- **QA Review:** ajudar a escrever o `lesson-validator`. Os checks automatizados são basicamente "testes E2E de lessons" — é natureza de QA. Proponho: eu desenho o validator, QA escreve os testes dele.
- **Scrum Master:** definir a skill de orquestração (`lesson-batch-runner`?) que chama `lesson-generator` em ordem. Isso é dela, não minha.

**Risco crítico:**

**Skills virarem wrappers inúteis em volta do LLM cru.** Se `lesson-generator` é só "peça pro Claude gerar uma aula sobre X com tom Y", eu poderia ter chamado o LLM direto. A skill só justifica existir se ela: (a) carrega doutrina estruturada no system prompt, (b) valida output, (c) tem um prompt_version rastreável, (d) grava run no `lesson_generator_runs`. Se eu não entregar os 4, eu entreguei um wrapper = dívida técnica com disfarce de produtividade.

---

## Topic 6: Skills de programação atreladas à metodologia

**Minha posição (Content Production):**

Esse tópico me interessa porque **o conteúdo que eu gero é sobre programação-de-automação (n8n, APIs, agentes)** — não é genérico. Preciso que as skills de programação da plataforma estejam alinhadas com a metodologia, senão aluno aprende um jeito na lesson e encontra outro jeito quando vai programar no ambiente real.

Minha posição concreta:

- **Ambiente de prática integrado.** Toda lesson de Camada Técnica tem que rodar num ambiente **dentro da plataforma** ou com instruções exatas pra reproduzir localmente. Se minha lesson diz "clique no node HTTP Request" mas o aluno tá numa versão diferente do n8n, a lesson morre. Proposta: lessons declaram `environment: {tool: 'n8n', version_min: '1.70.0', sandbox_url: '...'}` e o Backend verifica.

- **Snippets versionados.** Os exemplos de código/fluxo dentro da lesson não vivem no markdown — vivem numa tabela `lesson_snippets` com versão. Quando n8n atualiza e quebra um exemplo, eu atualizo o snippet uma vez, não 54 variants.

- **Metodologia → estrutura de código de exemplo.** Isso é sutil mas crítico: quando eu mostro um exemplo de código/fluxo numa lesson de **Camada Lógica**, ele tem que seguir **os 3 Pilares** visivelmente. Ex: um exemplo de multi-agente mostra Pilar 1 (mapa de fluxo) + Pilar 2 (prompts dos agentes) + Pilar 3 (como eles se comunicam). O exemplo ensina a metodologia só pela forma, mesmo sem o aluno ler o texto.

- **Anti-padrão explícito.** Cada lesson de Camada Maestria inclui uma seção "anti-padrão" — mostra como ALUNO iniciante provavelmente vai fazer E por que está errado. Isso é Cognitive Load Theory aplicada: erradicar misconcepções antes que elas fossilizem.

**O que preciso dos outros:**

- **Backend Dev:** sandbox execution. Se o aluno envia um fluxo n8n como evidência, o Backend precisa ser capaz de executar num container descartável e capturar output. Sem isso, validação vira "o arquivo parece um .json? ok". Pobre.
- **Database:** tabela `lesson_snippets` separada de `lessons`, com versionamento (git-like — uma row por versão).
- **Arquiteto:** definir, por curso, quais ferramentas são canônicas (n8n vs Make vs Zapier). Eu não quero gerar lessons com exemplos em Make se o curso é canônico-n8n. Precisamos de um `course.preferred_tools[]`.
- **Security:** se alunos fazem upload de arquivos para validação, precisa de sandbox isolado. Não é minha área — mas é bloqueante pra minha visão de CBE.

**Risco crítico:**

**Desalinhamento temporal entre lesson e ferramenta.** n8n lança uma versão, o node "HTTP Request" muda de nome, e 2000 lessons falam da versão antiga. Sem tracking de `environment.version_min` e sem processo de re-validação periódica, a doutrina vira mentira. Proposta: uma skill `lesson-staleness-checker` que roda em cron, pega versões atuais das ferramentas e marca lessons obsoletas. Mas isso é Fase 2+ — só quero garantir que **a tabela já tenha o campo** agora na Fase 1 pra não ter migração dolorosa depois.

---

## Topic 7: Coordenação multi-professor

**Minha posição (Content Production):**

Eu sou **um** dos geradores. Não sou o único. O Charter implica isso: Arquiteto desenha, Nucleo 01 (eu) gera script, Nucleo 02 gera assessment, QA valida, humano aprova. É um **pipeline**, não um autor único. Minha posição:

1. **Nenhum terminal escreve direto em lesson publicada.** Todo conteúdo gerado entra como `pedagogical_reviews` pendente (Charter §4.4). Publicação exige aprovação. Inclusive a minha. Inclusive aprovação feita por outro agent é OK (reviewer_type='agent'), mas pelo menos UMA approval humana é necessária pra Camada Maestria (proponho essa regra — é onde slop é mais caro).

2. **Contratos explícitos entre terminais.** Eu preciso de um schema de hand-off:
   - Arquiteto → Nucleo 01: `learning_design_doc` (YAML com outcome, competências, bloom por competência, personas-alvo, camadas-alvo).
   - Nucleo 01 → Nucleo 02: `lesson_spec` (script + `evidence_expected`).
   - Nucleo 01 → QA: `lesson_variant` pronta pra validação automática.
   - Humano → Nucleo 01: `revision_request` (feedback estruturado: `{section, issue_type, suggestion}`) — não prosa livre, senão não sei processar.
   Todo hand-off vive como row em Supabase, não como mensagem no Slack.

3. **"Professor humano" continua sendo o revisor final, não o gerador.** Eu gero, ele corrige. Ele NÃO escreve do zero dentro do sistema (pode fora, mas vira input do gerador, não bypass). Isso preserva rastreabilidade.

4. **Quem é dono de corrigir o quê:**
   - Erro de competência mal mapeada → Arquiteto.
   - Erro de script (tom, estrutura, didática) → Nucleo 01 (eu).
   - Erro de assessment/evidência → Nucleo 02.
   - Erro de UI/layout da lesson → UI UX Design.
   - Erro de publicação/ordem → Scrum Master.
   Quando um humano dá feedback, ele marca categoria. O Orchestrator roteia pro terminal certo. Sem isso, tudo cai em cima de quem estiver olhando.

**O que preciso dos outros:**

- **Scrum Master:** dona do **Production Board** (Charter fala em Master Maestro atualizando) e do roteamento de feedback humano. Preciso que ela defina o schema de `revision_request`.
- **Backend Dev:** RLS / permissões pra que eu (Nucleo 01) só consiga INSERT em `lesson_variants` com `status=pending_review`, nunca `status=published`. Guarda-corpo técnico, não só contrato social.
- **Database:** tabela `review_requests (id, lesson_id, from_terminal, to_terminal, payload_jsonb, status)` pra hand-offs rastreáveis.
- **QA Review:** regra sobre **quando QA automático basta vs quando escala pra humano**. Proponho: aulas de Camada Técnica + Persona Organizado = QA automático só. Camada Maestria ou Persona Zerado = sempre humano também.

**Risco crítico:**

**Contenção no revisor humano.** Mesmo com 5 agents gerando rápido, se tudo parar numa única fila de revisão humana, a velocidade cai pra zero. O risco não é técnico — é operacional. Mitigação que proponho:
- QA automático é trusted para variantes derivadas via `spine-transformer` quando o spine já foi aprovado por humano (herdamos confiança da raiz).
- Humano só revisa: (a) spines canônicos, (b) qualquer coisa marcada pelo validator como "passou no automático mas com flag amarela", (c) sample aleatório de 5% das transforms pra não deixar drift.
- **Métrica vermelha:** se fila humana > 20 itens por 3 dias, orchestrator para de gerar novas aulas automaticamente. Backpressure explícito, não implícito.

Sem backpressure, eu (gerador) viro uma máquina de dívida técnica pedagógica.

---

## Fechamento

Meu resumo em uma frase: **eu só devo existir se a doutrina for executável por máquina**. Se cada metodologia do Charter não virar campo/regra/validator, eu geraria slop consistente com a doutrina só no nome. Meu pedido aos outros terminais é: me deem as estruturas (catálogo de competências, tabela de variants, contrato de evidência, schema de hand-off) e eu entrego geração em escala sem perder rigor. Sem elas, paro.

DONE.
