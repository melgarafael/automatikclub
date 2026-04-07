# Round 3 — Content Production dialogues

**Terminal:** Nucleo 01 (Content Production)
**Pares:** @Arquiteto (Instructional Design), @QA Review (Pedagogical QA)

---

## Dialogue 1: → @Arquiteto (Curriculum→Content handoff)

Arquiteto, no Round 2 você confirmou (a) que o spine canônico vive em (Estágio 3, Organizado, Lógica) — aceito como centro de gravidade, e (b) que o catálogo de competências será YAML versionado em git com 2 reviewers. Perfeito. Agora preciso fechar **o que exatamente você me entrega por lesson** pra eu gerar sem improvisar.

### Estrutura mínima que preciso de input

Um arquivo YAML por lesson chamado `lesson_design_doc` (LDD), produzido por você antes do meu gerador rodar. Schema mínimo (campos NOT NULL todos):

```yaml
# IDENTIDADE
ldd_id: ldd-empresa-ia-fluxo-01-webhook-trigger
track_slug: empresa-com-ia-humanizada
course_slug: pilar-1-fluxo-de-trabalho-inteligente
module_slug: gatilhos-de-automacao
lesson_slug: webhook-trigger-no-n8n
position_in_module: 3

# BACKWARD DESIGN — o "porquê" antes do "o quê"
desired_outcome: |
  Ao final desta lesson, o aluno consegue receber um webhook
  externo no n8n, extrair um campo do payload, e usar esse campo
  numa decisão condicional do fluxo.
performance_task_seed: |
  Configure um webhook no n8n que, ao receber um POST com
  {"status":"paid"}, dispare um node de notificação. Submeta
  o JSON do workflow exportado.

# CBE — competência e evidência
competencies_taught:
  - competency_slug: comp-n8n-webhook-receive
    weight: primary       # primary | secondary
    bloom_target: 3       # nível Bloom desta lesson para esta competência
  - competency_slug: comp-n8n-conditional-node
    weight: secondary
    bloom_target: 2
evidence_expected:
  type: json_workflow     # json_workflow|video|url|file|text|quiz
  format: n8n_export_v1
  min_requirements:
    - "contém ao menos 1 Webhook node"
    - "contém ao menos 1 IF node referenciando body do webhook"
  validation_hint: "campo $json.body.status é referenciado pelo IF"
  reviewer_default: agent  # bloom <= 4 → agent OK; bloom >= 5 → human

# COGNITIVE LOAD — orçamento da lesson
cognitive_load_budget:
  intrinsic_minutes: 8        # carga necessária máxima
  new_concepts_max: 1         # ÚNICO conceito novo permitido
  prerequisite_concepts:      # devem JÁ ter sido vistas
    - comp-n8n-basic-navigation
    - comp-http-methods-basic

# KOLB — qual fase do ciclo esta lesson cobre
kolb_phase: experimentation   # experience|reflection|concept|experimentation
kolb_predecessor_lesson: ldd-empresa-ia-fluxo-01-webhook-concept

# CUBO 3D — escopo de variantes a gerar
target_cells:
  - { stage: 2, persona: organizado, layer: logica }   # SPINE (sempre obrigatório)
  - { stage: 2, persona: zerado, layer: tecnica }      # variante prioritária
  - { stage: 2, persona: autodidata, layer: logica }   # variante prioritária

# VOZ E CONSTRAINTS NARRATIVOS (do Arquiteto, não do gerador)
methodology_context:
  framework: empresa-ia-humanizada
  pillar: 1-fluxo-trabalho-inteligente
  step_in_framework: null
canonical_vocabulary_must_use:
  - "agente humanizado"      # NÃO "bot", NÃO "assistente virtual"
  - "fluxo de trabalho"      # NÃO "automação genérica"
forbidden_terms: ["bot", "robô", "IA mágica"]

# ANCHOR CONCEPTS — semente compartilhada com Núcleo 02
anchor_concepts:
  - concept: "webhook como porta de entrada do fluxo"
    bloom_target: 2
  - concept: "diferença entre polling e webhook"
    bloom_target: 4
  - concept: "extração de campo via expressão $json"
    bloom_target: 3
```

**Por que cada bloco existe:**
- `desired_outcome` + `performance_task_seed` → ancora Backward Design no input. Sem isso, eu posso (vou) inverter pra forward.
- `competencies_taught` com `bloom_target` por competência → me permite escolher verbo-âncora correto e proibe "Bloom inflation".
- `evidence_expected` → contrato com Núcleo 02. Mesmo schema. Um YAML, dois consumidores.
- `cognitive_load_budget` → me dá número duro pra rejeitar meu próprio output se exceder.
- `kolb_phase` + `kolb_predecessor_lesson` → me deixa NÃO repetir o ciclo inteiro em cada lesson; permite que eu produza só "experimentação ativa" sabendo que "conceito" foi outra lesson.
- `target_cells` → resolve a explosão combinatória. Você decide quais células priorizar; eu não invento 54.
- `canonical_vocabulary_must_use` + `forbidden_terms` → vocabulário canônico (Charter Part VIII) vira input executável, não nota de rodapé.
- `anchor_concepts` → semente compartilhada com Núcleo 02. Mesma fonte, dois geradores.

