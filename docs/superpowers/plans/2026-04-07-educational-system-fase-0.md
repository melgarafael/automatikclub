# Educational System — Fase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the AutomatikLabs Educational System Fase 0 by creating the canonical Charter, the `automatiklabs-doctrine` skill, and initializing the four Maestri sticky notes — all in a single git commit on `develop` (no push).

**Architecture:** Hub-and-Spoke. The Charter (in the AutomatikLabs repo) is the single source of pedagogical truth. The `automatiklabs-doctrine` skill (in `~/.claude/skills/`) is a thin loader that points to the Charter. The four sticky notes are live projections of Charter slices used by Maestri workers.

**Tech Stack:** Markdown documentation, Claude Code skill format, `maestri` CLI for sticky notes, `git` for versioning.

**Reference spec:** `docs/superpowers/specs/2026-04-07-educational-system-fase-0-design.md`

---

## Pre-flight verification

- [ ] **Step P1: Confirm git branch is `develop` and working tree state**

Run: `git status --short && git branch --show-current`
Expected: branch is `develop`. Existing modified/untracked files (UI marketing edits, screenshots) are OK — they are unrelated and stay untouched.

- [ ] **Step P2: Confirm `maestri` CLI is available**

Run: `maestri list`
Expected: lists 12 connected agents and 4 connected notes (some named `untitled-*`).

- [ ] **Step P3: Confirm spec file exists**

Run: `ls docs/superpowers/specs/2026-04-07-educational-system-fase-0-design.md`
Expected: file exists.

---

## Task 1: Create canonical Charter

**Files:**
- Create directory: `automatiklabs/docs/educational-system/`
- Create file: `automatiklabs/docs/educational-system/CHARTER.md`

This task creates the **canonical** Charter inside the AutomatikLabs app. The mirror in `docs/superpowers/specs/` is created in Task 2.

The Charter has 8 parts. Each step below writes one part by appending to the file. Step 1.1 creates the file with the title and Part I; subsequent steps append.

- [ ] **Step 1.0: Create the directory**

Run: `mkdir -p automatiklabs/docs/educational-system`
Verify: `ls -d automatiklabs/docs/educational-system`
Expected: directory exists.

- [ ] **Step 1.1: Write file header + Part I (Propósito)**

Use the Write tool to create `automatiklabs/docs/educational-system/CHARTER.md` with the following content:

```markdown
# AutomatikLabs Educational System — Charter

**Status:** Canonical · **Phase:** 0 (foundation) · **Last update:** 2026-04-07
**Mirror:** `docs/superpowers/specs/2026-04-07-educational-system-charter.md`
**Companion skill:** `automatiklabs-doctrine` (in `~/.claude/skills/`)

This document is the single source of pedagogical truth for the AutomatikLabs Educational System. All terminals, agents, skills, and workers operating in this domain MUST treat the Charter as authoritative. Mutations require an explicit commit and a re-sync of the companion skill and the Maestri sticky notes.

---

## Part I — Propósito

### 1.1 Norte verdadeiro

Formar pessoas capazes de **pensar** (lógica de automação e IA), **criar** com liberdade (sem copiar receitas) e **monetizar** o que criam (serviços ou produtos próprios).

### 1.2 Definição de sucesso

O sistema é avaliado pelo nível 4 de Kirkpatrick: **renda real gerada pelo aluno** após passar pela jornada. Horas assistidas, aulas concluídas e quizzes respondidos são instrumentação intermediária — não definição de sucesso.

### 1.3 Anti-padrões (o que NÃO somos)

- **Curso de horas assistidas** — progresso por tempo de vídeo é sinal fraco.
- **Conteúdo solto sem trilha** — aulas sem competência declarada não entram.
- **Ensino genérico** — todo conteúdo é calibrado por estágio + persona + camada de maestria.
- **Doutrina implícita** — toda decisão pedagógica vive aqui ou na skill `automatiklabs-doctrine`.
- **Free Content Hub** — pipeline separado, não confundir com este sistema.
```

Verify: `wc -l automatiklabs/docs/educational-system/CHARTER.md`
Expected: ~30 lines.

- [ ] **Step 1.2: Append Part II (Doutrina Pedagógica) — frameworks classics**

Use the Edit tool to append after the Part I block. Add:

```markdown

---

## Part II — Doutrina Pedagógica

### 2.1 Frameworks clássicos adotados

| Framework | Função no sistema | Fonte |
|---|---|---|
| **Backward Design** | Espinha. Toda trilha começa pelo resultado mensurável e é montada de trás pra frente. | Wiggins & McTighe — *Understanding by Design* |
| **Bloom's Taxonomy** | Calibra a profundidade cognitiva de cada objetivo. Trilhas devem culminar nos níveis 5 (Avaliar) e 6 (Criar). | Bloom et al. (1956), revisão de Anderson & Krathwohl (2001) |
| **Competency-Based Education (CBE)** | O aluno avança por **evidência demonstrável**, não por tempo. Substitui "completou aula" por "demonstrou competência". | CBEN consortium |
| **Cognitive Load Theory** | Limita a carga por aula. Distingue carga intrínseca (necessária), extrínseca (ruído) e germana (consolidação). | Sweller (1988+) |
| **Kolb Experiential Cycle** | Cada conceito tem 4 momentos: experiência → reflexão → conceito → experimentação. | Kolb (1984) |
| **Kirkpatrick Four Levels** | Avaliação em 4 camadas: Reação · Aprendizagem · Comportamento · Resultado (renda). | Kirkpatrick (1959), revisão (2016) |

**Regra dura:** nenhuma trilha pode ser considerada "completa" sem mapear cada objetivo a um nível Bloom e cada lesson a pelo menos uma competência.
```

