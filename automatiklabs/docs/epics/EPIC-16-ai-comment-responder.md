# Epic 16: AI Comment Responder

## Objetivo
Implementar resposta automatica de IA em comentarios de aulas usando Claude API. Configuracao granular por aula/curso pelo admin, trigger automatico ou manual, resposta contextualizada com conteudo da aula.

## Dependencias
- EPIC-06: Comments & Ratings (sistema de comentarios funcional)

## Stories

### Story 16.1: Claude API Integration
**Complexidade:** L
**Tipo:** backend
**Descricao:** Implementar integracao com Claude API para gerar respostas contextualizadas a comentarios de aulas. Contexto inclui: conteudo da aula (markdown), titulo, transcript de video (se disponivel), e historico do thread.
**Acceptance Criteria:**
- [ ] AC1: Given comentario em aula com IA habilitada When API e chamada Then resposta relevante ao conteudo da aula e gerada
- [ ] AC2: Given thread com 3 mensagens When contexto e montado Then historico completo do thread e incluido no prompt
- [ ] AC3: Given Claude API indisponivel When timeout ocorre Then erro e logado e comentario permanece sem resposta (fail silently)
- [ ] AC4: Given resposta gerada When salva Then campo `is_ai_response=true` e `ai_agent_id` sao preenchidos
**Tasks:**
- [ ] Criar service `src/features/community/services/ai-responder.ts`
- [ ] Implementar funcao `generateAIResponse(lessonId, commentId, threadContext)`:
  - Buscar conteudo da aula (content_md, titulo)
  - Buscar thread context (ultimas N mensagens)
  - Montar prompt com system message + contexto + pergunta
  - Chamar Claude API (claude-sonnet-4-5-20241022 para custo otimizado)
  - Salvar resposta como comentario com is_ai_response=true
- [ ] Configurar Anthropic SDK (`src/shared/lib/anthropic.ts`)
- [ ] Implementar retry logic com backoff exponencial
- [ ] Implementar timeout (30s max) e fallback silencioso
**Arquivos a criar/modificar:**
- `src/features/community/services/ai-responder.ts`
- `src/shared/lib/anthropic.ts`

### Story 16.2: Trigger Automatico
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar trigger que dispara resposta de IA automaticamente quando novo comentario e criado em aula com IA habilitada. Delay de 30s antes de responder (dar chance ao humano). Nao responder a respostas de IA (evitar loop).
**Acceptance Criteria:**
- [ ] AC1: Given aula com IA habilitada When novo comentario humano e criado Then IA responde automaticamente apos 30s
- [ ] AC2: Given comentario e reply a resposta de IA When trigger verifica Then nao gera nova resposta (anti-loop)
- [ ] AC3: Given humano responde antes dos 30s When timeout chega Then IA nao responde (humano ja respondeu)
- [ ] AC4: Given aula com IA desabilitada When comentario e criado Then nenhum trigger dispara
**Tasks:**
- [ ] Criar Edge Function ou pg_cron + queue: `process-ai-comments`
- [ ] Implementar logica: ao criar comentario, enfileirar job com delay 30s
- [ ] Antes de responder: verificar se humano ja respondeu, se aula tem IA ativa, se comentario nao e de IA
- [ ] Criar tabela `ai_comment_queue` (comment_id, lesson_id, status, scheduled_at, processed_at)
- [ ] Criar pg_cron job que processa fila a cada 30s
**Arquivos a criar/modificar:**
- `supabase/functions/process-ai-comments/index.ts`
- `supabase/migrations/00017_ai_comment_queue.sql`

### Story 16.3: Trigger Manual (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Permitir que admin/moderador dispare resposta de IA manualmente para qualquer comentario, independente da configuracao da aula. Botao "Gerar Resposta IA" no painel de moderacao.
**Acceptance Criteria:**
- [ ] AC1: Given moderador na moderacao When clica "Gerar Resposta IA" em comentario Then resposta e gerada e exibida como preview
- [ ] AC2: Given preview da resposta When moderador clica "Publicar" Then resposta e salva como comentario IA
- [ ] AC3: Given preview da resposta When moderador clica "Regenerar" Then nova resposta e gerada
- [ ] AC4: Given preview da resposta When moderador edita e publica Then versao editada e salva
**Tasks:**
- [ ] Criar Server Action `generateManualAIResponse.ts` (gera mas nao publica)
- [ ] Criar Server Action `publishAIResponse.ts` (publica resposta aprovada/editada)
- [ ] Criar componente `AIResponsePreview` (preview + botoes: publicar, regenerar, editar, cancelar)
- [ ] Integrar botao "Gerar Resposta IA" na `CommentModerationTable`
**Arquivos a criar/modificar:**
- `src/features/admin/actions/generate-manual-ai-response.ts`
- `src/features/admin/actions/publish-ai-response.ts`
- `src/features/admin/components/ai-response-preview.tsx`
- `src/features/admin/components/comment-moderation-table.tsx` (modificar)

### Story 16.4: Configuracao Admin por Aula/Curso
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar configuracao granular de IA autoresponder: toggle por aula individual, toggle por curso inteiro, configuracao de tom (formal, casual, tecnico), e limites (max respostas/dia).
**Acceptance Criteria:**
- [ ] AC1: Given admin ativa IA para curso X When toggle e ligado Then todas as aulas do curso X recebem auto-resposta
- [ ] AC2: Given admin desativa IA para aula especifica When toggle e desligado Then apenas aquela aula para de receber respostas
- [ ] AC3: Given admin configura tom "tecnico" When IA responde Then resposta usa linguagem tecnica adequada
- [ ] AC4: Given limite de 50 respostas/dia When atingido Then IA para de responder ate proximo dia
**Tasks:**
- [ ] Criar/expandir tabela `ai_comment_config` (lesson_id, course_id, is_enabled, tone enum, max_daily_responses, current_daily_count, reset_at)
- [ ] Criar pagina `/admin/ia-config/page.tsx` (ou integrar em settings de aula/curso)
- [ ] Criar componente `AIConfigPanel` (toggle, tone selector, limit input)
- [ ] Criar Server Actions: `updateAIConfig.ts`, `getAIConfig.ts`
- [ ] Modificar system prompt do Claude baseado no `tone` configurado
**Arquivos a criar/modificar:**
- `supabase/migrations/00018_ai_comment_config.sql`
- `src/app/admin/ia-config/page.tsx`
- `src/features/admin/actions/update-ai-config.ts`
- `src/features/admin/actions/get-ai-config.ts`
- `src/features/admin/components/ai-config-panel.tsx`
- `src/features/community/services/ai-responder.ts` (modificar — usar tone config)
