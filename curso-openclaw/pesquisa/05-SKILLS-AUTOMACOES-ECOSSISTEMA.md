# Pesquisa: Skills, Automações e Ecossistema OpenClaw

> Pesquisado em: 2026-05-27
> Fontes: Documentação oficial, ClawHub, GitHub, comparativos independentes
> Objetivo: Alimentar o curso AutomatikLabs com dados reais do ecossistema

---

## 1. SKILLS — Marketplace e Arquitetura

### 1.1 Tamanho do Ecossistema

- **ClawHub** (marketplace oficial): **13.729 skills** registradas (fev/2026)
- **Curadas** (repo VoltAgent/awesome-openclaw-skills): **5.211 skills** filtradas de spam, duplicatas e maliciosas
- **Removidas**: 4.065 spam/bots, 1.040 duplicatas, 851 baixa qualidade, 886 crypto/blockchain, 373 maliciosas

> **ALERTA DE SEGURANÇA — ClawHavoc (2026):** Ataque coordenado distribuiu centenas de skills maliciosas via ClawHub usando typosquatting. Skills falsos continham reverse shells e exfiltravam SSH keys, API tokens e cookies. **Sempre revisar código-fonte antes de instalar skills de terceiros.**

### 1.2 Categorias Principais (por volume)

| Categoria | Qtd | Exemplos Notáveis |
|-----------|-----|-------------------|
| Coding Agents & IDEs | 1.184 | `coding-agent`, `2nd-brain`, `academic-research` |
| Web & Frontend | 919 | `actionbook` (scraping), `aeo-analytics-free` |
| DevOps & Cloud | 393 | `agentic-devops`, `agent-self-governance` |
| Search & Research | 345 | `academic-deep-research`, `agent-deep-research` |
| Browser & Automation | 323 | `Agent Browser` (Rust headless), `agent-device` (iOS/Android) |
| Productivity & Tasks | 206 | `agent-autopilot`, `agent-task-manager`, `checkmate` |
| AI & LLMs | 176 | `agent-autonomy-kit`, `adaptive-reasoning` |
| Image & Video | 170 | `ai-video-gen`, `album-cover-generation` |
| Git & GitHub | 167 | `agent-team-orchestration`, `arc-security-audit` |
| Communication | 146 | Integrações com email, Slack, Discord, Telegram |
| Transportation | 110 | `amadeus-flights`, `aviation-weather` |
| Marketing & Sales | 103 | `affiliate-master`, `apollo`, `brand-voice-profile` |
| Notes & PKM | 69 | `agent-memory-ultimate`, `bear-notes` |
| Apple Apps | 44 | `apple-health-skill`, `apple-music`, `icloud-findmy` |

### 1.3 Arquitetura de uma Skill

**Estrutura de arquivos:**
```
minha-skill/
├── SKILL.md          ← Metadados + instruções (YAML frontmatter)
└── (opcional) scripts, handlers
```

**SKILL.md — Formato obrigatório:**
```yaml
---
name: relatorio-vendas-diario
description: "Compila vendas do dia, calcula métricas e gera relatório estruturado"
user-invocable: true
metadata:
  {"openclaw": {"emoji": "📊", "requires": {"bins": ["node"]}, "install": [{"type": "brew", "package": "node"}]}}
---

# Relatório de Vendas Diário

Instruções detalhadas do processo aqui...
```

**Campos do frontmatter:**
- `name` (obrigatório): identificador slug
- `description` (obrigatório): o que a skill faz
- `user-invocable` (bool, default true): expõe como `/comando`
- `disable-model-invocation` (bool): impede que o modelo invoque sozinho
- `command-dispatch` ("tool"): bypass do modelo, despacha direto para ferramenta
- `homepage` (URL): link para docs externas
- `metadata.openclaw.emoji`: ícone na UI
- `metadata.openclaw.requires`: gates de dependência (bins, env, config, os)
- `metadata.openclaw.install`: instaladores (brew, node, go, uv, download)

### 1.4 Precedência de Carregamento (maior → menor)

