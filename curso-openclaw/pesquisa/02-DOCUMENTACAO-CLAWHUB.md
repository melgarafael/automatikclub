# Documentação Técnica OpenClaw + ClawHub — Deep Dive
> Pesquisa realizada em 2026-05-27 | Fontes: docs.openclaw.ai, clawhub.ai, GitHub, comunidade

---

## 1. Visão Geral do OpenClaw

**O que é:** Gateway self-hosted que conecta apps de chat e superfícies de canal a agentes de IA. MIT licensed. 350K+ stars no GitHub (abril 2026).

**Requisitos de sistema:**
- Node.js 24 (recomendado) ou Node 22.19+
- macOS / Linux / Windows (WSL2 recomendado)
- API key de provedor de modelo (Anthropic, OpenAI, Google, etc.)
- Gateway roda na porta 18789 por padrão

**Instalação:**
```bash
# macOS / Linux
curl -fsSL https://openclaw.ai/install.sh | bash

# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex

# Onboarding (2 minutos)
openclaw onboard --install-daemon

# Verificar
openclaw gateway status
openclaw dashboard
```

**Variáveis de ambiente para paths customizados:**
- `OPENCLAW_HOME`
- `OPENCLAW_STATE_DIR`
- `OPENCLAW_CONFIG_PATH`

---

## 2. Estrutura da Documentação Oficial (docs.openclaw.ai)

### Mapa de seções
| Seção | URL | Conteúdo |
|-------|-----|----------|
| Getting Started | `/start/getting-started` | Instalação, requisitos |
| Onboarding Wizard | `/start/wizard` | Setup guiado |
| Control UI | `/web/control-ui` | Dashboard web |
| Configuration | `/gateway/configuration` | Config principal |
| Config Reference | `/gateway/configuration-reference` | Todas as opções |
| Remote Access | `/gateway/remote` | Acesso remoto |
| Security | `/gateway/security` | Segurança |
| Tailscale | `/gateway/tailscale` | VPN integration |
| Troubleshooting | `/gateway/troubleshooting` | Erros e soluções |
| Channels | `/channels` | Discord, Telegram, WhatsApp, etc. |
| Multi-Agent | `/concepts/multi-agent` | Roteamento multi-agente |
| Features | `/concepts/features` | Lista completa de features |
| Tools | `/tools` | Ferramentas built-in |
| Automation | `/automation` | Cron, heartbeat, standing orders |
| Standing Orders | `/automation/standing-orders` | Ordens permanentes |
| Heartbeat | `/gateway/heartbeat` | Config de heartbeat |
| Nodes | `/nodes` | Mobile/devices |

---

## 3. Arquivos de Workspace (Bootstrap Files)

O OpenClaw injeta automaticamente estes arquivos em cada sessão:

| Arquivo | Função |
|---------|--------|
| **SOUL.md** | Personalidade, tom, valores, limites comportamentais |
| **AGENTS.md** | Regras operacionais, SOPs, roteamento, segurança, standing orders |
| **USER.md** | Info do usuário/operador (timezone, preferências) |
| **TOOLS.md** | Skills e ferramentas disponíveis, instruções de uso |
| **IDENTITY.md** | Nome, avatar, persona pública |
| **HEARTBEAT.md** | Checklist periódico de verificações |
| **BOOTSTRAP.md** | Instruções de inicialização de sessão |
| **MEMORY.md** | Memória de longo prazo (fatos persistentes) |

### Localização
- Diretório principal: `~/.openclaw/workspace/`
- Templates oficiais: `docs/reference/templates/` no GitHub

### Princípio de separação
- SOUL.md = quem o agente É (identidade)
- AGENTS.md = o que o agente FAZ (regras/processos)
- USER.md = quem é o DONO (contexto pessoal)
- TOOLS.md = COM O QUE o agente trabalha (ferramentas)

### Template AGENTS.md — Diretivas-chave do default
- "Don't dump directories or secrets into chat. Don't run destructive commands unless explicitly asked."
- Ler SOUL.md, USER.md e daily memory antes de responder
- Manter logs diários em `memory/YYYY-MM-DD.md`
- Fatos de longo prazo em MEMORY.md
- 17+ ferramentas integradas (macOS, messaging, smart home, produtividade, IA)

