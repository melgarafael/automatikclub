-- =============================================
-- Seed Data for AutomatikClub
-- Runs after migrations during `supabase db reset`
-- =============================================

-- =============================================
-- 1. USERS (5 users with different roles)
-- NOTE: In a real Supabase environment, users are created in auth.users first.
-- The trigger on_auth_user_created auto-creates user_profiles.
-- For seeding, we insert directly into both tables.
-- =============================================

-- Create auth users (Supabase test environment)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin@automatikclub.com',    crypt('Admin123!', gen_salt('bf')), now(), '{"role":"admin","subscription_level":"premium"}'::jsonb, '{"full_name":"Rafael Admin"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'moderador@automatikclub.com', crypt('Mod12345!', gen_salt('bf')), now(), '{"role":"moderador","subscription_level":"premium"}'::jsonb, '{"full_name":"Marina Moderadora"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'contrib@automatikclub.com',   crypt('Contrib1!', gen_salt('bf')), now(), '{"role":"contribuidor","subscription_level":"pro"}'::jsonb, '{"full_name":"Carlos Contribuidor"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'aluno1@automatikclub.com',    crypt('Aluno123!', gen_salt('bf')), now(), '{"role":"aluno","subscription_level":"pro"}'::jsonb, '{"full_name":"Ana Aluna Pro"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'aluno2@automatikclub.com',    crypt('Aluno123!', gen_salt('bf')), now(), '{"role":"aluno","subscription_level":"free"}'::jsonb, '{"full_name":"Bruno Aluno Free"}'::jsonb, now(), now(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- Create identities for auth users
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@automatikclub.com"}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000001', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"moderador@automatikclub.com"}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000002', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', '{"sub":"a0000000-0000-0000-0000-000000000003","email":"contrib@automatikclub.com"}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000003', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', '{"sub":"a0000000-0000-0000-0000-000000000004","email":"aluno1@automatikclub.com"}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000004', now(), now(), now()),
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', '{"sub":"a0000000-0000-0000-0000-000000000005","email":"aluno2@automatikclub.com"}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000005', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- The trigger should have created profiles, but let's update them with full data
-- (using ON CONFLICT to handle both cases)
INSERT INTO public.user_profiles (id, username, full_name, email, whatsapp, instagram, bio, avatar_url, stack, portfolio_url, role, subscription_level, newsletter_subscribed, total_points)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'rafael_admin', 'Rafael Admin', 'admin@automatikclub.com', '+5511999990001', '@rafael_admin', 'Fundador e admin da AutomatikClub. Apaixonado por IA e educacao.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafael', ARRAY['TypeScript', 'Next.js', 'Python', 'AI/ML'], 'https://rafael.dev', 'admin', 'premium', true, 5000),
  ('a0000000-0000-0000-0000-000000000002', 'marina_mod', 'Marina Moderadora', 'moderador@automatikclub.com', '+5511999990002', '@marina_mod', 'Moderadora da comunidade. Full-stack dev e entusiasta de open source.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=marina', ARRAY['React', 'Node.js', 'PostgreSQL'], 'https://marina.dev', 'moderador', 'premium', true, 3500),
  ('a0000000-0000-0000-0000-000000000003', 'carlos_dev', 'Carlos Contribuidor', 'contrib@automatikclub.com', '+5511999990003', '@carlos_dev', 'Contribuidor ativo. Especialista em automacoes com IA.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos', ARRAY['Python', 'LangChain', 'FastAPI'], 'https://carlos.dev', 'contribuidor', 'pro', true, 2000),
  ('a0000000-0000-0000-0000-000000000004', 'ana_pro', 'Ana Aluna Pro', 'aluno1@automatikclub.com', '+5511999990004', '@ana_pro', 'Estudando programacao para mudar de carreira. Plano Pro!', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana', ARRAY['JavaScript', 'React'], NULL, 'aluno', 'pro', true, 800),
  ('a0000000-0000-0000-0000-000000000005', 'bruno_free', 'Bruno Aluno Free', 'aluno2@automatikclub.com', NULL, '@bruno_free', 'Iniciante curioso explorando o mundo da tecnologia.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno', ARRAY['HTML', 'CSS'], NULL, 'aluno', 'free', true, 150)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  whatsapp = EXCLUDED.whatsapp,
  instagram = EXCLUDED.instagram,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  stack = EXCLUDED.stack,
  portfolio_url = EXCLUDED.portfolio_url,
  role = EXCLUDED.role,
  subscription_level = EXCLUDED.subscription_level,
  total_points = EXCLUDED.total_points;

-- =============================================
-- 2. SUBSCRIPTIONS
-- =============================================

INSERT INTO public.subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_start, current_period_end)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'cus_test_admin', 'sub_test_admin', 'premium', 'active', now() - interval '30 days', now() + interval '30 days'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'cus_test_mod', 'sub_test_mod', 'premium', 'active', now() - interval '30 days', now() + interval '30 days'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'cus_test_contrib', 'sub_test_contrib', 'pro', 'active', now() - interval '15 days', now() + interval '15 days'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'cus_test_aluno1', 'sub_test_aluno1', 'pro', 'active', now() - interval '10 days', now() + interval '20 days'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', NULL, NULL, 'free', 'active', now(), NULL);

-- =============================================
-- 3. USER PREFERENCES
-- =============================================

INSERT INTO public.user_preferences (user_id, notification_email, notification_push, notification_inapp, profile_visibility)
VALUES
  ('a0000000-0000-0000-0000-000000000001', true, true, true, 'public'),
  ('a0000000-0000-0000-0000-000000000002', true, true, true, 'public'),
  ('a0000000-0000-0000-0000-000000000003', true, false, true, 'members_only'),
  ('a0000000-0000-0000-0000-000000000004', true, true, true, 'public'),
  ('a0000000-0000-0000-0000-000000000005', false, false, true, 'private')
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- 4. TRACKS (2)
-- =============================================

INSERT INTO public.tracks (id, title, slug, description, thumbnail_url, category, difficulty, position, is_published, tier_required)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Trilha IA para Renda', 'trilha-ia-para-renda', 'Aprenda a usar inteligencia artificial para criar fontes de renda. Do basico ao avancado, com projetos praticos.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 'AI', 'beginner', 0, true, 'free'),
  ('b0000000-0000-0000-0000-000000000002', 'Trilha Full-Stack com IA', 'trilha-fullstack-ia', 'Torne-se um desenvolvedor full-stack moderno usando IA como copiloto. Next.js, Supabase, e muito mais.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', 'Development', 'intermediate', 1, true, 'pro');

