# Conhecimento OpenClaw — Base Canônica para Formulação de Aulas

> Fonte: docs.openclaw.ai/llms-full.txt (extraído em 2026-05-27)
> Objetivo: Evitar alucinação na criação de conteúdo do curso AutomatikLabs

---

## 1. O Que É e Como Funciona

O OpenClaw é um **Gateway de orquestração de agentes de IA** que roda como um processo contínuo no servidor. Não é um chatbot — é uma plataforma que transforma um servidor (VPS) em um centro de operações autônomas.

**Arquitetura em linguagem simples:**

- **Gateway Process** — O "motor" que roda 24/7. Gerencia sessões dos agentes, conexões com canais (Telegram, WhatsApp, etc.), agendamento de tarefas e automações em background.
- **Agent System** — Sistema multiagente com isolamento de workspace. Cada agente tem seu próprio contexto, arquivos de configuração e escopo de execução. Agentes podem criar sub-agentes para delegar trabalho.
- **Session Management** — Gerencia conversas e contextos usando session keys. Sessões têm reset diário/por inatividade baseado em `sessionStartedAt` e `lastInteractionAt`.

**Configuração principal vive em:** `~/.openclaw/`
**Estado do sistema vive em:** `$OPENCLAW_STATE_DIR`

---

## 2. O Que Consegue Fazer Hoje

### Canais de Comunicação Suportados
| Canal | Status | Observações |
|-------|--------|-------------|
| **Telegram** | Suportado | Canal principal para a maioria dos agentes |
| **WhatsApp** | Suportado | Via integração |
| **Discord** | Suportado | Bots em servidores |
| **Slack** | Suportado | Apps em workspaces |
| **iMessage** | Suportado | Via bridge `imsg` nativa (precisa Mac com Messages.app) |
| **Matrix** | Suportado | Protocolo aberto |
| **Mattermost** | Suportado | Auto-hospedado |
| **IRC** | Suportado | Protocolo legado |
| **Google Chat** | Suportado | Google Workspace |
| **Feishu/Lark** | Suportado | Plataforma asiática |
| **Outros** | Via plugin | Sistema extensível |

**Nota sobre canais:** Texto é universalmente suportado. Mídia, reações e respostas em thread variam por plataforma.

### Automações (o coração da execução autônoma)

#### Skills
- Habilidades que o agente executa — processos, tarefas, operações
- Instaláveis via **ClawHub** (marketplace de skills/plugins)
- Configuráveis no workspace do agente

#### Crons (Tarefas Agendadas)
O cron é o **agendador built-in do Gateway** para timing preciso. Roda dentro do processo Gateway, não no modelo.

**Tipos de agendamento:**
| Tipo | Sintaxe | Exemplo | Uso |
|------|---------|---------|-----|
| `at` | ISO 8601 ou relativo | `--at "2026-06-01T09:00"` ou `--at 20m` | Tarefa única (one-shot) |
| `every` | Intervalo fixo | `--every 6h` | Repetição periódica simples |
| `cron` | Expressão cron (5 ou 6 campos) | `--cron "0 9 * * 1"` (toda segunda 9h) | Agendamento preciso com timezone |

**Estilos de execução:**
- **Main session** — Enfileira evento na sessão principal (com contexto completo)
- **Isolated** — Sessão nova limpa `cron:<jobId>` (sem contexto anterior)
- **Current** — Vinculada à sessão ativa no momento da criação
- **Custom** — Sessão nomeada persistente

**Modos de entrega:**
- `announce` — Entrega fallback se o agente não enviou nada
- `webhook` — POST para URL externa quando terminar
- `none` — Sem fallback

**Tratamento de falhas:**
- One-shot: até 3 retries com backoff exponencial (rate limit, overload, rede, erro de servidor)
- Recurring: backoff exponencial de 30s a 60min entre retries