Verify: `grep -c "^### " automatiklabs/docs/educational-system/CHARTER.md`
Expected: at least 4.

- [ ] **Step 1.3: Append Part II — proprietary methodologies**

Use the Edit tool to append after the Part 2.1 block. Add:

```markdown

### 2.2 Metodologias proprietárias canônicas

Estas são as metodologias desenvolvidas internamente pela AutomatikLabs e elevadas a status canônico. Cada uma será futuramente extraída para uma skill atômica dedicada (`tres-camadas-maestria`, `empresa-ia-humanizada`, etc.) — Fase 0 apenas as canoniza aqui.

#### 3 Camadas da Maestria
Ladder de profundidade da automação:
1. **Técnica** (⚙️ Ferramenta) — saber mexer nas ferramentas (n8n, MiniChat, Z-API…).
2. **Lógica** (🔗 Estruturação) — pensar como arquiteto, conectar fluxos com intenção.
3. **Maestria** (🧠 Otimização com visão) — entender o negócio, enxergar onde a automação gera valor real, evoluir com sensibilidade estratégica.

> "A maestria não é o fim. É a constância do ajuste com clareza."

#### Empresa com IA Humanizada — 3 Pilares
1. **Fluxo de Trabalho Inteligente** — mapeamento estratégico dos fluxos que a automação seguirá.
2. **Treinamento dos Agentes Humanizados** — identidade, ferramentas e decisões empáticas.
3. **Emaranhamento de Possibilidades** — integração de múltiplos agentes formando setores autônomos.

#### 7 Passos do Script de Vendas Conversacional
Framework para scripts de agentes conversacionais de vendas. (Detalhamento completo virá da skill atômica `7-passos-script-vendas` na Fase 2.)

#### 3 Cs da Monetização
- **Criar valor** · **Capturar valor** · **Entregar valor**
Espinha das trilhas de negócio (estágios 3–6 da jornada).

#### Jornada de Consciência 7 Fases
Mapa do nível de consciência do lead para copywriting e marketing dentro da plataforma. (Detalhamento na skill `jornada-consciencia-7-fases`.)

### 2.3 Princípio unificador

> **Toda Formação ensina três coisas: o Método, a Construção e a Negociação.**

- **Método** = "Empresa com IA Humanizada"
- **Construção** = "3 Camadas da Maestria" (Técnica + Lógica) + recursos/estrutura/solução
- **Negociação** = "3 Cs" (Criar, Capturar, Entregar valor)

Toda Formação que sai do sistema deve cobrir os três. Nenhuma exceção.
```

Verify: `grep -c "^#### " automatiklabs/docs/educational-system/CHARTER.md`
Expected: 5.

- [ ] **Step 1.4: Append Part III (Modelo de Aluno)**

Use the Edit tool to append after the Part 2.3 block. Add:

```markdown

---

## Part III — Modelo de Aluno

### 3.1 Os 6 Estágios da Jornada

| # | Nome | Estado mental | Necessidade central |
|---|---|---|---|
| 1 | Primeiros Passos e Superação de Incertezas | Travado, inseguro, "por onde começo?" | Pequenas vitórias visíveis + suporte humano |
| 2 | Explorando as Possibilidades | Curioso, ansioso, "consigo aplicar?" | Mentoria, casos reais, escolha de ferramentas |
| 3 | Aplicação Inicial e Primeiras Vitórias | Inseguro mas progredindo, "posso cobrar?" | Precificação, escolha de nicho, propostas |
| 4 | Escalando para Mais Vendas e Estabilidade | Determinado, "como vender de forma consistente?" | Geração de leads, processos replicáveis, objeções |
| 5 | Consolidação e Aumentando o Escopo | Sobrecarregado, "como delegar sem perder qualidade?" | Automação dos próprios processos, mentoria de escala |
| 6 | Expansão, Autoridade e Estabelecimento | Estável, "como me tornar referência?" | Marca pessoal, parcerias, modelo menos dependente |

### 3.2 As 3 Personas Cognitivas

| Persona | Como aprende | Ritmo | Suporte preferido |
|---|---|---|---|
| **Zerado** | Precisa de aulas didáticas, devagar, do básico | Lento | Acompanhamento próximo, validação constante |
| **Autodidata** | Pula aulas, vai direto ao ponto, pega só o que precisa | Rápido, salteado | Acesso livre, índice claro, sem hand-holding |
| **Organizado** | Assiste no seu tempo, faz anotações, tira dúvidas, pratica | Constante | Estrutura clara, exercícios entre conceitos, espaço pra perguntas |

### 3.3 O Cubo 3D (Estágio × Persona × Camada de Maestria)

Toda experiência educacional do AutomatikLabs é uma **célula** do cubo:

- **Eixo X — Estágio (1–6):** *onde* o aluno está na jornada
- **Eixo Y — Persona (Zerado/Autodidata/Organizado):** *como* ele aprende
- **Eixo Z — Camada (Técnica/Lógica/Maestria):** *que profundidade* o conteúdo precisa atingir

Exemplos:
- (Estágio 2, Autodidata, 3 Camadas) → trilha enxuta, direto ao ponto, foco em pular da Técnica para a Lógica.
- (Estágio 4, Organizado, 7 Passos) → curso estruturado, anotações guiadas, exercícios entre passos.
- (Estágio 1, Zerado, Empresa c/ IA Humanizada) → jornada lenta começando pelo Pilar 1.

A doutrina (Backward Design + CBE + Bloom) garante que **variantes calibradas** preservem a competência final mesmo mudando ritmo e formato.
```

