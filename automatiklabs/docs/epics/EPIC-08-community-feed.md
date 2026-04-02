# Epic 08: Community Feed

## Objetivo
Implementar feed da comunidade estilo Circle.so: feed principal, canais (spaces), abas customizaveis, composer com markdown, reacoes, moderacao, e presenca online via Supabase Realtime.

## Dependencias
- EPIC-02: Design System & Core UI
- EPIC-03: Auth & User System
- EPIC-04: Database Schema

## Stories

### Story 08.1: Feed Principal
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar pagina `/feed` com infinite scroll, post cards (autor, conteudo, imagens, likes, comentarios count), filtros (Recentes, Populares, Seguindo), e integrar com tri-panel layout (sidebar esquerda = canais, centro = feed, direita = trending/online).
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/feed` When pagina carrega Then primeiros 20 posts aparecem com infinite scroll
- [ ] AC2: Given filtro "Populares" When selecionado Then posts sao reordenados por likes_count DESC
- [ ] AC3: Given novo post publicado por outro usuario When Realtime event chega Then indicador "X novos posts" aparece no topo
- [ ] AC4: Given sidebar esquerda When renderizada Then lista de canais aparece com unread counts
**Tasks:**
- [ ] Criar pagina `/feed/page.tsx` com `PostFeed`, `FilterTabs`
- [ ] Criar componente `PostCard` (avatar, nome, conteudo truncado, imagens preview, like/comment counts, timestamp)
- [ ] Criar Server Action `getPosts.ts` (cursor-based pagination, filters)
- [ ] Implementar infinite scroll com Intersection Observer
- [ ] Criar componente `ChannelSidebar` (lista de canais para sidebar esquerda)
- [ ] Criar componente `TrendingSidebar` (panel direito — trending posts, membros online)
- [ ] Integrar Supabase Realtime para notificacao de novos posts
**Arquivos a criar/modificar:**
- `src/app/(platform)/feed/page.tsx`
- `src/features/community/actions/get-posts.ts`
- `src/features/community/components/post-feed.tsx`
- `src/features/community/components/post-card.tsx`
- `src/features/community/components/filter-tabs.tsx`
- `src/features/community/components/channel-sidebar.tsx`
- `src/features/community/components/trending-sidebar.tsx`
- `src/features/community/hooks/use-realtime-posts.ts`

### Story 08.2: Post Composer
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar composer de posts: rich text com markdown, upload de imagens, mencoes (@usuario), selecao de canal, e publicacao.
**Acceptance Criteria:**
- [ ] AC1: Given aluno clica "Novo Post" When composer abre Then mostra editor com toolbar markdown
- [ ] AC2: Given aluno digita "@raf" When autocomplete aparece Then mostra usuarios que comecam com "raf"
- [ ] AC3: Given aluno faz upload de 3 imagens When submete Then imagens sao salvas no Supabase Storage e URLs inseridas no post
- [ ] AC4: Given aluno seleciona canal When publica Then post aparece no feed geral E no feed do canal
**Tasks:**
- [ ] Criar componente `PostComposer` (modal/drawer com editor)
- [ ] Implementar editor markdown com toolbar (bold, italic, link, code, image)
- [ ] Criar componente `ImageUpload` (multi-file, preview, upload para Supabase Storage)
- [ ] Criar componente `MentionAutocomplete` (busca users por @prefix)
- [ ] Criar componente `ChannelSelector` (dropdown de canais)
- [ ] Criar Server Action `createPost.ts`
**Arquivos a criar/modificar:**
- `src/features/community/components/post-composer.tsx`
- `src/features/community/components/image-upload.tsx`
- `src/features/community/components/mention-autocomplete.tsx`
- `src/features/community/components/channel-selector.tsx`
- `src/features/community/actions/create-post.ts`

### Story 08.3: Thread de Post (Detalhes + Comentarios)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/feed/[postId]` com conteudo completo do post, thread de comentarios (reutilizando CommentThread do EPIC-06), likes, bookmarks, e compartilhamento.
**Acceptance Criteria:**
- [ ] AC1: Given aluno clica em post When pagina carrega Then conteudo completo com imagens full-size aparece
- [ ] AC2: Given aluno no post detail When comenta Then comentario aparece no thread com Realtime
- [ ] AC3: Given aluno clica "Bookmark" When toggle Then post e salvo/removido dos favoritos
**Tasks:**
- [ ] Criar pagina `/feed/[postId]/page.tsx`
- [ ] Criar componentes: `PostDetail`, `BookmarkButton`, `ShareButton`
- [ ] Integrar `CommentThread` (EPIC-06) com commentable_type='post'
- [ ] Criar Server Actions: `getPost.ts`, `toggleBookmark.ts`, `toggleLike.ts`
**Arquivos a criar/modificar:**
- `src/app/(platform)/feed/[postId]/page.tsx`
- `src/features/community/actions/get-post.ts`
- `src/features/community/actions/toggle-bookmark.ts`
- `src/features/community/actions/toggle-like.ts`
- `src/features/community/components/post-detail.tsx`
- `src/features/community/components/bookmark-button.tsx`
- `src/features/community/components/share-button.tsx`

