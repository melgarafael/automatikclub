# HEARTBEAT.md — Clínica

> Checklist periódico do agente. Executado automaticamente conforme schedule definido.
> Responda HEARTBEAT_OK se nada precisa de atenção. Caso contrário, reporte os alertas.

---

tasks:

- name: agenda-monitor
  interval: 30m
  prompt: |
    Verificação de agenda em tempo real:
    1. Consultar agenda do dia atual
    2. Identificar horários vagos nas próximas 4 horas
    3. Verificar se há confirmações pendentes (pacientes que não responderam)
    4. Detectar conflitos ou sobreposições de horário
    5. Se houver mais de 2 slots vagos consecutivos, verificar lista de espera
    Se tudo normal, responda HEARTBEAT_OK.
    Se houver alertas, reporte de forma concisa.

- name: confirmacoes-dia
  interval: 24h
  prompt: |
    Rotina de confirmação de consultas (execução às 07:00):
    1. Listar todas as consultas agendadas para HOJE
    2. Verificar quais pacientes já confirmaram
    3. Para pacientes que NÃO confirmaram: enviar mensagem de confirmação via Telegram
    4. Registrar envio no log
    5. Reportar: [N] consultas hoje, [N] confirmadas, [N] pendentes de confirmação

- name: briefing-matinal
  interval: 24h
  prompt: |
    Briefing matinal para o administrador (execução às 08:00):
    Compilar e enviar resumo:
    - Total de consultas agendadas hoje (por profissional)
    - Taxa de ocupação do dia (%)
    - Confirmações: [N] confirmadas / [N] pendentes / [N] sem resposta
    - Alertas: profissional ausente, sala indisponível, conflitos
    - Retornos pendentes que vencem esta semana
    Entregar via Telegram ao administrador.

- name: lembrete-pre-consulta
  interval: 15m
  prompt: |
    Verificar consultas nas próximas 2 horas:
    1. Identificar consultas que ocorrem em 1h50 a 2h10 (janela de envio)
    2. Para cada uma, verificar se lembrete já foi enviado (evitar duplicata)
    3. Se não foi enviado:
       a. Buscar instruções pré-consulta cadastradas (jejum, documentos, preparo)
       b. Enviar lembrete personalizado via Telegram
       c. Registrar envio
    Se nenhum lembrete pendente, responda HEARTBEAT_OK.

- name: fechamento-diario
  interval: 24h
  prompt: |
    Fechamento do dia (execução às 18:00):
    Compilar relatório diário:
    1. Consultas realizadas vs agendadas
    2. Taxa de ocupação (%)
    3. No-shows (quantidade e %)
    4. Cancelamentos do dia
    5. Receita estimada do dia (consultas × valor médio)
    6. Comparar com média dos últimos 30 dias
    Salvar em Reports/daily/YYYY-MM-DD.md
    Enviar resumo ao administrador via Telegram.
    Alertar se: no-show > 20%, ocupação < 50%, ou anomalia detectada.

- name: relatorio-semanal
  interval: 168h
  prompt: |
    Relatório semanal (execução segunda às 09:00):
    Compilar métricas da semana anterior:
    1. Taxa de ocupação média (por dia e por profissional)
    2. Taxa de no-show média e tendência (subindo/caindo/estável)
    3. Receita estimada total da semana
    4. Pacientes atendidos (total e por profissional)
    5. Retornos agendados vs retornos pendentes
    6. Top 3 horários mais vagos (oportunidade de otimização)
    7. Comparar com semana anterior e média do mês
    Salvar em Reports/weekly/YYYY-WXX.md
    Enviar ao administrador via Telegram com destaques.

- name: auto-melhoria
  interval: 168h
  prompt: |
    Revisão de auto-melhoria (execução sexta às 17:00):
    1. Revisar logs da semana em Agent/Logs/
    2. Identificar:
       - Mensagens que não foram entregues ou tiveram erro
       - Pacientes que reclamaram ou reportaram problema
       - Processos que falharam e precisaram de intervenção manual
       - Horários em que o heartbeat detectou problemas recorrentes
    3. Para cada problema identificado:
       - Causa raiz (configuração? timing? dados incompletos?)
       - Sugestão de correção (nova regra, ajuste de horário, template melhor)
    4. Salvar em Agent/Improvements/YYYY-MM-DD.md
    5. Reportar top 3 melhorias sugeridas ao administrador

---

# Regras gerais do heartbeat

- Mantenha alertas curtos e acionáveis (máx 3 linhas por alerta)
- Não repita alertas já reportados na mesma sessão
- Se todos os checks passarem sem alertas, responda apenas HEARTBEAT_OK
- Nunca envie mensagens a pacientes fora do horário 07:00–20:00
- Se um task falhar, registre o erro e tente novamente no próximo ciclo
- Após 2 falhas consecutivas no mesmo task, escale para o administrador
