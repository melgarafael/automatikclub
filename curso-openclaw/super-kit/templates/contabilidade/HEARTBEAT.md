# Heartbeat Schedule — Escritorio Contabil

tasks:

- name: prazos-fiscais
  interval: 24h
  prompt: >
    Verificar calendario fiscal para os proximos 5 dias uteis.
    Consultar knowledge/calendario-fiscal.md e cruzar com lista de clientes ativos.
    Para cada obrigacao com vencimento proximo:
    - Identificar quais clientes sao afetados (por regime tributario)
    - Verificar se a obrigacao ja foi cumprida (status na planilha Obrigacoes)
    - Se NAO cumprida: gerar alerta com urgencia proporcional (5 dias=amarelo, 3=laranja, 1=vermelho, vencido=URGENTE)
    Enviar consolidado no topico Prazos Fiscais.
    Se nenhum prazo nos proximos 5 dias, responder HEARTBEAT_OK.

- name: vencimentos-dia
  interval: 24h
  prompt: >
    Verificar boletos, guias de recolhimento e parcelas com vencimento HOJE e AMANHA.
    Para cada vencimento nao pago:
    - Identificar cliente, tipo de guia, valor, codigo de barras/PIX
    - Enviar lembrete ao cliente com dados de pagamento
    - Enviar consolidado para a equipe no topico Vencimentos
    Se todos pagos ou nenhum vencimento proximo, responder HEARTBEAT_OK.

- name: documentos-pendentes
  interval: 4h
  prompt: >
    Verificar se algum cliente respondeu ao lembrete de documentos nas ultimas 4 horas.
    Se alguem enviou documentos:
    - Atualizar status na planilha Documentos
    - Confirmar recebimento ao cliente
    - Verificar se a entrega esta completa ou parcial
    Se alguem respondeu com duvida ou pediu prazo: registrar e ajustar cobranca.
    Se nada mudou, responder HEARTBEAT_OK.

- name: status-integracoes
  interval: 2h
  prompt: >
    Testar conectividade com fontes de dados criticas:
    - Google Sheets (Documentos, Obrigacoes, Conciliacao, Cobranca)
    - Canal Telegram (topicos operacionais respondendo)
    Se alguma integracao falhou, alertar no topico Alertas Urgentes.
    Se tudo OK, responder HEARTBEAT_OK.

- name: anomalias-conciliacao
  interval: 12h
  prompt: >
    Scan rapido nas ultimas movimentacoes bancarias recebidas.
    Se detectar movimentacao de valor alto (>R$5.000) sem lancamento contabil correspondente,
    registrar e alertar no topico Conciliacao.
    Se tudo conciliado ou sem novos extratos, responder HEARTBEAT_OK.

## Tarefas Diarias (via Cron — registradas aqui para referencia)

### 07:00 — Alerta de Vencimentos do Dia
- Cron: `0 7 * * *` (America/Sao_Paulo)
- Processo: Program "Alerta de Vencimentos" do AGENTS.md
- Alerta automatico para clientes com guias vencendo hoje/amanha

### 09:00 — Cobranca de Documentos
- Cron: `0 9 * * *` (America/Sao_Paulo)
- Processo: Program "Cobranca de Documentos" do AGENTS.md
- Verifica pendencias, envia lembretes graduais

### 17:00 — Fechamento do Dia
- Cron: `0 17 * * *` (America/Sao_Paulo)
- Resumo: prazos cumpridos, documentos recebidos, alertas pendentes
- Preparar agenda do dia seguinte (vencimentos, cobranças, obrigacoes)

## Tarefas Semanais (via Cron)

### Segunda 08:00 — Relatorio de Status por Cliente
- Cron: `0 8 * * 1` (America/Sao_Paulo)
- Processo: Program "Relatorio de Status" do AGENTS.md
- Status completo de cada cliente (documentos, obrigacoes, pendencias)

### Quarta 10:00 — Conciliacao Bancaria
- Cron: `0 10 * * 3` (America/Sao_Paulo)
- Processo: Program "Conciliacao Bancaria" do AGENTS.md
- Comparar extratos com lancamentos, identificar divergencias

### Sexta 17:00 — Auto-Melhoria Semanal
- Cron: `0 17 * * 5` (America/Sao_Paulo)
- Revisar logs da semana (alertas enviados, respostas recebidas, divergencias)
- Curar MEMORY.md: atualizar padroes de clientes (quem atrasa mais, quem sempre entrega no prazo)
- Identificar melhorias: cobrancas que nao funcionaram, alertas ignorados
- Gerar relatorio de evolucao

## Tarefas Mensais (via Cron)

### Dia 1 — Abertura do Mes Fiscal
- Cron: `0 8 1 * *` (America/Sao_Paulo)
- Resetar status de documentos de todos os clientes para "Pendente"
- Carregar calendario fiscal do mes
- Enviar comunicado aos clientes: "Novo mes fiscal — documentos esperados ate [data]"
- Gerar lista de obrigacoes do mes por cliente

### Dia 25 — Fechamento do Mes Fiscal
- Cron: `0 8 25 * *` (America/Sao_Paulo)
- Relatorio consolidado do mes:
  - Clientes com documentos completos vs pendentes
  - Obrigacoes cumpridas vs atrasadas
  - Multas evitadas (prazo cumprido com menos de 3 dias de folga)
  - Conciliacoes pendentes
- Alertar sobre obrigacoes do proximo mes que precisam de preparacao antecipada

## Calendario Fiscal de Referencia Rapida (Vencimentos Mensais)

| Dia | Obrigacao | Regimes |
|-----|-----------|---------|
| 7 | FGTS (GRF) | Todos com CLT |
| ~10-15 | ISS (varia por municipio) | Servicos |
| ~9-15 | ICMS (varia por estado) | Comercio/Industria |
| ~10o dia util | SPED Contribuicoes | Presumido/Real |
| 15o dia util do 2o mes | DCTF | Presumido/Real |
| 20 | DAS (Simples Nacional) | Simples |
| 20 | DARF IRRF / INSS / GPS | Todos com folha |
| 20 | SPED Fiscal | Industria/Comercio |
| 20 | PGDAS-D (calculo) | Simples |
| 25 | DARF PIS/COFINS | Presumido/Real |
| Ult. dia util | DARF IRPJ/CSLL (trimestral) | Presumido/Real |

## Instrucoes Gerais

- Mantenha alertas curtos e acionaveis — o contador nao quer texto, quer dados
- NUNCA envie dados fiscais de um cliente em alerta destinado a outro
- Se nada precisa de atencao apos todas as tasks, responda HEARTBEAT_OK
- Priorize SEMPRE: vencimentos do dia > vencimentos da semana > vencimentos do mes
- Em caso de duvida sobre regime tributario de um cliente, consulte knowledge/clientes.md antes de alertar
