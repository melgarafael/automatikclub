# Receita: Relatorio Diario

## Comando
```bash
openclaw cron add \
  --name "Relatorio Diario" \
  --cron "0 8 * * *" \
  --tz "America/Sao_Paulo" \
  --message "Execute o relatorio diario conforme standing orders em AGENTS.md. Consulte as fontes de dados, calcule metricas, e envie resumo formatado no canal principal. Responda em portugues. Siga protocolo EVR."
```

## Expressao Cron
`0 8 * * *` = Todo dia as 08:00

## O que faz
1. Consulta fontes de dados configuradas (planilhas, APIs, CRM)
2. Calcula metricas do dia anterior
3. Compara com dia/semana/mes anterior
4. Gera resumo formatado com bullets
5. Envia no canal principal do Telegram

## Personalizar
- Mudar horario: trocar `0 8` por `0 9` (09:00), `30 7` (07:30), etc
- Mudar timezone: trocar `America/Sao_Paulo` pelo seu
- Adicionar metricas: editar a mensagem com os KPIs que importam