Verify: `grep -c "^### 3" automatiklabs/docs/educational-system/CHARTER.md`
Expected: 3.

- [ ] **Step 1.5: Append Part IV (Decisões Arquiteturais)**

Use the Edit tool to append after the Part 3.3 block. Add:

```markdown

---

## Part IV — Decisões Arquiteturais

Decisões tomadas durante o brainstorming da Fase 0 (ver `docs/superpowers/specs/2026-04-07-educational-system-fase-0-design.md` §3 para o histórico Q&A completo).

### 4.1 Hierarquia de conteúdo
**Mantém** a hierarquia atual `tracks → courses → modules → lessons`. **Formation** vira uma **tag/categoria leve** que agrupa tracks (ex: Formação "Empresa com IA Humanizada" agrupa as tracks "Fluxo de Trabalho", "Treinamento de Agentes", "Multi-Agente"). Sem nova camada hierárquica no banco. (Q3=B)

### 4.2 Competency como entidade first-class
Tabelas a serem criadas em fases posteriores:
- `competencies (id, slug, title, description, bloom_level)`
- `lesson_competencies (lesson_id, competency_id)` — many-to-many
- `user_competency_progress (user_id, competency_id, status, evidence_url)`

Permite avanço por **competência demonstrada** (CBE), não por tempo. (Q4=A)

### 4.3 Histórico de jornada do aluno
Tabela `user_journey_history (user_id, persona, journey_stage, changed_at, reason)` registra cada mudança de persona/estágio com timestamp. Habilita métricas Kirkpatrick nível 3 e 4 (quantos dias do estágio 2 ao 3, etc.). (Q5=B)

### 4.4 Workflow de revisão pedagógica
Tabela `pedagogical_reviews (id, lesson_id, reviewer_type, reviewer_id, status, feedback_md, created_at)`. `reviewer_type` ∈ {`agent`, `human`}. Lessons só viram `is_published=true` quando têm pelo menos uma review aprovada. Permite múltiplas camadas de revisão (agent revisa primeiro, humano revisa o que agent aprovou). (Q7=A)

### 4.5 Workers Python rodam locais no Claude Code
Não há infra externa. Workers vivem em `~/.claude/skills/<skill>/scripts/` ou no repo do projeto, são invocados pelo Claude Code via Bash tool durante desenvolvimento e produção. Sem deploy, sem autenticação entre serviços, sem custos de infra. (Q6 — resolved)

### 4.6 Doutrina como skill híbrida
Skill central `automatiklabs-doctrine` (loader fino + glossário curto) carregada por todo agent que toca conteúdo educacional. Skills atômicas (`backward-design`, `bloom-calibrator`, `tres-camadas-maestria`, etc.) são **referenciadas** pela doctrine e criadas em fases posteriores. Carrega-se só o que se precisa. (Q8=C)

### 4.7 Charter em dois lugares
**Canonical:** `automatiklabs/docs/educational-system/CHARTER.md`
**Mirror (read-only snapshot):** `docs/superpowers/specs/2026-04-07-educational-system-charter.md`

Convenção: o canonical é o que vale; o mirror é congelado no momento da Fase 0 e serve como histórico. Mudanças vão no canonical e o mirror só é atualizado em pontos de checkpoint formais. (Q9=D)
```

Verify: `grep -c "^### 4" automatiklabs/docs/educational-system/CHARTER.md`
Expected: 7.

- [ ] **Step 1.6: Append Part V (Sub-Epics — Hub → Spokes)**

Use the Edit tool to append. Add:

```markdown

---

## Part V — Sub-Epics (Hub → Spokes)

O Charter é o hub. Os sub-epics abaixo serão escritos pelos terminais workers durante a **Fase 1** (não na Fase 0). Cada um vira um arquivo `docs/stories/epics/<area>.md` consumível pelo `epic-executor`.

| # | Sub-Epic | Owner terminal | Path (a criar na Fase 1) |
|---|---|---|---|
| 00 | Master Vision | Master Maestro | `docs/stories/epics/00-master-vision.md` |
| 01 | Distribution & Mapping | Master Maestro | `docs/stories/epics/01-distribution.md` |
| 02 | Schema Extensions | Database | `docs/stories/epics/area-schema-extensions.md` |
| 03 | Pedagogical Workflow | Backend Dev | `docs/stories/epics/area-pedagogical-workflow.md` |
| 04 | Instructional Design | Arquiteto | `docs/stories/epics/area-instructional-design.md` |
| 05 | Platform UI | Frontend Dev | `docs/stories/epics/area-platform-ui.md` |
| 06 | Lesson Experience | UI UX Design | `docs/stories/epics/area-lesson-experience.md` |
| 07 | Pedagogical QA | QA Review | `docs/stories/epics/area-pedagogical-qa.md` |
| 08 | Tier & RLS | Security | `docs/stories/epics/area-tier-rls.md` |
| 09 | Curriculum Orchestration | Scrum Master | `docs/stories/epics/area-curriculum-orchestration.md` |
| 10 | Content Production | Nucleo 01 | `docs/stories/epics/area-content-production.md` |
| 11 | Assessment Engine | Nucleo 02 | `docs/stories/epics/area-assessment-engine.md` |
| 12 | Personalization Router (proposed) | Shell #3 | `docs/stories/epics/area-personalization-router.md` |
| 13 | Monetization Track Specialist (proposed) | Shell #4 | `docs/stories/epics/area-monetization-track.md` |

Os sub-epics 12 e 13 dependem de aceite final do mapping (Shell #3/#4 são sugestões iniciais).
```