### Repositório de templates comunitários
- **162 templates** em 19 categorias: github.com/mergisi/awesome-openclaw-agents
- Categorias: Productivity, Development, Marketing, Business, Personal, DevOps, Finance, Education, Healthcare, Legal, HR, Creative, Security, E-Commerce, Data, SaaS, Real Estate, Freelance, Supply Chain

---

## 4. Configuração Completa (config.json5)

**Localização:** `~/.openclaw/openclaw.json` (formato JSON5)
**Hot-reload:** Sim — detecta mudanças automaticamente
**Suporte a `$include`:** Sim — dividir config em múltiplos arquivos

### 4.1 Estrutura raiz

```
openclaw.json
├── gateway          # Porta, bind, auth, TLS, reload
├── agents           # Defaults, lista, modelo, heartbeat, memória
├── channels         # Telegram, Discord, WhatsApp, etc.
├── models           # Providers, pricing, routing
├── mcp              # Model Context Protocol servers
├── skills           # ClawHub, dirs extras, entries
├── plugins          # Enable/deny, slots, entries
├── browser          # CDP, profiles, SSRF, tabs
├── cron             # Scheduler, retry, alerts
├── hooks            # Webhooks, Gmail, transforms
├── secrets          # Providers (env, file, exec)
├── auth             # Profiles, cooldowns, OAuth
├── env              # Environment variables
├── logging          # Level, file, redaction
├── diagnostics      # OTEL, stuck sessions, cache trace
├── update           # Channel (stable/beta/dev), auto
├── acp              # Async Compute Protocol
├── ui               # Theme color, assistant name/avatar
├── cli              # Banner config
├── discovery        # mDNS, wide-area DNS-SD
├── commitments      # Inferred follow-ups
└── wizard           # Metadata do setup
```

### 4.2 Hidden Gems — Opções pouco conhecidas

| Opção | O que faz | Default |
|-------|-----------|---------|
| `gateway.reload.mode: "hybrid"` | Hot-reload sem restart | `"hybrid"` |
| `gateway.channelHealthCheckMinutes` | Monitor saúde dos canais | 5 min |
| `gateway.channelMaxRestartsPerHour` | Limite de restarts automáticos | 10 |
| `browser.tabCleanup.idleMinutes` | Fecha tabs ociosas | 120 min |
| `browser.tabCleanup.maxTabsPerSession` | Limite de tabs simultâneas | 8 |
| `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` | Acesso a rede privada | false |
| `cron.retry.maxAttempts` | Retry automático em falhas | 3 |
| `cron.retry.retryOn` | Tipos de erro que disparam retry | rate_limit, overloaded, network, timeout, server_error |
| `cron.failureAlert.after` | Alertar após N falhas consecutivas | 3 |
| `diagnostics.otel.enabled` | OpenTelemetry nativo | false |
| `diagnostics.otel.captureContent` | Capturar conteúdo de msgs/tools | false |
| `diagnostics.stuckSessionWarnMs` | Detectar sessões travadas | 30000ms |
| `diagnostics.memoryPressureSnapshot` | Snapshot pré-OOM | false |
| `plugins.slots.memory` | Plugin de memória ativo | `"memory-core"` |
| `plugins.slots.contextEngine` | Engine de contexto | `"legacy"` |
| `models.pricing.enabled` | Preços de modelos via OpenRouter | true |
| `commitments.enabled` | Follow-ups inferidos | false |
| `commitments.maxPerDay` | Limite de commitments | 3 |
| `acp.enabled` | Async Compute Protocol | false |
| `acp.stream.deliveryMode` | "live" vs "final_only" | "live" |
| `secrets.providers.*.source: "exec"` | Resolver secrets via comando externo (Vault) | — |
| `discovery.mdns.mode` | mDNS Bonjour advertising | "minimal" |
| `env.shellEnv.enabled` | Carregar vars do shell profile | true |
| `logging.redactSensitive: "tools"` | Redactar dados sensíveis nos logs | "tools" |
| `memory-core.config.dreaming.enabled` | Consolidação de memória automática (cron) | false |
| `memory-core.config.dreaming.frequency` | Cron expression do dreaming | "0 3 * * *" |

### 4.3 Segurança — Opções críticas

```json5
{
  gateway: {
    bind: "loopback",           // NUNCA "0.0.0.0" sem auth!
    auth: {
      mode: "token",            // "none" | "token" | "password" | "trusted-proxy"
      rateLimit: {
        maxAttempts: 10,
        lockoutMs: 300000       // 5 min lockout
      }
    }
  }
}
```