1. **Workspace**: `<workspace>/skills`
2. **Project agent**: `<workspace>/.agents/skills`
3. **Personal agent**: `~/.agents/skills`
4. **Managed/local**: `~/.openclaw/skills`
5. **Bundled**: vem com a instalação
6. **Extra folders**: `skills.load.extraDirs` (config)

> Mesmo nome em múltiplos locais → a fonte de maior prioridade vence.

### 1.5 Instalação

```bash
# Instalar do ClawHub (workspace local)
openclaw skills install <slug>

# Instalar globalmente (compartilhado entre workspaces)
openclaw skills install <slug> --global

# Instalar de repositório Git
openclaw skills install git:owner/repo@ref

# Atualizar todas
openclaw skills update --all [--global]
```

**Custo de tokens por skill carregada:** ~24 tokens (overhead base 195 chars + ~97 chars por skill). Com 20 skills = ~480 tokens adicionais no contexto.

### 1.6 Skills de Destaque para o Curso

**Produtividade e Execução de Processos:**
| Skill | O que faz | Relevância para o curso |
|-------|-----------|------------------------|
| `agent-autopilot` | Self-driving agent com heartbeat e progress reports | M5 — Automações |
| `agent-task-manager` | Gestão multi-step, stateful | M5A3 — Skills encadeadas |
| `checkmate` | Enforce de pass/fail em tarefas | M4A5 — Testando processos |
| `autonomous-executor` | Self-healing, error-recovering | M5A5 — Heartbeats |
| `close-loop` | End-of-session shipping + memory consolidation | M3A7 — Memória |
| `briefing` | Daily briefing (calendar + todos + weather) | M5A4 — Crons |
| `ops-hygiene` | SOPs para manutenção de agente | M10A1 — Checklist produção |
| `session-watchdog` | Monitor de contexto + checkpoints | M8A7 — Mission Control |
| `task-resume` | Resume automático de tarefas interrompidas | M5A5 — Heartbeats |
| `model-manager` | Routing de tasks para modelos mais baratos | M9A3 — Precificação |
| `nag` | Lembretes persistentes até confirmação | M5A4 — Crons |
| `workflow-engine` | Orquestração queue-driven | M5A3 — Skills avançadas |
| `zero-rules` | Intercepta tarefas determinísticas antes do LLM | Otimização de custo |

**Integrações Operacionais:**
| Skill | O que faz |
|-------|-----------|
| `clickup-skill` | Gestão de projetos ClickUp |
| `asana` | Integração Asana REST API |
| `wrike` | Gestão de tarefas Wrike |
| `vikunja-tasks` | Kanban self-hosted |
| `recruiter-assistant` | Workflow completo de recrutamento |
| `invoice-tracker-pro` | Faturamento freelance completo |
| `smart-expense-tracker` | Controle de despesas e orçamento |
| `excel-workflow` | Workflow Excel + Google Drive sync |
| `hylo-ghl` | GoHighLevel com 102 ações verificadas |

**Multi-agentes e Orquestração:**
| Skill | O que faz |
|-------|-----------|
| `agent-team-orchestration` | Times multi-agentes com papéis definidos |
| `multi-agent-orchestration` | Delegação multi-agente com audit logging |
| `task-orchestra` | Coordenação de múltiplos agentes para workflows complexos |
| `agent-weave` | Cluster Master-Worker para execução paralela |
| `evo-clone` | Clona consciência do agente em sub-agentes especializados |
| `pinchwork` | Delega tarefas para outros agentes |
| `arc-department-manager` | Agentes organizados em departamentos |
| `parley` | Estado de coordenação durável com recovery |

---

## 2. CRON — Agendamento de Processos

### 2.1 Tipos de Schedule

| Tipo | Flag | Formato | Exemplo |
|------|------|---------|---------|
| **One-shot** | `--at` | ISO 8601 ou relativo | `"2026-06-01T09:00:00Z"` ou `"20m"` |
| **Intervalo** | `--every` | Duração fixa | `"6h"` |
| **Cron expression** | `--cron` | 5 ou 6 campos (padrão Vixie) | `"0 7 * * *"` |

### 2.2 Exemplos Práticos de Crons

