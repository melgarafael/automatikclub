# Round 2 — assessment-engine reaction

**Read:** instructional-design, schema-extensions, pedagogical-workflow, lesson-experience, pedagogical-qa, content-production. (Skipped own R1.)

---

## Pontos de acordo (que reforço)

- **Schema Extensions (Database)**: "Matar `auto_complete_lesson` ou CBE é teatro" + FK `user_competency_progress.evidence_submission_id → user_exercise_submissions(id)`. — **minha extensão:** essa FK é exatamente o link que meu R1 chamou de "evidence_url aponta pro melhor attempt aprovado". Adoto o nome `user_exercise_submissions` dele em vez do meu `assessment_attempts` — convergência > vaidade taxonômica. Peço apenas que `submission JSONB` aceite o shape de `evidence_artifacts` que propus (5 kinds: json_workflow, video, url, file, text), e que o índice composto seja `(user_id, status, exercise_id)` pra suportar a query "minha fila de attempts pendentes".

- **Pedagogical Workflow (Backend Dev)**: REVOKE UPDATE em `lessons.is_published` + função `SECURITY DEFINER publish_lesson()` + advisory lock por `lesson:<id>` no review. — **minha extensão:** estendo o mesmo padrão pro meu lado: REVOKE UPDATE em `user_competency_progress.status`; toda promoção passa por `fn_promote_competency(user_id, competency_id, attempt_id, reviewer_id)` que valida (a) attempt existe, (b) attempt.status='passed', (c) reviewer autorizado, (d) bloom_demonstrated ≥ competency.bloom_level. A coluna não é writable, o estado é. Roubo a frase do Backend Dev verbatim.

- **Pedagogical QA**: coluna `bloom_assessed` separada de `bloom_target` (autor declara, reviewer constata) + `pedagogical-drift-detector` semanal amostrando 5% das aulas. — **minha extensão:** isto é o instrumento que faltava no meu R1 pra detectar "variante Zerado virando easy mode". Vou estender: meu auditor roda o mesmo princípio sobre `assessment_attempts` — amostra 5% dos approved e re-roda contra rubric atual. Se taxa de aprovação por persona divergir mais de 15% da média, dispara alerta. **Co-ownership aceito** do `competency-evidence-validator` que QA propôs como P1 — ele desenha critérios objetivos, eu desenho prompts de avaliação por bloom_level. Sem co-design, vira duas skills brigando pelo mesmo escopo.

- **Instructional Design (Arquiteto)**: "Bloom 5–6 exigem revisão humana obrigatória — não negociável" + "geração é backward, nunca forward, sempre árvore inteira de competências". — **minha extensão:** isto fecha o argumento que tentei abrir no meu R1 contra quiz-disfarçado-de-CBE. Adoto como regra dura no meu motor: `assessment.type='quiz_auto'` é proibido por CHECK constraint quando `competency.bloom_level >= 5`. Erro de banco, não warning de app — alinhado com o princípio do Backend Dev de "trigger é não-negociável".

- **Content Production (Núcleo 01)**: contrato YAML `evidence_expected: {type, format, prompt, validation_hint}` no front matter da lesson + co-autoria desse contrato comigo. — **minha extensão:** aceito co-autoria *imediatamente*. Esse YAML é a interface entre Núcleo 01 e Núcleo 02 que destrava todo o resto. Proposta: ele ganha um campo `competency_id` (não só `competencies_taught[]` plural), porque cada `evidence_expected` certifica UMA competência específica — múltiplas competências = múltiplos blocos `evidence_expected`. Sem isso, eu não sei qual rubric aplicar.

- **Lesson Experience (UI UX Design)**: botão primário da lesson é "Enviar evidência", não "Marcar como concluída"; grafo de competências substitui lista de aulas. — **minha extensão:** isto resolve meu medo de "CBE no backend mas UI por horas" (R1 Topic 3). Adiciono um pedido: o componente de upload deve mostrar a **rubric** ao aluno *antes* de submeter, não só depois. Transparência de critérios é parte da pedagogia (Wiggins) — aluno vê o que vai ser avaliado, calibra a entrega, reduz ciclos de revisão.

---

## Pontos de discordância ou refinamento

- **Pedagogical QA** propõe "competency-evidence-validator é meio meu meio dele". — **minha objeção:** "meio-meio" é como ownership morre. Há dois trabalhos distintos: (a) **gerar a rubric** a partir da competência (meu) e (b) **auditar a aplicação consistente** da rubric (dele, como gate). **Minha proposta:** divisão limpa — Núcleo 02 owns `rubric-builder` e `agent-reviewer`; QA owns `pedagogical-gate-rubric` (meta-rubric que valida minhas rubrics) e `pedagogical-drift-detector`. Eu produzo, ele audita o produtor. Conflito de interesse saudável (QA usou essa frase, concordo).

- **Content Production** propõe "max 30% das lessons em estágio ≥3 podem ter `evidence_type=quiz`". — **minha objeção:** percentual arbitrário cria gaming (todo mundo vai pro 29%). O critério verdadeiro é Bloom, não estágio. **Minha proposta:** banir `quiz_auto` para `competency.bloom_level >= 4` (não ≥5 como o Arquiteto pediu — incluo "Analisar" porque análise estruturada raramente cabe em MCQ honesto). Bloom 1–3 pode quiz; Bloom 4 exige rubric mesmo que com `reviewer_type='agent'`; Bloom 5–6 exige `reviewer_type='human'`. Regra Bloom-based em vez de estágio-based ou percentual — uma regra, sem brechas.

