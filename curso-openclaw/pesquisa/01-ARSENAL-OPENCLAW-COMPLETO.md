# Arsenal Completo OpenClaw — Pesquisa Consolidada

> Fontes: docs.openclaw.ai, GitHub, ClawHub, Reddit, DEV.to, Medium, Blink, Composio, AIMakers, Collabnix, Piax, Agixtech
> Pesquisa: 5 agentes Maestri + pesquisa direta orquestrador
> Data: 2026-05-27
> Objetivo: Base para Super Kit do aluno AutomatikLabs

---

## PARTE 1 — O ECOSSISTEMA OPENCLAW EM NÚMEROS

### Crescimento Explosivo
- **150.000+ GitHub stars** em ~10 semanas (nov 2025 → jan 2026)
- Ultrapassou React (~243K stars) em velocidade de adoção
- Criado por **Peter Steinberger** (engenheiro austríaco), lançado nov/2025 como "Clawdbot"
- Renomeado para "Moltbot" (27/jan/2026), depois "OpenClaw" (30/jan/2026)
- **10.700+ skills** no ClawHub (mai/2026), ~7.6% (820+) flagged como suspeitas

### Ecossistema de LLMs Suportados
| Provider | Modelos | Observação |
|----------|---------|------------|
| Anthropic | Claude (Opus, Sonnet, Haiku) | Suporte nativo |
| OpenAI | GPT-4o, GPT-4o-mini, GPT-5 family, Codex | Via ChatGPT Plus ou API |
| Google | Gemini | Suportado |
| xAI | Grok | Suportado |
| Mistral | Mistral Large, etc. | Suportado |
| DeepSeek | DeepSeek V3+ | Suportado |
| Local | Via Ollama | Para quem quer rodar local |

### Canais Confirmados
Telegram, WhatsApp, Discord, Slack, iMessage (requer Mac), Matrix, Mattermost, IRC, Google Chat, Feishu/Lark + extensível via plugins.

---

## PARTE 2 — SKILLS MAIS POPULARES DO CLAWHUB

### Top 10 por Downloads (Mai/2026)
| # | Skill | Downloads | O que faz |
|---|-------|-----------|-----------|
| 1 | **Self-Improving Agent** | 419K+ | Auto-reflexão e melhoria contínua do agente |
| 2 | **Skill Vetter** | Alto | Analisa e valida skills antes de instalar |
| 3 | **Document Summarizer** | 10K+ | Resume documentos longos |
| 4 | **Self-Improving + Proactive** | Alto | Combina auto-melhoria com proatividade |
| 5 | **Ontology** | Alto | Organização de conhecimento |
| 6 | **GitHub** | Alto | Integração com repositórios |
| 7 | **Gog (Gmail)** | Alto | Integração Gmail via PubSub |
| 8 | **Morning Briefing** | 8K+ | Briefing diário de prioridades, tarefas, deadlines |
| 9 | **Tavily Search** | Popular | Busca web avançada |
| 10 | **Browser Relay** | Popular | Automação de browser |

### Skills por Categoria
- **Produtividade:** Morning Briefing, Task Manager, Calendar Sync
- **Memória:** Elite Long-Term Memory, Memory Setup, Memory Hygiene, Cognitive Memory
- **Autonomia:** Proactive Agent, Agent Autonomy Kit, Proactive Solvr
- **Pesquisa:** Tavily Search, Browser Relay, Web Researcher
- **Código:** GitHub, Code Review, SkillScan
- **Mídia:** Image Generation, Music Generate, Video Generate
- **Conhecimento:** Obsidian, Document Summarizer, Ontology

### Segurança de Skills
- Skills com **100+ downloads e 3+ meses** no ClawHub são mais seguras
- ClawHub agora usa **VirusTotal** para scan automático (após incidente "ClawHavoc")
- Sempre verificar permissões antes de instalar
- Nunca dar credenciais de email/calendar/gateway sem entender como a skill as usa

---

## PARTE 3 — SUPER PROACTIVE AGENT (A Skill Mais Valiosa)

