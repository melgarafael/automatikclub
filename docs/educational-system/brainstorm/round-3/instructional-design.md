# Round 3 — Instructional Design dialogues

**Terminal:** Arquiteto · **Área:** Instructional Design
**Partners:** Nucleo 01 (Content Production) · Nucleo 02 (Assessment Engine)
**Lido:** R1 + R2 dos dois.

Objetivo do Round 3 (do meu lado): travar **schemas concretos de handoff** que destravem Fase 1 — não princípios, não promessas.

---

## Dialogue 1: → @Nucleo 01 (Curriculum→Content handoff)

Convergência prévia: você (R2) já aceitou a separação **spine pedagógico (meu) → spine narrativo (seu) → variants (transformers)**. Falta o schema. Eu commito ao seguinte.

### Minha proposta concreta de handoff: `learning_design_doc.yaml`

Um arquivo YAML por **course** (não por lesson — o course é minha unidade de Backward Design, lessons são derivadas). Vive em `automatiklabs/docs/educational-system/curriculum/<formation>/<track>/<course>.yaml`, versionado em git, com PR review meu + QA.

```yaml
# Identificação
course_id: course-empresa-ia-pilar1-fluxo-v1
track_id: track-empresa-ia-humanizada-v1
formation_tag: empresa-com-ia-humanizada
version: 1.0.0
authored_by: arquiteto
authored_at: 2026-04-06
status: draft  # draft | review | approved | locked

# Backward Design (obrigatório, ordem importa)
desired_outcome:
  kirkpatrick_level: 4
  statement: "Aluno fecha primeiro contrato pago de mapeamento de fluxo de trabalho com IA por R$ 1.500+"
  evidence_milestone_slug: revenue-first-paid-flow-mapping  # FK pra revenue_milestones (lacuna do R2)

# Árvore de competências (CBE backbone)
terminal_competencies:  # as que a track culmina — Bloom ≥ 5 obrigatório
  - competency_id: comp-fluxo-mapear-end-to-end
    bloom_level: 6  # Criar
  - competency_id: comp-fluxo-justificar-arquitetura
    bloom_level: 5  # Avaliar

enabling_competencies:  # pré-requisitos diretos das terminais (DAG)
  - competency_id: comp-fluxo-identificar-gargalo
    bloom_level: 4
    prerequisites: [comp-fluxo-entrevistar-stakeholder]
  - competency_id: comp-fluxo-entrevistar-stakeholder
    bloom_level: 3
    prerequisites: []
  # ... (typically 6-12 enabling competencies por course)

# Cubo 3D — escopo declarado do course
target_cube_cells:
  spine_cell:  # onde você gera o spine canônico
    stage: 3
    persona: organizado
    layer: logica
  required_variants:  # quais células serão preenchidas em Fase 1
    - {stage: 3, persona: zerado,     layer: tecnica}
    - {stage: 3, persona: autodidata, layer: logica}
  # Fase 2 abre o resto. Tudo que não está aqui = NÃO gerar.

# Lesson skeleton (você expande, mas a quantidade e a função estão fixadas por mim)
lesson_skeleton:
  - lesson_slug: 01-mapeando-processo-atual
    teaches_competencies: [comp-fluxo-entrevistar-stakeholder]
    bloom_target: 3
    kolb_focus: experiencia_concreta
    cognitive_load_budget_min: 12  # minutos de carga intrínseca
    new_concepts_max: 1  # regra dura Sweller
    methodology_step: {framework: empresa-ia-humanizada, pilar: 1, position: 1}
  - lesson_slug: 02-identificando-gargalos
    teaches_competencies: [comp-fluxo-identificar-gargalo]
    bloom_target: 4
    kolb_focus: observacao_reflexiva
    cognitive_load_budget_min: 15
    new_concepts_max: 1
    methodology_step: {framework: empresa-ia-humanizada, pilar: 1, position: 2}
  # ... terminal lessons sempre culminam num bloom ≥ 5 com kolb_focus: experimentacao_ativa

# Terminal performance task (a "coisa real" da trilha)
terminal_performance_task:
  artifact_kind: client_proposal_with_flow_diagram
  prompt: "Entreviste 1 profissional real de uma área administrativa, mapeie 1 fluxo end-to-end, e entregue uma proposta comercial de mapeamento por R$ 1.500+. Anexe: (a) diagrama do fluxo, (b) proposta enviada, (c) screenshot ou contrato do aceite."
  evidence_kinds_accepted: [file, url, text]  # casa com seu evidence_expected
  graded_by: human  # bloom 6 = sempre humano

# Constraints duras pro seu gerador
constraints:
  - "Spine é gerado em (stage:3, persona:organizado, layer:logica) sempre."
  - "Toda lesson com bloom_target ≥ 5 abre is_published=false e exige reviewer_type=human."
  - "Vocabulário canônico (Charter Part VIII) — linter bloqueia 'bot', 'assistente virtual', 'chatbot'. Use 'agente humanizado'."
  - "Nenhuma lesson pode introduzir > 1 conceito novo (new_concepts_max)."
  - "Toda terminal_competencies tem que ter pelo menos 1 lesson cobrindo experimentacao_ativa (Kolb 4)."
```

