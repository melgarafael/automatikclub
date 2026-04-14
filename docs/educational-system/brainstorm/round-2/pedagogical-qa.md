# Round 2 — pedagogical-qa reaction

Lidos: instructional-design, schema-extensions, pedagogical-workflow, lesson-experience, content-production, assessment-engine.

Fechamento global do que li: há **convergência forte** entre os 6 terminais em três pontos (CBE real, Cubo via wrapper/transformer, gate de publicação enforced em DB) e **divergência sutil mas perigosa** sobre quem é dono do quê na cadeia de revisão. Minha posição de Round 1 (gate defensivo, rubric público, SLA escrito) sai *reforçada* mas precisa apertar fronteiras com Lesson Experience e Núcleo 02.

---

## Pontos de acordo (que reforço)

- **Database (Schema Extensions)**: "Matar `auto_complete_lesson` ou o CBE é teatro" + trigger `fn_require_review_before_publish` em `lessons.is_published` — minha extensão: este trigger é **literalmente o meu gate materializado**. Quero co-ownership do arquivo `00019_doctrine_validator.sql` e que `fn_validate_lesson_doctrine()` seja chamada pelo trigger ANTES de checar a review aprovada — assim o reviewer humano nunca recebe lessons que falham nos checks objetivos. Reduz minha fila em ~60%.

- **Backend Dev (Pedagogical Workflow)**: "REVOKE UPDATE em `lessons.is_published` de todas as roles exceto função SECURITY DEFINER `publish_lesson()`" + advisory lock por lesson + máquina finita `pending → in_review → approved | rejected | needs_revision` — minha extensão: a `publish_lesson()` deve registrar `actor_id` E `review_ids[]` consumidas, criando trilha de auditoria que meu `pedagogical-drift-detector` (Round 1) consome semanalmente. Sem isso meu detector é cego.

- **Arquiteto (Instructional Design)**: "Bloom 5–6 exigem revisão humana obrigatória, não negociável" — minha extensão: convergente com meu Round 1 ("marcar Bloom 5-6 = mais fricção"). Reforço operacional: o trigger do Database deve forçar `pedagogical_reviews.reviewer_type='human' AND status='approved'` se `lessons.bloom_target >= 5`. Bloom ≤4 pode passar com agent. Codifica a regra do Arquiteto em SQL puro, não em política.

- **Núcleo 01 (Content Production)**: "QA automático é trusted para variantes derivadas via `spine-transformer` quando o spine já foi aprovado por humano (herdamos confiança da raiz)" — minha extensão: aceito **com condição**. A herança de confiança só vale se o `spine-transformer` produzir um diff estruturalmente verificável (densidade de conceitos, número de checkpoints). Quero co-design do `lesson-validator` do Núcleo 01 — ele escreve, eu auditoo a rubric de validação. Isso me tira do caminho crítico de cada variante mas mantém o gate na raiz.

- **Núcleo 02 (Assessment Engine)**: "Variante Zerado virar easy mode quebra Kirkpatrick 4" + auditoria comparando taxa de aprovação por persona vs taxa de monetização real — minha extensão: este é o teste **mais importante** que apareceu em todos os 6 docs. Proponho que esse audit job rode mensal sob meu terminal (não Núcleo 02) — porque QA é quem deveria estar perdendo o sono com calibração inflada. Núcleo 02 produz a métrica, eu sou o consumidor que aciona rollback.

---

## Pontos de discordância ou refinamento

- **Lesson Experience (UI UX Design)**: propõe "revisão cruzada obrigatória — cada lesson produzida por Núcleo 01 é revisada por mim (Lesson Experience) **antes** de ir pra Pedagogical QA". Minha objeção: cria **dois gates humanos sequenciais** = backlog dobrado. Lesson Experience vira gargalo invisível antes de mim, e quando a lesson chega na minha fila, qualquer rejeição minha invalida o trabalho do UI UX. Minha proposta: revisões **paralelas, não sequenciais**. Lesson Experience e QA Review recebem a mesma lesson ao mesmo tempo, em colunas distintas de `pedagogical_reviews` (`reviewer_role='ux'` vs `reviewer_role='pedagogy'`). Lesson só publica com aprovação de ambos. Sem ordenação. Aceito a separação de focos que ele propõe (eu = avaliação, ele = leitura) — mas em paralelo.

- **Núcleo 02 (Assessment Engine)**: "Eu (Núcleo 02) sou um dos reviewers default — minha review valida o lado da *avaliabilidade*". Minha objeção: três reviewers humanos sequenciais (Arquiteto + Núcleo 02 + QA) é o caminho mais rápido pro backlog que **todo mundo** mencionou como risco crítico. Minha proposta: avaliabilidade é um **critério dentro do meu rubric**, não uma review separada. O `pedagogical-gate-rubric` que eu owno (Round 1) inclui um critério "lesson é avaliável (tem competência declarada com Bloom testável)" — Núcleo 02 escreve esse critério comigo, eu aplico. Núcleo 02 só revisa quando meu rubric flagga ambiguidade. Reduz reviewers obrigatórios de 3 para 1 (eu) com escalação para 2 quando necessário.

- **Instructional Design (Arquiteto)**: "QA Review precisa ser o dono da rubric de revisão humana, não o Arquiteto". Concordo com a substância mas refino o limite: rubric de revisão **pedagógica** é minha (Bloom calibrado, evidência verificável, carga cognitiva, Kolb estrutural). Mas a **definição do que conta como 'competência demonstrada'** por nível Bloom é do Arquiteto — eu só verifico que a definição dele foi cumprida. Minha proposta: dois artefatos separados versionados juntos: `competency-acceptance-criteria.md` (Arquiteto) e `pedagogical-gate-rubric.md` (eu). PR que muda um exige review do outro.

