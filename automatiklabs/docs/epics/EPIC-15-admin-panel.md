# Epic 15: Admin Panel

## Objetivo
Implementar painel administrativo completo: dashboard com metricas, CRUD de aulas/cursos/trilhas/modulos, gestao de usuarios, e consolidacao de todas as filas de moderacao. O admin panel e a "nave mae" que conecta todos os dominios.

## Dependencias
- EPIC-03, 04, 05, 06, 07, 08, 09, 10, 11, 13, 14 (todas as features que geram conteudo moderavel)

## Stories

### Story 15.1: Dashboard Admin — Metricas
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar dashboard em `/admin` com metricas agregadas: total de usuarios, MAU, MRR (Stripe), churn rate, graficos de crescimento, top cursos, atividade recente, e widget de pendencias (items aguardando aprovacao em todas as filas).
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa `/admin` When dashboard carrega Then cards de metricas (usuarios, MAU, MRR, churn) mostram dados reais
- [ ] AC2: Given grafico de crescimento When renderizado Then mostra linha de usuarios ao longo dos ultimos 30 dias
- [ ] AC3: Given pending widget When renderizado Then mostra contagem de items pendentes por tipo (comentarios, marketplace, aulas, posts IA)
- [ ] AC4: Given pending widget When admin clica em contagem Then navega para fila de moderacao respectiva
**Tasks:**
- [ ] Criar pagina `/admin/page.tsx` (dashboard)
- [ ] Criar componentes: `MetricsGrid`, `GrowthChart`, `TopCoursesTable`, `RecentActivityFeed`, `PendingActionsWidget`
- [ ] Criar Server Action `getAdminMetrics.ts` (aggregated queries)
- [ ] Integrar Stripe API para MRR e churn
- [ ] Usar recharts para graficos
**Arquivos a criar/modificar:**
- `src/app/admin/page.tsx`
- `src/features/admin/actions/get-admin-metrics.ts`
- `src/features/admin/components/metrics-grid.tsx`
- `src/features/admin/components/growth-chart.tsx`
- `src/features/admin/components/top-courses-table.tsx`
- `src/features/admin/components/recent-activity-feed.tsx`
- `src/features/admin/components/pending-actions-widget.tsx`

### Story 15.2: CRUD Completo de Aulas/Cursos/Trilhas/Modulos
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar CRUD completo para todo o conteudo do learning engine: trilhas, cursos, modulos, e aulas. Cada nivel com listagem, form, reordenacao drag-and-drop, e publicacao.
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa `/admin/aulas` When pagina carrega Then tabela com todas as aulas, filtros por curso/modulo, e busca
- [ ] AC2: Given admin cria aula When preenche form (titulo, descricao, video URL/upload, markdown, modulo) Then aula e criada
- [ ] AC3: Given admin reordena aulas When drag-and-drop Then posicoes sao atualizadas no banco
- [ ] AC4: Given admin toggle "Publicar" When acao executa Then aula muda de draft para published (ou vice-versa)
**Tasks:**
- [ ] Criar paginas: `/admin/trilhas/page.tsx`, `/admin/cursos/page.tsx`, `/admin/modulos/page.tsx`, `/admin/aulas/page.tsx`
- [ ] Criar paginas de form: `/admin/aulas/nova/page.tsx`, `/admin/aulas/[id]/editar/page.tsx` (similar para trilhas, cursos, modulos)
- [ ] Criar componentes: `ContentTable` (generica com sort/filter), `LessonForm`, `CourseForm`, `TrackForm`, `ModuleForm`, `DragDropReorder`
- [ ] Criar Server Actions: CRUD para cada entidade (createTrack, updateTrack, deleteTrack, etc.)
- [ ] Implementar reordenacao com drag-and-drop (@dnd-kit)
**Arquivos a criar/modificar:**
- `src/app/admin/trilhas/page.tsx`
- `src/app/admin/cursos/page.tsx`
- `src/app/admin/modulos/page.tsx`
- `src/app/admin/aulas/page.tsx`
- `src/app/admin/aulas/nova/page.tsx`
- `src/app/admin/aulas/[id]/editar/page.tsx`
- `src/features/admin/actions/crud-tracks.ts`
- `src/features/admin/actions/crud-courses.ts`
- `src/features/admin/actions/crud-modules.ts`
- `src/features/admin/actions/crud-lessons.ts`
- `src/features/admin/components/content-table.tsx`
- `src/features/admin/components/lesson-form.tsx`
- `src/features/admin/components/course-form.tsx`
- `src/features/admin/components/track-form.tsx`
- `src/features/admin/components/module-form.tsx`
- `src/features/admin/components/drag-drop-reorder.tsx`