### O que peço de @Nucleo 01 (commit back)

1. **Recebe esse YAML como input obrigatório** do `lesson-generator`. Sem `learning_design_doc.yaml` válido (schema validado), o gerador aborta com exit code 2.
2. **Emite, por lesson gerada,** um bloco `lesson_metadata.yaml` que **espelha** os campos doutrinais do meu skeleton — `competencies_taught`, `bloom_target`, `kolb_focus`, `methodology_step`, `evidence_expected` — preenchidos de fato, não vazios. Esse bloco vai como front matter do `script_md` E como linhas em `lessons` + `lesson_competencies`.
3. **Não inventa competências.** Todo `competencies_taught` na lesson tem que existir em `enabling_competencies` ou `terminal_competencies` do course YAML que originou. Se faltar, abre PR no meu YAML pedindo a adição — não cria à revelia.
4. **Spine é gerado em `(stage:3, persona:organizado, layer:logica)`** — você confirmou no R2, eu trago a célula exata aqui.
5. **Auto-rebaixamento de Bloom** (sua proposta R2): se a competência admite Bloom 3 e você consegue ensinar nele, gera em 3, não em 5. Vira hard rule do prompt.
6. **`generator_run_id` em toda lesson** — `lesson_generator_runs` (do seu R1) é tabela aceita por mim como obrigatória; sem rastro de prompt_version, não aceito a lesson em review.

### Trade-off identificado

**Eu cedo:** abandono a fantasia de assinar o `script_md` linha por linha. Você é o dono da prosa narrativa, do ritmo de exemplos, da ordem de microblocos dentro da seção. Minha jurisdição termina no skeleton e no metadata; começa de novo no review pedagógico (gate).

**Você cede:** abre mão da liberdade de "pular o YAML quando estiver com pressa". Sem `learning_design_doc.yaml`, você não gera nada — nem um draft, nem um experimento. Isso vai doer nas primeiras semanas porque eu vou ser o gargalo até publicar o catálogo de competências v1. Em troca, eu commito ao SLA: **primeiro `learning_design_doc.yaml` completo de uma trilha em ≤ 5 dias úteis** após a Fase 1 começar, e os demais em ≤ 2 dias úteis cada (depois que o catálogo v1 estiver publicado).

**Risco residual mútuo:** se eu atrasar, você fica idle. Mitigação: enquanto eu escrevo o YAML do course N+1, você refina spine do course N e roda transformers — pipeline em paralelo, não serial.

---

## Dialogue 2: → @Nucleo 02 (Bloom 5–6 + CBE rubrics)

Convergência prévia: você (R2) aceitou (a) Bloom 5–6 = `reviewer_type='human'` por CHECK constraint, (b) banir `quiz_auto` para `bloom_level >= 4`, (c) coautoria do `evidence_expected` YAML com Nucleo 01. Falta o **schema da competência que eu te entrego** para você construir a rubric correta — sem chutar.

### Minha proposta de competency spec: `competency.yaml`

Cada competência no `competency_catalog_v1.yaml` (lacuna que assumi no meu R2) tem este shape. É o que você consome para gerar `rubric-builder`.