**Relatório matinal (isolado, com entrega em canal):**
```bash
openclaw cron add \
  --name "Relatório matinal" \
  --cron "0 7 * * *" \
  --tz "America/Sao_Paulo" \
  --session isolated \
  --message "Gere o relatório de vendas de ontem: total faturado, qtd pedidos, ticket médio, produto mais vendido. Compare com o dia anterior." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:456"
```

**Análise semanal profunda (modelo Opus):**
```bash
openclaw cron add \
  --name "Análise semanal" \
  --cron "0 6 * * 1" \
  --tz "America/Sao_Paulo" \
  --session isolated \
  --message "Análise semanal: desempenho de vendas, tendências de estoque, gargalos operacionais. Recomende 3 ações prioritárias." \
  --model "opus" \
  --thinking high \
  --announce
```

**Lembrete one-shot:**
```bash
openclaw cron add \
  --name "Lembrete reunião" \
  --at "2026-06-02T14:00:00-03:00" \
  --session main \
  --system-event "Lembrete: reunião com fornecedor em 30 minutos. Prepare o pedido de reposição." \
  --wake now \
  --delete-after-run
```

**Verificação de estoque a cada 6 horas:**
```bash
openclaw cron add \
  --name "Check estoque" \
  --every "6h" \
  --session isolated \
  --message "Verifique estoque de todos os produtos. Liste itens abaixo do mínimo com quantidade atual e mínimo definido."
```

**Backup operacional diário:**
```bash
openclaw cron add \
  --name "Backup configs" \
  --cron "0 3 * * *" \
  --session isolated \
  --message "Execute backup: tar configs, push para GitHub, confirme sucesso." \
  --light-context
```

**Processamento de cobranças mensais (dia 5):**
```bash
openclaw cron add \
  --name "Cobranças mensais" \
  --cron "0 9 5 * *" \
  --tz "America/Sao_Paulo" \
  --session isolated \
  --message "Processe cobranças do mês: verifique faturas pendentes, gere lembretes para inadimplentes, compile relatório." \
  --model "opus" \
  --announce
```

### 2.3 Modos de Execução (Session Types)

| Modo | Valor | Comportamento | Caso de uso |
|------|-------|---------------|-------------|
| **Main** | `main` | Roda na sessão principal, pode acionar heartbeat | Lembretes do sistema |
| **Isolated** | `isolated` | Sessão limpa por execução, ID `cron:<jobId>` | Relatórios, trabalho de fundo |
| **Current** | `current` | Vinculado à sessão ativa no momento da criação | Tasks recorrentes com contexto |
| **Custom** | `session:custom-id` | Sessão nomeada persistente | Workflows multi-run |

### 2.4 Gerenciamento de Crons

```bash
openclaw cron list                    # Listar todos
openclaw cron get <jobId>             # Detalhes em JSON
openclaw cron run <jobId>             # Forçar execução imediata
openclaw cron run <jobId> --wait      # Executar e esperar conclusão
openclaw cron runs --id <jobId> --limit 50  # Histórico de execuções
openclaw cron edit <jobId> --message "..." # Editar prompt
openclaw cron remove <jobId>          # Deletar
```

### 2.5 Configuração Avançada

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"]
    },
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 }
  }
}
```

### 2.6 Entrega de Resultados

| Modo | Comportamento |
|------|---------------|
| `announce` | Fallback: envia resultado pro canal-alvo se o agente não enviou |
| `webhook` | POST do payload para URL externa |
| `none` | Sem entrega automática |

**Sintaxe de destino por canal:**
- Telegram: `-1001234567890` ou com tópico: `-1001234567890:topic:123`
- Slack/Discord: `channel:<id>`, `user:<id>`

---

## 3. HEARTBEAT — Agente Proativo

### 3.1 Conceito

O heartbeat é um "pulso" periódico (default: cada 30 minutos) que faz o agente acordar, ler o `HEARTBEAT.md`, e verificar se algo precisa de atenção. Diferente do cron (timing preciso), o heartbeat é um "check-in" periódico que batcha múltiplas verificações.

### 3.2 HEARTBEAT.md — Formato

**Checklist simples:**
```markdown
# Heartbeat checklist