**Detalhe importante:** Expressões recorrentes no topo da hora são automaticamente espaçadas (stagger) em até 5 min para reduzir picos de carga. Use `--exact` para forçar timing preciso.

#### Heartbeats (Autonomia Reativa)
Turno periódico na sessão principal (padrão: a cada 30 minutos) que verifica condições com contexto completo da sessão.

**Como funciona:**
- Executa o que está no arquivo `HEARTBEAT.md` ou no bloco `tasks:`
- Pode usar checklist (verifica e age) ou modo "due-only" (só roda tasks com prazo)
- Se `HEARTBEAT.md` estiver vazio → pula como `empty-heartbeat-file`
- Se não tem tasks com prazo → pula como `no-tasks-due`

**Comportamento inteligente:**
- Heartbeats **adiam** enquanto trabalho de cron está ativo ou na fila
- `heartbeat.skipWhenBusy` pode adiar se subagentes da mesma sessão estão ocupados
- Heartbeats **NÃO criam registros de task** e **NÃO estendem** freshness de sessão

#### Standing Orders (Ordens Permanentes)
Autoridade operacional permanente definida nos arquivos do workspace (como `AGENTS.md`).

**Cada programa especifica:**
1. **Scope** — O que o agente está autorizado a fazer
2. **Triggers** — Quando executar
3. **Approval gates** — O que precisa aprovação humana
4. **Escalation rules** — Quando parar e pedir ajuda

Podem ser combinados com cron via `--cron` para enforcement baseado em tempo.

#### Background Tasks
Registro de trabalho em segundo plano: execuções ACP, spawns de subagentes, crons isolados, operações CLI.

**Ciclo de vida:** `queued → running → terminal` (succeeded, failed, timed_out, cancelled, lost)
**Armazenamento:** SQLite em `$OPENCLAW_STATE_DIR/tasks/runs.sqlite`
**Retenção:** Registros terminais mantidos por 7 dias, depois podados automaticamente.
**Manutenção:** Sweeper roda a cada 60 segundos.

#### Task Flow (Orquestração de Fluxos)
Camada acima de background tasks para fluxos multi-step duráveis com estado próprio, tracking de revisão e semântica de sync.

**Modos:**
- **Managed** — Task Flow controla o ciclo de vida de ponta a ponta
- **Mirrored** — Observa tasks criadas externamente

### Ferramentas (Tools)
| Tool | O que faz |
|------|-----------|
| `message` | Envia mensagens para canais |
| `sessions_spawn` | Cria subagentes |
| `browser` | Automação web (navegar, clicar, extrair) |
| `exec` | Executa comandos no servidor |
| `llm-task` | Steps de modelo com validação de schema |
| `image_generate` | Gera imagens (com tracking de task) |
| `music_generate` | Gera música |
| `video_generate` | Gera vídeo |

**Guarda contra duplicatas:** Enquanto uma task de geração de mídia está ativa, chamadas repetidas para o mesmo prompt retornam o status da task existente.

### Hooks (Eventos e Automações)
Dois tipos:
- **Internal hooks** — Rodam dentro do Gateway em eventos do ciclo de vida do agente
- **Webhooks** — Endpoints HTTP externos

**Hooks pré-incluídos (bundled):**
| Hook | O que faz |
|------|-----------|
| `session-memory` | Salva contexto em `<workspace>/memory/` |
| `bootstrap-extra-files` | Injeta arquivos adicionais via glob patterns |
| `command-logger` | Loga todos os comandos em `~/.openclaw/logs/commands.log` |
| `compaction-notifier` | Envia avisos quando compaction roda |
| `boot-md` | Executa `BOOT.md` na inicialização do gateway |

**Descoberta de hooks (ordem):**
1. Hooks bundled (shipped com OpenClaw)
2. Hooks de plugins instalados
3. Hooks gerenciados em `~/.openclaw/hooks/`
4. Hooks do workspace em `<workspace>/hooks/`

