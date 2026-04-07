# Round 1 — Pedagogical QA

**Role:** Quality Gate owner. I audit pautas/aulas against the Charter (Bloom, CBE, Cognitive Load, Backward Design, Kolb, Kirkpatrick). I own `pedagogical_reviews` (Charter Part IV §4.4) — nothing publishes without an approved row from me.

**My core fear:** that "good lesson" becomes a 200-item checklist that kills authorial voice and pushes Núcleo 01/02 into defensive, formulaic writing. The gate must be *strict on outcomes, loose on style*.

---

## Topic 1: Metodologias

**Minha posição (Pedagogical QA):**
The 6 frameworks in Charter §2.1 are non-negotiable, but they are not equally enforceable. I rank them by what I can actually gate on:

1. **Bloom + Backward Design** — HARD GATE. Every lesson PR must declare `bloom_target` and `competencies_taught` in Story frontmatter. I auto-reject if missing. Aulas que culminam em Bloom 1-2 ("lembrar/entender") só passam se forem explicitamente marcadas como `scaffolding` dentro de um módulo cujo final atinge 5-6.
2. **CBE** — HARD GATE via `lesson_competencies` rows. Se a lesson não cria pelo menos uma evidência verificável (entrega, projeto, screenshot de fluxo n8n rodando), volta. "Quiz de múltipla escolha" não conta como evidência exceto para Bloom 1-2.
3. **Cognitive Load** — SOFT GATE com red flags automatizáveis: aula >18min sem pausa Kolb, >7 conceitos novos no markdown, >3 ferramentas introduzidas simultaneamente. Não rejeito automático — flago para review humana.
4. **Kolb** — SOFT GATE estrutural: cada aula deve ter os 4 momentos *visíveis* (experiência → reflexão → conceito → experimentação) OU declarar qual momento ela cobre dentro de uma sequência maior. Aceito sequências fragmentadas, recuso aulas que pretendem ser standalone sem o ciclo.
5. **Kirkpatrick** — não é gate de aula, é gate de **trilha**. Toda track deve declarar como vai medir nível 3 (comportamento) e nível 4 (renda). Sem isso, a track inteira fica `is_published=false`.

**Operacional:** crio uma skill `pedagogical-gate-rubric` com 12-15 critérios objetivos (não 100). O valor está na *aplicação consistente*, não na granularidade.

**O que preciso dos outros:**
- **Arquiteto**: Story templates de Instructional Design já com `bloom_target`, `competencies_taught`, `kolb_stage`, `cognitive_load_estimate` como campos obrigatórios na frontmatter. Sem isso, eu não consigo gatear — viro bottleneck humano.
- **Database**: além das tabelas do §4.2, preciso de `pedagogical_review_criteria (review_id, criterion_slug, status, note)` — uma review aprovada não é booleano, é uma matriz. Permite analytics: "qual critério mais reprova?".
- **Backend Dev**: hook que bloqueia `UPDATE lessons SET is_published=true` se não houver `pedagogical_reviews.status='approved'`. Trigger SQL, não lógica de aplicação — defesa em profundidade.
- **Núcleo 01**: aceitar que o gate é sobre *estrutura pedagógica*, não sobre estilo de escrita. Vou defender voz autoral até a morte.
- **Núcleo 02**: assessments precisam declarar qual nível Bloom estão medindo. Quiz de Bloom 1 não pode validar competência de Bloom 5.

**Risco crítico:**
A doutrina é robusta no papel mas o sistema todo depende de **Bloom calibration confiável**. Se Núcleo 01 marcar tudo como "Bloom 5: Avaliar" para passar no gate, o sistema vira teatro. Mitigação: revisão cruzada — toda lesson marcada Bloom 5-6 precisa de `reviewer_type='human'` obrigatório. Bloom 1-4 pode passar com `reviewer_type='agent'`. Inverte o incentivo: marcar alto = mais fricção.

---

## Topic 2: Arquitetura

**Minha posição (Pedagogical QA):**
A decisão do §4.1 (manter `tracks → courses → modules → lessons`, Formação como tag) está correta — adicionar camada hierárquica explodiria custo de manutenção sem ganho pedagógico. Mas essa decisão tem uma consequência que precisa ser explicitada: **a unidade de avaliação Kirkpatrick é a Formação, não a track**. Preciso de uma view `formation_completion` que agrega tracks por tag.

