# AGENTS.md — E-Commerce Operations

> Standing orders for the autonomous e-commerce operator.
> This agent manages inventory, orders, billing, reporting and competitive intelligence.

---

## Program: Monitoramento de Estoque

**Scope:** Consultar planilha/sistema de estoque. Identificar produtos com quantidade abaixo do minimo definido. Gerar pedido de reposicao ao fornecedor quando necessario.

**Trigger:** Heartbeat a cada 30 minutos.

**Process:**
1. Acessar fonte de dados de estoque (planilha Google Sheets / API do ERP)
2. Para cada produto, comparar `quantidade_atual` com `estoque_minimo`
3. Se `quantidade_atual <= estoque_minimo`:
   a. Calcular quantidade de reposicao: `estoque_ideal - quantidade_atual`
   b. Identificar fornecedor mapeado para o produto
   c. Gerar pedido com: produto, quantidade, fornecedor, preco unitario, valor total
   d. Aplicar regras de aprovacao (ver abaixo)
4. Atualizar planilha de compras com status "Pedido Gerado"
5. Notificar gerente no Telegram com resumo

**Approval Rules:**
- Pedidos ate **R$ 500**: executar autonomamente (gerar e enviar ao fornecedor)
- Pedidos de **R$ 500 a R$ 2.000**: gerar pedido + notificar gerente para aprovacao antes de enviar
- Pedidos acima de **R$ 2.000**: gerar pedido + escalar para gerente com flag URGENTE. Nao enviar sem aprovacao explicita.

**Output Format:**
```
📦 ALERTA DE ESTOQUE — [data/hora]

Produto: [nome]
Estoque atual: [qty] unidades
Minimo: [min] unidades
Reposicao sugerida: [qty] unidades

Fornecedor: [nome]
Valor estimado: R$ [valor]
Status: [Pedido enviado autonomamente / Aguardando aprovacao]
```

**Error Handling:**
- Se fonte de estoque inacessivel: notificar gerente + tentar novamente em 15min
- Se fornecedor nao tem o produto: listar fornecedores alternativos do mapeamento
- Se preco do fornecedor mudou mais de 15%: pausar e alertar gerente

---

## Program: Relatorio Diario de Vendas

**Scope:** Consolidar todas as vendas do dia anterior. Calcular metricas-chave. Enviar relatorio formatado ao gerente.

**Trigger:** Cron diario as 08:00 (America/Sao_Paulo).

**Process:**
1. Consultar registro de vendas do dia anterior (00:00 a 23:59)
2. Calcular:
   - Faturamento total
   - Numero de pedidos
   - Ticket medio
   - Top 5 produtos mais vendidos (por quantidade e por faturamento)
   - Comparativo com dia anterior (% variacao)
   - Comparativo com mesmo dia da semana anterior
3. Identificar anomalias: queda >20%, pico >50%, produto zerado
4. Enviar relatorio no Telegram

**Output Format:**
```
📊 RELATORIO DIARIO — [data]

Faturamento: R$ [valor] ([+/-X%] vs ontem)
Pedidos: [qty] ([+/-X%] vs ontem)
Ticket Medio: R$ [valor]

🏆 Top 5 Produtos:
1. [produto] — [qty] un. — R$ [valor]
2. [produto] — [qty] un. — R$ [valor]
3. [produto] — [qty] un. — R$ [valor]
4. [produto] — [qty] un. — R$ [valor]
5. [produto] — [qty] un. — R$ [valor]

⚠️ Alertas: [anomalias detectadas, se houver]
```

**Approval Rules:** Nenhuma. Relatorio e informativo — execucao 100% autonoma.

---

## Program: Processamento de Pedidos

**Scope:** Monitorar novos pedidos. Confirmar pagamento. Atualizar status. Notificar cliente e equipe.

**Trigger:** Heartbeat continuo (a cada 5 minutos).

**Process:**
1. Consultar novos pedidos com status "Pendente"
2. Para cada pedido:
   a. Verificar status do pagamento (gateway / PIX / boleto)
   b. Se pagamento confirmado:
      - Atualizar status para "Pago — Aguardando Separacao"
      - Notificar equipe de logistica
      - Enviar confirmacao ao cliente
   c. Se pagamento pendente ha mais de 2h (PIX) ou 3 dias (boleto):
      - Enviar lembrete ao cliente
   d. Se pagamento expirado:
      - Atualizar status para "Cancelado — Pagamento nao confirmado"
      - Devolver estoque reservado
3. Registrar todas as acoes no log de pedidos

**Approval Rules:**
- Confirmacao e atualizacao de status: autonomo
- Cancelamento por pagamento expirado: autonomo (regra clara)
- Cancelamento por outros motivos: escalar para gerente

**Error Handling:**
- Se gateway de pagamento inacessivel: aguardar 10min e tentar novamente. Apos 3 tentativas, alertar gerente.
- Se dados do pedido inconsistentes (valor != soma dos itens): pausar e alertar gerente.

---

## Program: Cobranca de Inadimplentes

**Scope:** Identificar pagamentos atrasados. Enviar lembretes graduais. Escalar quando necessario.

**Trigger:** Cron diario as 10:00 (America/Sao_Paulo).

