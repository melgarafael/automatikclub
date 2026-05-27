# Receita: Pesquisa de Concorrencia

## Comando
```bash
openclaw cron add \
  --name "Pesquisa Concorrencia" \
  --cron "0 6 * * 1" \
  --tz "America/Sao_Paulo" \
  --message "Pesquise os sites dos concorrentes listados em USER.md. Para cada um: verifique precos dos produtos principais, promocoes ativas, novidades no site. Compare com nossos precos atuais. Gere relatorio comparativo com tabela: produto | nosso preco | concorrente | diferenca. Alerte se algum concorrente esta com preco >15% menor que o nosso. Responda em portugues."
```

## Expressao Cron
`0 6 * * 1` = Toda segunda as 06:00