A `pedagogical_reviews` table do §4.4 está bem desenhada mas falta:
- `review_round` (int) — uma lesson pode ter 3 reviews em rounds diferentes (agent → human → re-agent após fix). Sem isso perco rastro de iteração.
- `bloom_assessed` (smallint) — qual Bloom o reviewer *constatou*, não o que o autor *declarou*. Discrepância autor↔reviewer é um sinal forte de calibração ruim.
- `competency_evidence_link` — URL/path da evidência verificada (vídeo do fluxo, screenshot, deploy). Sem isso, "approved" é unfalsifiable.

Sobre workers Python locais (§4.5): concordo, mas minha área precisa de UM worker rodando agendado: `pedagogical-drift-detector` que roda semanalmente, amostra 5% das aulas publicadas, re-roda o rubric e flagga drift. Sem isso, o gate aprova uma vez e nunca mais audita. CBE exige re-validação.

**O que preciso dos outros:**
- **Database**: as 3 colunas extras em `pedagogical_reviews` + view `formation_completion` + view `lesson_review_history` (todos os rounds de review por lesson, ordenado).
- **Backend Dev**: endpoint interno (não exposto) `POST /api/internal/pedagogical-review` que cria a row. Quero que TODA review (agent ou humana) passe por um único caminho — sem inserts diretos no SQL via skill.
- **Arquiteto**: definir o *contrato* da review: o que um agent reviewer recebe (markdown da lesson + frontmatter + competências declaradas) e o que produz (JSON com criterion-by-criterion). Esse contrato é a interface mais crítica do sistema.
- **Scrum Master**: garantir que o board mostra `lessons aguardando review` como coluna explícita. Hoje invisível = bottleneck invisível.
- **Security**: RLS em `pedagogical_reviews` — só QA Review terminal e admins humanos podem inserir/atualizar. Núcleo 01 NÃO pode aprovar a própria lesson.

**Risco crítico:**
Sem o `pedagogical-drift-detector` e sem a coluna `bloom_assessed`, vamos ter um sistema que aprova bem no dia 1 e degrada silenciosamente. Charters bem escritos morrem por falta de telemetria. O risco não é que o gate seja burro — é que ele seja *invisível* depois de aprovar.

---

## Topic 3: Progressão CBE

**Minha posição (Pedagogical QA):**
CBE é a decisão mais radical do Charter (§4.2) e a mais difícil de operacionalizar. Hoje na plataforma "concluiu" = "marcou checkbox no final do vídeo". Mudar isso quebra UX existente. Minha posição:

1. **Dois trilhos paralelos, não substituição.** Mantém `lesson_completions` como sinal fraco (engagement, telemetria) E adiciona `user_competency_progress` como sinal forte (avanço real). Aluno vê os dois separados na UI.
2. **Evidência mínima por nível Bloom**:
   - Bloom 1-2: quiz aprovado (≥80%) OU auto-declaração + check do reviewer
   - Bloom 3-4: entrega de artefato (link, arquivo, screenshot) + review por agent
   - Bloom 5-6: entrega + review por humano + (opcional) peer review
3. **Status da competência é enum estrito**: `not_started → in_progress → submitted → approved | needs_revision`. NÃO aceito booleano.
4. **Expiração**: competências de ferramenta (n8n, MiniChat) expiram em 12 meses se não re-exercitadas. Competências de método (3 Camadas, 3 Cs) não expiram. Isso espelha como skills técnicas decaem na vida real.

**O que preciso dos outros:**
- **Database**: `user_competency_progress` precisa de `evidence_url`, `submitted_at`, `approved_at`, `approved_by`, `expires_at`, `bloom_level_demonstrated` (pode ser ≥ ao bloom_level da competência se o aluno demonstrou além).
- **UI UX Design**: tela de progresso do aluno mostra DOIS eixos: % de aulas vistas (telemetria) e % de competências aprovadas (real). Se forem muito divergentes, é dado pedagógico crítico.
- **Backend Dev**: fila de submissões aguardando review. Aluno submete evidência → entra em fila → agent reviewer ou humano pega. Sem isso, CBE morre por backlog.
- **Núcleo 02**: cada competência precisa de um *prompt de avaliação* — instruções precisas pro agent reviewer julgar a evidência. É a parte mais difícil do Núcleo 02 e precisa começar cedo.
- **Arquiteto**: catálogo inicial de competências. 50-80 competências bem definidas valem mais que 500 vagas. Quero participar do design desse catálogo — sou eu que vou ter que verificá-las.