### 4.4 Multi-instância (isolamento)

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

---

## 5. Automação: Cron, Heartbeat, Standing Orders

### 5.1 Heartbeat

**O que é:** Turns periódicos do agente na sessão principal (~30min). Batcha verificações de inbox, calendário, notificações.

**Campos-chave:**

| Campo | Default | Descrição |
|-------|---------|-----------|
| `every` | "30m" | Intervalo ("0m" desativa) |
| `model` | agent default | Override de modelo |
| `isolatedSession` | false | Sessão limpa (economia de tokens) |
| `lightContext` | false | Só HEARTBEAT.md no contexto |
| `skipWhenBusy` | false | Pular se agente ocupado |
| `target` | "none" | Destino: "last", "none", channel ID |
| `activeHours` | — | Janela de horário (start/end/timezone) |
| `ackMaxChars` | 300 | Max chars após HEARTBEAT_OK |

**Contrato de resposta:**
- `HEARTBEAT_OK` → nada precisa de atenção
- Texto de alerta → algo precisa de ação
- `heartbeat_respond` tool → com `notify: true/false`

**Template HEARTBEAT.md com tasks:**
```md
tasks:
- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions
- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

**Otimização de custo:**
- `isolatedSession: true` → de ~100K tokens para 2-5K
- `lightContext: true` → só HEARTBEAT.md
- Modelo mais barato (GPT-4o Mini, Haiku)

### 5.2 Cron Jobs

**O que é:** Scheduler built-in com timing exato, persistência de jobs, entrega para chat ou webhook.

```json5
cron: {
  enabled: true,
  maxConcurrentRuns: 8,
  sessionRetention: "24h",
  retry: {
    maxAttempts: 3,
    backoffMs: [30000, 60000, 300000],
    retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"]
  },
  failureAlert: {
    enabled: false,
    after: 3,
    cooldownMs: 3600000
  }
}
```

**Exemplos de cron expressions para cases reais:**

| Expressão | Quando | Case |
|-----------|--------|------|
| `0 8 * * 1-5` | Seg-Sex 8h | Triagem de inbox matinal |
| `0 16 * * 5` | Sexta 16h | Relatório semanal |
| `0 9 1 * *` | Dia 1 às 9h | Fechamento mensal |
| `0 */4 * * *` | A cada 4h | Monitoramento de sistemas |
| `30 7 * * *` | Todo dia 7:30 | Briefing diário |
| `0 22 * * 0` | Domingo 22h | Backup semanal |
| `0 5 * * 1` | Segunda 5h | Coleta de dados de mercado |

**CLI:**
```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/Sao_Paulo \
  --message "Execute daily inbox triage per standing orders."
```

### 5.3 Standing Orders

**O que são:** Autoridade operacional permanente para programas definidos. Residem no AGENTS.md e são injetadas em toda sessão.

**Estrutura obrigatória:**
1. **Scope** — Ações autorizadas
2. **Triggers** — Quando executar
3. **Approval gates** — O que precisa de aprovação humana
4. **Escalation rules** — Quando escalar para humano

**Padrão Execute-Verify-Report:**
- Execute → Complete o trabalho real
- Verify → Confirme que funcionou (arquivo criado, msg enviada)
- Report → Comunique o que fez e resultado da verificação

**Exemplo — Processamento Financeiro:**
```md
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives
1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules
- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

**Exemplo — Monitoramento de Sistemas:**
```md
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Response matrix
| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

**Exemplo — Relatório Semanal:**
```md
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source unavailable or metrics unusual (>2σ from norm)

### Execution steps
1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/
```

**Best practices:**
- Comece com autoridade restrita, expanda incrementalmente
- Defina approval gates explícitos para ações de alto risco
- Inclua seção "What NOT to do" — limites importam tanto quanto permissões
- Combine com cron para enforcement temporal
- Revise logs semanalmente
- Trate como documentos vivos

---

## 6. ClawHub — Marketplace de Skills

### 6.1 Visão geral
- **URL:** clawhub.ai
- **GitHub:** github.com/openclaw/clawhub
- **Escala:** 15.000+ skills (março 2026), crescendo de 127 em nov/2025
- **Conceito:** "npm para agentes de IA"
- **Tech stack:** TanStack Start (React) + Convex (DB) + OpenAI embeddings (busca vetorial)
- **Auth:** GitHub OAuth (conta com 1+ semana)

### 6.2 Formato de uma Skill

Cada skill é um diretório com um `SKILL.md` + arquivos de suporte.

**Frontmatter YAML:**
```yaml
name: skill-name
description: Purpose of the skill
metadata:
  openclaw:
    requires:
      env: [REQUIRED_ENV_VARS]
      bins: [required_binaries]
    primaryEnv: PRIMARY_API_KEY