- **Pedagogical Workflow (Backend Dev)** propõe que rejeição requer `feedback_md` com `length > 50`. — **minha objeção:** comprimento mínimo é proxy fraco; reviewer escreve "este artefato não atende aos critérios estabelecidos pela rubrica vigente" e passa nos 50 chars sem dizer nada útil. **Minha proposta:** rejeição obrigatoriamente preenche `rubric_scores` com pelo menos um critério marcado como `failed` + `comment_md` por critério falhado. Isto também alimenta o `pedagogical-drift-detector` — sabemos *qual critério* mais reprova, não só quantas reprovam. Estrutura, não comprimento.

---

## Lacunas que ninguém cobriu

- **Re-attempt policy.** Ninguém tratou: se aluno falha um rubric-graded artifact, qual o cooldown? Quantas tentativas? Reflexão obrigatória entre tentativas? Sem regra, ou aluno spamma submits (gaming via brute force) ou desiste após 1 falha (churn). **Do meu ângulo:** Kolb exige reflexão; minha proposta concreta — `assessment_attempts.previous_attempt_id` + CHECK que entre attempts do mesmo aluno/competência tem que existir uma `reflection_md` não-vazia. Cooldown 24h para Bloom 5–6, instantâneo para Bloom 1–3.

- **Custo de LLM do agent-reviewer.** Núcleo 01 calcula custo de geração; ninguém calculou custo de **revisão**. Cada submission Bloom 4 que passa por agent-reviewer queima tokens. Numa plataforma com 1000 alunos × 50 competências × 1.3 attempts médios = 65k invocações. **Do meu ângulo:** preciso de orçamento de tokens por reviewer-run (ex: 4k input + 1k output max), cache de rubric-by-competency, e batching quando possível. Sem isso, agent-reviewer vira buraco financeiro silencioso e o Backend Dev me corta o recurso no mês 3.

- **Auditoria de Kirkpatrick L4 por persona.** O risco que mais me assusta (variante Zerado certificando sem capacidade real) não tem dono. QA tem drift detector pedagógico, eu tenho auditoria de approval rate, mas ninguém amarra isso a `monthly_revenue_self_reported`. **Do meu ângulo:** preciso de uma view conjunta `v_persona_certification_vs_revenue` que cruza taxa de aprovação por (persona, competency) com receita declarada por persona. Se Zerados aprovam mais e monetizam menos, a variante mente — alarme para Arquiteto + Núcleo 01 recalibrarem. Esta view só faz sentido se eu, QA e Database concordarmos quem a popula.

---

## Pedidos diretos a outros terminals

- **@Database:** aceitar `assessments` como tabela first-class (não só `exercises`) com `type ∈ {quiz_auto, rubric_artifact, peer_review, agent_review, live_demo}` e `lesson_id NULLABLE` (assessment de módulo/trilha precisa existir desde a primeira migration). E adicionar `assessment_attempts.previous_attempt_id` + `reflection_md` para suportar re-attempt com Kolb.

- **@Backend Dev:** confirmar que `fn_promote_competency()` (proposta acima) é o único caminho de escrita em `user_competency_progress.status`. E me dar o `pg_advisory_xact_lock` por `attempt:<id>` espelhando o seu padrão de `lesson:<id>` — agent-reviewer e human-reviewer não podem pisar no mesmo attempt.

- **@Núcleo 01:** co-autoria do bloco YAML `evidence_expected` esta semana, não na Fase 2. Se você emperrar nisso, eu emperro toda a geração. Proposta concreta: cada `evidence_expected` carrega `competency_id` (singular) + `rubric_template_slug` que aponta pra uma rubric do meu catálogo.

- **@QA Review:** aceito sua proposta de co-ownership do `competency-evidence-validator` *com a divisão* descrita acima (eu construo rubric/agent-reviewer, você constrói pedagogical-gate-rubric e drift detector). E peço seu review obrigatório nas minhas migrations de `assessments`/`rubrics` — schema é doutrina materializada (sua frase, comprei).

- **@Arquiteto:** preciso do **catálogo de competências v1** com `bloom_level` calibrado e mapeamento competência → estágio antes de qualquer coisa. Núcleo 01 também pediu isso. Bloqueante compartilhado, prioridade máxima do Arquiteto na Fase 1.

- **@UI UX Design:** rubric visível ao aluno *antes* de submeter (não só após). E uma área de "histórico de attempts" com `reflection_md` exposto — ajuda Organizado e força Autodidata a pensar antes do segundo submit.

---

## Síntese minha (pós-leitura)

Minha posição R1 sai mais forte e mais focada: o Assessment Engine é o **gate de promoção de status**, não um quiz factory. O acordo emergente com Database (FK pra submissions), Backend Dev (REVOKE + SECURITY DEFINER), QA (drift detector + bloom_assessed) e Arquiteto (Bloom 5–6 = humano sempre) me dá toda a infraestrutura técnica que eu pedi, sem precisar inventar tabelas paralelas. Onde eu ajusto: aceito a nomenclatura do Database (`exercises` + `user_exercise_submissions`), aceito a regra Bloom-based sobre estágio-based, e formalizo a divisão de skills com QA Review (eu produzo rubrics, ele audita produtor). Onde eu endureço: re-attempt sem reflexão é proibido por CHECK constraint, custo de LLM do agent-reviewer entra no orçamento da Fase 1 explicitamente (não como surpresa), e a auditoria persona × monetização (Kirkpatrick L4) vira sub-story bloqueante do meu epic — sem ela, todo o sistema mente sem saber.

**DONE.**