**Risco crítico:**
CBE morre por **backlog de avaliação**. Se aluno submete evidência e demora 5 dias pra alguém revisar, ele desiste e a doutrina vira ficção. Mitigação dupla: (a) agent reviewers fazem o primeiro pass em <1h, (b) SLA explícito por nível Bloom (Bloom 1-3 = agent automático, 4-6 = humano em ≤72h). Sem SLA escrito, CBE não escala.

---

## Topic 4: Personalização Cubo 3D

**Minha posição (Pedagogical QA):**
6 estágios × 3 personas × 3 camadas = **54 células**. Escrever 54 versões de cada lição é suicídio. A personalização tem que vir de **3 mecanismos compostos**, não de 54 conteúdos paralelos:

1. **Conteúdo canônico único por competência** + **3 wrappers de persona** (Zerado/Autodidata/Organizado). O wrapper muda: ritmo de apresentação, presença de checkpoints, ordem (autodidata pula para Lógica direto). NÃO muda a competência alvo.
2. **Filtro de estágio**: cada lição declara `min_stage` e `max_stage`. Aluno em estágio 2 não vê lições marcadas `min_stage: 4`. Não é "personalização", é *gating*.
3. **Camada como profundidade opcional**: cada competência pode ter 3 níveis de profundidade (Técnica/Lógica/Maestria) implementados como **lições adicionais** que aprofundam, não como reescritas. Aluno completa Técnica para liberar Lógica.

Isso reduz 54 células para: N competências × 3 wrappers + filtros = manutenção viável.

**Posição dura:** **rejeito qualquer proposta que exija escrever conteúdo separado para cada célula do cubo.** É a morte do sistema. A doutrina dos wrappers é o único caminho pedagogicamente honesto E operacionalmente sustentável.

**O que preciso dos outros:**
- **Arquiteto**: definir o *contrato* do wrapper de persona. O que um wrapper Zerado adiciona/remove vs Autodidata? Precisa ser regra explícita, não vibes.
- **Database**: `lessons.min_stage`, `lessons.max_stage`, `lessons.maestria_layer` (enum), `lessons.persona_variant_of` (FK self-ref para apontar a versão canônica). Variante aponta pro canônico — nunca duplicação cega.
- **Frontend Dev / UI UX Design**: router de personalização que escolhe a variante certa em runtime baseado no `user_journey_history` mais recente. Lazy: só busca a variante se ela existir, fallback pro canônico.
- **Shell #3 (Personalization Router proposed)**: este terminal é crítico e ainda não tem owner confirmado. Defendo a aprovação do sub-epic 12 — sem ele, o cubo é poesia.
- **Backend Dev**: API que retorna `next_lesson_for(user_id)` aplicando os 3 mecanismos. Centraliza a lógica de personalização — não espalha pelo frontend.

**Risco crítico:**
A tentação de transformar o cubo num matrix de conteúdo único é enorme e atende a todo product manager que quer "experiência hyperpersonalizada". Vai destruir o sistema. Preciso que o Charter ou o sub-epic 04 explicitem por escrito: **"variantes são wrappers, não rewrites"**. Sem essa frase escrita, cada terminal vai reinterpretar.

---

## Topic 5: Skills educacionais eficientes

