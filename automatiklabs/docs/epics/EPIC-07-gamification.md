# Epic 07: Gamification

## Objetivo
Implementar sistema completo de gamificacao: XP engine com anti-gaming, ranking/leaderboard, niveis, 20+ badges, streaks, desafios com submissao e avaliacao, e notificacoes de conquistas.

## Dependencias
- EPIC-03: Auth & User System
- EPIC-04: Database Schema

## Stories

### Story 07.1: XP Engine — Core
**Complexidade:** L
**Tipo:** backend
**Descricao:** Implementar engine de XP que atribui pontos por acoes (completar aula, comentar, avaliar, contribuir marketplace, participar desafio). Anti-gaming: cooldown entre acoes repetidas, cap diario, detecao de padrao suspeito.
**Acceptance Criteria:**
- [ ] AC1: Given aluno completa aula When XP engine processa Then +10 XP e registrado em `xp_transactions` e `user_xp.total_xp` atualizado
- [ ] AC2: Given aluno tenta completar/descomplete 50 aulas em 1 minuto When engine detecta Then XP nao e dado (anti-gaming cooldown)
- [ ] AC3: Given aluno atingiu cap diario de 500 XP When tenta ganhar mais Then acoes sao registradas mas XP nao incrementa
- [ ] AC4: Given XP adicionado When total cruza threshold de nivel Then nivel e atualizado automaticamente
**Tasks:**
- [ ] Criar service `src/features/gamification/services/xp-engine.ts` com funcoes: `awardXP`, `checkAntiGaming`, `calculateLevel`
- [ ] Definir tabela de pontos: aula completa (10), comentario (5), avaliacao (3), marketplace item aprovado (50), desafio concluido (variavel)
- [ ] Implementar anti-gaming: cooldown 30s entre mesma acao, max 500 XP/dia, detecao de rapidez suspeita
- [ ] Criar Server Action `awardXP.ts` (chamada internamente por outras acoes)
- [ ] Criar trigger SQL: ao inserir xp_transaction, atualizar user_xp.total_xp e level
- [ ] Definir formula de niveis: level = floor(sqrt(total_xp / 100))
**Arquivos a criar/modificar:**
- `src/features/gamification/services/xp-engine.ts`
- `src/features/gamification/actions/award-xp.ts`
- `src/features/gamification/types.ts`
- `src/shared/utils/constants.ts` (XP values, level thresholds)

### Story 07.2: Badges System (20+ Badges)
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar sistema de badges com criterios automaticos. Minimo 20 badges definidos. Verificacao automatica apos cada acao relevante. Notificacao visual quando badge e desbloqueado.
**Acceptance Criteria:**
- [ ] AC1: Given aluno completa primeira aula When badge engine verifica Then badge "Primeiro Passo" e desbloqueado com notificacao toast
- [ ] AC2: Given aluno acumula 1000 XP When threshold e atingido Then badge "Estudioso" e desbloqueado
- [ ] AC3: Given aluno visita perfil When badges sao renderizados Then grid mostra badges conquistados (coloridos) e nao conquistados (cinza)
**Tasks:**
- [ ] Criar seed de 20+ badges com criterios:
  - Primeiro Passo (1 aula), Iniciante (5 aulas), Dedicado (25 aulas), Mestre (100 aulas)
  - Comentarista (10 comentarios), Avaliador (10 avaliacoes)
  - Contribuidor Bronze (1 item marketplace), Prata (5), Ouro (10)
  - Streak 7 dias, 30 dias, 100 dias
  - XP milestones: 100, 500, 1000, 5000, 10000
  - Primeiro Desafio, 5 Desafios, 10 Desafios
  - Social: Primeiro Post, 10 Posts, Primeiro Amigo
- [ ] Criar service `badge-engine.ts` com funcao `checkAndAwardBadges(userId, action)`
- [ ] Criar componente `BadgeGrid` (perfil), `BadgeCard` (individual), `BadgeUnlockToast`
- [ ] Criar Server Action `checkBadges.ts` (chamada internamente)
**Arquivos a criar/modificar:**
- `src/features/gamification/services/badge-engine.ts`
- `src/features/gamification/actions/check-badges.ts`
- `src/features/gamification/components/badge-grid.tsx`
- `src/features/gamification/components/badge-card.tsx`
- `src/features/gamification/components/badge-unlock-toast.tsx`
- `supabase/seed.sql` (adicionar badges)

