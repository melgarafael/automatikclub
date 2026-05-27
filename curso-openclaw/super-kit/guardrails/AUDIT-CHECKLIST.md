# Audit Checklist — Verificacao Semanal de Seguranca

Executar toda sexta-feira como parte da auto-melhoria.

## Credenciais
- [ ] Todas as API keys estao no .env (nenhuma hardcoded)
- [ ] Vault do 1Password/gerenciador atualizado
- [ ] Nenhuma credencial exposta em logs ou mensagens
- [ ] OAuth tokens nao estao expirados
- [ ] Credenciais de integracao testadas e funcionando

## Permissoes
- [ ] Standing orders respeitam limites financeiros definidos
- [ ] Nenhuma acao financeira autonoma acima do limite
- [ ] Comunicacoes externas passaram por aprovacao
- [ ] Dados de clientes segregados (nao misturados entre si)

## Integracoes
- [ ] Todas as integracoes ativas respondendo (verificar status)
- [ ] Nenhuma integracao com erros persistentes ignorados
- [ ] Rate limits nao sendo atingidos
- [ ] Webhook endpoints seguros (loopback/VPN/reverse proxy)

## Skills
- [ ] Nenhuma skill nova instalada sem verificacao
- [ ] Skills ativas sao todas de fontes confiaveis (100+ downloads)
- [ ] Permissoes de skills revisadas (nao deram acesso desnecessario)

## Logs e Memoria
- [ ] Logs episodicos (memory/) estao sendo gerados diariamente
- [ ] MEMORY.md foi curado esta semana (obsoletos removidos)
- [ ] SESSION-STATE.md nao contem dados sensiveis persistidos
- [ ] Nenhuma informacao confidencial em QUEUE.md

## VPS/Infraestrutura
- [ ] Snapshot/backup recente (menos de 7 dias)
- [ ] Espaco em disco OK (>20% livre)
- [ ] OpenClaw atualizado na versao estavel mais recente
- [ ] Firewall ativo e configurado

## Resultado
- Total de checks OK: __/22
- Issues encontradas: [listar]
- Acoes corretivas: [listar]
