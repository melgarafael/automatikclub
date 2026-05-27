# Heartbeat Schedule — Imobiliaria

## Monitoramento Continuo (a cada 30 minutos)

- Verificar se ha leads novos no CRM (novos cadastros, formularios, indicacoes)
- Checar follow-ups pendentes (leads sem contato ha >24h)
- Verificar status de visitas do dia (confirmadas, canceladas, reagendadas)
- Confirmar que integracoes estao respondendo (CRM, planilhas, Telegram)
- Se lead quente entrou: qualificar imediatamente e atribuir a corretor
- Se anomalia detectada: registrar em memory/ e alertar se critica

## Tarefas Diarias

### 07:30 — Organizacao de Visitas do Dia
- Consultar todas as visitas confirmadas para hoje
- Organizar roteiro por proximidade geografica (minimizar deslocamento)
- Para cada visita, compilar: endereco completo, nome do cliente, codigo e dados-chave do imovel, horario, observacoes relevantes do lead
- Enviar roteiro formatado para cada corretor no Telegram
- Se visita com dados incompletos: alertar corretor para completar antes de sair

### 09:00 — Briefing Matinal
- Status do pipeline: quantos leads em cada estagio (Novo/Qualificado/Visita/Proposta/Fechamento)
- Visitas do dia: quantas, quais corretores, quais imoveis
- Follow-ups pendentes: leads que completam 48h/72h/7dias hoje
- Alertas: leads quentes sem atualizacao, imoveis indisponiveis que ainda aparecem
- Enviar resumo formatado no canal principal do Telegram

### 10:00 — Follow-ups Automaticos
- Identificar leads sem contato ha 48h+ (conforme regras do AGENTS.md)
- 48h sem resposta: enviar follow-up cordial (template 1)
- 72h sem resposta: enviar follow-up com urgencia (template 2)
- 7 dias sem resposta: enviar ultimo contato (template 3) e mover para "Frio" se sem retorno
- Registrar cada follow-up no historico do lead
- Enviar resumo: X follow-ups enviados, Y leads movidos para Frio

### 14:00 — Check de Meio-Dia
- Visitas da manha: foram realizadas? Resultado reportado pelo corretor?
- Visitas da tarde: confirmadas? Cliente respondeu?
- Cobrar corretores que fizeram visita mas nao atualizaram status no CRM
- Tarefas pendentes do QUEUE.md

### 17:00 — Fechamento do Dia
- Resumo operacional do dia:
  - Visitas realizadas vs agendadas
  - Propostas geradas
  - Leads qualificados (novos hoje)
  - Leads que avancaram de estagio
  - Leads que esfriaram
- Follow-ups enviados e taxas de resposta
- Alertas ou excecoes encontradas
- Preparar agenda de visitas de amanha (rascunho para ajuste no 07:30)

## Tarefas Semanais

### Segunda 09:00 — Relatorio Semanal de Pipeline
- Funil completo: leads por estagio com comparativo vs semana anterior
- Taxa de conversao entre etapas (ex: 60% dos qualificados viram visita)
- Tempo medio em cada fase (ex: media de 3 dias em "Qualificado")
- Ranking de corretores: visitas realizadas, propostas geradas, fechamentos
- Imoveis mais visitados vs mais vendidos (identificar desconexoes)
- Projecao de fechamentos para proximas 2 semanas
- Regioes com mais demanda vs regioes com mais estoque
- Sugestoes baseadas em dados (ex: "Regiao X tem 15 leads e 2 imoveis — considerar captar mais")

### Quarta 14:00 — Manutencao de Integracoes
- Testar conexao com CRM
- Verificar se planilhas de imoveis estao sincronizadas
- Confirmar que templates de follow-up estao funcionando
- Checar se canal Telegram esta recebendo/enviando normalmente
- Reportar qualquer integracao com problemas

### Sexta 17:00 — Auto-Melhoria Semanal
- Revisar logs episodicos da semana (memory/)
- Curar MEMORY.md: atualizar padroes identificados
  - Tipo de imovel mais procurado esta semana
  - Regiao com mais demanda
  - Objecoes mais frequentes dos leads
  - Motivos de perda (preco? localizacao? condicoes?)
- Avaliar standing orders: algum precisa de ajuste?
- Avaliar templates de follow-up: taxa de resposta esta boa?
- Otimizar crons: algum gerando output vazio ou irrelevante?
- Gerar relatorio de evolucao do agente

## Tarefas Mensais

### Dia 1 — Relatorio Mensal
- Consolidacao de metricas do mes (funil, conversao, volume, faturamento)
- Comparativo mes vs mes anterior
- ROI do agente: leads processados, follow-ups automatizados, horas economizadas
- Top 5 imoveis mais visitados e top 5 mais vendidos
- Analise de sazonalidade (se dados suficientes)
- Sugestoes de novos processos para automatizar