### Story 07.3: Streaks
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar sistema de streaks: dias consecutivos com atividade. Streak incrementa ao completar qualquer aula num dia. Reset se um dia e pulado. Display visual com calendario.
**Acceptance Criteria:**
- [ ] AC1: Given aluno ativo ontem e hoje When streak e calculado Then current_streak = dias consecutivos
- [ ] AC2: Given aluno inativo ontem When streak e verificado hoje Then current_streak reseta para 1
- [ ] AC3: Given streak display When aluno ve o calendario Then dias ativos aparecem marcados com cor accent
**Tasks:**
- [ ] Criar logica de streak em `xp-engine.ts`: ao registrar atividade, verificar last_activity_date e incrementar/resetar
- [ ] Criar componente `StreakCounter` (numero + icone de fogo + "dias")
- [ ] Criar componente `StreakCalendar` (calendario visual dos ultimos 30 dias)
- [ ] Criar pg_cron job para verificar streaks a meia-noite e enviar notificacao "Nao perca seu streak!"
**Arquivos a criar/modificar:**
- `src/features/gamification/services/xp-engine.ts` (modificar)
- `src/features/gamification/components/streak-counter.tsx`
- `src/features/gamification/components/streak-calendar.tsx`

### Story 07.4: Ranking / Leaderboard
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/ranking` com leaderboard: semanal, mensal, all-time. Podium top 3, destaque do usuario logado, filtro por trilha.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/ranking` When leaderboard carrega Then top 3 aparecem em podium destaque e restante em tabela
- [ ] AC2: Given filtro "Semanal" When aplicado Then ranking mostra apenas XP da semana atual
- [ ] AC3: Given usuario logado When leaderboard renderiza Then sua posicao e highlighted mesmo se nao esta no top 10 visivel
**Tasks:**
- [ ] Criar pagina `/ranking/page.tsx`
- [ ] Criar componentes: `LeaderboardTable`, `PodiumTop3`, `TimeFilter`, `MyPositionHighlight`
- [ ] Usar materialized views criadas no EPIC-04 (leaderboard_weekly, monthly, alltime)
- [ ] Criar Server Action `getLeaderboard.ts` (query materialized view)
**Arquivos a criar/modificar:**
- `src/app/(platform)/ranking/page.tsx`
- `src/features/gamification/actions/get-leaderboard.ts`
- `src/features/gamification/components/leaderboard-table.tsx`
- `src/features/gamification/components/podium-top3.tsx`
- `src/features/gamification/components/time-filter.tsx`
- `src/features/gamification/components/my-position-highlight.tsx`

### Story 07.5: Desafios
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar area de desafios em `/desafios`: listagem de desafios ativos/encerrados, detalhes com criterios, submissao de resposta, e historico.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/desafios` When filtro "Ativos" When desafios abertos aparecem com prazo e XP reward
- [ ] AC2: Given aluno clica em desafio When detalhes abrem Then ve criterios completos e form de submissao
- [ ] AC3: Given aluno submete resposta When prazo nao expirou Then submissao e registrada com status "pendente"
- [ ] AC4: Given desafio com tier `pro` When aluno free acessa Then ve paywall
**Tasks:**
- [ ] Criar pagina `/desafios/page.tsx`
- [ ] Criar componentes: `ChallengeGrid`, `ChallengeCard`, `ChallengeDetail` (modal/drawer), `SubmissionForm`, `MySubmissionsList`
- [ ] Criar Server Actions: `getChallenges.ts`, `submitChallenge.ts`, `getMySubmissions.ts`
- [ ] Integrar TierGate para desafios com tier_required
**Arquivos a criar/modificar:**
- `src/app/(platform)/desafios/page.tsx`
- `src/features/gamification/actions/get-challenges.ts`
- `src/features/gamification/actions/submit-challenge.ts`
- `src/features/gamification/actions/get-my-submissions.ts`
- `src/features/gamification/components/challenge-grid.tsx`
- `src/features/gamification/components/challenge-card.tsx`
- `src/features/gamification/components/challenge-detail.tsx`
- `src/features/gamification/components/submission-form.tsx`
- `src/features/gamification/components/my-submissions-list.tsx`

### Story 07.6: Historico de Pontos
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/perfil/pontos` com timeline cronologica de ganhos de XP, grafico de evolucao, e breakdown por fonte.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/perfil/pontos` When timeline carrega Then mostra lista cronologica com icone, descricao, e quantidade de XP
- [ ] AC2: Given grafico de evolucao When renderizado Then mostra curva de XP acumulado ao longo do tempo
- [ ] AC3: Given breakdown por fonte When renderizado Then donut chart mostra % por tipo (aulas, comentarios, desafios, etc.)
**Tasks:**
- [ ] Criar pagina `/perfil/pontos/page.tsx`
- [ ] Criar componentes: `PointsTimeline`, `PointsChart` (line chart), `SourceBreakdown` (donut)
- [ ] Criar Server Action `getPointsHistory.ts` (xp_transactions paginated)
- [ ] Usar biblioteca de charts (recharts ou similar)
**Arquivos a criar/modificar:**
- `src/app/(platform)/perfil/pontos/page.tsx`
- `src/features/gamification/actions/get-points-history.ts`
- `src/features/gamification/components/points-timeline.tsx`
- `src/features/gamification/components/points-chart.tsx`
- `src/features/gamification/components/source-breakdown.tsx`
