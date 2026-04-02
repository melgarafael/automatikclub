# Epic 12: Recommendation Engine

## Objetivo
Implementar engine de recomendacao usando pgvector: gerar embeddings de aulas, construir perfil do aluno baseado em historico, API de recomendacoes com fallbacks, e integracao com a pagina de aulas recomendadas.

## Dependencias
- EPIC-04: Database Schema (pgvector habilitado)
- EPIC-05: Learning Engine (dados de progresso e aulas)

## Stories

### Story 12.1: Geracao de Embeddings para Aulas
**Complexidade:** L
**Tipo:** backend
**Descricao:** Implementar pipeline para gerar embeddings de aulas usando OpenAI Embeddings API (ou similar). Combinar titulo + descricao + conteudo como input. Armazenar em `lesson_embeddings` com pgvector. Rodar em batch para aulas existentes e incrementalmente para novas.
**Acceptance Criteria:**
- [ ] AC1: Given aula existente sem embedding When batch job roda Then embedding vector(1536) e gerado e salvo em `lesson_embeddings`
- [ ] AC2: Given nova aula publicada When trigger/hook detecta Then embedding e gerado automaticamente
- [ ] AC3: Given 100 aulas processadas When verificado Then todas tem embeddings validos com dimensao 1536
**Tasks:**
- [ ] Criar Edge Function `supabase/functions/generate-embeddings/index.ts` (batch + incremental)
- [ ] Configurar OpenAI Embeddings API (text-embedding-3-small)
- [ ] Criar funcao de preparo de texto: concatenar titulo + descricao + primeiros 2000 chars do content_md
- [ ] Criar batch job: processar todas aulas sem embedding
- [ ] Criar trigger ou webhook: gerar embedding quando aula e publicada/atualizada
- [ ] Criar indice IVFFlat para busca eficiente de similaridade
**Arquivos a criar/modificar:**
- `supabase/functions/generate-embeddings/index.ts`
- `supabase/migrations/00015_embedding_index.sql`

### Story 12.2: Perfil de Interesses do Aluno
**Complexidade:** M
**Tipo:** backend
**Descricao:** Construir perfil de interesses do aluno baseado em: aulas completas (peso alto), aulas assistidas parcialmente (peso medio), avaliacoes altas (peso alto), topicos dos cursos matriculados. Representar como vetor medio ponderado dos embeddings das aulas consumidas.
**Acceptance Criteria:**
- [ ] AC1: Given aluno com 10 aulas completas When perfil e calculado Then vetor medio ponderado e armazenado em `user_interest_vector`
- [ ] AC2: Given aluno completa nova aula When perfil e recalculado Then vetor atualiza incrementalmente
- [ ] AC3: Given aluno sem historico When perfil e solicitado Then retorna null (fallback para populares)
**Tasks:**
- [ ] Criar tabela `user_interest_vectors` (user_id PK, vector vector(1536), last_calculated_at)
- [ ] Criar funcao SQL ou Edge Function `calculate_user_interests(user_id)` que faz media ponderada
- [ ] Definir pesos: aula completa com rating 5 = peso 3, completa = 2, parcial = 1
- [ ] Criar pg_cron job: recalcular perfis a cada 6 horas para usuarios ativos
**Arquivos a criar/modificar:**
- `supabase/migrations/00016_user_interest_vectors.sql`
- `supabase/functions/calculate-interests/index.ts`

### Story 12.3: API de Recomendacoes
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar endpoint de recomendacoes que combina similaridade pgvector com filtros (nao recomendar aulas ja completas, respeitar tier). Retornar top N aulas com motivo da recomendacao.
**Acceptance Criteria:**
- [ ] AC1: Given aluno com perfil calculado When API e chamada Then retorna 10 aulas mais similares ao perfil, excluindo ja completas
- [ ] AC2: Given aula recomendada com tier superior When retornada Then inclui flag `requires_upgrade=true`
- [ ] AC3: Given resposta When retornada Then cada item inclui campo `reason` ("Baseado em [trilha]", "Popular entre estudantes similares")
**Tasks:**
- [ ] Criar Route Handler `src/app/api/recommendations/route.ts`
- [ ] Implementar query pgvector: `ORDER BY embedding <=> user_vector LIMIT N`
- [ ] Filtrar: excluir completas, respeitar tier, diversificar por trilha
- [ ] Gerar campo `reason` baseado na fonte da recomendacao
- [ ] Implementar cache com ISR (revalidate a cada 1h)
**Arquivos a criar/modificar:**
- `src/app/api/recommendations/route.ts`
- `src/features/courses/actions/get-recommendations.ts` (modificar — V2 com pgvector)
- `src/features/courses/services/recommendation-service.ts`

### Story 12.4: Fallbacks e Resilience
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar fallbacks para cenarios onde recomendacao por similaridade nao esta disponivel: sem perfil (usuario novo), sem embeddings (aulas novas), ou erro no pgvector. Fallbacks: populares, recentes, mesma trilha.
**Acceptance Criteria:**
- [ ] AC1: Given usuario novo sem historico When recomendacao e solicitada Then retorna aulas mais populares (by completion count)
- [ ] AC2: Given pgvector indisponivel When similarity search falha Then fallback para aulas mais recentes da mesma trilha
- [ ] AC3: Given mix de fontes When retornada Then cada recomendacao identifica sua fonte (similarity, popular, recent)
**Tasks:**
- [ ] Criar funcao `getPopularLessons()` (ordenado por completion count)
- [ ] Criar funcao `getRecentLessons()` (ordenado por created_at)
- [ ] Criar funcao `getSameTrackLessons(trackId)` (mesma trilha, nao completas)
- [ ] Implementar chain de fallbacks no recommendation-service
- [ ] Adicionar logging para monitorar qual fonte esta sendo usada
**Arquivos a criar/modificar:**
- `src/features/courses/services/recommendation-service.ts` (modificar)
- `src/features/courses/actions/get-recommendations.ts` (modificar)
