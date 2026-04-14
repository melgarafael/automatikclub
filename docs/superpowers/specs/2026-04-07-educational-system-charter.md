# AutomatikLabs Educational System — Charter

> **⚠️ This is a frozen snapshot of the canonical Charter at Fase 0 (2026-04-07).**
> **Canonical (live):** `automatiklabs/docs/educational-system/CHARTER.md`
> **This mirror is read-only.** Do not edit. Future updates happen in the canonical and are snapshotted at formal checkpoints only.

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