### Integração com Gmail
- Setup via Google PubSub
- Comando: `openclaw webhooks gmail setup --account email@gmail.com`
- Auto-renova o watch quando `hooks.enabled=true` e `hooks.gmail.account` está configurado

### Multiagentes
- Agentes podem **spawnar subagentes** para trabalho delegado
- Subagentes têm isolamento de workspace
- Cancelamento é registrado no task registry
- Resultado do subagente: usa o último texto visível do assistente
- Cleanup de browser acontece best-effort antes de anúncio

---

## 3. O Que NÃO Consegue Fazer (Limitações Reais)

### Limitações Técnicas
1. **iMessage requer Mac** — Precisa de um Mac com Messages.app logado. Não funciona em Linux/VPS comum.
2. **Respostas em thread, tapbacks, edição no iMessage** — Requerem `imsg launch` com bridge de API privada. Funcionalidades básicas (enviar, receber, histórico, mídia) funcionam normalmente.
3. **Cron não infere idioma** — Jobs de cron NÃO inferem idioma de resposta do canal, locale ou mensagens anteriores. O idioma precisa estar explícito no prompt/template.
4. **Heartbeats não criam registros de task** — E não estendem freshness de sessão. São "invisíveis" no tracking.
5. **Cron main-session não inclui instrução do heartbeat** — Eventos de cron na sessão principal NÃO incluem automaticamente "Read HEARTBEAT.md". Se precisar, tem que dizer explicitamente.
6. **Timezone de cron** — Sem `--tz`, usa o timezone do host do gateway. Schedules `at` sem timezone são tratados como UTC.
7. **Day-of-month + day-of-week** — Quando ambos são não-wildcard, cron casa quando **qualquer um** bate (OR), não ambos (AND). Comportamento padrão Vixie cron.
8. **Stale acknowledgement** — Runs isolados de cron guardam contra respostas de reconhecimento stale. Se a primeira resposta é só status intermediário, OpenClaw re-prompta uma vez para o resultado real.
9. **BlueBubbles descontinuado** — OpenClaw não ship mais o canal BlueBubbles. Migrar `channels.bluebubbles` para `channels.imessage`.
10. **OAuth SecretRef** — Se credencial é `type: "oauth"`, objetos SecretRef NÃO são suportados para o material de credencial.

### Limitações Operacionais
- **Precisa de VPS/servidor rodando 24/7** — Não é serverless, precisa de processo contínuo
- **LLM provider necessário** — Sem conexão com um LLM (ChatGPT, Claude, etc.), o agente não funciona
- **Dependente de APIs externas** — Integrações dependem das APIs dos serviços (Notion, Google, etc.) estarem disponíveis

---

## 4. Comandos Principais

### Status e Inspeção
```bash
openclaw status                          # Status geral
openclaw gateway status                  # Status do gateway
openclaw cron status                     # Status do agendador
openclaw cron list                       # Listar jobs agendados
openclaw cron show <jobId>               # Detalhes de um job
openclaw cron runs --id <jobId>          # Histórico de execuções
openclaw doctor [--fix]                  # Diagnóstico (com auto-fix opcional)
openclaw logs --follow                   # Logs em tempo real
```

### Gerenciamento de Tasks
```bash
openclaw tasks list [--runtime <type>] [--status <status>]   # Listar tasks
openclaw tasks show <lookup>                                  # Detalhes de task
openclaw tasks cancel <lookup>                                # Cancelar task
openclaw tasks notify <lookup> <policy>                       # Mudar política de notificação
openclaw tasks audit                                          # Auditoria de tasks
openclaw tasks maintenance [--apply]                          # Manutenção (com apply)
openclaw tasks flow list|show|cancel                          # Gerenciar flows
```

