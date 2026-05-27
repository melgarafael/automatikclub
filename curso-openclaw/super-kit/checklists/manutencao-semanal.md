# Checklist de Manutencao Semanal

Executar toda semana (preferencialmente sexta ou domingo).

## Saude do Sistema
- [ ] `openclaw status` retorna tudo OK
- [ ] `openclaw doctor` sem erros criticos
- [ ] Espaco em disco >30% livre
- [ ] Logs sem erros persistentes (`openclaw logs` ultimas 24h)

## Memoria e Dados
- [ ] Logs episodicos da semana existem em memory/
- [ ] MEMORY.md foi curado (self-improvement executou)
- [ ] SESSION-STATE.md nao esta inflado (limpar se >500 linhas)
- [ ] QUEUE.md limpo (Done limpo, apenas ultimos 10)

## Crons e Automacoes
- [ ] Todos os crons executaram conforme esperado (`openclaw cron runs`)
- [ ] Nenhum cron com falhas consecutivas
- [ ] Heartbeat rodando normalmente (`openclaw system heartbeat last`)

## Integracoes
- [ ] `openclaw channels status --probe` tudo verde
- [ ] Credenciais nao expiradas
- [ ] Backup Git com commit recente (<7 dias)

## Seguranca
- [ ] Audit checklist (guardrails/AUDIT-CHECKLIST.md) executado
- [ ] Nenhuma skill nova instalada sem verificacao
- [ ] Snapshot da VPS criado esta semana