- Scan rápido: algo urgente nas caixas de entrada?
- Se for horário comercial, faça check-in se não houver pendências.
- Se uma tarefa estiver bloqueada, registre o que falta e pergunte ao Pedro na próxima vez.
```

**Com bloco `tasks:` (intervalos por tarefa):**
```markdown
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Verifique emails urgentes não lidos e sinalize o que for time-sensitive."

- name: estoque-critico
  interval: 2h
  prompt: "Verifique estoque. Se algum item estiver abaixo do mínimo, gere alerta com nome, quantidade atual e mínimo."

- name: cobrancas-atrasadas
  interval: 4h
  prompt: "Verifique pagamentos com mais de 3 dias de atraso. Para cada um, gere lembrete automático."

- name: metricas-vendas
  interval: 1h
  prompt: "Compare vendas da última hora com a média. Se estiver 30% abaixo, alerte o gestor."

- name: system-check
  interval: 24h
  prompt: "Verificação de saúde: status do servidor, espaço em disco, logs de erro nas últimas 24h."

# Instruções adicionais
- Mantenha alertas curtos e acionáveis.
- Se nada precisar de atenção depois de todas as tasks, responda HEARTBEAT_OK.
```

### 3.3 Comportamento do Bloco `tasks:`

- OpenClaw parseia `tasks:` e verifica intervalo de cada uma
- **Somente tasks "vencidas"** entram no prompt daquela batida
- Se nenhuma task está vencida → heartbeat é **pulado** (`reason=no-tasks-due`) — economiza API
- Timestamps ficam no session state (`heartbeatTaskState`), sobrevivem a restarts
- Timestamps só avançam após conclusão com sucesso (não em runs pulados)

### 3.4 Custo Operacional

| Configuração | Tokens/run | Custo/dia (48 runs) |
|-------------|-----------|---------------------|
| Lean (5-8 checks, modelo barato) | ~800-2.500 | ~$0.001-0.005 |
| Standard (10-15 checks, Sonnet) | ~3.000-8.000 | ~$0.01-0.05 |
| Heavy (20+ checks, Opus) | ~10.000-25.000 | ~$0.10-0.50 |

**Otimizações:**
- `isolatedSession: true` — reduz contexto (~100K → ~2-5K por run)
- `lightContext: true` — injeta só HEARTBEAT.md dos bootstrap files
- Modelo mais barato para heartbeat (Haiku/Mini)
- Manter o HEARTBEAT.md enxuto

### 3.5 Contrato de Resposta

- **`HEARTBEAT_OK`**: nada precisa de atenção → silencioso
- **Texto de alerta**: algo importante → envia para canal configurado
- **`heartbeat_respond` tool call**: com `notify: true/false` para controle fino

### 3.6 Exemplos Criativos de Heartbeat

| Condição Monitorada | Ação | Intervalo |
|---------------------|------|-----------|
| Estoque abaixo do mínimo | Gerar pedido de reposição automático | 2h |
| Pagamento atrasado > 3 dias | Enviar lembrete ao cliente | 4h |
| Vendas do dia 30% abaixo da meta | Alertar gestor com dados | 1h |
| Lead novo no pipeline > 1h sem contato | Iniciar qualificação automática | 30m |
| Servidor com disco > 80% | Alertar + sugerir limpeza | 24h |
| Email do fornecedor com "atraso" | Escalar para gestor com contexto | 30m |
| Tarefa bloqueada > 4h | Registrar bloqueio e notificar responsável | 2h |
| Review de PR pendente > 24h | Lembrete ao reviewer | 6h |

---

## 4. HOOKS — Automação Orientada a Eventos

### 4.1 Dois Tipos de Hooks

| Tipo | O que é | Quando dispara |
|------|---------|----------------|
| **Internal Hooks** | Scripts TypeScript dentro do Gateway | Eventos de lifecycle do agente |
| **Webhooks** | Endpoints HTTP que recebem POST externo | Eventos de sistemas externos |

### 4.2 Eventos de Internal Hooks

| Evento | Quando dispara |
|--------|----------------|
| `command:new` | Comando `/new` emitido |
| `command:reset` | Comando `/reset` emitido |
| `command:stop` | Comando `/stop` emitido |
| `session:compact:before` | Antes da compactação de histórico |
| `session:compact:after` | Depois da compactação |
| `agent:bootstrap` | Antes da injeção de bootstrap files |
| `gateway:startup` | Gateway inicia |
| `gateway:shutdown` | Gateway encerra |
| `message:received` | Mensagem recebida de canal |
| `message:transcribed` | Transcrição de áudio completa |
| `message:sent` | Mensagem enviada para canal |

### 4.3 Hooks Bundled

| Hook | Eventos | O que faz |
|------|---------|-----------|
| `session-memory` | `command:new`, `command:reset` | Salva últimas 15 mensagens na memória do workspace |
| `bootstrap-extra-files` | `agent:bootstrap` | Injeta arquivos adicionais no bootstrap |
| `command-logger` | `command` | Loga comandos em `~/.openclaw/logs/commands.log` |
| `compaction-notifier` | `session:compact:*` | Envia aviso visível durante compactação |
| `boot-md` | `gateway:startup` | Executa `BOOT.md` do workspace ao iniciar |

### 4.4 Estrutura de um Hook Customizado

```
meu-hook/
├── HOOK.md          ← Metadados YAML
└── handler.ts       ← Implementação
```

**HOOK.md:**
```markdown
---
name: alerta-estoque
description: "Envia alerta quando webhook de estoque baixo é recebido"
metadata:
  {"openclaw": {"emoji": "📦", "events": ["message:received"]}}
