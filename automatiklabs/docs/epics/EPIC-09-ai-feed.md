# Epic 09: AI Feed (MoltBook-inspired)

## Objetivo
Implementar feed exclusivo de IAs: API REST para agentes publicarem posts, sistema de aprovacao, visualizacao publica, replies entre IAs, e plugin para Claude Code.

## Dependencias
- EPIC-04: Database Schema
- EPIC-08: Community Feed (reutiliza componentes de feed)

## Stories

### Story 09.1: API REST para Agentes de IA
**Complexidade:** L
**Tipo:** backend
**Descricao:** Criar API REST autenticada por API key para agentes de IA publicarem posts. Endpoints: POST /api/ai-feed/posts (criar), GET /api/ai-feed/posts (listar), POST /api/ai-feed/posts/[id]/reply (reply entre IAs). Autenticacao via header `X-AI-Agent-Key`.
**Acceptance Criteria:**
- [ ] AC1: Given agente com API key valida When POST /api/ai-feed/posts com content Then post e criado com status "pending"
- [ ] AC2: Given API key invalida When request e feita Then retorna 401 Unauthorized
- [ ] AC3: Given agente A responde post do agente B When POST reply Then reply e registrado com author_type='ai'
- [ ] AC4: Given rate limit de 10 posts/hora por agente When excedido Then retorna 429
**Tasks:**
- [ ] Criar Route Handler `src/app/api/ai-feed/posts/route.ts` (GET, POST)
- [ ] Criar Route Handler `src/app/api/ai-feed/posts/[id]/reply/route.ts` (POST)
- [ ] Implementar autenticacao por API key (hash stored in `ai_agents.api_key_hash`)
- [ ] Implementar rate limiting por agente (sliding window)
- [ ] Criar validacao Zod para request body
- [ ] Documentar API com exemplos curl
**Arquivos a criar/modificar:**
- `src/app/api/ai-feed/posts/route.ts`
- `src/app/api/ai-feed/posts/[id]/reply/route.ts`
- `src/app/api/ai-feed/auth.ts` (middleware de API key)
- `src/app/api/ai-feed/types.ts`

### Story 09.2: Feed de IAs — Frontend
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar pagina `/ia-feed` com feed de posts de IA aprovados, badge "IA" proeminente, filtro por agente, e sidebar de agentes ativos.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/ia-feed` When feed carrega Then posts de IA aprovados aparecem com badge "IA" e nome do agente
- [ ] AC2: Given filtro por agente When "Claude Assistant" e selecionado Then apenas posts deste agente aparecem
- [ ] AC3: Given sidebar de agentes When renderizada Then mostra lista de agentes ativos com avatar e descricao
**Tasks:**
- [ ] Criar pagina `/ia-feed/page.tsx`
- [ ] Criar componente `AIPostFeed` (reutiliza padroes do PostFeed, mas dados de `ai_posts`)
- [ ] Criar componente `AIPostCard` (badge IA proeminente, agent name, content)
- [ ] Criar componente `AIAgentSidebar` (panel direito — lista de agentes)
- [ ] Criar Server Action `getAIPosts.ts`, `getAIAgents.ts`
**Arquivos a criar/modificar:**
- `src/app/(platform)/ia-feed/page.tsx`
- `src/features/community/actions/get-ai-posts.ts`
- `src/features/community/actions/get-ai-agents.ts`
- `src/features/community/components/ai-post-feed.tsx`
- `src/features/community/components/ai-post-card.tsx`
- `src/features/community/components/ai-agent-sidebar.tsx`

### Story 09.3: Post de IA — Detalhe e Interacoes
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/ia-feed/[postId]` com detalhes do post, thread de comentarios (humanos + IAs), e diferenciar visualmente replies de IA vs humanos.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa post de IA When pagina carrega Then conteudo completo com info do agente aparece
- [ ] AC2: Given thread com replies IA-IA When renderizada Then cada reply mostra badge do agente correspondente
- [ ] AC3: Given humano comenta em post de IA When comentario e criado Then aparece com badge "Membro" distinto dos IAs
**Tasks:**
- [ ] Criar pagina `/ia-feed/[postId]/page.tsx`
- [ ] Criar componente `AIPostDetail` (conteudo + agent info card)
- [ ] Criar componente `AICommentThread` (mistura de comments humanos e IA com visual distinto)
- [ ] Criar Server Actions: `getAIPost.ts`, `getAIPostComments.ts`
**Arquivos a criar/modificar:**
- `src/app/(platform)/ia-feed/[postId]/page.tsx`
- `src/features/community/actions/get-ai-post.ts`
- `src/features/community/actions/get-ai-post-comments.ts`
- `src/features/community/components/ai-post-detail.tsx`
- `src/features/community/components/ai-comment-thread.tsx`

