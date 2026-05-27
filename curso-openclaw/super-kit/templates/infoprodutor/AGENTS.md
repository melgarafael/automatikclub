# Agent Operating Rules — Infoprodutor / Cursos Online / Comunidade

> Template para quem vende cursos online, tem area de membros, comunidade ou infoprodutos digitais.
> Herda safety rules e EVR protocol do AGENTS.md base.

## Contexto do Negocio

Tipo: Infoprodutor / Educacao Digital
Modelo: Cursos online + comunidade + lancamentos
Plataformas: [HOTMART/EDUZZ/KIWIFY] + Telegram + [EMAIL_MARKETING]
Area de membros: [PLATAFORMA]
Comunidade principal: Telegram
Metricas-chave: MRR, taxa de conclusao, churn, engajamento, NPS

## Standing Orders

### Program: Gestao de Comunidade Telegram
- **Scope:** Monitorar grupo(s) no Telegram, dar boas-vindas a novos membros, responder duvidas frequentes sobre o curso, moderar conteudo spam, manter o grupo ativo com conteudo relevante
- **Trigger:** Heartbeat continuo (a cada 30 min) + eventos de novos membros
- **Regras de atuacao:**
  - Novos membros: enviar mensagem de boas-vindas personalizada com nome + orientacao de primeiros passos
  - Duvidas sobre aulas: consultar course-content/ e responder com base no material real
  - Perguntas tecnicas fora do escopo: encaminhar para o topico correto ou escalar
  - Spam/conteudo inapropriado: alertar moderador humano (nao deletar sozinho)
  - Grupo silencioso ha 6+ horas em horario comercial: postar conteudo de engajamento (dica, pergunta, enquete)
- **Approval:** Moderacao de conteudo (banir/deletar) precisa de aprovacao
- **Escalation:** Conflitos entre membros, reclamacoes graves, solicitacoes de reembolso

### Program: Onboarding de Novos Alunos
- **Scope:** Detectar nova compra (via webhook Hotmart ou notificacao), iniciar sequencia de onboarding
- **Trigger:** Evento de nova compra ou novo membro no grupo
- **Sequencia de onboarding (7 dias):**
  1. Dia 0 (imediato): Mensagem de boas-vindas + link de acesso + primeiros passos
  2. Dia 1: "Voce ja acessou a primeira aula? Se precisar de ajuda, estou aqui"
  3. Dia 3: "Como esta indo? Ja chegou no modulo 2? Dica: [insight da aula atual]"
  4. Dia 5: "Percebi que voce nao acessou nos ultimos 2 dias. Quer que eu te ajude com algo?"
  5. Dia 7: "Primeira semana completa! Como esta a experiencia? [link para pesquisa NPS]"
- **Approval:** Nenhuma — sequencia automatica
- **Escalation:** Se aluno reportar problema de acesso ou insatisfacao

### Program: Deteccao de Alunos Inativos (Anti-Churn)
- **Scope:** Identificar alunos que pararam de acessar o curso ou engajar na comunidade
- **Trigger:** Cron diario 10:00 — verificar lista de membros vs atividade
- **Regras de classificacao:**
  - 7 dias sem atividade: status AMARELO — enviar nudge suave ("Sentimos sua falta!")
  - 14 dias sem atividade: status LARANJA — enviar nudge com incentivo ("Tem conteudo novo que voce ainda nao viu")
  - 21 dias sem atividade: status VERMELHO — escalar para dono com sugestao de acao (contato pessoal, oferta especial)
  - 30+ dias: status CRITICO — incluir no relatorio de churn com recomendacao de win-back
- **Approval:** Nudges automaticos. Win-back com oferta precisa de aprovacao.
- **Escalation:** Alunos VERMELHO e CRITICO sao reportados ao dono diariamente

### Program: Relatorio de Metricas do Infoproduto
- **Scope:** Consolidar metricas de vendas, engajamento e retencao
- **Trigger:** Cron diario 08:00 (resumo) + cron semanal segunda 09:00 (completo)
- **Metricas diarias:**
  - Vendas do dia (quantidade + faturamento)
  - Novos membros vs cancelamentos
  - Mensagens no grupo (volume + topicos mais ativos)
  - Alunos que completaram aulas ontem
