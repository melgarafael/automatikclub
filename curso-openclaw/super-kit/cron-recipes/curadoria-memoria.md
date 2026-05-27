# Receita: Curadoria de Memoria Semanal

## Comando
```bash
openclaw cron add \
  --name "Curadoria Memoria" \
  --cron "0 17 * * 5" \
  --tz "America/Sao_Paulo" \
  --message "Execute curadoria semanal de memoria conforme self-improvement/SELF-IMPROVE.md: 1) Leia todos os logs episodicos da semana em memory/. 2) Extraia insights e padroes para MEMORY.md. 3) Remova informacoes obsoletas do MEMORY.md. 4) Avalie standing orders: algum precisa ajuste? 5) Verifique crons: algum gerando output vazio? 6) Gere relatorio de evolucao. Responda em portugues."
```

## Expressao Cron
`0 17 * * 5` = Toda sexta as 17:00
