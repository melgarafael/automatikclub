# Pesquisa OpenClaw — Comunidades e Fóruns (Maio 2026)

Data da pesquisa: 27/05/2026
Pesquisador: AutomatikLabs Research

---

## 1. Visão Geral do OpenClaw

OpenClaw é um agente de IA autônomo, gratuito e open-source, que executa tarefas via LLMs usando plataformas de mensagens (Telegram, WhatsApp, Discord, Signal) como interface principal.

### Linha do Tempo
- **Nov/2025**: Publicado como "Clawdbot" pelo dev austríaco Peter Steinberger
- **27/Jan/2026**: Renomeado para "Moltbot" após reclamação de trademark da Anthropic
- **30/Jan/2026**: Renomeado novamente para "OpenClaw"
- **14/Fev/2026**: Steinberger anuncia entrada na OpenAI; fundação non-profit assume o projeto
- **03/Mar/2026**: Ultrapassa React — 250.829 stars no GitHub (recorde em 60 dias)
- **Mai/2026**: 350K+ stars, 1.200+ contributors, 58K+ forks

### Números (Abril-Maio 2026)
| Métrica | Valor |
|---------|-------|
| GitHub Stars | 350.000+ |
| Visitantes mensais | 38 milhões |
| Usuários ativos mensais | 3.2 milhões |
| Skills no ClawHub | 44.000+ |
| Downloads npm semanais | 1.27 milhões |
| Sessão média | 45 minutos |
| Releases em Maio (até dia 19) | 15 |
| Desktop vs Mobile | 70.8% vs 29.2% |

