# Epic 10: Marketplace

## Objetivo
Implementar marketplace completo: catalogo com filtros e busca full-text, pagina de item com reviews, upload de items por contribuidores (Skills, Projetos GitHub, Templates), fluxo de aprovacao, e dashboard do contribuidor.

## Dependencias
- EPIC-03: Auth & User System (roles contribuidor)
- EPIC-04: Database Schema
- EPIC-07: Gamification (XP por contribuicao)

## Stories

### Story 10.1: Catalogo do Marketplace
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar pagina `/marketplace` com grid de itens, busca full-text (PostgreSQL FTS), filtros (tipo, categoria, preco, rating), e ordenacao (recentes, populares, melhor avaliados).
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/marketplace` When pagina carrega Then grid de itens aprovados aparece com cards
- [ ] AC2: Given busca "Claude prompt" When submetida Then resultados full-text aparecem ranqueados por relevancia
- [ ] AC3: Given filtro tipo "Templates" When aplicado Then apenas templates aparecem
- [ ] AC4: Given ordenacao "Melhor avaliados" When selecionada Then itens com maior avg_rating aparecem primeiro
**Tasks:**
- [ ] Criar pagina `/marketplace/page.tsx`
- [ ] Criar componentes: `MarketplaceGrid`, `ItemCard`, `SearchBar`, `FilterSidebar`, `SortDropdown`
- [ ] Criar Server Action `getMarketplaceItems.ts` (com full-text search, filters, pagination)
- [ ] Configurar PostgreSQL FTS: tsvector column em marketplace_items, GIN index
- [ ] Implementar busca com ts_query e ts_rank
**Arquivos a criar/modificar:**
- `src/app/(platform)/marketplace/page.tsx`
- `src/features/marketplace/actions/get-marketplace-items.ts`
- `src/features/marketplace/components/marketplace-grid.tsx`
- `src/features/marketplace/components/item-card.tsx`
- `src/features/marketplace/components/filter-sidebar.tsx`
- `src/features/marketplace/components/sort-dropdown.tsx`
- `supabase/migrations/00013_marketplace_fts.sql`

### Story 10.2: Pagina do Item
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/marketplace/[itemSlug]` com detalhes completos do item, galeria de screenshots, reviews de usuarios, botao de download/link, e itens relacionados.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa item When pagina carrega Then detalhes completos (descricao markdown, autor, tipo, rating) aparecem
- [ ] AC2: Given item com screenshots When galeria renderiza Then imagens navegaveis com lightbox
- [ ] AC3: Given aluno clica "Download" When item e gratuito Then download inicia direto; quando pago, paywall aparece
- [ ] AC4: Given item do tipo "GitHub" When aluno clica Then redireciona para URL do repositorio
**Tasks:**
- [ ] Criar pagina `/marketplace/[itemSlug]/page.tsx`
- [ ] Criar componentes: `ItemHeader`, `ItemDescription`, `ScreenshotGallery`, `ReviewList`, `ReviewComposer`, `DownloadButton`, `RelatedItems`
- [ ] Criar Server Actions: `getMarketplaceItem.ts`, `getItemReviews.ts`, `downloadItem.ts`
**Arquivos a criar/modificar:**
- `src/app/(platform)/marketplace/[itemSlug]/page.tsx`
- `src/features/marketplace/actions/get-marketplace-item.ts`
- `src/features/marketplace/actions/get-item-reviews.ts`
- `src/features/marketplace/actions/download-item.ts`
- `src/features/marketplace/components/item-header.tsx`
- `src/features/marketplace/components/item-description.tsx`
- `src/features/marketplace/components/screenshot-gallery.tsx`
- `src/features/marketplace/components/review-list.tsx`
- `src/features/marketplace/components/review-composer.tsx`
- `src/features/marketplace/components/download-button.tsx`
- `src/features/marketplace/components/related-items.tsx`

### Story 10.3: Reviews e Avaliacoes
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar sistema de reviews para itens do marketplace: rating 1-5 + texto, uma review por usuario por item, media recalculada automaticamente.
**Acceptance Criteria:**
- [ ] AC1: Given aluno baixou item When escreve review com 4 estrelas Then review e salva e avg_rating recalculado
- [ ] AC2: Given aluno ja avaliou item When tenta novamente Then ve sua review existente com opcao de editar
- [ ] AC3: Given 10 reviews existem When pagina carrega Then media e exibida com breakdown (5 estrelas: 40%, 4: 30%, etc.)
**Tasks:**
- [ ] Criar Server Actions: `createReview.ts`, `updateReview.ts`
- [ ] Criar componentes: `ReviewComposer`, `RatingBreakdown` (histogram)
- [ ] Criar trigger SQL: recalcular avg_rating em marketplace_items quando review e inserida/atualizada
**Arquivos a criar/modificar:**
- `src/features/marketplace/actions/create-review.ts`
- `src/features/marketplace/actions/update-review.ts`
- `src/features/marketplace/components/review-composer.tsx`
- `src/features/marketplace/components/rating-breakdown.tsx`

