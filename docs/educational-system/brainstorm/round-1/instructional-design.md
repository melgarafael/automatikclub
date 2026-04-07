# Round 1 — Instructional Design (Arquiteto)

**Role:** Pedagogical Architecture owner. Backward Design é espinha.
**Lente:** como a doutrina do Charter (Parts II–IV) vira decisões executáveis de currículo — competências → módulos → lessons → evidência.

---

## Topic 1: Metodologias educacionais — operacionalizar Bloom + CBE + Cognitive Load + 3 Camadas + Empresa c/ IA Humanizada

**Minha posição (do ângulo de Instructional Design):**
Os frameworks não convivem em paralelo — eles formam uma *pipeline de decisão* dentro do Backward Design. Ordem dura: (1) output mensurável de renda (Kirkpatrick 4) → (2) competência demonstrável (CBE, com `bloom_level` ≥ 5 no topo da trilha) → (3) decomposição em sub-competências calibradas por Bloom 1–6 → (4) cada sub-competência vira lesson(s) com orçamento de carga cognitiva fixo (máx. 3 elementos interativos novos por lesson, Sweller) → (5) cada lesson é rotulada por Camada (Técnica/Lógica/Maestria) e por Pilar (Fluxo/Treinamento/Multi-Agente). Regra operacional: **nenhuma trilha entra no catálogo sem matriz `competência × bloom × camada × pilar` preenchida** — é esse artefato que Nucleo 01/02 consomem, não prosa pedagógica.

**O que eu preciso dos outros:**
Preciso que **Database** exponha `competencies.bloom_level` e `lesson_competencies` já na Fase 1 (sem isso a matriz é só markdown), e que **Backend Dev** garanta que `is_published` cheque existência de pelo menos uma competência vinculada antes de liberar a lesson.

**Risco crítico:**
Se Bloom virar decoração (nível atribuído depois, para "quadrar" a aula já gravada), toda a CBE vira teatro e voltamos a ser curso de horas assistidas.

---

## Topic 2: Arquitetura das soluções — skills/agents/workers + AutomatikLabs sem virar Frankenstein

