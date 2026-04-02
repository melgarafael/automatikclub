# Epic 05: Learning Engine

## Objetivo
Implementar o fluxo completo de aprendizado: catalogo de trilhas, navegacao por cursos/modulos/aulas, player de aula com video (YouTube/Vimeo/upload), tracking de progresso granular, dashboard do aluno, e recomendacoes. E o core da plataforma.

## Dependencias
- EPIC-02: Design System & Core UI
- EPIC-03: Auth & User System
- EPIC-04: Database Schema

## Stories

### Story 05.1: Catalogo de Trilhas e Cursos
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar paginas `/learn` (catalogo de trilhas) e `/learn/[trackSlug]` (cursos de uma trilha). Grid responsivo com cards, busca, filtros por categoria/dificuldade, e indicador de progresso do aluno.
**Acceptance Criteria:**
- [ ] AC1: Given um aluno autenticado When acessa `/learn` Then ve grid de trilhas com titulo, thumbnail, num. cursos, e progresso %
- [ ] AC2: Given o aluno clica em trilha When a pagina `/learn/[trackSlug]` carrega Then ve lista de cursos com badge de tier (free/pro/premium)
- [ ] AC3: Given filtro "IA" selecionado When aplicado Then apenas trilhas da categoria IA aparecem
- [ ] AC4: Given curso com tier `pro` When aluno free visualiza Then card mostra badge de lock
**Tasks:**
- [ ] Criar pagina `/learn/page.tsx` com `TrackGrid`, `TrackCard`, `SearchBar`, `FilterTabs`
- [ ] Criar pagina `/learn/[trackSlug]/page.tsx` com `TrackHeader`, `CourseList`, `CourseCard`
- [ ] Criar Server Actions: `getTracks.ts`, `getCoursesByTrack.ts`
- [ ] Criar componentes: `TrackCard`, `CourseCard`, `ProgressBadge`, `TierBadge`
- [ ] Implementar busca client-side com debounce
- [ ] Implementar ISR (revalidate a cada 60s) para catalogo
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/page.tsx`
- `src/app/(platform)/learn/[trackSlug]/page.tsx`
- `src/features/courses/actions/get-tracks.ts`
- `src/features/courses/actions/get-courses-by-track.ts`
- `src/features/courses/components/track-grid.tsx`
- `src/features/courses/components/track-card.tsx`
- `src/features/courses/components/course-list.tsx`
- `src/features/courses/components/course-card.tsx`
- `src/features/courses/components/progress-badge.tsx`
- `src/features/courses/components/tier-badge.tsx`

### Story 05.2: Visao do Curso — Modulos e Curriculum
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina de overview do curso com info do instrutor, progresso geral, accordion de modulos com aulas, e botao continuar/iniciar.
**Acceptance Criteria:**
- [ ] AC1: Given aluno na pagina do curso When modulo e expandido Then lista de aulas aparece com status (completa/em andamento/nao iniciada)
- [ ] AC2: Given aluno com progresso When clica "Continuar" Then e redirecionado para proxima aula nao completa
- [ ] AC3: Given curso com tier superior ao aluno When pagina carrega Then mostra paywall com CTA de upgrade
**Tasks:**
- [ ] Criar pagina `/learn/[trackSlug]/[courseSlug]/page.tsx`
- [ ] Criar componentes: `CourseHeader`, `ModuleAccordion`, `LessonListItem`, `ContinueButton`
- [ ] Criar Server Action `getCourseWithProgress.ts` (JOIN course + modules + lessons + user_progress)
- [ ] Implementar logica de "proxima aula" (primeira nao completa na ordem)
- [ ] Criar componente `Paywall` reutilizavel (tier insuficiente)
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/[trackSlug]/[courseSlug]/page.tsx`
- `src/features/courses/actions/get-course-with-progress.ts`
- `src/features/courses/components/course-header.tsx`
- `src/features/courses/components/module-accordion.tsx`
- `src/features/courses/components/lesson-list-item.tsx`
- `src/features/courses/components/continue-button.tsx`
- `src/shared/components/paywall.tsx`