- [ ] **Step 1.7: Append Part VI (Story Format Convention)**

Use the Edit tool to append. Add:

```markdown

---

## Part VI — Story Format Convention

Convenção universal mínima para toda Story dentro de qualquer per-area epic. Esta é a base que o `epic-executor` consome. Cada área pode adicionar campos extras conforme sua natureza (Q12=D).

### 6.1 Mínimo universal obrigatório

Cada Story em qualquer epic file DEVE ter:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único e estável (ex: `SCHEMA-01`, `WORKFLOW-03`) |
| `title` | string | Título imperativo curto (ex: "Add competencies table") |
| `points` | enum | `S` (≤30s), `M` (≤5min), `L` (≤10min) — usado pelo epic-executor pra timeout |
| `deps` | string[] | Lista de IDs de stories que devem terminar antes desta começar |
| `acceptance_criteria` | string[] | Bullets testáveis. Não "deve funcionar bem"; sim "tabela `competencies` existe e tem coluna `bloom_level int`". |

### 6.2 Campos extras livres por área

Cada área pode adicionar campos que façam sentido para sua natureza. Exemplos:
- **Instructional Design** pode adicionar: `competencies_taught`, `bloom_target`, `learner_stage`, `learner_personas`
- **Schema Extensions** pode adicionar: `migration_file`, `rls_required`, `rollback_strategy`
- **UI UX Design** pode adicionar: `screens`, `wireframes_link`, `accessibility_notes`

A Story continua válida pro epic-executor consumir desde que o **mínimo universal** esteja presente.

### 6.3 Exemplo de Story bem formada

```yaml
- id: SCHEMA-01
  title: Add competencies table with Bloom level
  points: M
  deps: []
  acceptance_criteria:
    - Migration file 00013_competencies.sql created
    - Table public.competencies exists with columns (id, slug, title, description, bloom_level)
    - bloom_level is SMALLINT CHECK BETWEEN 1 AND 6
    - Slug has UNIQUE constraint
    - Migration runs idempotently (IF NOT EXISTS)
  # extras (Schema Extensions area):
  migration_file: automatiklabs/supabase/migrations/00013_competencies.sql
  rls_required: true
  rollback_strategy: DROP TABLE IF EXISTS public.competencies CASCADE
```
```

- [ ] **Step 1.8: Append Part VII (Terminal-Area Mapping)**

Use the Edit tool to append. Add:

```markdown

---

## Part VII — Terminal-Area Mapping

Mapeamento aprovado dos 12 terminais Maestri conectados → áreas pedagógicas owned. Cada terminal carrega `automatiklabs-doctrine` como skill base obrigatória, mais um stack específico.

| # | Terminal | Área | Skill stack |
|---|---|---|---|
| 1 | Arquiteto | Instructional Design | doctrine, *backward-design, *bloom-calibrator, *tres-camadas-maestria, *empresa-ia-humanizada |
| 2 | Database | Schema Extensions | doctrine, tomik-db-doctrine, senior-backend |
| 3 | Backend Dev | Pedagogical Workflow | doctrine, senior-backend, tomik-db-doctrine |
| 4 | Frontend Dev | Platform UI | doctrine, senior-frontend |
| 5 | UI UX Design | Lesson Experience | doctrine, ui-ux-pro-max, frontend-design |
| 6 | Security | Tier & RLS | doctrine, tomik-db-doctrine |
| 7 | QA Review | Pedagogical QA | doctrine, e2e-product-qa |
| 8 | Scrum Master | Curriculum Orchestration | doctrine, content-factory |
| 9 | Nucleo 01 | Content Production | doctrine, senior-prompt-engineer |
| 10 | Nucleo 02 | Assessment Engine | doctrine, senior-prompt-engineer |
| 11 | Shell #3 | Personalization Router (proposed) | doctrine, *learner-personas |
| 12 | Shell #4 | Monetization Track Specialist (proposed) | doctrine, *7-passos, *tres-cs, *jornada-7-fases |

\* — skills marcadas com asterisco **ainda não existem**. Serão criadas em fases posteriores. Até lá, os terminais usam apenas a doctrine + skills genéricas.
```

- [ ] **Step 1.9: Append Part VIII (Glossário)**

Use the Edit tool to append. Add:

```markdown

---

## Part VIII — Glossário

Termos canônicos. Em caso de ambiguidade entre terminais, a definição aqui prevalece.

| Termo | Definição |
|---|---|
| **Trilha (track)** | Sequência ordenada de cursos com um único objetivo de saída mensurável. Entidade `tracks` no Supabase. |
| **Formação** | Tag/categoria leve que agrupa trilhas relacionadas. Não é entidade hierárquica. Vive como atributo ou tabela auxiliar a ser definida na Fase 2. |
| **Curso (course)** | Unidade temática completa dentro de uma trilha. Entidade `courses`. |
| **Módulo (module)** | Subdivisão de um curso. Entidade `modules`. |
| **Aula (lesson)** | Unidade atômica de conteúdo (vídeo + markdown + opcional quiz). Entidade `lessons`. |
| **Competência** | Capacidade demonstrável que o aluno adquire. Entidade `competencies` (a criar na Fase 2). Avanço por evidência, não por tempo. |
| **Estágio (1–6)** | Posição do aluno na jornada de monetização. Ver Part III §3.1. |
| **Persona** | Perfil cognitivo do aluno: Zerado, Autodidata ou Organizado. Ver Part III §3.2. |
| **Camada de Maestria** | Profundidade de uma automação: Técnica, Lógica ou Maestria. |
| **Pilar (do método)** | Uma das 3 áreas de "Empresa com IA Humanizada": Fluxo, Treinamento, Multi-Agente. |
| **Doctrine** | A skill `automatiklabs-doctrine` + este Charter. Fonte da verdade pedagógica. |
| **Per-area epic** | Arquivo `docs/stories/epics/<area>.md` escrito por um terminal worker, contendo as Stories daquela área. Consumido pelo `epic-executor`. |
| **Wave** | Uma execução do epic-executor para uma Story. Sequência: plan → build → QA → fix → regression → checkpoint. |
| **Master Maestro** | O terminal Claude Code onde o humano inicia a conversa. Distribui tarefas, atualiza o Production Board, escala bloqueios. |
| **Free Content Hub** | Pipeline **separado** de aquisição/redes sociais. **Não confundir** com o sistema educacional. |

---

*Fim do Charter Fase 0. Próximas mudanças exigem novo commit + re-sync da skill `automatiklabs-doctrine` e das sticky notes.*
```

- [ ] **Step 1.10: Verify Charter is complete**

Run: `wc -l automatiklabs/docs/educational-system/CHARTER.md && grep -c "^## Part" automatiklabs/docs/educational-system/CHARTER.md`
Expected: file has 200+ lines and exactly 8 Part headers.

---

## Task 2: Write Charter mirror to `docs/superpowers/specs/`

**Files:**
- Create: `docs/superpowers/specs/2026-04-07-educational-system-charter.md`

The mirror is a frozen snapshot of the Charter at Fase 0. Convention (per spec §11): canonical is in `automatiklabs/docs/educational-system/CHARTER.md`; mirror is read-only snapshot for historical reference.

- [ ] **Step 2.1: Copy Charter to mirror location**

Run: `cp automatiklabs/docs/educational-system/CHARTER.md docs/superpowers/specs/2026-04-07-educational-system-charter.md`
Verify: `diff automatiklabs/docs/educational-system/CHARTER.md docs/superpowers/specs/2026-04-07-educational-system-charter.md`
Expected: empty diff (files identical).

- [ ] **Step 2.2: Annotate the mirror as a snapshot**

Use the Edit tool on `docs/superpowers/specs/2026-04-07-educational-system-charter.md` to insert (right after the title line `# AutomatikLabs Educational System — Charter`) the annotation:

```markdown

> **⚠️ This is a frozen snapshot of the canonical Charter at Fase 0 (2026-04-07).**
> **Canonical (live):** `automatiklabs/docs/educational-system/CHARTER.md`
> **This mirror is read-only.** Do not edit. Future updates happen in the canonical and are snapshotted at formal checkpoints only.
```

Verify: `grep -c "frozen snapshot" docs/superpowers/specs/2026-04-07-educational-system-charter.md`
Expected: 1.

---

## Task 3: Create `automatiklabs-doctrine` skill

**Files:**
- Create directory: `~/.claude/skills/automatiklabs-doctrine/references/`
- Create: `~/.claude/skills/automatiklabs-doctrine/SKILL.md`
- Create: `~/.claude/skills/automatiklabs-doctrine/references/charter-link.md`
- Create: `~/.claude/skills/automatiklabs-doctrine/references/frameworks-index.md`
- Create: `~/.claude/skills/automatiklabs-doctrine/references/usage-examples.md`

These files live in `~/.claude/skills/`, **not** in the educational-team repo. They will NOT be part of the git commit in Task 5.

- [ ] **Step 3.1: Create skill directory tree**

Run: `mkdir -p ~/.claude/skills/automatiklabs-doctrine/references`
Verify: `ls -d ~/.claude/skills/automatiklabs-doctrine/references`
Expected: directory exists.

- [ ] **Step 3.2: Write SKILL.md**

Use the Write tool to create `~/.claude/skills/automatiklabs-doctrine/SKILL.md`:

```markdown
---
name: automatiklabs-doctrine
description: Doutrina pedagógica canônica do AutomatikLabs Educational System. Use SEMPRE que estiver projetando trilhas, formações, cursos, módulos, aulas, avaliações ou revisando conteúdo de professores no AutomatikLabs. Carrega o Charter como fonte da verdade e orienta sobre quais skills atômicas (backward-design, bloom-calibrator, tres-camadas-maestria, empresa-ia-humanizada, etc.) invocar conforme a tarefa. Não use no Free Content Hub — pipeline separado.
---

# AutomatikLabs Pedagogical Doctrine

This skill is the entrypoint to the AutomatikLabs Educational System pedagogical doctrine. It is THIN by design — the canonical doctrine lives in the Charter file in the repo. This skill loads pointers, not content.

## Norte verdadeiro

Formar pessoas que **pensam, criam com liberdade, e monetizam** o que criam em automação e IA. Sucesso = renda real do aluno (Kirkpatrick nível 4).

## How to use this skill

1. **Read the canonical Charter** at the path in `references/charter-link.md`. The Charter has 8 parts and is the source of truth for everything below.
2. **Identify your task** (designing a track? reviewing a lesson? generating an assessment?).
3. **Invoke the relevant atomic skills** listed in `references/frameworks-index.md`. (Some atomic skills do not yet exist as of Fase 0 — they are marked accordingly.)
4. **See `references/usage-examples.md`** for three concrete invocation patterns.

## Glossário canônico (versão curta — completo no Charter Part VIII)

- **Trilha (track)** — sequência de cursos com objetivo único
- **Formação** — tag/categoria que agrupa trilhas (ex: "Empresa com IA Humanizada")
- **Competência** — capacidade demonstrável (entidade first-class na Fase 2+)
- **Estágio (1–6)** — posição do aluno na jornada de monetização
- **Persona (Zerado/Autodidata/Organizado)** — perfil cognitivo do aluno
- **Camada (Técnica/Lógica/Maestria)** — profundidade da automação
- **Pilar (Fluxo/Treinamento/Multi-Agente)** — divisões do método "Empresa com IA Humanizada"
- **Cubo 3D** — Estágio × Persona × Camada (toda experiência educacional é uma célula do cubo)

## Princípio unificador

> Toda Formação ensina três coisas: **o Método, a Construção, a Negociação.**

## Quando NÃO usar esta skill

- Tarefas puramente técnicas que não envolvem decisão pedagógica
- Trabalho no **Free Content Hub** (pipeline separado, não confundir)
- Tasks dentro de outros projetos no monorepo que não sejam o AutomatikLabs Educational System
```

Verify: `head -5 ~/.claude/skills/automatiklabs-doctrine/SKILL.md`
Expected: starts with `---` frontmatter and `name: automatiklabs-doctrine`.

- [ ] **Step 3.3: Write `references/charter-link.md`**

Use the Write tool to create `~/.claude/skills/automatiklabs-doctrine/references/charter-link.md`:

```markdown
# Charter Link

The canonical Charter for the AutomatikLabs Educational System lives at:

**Absolute path:**
`/Users/rafaelmelgaco/educational-team/automatiklabs/docs/educational-system/CHARTER.md`

**Repo-relative path (from `educational-team/`):**
`automatiklabs/docs/educational-system/CHARTER.md`

**Frozen snapshot (Fase 0, read-only):**
`/Users/rafaelmelgaco/educational-team/docs/superpowers/specs/2026-04-07-educational-system-charter.md`

## Convention

- The canonical file is the source of truth. When in doubt, read it.
- The frozen snapshot is for historical reference only. Do not edit it.
- Mutations to the Charter require a new commit + re-sync of this skill + re-sync of the Maestri sticky notes.
```

- [ ] **Step 3.4: Write `references/frameworks-index.md`**

Use the Write tool to create `~/.claude/skills/automatiklabs-doctrine/references/frameworks-index.md`:

```markdown
# Frameworks Index — Atomic Skills

This index lists the atomic skills referenced by the AutomatikLabs Doctrine. Skills marked **(planned)** do not exist yet as of Fase 0 and will be created in subsequent phases.

## Classical pedagogical frameworks

| Skill name | Function | Status |
|---|---|---|
| `backward-design` | Project a track from the measurable end-result back to the start | (planned, Phase 2) |
| `bloom-calibrator` | Tag every learning objective with a Bloom level (1–6) | (planned, Phase 2) |
| `cognitive-load-auditor` | Audit a lesson against intrinsic/extrinsic/germane load | (planned, Phase 2) |
| `kolb-experiential-cycle` | Verify a concept has all 4 Kolb moments | (planned, Phase 2) |
| `cbe-competency-mapper` | Define competencies and CBE advancement criteria | (planned, Phase 2) |
| `kirkpatrick-evaluator` | Build evaluation instruments at all 4 levels | (planned, Phase 2) |
| `prerequisite-grapher` | Build the prerequisite dependency graph between contents | (planned, Phase 2) |
| `pedagogical-style-guide` | The internal Style Guide for tone/format/duration/structure | (planned, Phase 2) |
| `learner-personas` | The 3 personas (Zerado/Autodidata/Organizado) and how to adapt | (planned, Phase 2) |

## Proprietary AutomatikLabs methodologies

| Skill name | Function | Status |
|---|---|---|
| `tres-camadas-maestria` | The 3-layer ladder: Técnica → Lógica → Maestria | (planned, Phase 2) |
| `empresa-ia-humanizada` | The 3 Pilares method | (planned, Phase 2) |
| `7-passos-script-vendas` | The 7-step sales conversational script framework | (planned, Phase 2) |
| `tres-cs-monetizacao` | Criar / Capturar / Entregar valor | (planned, Phase 2) |
| `jornada-7-fases-consciencia` | The 7-phase lead awareness journey | (planned, Phase 2) |
| `formacao-canonica-automatik` | The hard rule: every Formation = Método + Construção + Negociação | (planned, Phase 2) |

## Existing skills to reuse (no creation needed)

| Skill name | Reused from |
|---|---|
| `tomik-db-doctrine` | Tomik (DB schema doctrine, applicable to Supabase patterns) |
| `senior-backend` | General backend dev |
| `senior-frontend` | General frontend dev |
| `senior-prompt-engineer` | LLM prompt design |
| `ui-ux-pro-max` | UI/UX design intelligence |
| `frontend-design` | Distinctive frontend interfaces |
| `e2e-product-qa` | End-to-end product QA |
| `content-factory` | Content production pipeline (Free Content Hub) |
```