### O que é
Skill que transforma agentes passivos em **operadores autônomos que antecipam necessidades e se auto-melhoram**. Combina 11 skills existentes numa arquitetura coesa.

### Skills que ela unifica
1. Elite Long-Term Memory
2. Proactive Agent
3. Memory Setup
4. Memory Hygiene
5. Agent Autonomy Kit
6. Agent Memory
7. Neural Memory
8. Cognitive Memory
9. Proactive Solvr
10. Proactive Tasks
11. Memory Manager

### Arquitetura de Arquivos
```
WORKSPACE_ROOT/
├── MEMORY.md           ← Memória semântica (fatos curados)
├── SESSION-STATE.md    ← Working buffer (persiste entre resets de contexto)
├── QUEUE.md            ← Kanban de tarefas (Ready/In Progress/Done/Blocked)
├── memory/             ← Logs episódicos diários (YYYY-MM-DD.md)
│   ├── 2026-05-27.md
│   ├── 2026-05-26.md
│   └── ...
└── skills/             ← Memória procedural (skills aprendidas)
```

### Sistema de Memória em 3 Camadas
| Camada | Arquivo | Função | Analogia Humana |
|--------|---------|--------|-----------------|
| **Episódica** | `memory/YYYY-MM-DD.md` | Log cronológico diário | Diário/journal |
| **Semântica** | `MEMORY.md` | Fatos e insights curados | Conhecimento consolidado |
| **Procedural** | `skills/` | Procedimentos reutilizáveis | Habilidades aprendidas |

### Write-Ahead Logging (WAL)
Toda decisão recebe registro timestamped ANTES da execução:
```
2026-05-27 10:15:30 - Decision: Gerando relatório de vendas diário
2026-05-27 10:15:31 - Action: Consultando Google Sheets via API
2026-05-27 10:15:33 - Result: 47 vendas, R$12.340 faturamento
2026-05-27 10:15:34 - Delivery: Enviando para Telegram do gerente
```
Garante audit trail confiável mesmo após flush de contexto.

### Working Buffer (SESSION-STATE.md)
Persiste entre resets de contexto. Armazena:
- Contexto do projeto atual
- Decisões pendentes
- Tasks ativas puxadas da fila

### Task Queue (QUEUE.md)
Kanban com 4 estados:
```markdown
## Ready
- [ ] Gerar relatório semanal de KPIs
- [ ] Pesquisar novos fornecedores

## In Progress
- [x] Processar cobranças do dia 5 → em execução

## Done
- [x] Enviar lembretes de consulta (27/05)

## Blocked
- [ ] Renovar contrato — aguardando assinatura do cliente
```

### Crons Autônomos (Schedule Padrão)
| Frequência | O que faz |
|------------|-----------|
| **A cada 30 min** | Verifica fila, confirma saúde, atualiza memória |
| **A cada 4 horas** | Pesquisa tópicos, refina skills procedurais |
| **Diário 18:00 UTC** | Gera resumos, limpeza, prepara próximo ciclo |

### Boas Práticas de Self-Improvement
1. Logar imediatamente (WAL) quando informação é notável
2. Buscar em MEMORY.md e logs episódicos ANTES de responder
3. Curar MEMORY.md semanalmente extraindo insights dos logs diários
4. Manter SESSION-STATE.md como contexto de trabalho ativo
5. Antecipar necessidades e iniciar pesquisa em background autonomamente

---

## PARTE 4 — TEMPLATES DE CONFIGURAÇÃO REAIS

