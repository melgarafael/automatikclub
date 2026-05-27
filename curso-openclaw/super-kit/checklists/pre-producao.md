# Checklist Pre-Producao — 25 Verificacoes Antes de Ir ao Ar

## Infraestrutura (5 checks)
- [ ] VPS ativa e acessivel via SSH
- [ ] OpenClaw rodando (`openclaw status` retorna OK)
- [ ] ChatGPT Plus conectado e respondendo (`openclaw test-llm`)
- [ ] Backup/snapshot criado antes de ir pra producao
- [ ] Espaco em disco >50% livre

## Identidade (5 checks)
- [ ] SOUL.md preenchido com papel operacional do negocio
- [ ] AGENTS.md com standing orders definidos e limites financeiros preenchidos
- [ ] USER.md completo — sem placeholders [ENTRE_COLCHETES]
- [ ] HEARTBEAT.md com schedule operacional configurado
- [ ] Telegram conectado e bot respondendo no grupo

## Seguranca (5 checks)
- [ ] Credenciais em .env ou vault (nenhuma hardcoded)
- [ ] Safety rules lidos e compreendidos (guardrails/SAFETY-RULES.md)
- [ ] Limites financeiros definidos em AGENTS.md
- [ ] Escalation rules configurados (guardrails/ESCALATION-RULES.md)
- [ ] Nenhuma skill de fonte nao verificada instalada

## Funcionalidade (5 checks)
- [ ] Relatorio diario testado manualmente (`openclaw cron run <id> --wait`)
- [ ] Heartbeat funcionando (verificar `openclaw system heartbeat last`)
- [ ] Memoria persistindo (verificar que memory/ tem logs)
- [ ] Standing orders testados (simular cada cenario)
- [ ] EVR protocol funcionando (agente verifica antes de reportar)

## Integracoes (5 checks)
- [ ] Canal principal (Telegram) testado — mensagens chegam e o agente responde
- [ ] Fontes de dados acessiveis (planilhas, APIs, CRM)
- [ ] Backup Git configurado e testado
- [ ] Todas as integracoes ativas respondendo (`openclaw channels status --probe`)
- [ ] Crons agendados e proxima execucao confirmada (`openclaw cron list`)

## Resultado: __/25 OK
- Se 25/25: pronto para producao
- Se 20-24: resolver pendencias antes de ir ao ar
- Se <20: voltar ao modulo correspondente do curso