### Exemplo concreto que eu aceitaria

O bloco YAML acima é o exemplo. Se você me entregar exatamente isso, meu `lesson-generator` consegue rodar sem fazer perguntas. O output dele será:
- 1 `lesson_spine_md` (Estágio 2, Organizado, Lógica) — escrito a mão pelo prompt-engineer dentro do gerador.
- 2 `lesson_variants` derivadas via `spine-transformer(persona=zerado, layer=tecnica)` e `spine-transformer(persona=autodidata, layer=logica)`.
- 3 rows em `pedagogical_reviews(status='pending', reviewer_type='agent')`.
- 1 row em `lesson_generator_runs(prompt_version, model, ldd_id, tokens, cost)`.

### O que rejeito (input shapes que causam slop)

1. **"Faz uma aula sobre webhook no n8n."** Briefing em prosa livre. Sem `desired_outcome`, sem `bloom_target`, sem `evidence_expected`. Forward design disfarçado. Meu gerador retorna `ERROR: missing LDD fields [desired_outcome, competencies_taught, evidence_expected]`.

2. **`bloom_target: 5` numa lesson cujo `evidence_expected.type: quiz`.** Contradição estrutural — Bloom 5 (Avaliar) não é demonstrável por múltipla escolha. Rejeito no validador antes de gastar token. Você marca alto, eu te devolvo a contradição.

3. **`competencies_taught` vazio ou com `bloom_target` ausente.** Lesson sem competência declarada é o anti-padrão do Charter §1.3. Rejeito.

4. **`cognitive_load_budget.new_concepts_max > 1`.** Mais de um conceito novo por lesson viola Sweller. Você quer 2 conceitos? São 2 lessons. Eu não negocio carga intrínseca.

5. **`target_cells` contendo 54 entradas.** Se você listar tudo, eu listo o custo estimado em USD e devolvo a você pra priorizar. Não vou gerar 54 spines pra você decidir depois.

6. **LDD sem `kolb_phase`.** Eu não sei se devo escrever o ciclo inteiro ou uma fase. Sem isso, eu invento — e Kolb vira decoração. Rejeito.

7. **Vocabulário não declarado.** Se o `canonical_vocabulary_must_use` está vazio, eu cuspo "bot" e "assistente" porque o LLM tende ao default. Vocabulário canônico não é opt-in; é parte do LDD ou rejeição.

**Pedido final ao Arquiteto:** publica o `competency catalog v1` e o `LDD template v1` como duas stories bloqueantes da Fase 1. Minha epic depende literalmente destes dois arquivos pra existir. Sem eles, meu sub-epic 10 não tem input.

---

## Dialogue 2: → @QA Review (Generation ↔ Quality)

QA, no Round 2 você endossou minha "herança de confiança" do spine + transformers (com a condição de eu te entregar um `lesson-validator` co-desenhado), e propôs que avaliabilidade vire **critério dentro do seu rubric**, não review separada. Aceito ambos. Agora vamos cravar **o que é hard fail e o que é soft suggest**, porque é aí que eu paro de ter medo de você virar o que mata o sistema.

### Onde QA deve ser rígido (hard fail) — bloqueia publicação

Estes 8 critérios são objetivos, automatizáveis, e meu próprio `lesson-validator` roda eles antes de submeter:

1. **`lesson_competencies` ≥ 1 com `bloom_target` declarado.** Sem competência declarada, lesson não existe pra CBE. Razão: anti-padrão #2 do Charter §1.3.

2. **`evidence_expected` presente, com `type` no enum válido.** Sem evidência, não há gate CBE. Razão: §4.2 do Charter exige `evidence_url` no progresso — sem `evidence_expected` no design, o aluno submete o quê?

3. **Bloom 5–6 ⇒ `evidence_expected.type ≠ quiz`.** Quiz não certifica "Avaliar" ou "Criar". Razão: §2.1 + sua regra Round 1 ("inverte o incentivo: marcar alto = mais fricção"). Quero que seja você quem barra isso, não eu — porque o gate deve ser externo ao gerador.

4. **`kolb_phase` declarado e coerente com a estrutura do `script_md`.** Se a lesson diz `kolb_phase: experimentation` mas o script é 80% texto expositivo sem prática, hard fail. Razão: Kolb não pode ser label.

5. **`cognitive_load_budget.new_concepts_max ≤ 1` E o script respeita.** Conta de conceitos novos via grep estrutural (cabeçalhos `## Conceito novo:`). Razão: Sweller, Charter §2.1.

6. **Vocabulário canônico: zero ocorrências de `forbidden_terms`.** Razão: consistência multi-professor — Round 1 do Lesson Experience.

7. **Bloom 5–6 ⇒ `pedagogical_reviews.reviewer_type='human' AND status='approved'` antes de publicar.** Razão: sua própria regra Round 1.

8. **`prompt_version` do `lesson_generator_runs` registrado.** Sem rastreabilidade do prompt que gerou, não há rollback possível. Razão: minha lacuna do Round 2.