### Operações de Cron
```bash
openclaw cron add --name "Relatório Diário" --cron "0 9 * * *" --message "Gere o relatório de vendas"
openclaw cron add --name "Cobrança" --at "2026-06-05T10:00" --message "Processe cobranças do dia 5"
openclaw cron add --name "Backup" --every 6h --message "Execute backup de dados"
openclaw cron edit <jobId>               # Editar job existente
openclaw cron run <jobId> [--wait]       # Executar manualmente (com wait opcional)
openclaw cron remove <jobId>             # Remover job
```

**Opções de cron:**
- `--model <modelo>` — Override de modelo LLM para o job
- `--tz <timezone>` — Timezone específico
- `--exact` — Sem stagger automático
- `--thinking high|medium|low|off` — Nível de raciocínio

### Agente e Sessões
```bash
openclaw agent <mensagem>                # Enviar mensagem direta ao agente
openclaw channels status --probe         # Status dos canais com probe
openclaw hooks list|enable|disable|check # Gerenciar hooks
openclaw hooks info <hook-name>          # Info de hook específico
```

### Utilitários
```bash
openclaw system event --mode now --text "mensagem"   # Evento de sistema
openclaw system heartbeat last                        # Último heartbeat
```

---

## 5. Onde Guarda Cada Coisa

### Estrutura de Arquivos
```
~/.openclaw/                          # Diretório raiz de configuração
├── config.json                       # Configuração principal (JSON5)
├── cron/
│   ├── jobs.json                     # Jobs agendados (persistente)
│   └── jobs-state.json               # Estado runtime dos jobs
├── hooks/                            # Hooks gerenciados pelo usuário
├── logs/
│   └── commands.log                  # Log de comandos (se command-logger ativo)
└── ...

$OPENCLAW_STATE_DIR/
└── tasks/
    └── runs.sqlite                   # Registro de background tasks (SQLite)

<workspace>/                          # Diretório do projeto/agente
├── AGENTS.md                         # Standing orders, regras, processos
├── SOUL.md                           # Personalidade/papel do agente
├── TOOLS.md                          # Ferramentas disponíveis
├── IDENTITY.md                       # Identidade do agente
├── USER.md                           # Config de usuários
├── HEARTBEAT.md                      # Checklist do heartbeat
├── BOOTSTRAP.md                      # Bootstrapping na inicialização
├── MEMORY.md                         # Índice de memórias
├── memory/                           # Memórias persistentes (via hook session-memory)
├── hooks/                            # Hooks do workspace
└── ...
```

### Onde fica cada coisa:
| Dado | Local | Formato |
|------|-------|---------|
| **Configuração geral** | `~/.openclaw/config.json` | JSON5 |
| **Jobs de cron** | `~/.openclaw/cron/jobs.json` | JSON |
| **Estado de cron** | `~/.openclaw/cron/jobs-state.json` | JSON |
| **Background tasks** | `$OPENCLAW_STATE_DIR/tasks/runs.sqlite` | SQLite |
| **Memórias do agente** | `<workspace>/memory/` | Markdown |
| **Standing orders** | `<workspace>/AGENTS.md` | Markdown |
| **Personalidade** | `<workspace>/SOUL.md` | Markdown |
| **Heartbeat checklist** | `<workspace>/HEARTBEAT.md` | Markdown |
| **Hooks do usuário** | `~/.openclaw/hooks/` | JS/TS |
| **Hooks do workspace** | `<workspace>/hooks/` | JS/TS |
| **Logs de comandos** | `~/.openclaw/logs/commands.log` | Text |
| **Skills/plugins** | Via ClawHub | Variado |

---

## 6. Autenticação e Credenciais

### Tipos de credencial suportados
| Tipo | Descrição | Portabilidade |
|------|-----------|---------------|
| **Token** | Valor inline ou referência | Portável por padrão (copiada para subagentes) |
| **OAuth** | Com refresh token handling | NÃO portável por padrão (opt-in com `copyToAgents: true`) |
| **API Key** | Chave de API tradicional | Portável por padrão |
| **AWS SDK** | Routing metadata | Credenciais de runtime, não armazenadas |
| **External CLI** | Descoberta de CLIs externos | Runtime-only, descoberta sob demanda |