### AGENTS.md — Template Produção
```markdown
# Agent Operating Rules

## Safety Rules
- NEVER send external communication without explicit approval
- NEVER delete files or records without confirming specifics
- NEVER authorize payments of any amount
- Ask clarifying questions when uncertain
- Follow Execute-Verify-Report pattern for every task

## Communication Rules
- Use bullet points for 3+ item lists
- Include TLDR for responses over 200 words
- Timezone: America/Sao_Paulo
- Language: Portuguese (Brasil)

## Business Context
- Company: [nome da empresa]
- Industry: [setor]
- Role: Operador autônomo de processos
- Key tools: [CRM, planilhas, email, etc.]

## Standing Orders

### Program: Relatório Diário de Vendas
- Scope: Consultar planilha de vendas, calcular totais, gerar resumo
- Trigger: Cron diário 08:00
- Approval: Nenhuma (execução autônoma)
- Escalation: Se dados inconsistentes, alertar gerente

### Program: Cobrança de Inadimplentes
- Scope: Verificar faturas vencidas, enviar lembretes
- Trigger: Cron diário 10:00
- Approval: Cobranças acima de R$5.000 precisam aprovação
- Escalation: Se cliente não responde em 3 tentativas, escalar para jurídico
```

### SOUL.md — Template por Tipo de Negócio
```markdown
# Soul

## Papel
Operador autônomo de processos para [tipo de negócio].
Executo tarefas, gero relatórios, processo cobranças e monitoro operações.
NÃO sou um chatbot. Sou um funcionário digital que TRABALHA.

## Personalidade
Direto, eficiente, preciso. Sem enrolação.
Reporto resultados com números concretos.
Quando algo dá errado, aviso imediatamente com diagnóstico.

## Limites
- Nunca tomo decisões financeiras acima de [valor] sem aprovação
- Nunca envio comunicação externa sem revisão
- Sempre verifico resultado antes de reportar como concluído
- Se não sei, digo que não sei — nunca invento
```

### HEARTBEAT.md — Template Operacional
```markdown
# Heartbeat Schedule

## Monitoramento Contínuo (a cada 30min)
- Verificar se há tasks na fila QUEUE.md
- Confirmar que integrações estão respondendo
- Atualizar SESSION-STATE.md com contexto atual

## Tarefas Diárias

### 08:00 — Relatório Matinal
- Consultar vendas do dia anterior
- Calcular métricas (faturamento, ticket médio, volume)
- Enviar resumo formatado no Telegram do gerente

### 10:00 — Processamento de Cobranças
- Verificar faturas vencidas na planilha
- Enviar lembretes para inadimplentes (1o, 2o, 3o aviso)
- Registrar ações no log

### 17:00 — Fechamento do Dia
- Resumo de tudo que foi executado hoje
- Tasks pendentes para amanhã
- Alertas ou exceções encontradas

## Tarefas Semanais

### Segunda 09:00 — Relatório Semanal
- Comparativo semana vs semana anterior
- KPIs: faturamento, conversão, ticket médio, inadimplência
- Destaques positivos e pontos de atenção

### Sexta 16:00 — Curadoria de Memória
- Extrair insights dos logs episódicos da semana
- Atualizar MEMORY.md com aprendizados
- Limpar informações obsoletas
```

### USER.md — Template
```markdown
# About Me

Name: [nome]
Role: [cargo]
Company: [empresa]
Location: [cidade/timezone]

## Preferências
- Relatórios: com números, sem enrolação
- Alertas urgentes: Telegram
- Relatórios rotina: Email
- Fuso: America/Sao_Paulo
- Idioma: Português (Brasil)

## Contexto do Negócio
- MRR atual: R$ [valor]
- Clientes ativos: [número]
- Ferramentas: [lista]
- KPIs que importam: [lista]
```

---

## PARTE 5 — PATTERNS E ANTI-PATTERNS

### Patterns que Funcionam

**Execute-Verify-Report (EVR)**
Toda task segue: (1) Executa o trabalho real → (2) Verifica que resultado está correto → (3) Reporta o que fez e o que verificou.

**Cron + Standing Orders + Heartbeat**
- Cron para timing preciso (relatório às 8h)
- Standing Orders para autoridade permanente (pode gerar relatório sem pedir)
- Heartbeat para verificação contínua (a cada 30min confere se está tudo OK)

**Memória em 3 Camadas**
Episódica (logs diários) → Semântica (MEMORY.md curado) → Procedural (skills aprendidas)

