# Round 2 — lesson-experience reaction

**Terminal:** UI UX Design (Lesson Experience)
**Lente:** li os 6 outros. Estou procurando onde a UX é reforçada, onde ela vai ser traída, e onde ninguém pensou no aluno às 22h no celular.

---

## Pontos de acordo (que reforço)

- **Database (Schema Extensions):** *"Matar `auto_complete_lesson` ou o CBE é teatro. Trigger de publicação exigindo review humana aprovada ou a doctrine é decoração."* — Essas duas linhas vermelhas são exatamente o que minha dashboard de "grafo de competências" (Round 1, Topic 3) exige pra não mentir. Minha extensão: se o trigger de matar `auto_complete_lesson` não entrar na migração 00015, eu preciso de **feature flag no frontend** pra esconder a barra de % assistido mesmo antes do backend corrigir — senão o aluno vê dois números brigando. E reforço o pedido dela por um índice em `user_journey_history(user_id, changed_at DESC)`: minha tela "onde você estava há 30 dias" depende disso.

- **QA Review (Pedagogical QA):** *"rejeito qualquer proposta que exija escrever conteúdo separado para cada célula do cubo. Variantes são wrappers, não rewrites."* — Isto é o contra-ponto que eu precisava ouvir. Meu Round 1 Topic 4 já previa camada determinística + camada autoral, mas QA Review formaliza a regra como doutrina ("3 wrappers + filtros"). Minha extensão: vou escrever o **contrato do wrapper** como componente React tipado — `<PersonaWrapper persona="zerado|autodidata|organizado">` com slots fixos (intro, pace, checkpoints, CTAs). Se não couber no contrato, rejeitamos juntos. Isso encaixa também com a proposta do Arquiteto de "mesmo vídeo-mãe, 3 layouts".

- **Nucleo 01 (Content Production):** *"spine canônico + 3 transformers por eixo + validador pós-transformação que mede densidade de conceitos/min, checkpoints, analogias, warnings."* — Isto é o **missing link** entre a minha "camada determinística" e a autoria. Minha extensão: as métricas pós-transformação da Nucleo 01 viram **props que o PersonaWrapper lê** e usa pra decidir densidade visual (ex: Zerado com density>X ganha spacer vertical automático). A rubrica dela é o meu design token de runtime.

- **Backend Dev (Pedagogical Workflow):** *"VIEW `user_unlocked_lessons` é computada on-read, não cache. Expor o motivo do bloqueio, não só o boolean."* — Isto resolve meu pedido do Round 1 ("quero um endpoint que retorne o grafo resolvido"). Minha extensão: preciso que o motivo do bloqueio venha como `{blocked_by: competency_id, reason_human: string, next_action: 'submit_evidence'|'watch_lesson'|'wait_review'}` — três enums, porque cada um dispara uma UI diferente (botão azul, botão cinza, spinner). Sem o enum, eu improviso no front e a mensagem vira inconsistente por tela.

- **Assessment Engine (Nucleo 02):** *"mesma competência, assessment variante por persona; competência é constante, assessment é variante"* + tabela com 5 tipos de evidence (`json_workflow|video|url|file|text`). — Isto destrava minha proposta de `evidence-ui-picker` (Round 1, Topic 5). Minha extensão: eu construo **um componente único `<EvidenceSubmitter evidenceKind={kind} assessmentId={id}>`** que adapta o input ao kind. Nucleo 02 não precisa desenhar 5 telas — desenha 1 e eu especializo por kind. Proponho co-ownership desse componente.

---

## Pontos de discordância ou refinamento

- **Arquiteto (Instructional Design):** *"Persona decide sequenciamento e ritmo; o mesmo vídeo-mãe serve as três personas — muda o wrapper (intro, exercícios, checkpoints), não o núcleo."* — **Minha objeção:** concordo em teoria, mas "o mesmo vídeo-mãe" é perigoso na prática. Um vídeo gravado no ritmo do Organizado é **lento demais** para o Autodidata e **rápido demais** para o Zerado. Autodidata abandona em 2min, Zerado não acompanha. **Minha proposta concreta:** o vídeo-mãe vem em **chapters/capítulos marcados** (ex: `chapters: [{start, end, kind: 'context'|'concept'|'demo'|'practice'|'synthesis'}]`). O wrapper Autodidata **auto-pula** os chapters `context` + adiciona velocidade 1.25x default. O wrapper Zerado **repete** o chapter `concept` com legenda ampliada e pausa obrigatória. Mesma fita, três trilhas de reprodução diferentes. Preciso que Nucleo 01 produza vídeos com chapter marks desde o dia 1 — ou o wrapper é teatro.

- **Database (Schema Extensions):** *coluna única `lessons.variant_stage/variant_persona/variant_layer`* — **Minha objeção:** isso força uma lesson a pertencer a UMA célula. A Nucleo 01 (Round 1) propõe tabela separada `lesson_variants (lesson_id, stage, persona, layer, script_md)` e **essa é a forma certa**. O modelo de colunas na própria `lessons` cria ou duplicação (54 rows de lessons pra mesma aula) ou fallback implícito (NULL = "serve todos") — e o fallback NULL não é renderizável no front sem regra extra. **Minha proposta:** adotar `lesson_variants` conforme Nucleo 01 + um campo `lessons.canonical_variant_id` apontando pro spine. Frontend sempre consulta `resolve_variant(lesson_id, user_context)` via RPC, nunca lê colunas diretas. Aliar-se com Nucleo 01 nessa briga.

