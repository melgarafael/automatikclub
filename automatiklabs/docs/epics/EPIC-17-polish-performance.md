# Epic 17: Polish & Performance

## Objetivo
Otimizar performance (Core Web Vitals), implementar loading states e error boundaries consistentes, SEO completo, acessibilidade (a11y), e polimento visual final.

## Dependencias
- Todos os epics anteriores (01-16)

## Stories

### Story 17.1: Core Web Vitals Optimization
**Complexidade:** L
**Tipo:** frontend
**Descricao:** Otimizar LCP, FID/INP, e CLS para atingir scores >90 no Lighthouse em todas as paginas chave. Inclui: otimizacao de imagens (next/image), font loading, bundle splitting, e prefetching.
**Acceptance Criteria:**
- [ ] AC1: Given pagina `/feed` When Lighthouse roda Then Performance score >= 90
- [ ] AC2: Given pagina `/learn/[trackSlug]/[courseSlug]/[lessonSlug]` When Lighthouse roda Then LCP < 2.5s
- [ ] AC3: Given qualquer pagina When interacao ocorre Then INP < 200ms
- [ ] AC4: Given imagens da plataforma When carregam Then usam next/image com dimensoes explicitas (CLS = 0)
**Tasks:**
- [ ] Auditar todas as paginas com Lighthouse e Web Vitals
- [ ] Otimizar imagens: converter para WebP/AVIF via next/image, definir width/height, lazy loading
- [ ] Otimizar fonts: preload, font-display: swap, self-host
- [ ] Implementar dynamic imports para componentes pesados (editor markdown, charts, video player)
- [ ] Configurar bundle analyzer e eliminar dependencias duplicadas
- [ ] Implementar prefetching para links provaveis (next lesson, next page)
- [ ] Configurar ISR/SWR para paginas que permitem cache
**Arquivos a criar/modificar:**
- `next.config.ts` (images, experimental)
- `src/app/layout.tsx` (font optimization)
- Componentes com dynamic imports onde aplicavel

### Story 17.2: Loading States & Suspense Boundaries
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar loading states consistentes em toda a plataforma usando React Suspense boundaries e loading.tsx files. Cada secao de pagina deve ter skeleton adequado.
**Acceptance Criteria:**
- [ ] AC1: Given qualquer pagina da plataforma When carregando Then skeleton adequado aparece (nao tela branca)
- [ ] AC2: Given feed com infinite scroll When carregando mais posts Then skeleton de posts aparece no final
- [ ] AC3: Given Suspense boundary When componente filho falha Then error boundary captura sem crashar a pagina inteira
**Tasks:**
- [ ] Criar `loading.tsx` para cada route group: `(platform)`, `admin`, `(auth)`, `(marketing)`
- [ ] Criar `loading.tsx` especificos para paginas complexas: feed, learn, marketplace
- [ ] Criar Suspense boundaries com skeletons customizados para:
  - Feed de posts (PostCardSkeleton)
  - Listagem de cursos (CourseCardSkeleton)
  - Player de aula (VideoSkeleton + ContentSkeleton)
  - Dashboard admin (MetricsCardSkeleton)
- [ ] Verificar que nenhuma pagina mostra tela branca durante load
**Arquivos a criar/modificar:**
- `src/app/(platform)/loading.tsx`
- `src/app/(platform)/feed/loading.tsx`
- `src/app/(platform)/learn/loading.tsx`
- `src/app/(platform)/marketplace/loading.tsx`
- `src/app/admin/loading.tsx`
- `src/shared/components/loading-skeleton.tsx` (expandir variants)