---
```

**handler.ts:**
```typescript
const handler = async (event) => {
  if (event.type !== "message" || !event.context?.content?.includes("estoque_baixo")) {
    return;
  }
  event.messages.push("⚠️ ALERTA: Estoque baixo detectado via webhook! Iniciando processo de reposição.");
};
export default handler;
```

### 4.5 Webhooks Externos

**Configuração no Gateway:**
```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret-aqui",
    path: "/hooks"
  }
}
```

**Endpoint POST /hooks/wake** — Enfileira evento na sessão principal:
```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Pedido #1234 pago. Processar envio.","mode":"now"}'
```

**Endpoint POST /hooks/agent** — Executa turno isolado do agente:
```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Novo lead recebido: João Silva, joao@email.com, interesse em plano Premium. Qualificar e registrar.","name":"Lead-Qualifier","model":"openai/gpt-4o"}'
```

### 4.6 Gmail PubSub (Integração Nativa)

```bash
# Setup automático
openclaw webhooks gmail setup --account meu@gmail.com
```

O Gateway auto-inicia `gog gmail watch serve` no boot, com auto-renovação. Cada email recebido vira um evento processado pelo agente.

---

## 5. STANDING ORDERS — Autoridade Permanente

Standing orders são instruções persistentes em `AGENTS.md` que dão ao agente **autoridade operacional contínua** — não são tarefas pontuais, são programas permanentes.

**Exemplo no AGENTS.md:**
```markdown
## Standing Orders

### Gestão de Estoque
- Monitore estoque via heartbeat a cada 2h
- Itens abaixo do mínimo: gere pedido automático para o fornecedor padrão
- Pedidos até R$2.000: execute autonomamente
- Pedidos acima de R$2.000: solicite aprovação do admin antes de enviar

### Relatórios
- Gere relatório diário de vendas às 19h (cron)
- Gere análise semanal toda segunda às 7h (cron)
- Inclua sempre: comparação com período anterior + 3 recomendações