- [ ] **Step 3.5: Write `references/usage-examples.md`**

Use the Write tool to create `~/.claude/skills/automatiklabs-doctrine/references/usage-examples.md`:

```markdown
# Usage Examples

Three concrete patterns for invoking the doctrine in real tasks.

## Example 1: Designing a new Track

Context: an Arquiteto terminal is asked to design "Trilha de Monetização para Estágio 3, persona Autodidata".

```
1. Load skill: automatiklabs-doctrine
2. Read Charter Part III §3.1 (Estágio 3) and §3.2 (Autodidata) — identify needs and pace
3. Read Charter Part II §2.2 (3 Cs da Monetização) — main framework for monetization tracks
4. Apply Backward Design: "Ao final desta trilha, o aluno será capaz de cobrar e vender seu primeiro serviço de automação."
5. Use Bloom: target levels 5 (Avaliar — precificar) and 6 (Criar — gerar proposta)
6. Output: a track skeleton with courses, modules, and lessons mapped to competencies
```

## Example 2: Reviewing a teacher's lesson script

Context: a QA Review terminal receives a lesson script from a human professor and must audit it.

```
1. Load skill: automatiklabs-doctrine
2. Read Charter Part II §2.1 (Cognitive Load) and §2.1 (Kolb) — load and structure criteria
3. Check the script against the Style Guide (planned skill) — duration, tone, structure
4. Verify the lesson states which competencies it teaches and at what Bloom level
5. Output: PASS / NEEDS_CHANGES / REJECT with specific feedback
```

## Example 3: Generating assessments

Context: a Nucleo 02 terminal must generate a quiz for Module 3 of a course.

```
1. Load skill: automatiklabs-doctrine
2. Read Charter Part II §2.1 (CBE) and the Kirkpatrick row — formative vs summative
3. For each competency in the module, generate a question at the Bloom level declared
4. Output: a YAML or JSON list of questions with answers + Bloom tag + competency tag
```

## Common anti-patterns

- ❌ Loading this skill for Free Content Hub work — wrong pipeline
- ❌ Designing a course without first reading the relevant Charter parts
- ❌ Skipping Bloom calibration "because the topic is simple" — every objective is tagged
- ❌ Treating "horas de vídeo" as progress — it's not
```

- [ ] **Step 3.6: Verify all skill files exist**

Run: `ls -la ~/.claude/skills/automatiklabs-doctrine/ ~/.claude/skills/automatiklabs-doctrine/references/`
Expected: SKILL.md + 3 reference files exist with non-zero size.

---

## Task 4: Initialize the four Maestri sticky notes

**Tools:** `maestri` CLI (already in PATH).

The 4 untitled notes will be renamed by setting their first line. After each `maestri note write`, run `maestri list` to verify the rename took effect.

- [ ] **Step 4.1: Capture current note names**

Run: `maestri list`
Expected: see notes named `untitled`, `untitled-9`, `untitled-8`, `untitled-10` (or similar). **Record the four exact names** before proceeding — they will be the targets of `maestri note write` calls below.

- [ ] **Step 4.2: Write `Doctrine Board` note**

Pick the first `untitled*` note from Step 4.1. Run:

```bash
maestri note write "<first-untitled-name>" "# Doctrine Board

**Charter:** automatiklabs/docs/educational-system/CHARTER.md
**Skill:** automatiklabs-doctrine

## Norte
Renda real do aluno (Kirkpatrick 4).

## Eixos do cubo 3D
- Estágio (1-6) | Persona (Zerado/Autodidata/Organizado) | Camada (Técnica/Lógica/Maestria)

## Frameworks ativos
Backward Design · Bloom · CBE · Cognitive Load · Kolb · Kirkpatrick

## Metodologias proprietárias
3 Camadas · Empresa c/ IA Humanizada · 7 Passos Vendas · 3 Cs · Jornada 7 Fases

## Princípio unificador
Toda Formação = Método + Construção + Negociação"
```

Verify: `maestri list | grep "Doctrine Board"`
Expected: one match.

- [ ] **Step 4.3: Write `Curriculum Map` note**

Pick the next `untitled*` note. Run:

```bash
maestri note write "<next-untitled-name>" "# Curriculum Map

> Mapa de competências × cursos × níveis Bloom × professores.
> Vazio na Fase 0. Será populado pelos terminais workers conforme cada per-area epic for escrito.

| Competência | Slug | Cursos | Bloom | Owner |
|---|---|---|---|---|
| _(vazio)_ | | | | |"
```

Verify: `maestri list | grep "Curriculum Map"`
Expected: one match.

- [ ] **Step 4.4: Write `Production Board` note**

Pick the next `untitled*` note. Run:

```bash
maestri note write "<next-untitled-name>" "# Production Board

| Terminal | Role | Status | Current Task |
|---|---|---|---|
| Master | MAESTRO | IDLE | — |
| Arquiteto | TBD | IDLE | — |
| Database | TBD | IDLE | — |
| Backend Dev | TBD | IDLE | — |
| Frontend Dev | TBD | IDLE | — |
| UI UX Design | TBD | IDLE | — |
| Security | TBD | IDLE | — |
| QA Review | TBD | IDLE | — |
| Scrum Master | TBD | IDLE | — |
| Nucleo 01 | TBD | IDLE | — |
| Nucleo 02 | TBD | IDLE | — |
| Shell #3 | TBD | IDLE | — |
| Shell #4 | TBD | IDLE | — |

> Roles serão atribuídos quando Distribution Epic for aprovado e dispatch acontecer (Fase 1)."
```

