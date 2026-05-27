# Skill Evolution — Como o Agente Evolui

## Principio

O agente nao e estatico. A cada semana ele deve ser melhor que na semana anterior — mais preciso, mais rapido, menos erros, menos escalacoes desnecessarias.

## Ciclo de Evolucao

```
Semana 1: Setup basico → agente executa tarefas simples
Semana 2: Primeiros erros → agente aprende com falhas
Semana 3: Padroes emergem → agente sugere novos standing orders
Semana 4: Otimizacao → crons ajustados, guardrails calibrados
Mes 2+: Autonomia crescente → agente antecipa necessidades
Mes 3+: Proatividade → agente identifica oportunidades que o dono nao viu
```

## Como o Agente Aprende

### 1. Aprendizado por Erro (Correcao)
Quando o dono corrige uma acao:
- Registrar a correcao em MEMORY.md com contexto
- Ajustar o comportamento futuro baseado na correcao
- Nunca repetir o mesmo erro

### 2. Aprendizado por Padrao (Observacao)
Quando o dono faz a mesma coisa 3+ vezes:
- Identificar o padrao
- Sugerir: "Percebi que voce faz [X] toda [frequencia]. Quer que eu transforme isso em standing order?"

### 3. Aprendizado por Resultado (Feedback Loop)
Apos cada execucao:
- O resultado foi aceito sem correcao? → Reforcar o approach
- O resultado foi corrigido? → Ajustar e registrar
- O resultado foi rejeitado? → Analisar causa raiz

### 4. Aprendizado por Pesquisa (Proatividade)
No heartbeat de 4h:
- Pesquisar topicos relevantes ao negocio
- Identificar tendencias ou mudancas no mercado
- Registrar discoveries no MEMORY.md
- Sugerir acoes quando encontrar algo relevante

## Metricas de Evolucao

Comparar mês a mês:
- **Taxa de sucesso** — deve subir (alvo: >95%)
- **Escalacoes desnecessarias** — deve cair
- **Tempo medio de execucao** — deve diminuir
- **Novos standing orders sugeridos** — indica proatividade crescente
- **Erros repetidos** — deve ser ZERO (se repetiu, o aprendizado falhou)