### Story 15.3: Gerenciamento de Usuarios (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/admin/usuarios` com tabela de usuarios, busca, filtros (role, tier, status), drawer com detalhes, e acoes (alterar role, alterar tier, banir, convidar).
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa `/admin/usuarios` When pagina carrega Then tabela paginada com todos os usuarios aparece
- [ ] AC2: Given admin busca "rafael" When resultado aparece Then usuarios com "rafael" no nome/email sao filtrados
- [ ] AC3: Given admin altera role de usuario para moderador When acao executa Then role e atualizado no banco e JWT claims
- [ ] AC4: Given admin bane usuario When acao executa Then usuario nao consegue mais logar
**Tasks:**
- [ ] Criar pagina `/admin/usuarios/page.tsx`
- [ ] Criar componentes: `UserTable`, `UserDetailDrawer`, `RoleSelector`, `TierSelector`, `BanButton`, `InviteForm`
- [ ] Criar Server Actions: `getUsers.ts`, `updateUserRole.ts`, `updateUserTier.ts`, `banUser.ts`, `inviteUser.ts`
- [ ] Usar Supabase Admin client para operacoes privilegiadas
**Arquivos a criar/modificar:**
- `src/app/admin/usuarios/page.tsx`
- `src/features/admin/actions/get-users.ts`
- `src/features/admin/actions/update-user-tier.ts`
- `src/features/admin/actions/ban-user.ts`
- `src/features/admin/actions/invite-user.ts`
- `src/features/admin/components/user-table.tsx`
- `src/features/admin/components/user-detail-drawer.tsx`
- `src/features/admin/components/role-selector.tsx`
- `src/features/admin/components/tier-selector.tsx`
- `src/features/admin/components/ban-button.tsx`
- `src/features/admin/components/invite-form.tsx`

### Story 15.4: Admin Sidebar e Layout
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar layout dedicado do admin com sidebar propria (Dashboard, Aulas, Cursos, Trilhas, Modulos, Usuarios, Comentarios, Marketplace, Feed IA, Aulas Contribuidores, Desafios, Canais, Livros, Newsletter, Assinaturas). Distinta do layout da plataforma.
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa qualquer pagina `/admin/*` When layout renderiza Then sidebar admin aparece com todos os links
- [ ] AC2: Given pagina ativa `/admin/usuarios` When sidebar renderiza Then item "Usuarios" esta highlighted
- [ ] AC3: Given breadcrumb When admin navega Then mostra caminho completo (Admin > Aulas > Editar > [titulo])
**Tasks:**
- [ ] Criar `src/app/admin/layout.tsx` com AdminSidebar + AdminHeader
- [ ] Criar componente `AdminSidebar` (lista de links agrupados por categoria)
- [ ] Criar componente `AdminHeader` (breadcrumb + search + user menu)
- [ ] Criar componente `AdminBreadcrumb`
**Arquivos a criar/modificar:**
- `src/app/admin/layout.tsx`
- `src/features/admin/components/admin-sidebar.tsx`
- `src/features/admin/components/admin-header.tsx`
- `src/features/admin/components/admin-breadcrumb.tsx`