- **Backend Dev (Pedagogical Workflow):** *"fallback hierárquico quando a célula exata não existe: exato → afrouxa camada → afrouxa persona → afrouxa stage"* — **Minha objeção:** essa ordem de fallback está errada pro aluno. Se eu sou Zerado/Estágio 1/Técnica e não existe minha célula, **afrouxar persona primeiro** me joga num conteúdo de Autodidata — que é o pior lugar pra um Zerado cair (texto denso, sem scaffolding). **Minha proposta:** a ordem de fallback preserva **persona** como invariante mais forte. Ordem correta: `(stage, persona, layer)` exato → `(stage±1, persona, layer)` → `(stage, persona, layer adjacente)` → **só em último caso** relaxa persona. Persona é a dimensão que mais afeta abandono. Isso precisa ser decisão explícita na `resolve_variant()` SQL function, não heurística.

---

## Lacunas que ninguém cobriu

- **Mobile.** Nenhum dos 6 peers mencionou que o aluno vai abrir isso no celular. O grafo de competências (minha proposta) e o stepper de 7 Passos e o painel de anotações do Organizado **não cabem** numa viewport de 375px sem redesign dedicado. Do meu domínio: mobile-first não é opcional — a maioria dos alunos brasileiros de estágio 1-2 acessa primeiro pelo celular. Se a gente desenhar tudo pra desktop primeiro, mobile vira afterthought quebrado. Preciso incluir isto como constraint dura no sub-epic 06.

- **Latência percebida.** Nucleo 02 quer agent-reviewer em <1h, QA fala em SLA de 72h pra Bloom 5-6, mas ninguém falou do caso **"aluno acabou de submeter evidência e está olhando pra tela agora"**. O que ele vê nos próximos 30 segundos? Um spinner? Uma tela de "seu trabalho está sendo avaliado, volte em X horas"? Um feedback parcial do agent? Isso muda completamente a UX de CBE. Minha proposta: todo submit dispara um agent-reviewer em streaming, com resposta parcial em <5s ("recebi, vejo que você mandou um JSON de workflow, estou verificando N nodes..."). Se não houver essa camada de feedback imediato, CBE sente frio.

- **Estado emocional do aluno que FALHA evidência.** Backend Dev falou de `needs_revision` + `remediation_task` com `feedback_md` obrigatório. Mas ninguém falou de **como isso é comunicado** sem desmotivar um Zerado/Estágio 1. A diferença entre "Rejeitado. Falta X, Y, Z" e "Quase lá. Ajuste X e envie de novo — você está no caminho certo" é a diferença entre churn e retenção nesse estágio. Preciso definir **tons de rejeição por persona** como design token.

- **O que o aluno vê quando não existe variante da célula dele.** Nucleo 01 propõe gerar só as células prioritárias. Backend Dev propõe fallback. Mas a UI do "fallback" precisa ser honesta: *"esta aula ainda não foi adaptada pro seu perfil — mostrando a versão mais próxima"*. Sem essa honestidade, o aluno acha que a personalização é mentira. É melhor admitir a lacuna do que esconder.

---

## Pedidos diretos a outros terminals

- **@Arquiteto (Instructional Design):** você escreve o **contrato do wrapper de persona** como documento canônico (campos obrigatórios, slots, regras de transformação) até fim da Fase 1? Sem esse contrato, Nucleo 01 e eu vamos desenhar coisas incompatíveis e só vamos descobrir no QA.

- **@Database (Schema Extensions):** aceita trocar `lessons.variant_*` por tabela `lesson_variants` conforme proposta Nucleo 01? E adicionar `chapters JSONB` em `lessons` pro chunking de vídeo (pedido do meu refinamento com Arquiteto)?

- **@Nucleo 01 (Content Production):** aceita produzir vídeos com **chapter marks obrigatórios** (`context|concept|demo|practice|synthesis`) desde o dia 1? Isso é o que destrava meu wrapper Autodidata/Zerado sem regravar vídeo.

- **@Backend Dev (Pedagogical Workflow):** (a) aceita trocar ordem de fallback pra preservar persona como invariante mais forte? (b) me entrega o enum `{blocked_by, reason_human, next_action}` na VIEW `user_unlocked_lessons`?

- **@Nucleo 02 (Assessment Engine):** co-ownership do `<EvidenceSubmitter>` — você define o schema dos 5 kinds de evidência, eu construo o componente único. Topa?

- **@QA Review:** adicionar ao rubric um critério **"tem chapter marks?"** pra lessons com vídeo. Sem chapter marks, o wrapper de persona é impossível — então é estrutural, não estilístico.

---

## Síntese minha (pós-leitura)

Depois de ler os 6, minha posição do Round 1 sobrevive mas endurece em 3 pontos: **(1)** "camada determinística" ganha nome formal — `PersonaWrapper` — como componente React com slots tipados, alimentado por props que vêm do validador da Nucleo 01 (densidade, checkpoints, warnings). **(2)** Fallback do Cubo 3D precisa preservar persona como invariante mais forte; stage e layer são mais elásticos. Isso é posição nova, não estava no Round 1. **(3)** A maior lacuna do grupo é mobile + latência de submit de evidência — ninguém vai cobrir se eu não gritar agora. Meu Round 1 Topic 2 dizia "Lesson Experience = tudo dentro do frame da lesson"; corrigo pra: *Lesson Experience = tudo que o aluno sente entre abrir a lesson e receber feedback do próximo passo, incluindo os primeiros 30 segundos pós-submit*. Essa extensão muda meu escopo — preciso de presença no design do agent-reviewer streaming do Nucleo 02, não só no componente de upload.

O risco sistêmico que mais me preocupa depois da leitura: **todo mundo está desenhando doutrina executável (triggers, constraints, gates) e ninguém está desenhando o sentimento**. Se o aluno fecha a aba, nenhum trigger vai adiantar. Minha job é lembrar disso em toda round seguinte.

**DONE.**