Verify: `maestri list | grep "Production Board"`
Expected: one match.

- [ ] **Step 4.5: Write `Production Log` note**

Pick the last `untitled*` note. Run:

```bash
maestri note write "<last-untitled-name>" "# Production Log

- \`2026-04-07\` Phase 0 bootstrap — Charter committed, doctrine skill created, board initialized"
```

Verify: `maestri list | grep "Production Log"`
Expected: one match.

- [ ] **Step 4.6: Final maestri verification**

Run: `maestri list`
Expected: 12 connected agents AND 4 connected notes named exactly:
- `Doctrine Board`
- `Curriculum Map`
- `Production Board`
- `Production Log`

If any note kept its `untitled*` name, the rename failed — re-run the corresponding `maestri note write` step.

---

## Task 5: Single commit

**Files in commit:**
- `automatiklabs/docs/educational-system/CHARTER.md` (new)
- `docs/superpowers/specs/2026-04-07-educational-system-charter.md` (new mirror)

**NOT in commit** (intentionally):
- Anything under `~/.claude/skills/` (not part of this repo)
- Maestri sticky notes (live state, not files)
- The pre-existing modified/untracked files in the working tree (UI marketing edits, screenshots) — they belong to other work

- [ ] **Step 5.1: Stage only the Fase 0 files**

Run:
```bash
git add automatiklabs/docs/educational-system/CHARTER.md docs/superpowers/specs/2026-04-07-educational-system-charter.md
```

Verify: `git status --short | grep -E "(CHARTER|charter)"`
Expected: two `A` (added) lines for the two files.

- [ ] **Step 5.2: Verify nothing else got staged accidentally**

Run: `git diff --cached --name-only`
Expected: exactly two paths:
```
automatiklabs/docs/educational-system/CHARTER.md
docs/superpowers/specs/2026-04-07-educational-system-charter.md
```

If any other file appears, run `git restore --staged <file>` for each unintended one.

- [ ] **Step 5.3: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
feat(educational-system): Phase 0 — Charter (canonical + mirror)

- Add canonical CHARTER.md with 8 parts: Propósito, Doutrina Pedagógica,
  Modelo de Aluno, Decisões Arquiteturais, Sub-Epics, Story Format Convention,
  Terminal-Area Mapping, Glossário
- Add frozen snapshot mirror in docs/superpowers/specs/

This commit captures the foundation of the AutomatikLabs Educational System.
The companion skill (automatiklabs-doctrine) lives in ~/.claude/skills/ and
is not part of this repo. The 4 Maestri sticky notes (Doctrine Board,
Curriculum Map, Production Board, Production Log) are initialized via the
maestri CLI and are also not files in this repo.

Next: Phase 1 — dispatch per-area epic writing to the 12 Maestri terminals.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --oneline`
Expected: shows the new commit on top of `develop`.

- [ ] **Step 5.4: Confirm no push happened**

Run: `git status`
Expected: includes "Your branch is ahead of 'origin/develop' by 1 commit." (or similar). **No push.** User reviews before pushing.

---

## Task 6: Final report

- [ ] **Step 6.1: Generate final report**

Compose and present (in chat, not in a file) a report containing:

1. **Files created** — list with sizes:
   ```bash
   ls -la automatiklabs/docs/educational-system/CHARTER.md \
          docs/superpowers/specs/2026-04-07-educational-system-charter.md \
          ~/.claude/skills/automatiklabs-doctrine/SKILL.md \
          ~/.claude/skills/automatiklabs-doctrine/references/
   ```

2. **`maestri list` output** showing all 4 notes renamed.

3. **Commit diff stat:**
   ```bash
   git show --stat HEAD
   ```

4. **Suggested next steps for Fase 1:**
   - Write `00-master-vision.md` and `01-distribution.md` (Master Maestro tasks)
   - Dispatch the 12 terminals with `maestri ask` to each write their `area-*.md` epic
   - Update `Production Board` note as terminals start working
   - Run a periodic monitoring loop until all per-area epics return

---

## Out of scope (do NOT do in this plan)

- Creating any atomic skill (`backward-design`, `bloom-calibrator`, etc.) — Phase 2
- Any `git push` — user decides
- Any Supabase migration — Phase 2
- Loading the `maestri` skill into other terminals — Phase 1
- Creating any Python worker — later phases
- Touching Next.js code — Phase 2+
- Configuring `epic-executor` — Phase 1+

---

## Self-Review Checklist (run after writing the plan, before handing off)

- [x] **Spec coverage:** Every section of the spec (Charter parts I-VIII, skill scaffold, sticky notes init, single commit) has at least one task implementing it.
- [x] **Placeholder scan:** No "TBD", "TODO", "implement later", "add error handling", or vague steps. Two intentional "(proposed)" markers for Shell #3/#4 are documented in the spec as known risks, not placeholders.
- [x] **Type / name consistency:** Note names (`Doctrine Board`, `Curriculum Map`, `Production Board`, `Production Log`) are spelled identically in Tasks 4 and 6. Charter file paths are consistent across all references. The skill name `automatiklabs-doctrine` is identical in all 6 references.
- [x] **Commands are runnable:** Every Run line contains a complete, copy-pasteable command. Every "Use Write/Edit tool" instruction includes the full content to write.
