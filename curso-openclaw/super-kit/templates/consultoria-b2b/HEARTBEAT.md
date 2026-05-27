# HEARTBEAT.md — Consultoria / Agencia B2B

> Checklist operacional do agente. Cada task roda no intervalo definido.
> Se nada precisa de atencao, responda HEARTBEAT_OK.
> Se algo precisa de atencao, responda com o alerta formatado.

---

tasks:

# ─────────────────────────────────────────
# MONITORAMENTO DE KPIs (Diario)
# ─────────────────────────────────────────

- name: monitorar-kpis
  interval: 24h
  prompt: |
    Verifique os KPIs criticos de cada cliente ativo (listados em memory/clientes/[cliente]/kpis.md).

    Para cada KPI:
    1. Colete o valor atual da fonte de dados configurada
    2. Compare com a meta definida
    3. Calcule o desvio percentual

    ALERTAR se:
    - Desvio > 20% negativo (abaixo da meta)
    - Tendencia de queda por 3+ dias consecutivos (mesmo que ainda nao tenha atingido 20%)

    NAO alertar se:
    - Flutuacao normal (< 10% em KPIs volateis como trafego diario)
    - Desvio positivo (boas noticias esperam o relatorio semanal)

    Formato do alerta:
    🔴 ALERTA KPI — [Cliente]
    KPI: [nome] | Atual: [valor] | Meta: [meta] | Desvio: -[X]%
    Tendencia: [subindo/caindo/estavel] ultimos [N] dias
    Acao sugerida: [o que verificar ou fazer]

    Maximo 3 alertas por cliente. Se houver mais, consolide.

    Se nenhum KPI esta em desvio critico: HEARTBEAT_OK

# ─────────────────────────────────────────
# GESTAO DE PROJETOS (Continuo)
# ─────────────────────────────────────────

- name: gestao-projetos
  interval: 4h
  prompt: |
    Verifique entregas e deadlines de projetos ativos (fonte: board de tarefas, Notion ou planilha).

    VERIFICAR:
    1. Entregas com deadline nas proximas 48h:
       - Se status NAO e "em andamento" ou "concluido": alertar
    2. Entregas atrasadas (deadline passou):
       - Listar com: projeto, entrega, responsavel, dias de atraso
    3. Entregas concluidas desde ultima verificacao:
       - Registrar em memory/projetos/status.md

    ALERTAR se:
    - Entrega em 48h sem acao → lembrete para responsavel
    - Entrega atrasada → alerta para gestor
    - Responsavel nao respondeu apos 2 lembretes em 24h → escalar

    Formato:
    📋 PROJETOS — Atencao necessaria
    ⚠️ [Projeto] — [Entrega] — deadline [data] — responsavel: [nome] — status: [status]

    Se todos os projetos estao no prazo e sem pendencias: HEARTBEAT_OK

# ─────────────────────────────────────────
# HEALTH CHECK DE INTEGRACOES (Frequente)
# ─────────────────────────────────────────

- name: health-check
  interval: 2h
  prompt: |
    Verificacao rapida de saude operacional:

    1. Gateway online e respondendo?
    2. APIs externas acessiveis? (Google Analytics, CRM, planilhas)
    3. Ultimo backup tem menos de 24h?
    4. Algum erro registrado em memory/erros/ desde ultima verificacao?
    5. Memoria do sistema esta dentro dos limites?

    Se TUDO ok: HEARTBEAT_OK

    Se algo estiver errado:
    🚨 HEALTH CHECK — Problema detectado
    [Componente]: [status] — [acao necessaria]

# ─────────────────────────────────────────
# INBOX E COMUNICACOES (Frequente)
# ─────────────────────────────────────────

- name: inbox-triage
  interval: 2h
  prompt: |
    Verifique canais de comunicacao por mensagens que precisam de atencao:

    1. Emails nao lidos:
       - De clientes → marcar como URGENTE se mencionar prazo, problema ou reclamacao
       - De prospects → registrar em pipeline se for resposta a proposta
       - Newsletters/spam → ignorar
    2. Mensagens no Telegram/WhatsApp de clientes:
       - Se perguntam status de projeto → verificar e preparar resposta (rascunho)
       - Se reportam problema → alertar gestor

    NUNCA responder diretamente. Sempre preparar rascunho para aprovacao.

    Se nada urgente: HEARTBEAT_OK

    Se algo precisa de atencao:
    📬 INBOX — [N] itens precisam de atencao
    - [Tipo] de [Remetente]: [resumo em 1 linha] — prioridade: [alta/media]

# ─────────────────────────────────────────
# PIPELINE COMERCIAL (Diario)
# ─────────────────────────────────────────

- name: pipeline-check
  interval: 24h
  prompt: |
    Verifique o pipeline comercial em memory/comercial/pipeline.md:

    1. Propostas enviadas ha mais de 3 dias uteis sem retorno:
       - Preparar rascunho de follow-up (NAO enviar — salvar para aprovacao)
    2. Propostas enviadas ha mais de 7 dias uteis sem retorno:
       - Marcar como "follow-up urgente" e alertar gestor
    3. Propostas com reuniao agendada para hoje/amanha:
       - Lembrar gestor com: cliente, horario, pauta

    Se pipeline esta em dia: HEARTBEAT_OK

    Se ha acoes pendentes:
    💼 PIPELINE — [N] acoes pendentes
    - [Proposta/Cliente]: [acao necessaria] — [dias sem retorno]

# ─────────────────────────────────────────
# RESUMO DIARIO (Fim do dia)
# ─────────────────────────────────────────

- name: resumo-diario
  interval: 24h
  prompt: |
    Sao 17:00. Compile o resumo do dia para o gestor:

    1. Projetos: quantos no prazo, quantos com atencao, quantos atrasados
    2. KPIs: algum alerta disparado hoje? Quais clientes?
    3. Pipeline: propostas com movimento hoje? Follow-ups enviados?
    4. Inbox: itens que ainda aguardam resposta/acao
    5. Amanha: entregas previstas, reunioes agendadas, acoes pendentes

    Formato:
    📅 Resumo do Dia — [data]

    ## Projetos: [N] no prazo | [N] atencao | [N] atrasados
    [Destaques se houver]

    ## KPIs: [N] alertas hoje
    [Resumo se houver alertas]

    ## Pipeline: [N] propostas ativas (R$ [valor total])
    [Movimentos do dia]

    ## Amanha
    - [Entregas previstas]
    - [Reunioes]
    - [Acoes pendentes]

    Enviar no canal #briefing.
