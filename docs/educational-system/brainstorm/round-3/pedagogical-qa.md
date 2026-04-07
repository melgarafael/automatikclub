# Round 3 — Pedagogical QA dialogues

Dois diálogos pareados. Em ambos eu sou o quality gate que precisa colaborar sem virar o gargalo nem o teatro.

---

## Dialogue 1: → @Núcleo 01 (Audit ↔ Generation)

**Premissa do diálogo:** você gera em escala via LLM + spine-transformers; eu auditoo. O risco é eu virar checklist que mata voz, ou virar carimbador que aprova slop. Esta seção define exatamente onde eu sou rígido e onde sou flexível, com o objetivo de você prever 100% das minhas rejeições antes de submeter.

### Hard fail criteria (rejeição automática — meu rubric, sem julgamento humano)

Cada item abaixo é um critério executável do `pedagogical-gate-rubric` (Round 1) e roda como linter no seu `lesson-validator` antes de submissão. Se algum falhar, sua skill **não submete** — bloqueio em pre-commit, não na minha fila.

1. **`bloom_target` ausente, NULL, ou fora de [1..6].** Razão: Charter §2.1 obriga calibração Bloom. Sem isso, não há gate possível.
2. **`competencies_taught` vazio.** Razão: Charter §4.2. Lesson sem competência declarada é "conteúdo solto" (anti-padrão §1.3).
3. **`evidence_expected` ausente OU do tipo `quiz` quando `bloom_target ≥ 4`.** Razão: Bloom 4-6 não é verificável por múltipla escolha. Esta é a regra mais importante do meu rubric inteiro.
4. **`bloom_target ≥ 5` sem `pedagogical_consultant_id` declarado OU sem flag `requires_human_review=true`.** Razão: tua própria proposta Round 1 ("auto-rebaixar Bloom quando possível") cria o incentivo. Eu só formalizo: se você marcou alto, paga a fricção.
5. **`bloom_assessed_by_validator` (campo que pedi no Round 2) diverge em ≥2 níveis do `bloom_target` declarado.** Razão: sinal forte de inflação ou rotulagem cosmética. Não é rejeição de mérito — é "recalibre antes de me chamar".
6. **Mais de 1 conceito novo introduzido (Cognitive Load).** Tua própria regra do Round 1. Eu só executo o linter dela. Detecção: contagem de termos novos no glossário canônico que aparecem pela primeira vez na lesson.
7. **Variant gerada por `spine-transformer` sem `parent_spine_id` rastreável.** Razão: a herança de confiança que você propôs (Round 1: "QA automático trusted para variants quando spine foi aprovado") só funciona se eu conseguir provar a linhagem. Sem `parent_spine_id`, a variant é tratada como spine novo e exige review humana.
8. **Falta de pelo menos UMA das 4 fases Kolb visivelmente nomeada no markdown** (experiência / reflexão / conceito / experimentação). Aceito sequências fragmentadas — mas a lesson precisa declarar qual fase está cobrindo via frontmatter `kolb_phase` ou via heading nomeado.

**Total: 8 critérios objetivos.** Não 50. Não 200. Se tua skill passar nos 8, eu não tenho razão técnica pra rejeitar — só razão de julgamento (que é o item soft abaixo).

### Soft suggestions (não bloqueia, vira comment em `pedagogical_review_criteria` com `status='advisory'`)

1. **Densidade de exemplos por persona** — variant `Zerado` com menos de 2 analogias concretas é flag amarela, não vermelha. Sugestão pro próximo run, não rejeição.
2. **Comprimento de seção sem checkpoint Kolb** — se uma seção passa de 800 palavras sem marca de reflexão, sugiro quebrar. Não bloqueio.
3. **Vocabulário canônico (Charter Part VIII)** — se você escreve "bot" em vez de "agente", eu **não rejeito**. Eu marco. O gate de vocabulário é do `lesson-content-linter` do UI UX (concordamos no Round 2), não meu. Eu só cito a discrepância.
4. **CTA da lesson não amarra com `evidence_expected`** — sugiro alinhar, mas se você quiser CTA narrativo diferente, é decisão tua e do estilo autoral.
5. **Nível de scaffolding parece descalibrado pra persona declarada** — comentário, não veto. Tua decisão.

### Como preservar voz (concrete approach)

A regra mais importante é a que NÃO está nos 8 hard fails: **estilo, tom, vocabulário (exceto canônicos), ritmo narrativo, escolha de analogias, ordem das seções, humor, formato visual — tudo isso é tua decisão autoral e eu não tenho legitimidade pra reprovar.**

Operacionalmente:

- **Eu não comento sobre estilo no `feedback_md`.** Se eu sentir que "ficou estranho", eu engulo. Se eu não conseguir traduzir o desconforto em um dos 8 critérios objetivos, ele não vira feedback. Disciplina pessoal codificada.
- **Tua skill `lesson-generator` recebe meu `pedagogical-gate-rubric` como input** (8 critérios YAML) e roda localmente antes de submeter. Você nunca é surpreendido — meu gate é totalmente público. Surpresa = bug meu.
- **Variants derivadas de spine aprovado pulam revisão humana inteira** se passarem nos 8 critérios + tiverem `parent_spine_id` válido. Eu confio na raiz. Isso é o que protege tua vazão.
- **Auto-rebaixamento Bloom é incentivado, não penalizado.** Tua proposta Round 2 vira regra: gerar pra Bloom 3 quando o objetivo permite economiza review humana. Eu publico essa equação no rubric: cada nível Bloom acima do mínimo necessário = +1 reviewer humano obrigatório.
- **Anti-padrão "checklist mata criatividade" tem mitigação concreta**: a cada 50 lessons aprovadas, eu pego 5 amostras aleatórias e te mando: "destas, qual seria tua variante preferida sem o gate?" — se a tua resposta for sistematicamente diferente do que passou, o gate está enviesando estilo. Audit do auditor (que Backend Dev formalizou em Round 2 como `review_audits` table). Eu sou o problema, não você.

**Compromisso público:** se algum dia eu rejeitar uma lesson tua por motivo que não esteja nos 8 critérios + não esteja documentado em `pedagogical_review_criteria`, considera bug e me chama no Master Maestro. Sem cerimônia.

---

## Dialogue 2: → @Backend Dev (Review pipeline state machine)

**Premissa do diálogo:** você é dono dos gates técnicos (`publish_lesson`, advisory locks, append-only); eu sou dono da semântica de cada estado. Esta seção fecha a state machine completa, o protocolo de discordância agent↔human, e os triggers de escalation. Tudo precisa caber nas tuas funções `transition_review_status` e `publish_lesson`.

### State machine que proponho

Estados em `pedagogical_reviews.status`:

```
                    +---------+
                    | pending |
                    +----+----+
                         |
                         v  agent picks up
                    +----+------+
                    | in_review |
                    +-----+-----+
              fail  /     |     \  pass
                   /      |      \
                  v       |       v
       +----------------+ |  +-----------------+
       | needs_revision | |  | agent_approved  |
       +-------+--------+ |  +--------+--------+
               |          |           |
        author |   timeout|           | requires human?
        re-submits 4h     |           |
               |          v           v
               |   +-------------+  +----------------+
               +-->|  escalated  |  | human_in_review |
                   +------+------+  +--------+-------+
                          |                  |
               admin acts |        approve/reject
                          v                  v
                    +-----+-----+      +-----+-----+
                    | approved  |<-----| approved  |
                    +-----+-----+      +-----------+
                          |
                  publish_lesson()
                          |
                          v
                    +-----+------+
                    | published  |
                    +------------+
```

**Estados (8 totais):**

| Estado | Quem entra | Quem sai | Append-only? |
|---|---|---|---|
| `pending` | Núcleo 01 ao submeter | Agent reviewer (next pull) | yes — nova row |
| `in_review` | Agent ao puxar | Agent ao terminar | yes |
| `agent_approved` | Agent passou todos os 8 critérios hard | Função `requires_human()` | yes |
| `needs_revision` | Agent ou humano com `feedback_md` obrigatório (≥50 chars) | Núcleo 01 re-submetendo (volta pra `pending`) | yes |
| `human_in_review` | Quando `bloom_target ≥ 5` OU agent flagga ambiguidade | Reviewer humano | yes |
| `escalated` | Timeout 72h em `human_in_review` (ou 4h se Bloom 3-4) | `pedagogical_admin` | yes |
| `approved` | Reviewer humano aprovou OU agent_approved sem `requires_human()` | Função `publish_lesson()` | terminal |
| `rejected` | Reviewer humano rejeitou após ≥2 ciclos `needs_revision` | terminal — autor precisa abrir novo review | terminal |

**Regras críticas (todas como CHECK ou trigger no banco, não no app):**

1. **Append-only.** Cada transição = nova row em `pedagogical_reviews`. Nunca UPDATE de row anterior. Backend Dev já defendeu isso no Round 2 — eu confirmo do meu lado.
2. **Função `requires_human(review_id)` retorna TRUE se:** `lesson.bloom_target ≥ 5` OR `bloom_assessed - bloom_target ≥ 2` (calibration drift) OR `lesson.requires_human_review = true` (autor pediu) OR amostragem aleatória 5% (audit do auditor).
3. **`needs_revision` → `pending`** é a única transição que zera o contador de retries. Tudo o mais incrementa `retry_count` no review_chain (FK pra um `review_chain_id` agrupando todas as rows da mesma lesson).
4. **`publish_lesson()`** só aceita rows com `status='approved'` E `pedagogical_review_criteria` com **todos os 8 critérios hard = 'passed'**. Aprovação humana não bypassa os hard fails — humanos podem aprovar com critérios soft falhando, nunca com hard falhando.

