# Round 1 — Lesson Experience (UI UX Design)

**Terminal:** UI UX Design
**Área owned:** Lesson Experience (sub-epic 06)
**Voz:** Felt-experience. Eu falo pelo aluno que abre o navegador às 22h cansado do trabalho e decide se continua ou fecha a aba.
**Problema central do meu cargo:** o Cubo 3D é lindo no Charter e uma armadilha na tela. Se eu não resolver "como o Autodidata Estágio 4 VÊ a próxima aula diferente do Zerado Estágio 1", a personalização vira teatro — um badge colorido no topo e o mesmo player abaixo.

---

## Topic 1: Metodologias

**Minha posição (Lesson Experience):**
Das 6 metodologias canônicas (3 Camadas, Empresa c/ IA, 7 Passos, 3 Cs, Jornada 7 Fases, Backward Design), só duas têm representação visual óbvia hoje: 3 Camadas (badge de profundidade) e Empresa c/ IA (3 pilares como trilhas separadas). As outras 4 são invisíveis pro aluno — existem no Charter e somem na tela.

Minha posição dura: cada metodologia precisa de **um artefato visual específico de lesson**, não só um texto em `<p>`. Proposta concreta:
- **3 Camadas da Maestria** → chip de camada no topo da lesson (⚙️/🔗/🧠) + marcador de transição quando o módulo sobe de camada ("Você está saindo da Técnica e entrando na Lógica — aqui as perguntas mudam de forma").
- **Empresa c/ IA Humanizada** → breadcrumb de Pilar (Fluxo → Treinamento → Multi-Agente) visível durante a aula inteira, não só no índice.
- **7 Passos do Script de Vendas** → stepper horizontal fixo no footer do player enquanto o aluno assiste aulas dessa trilha. Passo atual destacado. Isso evita o aluno se perder no meio de um framework de 7 passos.
- **3 Cs da Monetização** → tríade visual (Criar / Capturar / Entregar) no topo de qualquer lesson de estágios 3–6. Marca qual dos 3 a lesson está trabalhando.
- **Jornada de Consciência 7 Fases** → NÃO aparece pro aluno final. É ferramenta de copy. Lesson Experience não renderiza isso.
- **Backward Design** → invisível por definição — é processo de autoria, não UI. Mas o resultado (objetivo mensurável da trilha) DEVE aparecer como card fixo no topo da trilha, sempre, repetido em toda lesson da trilha. "Ao final desta trilha você saberá X e será capaz de Y" — não enterrado no about.

Princípio: **metodologia sem artefato visual é metodologia que o aluno esquece.**

**O que preciso dos outros:**
- **Arquiteto**: cada lesson precisa declarar, no frontmatter do conteúdo, qual metodologia está ativa e em que posição (ex: `metodologia: 7-passos`, `passo_atual: 3`). Sem isso não tenho como renderizar o stepper. Quero um campo `methodology_context` no schema de `lessons`.
- **Nucleo 01 (Content Production)**: quando produz uma aula da trilha "Script de Vendas", precisa preencher o passo correspondente. Não dá pra eu adivinhar no front.
- **Database**: campos `methodology_slug` e `methodology_step` em `lessons` (ou tabela auxiliar se múltiplas metodologias coexistirem numa mesma lesson).

**Risco crítico:**
Metodologia virar **decoração**. Se o stepper dos 7 Passos aparece no footer mas o aluno pode pular da lesson 3 pra lesson 6 sem demonstrar nada, o stepper mente. Precisa estar acoplado ao gate de competência (Topic 3). Caso contrário é pior que não ter — dá sensação de progresso falsa, que é o inverso do que o Charter pede.

---

## Topic 2: Arquitetura

**Minha posição (Lesson Experience):**
A arquitetura atual (tracks → courses → modules → lessons) me serve, mas tem um buraco: **não há camada de "contexto de visualização"**. Hoje uma lesson tem conteúdo. Eu preciso de uma projeção derivada: "esta lesson, renderizada para (Estágio=4, Persona=Autodidata, Camada=Lógica)".

Proposta: **lesson_view_contexts** — não como conteúdo duplicado, mas como **overlay** que define:
- Quais seções da lesson mostrar/esconder
- Qual ordem das seções
- Qual call-to-action mostrar ao final
- Qual tom de voz nos hints
- Qual nível de scaffolding dos exercícios