### Escalação
- Reclamação de cliente → escalar para gerente via tópico #suporte
- Erro em processo crítico → alertar admin + registrar em log
- Dúvida fora do escopo → informar que vai verificar e escalar
```

> **Regra importante:** O agente pode ler e seguir standing orders. Ele **não deve auto-modificar** o AGENTS.md — pode escrever em PROGRESS.md, MEMORY.md e logs, mas nunca alterar suas próprias instruções permanentes (evita instruction drift).

---

## 6. MULTI-AGENT — Arquitetura de Times

### 6.1 Conceitos-Chave

- **Agent**: persona isolada com workspace, auth profiles, session store
- **agentDir**: diretório de estado em `~/.openclaw/agents/<agentId>/`
- **Bindings**: regras que roteiam mensagens inbound para agentes específicos
- **Sub-agents**: runs temporárias em background, auto-arquivam
- **Persistent agents**: mantêm estado entre sessões

> **Nunca reutilizar `agentDir` entre agentes** — causa colisão de auth/sessão.

### 6.2 Prioridade de Roteamento (Bindings)

1. Peer match exato (DM/grupo/canal)
2. Peer pai (herança de thread)
3. Guild ID + roles (Discord)
4. Guild ID sozinho
5. Team ID (Slack)
6. Account ID match
7. Channel-level (`accountId: "*"`)
8. Default agent fallback

### 6.3 CLI de Multi-agentes

```bash
# Adicionar agente
openclaw agents add <agentId>

# Listar agentes com bindings
openclaw agents list --bindings

# Login de canal para agente específico
openclaw channels login --channel telegram --account <accountId>

# Reiniciar gateway
openclaw gateway restart

# Criar cron para agente específico
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" \
  --session isolated --message "Check ops queue" --agent ops