**WAL Protocol**
Logar ANTES de executar. Garante rastreabilidade mesmo se o contexto resetar.

### Anti-Patterns (O que NÃO fazer)

1. **Dar autonomia total sem guardrails** — Agente sem limites claros pode enviar emails indevidos, deletar dados, gastar créditos
2. **Instalar skills sem verificar** — 7.6% das skills do ClawHub são suspeitas. Verificar downloads, tempo no marketplace, permissões
3. **HEARTBEAT.md gigante** — Muitas tasks no heartbeat sobrecarrega. Começar com 1, expandir gradualmente
4. **Não definir idioma nos crons** — Cron NÃO infere idioma. Sempre explicitar "Responda em português"
5. **Esquecer o timezone** — Sem `--tz`, usa o timezone do host. Definir explicitamente
6. **Misturar standing orders com conversa** — Standing orders devem estar no AGENTS.md, não em mensagens avulsas
7. **Não testar antes de produção** — Sempre rodar `openclaw cron run <id> --wait` antes de confiar no agendamento
8. **Ignorar MEMORY.md** — Sem curadoria, memória fica poluída. Agendar limpeza semanal

---

## PARTE 6 — CASES REAIS DOCUMENTADOS

### Case 1: Email Management (Produtividade Pessoal)
- **Problema:** Inbox com milhares de emails acumulados
- **Solução:** Agente categoriza, prioriza, drafta respostas, entrega briefing matinal via WhatsApp
- **Features:** Gmail integration (Gog skill), Morning Briefing, Cron diário
- **Resultado:** Inbox zero mantido automaticamente

### Case 2: Lead Generation (Freelancers/PMEs)
- **Problema:** Prospecção manual consome horas/dia
- **Solução:** Agente pesquisa prospects, audita websites, qualifica leads, integra com CRM
- **Features:** Tavily Search, Browser Relay, Cron periódico
- **Resultado:** Pipeline de leads preenchido automaticamente

### Case 3: Relatórios Automáticos (Agência de Marketing)
- **Problema:** 2 dias/semana montando relatórios manuais para clientes
- **Solução:** Agente puxa dados de múltiplas fontes, analisa tendências, gera relatórios com insights
- **Features:** Google Sheets integration, Cron semanal, Standing Orders
- **Resultado:** Relatórios de 2 dias → 5 minutos. +40% capacidade da equipe

### Case 4: Gestão Fiscal (Contabilidade)
- **Problema:** Prazos fiscais esquecidos, documentos de clientes atrasados
- **Solução:** Agente monitora prazos, envia lembretes automáticos, gera relatório semanal de status
- **Features:** Heartbeat monitoring, Cron scheduling, Telegram notifications
- **Resultado:** Zero multas por atraso (antes 2-3/mês). 5h/semana economizadas

### Case 5: Pesquisa de Mercado (Consultoria)
- **Problema:** Análise de concorrência manual e desatualizada
- **Solução:** Agente monitora sites de concorrentes, coleta preços, gera comparativos
- **Features:** Browser Relay, Tavily Search, Cron diário
- **Resultado:** Dados sempre atualizados, decisões baseadas em dados reais

---

## PARTE 7 — COMPARAÇÃO COM ALTERNATIVAS

### OpenClaw vs Zapier/Make/n8n
| Aspecto | Zapier/Make/n8n | OpenClaw |
|---------|-----------------|----------|
| **Tipo** | Automação baseada em regras (se X, faça Y) | Agente autônomo com raciocínio |
| **Flexibilidade** | Fluxos fixos predefinidos | Adapta-se a situações novas |
| **Memória** | Sem memória entre execuções | Memória persistente em 3 camadas |
| **Decisão** | Sempre a mesma ação para o mesmo trigger | Pode decidir diferentes ações baseado em contexto |
| **Setup** | Visual (drag-and-drop) | Markdown + CLI |
| **Custo** | Pago por execução/zap | Open-source + custo do LLM |
| **Manutenção** | Baixa (cloud managed) | Média (VPS self-hosted) |
| **Ideal para** | Fluxos simples e previsíveis | Processos que exigem julgamento e adaptação |