Ou seja: **uma lesson, múltiplas projeções**. O conteúdo bruto mora em `lessons.content`. As projeções moram em `lesson_personalizations (lesson_id, stage, persona, layer, overrides_jsonb)`. Se não houver override pra uma célula do cubo, caímos num default sensato (ver Topic 4).

Sobre o stack: o frontend existente é Next.js App Router. Eu não quero forkar o layout por persona. Quero **um único layout** que lê o contexto do aluno e decide o que renderizar — via server component que recebe `{lesson, user_context}` e aplica overrides. Sem "if zerado then ComponentX else ComponentY" espalhado. Um **reducer puro** de overrides.

**O que preciso dos outros:**
- **Database**: tabela `lesson_personalizations` conforme acima. E uma view materializada `resolved_lesson_for_user` que já aplica os overrides pelo contexto corrente do aluno — não quero resolver isso no front a cada render.
- **Backend Dev**: endpoint (ou server action) `getLessonFor(userId, lessonId)` que retorna a lesson já resolvida. Quero chamar um só lugar.
- **Frontend Dev**: ele já own Platform UI. Precisamos combinar onde termina Platform UI e começa Lesson Experience. Minha linha: Platform UI = chrome (nav, sidebar, header); Lesson Experience = tudo dentro do frame da lesson (player, conteúdo, exercícios, próximos passos, célula atual do cubo).
- **Arquiteto**: precisa decidir se "overrides por célula" é conteúdo autoral (cada célula do cubo tem autor) ou gerado (regras deterministas aplicadas sobre um conteúdo base). Dois mundos muito diferentes pra UI.

**Risco crítico:**
Explosão combinatória. 6 estágios × 3 personas × 3 camadas = 54 células. Se a doutrina exigir conteúdo autoral pra cada célula, Nucleo 01 morre e a plataforma nunca lança. Eu preciso que a Fase 1 defina um **subconjunto mínimo de células** (proposta: só Estágios 1–3, só 2 personas — Zerado e Autodidata — e só 2 camadas — Técnica e Lógica = 12 células) pra gente validar a mecânica antes de explodir pras 54.

---

## Topic 3: Progressão CBE

**Minha posição (Lesson Experience):**
O Charter (§2.1) é claríssimo: **avanço por evidência demonstrável, não por tempo**. Isso tem consequência brutal pra UI: **o conceito de "próxima aula" morre.** Não existe mais "próxima aula" — existe "próxima competência não demonstrada".

Proposta de redesign do dashboard da trilha:
- Acima da dobra: NÃO é uma lista de aulas. É um **grafo de competências** da trilha, com cada nó colorido por status (`not_started`, `in_progress`, `evidence_pending_review`, `demonstrated`). Aulas são meios, não unidades de navegação.
- O aluno clica numa competência e vê as lessons que a ensinam (pode ser 1, pode ser 3). Ele escolhe por onde entra.
- O botão primário da lesson NÃO é "Marcar como concluída". É **"Enviar evidência"** — que pode ser: quiz passado, link de projeto, vídeo curto, screenshot de fluxo n8n funcionando, transcript de conversa com agente. Quem decide o tipo de evidência: Assessment Engine (Nucleo 02).
- "Progress = 60%" vira "Você demonstrou 6 de 10 competências desta trilha". Número diferente, mentalidade diferente.

Pra personas:
- **Zerado**: vê o grafo mas com caminho sugerido destacado (setinha "comece aqui"). Overlay de guidance.
- **Autodidata**: vê o grafo cru, sem caminho sugerido, com atalhos pra "enviar evidência sem assistir a aula" (skip-and-prove).
- **Organizado**: vê o grafo + timeline linear + campo de anotações persistente ao lado.

**O que preciso dos outros:**
- **Database**: `user_competency_progress` já previsto no Charter §4.2 — ótimo. Preciso também de `competency_dependencies (competency_id, depends_on_id)` pra renderizar o grafo com arestas corretas. E `evidence_submissions (id, user_id, competency_id, type, payload_jsonb, status, reviewed_by, reviewed_at)`.
- **Nucleo 02 (Assessment Engine)**: precisa definir, pra cada competência, quais tipos de evidência são aceitos. Sem esse catálogo eu não consigo renderizar o botão "Enviar evidência" — ele vira um formulário genérico inútil.
- **Backend Dev**: endpoint que retorna "grafo de competências da trilha X para usuário Y com status". Quero não montar isso no front.
- **QA Review**: E2E do fluxo "enviar evidência → review → competência marcada como demonstrada → próxima competência destrava" — esse é o fluxo mais importante da plataforma inteira. Se ele falhar o sistema é mentira.