**Minha posição (do ângulo de Instructional Design):**
A arquitetura tem que refletir a hierarquia pedagógica, não competir com ela. Proposta: **uma skill atômica por framework doutrinário** (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`, `empresa-ia-humanizada`, `cognitive-load-budget`) — todas *referenciadas* pelo loader fino `automatiklabs-doctrine` (Q8=C já decidido). Agents são *perfis de terminal* (Arquiteto, Nucleo 01, QA) que compõem skills; workers Python são *funções puras* que recebem matriz pedagógica e devolvem artefato (roteiro, quiz, rubric). Regra anti-Frankenstein: **skill nunca chama skill**; só agents compõem. E todo worker que gera conteúdo recebe como entrada obrigatória a célula do Cubo 3D (estágio, persona, camada) — se faltar um eixo, aborta.

**O que eu preciso dos outros:**
Preciso do **Scrum Master** segurando a disciplina de que cada nova skill atômica só nasce quando há 3+ usos reais (não especulativa), e do **Backend Dev** definindo o contrato JSON da "célula do Cubo 3D" que vira input padrão dos workers.

**Risco crítico:**
Skills se multiplicando por antecipação (criar `jornada-7-fases` antes de existir uma única trilha que a use) → doutrina se fragmenta, ninguém sabe qual skill carregar, Arquiteto vira bibliotecário.

---

## Topic 3: Progressão dos alunos — avanço por evidência, gates, humano vs IA

**Minha posição (do ângulo de Instructional Design):**
CBE só é real se **gate = evidência artefatual**, não quiz de múltipla escolha. Proposta operacional: cada competência tem um `evidence_type` ∈ {`artifact_upload`, `live_demo`, `quiz_bloom_5plus`, `peer_review`, `revenue_proof`}. Bloom 1–3 podem ser auto-avaliados por quiz + worker IA. Bloom 4 exige worker IA + rubric estruturada. **Bloom 5–6 exigem revisão humana obrigatória** — não negociável, porque "Avaliar" e "Criar" não são verificáveis por LLM sozinho sem risco de slop calibrar slop. Kirkpatrick 4 (renda) tem gate próprio: upload de comprovante/contrato em `user_competency_progress.evidence_url`, fora do fluxo de aulas. Estágios da jornada (1–6) avançam automaticamente quando N competências-chave de cada estágio são marcadas `status=demonstrated` — sem auto-declaração.

**O que eu preciso dos outros:**
**Backend Dev** precisa implementar `pedagogical_reviews` (Q7=A) com `reviewer_type` e bloquear `demonstrated` até haver review humana para Bloom ≥ 5; **QA Review** precisa ser o dono da rubric de revisão humana, não o Arquiteto.

**Risco crítico:**
Se deixarmos LLM aprovar evidência Bloom 5–6 "pra acelerar", viraremos uma fábrica de certificados inflacionados e Kirkpatrick 4 nunca materializa.

---

## Topic 4: Personalização do estudo — cubo 3D Estágio×Persona×Camada virando experiência real

**Minha posição (do ângulo de Instructional Design):**
Personalização NÃO é gerar 54 variantes (6×3×3) de cada aula — isso explode custo e mata consistência. É **um objeto canônico por competência + três eixos de modulação**:
- **Estágio** decide *quais competências aparecem* (router/filtro, não reescrita de conteúdo).
- **Persona** decide *sequenciamento e ritmo*: Zerado recebe pré-requisitos expandidos + checkpoints frequentes; Autodidata recebe TL;DR + pulo direto pra demo; Organizado recebe fluxo Kolb completo (experiência → reflexão → conceito → experimentação).
- **Camada** decide *profundidade de exercícios*: Técnica = replicar, Lógica = adaptar, Maestria = projetar do zero.
O mesmo vídeo-mãe serve as três personas — muda o *wrapper* (intro, exercícios, checkpoints), não o núcleo. Isso é viável; 54 variantes não é.

**O que eu preciso dos outros:**
**UI UX Design** precisa desenhar o "wrapper de lesson" como 3 layouts (Zerado/Autodidata/Organizado) sobre o mesmo vídeo-mãe, e **Shell #3 (Personalization Router)** precisa virar o serviço que lê `user_journey_history` + persona e retorna a lista ordenada de competências/lessons por estágio.

**Risco crítico:**
Se personalização tentar reescrever conteúdo core por persona, o custo de produção vira 3× e a voz do professor vaza — alunos Autodidatas detectam condescendência e evadem.

---

## Topic 5: Skills educacionais eficientes — geração de trilhas/cursos/aulas sem slop

**Minha posição (do ângulo de Instructional Design):**
Skill de geração tem que ser **backward**, não forward. Input proibido: "faça um curso sobre n8n". Input obrigatório: `{outcome_kirkpatrick4, target_competency, bloom_level, stage, persona, camada, pilar}`. Com isso a skill `backward-design` devolve uma **árvore de competências** (não uma lista de aulas); só então `bloom-calibrator` valida que cada nó bate com o nível declarado; só então `cognitive-load-budget` fatia em lessons respeitando o orçamento; só então `empresa-ia-humanizada` ou `tres-camadas-maestria` enriquece com o ângulo do pilar/camada. **Nunca geramos aula solta** — geramos sempre a árvore inteira, porque slop nasce de decidir conteúdo antes de decidir evidência. Anti-slop hard check: toda lesson gerada deve produzir `acceptance_criteria` testáveis (igual Story format, Part VI) — se o worker não consegue escrever critério, a lesson é rejeitada.

**O que eu preciso dos outros:**
**Nucleo 01** precisa aceitar que input é matriz pedagógica, não briefing livre, e **Nucleo 02** precisa gerar o quiz/rubric *ao mesmo tempo* que a lesson (não depois) — senão Bloom vira pós-rotulagem.

**Risco crítico:**
Geração forward ("me faça uma aula sobre X") reintroduz conteúdo sem competência declarada — exatamente o anti-padrão do Charter §1.3.

---

## Topic 6: Skills de programação atreladas à metodologia — código pra área de membros respeitando o método

**Minha posição (do ângulo de Instructional Design):**
O código da plataforma é *infraestrutura da doutrina*, não neutro. Três invariantes que a Platform UI e o Backend DEVEM refletir:
1. **A UI nunca mostra "% concluído por tempo"** — mostra "X/Y competências demonstradas" (CBE). Barra de progresso por tempo é banida do design system.
2. **O roteador de conteúdo sempre filtra por célula do Cubo 3D** — não existe rota `/lessons/:id` sem contexto de persona/estágio; a lesson renderiza o wrapper correto.
3. **Todo componente de "próxima aula" consulta `user_competency_progress`, não `last_watched_at`** — o "continue de onde parou" é pedagógico, não cronológico.
Estas invariantes viram testes E2E obrigatórios (QA Review) — se algum PR quebra uma delas, é bloqueio automático.

**O que eu preciso dos outros:**
**Frontend Dev** (Platform UI) precisa aceitar essas 3 invariantes como restrições de design system desde a Fase 1; **Security** precisa que RLS permita ao aluno ver só as competências/lessons da sua célula atual do cubo (não catálogo inteiro).

**Risco crítico:**
Se a UI reintroduzir "% assistido" por conveniência visual, os alunos voltam a otimizar para tempo de vídeo e Kirkpatrick 4 morre silenciosamente — ninguém percebe por meses.

---

## Topic 7: Coordenação multi-professor — consistência sem matar voz dos professores

**Minha posição (do ângulo de Instructional Design):**
Consistência mora na **matriz pedagógica** (competência, Bloom, camada, pilar, evidência); voz do professor mora no **vídeo-mãe + narrativa**. Separação dura: o Arquiteto + Nucleo 01 entregam ao professor um *briefing pedagógico estruturado* (o que o aluno tem que *demonstrar* ao fim, qual Bloom, qual carga cognitiva disponível, qual célula do cubo) — o professor decide *como conta a história*. Revisão pedagógica (`pedagogical_reviews`) só checa: (a) a aula entrega a competência declarada? (b) respeita o orçamento de carga? (c) a evidência é coletável? Nunca checa estilo, sotaque, ritmo, piada. Professores têm liberdade total de forma e zero de escopo. Resultado: mesma trilha pode ter 3 professores com vozes distintas, todos entregando a mesma competência mensurável.

**O que eu preciso dos outros:**
**Scrum Master** (Curriculum Orchestration) precisa ser o guardião do briefing estruturado — ninguém grava nada sem briefing assinado; **QA Review** precisa separar claramente rubric pedagógica (bloqueante) de feedback de estilo (sugestão).

**Risco crítico:**
Se revisão pedagógica contaminar feedback de estilo, professores bons evadem do sistema e sobram os que "seguem o script" — voz morre, conteúdo fica plano, churn sobe.

---

*Fim da posição Round 1 — Arquiteto (Instructional Design). Próximo passo: Round 2 cross-review das posições dos outros 7 terminais.*