### Disagreement protocol (agent vs human)

Cenários e resolução:

1. **Agent aprova → Human rejeita.** Rejection wins (regra do Backend Dev Round 1, eu reforço). A row `agent_approved` fica histórica; nova row `needs_revision` é criada com `feedback_md` do humano. **Importante para mim:** o sistema registra `agent_skill_slug + agent_version` na row do agent — entra na minha métrica `agent_human_agreement_rate` que dispara desativação automática do agent se cair abaixo de 80% por 30 dias (audit do auditor da Backend Round 2 — `review_audits` table).

2. **Human aprova → Agent rejeita depois (re-run).** Human wins **se já publicada**. Nova row `flagged_post_publish` (não estado, é tag) cria task pro `pedagogical_admin`. Não despublica automático — despublicar conteúdo ao vivo é decisão humana com aviso ao autor. Concordo 100% com Backend Round 1.

3. **Dois humanos discordam.** Não é voto majoritário. **Escala pro `pedagogical_admin`** (role definido pelo Security). Pedagogia não é democracia. Backend Dev disse isso no Round 1 e eu assino embaixo.

4. **Agent A aprova, Agent B (versão diferente) rejeita.** Cenário esperado quando temos múltiplos agent reviewers. Resolução: **mais conservador vence** (rejeição). Ambas as rows ficam registradas. Se isso virar padrão (>10% das lessons), os agents estão mal calibrados entre si — sinal de drift que dispara recalibração compartilhada via `bloom-calibrator` (skill do Núcleo 01/Arquiteto).

5. **Author contesta rejeição.** Não tem botão "appeal". Author re-submete via `needs_revision → pending` com nova versão respondendo ao feedback. Se rejeitar de novo, vai pro segundo ciclo. **Cap:** 3 ciclos `needs_revision` antes de transition forçada pra `rejected` (terminal). Aí vira escalation pro Master Maestro.

### Escalation triggers

Cinco gatilhos automáticos que viram row em `escalated` (visível pro `pedagogical_admin`):

1. **Timeout SLA por nível Bloom:**
   - Bloom 1-2 (agent only): 1h em `in_review` → escalation. Agent tá travado.
   - Bloom 3-4 (agent ou humano): 24h em `human_in_review` → escalation.
   - Bloom 5-6 (humano obrigatório): 72h em `human_in_review` → escalation.
   - **Não há auto-approve por timeout.** Backend Dev me corrigiu no Round 2 e eu cedi: SLA vira *escalation*, não bypass. Pressão social, não relógio rodando.

2. **Calibration drift:** se a métrica `agent_human_agreement_rate` cair abaixo de 80% nos últimos 30 dias para algum `agent_skill_slug`, escalation automática + desativação do agent até recalibrar via `bloom-calibrator` re-run.

3. **Backlog overflow:** se a fila `human_in_review` tiver > 20 itens por > 3 dias, escalation pro Master Maestro **e backpressure no `lesson_generator`** (Núcleo 01 Round 1 propôs, Backend Dev Round 2 formalizou como gate em `create_lesson_variant`). Eu acrescento: backpressure também me notifica — porque se eu sou o gargalo, preciso parar de aceitar variants e focar em drenar a fila humana.

4. **Retry loop:** lesson com 3 ciclos `needs_revision` em < 7 dias → escalation. Sinal de que ou o feedback não está claro ou o autor não está absorvendo. Pedagogical_admin decide: rejeitar terminal, mudar reviewer, ou ajustar feedback.

5. **Hard fail crítico em lesson já publicada:** se meu `pedagogical-drift-detector` (Round 1, semanal) reprovar uma lesson publicada nos hard fails, escalation imediata. Não despublica automático mas vira P0 do `pedagogical_admin`.

### Compromisso operacional comigo mesmo

- **Eu owno:** rubric (8 critérios), `requires_human()` policy, escalation triggers semânticos, `agent_human_agreement_rate` métrica, `pedagogical-drift-detector` semanal, audit do auditor.
- **Backend Dev owna:** `transition_review_status()`, `publish_lesson()`, advisory locks, append-only triggers, `review_chain_id`, RLS por reviewer_id, função `escalate_review()`.
- **Fronteira:** eu não escrevo SQL, ele não decide o que é Bloom 5. A interface entre nós é o JSON dos critérios + o slug dos estados.

DONE.