### Story 10.4: Upload de Item (Contribuidores)
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar pagina `/marketplace/novo` para contribuidores submeterem itens. Form com todos os campos, upload de files e thumbnail, preview, submit para aprovacao.
**Acceptance Criteria:**
- [ ] AC1: Given contribuidor acessa `/marketplace/novo` When preenche form e submete Then item e criado com status "pending"
- [ ] AC2: Given aluno (nao contribuidor) When tenta acessar `/marketplace/novo` Then e redirecionado (RoleGate)
- [ ] AC3: Given upload de arquivo When file > 50MB Then erro amigavel com limite
- [ ] AC4: Given preview markdown When contribuidor escreve descricao Then preview renderiza em tempo real
**Tasks:**
- [ ] Criar pagina `/marketplace/novo/page.tsx`
- [ ] Criar componente `ItemUploadForm` (titulo, tipo, descricao markdown, tags, thumbnail, file/URL)
- [ ] Criar Server Action `submitMarketplaceItem.ts`
- [ ] Implementar upload para Supabase Storage (resumable para arquivos grandes)
- [ ] Integrar RoleGate (contribuidor+) e TierGate (pro+)
**Arquivos a criar/modificar:**
- `src/app/(platform)/marketplace/novo/page.tsx`
- `src/features/marketplace/actions/submit-marketplace-item.ts`
- `src/features/marketplace/components/item-upload-form.tsx`

### Story 10.5: Minhas Contribuicoes (Dashboard)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/marketplace/contribuicoes` com lista de itens do contribuidor, status de cada um, estatisticas de downloads e ratings, e link para editar.
**Acceptance Criteria:**
- [ ] AC1: Given contribuidor acessa `/marketplace/contribuicoes` When pagina carrega Then lista de seus itens com status badge (pendente/aprovado/rejeitado)
- [ ] AC2: Given item aprovado When stats cards renderizam Then mostra downloads totais e rating medio
- [ ] AC3: Given item rejeitado When contribuidor ve Then motivo da rejeicao aparece
**Tasks:**
- [ ] Criar pagina `/marketplace/contribuicoes/page.tsx`
- [ ] Criar componentes: `ContributionsList`, `ContributionCard` (com status badge), `ContributorStats`
- [ ] Criar Server Action `getMyContributions.ts`
- [ ] Criar pagina `/marketplace/[itemSlug]/editar/page.tsx` (reutiliza form com dados preenchidos)
**Arquivos a criar/modificar:**
- `src/app/(platform)/marketplace/contribuicoes/page.tsx`
- `src/app/(platform)/marketplace/[itemSlug]/editar/page.tsx`
- `src/features/marketplace/actions/get-my-contributions.ts`
- `src/features/marketplace/actions/update-marketplace-item.ts`
- `src/features/marketplace/components/contributions-list.tsx`
- `src/features/marketplace/components/contribution-card.tsx`
- `src/features/marketplace/components/contributor-stats.tsx`

### Story 10.6: Busca Full-Text
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar busca full-text otimizada no marketplace usando PostgreSQL FTS com tsvector, GIN index, ts_query com ranking, e suporte a busca por titulo, descricao, e tags.
**Acceptance Criteria:**
- [ ] AC1: Given busca "template landing page" When executada Then resultados relevantes aparecem ranqueados
- [ ] AC2: Given busca com typo "templte" When executada Then fuzzy match sugere correcao ou encontra resultados
- [ ] AC3: Given 1000+ itens When busca executa Then resposta em <200ms
**Tasks:**
- [ ] Criar coluna tsvector em marketplace_items (titulo + descricao + tags)
- [ ] Criar GIN index na coluna tsvector
- [ ] Criar funcao SQL `search_marketplace(query text)` com ts_query e ts_rank
- [ ] Integrar no Server Action `getMarketplaceItems.ts`
- [ ] Adicionar trigram extension (pg_trgm) para fuzzy matching
**Arquivos a criar/modificar:**
- `supabase/migrations/00013_marketplace_fts.sql`
- `src/features/marketplace/actions/get-marketplace-items.ts` (modificar)