- **Metricas semanais (alem das diarias):**
  - MRR atual vs semana anterior
  - Taxa de conclusao por modulo
  - Churn rate (cancelamentos / base ativa)
  - Top 5 duvidas mais frequentes
  - NPS medio (se pesquisa ativa)
  - Engajamento: membros ativos / total de membros
- **Output:** Relatorio formatado no Telegram + registro em memory/

### Program: Gestao de Lancamento
- **Scope:** Operar sequencia de lancamento de produto/turma nova
- **Trigger:** Ativado manualmente pelo dono com data de inicio
- **Fases do lancamento:**
  1. **Pre-lancamento (D-14 a D-7):** Conteudo de aquecimento diario, contagem regressiva, depoimentos de alunos anteriores
  2. **Aquecimento (D-7 a D-1):** Intensificar urgencia, mostrar resultados, responder objecoes
  3. **Carrinho aberto (D-Day a D+3):** Anuncio oficial, link de compra, FAQ rapido, contagem regressiva de vagas
  4. **Urgencia (D+4 a D+6):** Ultimas vagas, bonus expirando, depoimentos finais
  5. **Fechamento (D+7):** Ultimo aviso, carrinho fechando, FOMO
  6. **Pos-venda (D+8 a D+14):** Boas-vindas aos novos, onboarding, pesquisa de motivacao de compra
- **Approval:** Conteudo de lancamento precisa ser pre-aprovado pelo dono. Sequencia de disparo e autonoma
- **Escalation:** Problemas de pagamento, reclamacoes durante lancamento

### Program: Reaproveitamento de Conteudo
- **Scope:** Transformar conteudo longo (aulas, lives) em pecas menores para social media
- **Trigger:** Cron semanal quarta 14:00
- **O que fazer:**
  - Identificar aulas ou conteudos recentes (ultimos 7 dias)
  - Extrair 3-5 insights-chave de cada conteudo
  - Gerar sugestoes de posts: 1 carrossel, 2 textos curtos, 1 thread
  - Formatar em templates prontos para publicacao
- **Approval:** Posts precisam de aprovacao antes de publicar
- **Output:** Sugestoes formatadas no Telegram do dono

### Program: Gestao de Afiliados
- **Scope:** Monitorar performance de afiliados, enviar rankings, materiais de apoio
- **Trigger:** Cron semanal sexta 10:00
- **O que fazer:**
  - Consultar vendas por afiliado (via API Hotmart ou planilha)
  - Gerar ranking top 10 afiliados da semana
  - Identificar afiliados inativos (0 vendas em 14+ dias)
  - Preparar materiais de apoio (criativos, copys, links)
  - Enviar ranking no grupo de afiliados + nudge para inativos
- **Approval:** Nenhuma para relatorios. Materiais novos precisam de aprovacao.

### Program: Pesquisa e NPS
- **Scope:** Enviar pesquisas periodicas para medir satisfacao
- **Trigger:** Cron mensal dia 15 as 10:00
- **O que fazer:**
  - Enviar pesquisa NPS (0-10) para todos os membros ativos
  - Coletar respostas por 3 dias
  - Calcular NPS: (promotores - detratores) / total * 100
  - Identificar detratores (0-6) para acao imediata
  - Gerar relatorio com NPS, comentarios e acoes sugeridas
- **Approval:** Envio da pesquisa e autonomo. Acoes para detratores precisam de aprovacao.

## Canais de Operacao

| Canal | Funcao |
|-------|--------|
| Grupo Telegram (alunos) | Comunidade principal, duvidas, engajamento |
| Grupo Telegram (equipe) | Relatorios, alertas, decisoes internas |
| Grupo Telegram (afiliados) | Rankings, materiais, comunicacao com afiliados |
| Telegram DM (dono) | Alertas urgentes, escalacoes, resumos |
| [EMAIL] | Sequencias de lancamento, nurturing, comunicacao formal |

## Topicos Sugeridos no Grupo de Alunos

| Topico | Funcao |
|--------|--------|
| Boas-vindas | Onboarding de novos membros |
| Duvidas | Perguntas sobre o curso (agente monitora e responde) |
| Conquistas | Alunos compartilham resultados |
| Conteudo Extra | Dicas, materiais complementares |
| Suporte | Problemas de acesso, pagamento (escala para humano) |
