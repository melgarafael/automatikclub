# Epic 06: Comments & Ratings

## Objetivo
Implementar sistema de comentarios hierarquicos reutilizavel (usado em aulas, posts, marketplace), moderacao admin, badges IA vs Humano, e rate limiting.

## Dependencias
- EPIC-04: Database Schema
- EPIC-05: Learning Engine (para integrar com aulas)

## Stories

### Story 06.1: Comment Thread — CRUD e Threading
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar componente de comentarios polimorfico (commentable_type + commentable_id) com criacao, edicao, delecao, replies aninhadas (max 3 niveis), e paginacao.
**Acceptance Criteria:**
- [ ] AC1: Given um aluno na pagina de aula When submete comentario Then comentario aparece no thread com avatar, nome, e timestamp
- [ ] AC2: Given um comentario existente When aluno clica "Responder" Then reply form abre inline e reply aparece aninhada
- [ ] AC3: Given thread com 20+ comentarios When pagina carrega Then primeiros 10 aparecem com botao "Carregar mais"
- [ ] AC4: Given autor do comentario When clica em editar/deletar Then acoes sao permitidas apenas no proprio comentario
**Tasks:**
- [ ] Criar componente `CommentThread` (lista + composer + paginacao)
- [ ] Criar componente `CommentItem` (avatar, nome, conteudo, acoes, replies)
- [ ] Criar componente `CommentComposer` (textarea + submit, reutilizavel para reply)
- [ ] Criar Server Actions: `createComment.ts`, `updateComment.ts`, `deleteComment.ts`, `getComments.ts`
- [ ] Implementar threading: parent_id referencia, max 3 niveis de aninhamento
- [ ] Implementar paginacao cursor-based (created_at DESC)
**Arquivos a criar/modificar:**
- `src/features/community/components/comment-thread.tsx`
- `src/features/community/components/comment-item.tsx`
- `src/features/community/components/comment-composer.tsx`
- `src/features/community/actions/create-comment.ts`
- `src/features/community/actions/update-comment.ts`
- `src/features/community/actions/delete-comment.ts`
- `src/features/community/actions/get-comments.ts`

### Story 06.2: Badges IA vs Humano
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar visual diferenciado para comentarios respondidos por IA vs humanos. Badge "IA" com icone e cor distinta. Badge "Humano" sutil. Logica baseada no campo `is_ai_response` do comment.
**Acceptance Criteria:**
- [ ] AC1: Given comentario com `is_ai_response=true` When renderizado Then mostra badge "IA" com icone de robo e cor accent
- [ ] AC2: Given comentario humano When renderizado Then mostra badge sutil "Membro" ou nenhum badge
- [ ] AC3: Given comentario de IA When o nome do agente e disponivel Then mostra nome do agente no badge
**Tasks:**
- [ ] Criar componente `AIBadge` (icone robo + "Respondido por IA" + agent name)
- [ ] Criar componente `HumanBadge` (sutil, opcional)
- [ ] Integrar badges no `CommentItem` baseado em `is_ai_response`
- [ ] Estilizar com cores distintas para facil diferenciacao
**Arquivos a criar/modificar:**
- `src/features/community/components/ai-badge.tsx`
- `src/features/community/components/human-badge.tsx`
- `src/features/community/components/comment-item.tsx` (modificar)

### Story 06.3: Like, Flag, e Acoes em Comentarios
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar acoes em comentarios: curtir (toggle), denunciar (flag para moderacao), e contadores. Optimistic updates no frontend.
**Acceptance Criteria:**
- [ ] AC1: Given aluno clica curtir When acao executa Then like counter incrementa imediatamente (optimistic) e persiste no banco
- [ ] AC2: Given aluno ja curtiu When clica novamente Then like e removido (toggle)
- [ ] AC3: Given aluno clica "Denunciar" When confirma Then comentario e flagged para moderacao
**Tasks:**
- [ ] Criar Server Actions: `likeComment.ts`, `unlikeComment.ts`, `flagComment.ts`
- [ ] Criar componentes: `LikeButton` (com optimistic update), `FlagButton` (com dialog de confirmacao)
- [ ] Integrar no `CommentItem`
- [ ] Implementar optimistic updates com useOptimistic ou startTransition
**Arquivos a criar/modificar:**
- `src/features/community/actions/like-comment.ts`
- `src/features/community/actions/unlike-comment.ts`
- `src/features/community/actions/flag-comment.ts`
- `src/features/community/components/like-button.tsx`
- `src/features/community/components/flag-button.tsx`

### Story 06.4: Moderacao de Comentarios (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar painel admin de moderacao em `/admin/comentarios`: lista com filtros (status, aula, autor), preview, acoes bulk (aprovar, rejeitar, deletar), e toggle de IA autoresponder por aula.
**Acceptance Criteria:**
- [ ] AC1: Given moderador acessa `/admin/comentarios` When filtro "flagged" e aplicado Then apenas comentarios denunciados aparecem
- [ ] AC2: Given moderador seleciona 5 comentarios When clica "Aprovar em massa" Then todos mudam status para approved
- [ ] AC3: Given admin na moderacao When toggle IA e ativado para aula X Then novos comentarios naquela aula recebem auto-resposta
**Tasks:**
- [ ] Criar pagina `/admin/comentarios/page.tsx`
- [ ] Criar componentes: `CommentModerationTable`, `StatusFilter`, `CommentPreview`, `BulkActions`, `AIResponseToggle`
- [ ] Criar Server Actions: `moderateComment.ts` (approve/reject/delete), `bulkModerateComments.ts`, `toggleAIResponder.ts`
- [ ] Criar tabela `ai_comment_config` (lesson_id, is_enabled, created_at) — ou adicionar coluna em lessons
**Arquivos a criar/modificar:**
- `src/app/admin/comentarios/page.tsx`
- `src/features/admin/components/comment-moderation-table.tsx`
- `src/features/admin/components/comment-preview.tsx`
- `src/features/admin/components/bulk-actions.tsx`
- `src/features/admin/components/ai-response-toggle.tsx`
- `src/features/admin/actions/moderate-comment.ts`
- `src/features/admin/actions/bulk-moderate-comments.ts`
- `src/features/admin/actions/toggle-ai-responder.ts`

### Story 06.5: Rate Limiting de Comentarios
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar rate limiting para criacao de comentarios: max 10 comentarios/minuto por usuario, max 3 comentarios/minuto na mesma aula. Usar sliding window no middleware ou server action.
**Acceptance Criteria:**
- [ ] AC1: Given usuario criou 10 comentarios no ultimo minuto When tenta criar outro Then recebe erro 429 com mensagem "Limite atingido"
- [ ] AC2: Given usuario criou 3 comentarios na mesma aula no ultimo minuto When tenta criar outro Then recebe erro com mensagem especifica
- [ ] AC3: Given rate limit atingido When 60 segundos passam Then usuario pode comentar novamente
**Tasks:**
- [ ] Implementar rate limiter no Server Action `createComment.ts`
- [ ] Usar Supabase query para contar comentarios recentes (sliding window)
- [ ] Criar funcao utilitaria `checkRateLimit` reutilizavel
- [ ] Retornar erro amigavel com tempo restante para retry
**Arquivos a criar/modificar:**
- `src/shared/utils/rate-limit.ts`
- `src/features/community/actions/create-comment.ts` (modificar)