### Regras de elegibilidade
- Se `expires` está presente, precisa ser número finito > 0
- Se `expires` é inválido (NaN, 0, negativo, não-finito, tipo errado) → perfil inelegível
- `auth.order.<provider>` filtra explicitamente quais perfis usar (previne fallback silencioso)

### Seleção de modelo LLM (precedência para jobs isolados)
1. Override de hook Gmail (quando aplicável)
2. `model` no payload do job
3. Override de sessão de cron armazenado
4. Seleção padrão do agente

---

## 7. Segurança

### Proteções
- **Hook security** — Endpoints devem estar atrás de loopback, tailnet ou reverse proxy confiável
- **Token dedicado para hooks** — Usar token específico, não reutilizar
- **`hooks.allowedAgentIds`** — Limitar quais agentes podem rotear hooks
- **`hooks.allowRequestSessionKey=false`** — Desabilitar a menos que sessões caller-selected sejam necessárias
- **OAuth SecretRef** — Não suportado para tipo oauth (proteção contra vazamento)
- **Credential portability controls** — `copyToAgents: false` para credenciais sensíveis

### Compaction e Memória
- Sessões podem ser compactadas (summarizar histórico)
- Hooks `session:compact:before` e `session:compact:after` para observar/reagir
- Métricas: `messageCount`, `tokenCount`, `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

---

## 8. Configuração (Exemplos Reais da Documentação)

### Config de canal iMessage
```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/opt/homebrew/bin/imsg",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
      includeAttachments: true,
    },
  },
}
```

### Config de cron
```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

### Config de hooks
```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    internal: {
      enabled: true,
      entries: {
        "session-memory": { enabled: true },
        "command-logger": { enabled: false },
      },
    },
  },
}
```

---

## 9. Padrões de Workflow Recomendados

### Execute-Verify-Report
Toda task de standing order deve seguir:
1. **Execute** — Faz o trabalho real
2. **Verify** — Confirma que o resultado está correto
3. **Report** — Diz ao dono o que foi feito e o que foi verificado

### Reliable Scheduled Workflow
Combinar:
- **Cron** para timing
- **Session persistente** (`session:<id>`) para acumular contexto
- **Task Flow** para tracking multi-step durável
- **Standing Orders** para autoridade permanente

---

## 10. O Que Isso Significa Para o Curso

### Correto dizer no curso:
- "O OpenClaw é um gateway de orquestração de agentes que roda 24/7 no seu servidor"
- "Skills são processos que o agente executa — vindos do ClawHub ou criados por você"
- "Crons agendam tarefas com timing preciso: relatórios, cobranças, rotinas"
- "Heartbeats verificam condições periodicamente e reagem: estoque baixo, prazo vencendo"
- "Standing Orders dão autoridade permanente ao agente para programas definidos"
- "Multiagentes delegam trabalho: agente principal → subagentes especializados"
- "Memórias ficam em `<workspace>/memory/` como arquivos Markdown"
- "Configuração é JSON5 em `~/.openclaw/config.json`"

### Errado dizer no curso (alucinações a evitar):
- ~~"O OpenClaw é um chatbot"~~ — É um gateway de orquestração
- ~~"Precisa de API Key da OpenAI"~~ — Depende do provider configurado; suporta múltiplos
- ~~"Skills são escritas em Python/JavaScript"~~ — Vêm do ClawHub ou workspace; formato específico
- ~~"O agente roda na nuvem automaticamente"~~ — Precisa de VPS/servidor dedicado
- ~~"Heartbeats são iguais a crons"~~ — Heartbeats verificam condições na sessão principal; crons executam em timing preciso podendo ser isolados
- ~~"O agente lembra tudo automaticamente"~~ — Memória precisa do hook `session-memory` ativado
- ~~"Funciona com qualquer hospedagem"~~ — Precisa de VPS (processo contínuo, não compartilhada)
