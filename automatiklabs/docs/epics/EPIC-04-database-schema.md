# Epic 04: Database Schema

## Objetivo
Criar o schema completo do PostgreSQL: todas as tabelas, RLS policies, indexes otimizados, triggers, materialized views para analytics, pg_cron jobs, e seed data para desenvolvimento.

## Dependencias
- EPIC-01: Project Scaffolding (Supabase CLI configurado)

## Stories

### Story 04.1: Core Tables — Users, Profiles, Subscriptions
**Complexidade:** L
**Tipo:** database
**Descricao:** Criar tabelas fundamentais que todos os outros dominios referenciam: user_profiles (estende auth.users), subscriptions, user_preferences. Includes RLS policies, indexes, e trigger de criacao automatica de perfil no registro.
**Acceptance Criteria:**
- [ ] AC1: Given um novo usuario registrado When o trigger dispara Then um row em `user_profiles` e criado automaticamente com role=aluno
- [ ] AC2: Given RLS ativo When usuario A tenta ler perfil de usuario B Then campos publicos sao visiveis mas CPF/WhatsApp nao
- [ ] AC3: Given a tabela `subscriptions` When consultada com `auth.uid()` Then apenas subscriptions do usuario logado sao retornadas
**Tasks:**
- [ ] Criar migration `00001_core_users.sql`:
  - `user_profiles` (id FK auth.users, username UNIQUE, full_name, email, cpf, whatsapp, instagram, bio, avatar_url, stack text[], portfolio_url, role enum, created_at, updated_at)
  - `subscriptions` (id, user_id FK, stripe_customer_id, stripe_subscription_id, tier enum, status, current_period_start, current_period_end)
  - `user_preferences` (user_id FK PK, notification_email, notification_push, notification_inapp, profile_visibility enum)
- [ ] Criar trigger `on_auth_user_created` que insere em user_profiles
- [ ] Criar RLS policies: perfil publico (read), edicao propria (update), admin (all)
- [ ] Criar indexes: username (unique), email, role, tier
- [ ] Criar enum types: user_role, subscription_tier, subscription_status, profile_visibility
**Arquivos a criar/modificar:**
- `supabase/migrations/00001_core_users.sql`
- `supabase/migrations/00002_rls_core.sql`

### Story 04.2: Learning Tables — Tracks, Courses, Modules, Lessons, Progress
**Complexidade:** L
**Tipo:** database
**Descricao:** Criar schema completo do learning engine com relacionamentos hierarquicos, tracking de progresso granular, e suporte a embeddings para recomendacoes futuras.
**Acceptance Criteria:**
- [ ] AC1: Given a hierarquia tracks→courses→modules→lessons When queries JOIN sao executadas Then dados retornam corretamente ordenados por `position`
- [ ] AC2: Given um usuario completa uma aula When `user_lesson_progress` e atualizado Then `user_course_progress` e recalculado via trigger
- [ ] AC3: Given RLS ativo When usuario consulta progresso Then apenas seu proprio progresso e retornado
**Tasks:**
- [ ] Criar migration `00003_learning.sql`:
  - `tracks` (id, title, slug UNIQUE, description, thumbnail_url, category, difficulty enum, position, is_published, created_at)
  - `courses` (id, track_id FK, title, slug UNIQUE, description, thumbnail_url, instructor_id FK, duration_minutes, tier_required enum, position, is_published)
  - `modules` (id, course_id FK, title, slug, description, position)
  - `lessons` (id, module_id FK, title, slug, description, video_url, video_source enum, content_md, duration_minutes, position, is_published, tier_required)
  - `user_lesson_progress` (user_id, lesson_id, PK composite, status enum, rating 1-5, completed_at, last_watched_at)
  - `user_course_progress` (user_id, course_id, PK composite, completed_lessons, total_lessons, percentage, last_activity_at)
  - `user_track_progress` (user_id, track_id, PK composite, completed_courses, total_courses, percentage)
  - `lesson_embeddings` (lesson_id FK, embedding vector(1536), updated_at)
- [ ] Criar triggers: recalcular course_progress quando lesson_progress muda, recalcular track_progress quando course_progress muda
- [ ] Criar RLS: lessons publicas (read all published), progresso (read/write own)
- [ ] Criar indexes: slugs (unique), position (for ordering), user_id+lesson_id, embedding (ivfflat)
- [ ] Habilitar extensao `pgvector`
**Arquivos a criar/modificar:**
- `supabase/migrations/00003_learning.sql`
- `supabase/migrations/00004_rls_learning.sql`

### Story 04.3: Community Tables — Posts, Comments, Channels, Reactions
**Complexidade:** L
**Tipo:** database
**Descricao:** Criar schema para feed da comunidade (Circle.so style), comentarios hierarquicos (usados tambem em aulas), canais com abas, e reacoes.
**Acceptance Criteria:**
- [ ] AC1: Given um post criado em canal When consultado Then retorna com author info e contadores (likes, comments)
- [ ] AC2: Given comentarios aninhados When consultados Then arvore de replies e reconstruida corretamente
- [ ] AC3: Given Supabase Realtime When novo post e inserido Then clientes inscritos no canal recebem notificacao
**Tasks:**
- [ ] Criar migration `00005_community.sql`:
  - `channels` (id, name, slug UNIQUE, description, image_url, type enum, visibility enum, tier_required, position, is_archived)
  - `channel_tabs` (id, channel_id FK, name, slug, type enum, position)
  - `channel_members` (channel_id, user_id, PK composite, joined_at)
  - `posts` (id, channel_id FK, author_id FK, content_md, images text[], is_pinned, likes_count, comments_count, created_at, updated_at)
  - `post_likes` (post_id, user_id, PK composite, created_at)
  - `post_bookmarks` (post_id, user_id, PK composite, created_at)
  - `comments` (id, commentable_type enum, commentable_id uuid, author_id FK, parent_id FK self-ref, content, is_ai_response, ai_agent_id, status enum, likes_count, created_at)
  - `comment_likes` (comment_id, user_id, PK composite)