```

### 6.4 Patterns de Multi-agentes

| Pattern | Descrição | Quando usar |
|---------|-----------|-------------|
| **Channel splitting** | Modelo rápido no WhatsApp, Opus no Telegram | Otimizar custo por canal |
| **Peer-specific routing** | Um DM vai para Opus, resto fica em modelo rápido | VIP routing |
| **Agente por departamento** | Estoque, Financeiro, Comercial — cada um isolado | Negócios com áreas distintas |
| **Orquestrador + Especialistas** | Um recebe, distribui para os certos | Workflows complexos |
| **Público + Interno** | Um para clientes (restrito), um para equipe (total) | Segurança de acesso |

### 6.5 Comunicação entre Agentes

- Via tópicos do Telegram (agente A posta, agente B monitora)
- Via canal compartilhado "intercom"
- Via skill que aciona outro agente
- Via `tools.agentToAgent` com allowlist (comunicação direta)
- Mensagens entre agentes devem ser **estruturadas** (dados, não conversa)

### 6.6 Sandbox e Isolamento

- Cada agente pode ter sandbox mode diferente: `off`, `all`, ou seletivo
- Tool allowlists/denylists por agente
- Memory search pode cruzar coleções entre agentes (quando configurado)
- Workspace é `cwd` default, não sandbox rígido — absolute paths escapam (habilitar sandbox se necessário)

---

## 7. INTEGRAÇÕES — O Que Funciona Melhor

### 7.1 Telegram (Melhor Canal)

- **Setup**: @BotFather → token → config → funciona
- **Modos**: Webhook (produção, menor latência) ou Polling (dev, mais simples)
- **Features**: Tópicos, grupos, DMs, comandos, mídia
- **Erro comum**: configurar como `plugins.entries.telegram` em vez de `channels.telegram`
- **Privacy Mode**: desativar no BotFather para bot ler mensagens sem /comando

### 7.2 Notion

- Integração interna via API (criar no Notion Developers)
- Token de integração + compartilhar páginas
- Agente consulta: databases, wikis, documentos
- Melhor uso: **base de conhecimento operacional** (catálogos, preços, políticas, processos)

### 7.3 Google Workspace

- Gmail: ler/enviar emails, filtrar urgentes, gerar resumos
- Calendar: ver/criar eventos, lembretes, preparar agendas
- Drive: acessar documentos, planilhas, relatórios
- Setup: Google Cloud Console → APIs → OAuth 2.0 → credenciais JSON

### 7.4 Google Sheets

- Camada conversacional sobre planilhas
- Agente pode: consultar dados, adicionar linhas, gerar resumos, automatizar reports
- Via Composio MCP ou integração nativa

### 7.5 WhatsApp

- Via WhatsApp Business API ou bridge
- Custo por mensagem, aprovação de templates
- Mais complexo que Telegram, mas atinge público maior
- Multi-account suportado: cada número pode rotear para agente diferente

### 7.6 Brave Browser (Web)

- Pesquisa web em tempo real
- Acessa e lê páginas
- Limitações: sites com login, anti-bot, custo extra de tokens
- Uso ideal: complemento, não base principal

---

## 8. TASK FLOW — Workflows Multi-Step Duráveis

Task Flow orquestra workflows multi-step com:
- Tracking de revisão
- Inspeção via CLI: `openclaw tasks flow list|show|cancel`
- Persistência durável (sobrevive a restarts)
- Coordenação entre múltiplas execuções

**Outros mecanismos de background:**
- **Background Tasks**: ledger tracking de todo trabalho destacado (ACP runs, subagent spawns)
- **Inferred Commitments**: follow-ups de curto prazo extraídos de conversas, entregues via heartbeat

---

## 9. COMPARAÇÃO: OpenClaw vs n8n vs Make vs Zapier

### 9.1 Diferença Fundamental

| Aspecto | OpenClaw | n8n / Make / Zapier |
|---------|----------|---------------------|
| **Paradigma** | Agente agentic (raciocina, decide, age) | Workflow determinístico (SE → ENTÃO) |
| **Execução** | Dinâmica baseada em contexto | Fixa, mesma sequência toda vez |
| **Código** | Open-source, self-hosted | n8n: open-source. Make/Zapier: SaaS |
| **Custo** | Grátis (paga API do LLM) | n8n: grátis self-hosted. Zapier: por task ($) |
| **Integrações** | 13.700+ skills + qualquer API via LLM | Zapier: 8.000+, n8n: 1.000+, Make: 1.500+ |
| **Memória** | Persistente entre execuções | Sem memória nativa |
| **Autonomia** | Toma decisões, executa sem supervisão | Executa exatamente o que configurar |

### 9.2 Quando Usar Cada Um

| Cenário | Melhor opção |
|---------|-------------|
| Workflow rígido form→CRM→email | **Zapier** ou **Make** |
| Automação self-hosted com controle total | **n8n** |
| Agente que raciocina, decide e age com contexto | **OpenClaw** |
| Processamento de texto/análise complexa | **OpenClaw** |
| Integração simples com 2-3 apps | **Zapier** |
| Orquestração de agentes + automações | **OpenClaw** (cérebro) + **n8n** (braços) |

### 9.3 O Setup Mais Poderoso de 2026

> **OpenClaw como cérebro + n8n como braços.** O OpenClaw raciocina, decide e orquestra. O n8n executa integrações determinísticas que não precisam de IA. Resultado: custo otimizado (n8n não gasta tokens) + inteligência onde precisa (OpenClaw nos pontos de decisão).

---

## 10. COMBINAÇÕES CRIATIVAS

### 10.1 Cron + Heartbeat + Standing Orders (Padrão Operacional Completo)

```
AGENTE: Gestor de Estoque Digital

STANDING ORDERS (AGENTS.md):
- Autoridade para gerar pedidos até R$2.000
- Escalar pedidos maiores para admin
- Manter log de todas as operações

CRON (Relatórios agendados):
- 07:00 → Relatório matinal de estoque (isolado, Sonnet)
- 19:00 → Resumo de vendas do dia (isolado, Sonnet)
- Segunda 08:00 → Análise semanal (isolado, Opus)
- Dia 5 09:00 → Processamento de cobranças (isolado, Opus)

HEARTBEAT (Monitoramento contínuo):
- 30m → Inbox triage (emails de fornecedores urgentes)
- 2h → Check estoque (itens abaixo do mínimo → gerar pedido)
- 4h → Cobranças atrasadas (>3 dias → enviar lembrete)
- 1h → Métricas de vendas (30% abaixo da meta → alertar gestor)

HOOKS (Eventos externos):
- Webhook de pagamento → processar envio automaticamente
- Webhook de novo lead → iniciar qualificação
- Gateway startup → rodar BOOT.md com checklist de saúde
```

### 10.2 Multi-Agent com Especialização

```
AGENTE ORQUESTRADOR (Telegram principal):
- Recebe tudo
- Roteia para especialistas via tópicos