### Story 08.4: Canais (Spaces)
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar pagina `/comunidade/[channelSlug]` com header do canal, abas customizaveis, feed filtrado por canal, lista de membros no panel direito, e posts fixados.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa canal When pagina carrega Then header com nome, descricao, e membro count aparece
- [ ] AC2: Given canal tem abas When usuario navega Then conteudo muda conforme aba (Discussao, Recursos, etc.)
- [ ] AC3: Given canal com tier `pro` When aluno free acessa Then paywall com upgrade CTA
- [ ] AC4: Given posts fixados no canal When feed carrega Then aparecem no topo com badge "Fixado"
**Tasks:**
- [ ] Criar pagina `/comunidade/[channelSlug]/page.tsx`
- [ ] Criar pagina `/comunidade/[channelSlug]/[tabSlug]/page.tsx`
- [ ] Criar componentes: `ChannelHeader`, `ChannelTabs`, `PinnedPosts`, `ChannelMemberList`
- [ ] Criar Server Actions: `getChannel.ts`, `getChannelPosts.ts`
- [ ] Integrar TierGate para canais com tier_required
**Arquivos a criar/modificar:**
- `src/app/(platform)/comunidade/[channelSlug]/page.tsx`
- `src/app/(platform)/comunidade/[channelSlug]/[tabSlug]/page.tsx`
- `src/features/community/actions/get-channel.ts`
- `src/features/community/actions/get-channel-posts.ts`
- `src/features/community/components/channel-header.tsx`
- `src/features/community/components/channel-tabs.tsx`
- `src/features/community/components/pinned-posts.tsx`
- `src/features/community/components/channel-member-list.tsx`

### Story 08.5: Presenca Online (Realtime)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar indicador de presenca online via Supabase Realtime Presence. Mostrar quem esta online na sidebar direita e no canal. Dot verde no avatar.
**Acceptance Criteria:**
- [ ] AC1: Given aluno logado When entra no feed Then sua presenca e registrada via Supabase Presence
- [ ] AC2: Given sidebar direita When outro usuario esta online Then aparece na lista com dot verde
- [ ] AC3: Given usuario fecha aba When presenca e removida Then desaparece da lista em <5s
**Tasks:**
- [ ] Criar hook `usePresence.ts` (Supabase Realtime Presence channel)
- [ ] Criar componente `OnlineIndicator` (dot verde no avatar)
- [ ] Criar componente `OnlineMembersList` (panel direito — lista de online users)
- [ ] Integrar presence no `TrendingSidebar` e `ChannelMemberList`
**Arquivos a criar/modificar:**
- `src/features/community/hooks/use-presence.ts`
- `src/features/community/components/online-indicator.tsx`
- `src/features/community/components/online-members-list.tsx`

### Story 08.6: Moderacao de Posts
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar acoes de moderacao: moderadores podem fixar/desfixar posts, deletar posts, e mover posts entre canais. Denuncias de posts via flag.
**Acceptance Criteria:**
- [ ] AC1: Given moderador no post When clica "Fixar" Then post e marcado como pinned e aparece no topo do canal
- [ ] AC2: Given moderador When clica "Deletar Post" Then post e soft-deleted e removido do feed
- [ ] AC3: Given aluno denuncia post When flag e registrado Then post aparece na fila de moderacao admin
**Tasks:**
- [ ] Criar Server Actions: `pinPost.ts`, `deletePost.ts`, `flagPost.ts`, `movePost.ts`
- [ ] Criar componente `PostModActions` (dropdown para moderadores: fixar, deletar, mover)
- [ ] Integrar RoleGate para mostrar acoes apenas para moderador+
**Arquivos a criar/modificar:**
- `src/features/community/actions/pin-post.ts`
- `src/features/community/actions/delete-post.ts`
- `src/features/community/actions/flag-post.ts`
- `src/features/community/actions/move-post.ts`
- `src/features/community/components/post-mod-actions.tsx`