```

**Publicação:**
```bash
clawhub skill publish <path>
```

### 6.3 Pipeline de verificação (segurança)

4 etapas obrigatórias:
1. **Install** — Instala dependências
2. **Import** — Importa o skill
3. **Smoke Test** — Testa execução básica
4. **Unit Tests** — Roda testes automatizados

### 6.4 Categorias de Skills

**Distribuição por tipo:**
- Web Automation: 45%
- Data Processing: 30%
- API Integrations: 15%
- Robotics/IoT: 10%

**Categorias populares:**
- AI Personas (mais popular)
- Self-improvement tools (4 dos top 25)
- Produtividade
- Desenvolvimento
- Automação
- Busca/Pesquisa
- Comunicação
- Smart home

### 6.5 Skills mais populares (2026)

| Skill | Installs | O que faz |
|-------|----------|-----------|
| Deep Research Agent | 35K+ | Pesquisa profunda multi-fonte |
| Self-Improving Agent | Top 10 | Aprende com erros, melhora com o tempo |
| Document Summarizer | 10K+ | Sumariza documentos |
| GitHub | Top 10 | Integração completa com GitHub |
| Gog (Google) | Top 10 | Google Suite integration |
| Proactive Agent | Top 10 | Agente que age sem ser pedido |
| Skill Vetter | Top 10 | Valida qualidade de skills |
| SkillScan | Top 10 | Scanneia skills disponíveis |
| Weather | Top 10 | Previsão do tempo |
| Polymarket | Top 10 | Mercados de previsão |
| Frontend Design | Recomendado | UI production-grade |
| Eleven Labs Agent | Recomendado | Voz + chamadas telefônicas |
| Exa Search | Recomendado | Busca dev-focused (docs, GitHub) |

### 6.6 Configuração de skills no config.json5

```json5
skills: {
  allowBundled: ["gemini", "peekaboo"],
  load: {
    extraDirs: ["~/Projects/agent-scripts/skills"],
    allowSymlinkTargets: ["~/Projects/manager/skills"]
  },
  install: {
    preferBrew: true,
    nodeManager: "npm"    // "npm" | "pnpm" | "yarn" | "bun"
  },
  entries: {
    "my-skill": {
      enabled: true,
      apiKey: { source: "env", provider: "default", id: "MY_API_KEY" },
      env: { KEY: "value" }
    }
  }
}
```

---

## 7. Ferramentas Built-in

| Categoria | Ferramentas | Uso |
|-----------|-------------|-----|
| **Runtime** | exec, process, code_execution | Rodar comandos, gerenciar processos |
| **Files** | read, write, edit, apply_patch | Ler/escrever arquivos no workspace |
| **Web** | web_search, x_search, web_fetch | Pesquisar web, buscar páginas |
| **Browser** | browser | Automação de navegador (CDP) |
| **Messaging** | message | Enviar respostas e ações |
| **Sessions** | sessions_*, subagents, agents_list | Delegar trabalho, inspecionar sessões |
| **Automation** | cron, heartbeat_respond | Agendar, responder heartbeat |
| **Gateway** | gateway, nodes | Estado do gateway, devices |
| **Media** | image, image_generate, music_generate, video_generate, tts | Gerar/analisar mídia |
| **Catalog** | tool_search, tool_search_code, tool_describe | Buscar tools sem carregar todos |

**Provedores de busca web suportados:**
Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax, Ollama, Perplexity, SearXNG, Tavily

---

## 8. MCP (Model Context Protocol)

### Configuração
```json5
mcp: {
  sessionIdleTtlMs: 600000,    // 10 min idle timeout
  servers: {
    "my-server": {
      command: "npx",           // stdio MCP
      args: ["-y", "@mcp/server-name"],
      // OU remote:
      url: "https://example.com/mcp",
      transport: "streamable-http",
      headers: { Authorization: "Bearer ..." }
    }
  }
}
```

### MCP Servers populares
- GitHub (@modelcontextprotocol/server-github)
- Postgres (@modelcontextprotocol/server-postgres)
- Filesystem (@modelcontextprotocol/server-filesystem)
- Slack (@modelcontextprotocol/server-slack)
- Google Drive (@modelcontextprotocol/server-google-drive)
- Notion (mcp-notion-server)
- Puppeteer (browser automation)
- **500+ community-built** no npm e GitHub
- Stripe, Shopify, Linear, Jira, Confluence com servers oficiais ou comunitários

---

## 9. Canais suportados

### Built-in
Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, WhatsApp

### Bundled plugins
Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal

### Opcionais
Voice Call, WeChat, third-party extensíveis

---

## 10. Troubleshooting — Comandos de diagnóstico

**Sequência padrão:**
```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

