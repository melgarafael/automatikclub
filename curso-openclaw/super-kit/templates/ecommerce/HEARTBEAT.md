# HEARTBEAT.md — E-Commerce Operations Schedule

> Schedule operacional completo do agente de e-commerce.
> Cada entry define: QUANDO, O QUE, e o PROGRAMA de referencia no AGENTS.md.

---

## Heartbeats (Monitoramento Continuo)

### A cada 30 minutos — Operacoes Criticas
```
Expressao: */30 * * * *
Timezone: America/Sao_Paulo
```

**Checklist de Execucao:**

1. **Estoque Critico**
   - Consultar planilha de estoque
   - Identificar produtos com `qty_atual <= estoque_minimo`
   - Se encontrar: executar Program "Monitoramento de Estoque"
   - Se tudo OK: silencioso (nao notificar)

2. **Novos Pedidos**
   - Consultar pedidos com status "Pendente"
   - Se encontrar: executar Program "Processamento de Pedidos"
   - Verificar pagamentos confirmados desde ultima checagem
   - Atualizar status e notificar equipe de logistica

3. **Pagamentos Pendentes**
   - Consultar pedidos aguardando pagamento
   - PIX pendente > 2h: enviar lembrete ao cliente
   - Boleto pendente > 3 dias: enviar lembrete ao cliente
   - Pagamento expirado: cancelar e devolver estoque

**Regra de Silencio:** Se tudo estiver normal, NAO enviar notificacao. Heartbeat silencioso = operacao saudavel. So notificar quando ha acao necessaria.

---

## Crons Diarios

### 08:00 — Relatorio de Vendas do Dia Anterior
```
Expressao: 0 8 * * *
Timezone: America/Sao_Paulo
Programa: Relatorio Diario de Vendas
```

**Execucao:**
1. Consultar vendas de ontem (00:00 a 23:59)
2. Calcular: faturamento, pedidos, ticket medio, top 5 produtos
3. Comparar com dia anterior e mesmo dia da semana passada
4. Detectar anomalias (queda >20%, pico >50%)
5. Enviar relatorio no Telegram grupo "Operacoes"

**Destinatario:** Telegram — grupo "Operacoes"

---

### 10:00 — Processamento de Cobranças
```
Expressao: 0 10 * * *
Timezone: America/Sao_Paulo
Programa: Cobranca de Inadimplentes
```

**Execucao:**
1. Consultar faturas/pedidos com pagamento atrasado
2. Classificar por tempo de atraso (1-3d, 4-7d, 8-14d, 15d+)
3. Enviar aviso correspondente ao estagio (1o, 2o, 3o aviso)
4. Cobranças > R$ 500: notificar gerente antes do 2o aviso
5. Atrasos > 15 dias: escalar para gerente com relatorio completo
6. Registrar envios no historico de cobranca

**Destinatario:** Clientes (via Telegram/email) + Telegram "Alertas" (escalacoes)

---

### 14:00 — Status de Entregas e Devoluções
```
Expressao: 0 14 * * *
Timezone: America/Sao_Paulo
```

**Execucao:**
1. Consultar pedidos com status "Enviado"
2. Verificar tracking de transportadora (se API disponivel)
3. Identificar entregas atrasadas (prazo excedido)
4. Consultar solicitacoes de devolucao pendentes
5. Gerar resumo de logistica do dia

**Output:**
```
🚚 STATUS LOGISTICA — [data] 14:00

Pedidos em transito: [qty]
Entregas previstas para hoje: [qty]
Entregas atrasadas: [qty] ⚠️
Devolucoes pendentes: [qty]

[Detalhes de itens atrasados, se houver]
```

**Destinatario:** Telegram — grupo "Operacoes"

---

### 17:00 — Fechamento do Dia
```
Expressao: 0 17 * * *
Timezone: America/Sao_Paulo
```

**Execucao:**
1. Consolidar vendas do dia ate o momento
2. Verificar estoque: quantos itens em nivel critico
3. Verificar pedidos: quantos pendentes, quantos processados
4. Listar pendencias que precisam de atencao amanha
5. Gerar resumo executivo de fechamento

**Output:**
```
📋 FECHAMENTO DO DIA — [data]

💰 Vendas ate agora: R$ [valor] ([qty] pedidos)
📦 Estoque critico: [qty] produtos
📋 Pedidos pendentes: [qty]
✅ Pedidos processados hoje: [qty]
💸 Cobranças enviadas: [qty] (R$ [valor total])

📌 Pendencias para amanha:
- [item 1]
- [item 2]
- [item 3]

Bom descanso! O agente continua monitorando. 🤖
```

**Destinatario:** Telegram — grupo "Operacoes"

---

## Crons Semanais

### Segunda-feira 09:00 — Relatorio Semanal
```
Expressao: 0 9 * * 1
Timezone: America/Sao_Paulo
```