-- =============================================
-- 5. COURSES (3)
-- =============================================

INSERT INTO public.courses (id, track_id, title, slug, description, thumbnail_url, instructor_id, duration_minutes, tier_required, position, is_published)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'ChatGPT do Zero ao Avancado', 'chatgpt-zero-avancado', 'Domine o ChatGPT: prompts, APIs, automacoes e projetos reais de monetizacao.', 'https://images.unsplash.com/photo-1684163761556-74c1a73bfa22?w=800', 'a0000000-0000-0000-0000-000000000001', 480, 'free', 0, true),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Automacoes com IA usando n8n', 'automacoes-ia-n8n', 'Crie fluxos de automacao poderosos conectando IAs, APIs e ferramentas no-code.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 'a0000000-0000-0000-0000-000000000003', 360, 'pro', 1, true),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Next.js 15 + Supabase', 'nextjs-15-supabase', 'Construa aplicacoes full-stack modernas com Next.js 15, Server Components, e Supabase como backend.', 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800', 'a0000000-0000-0000-0000-000000000001', 600, 'pro', 0, true);

-- =============================================
-- 6. MODULES (6)
-- =============================================

INSERT INTO public.modules (id, course_id, title, slug, description, position)
VALUES
  -- ChatGPT course modules
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Introducao ao ChatGPT', 'intro-chatgpt', 'O que e o ChatGPT, como funciona, e primeiros passos.', 0),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Engenharia de Prompts', 'engenharia-prompts', 'Tecnicas avancadas para extrair o maximo do ChatGPT.', 1),
  -- n8n course modules
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Fundamentos do n8n', 'fundamentos-n8n', 'Instalacao, interface e conceitos basicos de automacao.', 0),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Integrando IAs no n8n', 'integrando-ias-n8n', 'Conecte OpenAI, Claude e outros modelos aos seus fluxos.', 1),
  -- Next.js course modules
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'Fundamentos Next.js 15', 'fundamentos-nextjs-15', 'App Router, Server Components, e nova arquitetura.', 0),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'Supabase como Backend', 'supabase-backend', 'Auth, Database, Storage e Realtime com Supabase.', 1);