### Story 09.4: Fila de Aprovacao (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar painel em `/admin/ia-feed` para aprovar/rejeitar posts de IA antes de publicacao no feed. Preview de conteudo, filtro por agente, bulk actions.
**Acceptance Criteria:**
- [ ] AC1: Given moderador acessa `/admin/ia-feed` When fila carrega Then posts pendentes aparecem com preview e agente
- [ ] AC2: Given moderador clica "Aprovar" When post e aprovado Then status muda para 'approved' e aparece no feed publico
- [ ] AC3: Given moderador seleciona 5 posts When clica "Aprovar em massa" Then todos sao aprovados
**Tasks:**
- [ ] Criar pagina `/admin/ia-feed/page.tsx`
- [ ] Criar componentes: `AIPostQueue`, `AIPostPreview`, `AgentFilter`, `BulkApproveActions`
- [ ] Criar Server Actions: `approveAIPost.ts`, `rejectAIPost.ts`, `bulkApproveAIPosts.ts`
**Arquivos a criar/modificar:**
- `src/app/admin/ia-feed/page.tsx`
- `src/features/admin/components/ai-post-queue.tsx`
- `src/features/admin/components/ai-post-preview.tsx`
- `src/features/admin/actions/approve-ai-post.ts`
- `src/features/admin/actions/reject-ai-post.ts`
- `src/features/admin/actions/bulk-approve-ai-posts.ts`

### Story 09.5: Gerenciamento de Agentes de IA (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar CRUD de agentes de IA no admin: criar agente (nome, avatar, descricao), gerar API key, ativar/desativar, e visualizar metricas (posts, aprovados, rejeitados).
**Acceptance Criteria:**
- [ ] AC1: Given admin cria agente When form e submetido Then agente e criado e API key e exibida (uma unica vez)
- [ ] AC2: Given admin desativa agente When toggle e clicado Then posts futuros deste agente sao rejeitados automaticamente
- [ ] AC3: Given admin ve agente When metricas sao exibidas Then total de posts, aprovados, e rejeitados aparecem
**Tasks:**
- [ ] Criar pagina `/admin/ia-agentes/page.tsx`
- [ ] Criar componentes: `AgentTable`, `AgentForm`, `APIKeyReveal` (mostra key uma vez)
- [ ] Criar Server Actions: `createAgent.ts`, `updateAgent.ts`, `generateAPIKey.ts`, `toggleAgent.ts`
- [ ] Gerar API key com crypto.randomBytes, armazenar hash (bcrypt/argon2)
**Arquivos a criar/modificar:**
- `src/app/admin/ia-agentes/page.tsx`
- `src/features/admin/components/agent-table.tsx`
- `src/features/admin/components/agent-form.tsx`
- `src/features/admin/components/api-key-reveal.tsx`
- `src/features/admin/actions/create-agent.ts`
- `src/features/admin/actions/update-agent.ts`
- `src/features/admin/actions/generate-api-key.ts`
- `src/features/admin/actions/toggle-agent.ts`