**Execucao:**
1. Consolidar metricas da semana anterior (seg a dom)
2. Calcular:
   - Faturamento semanal + comparativo com semana anterior
   - Total de pedidos + ticket medio
   - Top 10 produtos (por faturamento e por quantidade)
   - Produtos com estoque critico
   - Status de inadimplencia (total, novos, recuperados)
   - Taxa de cancelamento da semana
3. Identificar tendencias (3 semanas consecutivas)
4. Gerar recomendacoes baseadas nos dados

**Output:**
```
📊 RELATORIO SEMANAL — Semana de [data_inicio] a [data_fim]

💰 VENDAS
Faturamento: R$ [valor] ([+/-X%] vs semana anterior)
Pedidos: [qty] | Ticket Medio: R$ [valor]
Melhor dia: [dia] (R$ [valor])
Pior dia: [dia] (R$ [valor])

🏆 TOP 10 PRODUTOS
1. [produto] — [qty] un. — R$ [valor]
...
10. [produto] — [qty] un. — R$ [valor]

📦 ESTOQUE
Produtos em nivel critico: [qty]
Pedidos de reposicao gerados: [qty] (R$ [valor])
Pedidos entregues pelo fornecedor: [qty]

💸 INADIMPLENCIA
Total em aberto: R$ [valor] ([qty] clientes)
Novos atrasos: [qty]
Recuperados na semana: [qty] (R$ [valor])

📈 TENDENCIAS
[Insight 1 baseado em dados de 3+ semanas]
[Insight 2]

🎯 RECOMENDACOES
[Recomendacao 1 com base nos dados]
[Recomendacao 2]
```

**Destinatario:** Telegram — grupo "Operacoes" + mensagem direta ao gerente

---

### Sexta-feira 17:00 — Auto-Melhoria Semanal
```
Expressao: 0 17 * * 5
Timezone: America/Sao_Paulo
```

**Execucao:**
1. Revisar log de execucoes da semana
2. Identificar:
   - Processos que falharam e por que
   - Escalacoes que poderiam ter sido evitadas
   - Padroes repetitivos (mesmos erros, mesmas perguntas)
   - Tempos de resposta acima do normal
3. Gerar relatorio de auto-avaliacao
4. Sugerir melhorias (novos guardrails, ajustes de threshold, otimizacoes)

**Output:**
```
🔄 AUTO-AVALIACAO SEMANAL — [data]

📊 EXECUCOES
Total de processos executados: [qty]
Taxa de sucesso: [X%]
Falhas: [qty] ([detalhes])

🚨 ESCALACOES
Total: [qty]
Evitaveis: [qty] — Motivo: [motivo]

🔁 PADROES DETECTADOS
[Padrao 1]: [descricao + sugestao de melhoria]
[Padrao 2]: [descricao + sugestao de melhoria]

💡 SUGESTOES DE MELHORIA
1. [Sugestao com justificativa baseada em dados]
2. [Sugestao com justificativa baseada em dados]

Status: Operacional ✅
```

**Destinatario:** Telegram — mensagem direta ao gerente

---

## Resumo Visual do Schedule

```
HORARIO    SEG    TER    QUA    QUI    SEX    SAB    DOM
-------    ---    ---    ---    ---    ---    ---    ---
*/30min    ♻️      ♻️      ♻️      ♻️      ♻️      ♻️      ♻️     Heartbeat (estoque/pedidos/pgto)
08:00      📊     📊     📊     📊     📊     📊     📊    Relatorio vendas
09:00      📋     —      —      —      —      —      —     Relatorio semanal
10:00      💸     💸     💸     💸     💸     —      —     Cobrancas (dias uteis)
14:00      🚚     🚚     🚚     🚚     🚚     —      —     Status logistica
17:00      📋     📋     📋     📋     🔄     —      —     Fechamento (sex: auto-melhoria)
```

**Legenda:**
- ♻️ Heartbeat continuo (silencioso se tudo OK)
- 📊 Relatorio de vendas
- 📋 Relatorio/fechamento
- 💸 Cobrancas
- 🚚 Logistica
- 🔄 Auto-avaliacao

---

## Configuracao de Alertas

| Condicao | Acao | Urgencia |
|----------|------|----------|
| Produto estoque zero | Notificacao imediata + pedido urgente | 🔴 Critica |
| Produto abaixo do minimo | Pedido de reposicao | 🟡 Alta |
| Pagamento confirmado | Atualizar + notificar logistica | 🟢 Normal |
| Pagamento expirado | Cancelar + devolver estoque | 🟡 Alta |
| Faturamento caiu >20% | Alerta ao gerente | 🟡 Alta |
| Faturamento caiu >50% | Alerta URGENTE ao gerente | 🔴 Critica |
| Entrega atrasada | Notificar gerente + cliente | 🟡 Alta |
| Fornecedor nao respondeu pedido | Alerta + tentar alternativo | 🟡 Alta |
| Processo falhou 3x seguidas | Escalar + desativar temporariamente | 🔴 Critica |
| API/gateway inacessivel | Alerta + retry em 15min | 🔴 Critica |