-- =============================================
-- 7. LESSONS (15)
-- =============================================

INSERT INTO public.lessons (id, module_id, title, slug, description, video_url, video_source, content_md, duration_minutes, position, is_published, tier_required, tags)
VALUES
  -- Module 1: Intro ChatGPT (3 lessons)
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'O que e o ChatGPT?', 'o-que-e-chatgpt', 'Entenda o que e o ChatGPT, como ele funciona e por que revolucionou a IA.', 'https://youtube.com/watch?v=example1', 'youtube', '# O que e o ChatGPT?\n\nO ChatGPT e um modelo de linguagem...', 15, 0, true, 'free', ARRAY['chatgpt', 'introducao', 'ia']),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Criando sua conta', 'criando-conta-chatgpt', 'Passo a passo para criar e configurar sua conta no ChatGPT.', 'https://youtube.com/watch?v=example2', 'youtube', '# Criando sua conta\n\nVamos configurar...', 10, 1, true, 'free', ARRAY['chatgpt', 'setup']),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Primeiro prompt', 'primeiro-prompt', 'Escreva seu primeiro prompt e entenda a dinamica de conversa.', 'https://youtube.com/watch?v=example3', 'youtube', '# Seu primeiro prompt\n\nVamos escrever...', 20, 2, true, 'free', ARRAY['chatgpt', 'prompts', 'basico']),

  -- Module 2: Prompt Engineering (3 lessons)
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Anatomia de um bom prompt', 'anatomia-bom-prompt', 'Descubra os componentes que tornam um prompt eficaz.', 'https://youtube.com/watch?v=example4', 'youtube', '# Anatomia de um bom prompt\n\nUm prompt eficaz tem...', 25, 0, true, 'free', ARRAY['prompts', 'tecnicas']),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Chain of Thought', 'chain-of-thought', 'Tecnica avancada: faca a IA pensar passo a passo.', 'https://youtube.com/watch?v=example5', 'youtube', '# Chain of Thought\n\nEssa tecnica consiste em...', 30, 1, true, 'pro', ARRAY['prompts', 'avancado', 'chain-of-thought']),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'Few-Shot Learning', 'few-shot-learning', 'Ensine a IA com exemplos para resultados mais precisos.', 'https://youtube.com/watch?v=example6', 'youtube', '# Few-Shot Learning\n\nFornecendo exemplos...', 25, 2, true, 'pro', ARRAY['prompts', 'avancado', 'few-shot']),

  -- Module 3: n8n Fundamentals (3 lessons)
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000003', 'Instalando o n8n', 'instalando-n8n', 'Instale o n8n localmente ou na nuvem.', 'https://youtube.com/watch?v=example7', 'youtube', '# Instalando o n8n\n\nVoce pode instalar via Docker...', 15, 0, true, 'pro', ARRAY['n8n', 'instalacao']),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'Interface e conceitos', 'n8n-interface-conceitos', 'Conheca a interface do n8n e os conceitos fundamentais.', 'https://youtube.com/watch?v=example8', 'youtube', '# Interface do n8n\n\nA interface do n8n...', 20, 1, true, 'pro', ARRAY['n8n', 'interface']),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003', 'Primeiro workflow', 'primeiro-workflow-n8n', 'Crie seu primeiro workflow de automacao.', 'https://youtube.com/watch?v=example9', 'youtube', '# Primeiro workflow\n\nVamos criar um fluxo simples...', 25, 2, true, 'pro', ARRAY['n8n', 'workflow', 'basico']),

  -- Module 4: AI in n8n (2 lessons)
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000004', 'Conectando OpenAI', 'conectando-openai-n8n', 'Integre a API da OpenAI nos seus fluxos n8n.', 'https://youtube.com/watch?v=example10', 'youtube', '# Conectando OpenAI\n\nPrimeiro, obtenha sua API key...', 20, 0, true, 'pro', ARRAY['n8n', 'openai', 'api']),
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', 'Workflow de resumo automatico', 'workflow-resumo-automatico', 'Crie um workflow que resume documentos automaticamente.', 'https://youtube.com/watch?v=example11', 'youtube', '# Resumo Automatico\n\nEste projeto pratico...', 30, 1, true, 'pro', ARRAY['n8n', 'openai', 'projeto']),

  -- Module 5: Next.js Fundamentals (2 lessons)
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'App Router e Server Components', 'app-router-server-components', 'Entenda a nova arquitetura do Next.js 15.', 'https://youtube.com/watch?v=example12', 'youtube', '# App Router\n\nO App Router e a forma moderna...', 30, 0, true, 'pro', ARRAY['nextjs', 'app-router', 'server-components']),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005', 'Rotas e Layouts', 'rotas-layouts-nextjs', 'Organize suas paginas com o sistema de rotas e layouts.', 'https://youtube.com/watch?v=example13', 'youtube', '# Rotas e Layouts\n\nNo Next.js 15, cada pasta...', 25, 1, true, 'pro', ARRAY['nextjs', 'rotas', 'layouts']),

  -- Module 6: Supabase Backend (2 lessons)
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000006', 'Supabase Auth com Next.js', 'supabase-auth-nextjs', 'Implemente autenticacao completa com Supabase e Next.js.', 'https://youtube.com/watch?v=example14', 'youtube', '# Supabase Auth\n\nVamos configurar o Supabase Auth...', 35, 0, true, 'pro', ARRAY['supabase', 'auth', 'nextjs']),
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 'Database e RLS', 'database-rls-supabase', 'Crie tabelas, relacoes e politicas de seguranca com RLS.', 'https://youtube.com/watch?v=example15', 'youtube', '# Database e RLS\n\nO Row Level Security...', 40, 1, true, 'premium', ARRAY['supabase', 'database', 'rls', 'seguranca']);