### Erros mais comuns e soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `EADDRINUSE` | Porta ocupada | `lsof -i :18789` e matar processo |
| `refusing to bind without auth` | Bind não-loopback sem auth | Configurar token/password |
| `config reload skipped (invalid config)` | JSON5 inválido | `openclaw config validate` |
| `protocol mismatch` | Versão client/gateway diferente | Matar processo antigo, reiniciar |
| `plugin load failed` | Dependência corrompida | `openclaw doctor --fix` |
| `HTTP 429 long context` | Credential sem acesso a 1M | Trocar modelo ou credential |
| `Skipping escaped skill path` | Symlink fora do root | Adicionar ao `allowSymlinkTargets` |
| Gateway OOM | Sessões muito grandes | `diagnostics.memoryPressureSnapshot: true` |
| Heartbeat skipped | Fora do `activeHours` ou busy | Verificar janela de horário |

---

## 11. Dicas de Power User

1. **Model routing**: Use modelos baratos (Haiku, GPT-4o Mini) para tarefas simples, premium para raciocínio complexo
2. **Memory search**: Use `memory_search` ao invés de carregar memória inteira no contexto
3. **Sub-agent parallelism**: Disparar sub-agents concorrentes é drasticamente mais rápido
4. **Dreaming**: Ative `memory-core.config.dreaming.enabled: true` para consolidação automática de memória às 3h
5. **Cron retry**: Configure retry automático para jobs que dependem de APIs externas
6. **Failure alerts**: Ative `cron.failureAlert` para ser notificado de falhas consecutivas
7. **OTEL**: Ative `diagnostics.otel` para observabilidade completa com traces e métricas
8. **Browser profiles**: Crie profiles separados para navegação isolada
9. **$include**: Divida config em arquivos por domínio (agents.json5, channels.json5, etc.)
10. **Active hours**: Restrinja heartbeats para horário comercial para economizar tokens

---

## Fontes

- [Documentação oficial](https://docs.openclaw.ai/)
- [Config Reference](https://docs.openclaw.ai/gateway/configuration-reference)
- [Features](https://docs.openclaw.ai/concepts/features)
- [Automation](https://docs.openclaw.ai/automation)
- [Standing Orders](https://docs.openclaw.ai/automation/standing-orders)
- [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat)
- [Troubleshooting](https://docs.openclaw.ai/gateway/troubleshooting)
- [GitHub OpenClaw](https://github.com/openclaw/openclaw)
- [GitHub ClawHub](https://github.com/openclaw/clawhub)
- [ClawHub](https://clawhub.ai/)
- [Default AGENTS.md](https://docs.openclaw.ai/reference/AGENTS.default)
- [Awesome OpenClaw Agents (162 templates)](https://github.com/mergisi/awesome-openclaw-agents)
- [Awesome OpenClaw Skills (5,400+)](https://github.com/VoltAgent/awesome-openclaw-skills)
- [OpenClaw Optimization Guide](https://github.com/OnlyTerp/openclaw-optimization-guide)
- [OpenClaw Best Practices (200+ hours)](https://www.mindstudio.ai/blog/openclaw-best-practices-power-users-200-hours)
- [OpenClaw Statistics 2026](https://www.getpanto.ai/blog/openclaw-ai-platform-statistics)
- [Best ClawHub Skills Guide (DataCamp)](https://www.datacamp.com/blog/best-clawhub-skills)
- [Top 10 Skills (Composio)](https://composio.dev/content/top-openclaw-skills)
- [Heartbeat vs Cron Guide](https://www.clawnify.com/resources/heartbeat-vs-cron-openclaw-guide-2026)