**Risco crítico:**
O aluno submeter evidência e ela ficar parada em review por 3 dias. O Charter não fala de SLA de revisão. Se a review humana é o gargalo, CBE vira "espere a revisão" — pior que o modelo atual de "assista a aula". Eu preciso que Backend Dev + Nucleo 02 definam um pipeline onde **agentes fazem a primeira revisão em segundos** e humanos só validam o que agente aprovou com baixa confiança. Sem isso, a UX de CBE é insustentável.

---

## Topic 4: Personalização Cubo 3D

**Minha posição (Lesson Experience):**
Este é o tópico onde eu mais posso mentir pra mim mesmo. Vou ser direto: **personalização real exige ou autoria cara ou regras determinísticas baratas**. Escolher uma das duas é a decisão mais importante da Fase 1.

Minha proposta é **híbrida em camadas**:
1. **Camada determinística (grátis)** — regras que qualquer lesson ganha de graça:
   - Persona Zerado → fontes maiores, parágrafos menores, glossário inline automático, TTS button visível, velocidade de vídeo default 0.9x.
   - Persona Autodidata → sumário no topo, atalhos de teclado, "pular para" em cada seção, velocidade default 1.25x, botão "skip-and-prove" ao lado do vídeo.
   - Persona Organizado → painel lateral de anotações sempre aberto, exercícios inline entre seções, checkpoint a cada 5 min.
   - Estágio 1–2 → linguagem "vamos", celebrações visuais em microvitórias, suporte humano sempre visível.
   - Estágio 3–6 → linguagem "você", foco em outcome monetário, CTA pra próxima ação de negócio ("precifique isto", "proponha isto a um cliente").
   - Camada Técnica → muito screenshot, passo-a-passo numerado, "clique aqui" literal.
   - Camada Lógica → diagramas, "por que" explícito, quase nenhum clique-a-clique.
   - Camada Maestria → casos reais, dilemas, "qual decisão você tomaria?", menos instrução, mais reflexão.

   Essas regras rodam em TODA lesson mesmo sem conteúdo autoral específico. Isso já diferencia visivelmente a experiência entre células do cubo.

2. **Camada autoral (cara)** — overrides opcionais em `lesson_personalizations`. Nucleo 01 pode criar uma versão específica do conteúdo pra (Estágio 4, Autodidata, Lógica) se aquela célula for estratégica. Mas NÃO é obrigatório. Fallback = camada determinística.