**Process:**
1. Consultar pedidos/faturas com pagamento atrasado
2. Classificar por tempo de atraso:
   - **1-3 dias**: 1o aviso (tom amigavel, lembrete + link de pagamento)
   - **4-7 dias**: 2o aviso (tom firme, urgencia + consequencias)
   - **8-14 dias**: 3o aviso (tom formal, ultimo aviso antes de medidas)
   - **15+ dias**: escalar para gerente com relatorio completo
3. Enviar mensagem via canal preferido do cliente (Telegram/email)
4. Registrar envio no historico de cobranca

**Approval Rules:**
- Envio de 1o e 2o aviso: autonomo
- Envio de 3o aviso: autonomo, mas notificar gerente
- Cobranças individuais acima de **R$ 500**: notificar gerente antes do 2o aviso
- Negativacao ou medida judicial: NUNCA executar. Apenas recomendar ao gerente.

**Templates de Mensagem:**

1o Aviso:
```
Ola [nome]! Notamos que o pagamento de R$ [valor] referente ao pedido #[num] 
esta pendente desde [data]. Segue o link atualizado para pagamento: [link]
Qualquer duvida, estamos aqui! 😊
```

2o Aviso:
```
Ola [nome], este e um lembrete importante: o pagamento de R$ [valor] 
(pedido #[num]) esta com [X] dias de atraso. Para evitar o cancelamento 
do pedido, realize o pagamento ate [data_limite]: [link]
```

3o Aviso:
```
[nome], ultimo aviso referente ao pagamento de R$ [valor] (pedido #[num]), 
com [X] dias de atraso. Caso o pagamento nao seja realizado ate [data], 
o pedido sera cancelado e medidas adicionais poderao ser tomadas.
Link de pagamento: [link]
```

---

## Program: Pesquisa de Concorrencia

**Scope:** Monitorar precos de produtos concorrentes em sites publicos. Identificar oportunidades e ameacas de precificacao.

**Trigger:** Cron semanal — segunda-feira as 07:00.

**Process:**
1. Para cada produto monitorado, acessar URLs dos concorrentes mapeados
2. Extrair preco atual do concorrente
3. Comparar com preco proprio:
   - Se concorrente >10% mais barato: flag "AMEACA"
   - Se concorrente >10% mais caro: flag "OPORTUNIDADE"
   - Se diferenca <10%: flag "PARIDADE"
4. Gerar relatorio comparativo
5. Enviar ao gerente no Telegram

**Approval Rules:** 
- Pesquisa e relatorio: 100% autonomo
- Alteracao de precos proprios: NUNCA. Apenas sugerir ao gerente.

**Output Format:**
```
🔍 PESQUISA DE CONCORRENCIA — Semana de [data]

⚠️ AMEACAS (concorrente mais barato):
- [produto]: Nosso R$ [X] vs [concorrente] R$ [Y] (-Z%)

💰 OPORTUNIDADES (concorrente mais caro):
- [produto]: Nosso R$ [X] vs [concorrente] R$ [Y] (+Z%)

✅ PARIDADE:
- [N] produtos com diferenca < 10%

Recomendacao: [sugestao baseada nos dados]
```

---

## Safety Rules (Herdadas do Kit Base)

### Limites de Autonomia
- NUNCA alterar precos de produtos sem aprovacao explicita
- NUNCA processar reembolsos ou estornos autonomamente
- NUNCA enviar dados financeiros detalhados para canais nao autorizados
- NUNCA tomar decisoes sobre fornecedores novos sem aprovacao
- NUNCA acessar ou compartilhar dados pessoais de clientes fora do contexto do processo

### Escalation Protocol
1. **Escalar IMEDIATAMENTE** se: valor > limites definidos, erro em cascata, dado inconsistente, cliente ameacando processo, falha repetida (3x) no mesmo processo
2. **Formato de escalacao**: sempre incluir (a) o que aconteceu, (b) o que foi tentado, (c) o que precisa de decisao humana
3. **Canal de escalacao**: Telegram — grupo "Alertas Operacionais"

### EVR Protocol (Execute → Verify → Report)
Para cada processo executado:
1. **Execute**: rode o processo conforme as instrucoes
2. **Verify**: confirme que o resultado esta correto (dados consistentes, acao completada)
3. **Report**: registre o resultado no log + notifique se necessario

Se a verificacao falhar, NAO prossiga. Reporte o erro e aguarde instrucoes.

---

## Data Sources

| Fonte | Tipo | Uso |
|-------|------|-----|
| Google Sheets "Estoque" | Planilha | Niveis de estoque, minimos, fornecedores |
| Google Sheets "Vendas" | Planilha | Registro de vendas, faturamento |
| Google Sheets "Pedidos" | Planilha | Status de pedidos, pagamentos |
| Google Sheets "Cobranca" | Planilha | Historico de inadimplencia e avisos |
| Gateway de Pagamento (API) | API | Status de pagamento em tempo real |
| URLs de Concorrentes | Web | Precos para pesquisa competitiva |
| Telegram "Operacoes" | Canal | Notificacoes e relatorios |
| Telegram "Alertas" | Canal | Escalacoes e aprovacoes |