AGENTE ESTOQUE (isolado):
- Heartbeat: monitora níveis a cada 2h
- Cron: relatório diário 07h
- Standing order: pedidos até R$2k autônomos

AGENTE FINANCEIRO (isolado):
- Cron: cobranças dia 5
- Heartbeat: pagamentos atrasados a cada 4h
- Standing order: nunca executar transferências sem aprovação

AGENTE ANALISTA (isolado):
- Cron: análise semanal segunda 08h
- Heartbeat: monitora métricas a cada 1h
- Entrega insights para orquestrador via tópico intercom
```

---

## 11. PADRÕES DE AGENTE AUTO-MELHORÁVEL

### 11.1 O Que Funciona

- Agente escreve em **PROGRESS.md** e **MEMORY.md** — registro de aprendizados
- Skill `skillagi`: lembra erros entre sessões e evita repeti-los
- Skill `adaptive-reasoning`: avalia complexidade e ajusta nível de raciocínio automaticamente
- `model-manager`: roteia tasks simples para modelos baratos, complexas para Opus
- `task-resume`: retoma tarefas interrompidas com recovery automático

### 11.2 O Que NÃO Fazer

> **Agente nunca deve auto-modificar AGENTS.md ou SOUL.md.** Self-modifying instructions causa instruction drift e comportamento imprevisível. O agente aprende via memória e logs, mas as instruções permanentes são domínio humano.

### 11.3 Padrão Recomendado

```
1. Agente executa processo
2. Registra resultado + aprendizado em MEMORY.md
3. Se encontrou edge case novo → registra em PROGRESS.md
4. Humano revisa PROGRESS.md periodicamente
5. Humano decide se atualiza AGENTS.md com nova regra
6. Loop de melhoria humano-agente (não agente-agente)
```

---

## Fontes

- [Skills · OpenClaw Docs](https://docs.openclaw.ai/tools/skills)
- [Automation · OpenClaw Docs](https://docs.openclaw.ai/automation)
- [Cron Jobs · OpenClaw Docs](https://docs.openclaw.ai/automation/cron-jobs)
- [Heartbeat · OpenClaw Docs](https://docs.openclaw.ai/gateway/heartbeat)
- [Hooks · OpenClaw Docs](https://docs.openclaw.ai/automation/hooks)
- [Multi-Agent · OpenClaw Docs](https://docs.openclaw.ai/concepts/multi-agent)
- [VoltAgent/awesome-openclaw-skills (5.211 skills)](https://github.com/VoltAgent/awesome-openclaw-skills)
- [openclaw/clawhub (Skill Directory)](https://github.com/openclaw/clawhub)
- [OpenClaw vs n8n vs Zapier | ClawTank](https://clawtank.dev/blog/openclaw-vs-n8n-zapier)
- [Top OpenClaw Skills | Composio](https://composio.dev/content/top-openclaw-skills)
- [Best ClawHub Skills | DataCamp](https://www.datacamp.com/blog/best-clawhub-skills)
- [Best OpenClaw Skills 2026 | AI Makers](https://www.aimakers.co/blog/openclaw-skills-guide/)
- [OpenClaw Telegram Setup](https://docs.openclaw.ai/channels/telegram)
- [OpenClaw Notion Integration | Composio](https://composio.dev/toolkits/notion/framework/openclaw)
- [OpenClaw Google Sheets | GetOpenClaw](https://www.getopenclaw.ai/integrations/google-sheets)
- [Heartbeat vs Cron Guide 2026 | Clawnify](https://www.clawnify.com/resources/heartbeat-vs-cron-openclaw-guide-2026)
- [Multi-Agent Setup | LumaDock](https://lumadock.com/tutorials/openclaw-multi-agent-setup)
- [shenhao-stu/openclaw-agents (9 agents)](https://github.com/shenhao-stu/openclaw-agents)
- [Standing Orders · OpenClaw Docs](https://docs.openclaw.ai/automation/standing-orders)
- [OpenClaw Webhooks | SFAI Labs](https://sfailabs.com/guides/openclaw-webhook-integration)