3. **Camada de roteamento** — quando há múltiplas lessons que ensinam a mesma competência, o router escolhe a lesson mais próxima da célula atual do aluno. Essa é a função do sub-epic 12 (Personalization Router, Shell #3).

**O que preciso dos outros:**
- **Shell #3 (Personalization Router)**: quero conversar muito cedo. As regras determinísticas da camada 1 são minhas. O roteamento entre lessons alternativas é dele. Preciso que a gente concorde onde termina uma e começa a outra.
- **Arquiteto**: precisa dizer quais células do cubo são obrigatórias na Fase 1 (proposta: 12 células como dito em Topic 2).
- **Database**: `user.current_persona`, `user.current_stage`, `user.current_layer_preference` (três colunas, não uma coluna JSON) pra eu poder ler rápido.
- **Frontend Dev**: precisamos definir se o reducer de overrides roda no server (minha preferência, mais rápido) ou no client (mais flexível pra preview ao vivo).

**Risco crítico:**
**Personalização-teatro**: a plataforma parece personalizada porque o badge é diferente, mas o conteúdo real é o mesmo. O aluno nota em 2 aulas. Depois perde confiança em TODO sinal de personalização — inclusive os que são reais. Mitigação: antes de lançar, rodar um teste cego — pegar 2 alunos de células extremas (Zerado/Estágio 1/Técnica vs Autodidata/Estágio 4/Maestria) na mesma lesson base e ver se eles descrevem a experiência de formas diferentes. Se descreverem igual, a personalização é teatro e precisa voltar pra prancheta.

---

## Topic 5: Skills educacionais eficientes

**Minha posição (Lesson Experience):**
A doutrina (§4.6) diz que skills atômicas como `backward-design`, `bloom-calibrator`, `tres-camadas-maestria`, `learner-personas` serão criadas em fases posteriores. Ok. Mas do meu lado (Lesson Experience) eu preciso de skills específicas que ainda não estão na lista:

1. **`lesson-layout-calibrator`** — dada uma célula do cubo `(estágio, persona, camada)` e um conteúdo bruto, retorna o layout recomendado (seções visíveis, ordem, CTAs, scaffolding). É a codificação da "camada determinística" do Topic 4. Sem essa skill, a regra vira código mágico espalhado em componentes React.
2. **`evidence-ui-picker`** — dada uma competência e o tipo de evidência aceito, retorna o componente de submissão correto (quiz form / file upload / url input / video recorder / chat transcript). Plugável conforme Nucleo 02 adicione tipos.
3. **`cognitive-load-auditor`** — recebe uma lesson renderizada e audita carga cognitiva (Sweller, §2.1): conta elementos na tela, mede densidade textual, detecta ruído extrínseco. Bloqueia publicação se exceder threshold por persona (Zerado tolera menos que Autodidata).
4. **`microcopy-persona-tuner`** — dado um texto cru e uma persona, retorna o texto recalibrado (tom, comprimento, vocabulário). Sem isso, a diferenciação por persona vira "trocar 'você' por 'vamos'" manual, inescalável.

Todas essas skills rodam preferencialmente **no tempo de build** (quando a lesson é compilada pra uma célula) e não no tempo de request. Cacheáveis.

**O que preciso dos outros:**
- **Nucleo 01 + Nucleo 02**: parceria pra definir o contrato de input/output de cada skill. Elas são consumidas por eles também.
- **Arquiteto**: alinhar que essas skills entram no mesmo catálogo das outras `*` marcadas no Charter §4.6 (`backward-design`, etc.) — não quero um catálogo separado.
- **Scrum Master**: priorização. Das 4, a única bloqueante pra Fase 1 é a #1 (`lesson-layout-calibrator`). As outras 3 podem vir em Fase 2.

**Risco crítico:**
Eficiência cair em **premature abstraction**. Se eu construir `lesson-layout-calibrator` antes de ter 5 lessons reais rodando na plataforma, vou calibrar pro ar. Mitigação: primeiro hardcodar as regras em 3 lessons de exemplo, operar por 2 semanas, extrair o padrão observado, só então virar skill. Regra: nenhuma dessas skills nasce sem 3 exemplos que a justificaram.

---

## Topic 6: Skills de programação atreladas à metodologia

**Minha posição (Lesson Experience):**
Tem duas leituras possíveis deste tópico. Eu vou defender a que me cabe: **skills de programação que o aluno usa, mediadas pela UI da lesson**. (A outra leitura — skills de programação que nós agentes usamos pra construir a plataforma — é preocupação do Arquiteto/Backend.)

As trilhas do AutomatikLabs não ensinam Python do zero. Ensinam **ferramentas de automação** (n8n, Make, MiniChat, Z-API) e **lógica de agentes** (prompts, contexto, tool use, RAG). Cada uma dessas tem um "runtime" que precisa aparecer na lesson:

1. **n8n workflow embedded** — o aluno vê o JSON do workflow ensinado E tem um botão "importar pro meu n8n". Não "copiar e colar no seu canto". **Um clique = running.** Se eu não entregar isso, a camada Técnica morre na fricção de instalação.
2. **Prompt playground inline** — nas aulas de Treinamento de Agentes (Pilar 2), o aluno vê o prompt, edita, roda contra um modelo mockado/real, vê a resposta. No corpo da lesson, não em outra aba.
3. **Conversation simulator** — nas aulas de Script de Vendas (7 Passos), o aluno conversa com um bot treinado no script pra praticar cada passo. Evidência do passo = transcript avaliado.
4. **Flow diagram builder** — nas aulas da camada Lógica, o aluno desenha o fluxo (drag-drop nós) antes de implementar. A evidência da camada Lógica é o diagrama, não o n8n rodando.

Cada um desses runtimes é um componente pesado. Eu não vou construir 4 runtimes na Fase 1. Minha aposta: **n8n embed é o ROI mais alto** — destrava a camada Técnica inteira. Os outros vêm depois.

**O que preciso dos outros:**
- **Backend Dev**: proxy seguro pra API do n8n do aluno (OAuth ou API key por usuário). Sem expor credenciais no front.
- **Security (Tier & RLS)**: política clara — o prompt playground custa tokens, não pode virar canal grátis pra um aluno roteiro sair batendo a API. Rate limit por tier de assinatura.
- **Nucleo 01**: precisa produzir aulas **sabendo que o runtime existe**. Não adianta eu construir o n8n embed se as lessons mandam "abra seu n8n no navegador" no roteiro.

**Risco crítico:**
Construir runtime incrível numa aula que o aluno não vai precisar. Eu quero começar pelo n8n embed só depois de validar (com Scrum Master e Master Maestro) que a primeira Formação a lançar é de fato de automação em n8n. Se for de Multi-Agente primeiro, o n8n embed é esforço errado.

---

## Topic 7: Coordenação multi-professor

**Minha posição (Lesson Experience):**
Aluno vê "uma plataforma". Nós vemos "12 terminais owning áreas distintas". A coordenação multi-professor não é problema só de Scrum Master — é problema de UX. Três sintomas que eu vou receber na tela se a coordenação falhar:

1. **Tom de voz inconsistente** entre lessons de trilhas diferentes — aluno percebe que está com "outro professor" e perde confiança.
2. **Conflito de doutrina visível** — uma lesson ensina "sempre comece pelo Pilar 1" e outra ensina "dá pra pular pro Pilar 3". Aluno trava.
3. **Linguagem metodológica divergente** — uma trilha chama de "agente humanizado", outra de "bot", outra de "assistente virtual". O vocabulário é o Charter Part VIII e EU vou brigar por isso.

Minhas propostas concretas:
- **Style guide único no repo** (`docs/educational-system/style-guide.md`) que TODA lesson segue. Não é opcional. Contém: vocabulário canônico, tom por estágio, tom por persona, do's e don'ts, exemplos anotados. Eu escrevo o primeiro draft na Fase 1.
- **Linter pedagógico** (skill `lesson-content-linter`) que roda em CI sobre qualquer lesson commitada. Checa: vocabulário proibido (ex: "bot" em vez de "agente"), referências a metodologia sem badge, objetivo Bloom faltando, tom inconsistente com estágio declarado. Fail = PR bloqueada.
- **Revisão cruzada obrigatória**: cada lesson produzida por Nucleo 01 é revisada por mim (Lesson Experience) do ponto de vista de UX da leitura, antes de ir pra Pedagogical QA. Duas revisões, dois focos: eu garanto que a lesson **se lê bem** na célula do cubo declarada; QA garante que ela **avalia bem**. Não misturar.
- **Sticky note compartilhada no Maestri** com "decisões visuais em vigor" — toda vez que um terminal muda algo visível (ex: mudou nome de feature, mudou cor de badge, mudou padrão de CTA), atualiza a nota. É a memória curta compartilhada.

**O que preciso dos outros:**
- **Scrum Master**: é o dono do pipeline de produção de lessons. Precisa encaixar minha revisão cruzada como gate obrigatório no fluxo dele. Sem isso minha revisão vira opcional e some.
- **Arquiteto**: precisa validar o vocabulário canônico e bater o martelo. Vocabulário vira doutrina.
- **QA Review**: linha clara entre o que é meu review (leitura/UX) e o review dele (avaliação/rigor pedagógico). Sem ambiguidade.
- **Nucleo 01 e Nucleo 02**: precisam aceitar que o style guide os constrange. Vai doer — criatividade cabe dentro do guide, não contra ele.

**Risco crítico:**
O risco mais real é **eu virar gargalo**. Se toda lesson passar por mim e eu for 1 pessoa/1 terminal, o pipeline trava. Mitigação: o linter pedagógico precisa pegar 80% dos problemas automaticamente, pra minha revisão humana ser só os 20% sutis. Se o linter não ficar bom cedo, eu viro o chokepoint e a Fase 1 atrasa por minha causa. Isso é inaceitável — a plataforma precisa escalar sem mim.

---

**DONE.**