### Story 15.5: CRUD Desafios (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar CRUD de desafios em `/admin/desafios`: criar, editar, deletar, ver submissoes, selecionar vencedores, e atribuir XP.
**Acceptance Criteria:**
- [ ] AC1: Given admin cria desafio When form e preenchido Then desafio e publicado com status "aberto"
- [ ] AC2: Given admin ve submissoes When lista carrega Then todas as submissoes do desafio aparecem com info do aluno
- [ ] AC3: Given admin seleciona vencedor When XP e atribuido Then XP reward vai para o aluno selecionado
**Tasks:**
- [ ] Criar paginas: `/admin/desafios/page.tsx`, `/admin/desafios/novo/page.tsx`, `/admin/desafios/[id]/editar/page.tsx`
- [ ] Criar componentes: `ChallengeTable`, `ChallengeForm`, `SubmissionsTable`, `WinnerSelector`
- [ ] Criar Server Actions: `createChallenge.ts`, `updateChallenge.ts`, `deleteChallenge.ts`, `selectWinner.ts`
**Arquivos a criar/modificar:**
- `src/app/admin/desafios/page.tsx`
- `src/app/admin/desafios/novo/page.tsx`
- `src/app/admin/desafios/[id]/editar/page.tsx`
- `src/features/admin/actions/create-challenge.ts`
- `src/features/admin/actions/update-challenge.ts`
- `src/features/admin/actions/delete-challenge.ts`
- `src/features/admin/actions/select-winner.ts`
- `src/features/admin/components/challenge-table.tsx`
- `src/features/admin/components/challenge-form.tsx`
- `src/features/admin/components/submissions-table.tsx`
- `src/features/admin/components/winner-selector.tsx`

### Story 15.6: CRUD Canais e Abas (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar CRUD de canais da comunidade em `/admin/canais`: criar, editar, deletar canais e gerenciar abas (adicionar, remover, reordenar).
**Acceptance Criteria:**
- [ ] AC1: Given admin cria canal When form e preenchido Then canal aparece na sidebar da comunidade
- [ ] AC2: Given admin adiciona aba "Recursos" When configurada Then aba aparece no canal
- [ ] AC3: Given admin define tier "pro" no canal When aluno free acessa Then paywall aparece
**Tasks:**
- [ ] Criar paginas: `/admin/canais/page.tsx`, `/admin/canais/novo/page.tsx`, `/admin/canais/[id]/editar/page.tsx`
- [ ] Criar componentes: `ChannelTable`, `ChannelForm`, `TabManager`
- [ ] Criar Server Actions: `createChannel.ts`, `updateChannel.ts`, `deleteChannel.ts`, `manageTabs.ts`
**Arquivos a criar/modificar:**
- `src/app/admin/canais/page.tsx`
- `src/app/admin/canais/novo/page.tsx`
- `src/app/admin/canais/[id]/editar/page.tsx`
- `src/features/admin/actions/create-channel.ts`
- `src/features/admin/actions/update-channel.ts`
- `src/features/admin/actions/delete-channel.ts`
- `src/features/admin/actions/manage-tabs.ts`
- `src/features/admin/components/channel-table.tsx`
- `src/features/admin/components/channel-form.tsx`
- `src/features/admin/components/tab-manager.tsx`

### Story 15.7: Configuracao de Assinaturas (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/admin/assinaturas` para configurar tiers (free, pro, premium): features por tier, precos, Stripe price IDs, e matriz visual de features.
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa `/admin/assinaturas` When pagina carrega Then configuracao atual dos 3 tiers aparece
- [ ] AC2: Given admin edita features do tier pro When salva Then features sao atualizadas no banco e refletidas no middleware
- [ ] AC3: Given admin clica "Sincronizar com Stripe" When acao executa Then verifica se price IDs estao validos no Stripe
**Tasks:**
- [ ] Criar pagina `/admin/assinaturas/page.tsx`
- [ ] Criar componentes: `TierConfigTable`, `TierForm`, `FeatureMatrix`, `StripeSyncButton`
- [ ] Criar Server Actions: `getTierConfig.ts`, `updateTierConfig.ts`, `syncStripe.ts`
**Arquivos a criar/modificar:**
- `src/app/admin/assinaturas/page.tsx`
- `src/features/admin/actions/get-tier-config.ts`
- `src/features/admin/actions/update-tier-config.ts`
- `src/features/admin/actions/sync-stripe.ts`
- `src/features/admin/components/tier-config-table.tsx`
- `src/features/admin/components/tier-form.tsx`
- `src/features/admin/components/feature-matrix.tsx`
- `src/features/admin/components/stripe-sync-button.tsx`