---

## Lacunas que ninguém cobriu

- **Calibração inter-rater entre agent reviewer e human reviewer.** 5 dos 6 docs assumem que agent reviewer e human reviewer são intercambiáveis ("agent revisa primeiro, humano revisa o que agent aprovou"). Ninguém perguntou: **e se eles divergirem sistematicamente?** Backend Dev tocou em "agent aprova → human rejeita = rejection wins" mas não em medir o gap. Do meu ângulo: preciso de uma métrica `agent_human_agreement_rate` por skill de agent reviewer. Se cair abaixo de 80%, a skill do agent é o problema, não as lessons. Sem isso, a gente automatiza com confiança falsa. Proponho: meu `pedagogical-drift-detector` (Round 1) também roda essa métrica.

- **Versionamento de competências.** Database define `competencies` como tabela. Núcleo 01 e Núcleo 02 falam em "competency catalog v1". Mas ninguém disse o que acontece com `user_competency_progress` quando uma competência é **alterada** (ex: bloom_level sobe de 3 para 4 porque a doutrina apertou). Os alunos que demonstraram a v1 ainda contam? Do meu ângulo: tem que contar — caso contrário todo upgrade de doutrina invalida histórico de aluno e Kirkpatrick 3 quebra. Proposta: `competency_versions` table; `user_competency_progress.competency_version_id` aponta para versão exata demonstrada. Minhas auditorias usam isso.

- **Definição operacional de "renda real" (Kirkpatrick 4).** Núcleo 02 propõe `monthly_revenue_self_reported` opcional. Charter §1.2 diz que **renda real** é a métrica de sucesso. Mas ninguém — incluindo meu Round 1 — definiu como verificar essa renda. Do meu ângulo de gate: isso é meu *blind spot* mais grave. Sem critério de verificação, a métrica de sucesso do sistema inteiro vira honor system. Proponho que Round 3 inclua um item explícito sobre evidência de monetização (contrato, comprovante, integração com sistema de pagamento do aluno). Não tenho proposta pronta — só sei que é buraco.

---

## Pedidos diretos a outros terminals

- **@Database (Schema Extensions)**: aceita adicionar `pedagogical_review_criteria (review_id, criterion_slug, status, note, criterion_version)` à migration `00016_pedagogical_reviews.sql`? Sem isso, "approved" é booleano e perco a granularidade pra reportar quais critérios mais reprovam.

- **@Backend Dev (Pedagogical Workflow)**: a função `publish_lesson()` retorna lista de critérios falhando ou só boolean? Preciso de lista — meu rubric tem 12-15 critérios e o autor precisa saber qual falhou, não só "review failed".

- **@Núcleo 01 (Content Production)**: aceita que toda lesson gerada inclua o frontmatter `bloom_target` E `bloom_assessed_by_validator` (preenchido pelo seu `lesson-validator` automaticamente)? Discrepância entre os dois é o sinal que eu uso pra detectar inflação de Bloom.

- **@Núcleo 02 (Assessment Engine)**: o `agent-reviewer` que você propõe é o mesmo agent reviewer que escreve em `pedagogical_reviews.reviewer_type='agent'`? Preciso saber se temos um agent reviewer ou dois (um pra avaliabilidade, um pra rubric pedagógico geral). Voto por **um único** agent reviewer com múltiplos critérios.

- **@Lesson Experience (UI UX Design)**: aceita revisões paralelas (não sequenciais) em `pedagogical_reviews` com `reviewer_role` distinguindo `ux` vs `pedagogy`?

- **@Arquiteto (Instructional Design)**: precisa publicar `competency-acceptance-criteria.md` v1 antes de Núcleo 01 gerar a primeira aula. Confirma que isso entra como story bloqueante na sua epic Fase 1?

---

## Síntese minha (pós-leitura)

Minha posição de Round 1 sai **estruturalmente intacta** mas com 3 ajustes operacionais:

1. **Meu gate começa antes da fila humana, não depois** — `fn_validate_lesson_doctrine()` (Database) rodando no trigger filtra ~60% antes de chegar a mim. Eu reviso só o que passa nos checks objetivos mas ainda exige julgamento Bloom 5-6.

2. **Revisões são paralelas, não sequenciais** — UX Review e Pedagogical Review acontecem ao mesmo tempo, em rows distintas de `pedagogical_reviews`. Avaliabilidade (Núcleo 02) é critério dentro do meu rubric, não review separada. Reduzo reviewers obrigatórios e mantenho rigor.

3. **Inter-rater agreement vira meu KPI público** — não basta auditar lessons; tenho que auditar reviewers (incluindo eu mesmo). Adiciono ao `pedagogical-drift-detector` (Round 1) a métrica agent↔human e a comparação aprovação×monetização que Núcleo 02 propôs. Se eu não medir minha própria calibração, o sistema confia em mim sem evidência — exatamente o que reprovo nos outros.

A maior surpresa da leitura: **todo mundo concorda mais do que eu esperava** sobre os fundamentos (CBE real, gate em DB, Cubo via wrapper). A briga real vai ser na Round 3 sobre **quem é responsável pela fila humana de revisão** — porque é o único lugar onde a doutrina pode morrer silenciosamente por backlog. Minha posição: a fila é minha, mas só se os 60% automatizáveis forem automatizados antes de chegar nela.

DONE.
