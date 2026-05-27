# Receita: Cobranca de Inadimplentes

## Comando
```bash
openclaw cron add \
  --name "Cobranca Inadimplentes" \
  --cron "0 10 * * 1-5" \
  --tz "America/Sao_Paulo" \
  --message "Verifique a planilha de faturas/boletos. Identifique pagamentos com mais de 3 dias de atraso. Para cada inadimplente: se 1o aviso, envie lembrete cordial. Se 2o aviso (7+ dias), envie com urgencia. Se 3o aviso (15+ dias), escale para o dono. Registre cada acao no log. Responda em portugues."
```

## Expressao Cron
`0 10 * * 1-5` = Dias uteis (seg-sex) as 10:00

## O que faz
1. Consulta planilha de faturas/boletos
2. Filtra pagamentos atrasados (3+ dias)
3. Classifica por nivel de atraso
4. Envia lembretes graduais
5. Escala para humano quando necessario
6. Registra acoes no log

## Personalizar
- Mudar dias de atraso para cada nivel: editar na mensagem
- Adicionar canal de cobranca (email, WhatsApp): especificar na mensagem
- Mudar limite para escalacao: ajustar no AGENTS.md
