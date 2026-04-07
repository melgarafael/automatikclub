# Round 3 — Assessment Engine dialogues

## Dialogue 1: → @Arquiteto (Bloom 5–6 → CBE rubrics para artefatos não-MCQ)

Arquiteto, seu R2 fechou três coisas que destravam meu trabalho de rubric: (a) catálogo de competências como YAML versionado em git com PR review (eu sou um dos 2 reviewers obrigatórios), (b) o spine vive em (Estágio 3, Organizado, Lógica) — ótimo centro de gravidade, vou calibrar minhas rubrics nessa célula primeiro, (c) Bloom inflation é detectada via `bloom_assessed ≠ bloom_target` no histórico de reviews. Aceito tudo. Topo também co-ownership de `revenue_milestones` — mas isso é assunto pra outro dialogue. Este aqui é sobre **como eu transformo seu YAML de competência em uma rubric que avalia n8n flow, script, ou proposta comercial sem virar checklist mecânico**.

---

### Estrutura de competency spec que aceito como input

Pra eu gerar rubric de qualidade, seu YAML não pode chegar como prosa. Preciso destes campos canônicos por entrada do catálogo (proposta concreta — você refina):

```yaml
- slug: comp-n8n-multi-step-webhook-orchestration
  title: "Orquestrar fluxo multi-etapa em n8n disparado por webhook"
  bloom_level: 6                       # Criar
  framework: empresa-ia-humanizada
  pillar: fluxo-trabalho-inteligente
  layer: logica
  stage_min: 3
  stage_max: 5
  prerequisites:
    - comp-n8n-webhook-trigger          # bloom 3
    - comp-http-request-auth-basic      # bloom 3
    - comp-decisao-fluxo-vs-polling     # bloom 5
  performance_task:
    intent: >
      O aluno recebe um caso real (lead chega via formulário,
      precisa qualificar, enriquecer dados, e rotear para
      vendedor humano ou bot conforme score) e PROJETA do zero
      o fluxo n8n que resolve.
    deliverable_kind: json_workflow     # do meu enum
    constraints:
      - "deve usar pelo menos 1 IF node ou Switch node"
      - "deve persistir estado em algum lugar (DB, sheet, ou memória do n8n)"
      - "não pode hardcodar credenciais"
    success_signal: >
      Quando executado contra o payload de teste fornecido,
      o fluxo produz output X em <30s sem erros.
  anti_patterns:
    - "copiar template pronto sem entender por que cada node existe"
    - "usar Code node pra tudo (Lógica vira Técnica disfarçada)"
    - "esquecer tratamento do caminho de erro"
  evidence_kinds_accepted:              # do meu enum
    - json_workflow
    - video                              # demo de 90s rodando
  reviewer_type_required: human          # bloom ≥ 5 sempre
```

Os campos críticos pra eu construir rubric: `bloom_level`, `performance_task.intent`, `performance_task.constraints`, `performance_task.success_signal`, `anti_patterns`. Sem `anti_patterns` minha rubric vira positiva-only e perde poder de discriminação. Sem `success_signal` eu não consigo escrever critério executável.

Regra dura: **se o YAML chega sem `performance_task` preenchido, eu rejeito a entrada do catálogo no PR review**. Bloom 5–6 sem performance task = decoração.

---

### Rubric template para Bloom 6 (Criar)

Bloom 6 ("Criar") mede **decisão de design + execução + reflexão sobre trade-offs**. Não é "fez funcionar" — é "fez funcionar PORQUE escolheu X em vez de Y conscientemente". Minha estrutura de rubric Bloom 6 tem **4 dimensões fixas + N critérios específicos da competência**:

```yaml
rubric:
  competency_slug: comp-n8n-multi-step-webhook-orchestration
  bloom_target: 6
  template: bloom-6-create-v1
  passing_threshold: 75                  # de 100
  dimensions:

    - name: "Funcionamento (does it work?)"
      weight: 30
      kind: binary_then_quality
      criteria:
        - id: F1
          check: "Workflow executa contra payload de teste sem erro"
          levels:
            - score: 0  label: "Falha na execução"
            - score: 30 label: "Executa parcialmente (algum branch)"
            - score: 100 label: "Executa todos os branches do success_signal"

    - name: "Decisão de Design (why this shape?)"
      weight: 35
      kind: justified
      criteria:
        - id: D1
          check: "Aluno justifica por que escolheu webhook vs polling"
          requires_artifact: text_reflection
          levels:
            - 0: "Sem justificativa"
            - 50: "Justificativa rasa (\"é mais rápido\")"
            - 100: "Justificativa que compara trade-offs (latência, custo, complexidade) com o caso de negócio"
        - id: D2
          check: "Aluno justifica a escolha de IF vs Switch vs Code"
          requires_artifact: text_reflection
          levels:
            - 0: "Não menciona alternativas"
            - 100: "Compara pelo menos 2 alternativas e ancora a escolha no caso"

    - name: "Robustez (what happens when it breaks?)"
      weight: 20
      kind: presence
      criteria:
        - id: R1
          check: "Tratamento explícito do caminho de erro (Error Trigger ou ramo de erro no Switch)"
          levels: [0: ausente, 100: presente e plausível]
        - id: R2
          check: "Credenciais via Credentials do n8n, não hardcoded no node"
          levels: [0: hardcoded, 100: via credentials]

    - name: "Reflexão sobre anti-patterns (did you avoid them?)"
      weight: 15
      kind: anti_pattern_check
      criteria:
        - id: A1
          check: "Não usa Code node como muleta para lógica que cabe em nodes nativos"
          source_artifact: json_workflow
          levels: [0: code-only, 50: misto, 100: nodes nativos onde possível]
        - id: A2
          check: "Aluno identifica em texto pelo menos 1 anti-pattern do catálogo que evitou"
          requires_artifact: text_reflection
          levels: [0: ausente, 100: identificado e justificado]

  reviewer_instructions:
    agent_phase:
      enabled: true
      role: "Pré-screening dimensional Funcionamento + Robustez (auto-checáveis)"
      cannot_pass_alone: true            # bloom ≥ 5 → human always
    human_phase:
      enabled: true
      role: "Validar dimensões Decisão e Reflexão; arbitrar discrepâncias do agent"
      sla_hours: 72
```

**Princípios do template Bloom 6 que vou defender:**

1. **Sempre 4 dimensões: Funcionamento + Decisão + Robustez + Reflexão.** Sem Decisão e Reflexão, a rubric está medindo Bloom 3 (Aplicar), não 6.
2. **Decisão e Reflexão exigem `text_reflection` artifact** — o aluno escreve, não só sobe o JSON. É o que separa "fez funcionar copiando" de "criou conscientemente".
3. **Agent reviewer cobre Funcionamento + Robustez** (são auto-checáveis: parsing do JSON, regex em credentials). **Humano cobre Decisão + Reflexão** (são semânticos). Divisão de trabalho explícita reduz custo de LLM e respeita o limite real do agent.
4. **Pesos não são iguais.** Decisão pesa mais (35) que Funcionamento (30) em Bloom 6 — é exatamente o que distingue Criar de Aplicar. Em Bloom 5 (Avaliar) eu invertia: Funcionamento 20, Decisão 45.
5. **Anti-patterns viram critério positivo** ("evitou X"), não negativo ("não fez Y"). Forçar o aluno a *nomear* o anti-pattern que evitou é o que cria metacognição (Kolb reflexão).

---

### Exemplo concreto: rubrica para uma competência de criar n8n flow

A rubric do bloco anterior já é o exemplo concreto pra `comp-n8n-multi-step-webhook-orchestration` (Bloom 6). Pra fechar o exemplo, aqui está como ela é **aplicada** em um attempt real:

```yaml
attempt_id: att_01HXYZ...
user_id: usr_alice
competency_id: comp-n8n-multi-step-webhook-orchestration
assessment_id: asmt_n8n_webhook_v1
submitted_at: 2026-04-12T22:14:00Z
artifacts:
  - kind: json_workflow
    sha256: 3f9a...
    uri: storage://attempts/att_01.../workflow.json
  - kind: video
    duration_s: 87
    uri: storage://attempts/att_01.../demo.mp4
  - kind: text_reflection
    content: |
      Escolhi webhook em vez de polling porque o lead precisa
      entrar no funil em <10s — polling de 1min mataria a
      conversão. Considerei polling como fallback se o webhook
      falhar, mas decidi não implementar agora porque adiciona
      complexidade que ainda não é necessária (stage 3).
      Usei IF em vez de Switch porque só tenho 2 caminhos
      (qualifica/descarta) — Switch seria over-engineering.
      Anti-pattern que evitei: estava tentado a colocar a
      qualificação dentro de um Code node, mas isso esconderia
      a lógica de quem fosse manter.

agent_review:                            # F1, R1, R2, A1
  reviewer: skill:agent-reviewer-v1
  scores:
    F1: 100   # Executou contra payload, output bate
    R1: 100   # Tem ramo de erro
    R2: 100   # Credentials via cofre do n8n
    A1: 100   # Nenhum Code node
  partial_score: 50/50 (das dimensões cobertas pelo agent)
  flag_for_human: false
  cost_tokens: 3.2k_in / 0.8k_out

human_review:                            # D1, D2, A2
  reviewer: usr_carlos_mentor
  scores:
    D1: 100   # Justificativa compara trade-offs (latência × complexidade × stage)
    D2: 50    # Compara IF vs Switch (bom) mas não menciona Code (incompleto)
    A2: 100   # Identificou anti-pattern do Code node
  comment_md: |
    Decisão D2 ficou pela metade — você justificou IF vs Switch
    bem, mas não falou sobre por que NÃO usou Code, mesmo tendo
    mencionado ele no anti-pattern. Da próxima inclui Code na
    comparação explícita.
  sla_used_hours: 41

final_score:
  Funcionamento: 30/30
  Decisão:       26.25/35    # (D1=100*0.5 + D2=50*0.5) * 35/100
  Robustez:      20/20
  Reflexão:      15/15
  total:         91.25
status: passed                            # ≥ 75
promotes_competency: true
```