### Story 17.3: Error Boundaries & Error Pages
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar error boundaries em todos os niveis: global, por route group, e por feature. Paginas de erro customizadas (404, 500, 403) com UI consistente e acoes uteis.
**Acceptance Criteria:**
- [ ] AC1: Given URL inexistente When usuario acessa Then pagina 404 customizada aparece com link para home
- [ ] AC2: Given erro no servidor When pagina falha Then error.tsx mostra mensagem amigavel com botao "Tentar novamente"
- [ ] AC3: Given erro em componente de comentarios When crash ocorre Then apenas secao de comentarios mostra erro, player continua funcionando
**Tasks:**
- [ ] Criar `src/app/not-found.tsx` (404 global)
- [ ] Criar `src/app/error.tsx` (500 global com reset action)
- [ ] Criar `error.tsx` para cada route group
- [ ] Criar componente `ErrorFallback` reutilizavel (icon, mensagem, CTA)
- [ ] Implementar error boundaries granulares com Suspense + ErrorBoundary em:
  - CommentThread (nao quebrar player se comentarios falharem)
  - CurriculumSidebar (nao quebrar aula se sidebar falhar)
  - TrendingSidebar (nao quebrar feed se trending falhar)
**Arquivos a criar/modificar:**
- `src/app/not-found.tsx`
- `src/app/error.tsx`
- `src/app/(platform)/error.tsx`
- `src/app/admin/error.tsx`
- `src/shared/components/error-fallback.tsx`

### Story 17.4: SEO & Meta Tags
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar SEO completo: metadata dinamica por pagina (titulo, descricao, OG images), sitemap.xml, robots.txt, JSON-LD structured data para cursos, e canonical URLs.
**Acceptance Criteria:**
- [ ] AC1: Given pagina de curso When meta tags sao inspecionadas Then titulo, descricao, e OG image estao presentes e corretos
- [ ] AC2: Given `/sitemap.xml` When acessado Then lista todas as paginas publicas da plataforma
- [ ] AC3: Given pagina de aula When JSON-LD e inspecionado Then structured data de Course/LearningResource esta presente
- [ ] AC4: Given pagina duplicada When acessada Then canonical URL aponta para a versao canonica
**Tasks:**
- [ ] Implementar `generateMetadata` em paginas chave: cursos, aulas, marketplace items, perfis, newsletter
- [ ] Criar `src/app/sitemap.ts` (dynamic sitemap generator)
- [ ] Criar `src/app/robots.ts`
- [ ] Implementar JSON-LD para: Course, LearningResource, Person (perfil), Product (marketplace), Article (newsletter)
- [ ] Criar OG image template com `@vercel/og`
- [ ] Configurar canonical URLs para evitar duplicatas
**Arquivos a criar/modificar:**
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/(platform)/learn/[trackSlug]/[courseSlug]/page.tsx` (metadata)
- `src/app/(platform)/learn/[trackSlug]/[courseSlug]/[lessonSlug]/page.tsx` (metadata)
- `src/app/(platform)/marketplace/[itemSlug]/page.tsx` (metadata)
- `src/app/api/og/route.tsx` (OG image generation)

### Story 17.5: Acessibilidade (a11y)
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Auditar e corrigir acessibilidade em toda a plataforma: ARIA labels, keyboard navigation, focus management, color contrast, screen reader support, e skip links.
**Acceptance Criteria:**
- [ ] AC1: Given qualquer pagina When auditada com axe-core Then 0 violations criticas ou serias
- [ ] AC2: Given usuario navegando com teclado When Tab e pressionado Then focus order e logico e visivel
- [ ] AC3: Given video player When foco esta no player Then controles sao acessiveis via teclado
- [ ] AC4: Given dark mode When ativo Then todos os textos tem contrast ratio >= 4.5:1
**Tasks:**
- [ ] Auditar com axe-core e Lighthouse Accessibility em todas as paginas
- [ ] Adicionar ARIA labels em componentes interativos (buttons, inputs, modals, dropdowns)
- [ ] Implementar skip link ("Pular para conteudo principal")
- [ ] Verificar e corrigir focus management em modals e drawers
- [ ] Verificar keyboard navigation no tri-panel layout
- [ ] Verificar color contrast em light e dark mode
- [ ] Adicionar `role`, `aria-live`, e `aria-label` onde necessario
**Arquivos a criar/modificar:**
- `src/shared/components/skip-link.tsx`
- `src/app/layout.tsx` (adicionar skip link)
- Componentes diversos (ARIA labels, roles)
