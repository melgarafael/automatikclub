# Auto-Melhoria Continua — Protocolo Semanal

> Execute este protocolo toda sexta as 17:00 (via cron ou heartbeat).
> Objetivo: o agente se torna melhor a cada semana sem intervencao humana.

## Passo 1: Revisar Logs Episodicos

Leia todos os arquivos em `memory/` dos ultimos 7 dias. Para cada dia, identifique:

- Tarefas que **falharam** — o que deu errado? E recorrente?
- Tarefas que **demoraram mais que o esperado** — gargalo? Integracao lenta?
- **Padroes repetitivos** — o dono pede a mesma coisa toda semana? Deveria virar standing order?
- **Decisoes do dono** — algo que ele corrigiu ou ajustou? Aprender para nao repetir

## Passo 2: Curar Memoria Semantica

Abra `MEMORY.md` e:

1. **Adicione** insights novos extraidos dos logs (fatos confirmados, padroes, preferencias)
2. **Remova** informacoes obsoletas (dados que mudaram, decisoes revertidas)
3. **Consolide** entradas duplicadas ou contraditorias
4. **Atualize** metricas de referencia com dados mais recentes

Regra: MEMORY.md deve ter no maximo 50 entradas. Se passar, priorize as mais recentes e relevantes.

## Passo 3: Avaliar Standing Orders

Para cada standing order em AGENTS.md, verifique:

- **Nunca acionado?** → O trigger esta errado? O processo mudou? Considere remover ou ajustar
- **Falhou repetidamente?** → O prompt precisa ser mais especifico? Falta informacao no contexto?
- **Falta algum?** → O dono pediu algo manualmente 3+ vezes? Deveria virar standing order

Gere lista de sugestoes de ajuste (NAO altere AGENTS.md sozinho — sugira ao dono).

## Passo 4: Otimizar Crons

Para cada cron ativo, verifique:

- **Output vazio frequente?** → A condicao nunca e verdadeira? Remover ou ajustar frequencia
- **Atrasando?** → Carga do servidor? Muitos crons no mesmo horario? Espaçar
- **Falta automacao?** → Processo manual repetitivo identificado nos logs? Sugerir novo cron

## Passo 5: Revisar Guardrails

- Houve alguma acao que **deveria ter pedido aprovacao** mas nao pediu? → Adicionar gate
- Houve alguma escalacao **desnecessaria**? (dono disse "pode fazer sozinho") → Relaxar limite
- Houve erro de seguranca? → Endurecer regra correspondente

## Passo 6: Gerar Relatorio de Evolucao

Formato do relatorio:

```
## Relatorio de Evolucao — Semana [DATA]

### Metricas
- Tasks executadas: [N]
- Taxa de sucesso: [%]
- Escalacoes: [N]
- Falhas: [N]

### O que melhorou
- [item 1]
- [item 2]

### O que precisa melhorar
- [item 1]
- [item 2]

### Sugestoes para o dono
- [sugestao 1: novo standing order, ajuste de cron, etc]
- [sugestao 2]

### Proximas acoes do agente
- [acao 1]
- [acao 2]
```

Enviar relatorio no canal principal do Telegram.
