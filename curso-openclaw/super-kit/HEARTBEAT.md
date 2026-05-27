# Heartbeat Schedule — AutomatikLabs Super Kit

## Monitoramento Continuo (a cada 30 minutos)

- Verificar se ha tasks pendentes no QUEUE.md
- Confirmar que integracoes principais estao respondendo
- Atualizar SESSION-STATE.md com contexto de trabalho atual
- Se alguma anomalia, registrar em memory/ e alertar se critica

## Tarefas Diarias

### 08:00 — Briefing Matinal
- Consultar fontes de dados do negocio (planilhas, CRM, APIs)
- Calcular metricas do dia anterior vs meta
- Listar compromissos e deadlines do dia
- Enviar resumo formatado no canal principal do Telegram
- Formato: numeros chave em bullets + 1 paragrafo de contexto

### 10:00 — Processamento de Rotinas
- Executar standing orders agendados para este horario
- Verificar filas de tarefas pendentes
- Processar itens em QUEUE.md que estao em "Ready"
- Registrar execucoes no log diario em memory/

### 14:00 — Check de Meio-Dia
- Status rapido: processos iniciados de manha estao OK?
- Alguma tarefa travou ou falhou? Se sim, tentar novamente
- Alertas pendentes que precisam atencao?

### 17:00 — Fechamento do Dia
- Resumo de tudo que foi executado hoje
- Tasks concluidas vs pendentes
- Metricas do dia (se disponiveis)
- Alertas ou excecoes encontradas
- Preparar agenda do dia seguinte

## Tarefas Semanais

### Segunda 09:00 — Relatorio Semanal
- Comparativo semana atual vs semana anterior
- KPIs definidos em USER.md
- Destaques positivos e pontos de atencao
- Tendencias identificadas
- Sugestoes de acao baseadas nos dados

### Quarta 14:00 — Manutencao de Integracoes
- Testar todas as conexoes ativas (APIs, planilhas, canais)
- Verificar se credenciais estao validas
- Reportar qualquer integracao com problemas

### Sexta 17:00 — Auto-Melhoria Semanal
- Ler e executar self-improvement/SELF-IMPROVE.md
- Revisar logs episodicos da semana (memory/)
- Curar MEMORY.md: extrair insights, remover obsoletos
- Avaliar standing orders: algum precisa ajuste?
- Otimizar crons: algum gerando output vazio?
- Gerar relatorio de evolucao do agente

## Tarefas Mensais

### Dia 1 — Relatorio Mensal
- Consolidacao de metricas do mes
- Comparativo mes vs mes anterior
- ROI do agente: horas economizadas, processos executados, erros evitados
- Sugestoes de novos processos para automatizar