E aqui é onde minha `fn_promote_competency()` entra: ela checa que `human_review` existe (porque bloom ≥ 5), que `final_score ≥ passing_threshold`, e só então grava `user_competency_progress.status='approved'` + `bloom_demonstrated=6` + `evidence_submission_id=att_01HXYZ...`.

---

### Limitações honestas

Arquiteto, quero ser brutal aqui — algumas coisas a rubric **não consegue** medir bem, e fingir que consegue é o caminho mais rápido pro sistema mentir:

1. **Originalidade real / criatividade.** Se dois alunos sobem o mesmo JSON copiado de um template público, minha rubric aprova ambos com nota alta no Funcionamento e moderada na Decisão (a justificativa pode ser sincera mesmo com solução copiada). Não consigo detectar plágio confiavelmente sem similarity search contra um corpus, e mesmo assim só pego cópias literais. **Mitigação parcial:** o `text_reflection` força articulação pessoal, e o human reviewer pode pedir live demo síncrona se cheirar a cópia. Mas é mitigation, não solução.

2. **"Faz sentido pro negócio do aluno"** (Maestria real). A rubric mede se o fluxo funciona e se a justificativa é coerente — não se ele resolve um problema *que o aluno realmente tem*. Camada Maestria do Charter §2.2 fala em "evolução com sensibilidade estratégica" — isso só é avaliável quando o evidence inclui contexto de negócio real (cliente real, dor real, métrica de impacto). Pra Bloom 6 dentro de Camada Maestria eu vou exigir um campo extra `business_context_md` no evidence — sem isso, certifico Lógica, não Maestria.

3. **Trade-offs subjetivos com múltiplas respostas certas.** "Webhook vs polling" tem resposta defensável dos dois lados em alguns contextos. Minha rubric pontua *qualidade da justificativa*, não *correção da escolha*. Isso é honesto pedagogicamente mas é um vetor de inconsistência inter-rater entre humanos. **Mitigação:** calibração inter-rater periódica (proposta do QA Review) — se dois mentores dão notas muito divergentes pra mesma submission, é sinal de que o critério está mal escrito, não que um dos dois está errado.

4. **Soft skills da Negociação** (3 Cs — capturar/entregar valor com cliente). Quando a competência envolve "fechou uma proposta com cliente real", a evidência é um contrato/comprovante e a rubric vira essencialmente binária ("aconteceu ou não"). Aqui eu não tenho rubric — tenho `revenue_milestones` (sua lacuna do R2, que eu co-owno). Reconheço explicitamente: Bloom 6 da Negociação não é avaliado por rubric, é avaliado por **acontecimento factual no mundo**. Rubric pedagógica e gate de Kirkpatrick 4 são ferramentas distintas; eu não vou forçar uma a fazer o trabalho da outra.

5. **Cognitive load real do aluno durante a tarefa.** Não consigo medir se o aluno sofreu, travou, googlou 200 vezes ou fez sozinho. Ferramenta de telemetria de processo (tempo no editor, número de runs) seria invasiva e provavelmente abandonada pelo Autodidata. Aceito como ponto cego — Kolb experimentação ativa é avaliada pelo *resultado*, não pelo *processo*.

**Resumo da limitação geral:** rubric Bloom 6 mede competência demonstrada no artefato + reflexão articulada. Ela **não** mede originalidade, não mede contexto de negócio sem campo explícito, não mede processo, e não substitui Kirkpatrick 4. Se você (Arquiteto) quiser cobrir essas zonas, precisamos ou de ferramentas adicionais (similarity search, contexto de negócio obrigatório, `revenue_milestones`) ou aceitar que algumas competências do catálogo precisam ser **decompostas** em sub-competências menores que sejam rubric-able. Eu prefiro decompor.

**Pedido final:** topa que toda entrada do catálogo com `bloom_level >= 5` passe por um check meu no PR — eu valido que `performance_task` está completo o suficiente pra eu conseguir gerar a rubric? Sem esse gate inverso (você revisando meu seed, eu revisando seu catálogo), a gente vai descobrir só na hora de gerar o assessment que a competência foi escrita de um jeito que não dá pra avaliar, e isso vai virar retrabalho recorrente.

**DONE.**