### Story 05.3: Player de Aula — Video + Conteudo
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar pagina de aula com player de video (YouTube embed, Vimeo embed, ou player nativo para uploads), conteudo markdown abaixo, curriculum sidebar no painel direito, e navegacao prev/next.
**Acceptance Criteria:**
- [ ] AC1: Given aula com video_source=youtube When pagina carrega Then YouTube embed renderiza com aspect ratio 16:9
- [ ] AC2: Given aula com video_source=upload When pagina carrega Then player nativo renderiza com controles
- [ ] AC3: Given aluno na aula When clica "Proxima Aula" Then navega para proxima aula do modulo (ou primeiro do proximo modulo)
- [ ] AC4: Given curriculum sidebar When aula atual e destacada Then scroll automatico para aula ativa
**Tasks:**
- [ ] Criar pagina `/learn/[trackSlug]/[courseSlug]/[lessonSlug]/page.tsx`
- [ ] Criar componente `LessonPlayer` (detecta source e renderiza embed adequado)
- [ ] Criar componente `VideoEmbed` (YouTube/Vimeo iframe com lazy loading)
- [ ] Criar componente `NativeVideoPlayer` (para uploads diretos)
- [ ] Criar componente `LessonContent` (MarkdownRenderer com conteudo da aula)
- [ ] Criar componente `CurriculumSidebar` (lista de aulas do curso, destaque na atual)
- [ ] Criar componentes `NextLessonButton`, `PrevLessonButton`
- [ ] Criar Server Action `getLesson.ts`
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/[trackSlug]/[courseSlug]/[lessonSlug]/page.tsx`
- `src/features/courses/actions/get-lesson.ts`
- `src/features/courses/components/lesson-player.tsx`
- `src/features/courses/components/video-embed.tsx`
- `src/features/courses/components/native-video-player.tsx`
- `src/features/courses/components/lesson-content.tsx`
- `src/features/courses/components/curriculum-sidebar.tsx`
- `src/features/courses/components/next-lesson-button.tsx`
- `src/features/courses/components/prev-lesson-button.tsx`

### Story 05.4: Tracking de Progresso
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar marcacao de aula como completa (manual via botao), auto-tracking de ultima aula assistida, e recalculo de progresso em cascata (lesson → course → track).
**Acceptance Criteria:**
- [ ] AC1: Given aluno na aula When clica "Marcar como Completa" Then user_lesson_progress atualiza para status=completed com timestamp
- [ ] AC2: Given aula marcada como completa When trigger roda Then user_course_progress.percentage e recalculado
- [ ] AC3: Given todas aulas de um curso completas When verificado Then user_course_progress.percentage = 100
- [ ] AC4: Given progresso atualizado When aluno volta ao catalogo Then percentual reflete corretamente no CourseCard
**Tasks:**
- [ ] Criar Server Action `markLessonComplete.ts` (insert/update user_lesson_progress)
- [ ] Criar Server Action `updateProgress.ts` (generico — para auto-tracking)
- [ ] Criar componente `MarkCompleteButton` (toggle complete/incomplete)
- [ ] Criar componente `ProgressBar` (visual — barra com percentual)
- [ ] Verificar triggers no banco que recalculam course e track progress
- [ ] Implementar revalidatePath apos update de progresso
**Arquivos a criar/modificar:**
- `src/features/courses/actions/mark-lesson-complete.ts`
- `src/features/courses/actions/update-progress.ts`
- `src/features/courses/components/mark-complete-button.tsx`
- `src/features/courses/components/progress-bar.tsx`
- `src/features/courses/hooks/use-progress.ts`

### Story 05.5: Avaliacao de Aulas (1-5 Estrelas)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar sistema de avaliacao por aula com rating de 1 a 5 estrelas. Rating armazenado no user_lesson_progress. Exibir media na listagem.
**Acceptance Criteria:**
- [ ] AC1: Given aluno na aula When clica em 4 estrelas Then rating e salvo em user_lesson_progress.rating
- [ ] AC2: Given aluno ja avaliou When re-visita a aula Then ve seu rating anterior preenchido
- [ ] AC3: Given multiplos alunos avaliaram When media e calculada Then LessonCard mostra media com precisao de 1 decimal
**Tasks:**
- [ ] Criar componente `StarRating` (interativo — click para avaliar, hover preview)
- [ ] Criar Server Action `rateLesson.ts`
- [ ] Criar componente `AverageRating` (display-only com estrelas parciais)
- [ ] Adicionar rating ao `getLesson.ts` response
**Arquivos a criar/modificar:**
- `src/features/courses/components/star-rating.tsx`
- `src/features/courses/components/average-rating.tsx`
- `src/features/courses/actions/rate-lesson.ts`

### Story 05.6: Dashboard do Aluno — Meu Progresso
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/learn/progresso` com visao geral do aluno: aulas completas, horas assistidas, streak, progresso por trilha/curso, atividade recente.
**Acceptance Criteria:**
- [ ] AC1: Given aluno com historico When acessa `/learn/progresso` Then ve stats cards (aulas completas, horas, streak) com dados reais
- [ ] AC2: Given aluno com progresso em 3 trilhas When dashboard carrega Then lista de trilhas com barra de progresso aparece
- [ ] AC3: Given atividade recente When dashboard carrega Then feed mostra ultimas 10 aulas assistidas com timestamps
**Tasks:**
- [ ] Criar pagina `/learn/progresso/page.tsx`
- [ ] Criar componentes: `ProgressDashboard`, `OverallStats`, `TrackProgressList`, `RecentActivityFeed`, `StreakCalendar`
- [ ] Criar Server Action `getStudentProgress.ts` (aggregated stats)
- [ ] Integrar com dados de gamificacao (XP, streak) quando disponivel
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/progresso/page.tsx`
- `src/features/courses/actions/get-student-progress.ts`
- `src/features/courses/components/progress-dashboard.tsx`
- `src/features/courses/components/overall-stats.tsx`
- `src/features/courses/components/track-progress-list.tsx`
- `src/features/courses/components/recent-activity-feed.tsx`
- `src/features/courses/components/streak-calendar.tsx`

### Story 05.7: Aulas Recomendadas
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/learn/recomendadas` com aulas sugeridas baseadas em historico de consumo. V1 usa heuristica simples (mesmo track, nao completas, populares). V2 (EPIC-12) usa pgvector.
**Acceptance Criteria:**
- [ ] AC1: Given aluno com historico When acessa `/learn/recomendadas` Then ve grid de aulas recomendadas com motivo ("Porque voce esta estudando [trilha]")
- [ ] AC2: Given aluno sem historico When acessa recomendadas Then ve aulas mais populares como fallback
- [ ] AC3: Given aula recomendada de tier superior When exibida Then mostra badge de lock
**Tasks:**
- [ ] Criar pagina `/learn/recomendadas/page.tsx`
- [ ] Criar Server Action `getRecommendations.ts` (V1: heuristica por trilha + popularidade)
- [ ] Criar componentes: `RecommendationGrid`, `RecommendedLessonCard` (com motivo)
- [ ] Preparar interface para V2 (pgvector) — criar type `RecommendationSource`
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/recomendadas/page.tsx`
- `src/features/courses/actions/get-recommendations.ts`
- `src/features/courses/components/recommendation-grid.tsx`
- `src/features/courses/components/recommended-lesson-card.tsx`

### Story 05.8: Aulas da Comunidade (Catalogo)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/learn/comunidade` com grid de aulas submetidas por contribuidores e aprovadas. Mesma interface do catalogo, com badge "Comunidade".
**Acceptance Criteria:**
- [ ] AC1: Given aulas aprovadas existem When aluno acessa `/learn/comunidade` Then ve grid com badge "Comunidade"
- [ ] AC2: Given aluno clica em aula da comunidade When player carrega Then mesma interface do player normal com badge "Comunidade"
- [ ] AC3: Given filtro por contribuidor When aplicado Then apenas aulas daquele contribuidor aparecem
**Tasks:**
- [ ] Criar pagina `/learn/comunidade/page.tsx`
- [ ] Criar componente `CommunityLessonGrid` (reutiliza `LessonCard` com badge extra)
- [ ] Criar Server Action `getCommunityLessons.ts` (contributor_lessons where status=approved)
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/comunidade/page.tsx`
- `src/features/courses/actions/get-community-lessons.ts`
- `src/features/courses/components/community-lesson-grid.tsx`
