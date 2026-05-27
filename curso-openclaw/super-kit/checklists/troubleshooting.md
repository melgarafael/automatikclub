# Troubleshooting — Diagnostico de Problemas Comuns

## Agente nao responde

```bash
# 1. Verificar se o gateway esta rodando
openclaw gateway status

# 2. Se parado, reiniciar
openclaw gateway restart

# 3. Verificar logs para erro especifico
openclaw logs --follow

# 4. Se erro de conexao com LLM
openclaw test-llm
```

**Causas comuns:** Gateway parou (reiniciar), ChatGPT Plus expirou (renovar), VPS reiniciou (verificar uptime).

## Cron nao executou

```bash
# 1. Verificar se cron esta ativo
openclaw cron list

# 2. Ver historico de execucoes
openclaw cron runs --id <jobId>

# 3. Executar manualmente para testar
openclaw cron run <jobId> --wait

# 4. Verificar timezone
# Cron sem --tz usa timezone do host
date  # ver timezone atual do servidor
```

**Causas comuns:** Timezone errado, gateway estava parado no horario, erro no prompt do cron.

## Heartbeat nao roda

```bash
# 1. Ver ultimo heartbeat
openclaw system heartbeat last

# 2. Verificar HEARTBEAT.md
# Se arquivo vazio → skip como empty-heartbeat-file
# Se sem tasks com prazo → skip como no-tasks-due

# 3. Heartbeat adia se cron esta ativo
# Verificar se tem cron rodando: openclaw tasks list --status running
```

**Causas comuns:** HEARTBEAT.md vazio, cron ativo (heartbeat adia), gateway parado.

## Integracao nao conecta

```bash
# 1. Status de canais
openclaw channels status --probe

# 2. Verificar credenciais
# Credenciais expiraram? Testar manualmente

# 3. Verificar .env
# Variavel correta? Sem espacos extras?

# 4. Diagnostico completo
openclaw doctor --fix
```

**Causas comuns:** Token expirado, API key invalida, servico externo fora do ar.

## Memoria nao persiste

```bash
# 1. Verificar se hook session-memory esta ativo
openclaw hooks list

# 2. Se desativado, ativar
openclaw hooks enable session-memory

# 3. Verificar se diretorio memory/ existe
ls -la memory/
```

**Causas comuns:** Hook session-memory desativado, diretorio memory/ nao existe.

## Agente "alucinando" (dados incorretos)

1. Verificar AGENTS.md — regra "nunca inventar dados" esta la?
2. Verificar SOUL.md — "se nao sei, digo que nao sei" esta explicito?
3. Verificar fontes de dados — integracao esta retornando dados corretos?
4. Adicionar guardrail: "NUNCA gere numeros sem consultar a fonte. Se a fonte nao responder, diga que nao tem o dado."

## Custos altos com LLM

1. Verificar frequencia de heartbeat (30min pode ser excessivo — tentar 60min)
2. Verificar crons — algum rodando muito frequentemente?
3. Verificar prompt dos crons — prompts muito longos consomem mais tokens
4. Considerar modelo mais barato para tarefas simples (`--model` no cron)