**Minha posição (Pedagogical QA):**
Charter §4.6 prevê skills atômicas (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`...). Nenhuma existe ainda. Minha priorização do que escrever primeiro, ordenada por *retorno por hora investida*:

1. **`bloom-calibrator`** (P0) — recebe um objetivo de aula em linguagem natural, devolve nível Bloom + verbos sugeridos + red flags. Resolve 60% dos meus reviews automaticamente. Sem isso, viro gargalo.
2. **`pedagogical-gate-rubric`** (P0) — minha skill, dona dos 12-15 critérios. Outros terminais invocam pra auto-checar antes de submeter pra review.
3. **`backward-design`** (P1) — guia o Arquiteto a montar tracks de trás pra frente. Output: skeleton de track com competência final, evidência, módulos.
4. **`competency-evidence-validator`** (P1) — recebe evidência submetida pelo aluno + descrição da competência, devolve approve/reject + feedback. Coração do CBE.
5. **`cognitive-load-estimator`** (P2) — analisa um markdown de lesson e estima carga (intrínseca, extrínseca, germana). Heurística simples bate 80% de uma análise humana.
6. **`tres-camadas-maestria`** / **`empresa-ia-humanizada`** (P2) — formalizam metodologias proprietárias. Importantes mas menos urgentes que os gates.

**Princípio das skills eficientes**: cada skill ≤200 linhas, faz UMA coisa, retorna JSON estruturado quando consumida por outra skill, retorna markdown quando consumida por humano. Skills longas (>500 linhas) viram inertes.

**O que preciso dos outros:**
- **Núcleo 01**: ser o primeiro consumidor real do `bloom-calibrator` e dar feedback brutal. Se a skill é boa pra eles, é boa pro sistema.
- **Arquiteto**: co-design de `backward-design` — é skill dele, mas eu uso pra validar o output dele. Conflito de interesse saudável.
- **Núcleo 02**: o `competency-evidence-validator` é meio meu meio dele. Proponho co-ownership.
- **Backend Dev**: hooks de `pre-commit`/`pre-PR` que rodam `pedagogical-gate-rubric` automaticamente em qualquer markdown sob `lessons/`. Skill como gate, não como sugestão opcional.

**Risco crítico:**
Skills se acumulam e ninguém usa. Mitigação: cada skill nasce com **um caso de uso real e um terminal owner que vai sofrer se ela não funcionar**. Sem owner, a skill não nasce. Mato a tentação de criar skills "for completeness".

---

## Topic 6: Skills de programação atreladas à metodologia

**Minha posição (Pedagogical QA):**
Esse é o tópico onde eu mais brigo com Backend Dev e Arquiteto. As skills de programação (n8n, Python workers, Supabase migrations) **não são neutras pedagogicamente** — elas codificam decisões. Minha posição:

1. **Toda skill de programação que toca conteúdo educacional carrega `automatiklabs-doctrine` como pre-requisito.** Charter §7 já diz isso. Mas quero que seja *verificável*: linter que rejeita skill cujo frontmatter não declara doctrine como dependência.
2. **Skills de programação não devem inventar pedagogia.** Se `senior-backend` precisar tomar uma decisão pedagógica (ex: "como ordenar lições?"), tem que delegar para a doctrine ou abrir issue. NÃO improvisar.
3. **Workers Python (§4.5) precisam de testes pedagógicos**, não só testes unitários. Ex: o `pedagogical-drift-detector` deve ter um suite de "lessons sintéticas conhecidas" (5 boas, 5 ruins) e bater 100% antes de rodar em produção. Sem isso, drift detector é placebo.
4. **Migrations que tocam tabelas pedagógicas (`competencies`, `lesson_competencies`, `pedagogical_reviews`, `user_competency_progress`) exigem review do meu terminal**, não só do Database terminal. Schema é doutrina materializada.

**O que preciso dos outros:**
- **Database / Backend Dev**: aceitar que migrations em tabelas pedagógicas têm dois reviewers obrigatórios (Database + QA Review). Não é desconfiança técnica — é que as colunas codificam pedagogia.
- **Arquiteto**: uma "tabela de tradução" — para cada decisão pedagógica do Charter, qual estrutura técnica a materializa. Ex: "CBE → `user_competency_progress.status` enum estrito". Quando o técnico entender a tradução, para de improvisar.
- **Frontend Dev**: componentes que renderizam progresso do aluno NÃO podem inventar lógica de "% completo". Sempre consomem do backend. Já vi N produtos onde o frontend mente sobre progresso.
- **Scrum Master**: stories técnicas que tocam tabelas pedagógicas devem linkar para a seção do Charter que justifica a mudança. Rastreabilidade.

**Risco crítico:**
Acoplamento pedagogia↔código vira fricção e o time técnico passa a ver minha review como burocracia. Mitigação: minha review de migration pedagógica tem SLA de 4h úteis e rubric público de 6 critérios objetivos (não vibes). Se eu não responder em 4h, passa default approve. Coloco minha cara no SLA — fricção real, não teatro.

---

## Topic 7: Coordenação multi-professor

**Minha posição (Pedagogical QA):**
Múltiplos professores produzindo conteúdo paralelo é onde a doutrina mais sofre. Cada professor traz seu estilo, seu vocabulário, suas analogias preferidas. Isso é **bom** (riqueza autoral) mas vira **caos** sem mecanismos. Minha posição:

1. **Style guide ≠ rubric pedagógico.** Style guide é sobre voz/tom/vocabulário e é *opcional*. Rubric pedagógico é sobre Bloom/CBE/Kolb e é *obrigatório*. Não confundo os dois e não uso minha autoridade pra impor estilo.
2. **Glossário canônico compartilhado** (já existe parcial no Charter Part VIII). Toda formação deve usar os termos canônicos quando se referir a estágio/persona/camada/pilar. Professores podem usar suas próprias analogias *desde que* o termo canônico apareça pelo menos uma vez na lesson.
3. **Co-autoria explícita**: lesson tem `primary_author` E opcionalmente `pedagogical_consultant`. Quando um professor é forte em conteúdo mas fraco em estrutura pedagógica, pareamos com um consultor. Documenta o pareamento — não esconde.
4. **Conflitos de doutrina vão pra Master Maestro**, não pra mim. Eu sou gate de qualidade, não juiz de disputas filosóficas. Se dois professores discordam sobre "n8n é melhor que Make", isso não é meu rol — é decisão de produto.
5. **Calibração inter-rater**: a cada 50 lessons aprovadas, dou amostra de 10 pra um humano sênior re-revisar e medir agreement comigo. Se cair abaixo de 80%, eu sou o problema, não os professores. Auditoria do auditor.

**O que preciso dos outros:**
- **Scrum Master**: onboarding de novo professor inclui sessão "como o gate funciona, o que ele cobra, o que ele NÃO cobra". Reduz medo, reduz fricção.
- **Arquiteto**: um template canônico de lesson markdown com seções nomeadas (`## Objetivo`, `## Pré-requisitos`, `## Experiência (Kolb 1)`, etc.). Reduz variância sem matar voz autoral. Estrutura comum, conteúdo livre.
- **Núcleo 01 / Núcleo 02**: papel claro. Núcleo 01 produz aula, Núcleo 02 produz avaliação da aula. NÃO se sobrepõem. Quem revisa quem é minha responsabilidade.
- **Database**: `lessons.primary_author_id`, `lessons.pedagogical_consultant_id` (nullable), `lessons.style_variant` (enum: didatic/objetivo/storytelling — informativo, não restritivo).
- **UI UX Design**: na própria aula, mostrar autor(es) com foto e bio curta. Dá rosto, dá orgulho, reduz "conteúdo de fábrica".

**Risco crítico:**
O maior risco multi-professor não é divergência de qualidade — é **convergência forçada**. Se o gate for muito apertado em estilo, todo mundo escreve igual e o sistema vira commodity. Mitigação: o rubric tem ZERO critérios sobre tom, vocabulário, formatação visual. Só estrutura pedagógica. Se eu sentir vontade de reprovar uma aula porque "soa estranho", eu tenho que reprovar com base em Bloom/CBE/Kolb ou aprovar. Disciplina pessoal codificada em rubric.

---

## Síntese da posição global da Pedagogical QA

- **Eu sou um gate, não um filtro estético.** Bloom + CBE + Kolb + Cognitive Load. Nada além.
- **Meu poder é defensivo.** Charter §4.4 me dá veto via `pedagogical_reviews`. Uso com parcimônia.
- **Meu maior risco é virar bottleneck.** Mitigação: skills automatizadas (`bloom-calibrator`, `pedagogical-gate-rubric`) fazem 70% do trabalho, eu faço os 30% que exigem julgamento.
- **Meu segundo maior risco é virar invisível.** Mitigação: `pedagogical-drift-detector` rodando semanal + métricas Kirkpatrick visíveis no board.
- **Minha promessa aos outros terminais:** rubric público, SLA escrito, justificativa por critério, sem vibes, sem "achei que ficou estranho".

DONE.
