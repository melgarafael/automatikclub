# Receita: Backup Diario de Configuracoes

## Comando
```bash
openclaw cron add \
  --name "Backup Diario" \
  --cron "0 2 * * *" \
  --tz "America/Sao_Paulo" \
  --message "Execute backup das configuracoes do workspace. Copie AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md e o diretorio memory/ para o repositorio Git configurado. Faca commit com mensagem 'backup-automatico-[DATA]'. Confirme que o push foi bem-sucedido. Se falhar, alerte no canal principal."
```

## Expressao Cron
`0 2 * * *` = Todo dia as 02:00 (madrugada, baixo uso)

## O que faz
1. Copia arquivos criticos do workspace
2. Commit no Git com timestamp
3. Push para repositorio remoto
4. Confirma sucesso ou alerta em caso de falha