- [ ] Criar triggers: incrementar likes_count/comments_count no post quando like/comment e inserido/deletado
- [ ] Criar RLS: posts e comments (read if channel accessible, write own, moderate if role >= moderador)
- [ ] Habilitar Realtime para tabelas `posts` e `comments`
**Arquivos a criar/modificar:**
- `supabase/migrations/00005_community.sql`
- `supabase/migrations/00006_rls_community.sql`

### Story 04.4: Gamification + Marketplace + AI Feed Tables
**Complexidade:** L
**Tipo:** database
**Descricao:** Criar schema para gamificacao (XP, badges, streaks, desafios), marketplace (items, reviews), e feed de IAs (ai_posts, ai_agents).
**Acceptance Criteria:**
- [ ] AC1: Given XP adicionado a usuario When trigger dispara Then nivel e recalculado e badge desbloqueado se aplicavel
- [ ] AC2: Given item do marketplace submetido When status = 'pending' Then visivel apenas para admin/moderador ate aprovacao
- [ ] AC3: Given ai_post criado via API When status = 'pending' Then nao aparece no feed publico
**Tasks:**
- [ ] Criar migration `00007_gamification.sql`:
  - `xp_transactions` (id, user_id FK, amount, source_type enum, source_id uuid, description, created_at)
  - `user_xp` (user_id PK FK, total_xp, level, current_streak, longest_streak, last_activity_date)
  - `badges` (id, name, slug UNIQUE, description, icon_url, criteria_type, criteria_value, xp_reward)
  - `user_badges` (user_id, badge_id, PK composite, earned_at)
  - `challenges` (id, title, description, criteria_md, deadline, xp_reward, difficulty enum, tier_required, status enum, created_by FK)
  - `user_challenge_submissions` (id, challenge_id FK, user_id FK, content_md, submitted_at, status enum, reviewed_by FK)
- [ ] Criar migration `00008_marketplace.sql`:
  - `marketplace_items` (id, title, slug UNIQUE, type enum, description_md, thumbnail_url, file_url, external_url, price decimal, author_id FK, avg_rating, download_count, status enum, tier_required, created_at)
  - `marketplace_reviews` (id, item_id FK, user_id FK, rating 1-5, content, created_at)
  - `marketplace_downloads` (item_id, user_id, PK composite, downloaded_at)
- [ ] Criar migration `00009_ai_feed.sql`:
  - `ai_agents` (id, name, slug UNIQUE, description, avatar_url, api_key_hash, is_active, created_at)
  - `ai_posts` (id, agent_id FK, content_md, images text[], status enum, likes_count, comments_count, approved_by FK, approved_at, created_at)
  - `ai_post_likes` (post_id, user_id, PK composite)
  - `ai_post_comments` (id, post_id FK, author_type enum, author_id uuid, parent_id FK self-ref, content, created_at)
- [ ] Criar RLS para todas as tabelas
- [ ] Criar triggers: recalcular avg_rating no marketplace_items, recalcular total_xp no user_xp
**Arquivos a criar/modificar:**
- `supabase/migrations/00007_gamification.sql`
- `supabase/migrations/00008_marketplace.sql`
- `supabase/migrations/00009_ai_feed.sql`
- `supabase/migrations/00010_rls_features.sql`

### Story 04.5: Supporting Tables, Materialized Views, pg_cron, Seed Data
**Complexidade:** L
**Tipo:** database
**Descricao:** Criar tabelas de suporte (newsletter, books, contributor_lessons), materialized views para analytics, pg_cron jobs para manutencao, e seed data completo para desenvolvimento.
**Acceptance Criteria:**
- [ ] AC1: Given pg_cron configurado When job `refresh_leaderboard` roda a cada hora Then materialized view e atualizada
- [ ] AC2: Given `supabase db reset` executado When seed.sql roda Then banco tem dados de teste para todas as tabelas
- [ ] AC3: Given materialized view `leaderboard_weekly` When consultada Then retorna ranking correto ordenado por XP
**Tasks:**
- [ ] Criar migration `00011_supporting.sql`:
  - `newsletters` (id, title, slug UNIQUE, content_html, status enum, sent_at, published_at, created_at)
  - `newsletter_subscribers` (id, email UNIQUE, is_active, subscribed_at, unsubscribed_at)
  - `books` (id, title, author, description, cover_url, external_url, tags text[], created_at)
  - `contributor_lessons` (id, contributor_id FK, title, description, video_url, content_md, tags text[], suggested_course_id, status enum, feedback, reviewed_by FK, created_at)
- [ ] Criar migration `00012_views_and_cron.sql`:
  - Materialized view `leaderboard_weekly` (user_id, username, avatar_url, xp_this_week, rank)
  - Materialized view `leaderboard_monthly`
  - Materialized view `leaderboard_alltime`
  - Materialized view `course_stats` (course_id, enrolled_count, completion_rate, avg_rating)
  - pg_cron: refresh leaderboards (hourly), cleanup expired sessions (daily), recalculate course stats (daily)
- [ ] Criar `supabase/seed.sql` com dados para todas as tabelas (5 users, 2 tracks, 4 courses, 10 lessons, posts, etc.)
- [ ] Gerar tipos TypeScript via `supabase gen types`
**Arquivos a criar/modificar:**
- `supabase/migrations/00011_supporting.sql`
- `supabase/migrations/00012_views_and_cron.sql`
- `supabase/seed.sql`
- `src/shared/types/database.ts` (auto-generated)