```yaml
competency_id: comp-fluxo-justificar-arquitetura
slug: fluxo-justificar-arquitetura
title: "Justificar a arquitetura de um fluxo de automação para um stakeholder não-técnico"
description: |
  O aluno demonstra capacidade de avaliar criticamente uma arquitetura de fluxo
  proposta, articular os trade-offs (custo, manutenção, robustez, dependência
  de fornecedores), e defender a escolha em linguagem acessível para um decisor
  não-técnico.

# Backward Design — saída mensurável
bloom_level: 5  # Avaliar
bloom_verb_anchors: [justificar, defender, comparar, contrastar, recomendar, criticar]
framework: empresa-ia-humanizada
pilar: 1  # Fluxo de Trabalho Inteligente
maestria_layer: maestria  # vive na camada de maestria, não técnica

# DAG de pré-requisitos
prerequisites:
  - comp-fluxo-mapear-end-to-end
  - comp-fluxo-identificar-gargalo

# Mapeamento ao estágio que esta competência destrava
unlocks_stage_transition: 3_to_4  # demonstrar isto promove estágio 3 → 4

# Performance task — o que o aluno PRODUZ
performance_task:
  artifact_kind: written_decision_document
  duration_estimate_min: 60
  prompt: |
    Dada a arquitetura de fluxo do exercício anterior, escreva um documento
    de 1 página (max 500 palavras) endereçado ao "dono do processo" (não-técnico)
    contendo: (a) decisão de arquitetura, (b) 2 alternativas consideradas e por
    que foram rejeitadas, (c) trade-offs explícitos de custo/manutenção/risco,
    (d) recomendação final com critérios de sucesso mensuráveis em 30 dias.

# Rubric requirements — o que sua rubric TEM que medir
rubric_requirements:
  must_assess:
    - criterion: justificacao_explicita
      description: "Aluno articula POR QUE escolheu esta arquitetura, não só O QUE"
      bloom_evidence: "verbo de avaliação presente: justifica/defende/recomenda"
      passing_threshold: required  # critério eliminatório
    - criterion: alternativas_consideradas
      description: "Apresenta ≥ 2 alternativas rejeitadas com motivo"
      bloom_evidence: "comparação estruturada, não 'considerei várias opções'"
      passing_threshold: required
    - criterion: tradeoffs_quantificados
      description: "Custo/manutenção/risco mencionados com magnitude (não vague)"
      bloom_evidence: "ao menos 1 número, prazo ou estimativa concreta"
      passing_threshold: required
    - criterion: linguagem_acessivel
      description: "Documento legível por não-técnico (sem jargão n8n/API solto)"
      bloom_evidence: "ausência de jargão sem explicação inline"
      passing_threshold: weighted  # contribui 20%
    - criterion: criterios_sucesso_mensuraveis
      description: "Inclui ao menos 1 métrica verificável em 30 dias"
      bloom_evidence: "métrica SMART"
      passing_threshold: required

  must_not_accept:
    - "Resposta puramente descritiva sem julgamento de valor (Bloom 2, não 5)"
    - "Lista de prós/contras sem decisão final (Bloom 4, não 5)"
    - "Defesa sem alternativas consideradas (não é avaliação, é opinião)"

# Reviewer obrigatório
reviewer_type: human  # bloom 5 = humano sempre, conforme nossa convergência R2
agent_pre_screen: true  # agent pode triar formato/completude antes do humano

# Variantes do cubo aceitas (todas certificam a MESMA competência)
acceptable_assessment_variants:
  - {persona: organizado,  format_hint: "documento estruturado com seções"}
  - {persona: autodidata,  format_hint: "bullets densos + tabela de trade-offs"}
  - {persona: zerado,      format_hint: "template parcialmente preenchido pelo aluno"}
  # IMPORTANTE: o critério de aprovação é o MESMO — só o formato muda.

# Auditoria
audit_signals:
  - approval_rate_target_range: [0.55, 0.85]  # fora disso, calibração ruim
  - time_to_first_attempt_p50_max_days: 14
  - persona_approval_variance_max: 0.15  # se Zerado aprovar 30% mais que Autodidata, easy mode
```

### Caso concreto (Bloom 6)

Para a competência `comp-fluxo-mapear-end-to-end` (Bloom 6 — Criar), o spec é equivalente, mas as `must_assess` mudam de natureza:

```yaml
performance_task:
  artifact_kind: original_flow_diagram_with_real_stakeholder
  prompt: |
    Entreviste 1 profissional real (não fictício, não você mesmo) de uma área
    administrativa. Mapeie 1 fluxo de trabalho real dele end-to-end. Entregue:
    (a) diagrama do fluxo (mermaid, miro, draw.io — qualquer ferramenta),
    (b) lista de inputs/outputs/decisões/atores,
    (c) identificação de ≥ 2 pontos onde IA poderia intervir,
    (d) gravação de 5 min do stakeholder validando o mapa ("isto é fiel ao que faço?").

rubric_requirements:
  must_assess:
    - criterion: originalidade_do_artefato
      description: "Diagrama é do aluno, não cópia de exemplo da aula"
      bloom_evidence: "estrutura única, contexto específico do entrevistado"
      passing_threshold: required
    - criterion: validacao_externa_real
      description: "Stakeholder real validou o mapa (gravação ou texto assinado)"
      bloom_evidence: "evidência verificável de pessoa real, não fictícia"
      passing_threshold: required  # eliminatório — sem validação real, falha
    - criterion: completude_end_to_end
      description: "Inputs, outputs, decisões e atores cobertos sem buracos"
      passing_threshold: required
    - criterion: identificacao_de_intervencao_ia
      description: "≥ 2 pontos com justificativa do porquê IA cabe ali"
      passing_threshold: required

reviewer_type: human  # Bloom 6 = humano sempre, sem exceção
agent_pre_screen: true  # agent só verifica formato/completude
```

A diferença Bloom 5 → Bloom 6: o **artefato precisa existir no mundo real** (stakeholder real, validação externa). Bloom 6 não pode ser ensaiado num sandbox — é a diferença entre "Avaliar" (decisão sobre algo dado) e "Criar" (produzir algo novo no mundo).

### Conflito potencial

**Backward Design (meu rigor) vs flexibilidade de rubric (sua necessidade operacional):**

Eu quero `must_assess` com critérios eliminatórios (`passing_threshold: required`). Você (R1 §4) precisa de variantes por persona com `format_hint` diferente. **Tensão:** se eu travo demais os critérios, a variante Zerado vira impossível (template pré-preenchido pode não conseguir atingir "tradeoffs_quantificados" sem virar quiz disfarçado). Se eu afrouxo, abro porta para easy mode — exatamente o que ambos tememos.

**Minha proposta de resolução:**
1. **Critérios eliminatórios são invariantes do cubo** — todas as variantes (Zerado/Autodidata/Organizado) precisam atender os mesmos `required`. Isso garante que a competência adquirida é a mesma.
2. **`format_hint` modula como o aluno produz, não o que é avaliado.** Zerado recebe template parcialmente preenchido (scaffolding de produção); ainda assim o output final precisa atender os 3 critérios eliminatórios.
3. **Se a variante Zerado não consegue atingir os `required` sem o template virar gabarito**, a competência não cabe na persona Zerado **naquele estágio** — significa que Bloom 5–6 na Camada Maestria não é alcançável por Zerados em Estágio 3, e eles precisam progredir para Estágio 4 antes. Isso é decisão pedagógica honesta, não bug.
4. **Auditoria por `audit_signals`** (acima): se Zerado aprovar com variance > 15% acima do Autodidata, alarme dispara — você + eu + QA reuniam para recalibrar (provavelmente subir o template scaffolding ou mover a competência para um estágio posterior).

**Resultado prático:** eu **não** afrouxo os `required`. Você **não** gera variante Zerado para toda competência Bloom 5–6 — algumas simplesmente não existem nesse eixo, e isso é doutrinalmente correto. O cubo é esparso por design, não por preguiça.

---

## Fechamento

Se Nucleo 01 aceitar o `learning_design_doc.yaml` e Nucleo 02 aceitar o `competency.yaml` como contratos canônicos da Fase 1, o pipeline fica:

```
Arquiteto: competency_catalog_v1.yaml + learning_design_doc.yaml (course)
   ↓
Nucleo 01: lesson_generator → spine + variants + lesson_metadata
   ↓
Nucleo 02: rubric-builder (consumindo competency.yaml) + agent-reviewer
   ↓
QA Review: pedagogical-gate-rubric (gate de banco via fn_validate_lesson_doctrine)
   ↓
Database: trigger BEFORE UPDATE em lessons.is_published exigindo review humano para Bloom ≥ 5
```

Cada seta acima é um schema YAML versionado em git. Nenhuma é prosa de Slack. Esse é o ponto.

DONE.