Estes 8 viram a `pedagogical-gate-rubric` v1 que você propôs. **Eu quero escrever a primeira versão dos 8 e você refina** — alinhado com o pedido do Arquiteto a você no Round 2.

### Onde QA deve ser flexível (soft suggest) — comenta, não bloqueia

Estes 6 são subjetivos. Você comenta no `pedagogical_reviews.feedback_md`, eu (ou o autor humano) decide se mexe:

1. **Tom de voz / cadência narrativa.** "A intro está fria" → suggest. Por quê: tom é responsabilidade do `spine-transformer(persona)` + da camada determinística do Lesson Experience (fonte, velocidade, microcopy de chrome). QA não é editor de texto.

2. **Escolha de exemplo.** "Esse exemplo seria mais forte com Stripe ao invés de Mercado Pago" → suggest. Por quê: exemplo é decisão autoral; o que importa é se o exemplo ensina a competência, não qual exemplo é "melhor".

3. **Ordem das seções dentro de uma fase Kolb.** "A reflexão fica melhor antes da prática aqui" → suggest. Por quê: dentro de uma fase Kolb, a ordem é estilo. Entre fases, é doutrina (hard).

4. **Comprimento da lesson dentro do `cognitive_load_budget`.** "Está em 7min, dá pra esticar pra 9" → suggest. Por quê: o budget é teto, não meta.

5. **Quantidade de analogias.** "Adiciona uma analogia aqui pro Zerado" → suggest. Por quê: o `transformer_persona(zerado)` já injeta analogias; QA pode pedir mais, mas se o transformer foi rodado, não há fail.

6. **Nomenclatura de variáveis nos exemplos de código.** "Renomeia `data` pra `payload`" → suggest. Por quê: variável bem nomeada é higiene, não doutrina.

### Anti-padrão a evitar — "checklist que mata a voz"

Você temia no Round 1 que "good lesson" virasse 200 itens defensivos. Eu temia no Round 1 que a doutrina virasse decoração. Os dois medos têm a mesma cura: **contar critérios e proibir crescimento sem justificativa.**

Regras concretas que proponho pra Fase 1:

1. **Cap rígido: 8 hard fails. Sempre.** Se você quiser adicionar um 9º, tem que tirar um. Sem isso, em 6 meses são 30 e meu gerador escreve defensivamente "pra passar no checklist", não pra ensinar.

2. **Cada hard fail aponta pra UMA seção do Charter.** Se um critério não tem âncora canônica, ele não é hard fail. Vira suggest. Isso impede critérios "porque eu acho".

3. **Toda rejeição vem com `actionable_fix_md`.** Você não pode rejeitar dizendo "pedagogicamente fraco". Tem que dizer "competency `comp-n8n-webhook-receive` declarada com `bloom_target: 5` mas evidência é quiz; mude pra json_workflow OU rebaixe Bloom pra 3". Isso já está alinhado com sua proposta de "rubric público, sem vibes".

4. **Suggest é texto livre, mas aparece num campo separado** (`pedagogical_reviews.suggestions_md`, não `feedback_md`). UI mostra suggest em cinza, hard fail em vermelho. O autor humano vê a diferença visual.

5. **Inter-rater agreement (sua proposta Round 2) também roda contra mim como autor.** Se 80% das suggests viram aceitas pelo autor humano, você está calibrado. Se 30%, suas suggests viram ruído e a gente recalibra a sua rubric. Você se auditoria, eu me auditoo, ninguém é sagrado.

6. **Anti-decoração explícita:** o validator nunca tem critério "tem badge de Kolb visível" — só "a estrutura cumpre Kolb". Decoração visual é Lesson Experience, não QA. Mantém suas mãos longe de estilo.

**A regra que resume tudo:** *QA é estrito sobre OUTCOMES (a lesson certifica a competência declarada?), flexível sobre FORMA (como o autor conta a história?).* Você disse isso no Round 1 com outras palavras ("strict on outcomes, loose on style"). Eu te seguro nessa promessa: se 6 meses depois sua rubric tiver 30 itens e metade for sobre forma, eu vou puxar este documento.

---

## Fechamento

Os dois diálogos têm um eixo comum: **eu só consigo gerar sem slop se o input for executável e o gate for objetivo**. Arquiteto me dá o LDD estruturado; QA me dá os 8 hard fails ancorados no Charter. Entre os dois, meu gerador não tem espaço pra improvisar Bloom, inventar competência, ou cuspir vocabulário errado. E mais importante: nenhum dos dois precisa revisar tom, exemplo ou ritmo — porque o spine + transformers já cuida disso, e a camada determinística do Lesson Experience cuida do resto.

Se Arquiteto entregar o LDD template + competency catalog v1 na Fase 1, e QA entregar a `pedagogical-gate-rubric` com exatamente 8 itens na Fase 1, meu sub-epic 10 destrava e eu posso prometer geração em escala sem virar fábrica de slop. Sem esses dois artefatos, eu paro — e isso já está combinado.

DONE.
