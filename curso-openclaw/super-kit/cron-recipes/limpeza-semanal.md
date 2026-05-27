# Receita: Limpeza e Manutencao Semanal

## Comando
```bash
openclaw cron add \
  --name "Limpeza Semanal" \
  --cron "0 3 * * 0" \
  --tz "America/Sao_Paulo" \
  --message "Execute manutencao semanal: 1) Limpe tasks concluidas do QUEUE.md (manter ultimas 10). 2) Archive logs episodicos com mais de 30 dias. 3) Verifique espaco em disco. 4) Teste todas as integracoes ativas. 5) Gere resumo da manutencao. Responda em portugues."
```

## Expressao Cron
`0 3 * * 0` = Todo domingo as 03:00