**Conclusão:** OpenClaw NÃO substitui Zapier — complementa. Zapier para fluxos determinísticos simples, OpenClaw para processos que exigem inteligência e contexto.

---

## PARTE 8 — SEGURANÇA (ALERTAS REAIS)

### Incidentes Conhecidos
- **ClawHavoc:** Skills maliciosas no ClawHub que roubavam credenciais. ClawHub agora usa VirusTotal.
- **China bloqueou OpenClaw** em empresas estatais e governo (mar/2026) por riscos de segurança.
- **Pesquisadores de cybersecurity** alertam sobre permissões amplas que o OpenClaw requer.

### Checklist de Segurança para Produção
1. Nunca instalar skills com menos de 100 downloads sem verificar código
2. Usar 1Password/vault para todas as credenciais
3. Configurar `hooks.allowedAgentIds` para limitar routing
4. Manter endpoints de hooks atrás de reverse proxy
5. Definir `copyToAgents: false` para credenciais sensíveis OAuth
6. Criar snapshots regulares da VPS
7. Monitorar logs com `openclaw logs --follow`
8. Definir limites claros em standing orders (approval gates)
9. Testar crons em modo isolado antes de produção
10. Não dar acesso a email/calendar/financeiro sem guardrails

---

## PARTE 9 — REFERÊNCIAS E FONTES

### Documentação Oficial
- https://docs.openclaw.ai — Documentação principal
- https://docs.openclaw.ai/reference/AGENTS.default — Template default AGENTS.md

### Artigos Técnicos
- https://dev.to/aloycwl/understanding-the-super-proactive-agent-skill-in-openclaw — Super Proactive Agent (arquitetura completa)
- https://blink.new/blog/openclaw-heartbeat-soul-memory-configuration-guide-2026 — Guia de configuração HEARTBEAT/SOUL/MEMORY
- https://dev.to/techfind777/the-ultimate-guide-to-writing-soulmd-for-openclaw-agents — Guia de SOUL.md
- https://capodieci.medium.com/ai-agents-003-openclaw-workspace-files-explained — Workspace files explicados
- https://amankhan1.substack.com/p/how-to-make-your-openclaw-agent-useful — Segurança e utilidade

### Setup e Guias
- https://github.com/ishwarjha/openclaw-setup-guide-i-wish-i-had — Setup guide "que eu gostaria de ter tido" (15 dias de luta → 1 dia)
- https://agixtech.com/insights/how-to-build-autonomous-ai-agents-using-openclaw — Design de agentes autônomos
- https://petronellatech.com/blog/openclaw-ai-agent-guide-2026/ — Guia completo 2026
- https://emergent.sh/learn/what-is-openclaw — "What is OpenClaw?" guia completo

### Skills e Marketplace
- https://www.piax.org/skills/openclaw-skills/proactive-agent — Proactive Agent skill
- https://www.piax.org/skills/openclaw-skills/self-improving — Self-Improving Agent
- https://composio.dev/content/top-openclaw-skills — Top 10 skills (Composio)
- https://www.aimakers.co/blog/openclaw-skills-guide/ — Best skills guide
- https://www.open-claw.sh/blog/best-openclaw-skills-2026 — 32 skills ranked

### Rankings e Dados
- https://gitnux.org/openclaw-ai-statistics/ — 70+ estatísticas OpenClaw
- https://www.getpanto.ai/blog/openclaw-ai-platform-statistics — Growth & adoption stats
- https://collabnix.com/top-10-real-world-use-cases-for-openclaw-ai-agents-in-2025/ — Top 10 use cases

### Análise de Mercado
- https://medium.com/@kanerika/openclaw-how-a-self-hosted-ai-agent-changed-automation-in-2026 — Como mudou automação em 2026
- https://eu.36kr.com/en/p/3709890881975048 — "After OpenClaw reached the top, Agent quietly killed the Application"