-- =============================================
-- 8. USER XP + XP TRANSACTIONS
-- =============================================

-- Create user_xp entries first (trigger will also do this, but seed needs them)
INSERT INTO public.user_xp (user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 5000, 6, 15, 30, CURRENT_DATE),
  ('a0000000-0000-0000-0000-000000000002', 3500, 4, 10, 20, CURRENT_DATE),
  ('a0000000-0000-0000-0000-000000000003', 2000, 3, 5, 12, CURRENT_DATE - 1),
  ('a0000000-0000-0000-0000-000000000004', 800, 1, 3, 7, CURRENT_DATE),
  ('a0000000-0000-0000-0000-000000000005', 150, 1, 1, 2, CURRENT_DATE - 3);

-- Sample XP transactions
INSERT INTO public.xp_transactions (user_id, amount, source_type, source_id, description)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000001', 'Completed: O que e o ChatGPT?'),
  ('a0000000-0000-0000-0000-000000000001', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000002', 'Completed: Criando sua conta'),
  ('a0000000-0000-0000-0000-000000000001', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000003', 'Completed: Primeiro prompt'),
  ('a0000000-0000-0000-0000-000000000001', 500, 'course_complete', 'c0000000-0000-0000-0000-000000000001', 'Completed: ChatGPT do Zero ao Avancado'),
  ('a0000000-0000-0000-0000-000000000004', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000001', 'Completed: O que e o ChatGPT?'),
  ('a0000000-0000-0000-0000-000000000004', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000002', 'Completed: Criando sua conta'),
  ('a0000000-0000-0000-0000-000000000004', 50, 'rating', 'e0000000-0000-0000-0000-000000000001', 'Rated: O que e o ChatGPT?'),
  ('a0000000-0000-0000-0000-000000000005', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000001', 'Completed: O que e o ChatGPT?'),
  ('a0000000-0000-0000-0000-000000000003', 100, 'lesson_complete', 'e0000000-0000-0000-0000-000000000007', 'Completed: Instalando o n8n'),
  ('a0000000-0000-0000-0000-000000000003', 200, 'contributor_lesson', gen_random_uuid(), 'Submitted contributor lesson');

-- =============================================
-- 9. BADGES
-- =============================================

INSERT INTO public.badges (id, name, slug, description, icon_url, criteria_type, criteria_value, xp_reward)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Primeira Aula', 'primeira-aula', 'Complete sua primeira aula na plataforma.', '/badges/first-lesson.svg', 'lessons_completed', 1, 50),
  ('f0000000-0000-0000-0000-000000000002', 'Estudante Dedicado', 'estudante-dedicado', 'Complete 10 aulas.', '/badges/dedicated-student.svg', 'lessons_completed', 10, 200),
  ('f0000000-0000-0000-0000-000000000003', 'Primeiro Curso', 'primeiro-curso', 'Complete seu primeiro curso inteiro.', '/badges/first-course.svg', 'courses_completed', 1, 500),
  ('f0000000-0000-0000-0000-000000000004', 'Streak de 7 dias', 'streak-7-dias', 'Mantenha uma sequencia de 7 dias consecutivos.', '/badges/streak-7.svg', 'streak_days', 7, 300),
  ('f0000000-0000-0000-0000-000000000005', 'Contribuidor', 'contribuidor-badge', 'Tenha um item aprovado no marketplace.', '/badges/contributor.svg', 'marketplace_items', 1, 500),
  ('f0000000-0000-0000-0000-000000000006', 'Comentarista', 'comentarista', 'Faca 10 comentarios na plataforma.', '/badges/commentator.svg', 'comments_posted', 10, 150),
  ('f0000000-0000-0000-0000-000000000007', '1000 XP', 'xp-1000', 'Alcance 1000 pontos de XP.', '/badges/xp-1000.svg', 'total_points', 1000, 100);

-- Award some badges
INSERT INTO public.user_badges (user_id, badge_id, earned_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', now() - interval '60 days'),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', now() - interval '15 days'),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', now() - interval '10 days'),
  ('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000007', now() - interval '45 days'),
  ('a0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', now() - interval '2 days');

-- =============================================
-- 10. CHANNELS (2) WITH POSTS
-- =============================================

INSERT INTO public.channels (id, name, slug, description, image_url, type, visibility, tier_required, position, is_archived, created_by)
VALUES
  ('a7000000-0000-0000-0000-000000000001', 'Geral', 'geral', 'Canal para discussoes gerais, apresentacoes e networking da comunidade.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', 'general', 'public', 'free', 0, false, 'a0000000-0000-0000-0000-000000000001'),
  ('a7000000-0000-0000-0000-000000000002', 'IA na Pratica', 'ia-na-pratica', 'Compartilhe projetos, duvidas e descobertas sobre IA aplicada.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', 'topic', 'public', 'free', 1, false, 'a0000000-0000-0000-0000-000000000001');

-- Channel tabs
INSERT INTO public.channel_tabs (id, channel_id, name, slug, type, position)
VALUES
  ('a8000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000001', 'Discussao', 'discussao', 'discussion', 0),
  ('a8000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000001', 'Recursos', 'recursos', 'resources', 1),
  ('a8000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000002', 'Discussao', 'discussao', 'discussion', 0),
  ('a8000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000002', 'Eventos', 'eventos', 'events', 1);

-- Posts
INSERT INTO public.posts (id, channel_id, tab_id, author_id, title, content_md, images, is_pinned, likes_count, comments_count, status)
VALUES
  ('a9000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000001', 'a8000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Bem-vindos a AutomatikClub!', 'Ola, comunidade! Este e o espaco oficial para nos conectarmos, aprendermos juntos e construirmos o futuro com IA.\n\nRegras basicas:\n1. Seja respeitoso\n2. Compartilhe conhecimento\n3. Ajude os colegas\n\nBora automatizar!', ARRAY[]::TEXT[], true, 12, 3, 'published'),
  ('a9000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000001', 'a8000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Me apresentando!', 'Oi pessoal! Sou a Ana, tenho 28 anos e estou migrando de marketing para dev. Comecei o curso de ChatGPT e estou amando! Alguem mais aqui em transicao de carreira?', ARRAY[]::TEXT[], false, 5, 2, 'published'),
  ('a9000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000002', 'a8000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Dica: Usando Claude para code review', 'Descobri um workflow incrivel usando Claude para revisar codigo automaticamente.\n\n1. Conecte o GitHub no n8n\n2. Trigger no PR\n3. Envie o diff para Claude\n4. Post o review como comentario\n\nAlguem ja fez algo parecido?', ARRAY[]::TEXT[], false, 8, 1, 'published'),
  ('a9000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000002', 'a8000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Live: IA generativa na pratica', 'Vamos fazer uma live na sexta-feira as 19h sobre como usar IA generativa em projetos reais.\n\nTopicos:\n- Geracao de imagens com DALL-E\n- Automacao de textos\n- Chatbots personalizados\n\nQuem vem?', ARRAY[]::TEXT[], false, 15, 4, 'published');

-- Post likes
INSERT INTO public.post_likes (post_id, user_id)
VALUES
  ('a9000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
  ('a9000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'),
  ('a9000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004'),
  ('a9000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005'),
  ('a9000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('a9000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'),
  ('a9000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('a9000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004'),
  ('a9000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001'),
  ('a9000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003'),
  ('a9000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004'),
  ('a9000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005');

-- Comments on posts
INSERT INTO public.comments (id, commentable_type, commentable_id, author_id, parent_id, content, status, depth)
VALUES
  ('ab000000-0000-0000-0000-000000000001', 'post', 'a9000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', NULL, 'Que legal! Animada para aprender aqui!', 'approved', 0),
  ('ab000000-0000-0000-0000-000000000002', 'post', 'a9000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ab000000-0000-0000-0000-000000000001', 'Bem-vinda, Ana! Qualquer duvida e so perguntar.', 'approved', 1),
  ('ab000000-0000-0000-0000-000000000003', 'post', 'a9000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', NULL, 'Eu tambem estou em transicao! Vamos trocar experiencias.', 'approved', 0),
  ('ab000000-0000-0000-0000-000000000004', 'post', 'a9000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', NULL, 'Excelente dica, Carlos! Vou testar esse workflow.', 'approved', 0),
  ('ab000000-0000-0000-0000-000000000005', 'post', 'a9000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', NULL, 'Vou estar la! Quero aprender sobre chatbots.', 'approved', 0);

-- =============================================
-- 11. MARKETPLACE ITEMS (3)
-- =============================================

INSERT INTO public.marketplace_items (id, title, slug, type, description_md, thumbnail_url, external_url, author_id, avg_rating, review_count, download_count, tags, status, tier_required)
VALUES
  ('ac000000-0000-0000-0000-000000000001', 'Template: Landing Page com IA', 'template-landing-page-ia', 'template', '# Landing Page com IA\n\nTemplate completo de landing page com chatbot integrado.\n\n## Features\n- Design responsivo\n- Chatbot com OpenAI\n- Deploy em 1 click no Vercel', 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400', 'https://github.com/example/landing-ia', 'a0000000-0000-0000-0000-000000000003', 4.50, 2, 15, ARRAY['template', 'landing-page', 'chatbot', 'nextjs'], 'approved', 'free'),
  ('ac000000-0000-0000-0000-000000000002', 'Skill: Prompt Engineering Avancado', 'skill-prompt-engineering-avancado', 'skill', '# Prompt Engineering Avancado\n\nGuia completo de tecnicas avancadas de prompts.\n\n## Conteudo\n- Chain of Thought\n- Few-Shot Learning\n- Constitutional AI\n- Tree of Thoughts', 'https://images.unsplash.com/photo-1684163761556-74c1a73bfa22?w=400', 'https://github.com/example/prompt-eng', 'a0000000-0000-0000-0000-000000000001', 5.00, 1, 30, ARRAY['prompts', 'ia', 'avancado'], 'approved', 'pro'),
  ('ac000000-0000-0000-0000-000000000003', 'GitHub: Bot de Atendimento n8n', 'github-bot-atendimento-n8n', 'github_project', '# Bot de Atendimento com n8n\n\nBot completo de atendimento ao cliente usando n8n + OpenAI.\n\nInclui workflows prontos para importar.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', 'https://github.com/example/bot-n8n', 'a0000000-0000-0000-0000-000000000003', 4.00, 1, 8, ARRAY['n8n', 'bot', 'atendimento', 'openai'], 'approved', 'free');

-- Marketplace reviews
INSERT INTO public.marketplace_reviews (item_id, user_id, rating, content)
VALUES
  ('ac000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 5, 'Template excelente! Fiz deploy em 10 minutos.'),
  ('ac000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 4, 'Muito bom, so faltou documentacao mais detalhada.'),
  ('ac000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 5, 'Melhor guia de prompts que ja vi!'),
  ('ac000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 4, 'Funcionou muito bem. Recomendo.');

-- =============================================
-- 12. SAMPLE LESSON PROGRESS
-- =============================================

INSERT INTO public.user_lesson_progress (user_id, lesson_id, progress_percentage, is_completed, completed_at, last_watched_at)
VALUES
  -- Admin completed first 3 lessons
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 100, true, now() - interval '30 days', now() - interval '30 days'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 100, true, now() - interval '29 days', now() - interval '29 days'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 100, true, now() - interval '28 days', now() - interval '28 days'),
  -- Ana completed 2 lessons, in progress on 3rd
  ('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 100, true, now() - interval '5 days', now() - interval '5 days'),
  ('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 100, true, now() - interval '4 days', now() - interval '4 days'),
  ('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', 65, false, NULL, now() - interval '1 day'),
  -- Bruno completed 1 lesson (free tier)
  ('a0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 100, true, now() - interval '2 days', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 45, false, NULL, now() - interval '1 day');

-- Lesson ratings
INSERT INTO public.lesson_ratings (user_id, lesson_id, rating, feedback)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 5, 'Otima introducao!'),
  ('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 5, 'Muito claro e didatico.'),
  ('a0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 4, 'Bom, mas poderia ser mais longo.'),
  ('a0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 4, 'Simples e direto ao ponto.');

-- =============================================
-- 13. CHALLENGES
-- =============================================

INSERT INTO public.challenges (id, title, description, criteria_type, criteria_value, xp_reward, starts_at, ends_at, status, created_by)
VALUES
  ('ad000000-0000-0000-0000-000000000001', 'Maratona de Abril', 'Complete 5 aulas durante o mes de abril e ganhe XP bonus!', 'lessons_completed', 5, 500, '2026-04-01'::timestamptz, '2026-04-30 23:59:59'::timestamptz, 'active', 'a0000000-0000-0000-0000-000000000001'),
  ('ad000000-0000-0000-0000-000000000002', 'Primeiro Comentario', 'Faca seu primeiro comentario em uma aula ou post.', 'comments_posted', 1, 100, '2026-04-01'::timestamptz, '2026-06-30 23:59:59'::timestamptz, 'active', 'a0000000-0000-0000-0000-000000000001');

-- Challenge participations
INSERT INTO public.challenge_participations (challenge_id, user_id, enrolled_at, completed_at)
VALUES
  ('ad000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', now() - interval '5 days', NULL),
  ('ad000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', now() - interval '3 days', NULL),
  ('ad000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', now() - interval '5 days', now() - interval '4 days'),
  ('ad000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', now() - interval '2 days', now() - interval '1 day');

-- =============================================
-- 14. NEWSLETTERS
-- =============================================

INSERT INTO public.newsletters (title, slug, content_html, status, sent_at, created_by)
VALUES
  ('Lancamento da AutomatikClub!', 'lancamento-automatikclub', '<h1>Bem-vindos!</h1><p>A AutomatikClub esta oficialmente no ar. Venha aprender IA conosco!</p>', 'sent', now() - interval '7 days', 'a0000000-0000-0000-0000-000000000001'),
  ('Novidades de Abril 2026', 'novidades-abril-2026', '<h1>Novidades</h1><p>Novos cursos, desafios e muito mais neste mes!</p>', 'draft', NULL, 'a0000000-0000-0000-0000-000000000001');

-- Newsletter subscribers
INSERT INTO public.newsletter_subscribers (email, user_id, is_active)
VALUES
  ('admin@automatikclub.com', 'a0000000-0000-0000-0000-000000000001', true),
  ('moderador@automatikclub.com', 'a0000000-0000-0000-0000-000000000002', true),
  ('contrib@automatikclub.com', 'a0000000-0000-0000-0000-000000000003', true),
  ('aluno1@automatikclub.com', 'a0000000-0000-0000-0000-000000000004', true),
  ('externo@gmail.com', NULL, true);

-- =============================================
-- 15. BOOKS
-- =============================================

INSERT INTO public.books (title, author_name, description, cover_url, purchase_url, tags, created_by)
VALUES
  ('AI Superpowers', 'Kai-Fu Lee', 'Como a China e o Vale do Silicio estao moldando o futuro da IA.', 'https://images-na.ssl-images-amazon.com/images/I/71example.jpg', 'https://amazon.com.br/dp/B0example1', ARRAY['ia', 'negocios', 'futuro'], 'a0000000-0000-0000-0000-000000000001'),
  ('The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'O classico sobre como ser um programador melhor.', 'https://images-na.ssl-images-amazon.com/images/I/71example2.jpg', 'https://amazon.com.br/dp/B0example2', ARRAY['programacao', 'carreira', 'classico'], 'a0000000-0000-0000-0000-000000000001');

-- =============================================
-- 16. REFRESH MATERIALIZED VIEWS
-- =============================================

REFRESH MATERIALIZED VIEW public.leaderboard_weekly;
REFRESH MATERIALIZED VIEW public.leaderboard_alltime;
REFRESH MATERIALIZED VIEW public.course_stats;