**Ref:** [GetPanto Statistics](https://www.getpanto.ai/blog/openclaw-ai-platform-statistics) | [TrendingTopics](https://www.trendingtopics.eu/openclaw-numbers/) | [Gitnux Report](https://gitnux.org/openclaw-ai-statistics/)

---

## 2. Reddit

> ⚠️ Reddit bloqueia o crawler da Anthropic, então os dados vêm de menções indiretas em outras fontes.

### Sentimento Geral
- **Jan-Fev/2026**: Entusiasmo alto. Posts tipo "OpenClaw changed my workflow" em r/SaaS e r/automation
- **Mar-Abr/2026**: Shift para frustração. "OpenClaw is dead" começou a aparecer repetidamente
- **Mai/2026**: Polarizado. Defensores vs críticos. Threads encorajando migração para Claude Code

### Temas Recorrentes
- **Segurança do ClawHub**: "80% das skills são lixo ou maliciosas" — citado em múltiplos threads
- **Custos pós-ban da Anthropic**: Anthropic baniu Claude Pro/Max de tools terceiros incluindo OpenClaw. Usuários foram de $20/mês flat para billing por token. Comunidade furiosa
- **Updates quebrando tudo**: 13 releases só em Março, com 3 breaking changes simultâneas sem migration guide
- **WhatsApp bans**: Relatos frequentes de contas banidas ao usar OpenClaw com WhatsApp

**Ref:** [BetterClaw Assessment](https://www.betterclaw.io/blog/is-openclaw-dead-2026) | [Medium - OpenClaw is Dead](https://medium.com/data-science-in-your-pocket/openclaw-is-dead-6f6e3cab731f)

---

## 3. GitHub — Issues e Discussions

### Bugs Mais Reportados

**1. Regressão de Tool Dispatching (Mar/2026)**
- Versões afetadas: 2026.3.2, 2026.3.7, 2026.3.8
- Todos os tools exceto `read` retornavam "Tool not found"
- Fix: reverter para 2026.3.1

**2. Updates Quebrando Funcionalidade**
- v2026.3.2 desabilitou tools por padrão sem aviso
- Sandbox precisa ser desabilitado manualmente em muitas configs
- `exec` e file access precisam ser re-habilitados após update

**3. Exposição de Thinking Interno (Abr/2026)**
- v2026.4.9 expunha o "pensamento" interno do agente (em inglês) para o usuário
- Issue #64267

**4. Performance Degradada (Abr/2026)**
- A partir de 2026.4.24, gateways ficaram lentos
- Algumas instalações entraram em loops de reparo de dependências de plugins

**5. Ciclo de Releases Agressivo**
- 13 releases em Março 2026
- v2026.3.2 com 3 breaking changes simultâneas e zero migration guide

### Workarounds da Comunidade
- Fixar versão em 2026.3.1 para estabilidade
- Usar Docker para isolar o agente do sistema host
- Auditar skills manualmente antes de instalar (`openclaw security audit`)
- Nunca expor o gateway publicamente

**Ref:** [GitHub Issues](https://github.com/openclaw/openclaw/issues) | [Issue #41462](https://github.com/openclaw/openclaw/issues/41462) | [Issue #64267](https://github.com/openclaw/openclaw/issues/64267) | [OpenClaw Blog - Rough Week](https://openclaw.ai/blog/openclaw-rough-week)

---

## 4. Product Hunt

### OpenClaw no Product Hunt
- Listado como "The AI that actually does things"
- Descrição: "Turns your computer into a 24/7 personal agent accessible from any chat app"

### Ecossistema no PH
| Produto | Descrição | Upvotes |
|---------|-----------|---------|
| **ClawOffice** | Office suite para agentes OpenClaw | 107 |
| **GoClaw** | App mobile (iOS/Android) para gerenciar OpenClaw | — |
| **Clawi.ai** | OpenClaw na cloud em 5 minutos | — |
| **GetClaw** | Deploy em 1 minuto | — |
| **The Claw News** | Artigos escritos autonomamente por agentes OpenClaw | — |
| **OpenClawCity** | Cidade persistente onde agentes vivem e evoluem | — |

**Ref:** [Product Hunt - OpenClaw](https://www.producthunt.com/products/clawdbot-2) | [ClawOffice](https://www.hunted.space/dashboard/clawoffice/launches/clawoffice)

---

## 5. YouTube — Tutoriais e Reviews

### Conteúdo Disponível
- **"The ONLY OpenClaw Tutorial You Need 2026"** — guia completo para iniciantes
- **"OPENCLAW FULL COURSE 3 HOURS: Build & Sell"** — curso com foco em monetização
- **"OPENCLAW De NOVATO a PRO"** — curso completo em espanhol
- **"OpenClaw Setup in 2026: The Only Guide You Need"** — setup passo a passo
- **"Connect Telegram and WhatsApp to OpenClaw"** — integração de canais

### Observações
- Conteúdo predominantemente em inglês e espanhol
- **Não encontrado conteúdo significativo em português** — oportunidade clara para AutomatikLabs
- Foco pesado em setup/instalação; pouco sobre uso empresarial avançado
- Vários tutoriais incluem links de afiliados para VPS (Hostinger, Contabo)

**Ref:** [YouTube - Full Course](https://www.youtube.com/watch?v=rv6p9R_lNxc) | [YouTube - Setup Guide](https://www.youtube.com/watch?v=9epvGKyHIek)

---

## 6. Segurança — O Elefante na Sala

### Vulnerabilidades Críticas
- **138+ CVEs documentados** em 2026
- **CVE-2026-32922 (CVSS 9.9)**: Escalação de privilégios — uma chamada API converte pairing token em controle administrativo total com RCE
- **CVE-2026-25253**: Remote Code Execution com 1 clique

### Skills Maliciosas no ClawHub
- **1.400+ skills maliciosas** confirmadas ativas
- **13.4%** de todas as skills com issues críticas de segurança (auditoria Snyk)
- **ClawHavoc**: Campanha com infostealers macOS (AMOS) disfarçados de skills de produtividade
- ClawHub removeu 2.419 skills suspeitas

### Problemas Arquiteturais
- Autenticação **desabilitada por padrão**
- Conexões localhost confiadas implicitamente
- mDNS broadcasting de parâmetros de configuração na rede local
- **500K+ instâncias expostas** sem hardening

### Recomendações de Segurança (Comunidade + Empresas)
- Microsoft, Kaspersky e CrowdStrike recomendam **não deployar em máquinas com dados sensíveis**
- Rodar em Docker/VM isolado
- Sempre checar "Security Scan: Benign" antes de instalar skills
- Nunca expor o gateway publicamente
- Usar `openclaw security audit` para verificar skills

**Ref:** [BetterClaw Security Report](https://www.betterclaw.io/blog/openclaw-security-2026) | [Sangfor Analysis](https://www.sangfor.com/blog/cybersecurity/openclaw-ai-agent-security-risks-2026) | [DigitalOcean Challenges](https://www.digitalocean.com/resources/articles/openclaw-security-challenges) | [SlowMist Guide](https://github.com/slowmist/openclaw-security-practice-guide)

---

## 7. Cases Reais de Uso (Reportados pela Comunidade)

### Cases de Execução de Processos
| Caso | Resultado | Fonte |
|------|-----------|-------|
| E-commerce: processamento de 300+ invoices/mês | Bookkeeping de 20h → 5h/mês | Contabo Blog |
| SaaS: triage de 500+ tickets/dia | First-response de 4h → 22 min | KDnuggets |
| Sales: qualificação de leads automática | Enriquecimento de dados + scoring automático | Superframeworks |
| Ops: CRM updates + email triage + briefings | 20-40h/semana economizadas | ClawOneClick |
| Finance: detecção de anomalias em invoices | Flags duplicatas e valores incomuns | Contabo Blog |

### Custo Médio Reportado
- **$30-$150/mês** em custos de API para deployment típico de business
- Tarefas de classificação/routing usam modelos baratos (GPT-4o Mini, Claude Haiku)
- Cache de queries repetidas reduz custos em **30-50%**

**Ref:** [Contabo Use Cases](https://contabo.com/blog/openclaw-use-cases-for-business-in-2026/) | [KDnuggets](https://www.kdnuggets.com/7-practical-openclaw-use-cases-you-should-know) | [Superframeworks](https://superframeworks.com/articles/openclaw-business-use-cases) | [GreenNode](https://greennode.ai/blog/openclaw-use-cases-for-business)

---

## 8. Skills e Plugins Mais Mencionados

### Top Skills Recomendadas
| Skill | Função | Fonte |
|-------|--------|-------|
| **Composio** | 1 integração → 860+ ferramentas (GitHub, Slack, Gmail) | Composio |
| **Self-Improving Agent** | Loga erros e preferências em memória, agente melhora com o tempo | ClawdHost |
| **Frontend Design** | UI production-grade (anti-pattern genérico) | BetterClaw |
| **Reverse Engineering** | Captura tráfego, decodifica protocolos binários | Composio |
| **SecureClaw** | Hardening e auditoria de segurança | BetterClaw |
| **AgentMail** | Automação de email com IA | PCBuildAdvisor |
| **Playwright MCP** | Automação de browser | BetterClaw |

### Skills a EVITAR
- Skills sem scan de segurança "Benign" no ClawHub
- Skills com poucos downloads e sem código-fonte verificável
- Qualquer skill que pede acesso a file system completo sem justificativa

**Ref:** [Composio Top 10](https://composio.dev/content/top-openclaw-skills) | [Awesome OpenClaw Skills](https://github.com/VoltAgent/awesome-openclaw-skills) | [ClawdHost Guide](https://clawdhost.net/blog/best-openclaw-skills-2026/) | [AI Makers Guide](https://www.aimakers.co/blog/openclaw-skills-guide/)

---

## 9. Integrações — O Que Funciona vs O Que Dá Problema

### ✅ Funciona Bem
| Integração | Status | Notas |
|------------|--------|-------|
| **Telegram** | Excelente | Bot API nativa, setup rápido, estável |
| **Discord** | Bom | Integração sólida via bot token |
| **Signal** | Bom | Privacidade, mas menos features |
| **Docker** | Essencial | Isolamento de segurança recomendado |
| **Hostinger VPS** | Excelente | 1-click deploy, documentação oficial |
| **HostGator VPS** | Bom | 1-click deploy disponível (GatorClaw) |

### ⚠️ Funciona com Ressalvas
| Integração | Status | Problema |
|------------|--------|----------|
| **WhatsApp** | Problemático | Ban frequente, sem API oficial, usa reverse-engineering (Baileys/Whiskay) |
| **ClawHub Skills** | Arriscado | 13.4% com issues de segurança, 1.400+ maliciosas |
| **Updates automáticos** | Perigoso | Breaking changes frequentes sem migration guide |

### ❌ Problemas Conhecidos
| Problema | Descrição |
|----------|-----------|
| WhatsApp bans | Detecção de automação → ban da conta em dias |
| Telegram silent reply bug | Agente recebe msg mas resposta nunca chega ao usuário |
| Private networks | HTTPS obrigatório, necessita estar online |
| Post-update tools | Tools desabilitados por padrão após updates |

**Ref:** [C-Sharp Corner](https://www.c-sharpcorner.com/article/openclaw-communication-channels-in-2026-why-telegram-works-and-whatsapp-fails/) | [Hostinger Troubleshooting](https://www.hostinger.com/support/how-to-connect-and-troubleshoot-telegram-and-whatsapp-channels-in-openclaw-on-hostinger-vps/) | [OpenClaw Docs](https://docs.openclaw.ai/channels/troubleshooting)

---

## 10. Dicas de Usuários Avançados

### Setup & Arquitetura
- **"Se você não consegue descrever o que o agente faz em uma frase, ele está fazendo demais"** — princípio de responsabilidade única
- **Docker é obrigatório** — nunca rodar diretamente no host
- **1 conversa = 1 tarefa** — trocar de tarefa = nova conversa
- **Fixar versão** — não usar auto-update em produção

### Memória & Contexto
- Usar `memory_search` e `memory_get` em vez de full reads → reduz token usage dramaticamente
- Criar arquivos de memória dedicados por projeto (`memory/projeto-x.md`)
- Manter contexto isolado entre projetos diferentes

### Custos
- Cache de queries repetidas → **-30-50% de custo** de API
- Usar modelos pequenos para tarefas simples (classificação, routing)
- Modelo grande só para tarefas complexas (análise, geração)

### Segurança
- `openclaw security audit` antes de instalar qualquer skill
- Nunca expor gateway publicamente
- Usar Telegram Topics para separar tipos de notificação (Erros, Alertas, Reports)
- Approval metadata + scoped credentials = requisito operacional

**Ref:** [MindStudio - 200+ Hours](https://www.mindstudio.ai/blog/openclaw-best-practices-power-users-200-hours) | [Medium - 7 Lessons](https://medium.com/@tentenco/seven-hard-won-lessons-for-running-openclaw-without-burning-out-65e3d97dda3d) | [TDS - 3 Mistakes](https://towardsdatascience.com/three-openclaw-mistakes-to-avoid-and-how-to-fix-them/)

---

## 11. Sentimento Geral — Termômetro

### O Que Elogiam
- Open-source e gratuito
- Capacidade real de executar tarefas (não é só chatbot)
- Ecossistema vibrante de skills
- Comunidade ativa e crescendo rápido
- Interface via Telegram é matadora
- Self-hosted = controle total dos dados

### O Que Criticam
- Segurança é uma preocupação séria e real
- Updates muito frequentes com breaking changes
- ClawHub é um campo minado de skills maliciosas
- WhatsApp integration é instável e arriscada
- Curva de aprendizado para configuração avançada
- Custos de API podem escalar rápido sem otimização
- Ban da Anthropic do Claude Pro/Max irritou a comunidade

### Veredicto da Comunidade
> OpenClaw não está "morto" — tem 350K stars, 3.2M MAU, 44K skills. Mas a narrativa de "segurança e confiança" está abalada. O software é poderoso, o ecossistema é perigoso. Usuários que hardening corretamente reportam resultados excelentes. Usuários que instalam skills sem verificar sofrem as consequências.

---

## 12. Oportunidades para o Curso AutomatikLabs

1. **Conteúdo em português inexistente** — zero tutoriais significativos em PT-BR no YouTube
2. **Foco em segurança** — nenhum curso ensina hardening como prioridade
3. **Foco em execução de processos** — maioria dos tutoriais é sobre setup, não sobre uso real
4. **WhatsApp alternativa** — ensinar Telegram como canal principal (mais estável e sem risco de ban)
5. **Skills curadas** — listar apenas skills verificadas e seguras no material
6. **Fixar versão estável** — ensinar o aluno a não usar auto-update
7. **Cases em português para negócios brasileiros** — clínicas, e-commerces, consultorias

---

*Documento gerado via pesquisa automatizada em 27/05/2026*
*Fontes: GitHub, Product Hunt, YouTube, KDnuggets, Medium, Composio, Hostinger, DigitalOcean, e 30+ sites especializados*
