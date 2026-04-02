# AutomatikLabs — Arquitetura de Seguranca

> **Versao:** 1.0.0
> **Data:** 2026-04-01
> **Status:** Aprovado
> **Classificacao:** Confidencial — uso interno
> **Autor:** Security Architect, AutomatikLabs

---

## Sumario

1. [Fluxo de Autenticacao](#1-fluxo-de-autenticacao)
2. [Autorizacao — Matriz de Roles e Permissoes](#2-autorizacao--matriz-de-roles-e-permissoes)
3. [Row Level Security (RLS) Policies](#3-row-level-security-rls-policies)
4. [Edge Middleware — Security Chain](#4-edge-middleware--security-chain)
5. [Seguranca de API](#5-seguranca-de-api)
6. [Conformidade LGPD](#6-conformidade-lgpd)
7. [Seguranca do AI Feed](#7-seguranca-do-ai-feed)
8. [Seguranca de Storage](#8-seguranca-de-storage)
9. [Modelo de Ameacas STRIDE](#9-modelo-de-ameacas-stride)
10. [Checklist OWASP Top 10](#10-checklist-owasp-top-10)
11. [Checklist Pre-Lancamento](#11-checklist-pre-lancamento)

---

## 1. Fluxo de Autenticacao

### 1.1 Provider: Supabase Auth (GoTrue)

Supabase Auth e o unico provider de identidade. Ele emite JWTs que integram nativamente com RLS via `auth.uid()` e `auth.jwt()`.

### 1.2 Metodos de Login

| Metodo | Fluxo | Notas |
|---|---|---|
| **Magic Link** | Email → Link com OTP → Callback `/api/auth/callback` → Session | Metodo primario. Link expira em 10 minutos. Single-use token. |
| **Google OAuth** | Redirect → Google consent → Callback → Session | `prompt=consent` forcado no primeiro login. Scopes: `email`, `profile`. |
| **Email + Senha** | Form → `supabase.auth.signUp()` → Email de confirmacao → Session | Fallback. Senha minima: 8 chars, 1 maiuscula, 1 numero. |

### 1.3 JWT — Custom Claims

Apos login, um Database Webhook (trigger `on_auth_user_created`) popula custom claims no JWT via a funcao `set_claim()`:

```sql
-- supabase/migrations/00003_auth_claims.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Criar perfil padrao
  INSERT INTO public.user_profiles (id, email, role, subscription_level)
  VALUES (
    NEW.id,
    NEW.email,
    'aluno',        -- role padrao
    'free'          -- tier padrao
  );

  -- Setar custom claims no JWT
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data ||
    json_build_object(
      'role', 'aluno',
      'subscription_level', 'free'
    )::jsonb
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Estrutura do JWT payload:**

```json
{
  "sub": "uuid-do-usuario",
  "email": "user@example.com",
  "app_metadata": {
    "role": "aluno | contribuidor | moderador | admin",
    "subscription_level": "free | pro | premium"
  },
  "exp": 1712000000,
  "iat": 1711996400
}
```

**Acessar claims no RLS:**

```sql
-- Role do usuario
(auth.jwt() -> 'app_metadata' ->> 'role')

-- Nivel de assinatura
(auth.jwt() -> 'app_metadata' ->> 'subscription_level')
```

### 1.4 Sincronizacao de Claims

Quando o role ou subscription_level muda (upgrade de plano, promocao a moderador), as claims devem ser atualizadas:

```sql
CREATE OR REPLACE FUNCTION public.sync_user_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data ||
    json_build_object(
      'role', NEW.role,
      'subscription_level', NEW.subscription_level
    )::jsonb
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  AFTER UPDATE OF role, subscription_level ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role
    OR OLD.subscription_level IS DISTINCT FROM NEW.subscription_level)
  EXECUTE FUNCTION public.sync_user_claims();
```

**IMPORTANTE:** O JWT atualizado so sera refletido apos o proximo refresh token. O middleware deve forcar refresh quando detectar divergencia.

### 1.5 Session Management

| Parametro | Valor | Justificativa |
|---|---|---|
| **Cookie name** | `sb-<project-ref>-auth-token` | Padrao Supabase |
| **httpOnly** | `true` | Impede acesso via JavaScript (mitiga XSS) |
| **Secure** | `true` | Apenas HTTPS |
| **SameSite** | `Lax` | Permite navegacao normal, bloqueia CSRF cross-origin POST |
| **Path** | `/` | Disponivel em toda a aplicacao |
| **Max-Age** | `604800` (7 dias) | Refresh token renova antes de expirar |

### 1.6 Refresh Token Rotation

```typescript
// src/shared/lib/supabase/middleware.ts

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          })
        },
      },
    }
  )

  // IMPORTANTE: getUser() valida o JWT com o servidor Supabase
  // NAO usar getSession() sozinho — ele apenas decodifica localmente
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // Token invalido/expirado e refresh falhou — limpar sessao
    if (isProtectedRoute(request.nextUrl.pathname)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = ['/feed', '/learn', '/community', '/settings', '/admin']
  return protectedPrefixes.some(prefix => pathname.startsWith(prefix))
}
```

**Fluxo de refresh:**

1. Browser faz request → Edge Middleware intercepta
2. Middleware chama `supabase.auth.getUser()` que automaticamente tenta refresh se o access token expirou
3. Se refresh succeeds: novo access token + novo refresh token (rotation) setados via `setAll` cookies
4. Se refresh fails (token revogado/expirado): redirect para `/login`
5. Refresh token antigo e invalidado apos uso (one-time use)

### 1.7 Logout

```typescript
// src/features/auth/actions/logout.ts
'use server'

import { createServerClient } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createServerClient()

  // signOut invalida o refresh token no servidor
  // scope: 'global' invalida TODAS as sessoes do usuario
  await supabase.auth.signOut({ scope: 'local' })

  redirect('/login')
}
```

---

## 2. Autorizacao — Matriz de Roles e Permissoes

### 2.1 Hierarquia de Roles

```
admin (4) > moderador (3) > contribuidor (2) > aluno (1)
```

Cada role herda todas as permissoes do role inferior.

### 2.2 Niveis de Assinatura (Subscription Levels)

```
premium > pro > free
```

Subscription level e **ortogonal** ao role — um `aluno` pode ser `premium`, um `contribuidor` pode ser `free`.

### 2.3 Matriz Completa de Permissoes

#### Conteudo Educacional (Cursos, Modulos, Licoes)

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Visualizar curso (free) | V | V | V | V |
| Visualizar curso (pro) | Pro+ | Pro+ | V | V |
| Visualizar curso (premium) | Premium | Premium | V | V |
| Marcar progresso | V | V | V | V |
| Avaliar licao | V | V | V | V |
| Criar learning path | - | V | V | V |
| Criar curso | - | V (draft) | V | V |
| Publicar curso | - | - | V | V |
| Editar qualquer curso | - | - | V | V |
| Deletar curso | - | - | - | V |

#### Comentarios

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Criar comentario | V | V | V | V |
| Editar proprio comentario | V | V | V | V |
| Deletar proprio comentario | V | V | V | V |
| Deletar qualquer comentario | - | - | V | V |
| Fixar comentario | - | - | V | V |
| Reportar comentario | V | V | V | V |

#### Feed da Comunidade (Posts)

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Visualizar feed | V | V | V | V |
| Criar post | V | V | V | V |
| Reagir a post | V | V | V | V |
| Comentar em post | V | V | V | V |
| Editar proprio post | V | V | V | V |
| Deletar proprio post | V | V | V | V |
| Deletar qualquer post | - | - | V | V |
| Criar canal | - | - | V | V |
| Gerenciar canal tabs | - | - | V | V |

#### Marketplace

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Visualizar marketplace | V | V | V | V |
| Comprar item | V (com pontos) | V | V | V |
| Criar item no marketplace | - | V | V | V |
| Avaliar item comprado | V | V | V | V |
| Aprovar item | - | - | V | V |
| Remover qualquer item | - | - | - | V |

#### AI Feed

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Visualizar AI feed | V | V | V | V |
| Gerar API key | - | V (Pro+) | V | V |
| Publicar via API | - | V (pending) | V (auto-approve) | V (auto-approve) |
| Reagir a AI post | V | V | V | V |
| Aprovar AI post | - | - | V | V |
| Deletar qualquer AI post | - | - | V | V |

#### Newsletter

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Receber newsletter | V (opt-in) | V (opt-in) | V | V |
| Criar newsletter | - | - | - | V |
| Enviar newsletter | - | - | - | V |
| Gerenciar templates | - | - | - | V |

#### Gestao de Usuarios

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Ver proprio perfil | V | V | V | V |
| Editar proprio perfil | V | V | V | V |
| Ver perfil publico de outros | V | V | V | V |
| Listar todos os membros | - | - | V | V |
| Promover/rebaixar role | - | - | - | V |
| Banir usuario | - | - | V (temp) | V (perm) |
| Deletar conta de outro | - | - | - | V |

#### Configuracoes da Plataforma

| Acao | aluno | contribuidor | moderador | admin |
|---|:---:|:---:|:---:|:---:|
| Configuracoes pessoais | V | V | V | V |
| Gamification settings | - | - | - | V |
| Billing/Stripe settings | - | - | - | V |
| Feature flags | - | - | - | V |
| RLS policies (via dashboard) | - | - | - | V |

### 2.4 Helper Functions para Autorizacao

```typescript
// src/shared/lib/auth/permissions.ts

type Role = 'aluno' | 'contribuidor' | 'moderador' | 'admin'
type SubscriptionLevel = 'free' | 'pro' | 'premium'

const ROLE_HIERARCHY: Record<Role, number> = {
  aluno: 1,
  contribuidor: 2,
  moderador: 3,
  admin: 4,
}

const SUBSCRIPTION_HIERARCHY: Record<SubscriptionLevel, number> = {
  free: 1,
  pro: 2,
  premium: 3,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function hasSubscription(
  userLevel: SubscriptionLevel,
  requiredLevel: SubscriptionLevel
): boolean {
  return SUBSCRIPTION_HIERARCHY[userLevel] >= SUBSCRIPTION_HIERARCHY[requiredLevel]
}

export function canAccessContent(
  userRole: Role,
  userSubscription: SubscriptionLevel,
  contentSubscription: SubscriptionLevel
): boolean {
  // Moderadores e admins acessam tudo independente de subscription
  if (hasRole(userRole, 'moderador')) return true
  return hasSubscription(userSubscription, contentSubscription)
}
```

```sql
-- Funcao SQL equivalente para uso em RLS policies
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role TEXT;
  role_levels JSONB := '{"aluno":1,"contribuidor":2,"moderador":3,"admin":4}'::jsonb;
BEGIN
  user_role := (auth.jwt() -> 'app_metadata' ->> 'role');

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN (role_levels ->> user_role)::int >= (role_levels ->> required_role)::int;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_subscription(required_level TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_level TEXT;
  sub_levels JSONB := '{"free":1,"pro":2,"premium":3}'::jsonb;
BEGIN
  -- Moderadores e admins bypassam subscription check
  IF public.has_role('moderador') THEN
    RETURN TRUE;
  END IF;

  user_level := (auth.jwt() -> 'app_metadata' ->> 'subscription_level');

  IF user_level IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN (sub_levels ->> user_level)::int >= (sub_levels ->> required_level)::int;
END;
$$;
```

---

## 3. Row Level Security (RLS) Policies

**Principio:** Toda tabela tem RLS habilitado. Nenhuma tabela permite acesso sem policy explicita. Isso garante que mesmo bugs no backend nao exponham dados.

### 3.1 Funcoes Helper Compartilhadas

```sql
-- Retorna o user_id autenticado (alias para clareza)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Verifica se o usuario e dono do recurso
CREATE OR REPLACE FUNCTION public.is_owner(resource_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = resource_user_id;
$$;
```

### 3.2 Policies por Tabela

> **Convencao de nomes:** `{tabela}_{operacao}_{quem}` (ex: `user_profiles_select_own`)

---

#### `user_profiles`

```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver perfis publicos (nome, avatar, bio)
CREATE POLICY user_profiles_select_public ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas o dono pode ver seus dados privados (cpf, email, whatsapp)
-- NOTA: campos sensiveis sao filtrados via view ou column-level security
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Impedir que usuario altere seu proprio role ou subscription
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    AND subscription_level = (SELECT subscription_level FROM public.user_profiles WHERE id = auth.uid())
  );

-- Apenas admins podem alterar role/subscription de outros
CREATE POLICY user_profiles_update_admin ON public.user_profiles
  FOR UPDATE
  USING (public.has_role('admin'));

-- Insert via trigger on_auth_user_created apenas
CREATE POLICY user_profiles_insert_trigger ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Apenas admins podem deletar perfis (LGPD: user deleta via funcao especifica)
CREATE POLICY user_profiles_delete_admin ON public.user_profiles
  FOR DELETE
  USING (public.has_role('admin') OR auth.uid() = id);
```

---

#### `learning_paths`

```sql
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver learning paths publicados
CREATE POLICY learning_paths_select_published ON public.learning_paths
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      published = true
      OR author_id = auth.uid()         -- autor ve seus proprios drafts
      OR public.has_role('moderador')    -- moderadores veem tudo
    )
  );

-- Contribuidores+ podem criar
CREATE POLICY learning_paths_insert ON public.learning_paths
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND author_id = auth.uid()
  );

-- Autor pode editar seus proprios, moderadores+ editam qualquer
CREATE POLICY learning_paths_update ON public.learning_paths
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR public.has_role('moderador')
  );

-- Apenas admins podem deletar
CREATE POLICY learning_paths_delete ON public.learning_paths
  FOR DELETE
  USING (public.has_role('admin'));
```

---

#### `courses`

```sql
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Select: conteudo publicado visivel conforme subscription level
CREATE POLICY courses_select ON public.courses
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Cursos publicados acessiveis pelo nivel do usuario
      (published = true AND public.has_subscription(subscription_level))
      -- Autor ve seus proprios drafts
      OR author_id = auth.uid()
      -- Moderadores+ veem tudo
      OR public.has_role('moderador')
    )
  );

-- Contribuidores+ podem criar cursos (sempre em draft)
CREATE POLICY courses_insert ON public.courses
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND author_id = auth.uid()
    AND published = false  -- forcado draft na criacao
  );

-- Autor edita seus, moderadores+ editam qualquer
CREATE POLICY courses_update ON public.courses
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR public.has_role('moderador')
  )
  WITH CHECK (
    -- Apenas moderadores+ podem publicar
    CASE
      WHEN published = true THEN public.has_role('moderador')
      ELSE true
    END
  );

-- Apenas admins deletam
CREATE POLICY courses_delete ON public.courses
  FOR DELETE
  USING (public.has_role('admin'));
```

---

#### `modules`

```sql
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Modulos seguem a visibilidade do curso pai
CREATE POLICY modules_select ON public.modules
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      -- O select policy do courses ja filtra por subscription
    )
  );

-- Contribuidores+ podem criar modulos para seus cursos
CREATE POLICY modules_insert ON public.modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND (c.author_id = auth.uid() OR public.has_role('moderador'))
    )
  );

-- Mesma logica para update
CREATE POLICY modules_update ON public.modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND (c.author_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY modules_delete ON public.modules
  FOR DELETE
  USING (public.has_role('admin'));
```

---

#### `lessons`

```sql
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Licoes seguem a visibilidade do modulo/curso pai
CREATE POLICY lessons_select ON public.lessons
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (
        (c.published = true AND public.has_subscription(c.subscription_level))
        OR c.author_id = auth.uid()
        OR public.has_role('moderador')
      )
    )
  );

-- Contribuidores+ criam licoes para seus cursos
CREATE POLICY lessons_insert ON public.lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (c.author_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY lessons_update ON public.lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (c.author_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY lessons_delete ON public.lessons
  FOR DELETE
  USING (public.has_role('admin'));
```

---

#### `user_lesson_progress`

```sql
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Usuarios so veem seu proprio progresso
CREATE POLICY progress_select_own ON public.user_lesson_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios so podem criar/atualizar seu proprio progresso
CREATE POLICY progress_insert_own ON public.user_lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY progress_update_own ON public.user_lesson_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem ver progresso de todos (analytics)
CREATE POLICY progress_select_admin ON public.user_lesson_progress
  FOR SELECT
  USING (public.has_role('admin'));

-- Ninguem deleta progresso (soft delete se necessario)
-- Exceto LGPD account deletion via service_role
```

---

#### `lesson_ratings`

```sql
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver ratings (media, contagem)
CREATE POLICY ratings_select ON public.lesson_ratings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas uma avaliacao por usuario por licao (enforce via UNIQUE constraint + policy)
CREATE POLICY ratings_insert ON public.lesson_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Pode atualizar sua propria avaliacao
CREATE POLICY ratings_update ON public.lesson_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Apenas admins deletam
CREATE POLICY ratings_delete ON public.lesson_ratings
  FOR DELETE
  USING (public.has_role('admin') OR auth.uid() = user_id);
```

---

#### `comments`

```sql
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Todos veem comentarios nao deletados
CREATE POLICY comments_select ON public.comments
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND deleted_at IS NULL
  );

-- Qualquer autenticado pode comentar
CREATE POLICY comments_insert ON public.comments
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Dono edita seu comentario
CREATE POLICY comments_update_own ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Moderadores+ podem soft-delete qualquer comentario
CREATE POLICY comments_delete_mod ON public.comments
  FOR UPDATE
  USING (public.has_role('moderador'));

-- Dono pode soft-delete seu proprio
CREATE POLICY comments_delete_own ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id);
```

---

#### `point_transactions`

```sql
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Usuarios veem suas proprias transacoes de pontos
CREATE POLICY points_select_own ON public.point_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas insert via service_role (triggers internos)
-- Nenhuma policy de INSERT para anon/authenticated
-- Admins veem todas as transacoes
CREATE POLICY points_select_admin ON public.point_transactions
  FOR SELECT
  USING (public.has_role('admin'));
```

---

#### `badges` e `user_badges`

```sql
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Todos veem badges disponiveis
CREATE POLICY badges_select ON public.badges
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas admins gerenciam badges
CREATE POLICY badges_manage ON public.badges
  FOR ALL
  USING (public.has_role('admin'));

-- Usuarios veem seus proprios badges e badges de outros (leaderboard)
CREATE POLICY user_badges_select ON public.user_badges
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert apenas via triggers/service_role
```

---

#### `challenges` e `challenge_participations`

```sql
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

-- Desafios ativos visiveis para todos autenticados
CREATE POLICY challenges_select ON public.challenges
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'active' OR public.has_role('moderador'))
  );

-- Moderadores+ criam desafios
CREATE POLICY challenges_insert ON public.challenges
  FOR INSERT
  WITH CHECK (public.has_role('moderador'));

CREATE POLICY challenges_update ON public.challenges
  FOR UPDATE
  USING (public.has_role('moderador'));

-- Participacoes
CREATE POLICY participations_select ON public.challenge_participations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role('moderador')
  );

CREATE POLICY participations_insert ON public.challenge_participations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY participations_update ON public.challenge_participations
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role('moderador'));
```

---

#### `marketplace_items` e `marketplace_reviews`

```sql
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Itens aprovados visiveis para todos
CREATE POLICY marketplace_items_select ON public.marketplace_items
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'approved' OR seller_id = auth.uid() OR public.has_role('moderador'))
  );

-- Contribuidores+ podem criar itens (pendente aprovacao)
CREATE POLICY marketplace_items_insert ON public.marketplace_items
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND seller_id = auth.uid()
    AND status = 'pending_approval'
  );

-- Dono edita seus itens, moderadores+ editam qualquer
CREATE POLICY marketplace_items_update ON public.marketplace_items
  FOR UPDATE
  USING (seller_id = auth.uid() OR public.has_role('moderador'));

-- Apenas admins deletam
CREATE POLICY marketplace_items_delete ON public.marketplace_items
  FOR DELETE
  USING (public.has_role('admin'));

-- Reviews: quem comprou pode avaliar
CREATE POLICY reviews_select ON public.marketplace_reviews
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY reviews_insert ON public.marketplace_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.marketplace_purchases
      WHERE user_id = auth.uid() AND item_id = marketplace_reviews.item_id
    )
  );

CREATE POLICY reviews_update_own ON public.marketplace_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY reviews_delete ON public.marketplace_reviews
  FOR DELETE
  USING (auth.uid() = user_id OR public.has_role('admin'));
```

---

#### `channels` e `channel_tabs`

```sql
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_tabs ENABLE ROW LEVEL SECURITY;

-- Canais visiveis para o nivel de acesso correspondente
CREATE POLICY channels_select ON public.channels
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      visibility = 'public'
      OR public.has_subscription(required_subscription)
      OR public.has_role('moderador')
    )
  );

-- Moderadores+ gerenciam canais
CREATE POLICY channels_manage ON public.channels
  FOR ALL
  USING (public.has_role('moderador'));

-- Tabs seguem o canal
CREATE POLICY channel_tabs_select ON public.channel_tabs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
    )
  );

CREATE POLICY channel_tabs_manage ON public.channel_tabs
  FOR ALL
  USING (public.has_role('moderador'));
```

---

#### `posts`, `post_reactions`, `post_comments`

```sql
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Posts visiveis conforme canal
CREATE POLICY posts_select ON public.posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
      AND (
        c.visibility = 'public'
        OR public.has_subscription(c.required_subscription)
        OR public.has_role('moderador')
      )
    )
  );

-- Qualquer autenticado cria post (no canal que tem acesso)
CREATE POLICY posts_insert ON public.posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
      AND (
        c.visibility = 'public'
        OR public.has_subscription(c.required_subscription)
        OR public.has_role('moderador')
      )
    )
  );

-- Dono edita seus posts, moderadores+ editam qualquer
CREATE POLICY posts_update ON public.posts
  FOR UPDATE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

-- Dono deleta seus, moderadores+ deletam qualquer
CREATE POLICY posts_delete ON public.posts
  FOR DELETE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

-- Reactions
CREATE POLICY reactions_select ON public.post_reactions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY reactions_insert ON public.post_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reactions_delete ON public.post_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Post comments
CREATE POLICY post_comments_select ON public.post_comments
  FOR SELECT
  USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

CREATE POLICY post_comments_insert ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY post_comments_update_own ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role('moderador'));

CREATE POLICY post_comments_delete ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id OR public.has_role('moderador'));
```

---

#### `ai_feed_posts` e `ai_feed_reactions`

```sql
ALTER TABLE public.ai_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feed_reactions ENABLE ROW LEVEL SECURITY;

-- Posts aprovados visiveis para todos, pendentes visiveis para autor e moderadores
CREATE POLICY ai_feed_posts_select ON public.ai_feed_posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'approved'
      OR author_id = auth.uid()
      OR public.has_role('moderador')
    )
  );

-- Insert via API key (service_role) — nao diretamente pelo client
-- Backup: contribuidores Pro+ podem inserir com status pending
CREATE POLICY ai_feed_posts_insert ON public.ai_feed_posts
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND author_id = auth.uid()
    AND status = 'pending_approval'
  );

-- Moderadores+ aprovam/rejeitam
CREATE POLICY ai_feed_posts_update ON public.ai_feed_posts
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR public.has_role('moderador')
  );

CREATE POLICY ai_feed_posts_delete ON public.ai_feed_posts
  FOR DELETE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

-- Reactions
CREATE POLICY ai_reactions_select ON public.ai_feed_reactions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY ai_reactions_insert ON public.ai_feed_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ai_reactions_delete ON public.ai_feed_reactions
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

#### `community_lessons`

```sql
ALTER TABLE public.community_lessons ENABLE ROW LEVEL SECURITY;

-- Licoes da comunidade aprovadas visiveis para todos
CREATE POLICY community_lessons_select ON public.community_lessons
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'approved' OR author_id = auth.uid() OR public.has_role('moderador'))
  );

-- Contribuidores+ criam (pendente aprovacao)
CREATE POLICY community_lessons_insert ON public.community_lessons
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND author_id = auth.uid()
    AND status = 'pending_approval'
  );

CREATE POLICY community_lessons_update ON public.community_lessons
  FOR UPDATE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

CREATE POLICY community_lessons_delete ON public.community_lessons
  FOR DELETE
  USING (author_id = auth.uid() OR public.has_role('admin'));
```

---

#### `newsletters`

```sql
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Newsletters enviadas visiveis para todos autenticados
CREATE POLICY newsletters_select ON public.newsletters
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'sent' OR public.has_role('admin'))
  );

-- Apenas admins gerenciam newsletters
CREATE POLICY newsletters_manage ON public.newsletters
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY newsletters_update ON public.newsletters
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY newsletters_delete ON public.newsletters
  FOR DELETE
  USING (public.has_role('admin'));
```

---

#### `books`

```sql
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books visiveis conforme subscription level
CREATE POLICY books_select ON public.books
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      public.has_subscription(required_subscription)
      OR public.has_role('moderador')
    )
  );

-- Apenas admins gerenciam books
CREATE POLICY books_manage ON public.books
  FOR ALL
  USING (public.has_role('admin'));
```

---

#### `ai_api_keys`

```sql
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;

-- Usuarios so veem suas proprias keys (apenas metadata, nunca o hash)
CREATE POLICY api_keys_select_own ON public.ai_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Contribuidores Pro+ podem criar keys
CREATE POLICY api_keys_insert ON public.ai_api_keys
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_role('contribuidor')
    AND public.has_subscription('pro')
  );

-- Podem revogar suas proprias keys
CREATE POLICY api_keys_update_own ON public.ai_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY api_keys_delete_own ON public.ai_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins veem todas as keys (metadata)
CREATE POLICY api_keys_select_admin ON public.ai_api_keys
  FOR SELECT
  USING (public.has_role('admin'));
```

---

## 4. Edge Middleware — Security Chain

### 4.1 Arquitetura do Middleware

```typescript
// src/middleware.ts

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/shared/lib/supabase/middleware'

// Chain de seguranca — executa em sequencia
export async function middleware(request: NextRequest) {
  // 1. Rate Limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  // 2. Security Headers + 3. Auth (JWT validation/refresh)
  const response = await updateSession(request)
  applySecurityHeaders(response)

  // 4. Role Guard
  const roleResult = roleGuard(request, response)
  if (roleResult) return roleResult

  // 5. Subscription Guard
  const subResult = subscriptionGuard(request, response)
  if (subResult) return subResult

  // 6. CSRF Protection
  const csrfResult = csrfProtection(request)
  if (csrfResult) return csrfResult

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 4.2 Rate Limiting — Sliding Window

```typescript
// src/shared/lib/middleware/rate-limit.ts

import { NextRequest, NextResponse } from 'next/server'

// Em producao, usar Vercel KV ou Upstash Redis
// Edge runtime nao suporta node-rate-limiter — usar Upstash @upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiters por tipo de endpoint
const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),  // 100 req/min por IP
  prefix: 'rl:global',
})

const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'),    // 5 tentativas/min
  prefix: 'rl:auth',
})

const commentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1h'),   // 10 comentarios/hora
  prefix: 'rl:comment',
})

const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1h'),    // 5 uploads/hora
  prefix: 'rl:upload',
})

const aiFeedLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1h'),   // 30 posts/hora
  prefix: 'rl:aifeed',
})

export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1'

  const pathname = request.nextUrl.pathname

  // Selecionar o limiter correto
  let limiter = globalLimiter
  let identifier = ip

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login')) {
    limiter = authLimiter
  } else if (pathname.startsWith('/api/comments')) {
    limiter = commentLimiter
    identifier = request.headers.get('x-user-id') ?? ip
  } else if (pathname.startsWith('/api/upload')) {
    limiter = uploadLimiter
    identifier = request.headers.get('x-user-id') ?? ip
  } else if (pathname.startsWith('/api/ai-feed')) {
    limiter = aiFeedLimiter
    identifier = request.headers.get('x-user-id') ?? ip
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}
```

### 4.3 Security Headers

```typescript
// src/shared/lib/middleware/security-headers.ts

import { NextResponse } from 'next/server'

export function applySecurityHeaders(response: NextResponse): void {
  const headers = response.headers

  // Content Security Policy
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.posthog.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.posthog.com",
    "frame-src https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '))

  // HTTP Strict Transport Security
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
  ].join(', '))

  // Remove server header
  headers.delete('X-Powered-By')
}
```

### 4.4 Role Guard

```typescript
// src/shared/lib/middleware/role-guard.ts

import { NextRequest, NextResponse } from 'next/server'

interface RouteRoleConfig {
  pattern: RegExp
  requiredRole: string
}

const ROLE_ROUTES: RouteRoleConfig[] = [
  { pattern: /^\/admin/, requiredRole: 'admin' },
  { pattern: /^\/api\/admin/, requiredRole: 'admin' },
  { pattern: /^\/api\/newsletters/, requiredRole: 'admin' },
  { pattern: /^\/moderation/, requiredRole: 'moderador' },
  { pattern: /^\/api\/moderation/, requiredRole: 'moderador' },
]

export function roleGuard(request: NextRequest, response: NextResponse): NextResponse | null {
  const pathname = request.nextUrl.pathname

  const matchedRoute = ROLE_ROUTES.find(r => r.pattern.test(pathname))
  if (!matchedRoute) return null

  // Extrair role do JWT (ja validado pelo auth middleware)
  const userRole = getUserRoleFromResponse(response)

  if (!userRole || !hasRole(userRole, matchedRoute.requiredRole)) {
    return NextResponse.json(
      { error: 'Forbidden: insufficient role' },
      { status: 403 }
    )
  }

  return null
}
```

### 4.5 Subscription Guard

```typescript
// src/shared/lib/middleware/subscription-guard.ts

interface RouteSubscriptionConfig {
  pattern: RegExp
  requiredSubscription: string
}

const SUBSCRIPTION_ROUTES: RouteSubscriptionConfig[] = [
  { pattern: /^\/learn\/premium-/, requiredSubscription: 'premium' },
  { pattern: /^\/learn\/pro-/, requiredSubscription: 'pro' },
  { pattern: /^\/api\/ai-feed\/generate-key/, requiredSubscription: 'pro' },
]

export function subscriptionGuard(
  request: NextRequest,
  response: NextResponse
): NextResponse | null {
  const pathname = request.nextUrl.pathname

  const matchedRoute = SUBSCRIPTION_ROUTES.find(r => r.pattern.test(pathname))
  if (!matchedRoute) return null

  const userSubscription = getUserSubscriptionFromResponse(response)

  if (!userSubscription || !hasSubscription(userSubscription, matchedRoute.requiredSubscription)) {
    return NextResponse.json(
      { error: 'Upgrade required', requiredLevel: matchedRoute.requiredSubscription },
      { status: 402 }
    )
  }

  return null
}
```

### 4.6 CSRF Protection

```typescript
// src/shared/lib/middleware/csrf.ts

import { NextRequest, NextResponse } from 'next/server'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function csrfProtection(request: NextRequest): NextResponse | null {
  // Safe methods nao precisam de CSRF check
  if (SAFE_METHODS.includes(request.method)) return null

  // Webhooks externos usam signature verification, nao CSRF
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) return null

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // Verificar que o origin bate com o host
  if (origin) {
    const originUrl = new URL(origin)
    if (originUrl.host !== host) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      )
    }
  }

  // SameSite=Lax nos cookies ja previne a maioria dos ataques CSRF.
  // A verificacao de Origin acima adiciona uma segunda camada.
  // Para Server Actions, Next.js gerencia CSRF tokens internamente.

  return null
}
```

---

## 5. Seguranca de API

### 5.1 Validacao com Zod — Padrao para TODOS os Endpoints

```typescript
// src/shared/lib/api/validate.ts

import { z, type ZodSchema } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

export function withValidation<T>(schema: ZodSchema<T>) {
  return async (
    handler: (req: NextRequest, data: T) => Promise<NextResponse>,
    request: NextRequest
  ) => {
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const result = schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    return handler(request, result.data)
  }
}

// Uso em Route Handler:
// src/app/api/courses/route.ts
import { createCourseSchema } from '@/features/courses/schemas'
import { withValidation } from '@/shared/lib/api/validate'

export async function POST(request: NextRequest) {
  return withValidation(createCourseSchema)(async (req, data) => {
    // data e tipado como CreateCourseInput
    // ... logica de negocio
    return NextResponse.json({ success: true })
  }, request)
}
```

### 5.2 Prevencao de SQL Injection

**Abordagem:** Nunca construir SQL manualmente. Todas as queries usam o Supabase Client (que usa parametrized queries internamente) ou a funcao `supabase.rpc()` para stored procedures.

```typescript
// CORRETO — Supabase Client usa parametrized queries
const { data } = await supabase
  .from('courses')
  .select('*')
  .eq('slug', userInput)  // automaticamente sanitizado

// CORRETO — RPC com parametros
const { data } = await supabase.rpc('search_courses', {
  search_term: userInput  // parametrizado no nivel do PostgreSQL
})

// PROIBIDO — NUNCA fazer isso
// const { data } = await supabase.rpc('raw_query', {
//   sql: `SELECT * FROM courses WHERE slug = '${userInput}'`
// })
```

**Regra:** O `service_role` key NUNCA e exposto no frontend. Apenas usado em:
- Supabase Edge Functions (server-side)
- Next.js Route Handlers (server-side)
- NUNCA em Client Components

### 5.3 Prevencao de XSS

#### Sanitizacao de Markdown

```typescript
// src/shared/lib/sanitize.ts

import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'strong', 'em', 'del', 'code', 'pre',
  'blockquote',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'width', 'height'],
  'code': ['class'],  // para syntax highlighting
  'pre': ['class'],
}

export function sanitizeMarkdown(markdown: string): string {
  // 1. Renderizar markdown para HTML
  const html = marked.parse(markdown)

  // 2. Sanitizar HTML resultante
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: Object.values(ALLOWED_ATTRIBUTES).flat(),
    // Impedir protocolos perigosos em links
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    // Remover event handlers
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
  })
}

// Sanitizacao basica para campos de texto puro (nomes, titulos)
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
```

#### CSP como segunda camada

O Content-Security-Policy header (secao 4.3) impede execucao de scripts nao autorizados mesmo que um XSS bypass o DOMPurify.

### 5.4 Rate Limiting por Endpoint

| Endpoint | Limite | Janela | Identificador |
|---|---|---|---|
| `POST /api/auth/login` | 5 | 1 minuto | IP |
| `POST /api/auth/register` | 3 | 1 hora | IP |
| `POST /api/auth/magic-link` | 3 | 1 minuto | IP + email |
| `POST /api/comments` | 10 | 1 hora | user_id |
| `POST /api/upload` | 5 | 1 hora | user_id |
| `POST /api/ai-feed` | 30 | 1 hora | api_key |
| `POST /api/posts` | 20 | 1 hora | user_id |
| `POST /api/marketplace` | 5 | 1 hora | user_id |
| `GET /api/*` (global) | 100 | 1 minuto | IP |

### 5.5 Validacao de File Upload

```typescript
// src/shared/lib/upload/validate.ts

import { z } from 'zod'

// Configuracoes por tipo de upload
const UPLOAD_CONFIGS = {
  video: {
    maxSize: 2 * 1024 * 1024 * 1024,  // 2GB
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
    allowedExtensions: ['.mp4', '.webm', '.mov'],
  },
  image: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  avatar: {
    maxSize: 5 * 1024 * 1024,  // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  document: {
    maxSize: 50 * 1024 * 1024,  // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/epub+zip',
    ],
    allowedExtensions: ['.pdf', '.epub'],
  },
} as const

type UploadType = keyof typeof UPLOAD_CONFIGS

export async function validateUpload(
  file: File,
  type: UploadType
): Promise<{ valid: true } | { valid: false; error: string }> {
  const config = UPLOAD_CONFIGS[type]

  // 1. Verificar tamanho
  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024)
    return { valid: false, error: `File too large. Max: ${maxMB}MB` }
  }

  // 2. Verificar MIME type declarado
  if (!config.allowedMimeTypes.includes(file.type as never)) {
    return { valid: false, error: `Invalid file type: ${file.type}` }
  }

  // 3. Verificar extensao
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!config.allowedExtensions.includes(ext as never)) {
    return { valid: false, error: `Invalid file extension: ${ext}` }
  }

  // 4. MAGIC BYTES — Verificar tipo real do arquivo (server-side)
  // Nao confiar apenas no MIME type declarado pelo client
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer.slice(0, 12))

  if (!verifyMagicBytes(bytes, type)) {
    return { valid: false, error: 'File content does not match declared type' }
  }

  return { valid: true }
}

function verifyMagicBytes(bytes: Uint8Array, type: UploadType): boolean {
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],   // GIF8
    'video/mp4': [[0x00, 0x00, 0x00]],          // ftyp (offset 4)
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  }

  // Verificar pelo menos um signature match para o tipo
  const typeSignatures = UPLOAD_CONFIGS[type].allowedMimeTypes
    .flatMap(mime => signatures[mime] ?? [])

  if (typeSignatures.length === 0) return true // sem signature conhecida

  return typeSignatures.some(sig =>
    sig.every((byte, i) => bytes[i] === byte)
  )
}
```

### 5.6 Webhook Verification — Stripe

```typescript
// src/app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  // 1. Ler body como texto bruto (NAO como JSON)
  const body = await request.text()

  // 2. Obter signature header
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  // 3. Verificar signature
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // 4. Processar evento (com idempotency)
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err)
    // Retornar 500 para que Stripe tente novamente
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  // 5. Responder 200 rapidamente
  return NextResponse.json({ received: true })
}

// IMPORTANTE: desabilitar body parsing automatico do Next.js
export const runtime = 'nodejs' // nao 'edge' — Stripe SDK requer Node
```

### 5.7 Protecao contra Mass Assignment

```typescript
// NUNCA passar body do request direto para o banco
// SEMPRE usar Zod para filtrar apenas os campos permitidos

// ERRADO:
// const body = await request.json()
// await supabase.from('user_profiles').update(body).eq('id', userId)
// ^ usuario poderia enviar { role: 'admin', subscription_level: 'premium' }

// CORRETO:
const schema = z.object({
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
})

const parsed = schema.parse(await request.json())
await supabase.from('user_profiles').update(parsed).eq('id', userId)
// ^ apenas campos permitidos passam
```

---

## 6. Conformidade LGPD

### 6.1 Dados Pessoais Coletados

| Dado | Classificacao | Armazenamento | Justificativa Legal |
|---|---|---|---|
| Email | PII | `auth.users` (Supabase Auth) | Autenticacao, comunicacao |
| Nome completo | PII | `user_profiles.full_name` | Identificacao na plataforma |
| CPF | PII Sensivel | `user_profiles.cpf_encrypted` | Emissao de nota fiscal (obrigatorio por lei) |
| WhatsApp | PII | `user_profiles.whatsapp_encrypted` | Suporte ao cliente (consentido) |
| Avatar | PII | Supabase Storage | Perfil social |
| IP | PII | Logs (retencao 90 dias) | Seguranca, rate limiting |

### 6.2 Criptografia do CPF — pgcrypto

```sql
-- Habilitar extensao
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Coluna para CPF criptografado
ALTER TABLE public.user_profiles
  ADD COLUMN cpf_encrypted BYTEA,
  ADD COLUMN cpf_hash TEXT;  -- hash para busca sem descriptografar

-- Funcao para criptografar CPF
CREATE OR REPLACE FUNCTION public.encrypt_cpf(raw_cpf TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validar formato CPF (11 digitos)
  IF raw_cpf !~ '^\d{11}$' THEN
    RAISE EXCEPTION 'CPF invalido';
  END IF;

  -- Criptografar com AES-256 usando chave do vault
  RETURN pgp_sym_encrypt(
    raw_cpf,
    current_setting('app.settings.cpf_encryption_key'),
    'compress-algo=2, cipher-algo=aes256'
  );
END;
$$;

-- Funcao para descriptografar CPF (apenas admin via service_role)
CREATE OR REPLACE FUNCTION public.decrypt_cpf(encrypted BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    encrypted,
    current_setting('app.settings.cpf_encryption_key')
  );
END;
$$;

-- Hash do CPF para buscas (sem revelar o CPF)
CREATE OR REPLACE FUNCTION public.hash_cpf(raw_cpf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN encode(
    hmac(raw_cpf, current_setting('app.settings.cpf_hmac_key'), 'sha256'),
    'hex'
  );
END;
$$;

-- Trigger para criptografar automaticamente ao inserir/atualizar
CREATE OR REPLACE FUNCTION public.auto_encrypt_cpf()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.cpf_raw IS NOT NULL THEN
    NEW.cpf_encrypted := public.encrypt_cpf(NEW.cpf_raw);
    NEW.cpf_hash := public.hash_cpf(NEW.cpf_raw);
    NEW.cpf_raw := NULL;  -- NUNCA armazenar plaintext
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_cpf_on_change
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.cpf_raw IS NOT NULL)
  EXECUTE FUNCTION public.auto_encrypt_cpf();
```

**Gestao da chave de criptografia:**

- A chave e armazenada no Supabase Vault (nunca no codigo)
- Acessivel via: `current_setting('app.settings.cpf_encryption_key')`
- Em producao, rotacionar a chave a cada 12 meses
- Procedimento de rotacao:
  1. Adicionar nova chave
  2. Re-criptografar todos os CPFs com a nova chave (batch job)
  3. Remover chave antiga

### 6.3 Direito a Exclusao — Account Deletion Flow

```typescript
// src/features/auth/actions/delete-account.ts
'use server'

import { createServerClient } from '@/shared/lib/supabase/server'
import { createAdminClient } from '@/shared/lib/supabase/admin'

export async function deleteAccount(formData: FormData) {
  const confirmEmail = formData.get('confirmEmail') as string

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== confirmEmail) {
    return { error: 'Email de confirmacao nao confere' }
  }

  // Usar service_role para deletar dados em todas as tabelas
  const admin = createAdminClient()

  // 1. Anonimizar/deletar dados pessoais
  await admin.from('user_profiles').update({
    full_name: '[Conta Deletada]',
    bio: null,
    avatar_url: null,
    cpf_encrypted: null,
    cpf_hash: null,
    whatsapp_encrypted: null,
    email: null,
    deleted_at: new Date().toISOString(),
  }).eq('id', user.id)

  // 2. Deletar arquivos do Storage
  const { data: avatars } = await admin.storage
    .from('avatars')
    .list(user.id)
  if (avatars?.length) {
    await admin.storage
      .from('avatars')
      .remove(avatars.map(f => `${user.id}/${f.name}`))
  }

  // 3. Anonimizar comentarios (manter conteudo para integridade do thread)
  await admin.from('comments')
    .update({ user_id: null, user_display_name: '[Deletado]' })
    .eq('user_id', user.id)

  // 4. Anonimizar posts
  await admin.from('posts')
    .update({ author_id: null, author_display_name: '[Deletado]' })
    .eq('author_id', user.id)

  // 5. Revogar API keys
  await admin.from('ai_api_keys')
    .update({ revoked_at: new Date().toISOString(), status: 'revoked' })
    .eq('user_id', user.id)

  // 6. Registrar log de exclusao (LGPD compliance)
  await admin.from('lgpd_deletion_log').insert({
    user_id_hash: hashUserId(user.id),  // hash, nao o UUID original
    deleted_at: new Date().toISOString(),
    data_categories_deleted: [
      'profile', 'avatar', 'comments', 'posts', 'api_keys'
    ],
  })

  // 7. Deletar usuario do Supabase Auth (invalida todas as sessoes)
  await admin.auth.admin.deleteUser(user.id)

  return { success: true }
}
```

### 6.4 Consent Logging

```sql
CREATE TABLE public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  -- Tipos: 'terms_of_service', 'privacy_policy', 'newsletter', 'whatsapp_contact'
  granted BOOLEAN NOT NULL,
  version TEXT NOT NULL,       -- versao do documento aceito (ex: 'v2.1')
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index para consultas rapidas
CREATE INDEX idx_consent_user ON public.consent_log(user_id, consent_type);

-- RLS: usuarios veem seus proprios consentimentos, admins veem todos
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_select_own ON public.consent_log
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE POLICY consent_insert ON public.consent_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

```typescript
// src/shared/lib/consent.ts

export async function logConsent(
  supabase: SupabaseClient,
  params: {
    consentType: 'terms_of_service' | 'privacy_policy' | 'newsletter' | 'whatsapp_contact'
    granted: boolean
    version: string
    ipAddress: string
    userAgent: string
  }
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  return supabase.from('consent_log').insert({
    user_id: user.id,
    consent_type: params.consentType,
    granted: params.granted,
    version: params.version,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  })
}
```

### 6.5 Newsletter — Opt-in Explicito

**Regras:**
- Checkbox desmarcado por padrao (opt-in, nao opt-out)
- Texto claro sobre frequencia e conteudo
- Link de unsubscribe em todos os emails (obrigatorio LGPD Art. 18)
- Log de consentimento com timestamp e versao do documento

```typescript
// src/features/newsletter/components/newsletter-opt-in.tsx
'use client'

export function NewsletterOptIn() {
  return (
    <form action={subscribeToNewsletter}>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1"
          // NUNCA defaultChecked — deve ser opt-in explicito
        />
        <span className="text-sm text-gray-600">
          Concordo em receber a newsletter do AutomatikLabs com dicas sobre
          monetizacao com IA. Posso cancelar a qualquer momento clicando em
          &quot;Descadastrar&quot; no email.
        </span>
      </label>
      <button type="submit" className="mt-4">
        Quero receber
      </button>
    </form>
  )
}
```

### 6.6 Privacy Policy Acceptance

Aceitacao registrada no momento do registro:

```typescript
// src/features/auth/actions/register.ts (trecho relevante)

export async function register(formData: FormData) {
  // ... validacao ...

  const termsAccepted = formData.get('termsAccepted') === 'true'
  const privacyAccepted = formData.get('privacyAccepted') === 'true'

  if (!termsAccepted || !privacyAccepted) {
    return { error: 'Voce deve aceitar os Termos de Uso e a Politica de Privacidade.' }
  }

  // Registrar usuario
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (data?.user) {
    // Registrar consentimentos
    await Promise.all([
      logConsent(supabase, {
        consentType: 'terms_of_service',
        granted: true,
        version: 'v1.0',
        ipAddress,
        userAgent,
      }),
      logConsent(supabase, {
        consentType: 'privacy_policy',
        granted: true,
        version: 'v1.0',
        ipAddress,
        userAgent,
      }),
    ])
  }

  // ...
}
```

---

## 7. Seguranca do AI Feed

### 7.1 Geracao e Armazenamento de API Keys

```sql
-- Tabela de API keys — NUNCA armazenar a key em texto claro
CREATE TABLE public.ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,        -- SHA-256 hash da key
  key_prefix TEXT NOT NULL,      -- primeiros 8 chars para identificacao (ex: "ak_1a2b3c4d")
  name TEXT NOT NULL,            -- nome amigavel dado pelo usuario
  permissions TEXT[] DEFAULT ARRAY['ai_feed:write'],
  rate_limit_per_hour INT DEFAULT 30,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,        -- null = nunca expira
  revoked_at TIMESTAMPTZ,        -- null = ativa
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_key_hash UNIQUE (key_hash),
  CONSTRAINT valid_status CHECK (
    revoked_at IS NULL OR revoked_at > created_at
  )
);

CREATE INDEX idx_api_keys_user ON public.ai_api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.ai_api_keys(key_hash);
```

```typescript
// src/features/ai-feed/actions/generate-api-key.ts
'use server'

import { randomBytes, createHash } from 'crypto'
import { createServerClient } from '@/shared/lib/supabase/server'

export async function generateApiKey(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Verificar role e subscription
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, subscription_level')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'aluno' || profile.subscription_level === 'free') {
    return { error: 'Requer role contribuidor+ e subscription pro+' }
  }

  // Verificar limite de keys ativas (max 3 por usuario)
  const { count } = await supabase
    .from('ai_api_keys')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .is('revoked_at', null)

  if ((count ?? 0) >= 3) {
    return { error: 'Limite de 3 API keys ativas atingido' }
  }

  // Gerar key
  const rawKey = `ak_${randomBytes(32).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 11) // "ak_1a2b3c4d"

  const name = (formData.get('name') as string) || 'Minha API Key'

  // Armazenar apenas o hash
  const { error } = await supabase.from('ai_api_keys').insert({
    user_id: user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
  })

  if (error) return { error: 'Falha ao criar API key' }

  // RETORNAR A KEY APENAS UMA VEZ — nunca mais sera acessivel
  return {
    success: true,
    apiKey: rawKey,
    warning: 'Copie esta chave agora. Ela nao sera exibida novamente.',
  }
}
```

### 7.2 Validacao de API Key nos Requests

```typescript
// src/app/api/ai-feed/route.ts

import { createHash } from 'crypto'
import { createAdminClient } from '@/shared/lib/supabase/admin'

async function validateApiKey(request: NextRequest): Promise<{
  valid: boolean
  userId?: string
  keyHash?: string
  error?: string
}> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ak_')) {
    return { valid: false, error: 'Missing or invalid API key' }
  }

  const apiKey = authHeader.replace('Bearer ', '')
  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  const admin = createAdminClient()

  const { data: keyRecord } = await admin
    .from('ai_api_keys')
    .select('user_id, rate_limit_per_hour, revoked_at, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (!keyRecord) {
    return { valid: false, error: 'Invalid API key' }
  }

  if (keyRecord.revoked_at) {
    return { valid: false, error: 'API key has been revoked' }
  }

  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' }
  }

  // Atualizar last_used_at
  await admin
    .from('ai_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return { valid: true, userId: keyRecord.user_id, keyHash }
}
```

### 7.3 Rate Limiting por API Key

```typescript
// Rate limiter especifico para AI feed (30 posts/hora por key)
const aiFeedKeyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1h'),
  prefix: 'rl:aifeed:key',
})

// No handler:
const { success } = await aiFeedKeyLimiter.limit(keyResult.keyHash!)
if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Max 30 posts per hour.' },
    { status: 429 }
  )
}
```

### 7.4 Validacao de Conteudo do AI Feed

```typescript
// src/features/ai-feed/schemas.ts

import { z } from 'zod'

export const aiFeedPostSchema = z.object({
  title: z.string()
    .min(5, 'Titulo muito curto')
    .max(200, 'Titulo muito longo')
    .refine(val => !containsExcessiveEmoji(val), 'Excesso de emojis'),

  content: z.string()
    .min(50, 'Conteudo muito curto — minimo 50 caracteres')
    .max(10000, 'Conteudo muito longo — maximo 10.000 caracteres'),

  content_type: z.enum(['article', 'tutorial', 'insight', 'tool_review']),

  tags: z.array(z.string().max(30))
    .min(1, 'Pelo menos uma tag')
    .max(5, 'Maximo 5 tags'),

  source_url: z.string().url().optional(),
})

function containsExcessiveEmoji(text: string): boolean {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu
  const emojis = text.match(emojiRegex) ?? []
  return emojis.length > text.length * 0.3 // mais de 30% emojis
}
```

### 7.5 Sandbox — Sempre Pending Approval

```typescript
// REGRA: Todo post via API entra como pending_approval
// Apenas moderadores+ podem aprovar

export async function POST(request: NextRequest) {
  const keyResult = await validateApiKey(request)
  if (!keyResult.valid) {
    return NextResponse.json({ error: keyResult.error }, { status: 401 })
  }

  const body = await request.json()
  const parsed = aiFeedPostSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const admin = createAdminClient()

  // Sanitizar conteudo markdown
  const sanitizedContent = sanitizeMarkdown(parsed.data.content)

  const { data, error } = await admin.from('ai_feed_posts').insert({
    author_id: keyResult.userId,
    title: sanitizeText(parsed.data.title),
    content: sanitizedContent,
    content_type: parsed.data.content_type,
    tags: parsed.data.tags.map(sanitizeText),
    source_url: parsed.data.source_url,
    status: 'pending_approval',  // SEMPRE pending — sandbox
    submitted_via: 'api',
  }).select('id').single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }

  return NextResponse.json({
    id: data.id,
    status: 'pending_approval',
    message: 'Post submitted for review. A moderator will approve it shortly.',
  }, { status: 201 })
}
```

---

## 8. Seguranca de Storage

### 8.1 Buckets e Policies

| Bucket | Acesso | Policy |
|---|---|---|
| `avatars` | Publico (leitura) | Qualquer um le, dono escreve |
| `course-thumbnails` | Publico (leitura) | Contribuidores+ escrevem |
| `lesson-videos` | Privado | Signed URLs com expiracao |
| `lesson-attachments` | Privado | Signed URLs com expiracao |
| `marketplace-assets` | Privado | Comprador + vendedor |
| `community-uploads` | Publico (leitura) | Autenticado escreve, moderadores deletam |

### 8.2 Storage Policies — SQL

```sql
-- Bucket: avatars
CREATE POLICY avatars_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    -- Enforce: avatars/{user_id}/filename.ext
  );

CREATE POLICY avatars_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatars_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role('admin')
    )
  );

-- Bucket: lesson-videos (privado — apenas signed URLs)
CREATE POLICY videos_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'lesson-videos'
    AND (
      public.has_role('moderador')
      OR public.has_subscription(
        (SELECT c.subscription_level
         FROM public.lessons l
         JOIN public.modules m ON m.id = l.module_id
         JOIN public.courses c ON c.id = m.course_id
         WHERE l.video_path = name
         LIMIT 1)
      )
    )
  );

CREATE POLICY videos_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'lesson-videos'
    AND public.has_role('contribuidor')
  );

CREATE POLICY videos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'lesson-videos'
    AND public.has_role('admin')
  );

-- Bucket: community-uploads
CREATE POLICY community_uploads_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'community-uploads');

CREATE POLICY community_uploads_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'community-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY community_uploads_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'community-uploads'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role('moderador')
    )
  );
```

### 8.3 Signed URLs para Conteudo Premium

```typescript
// src/features/courses/actions/get-video-url.ts
'use server'

import { createServerClient } from '@/shared/lib/supabase/server'

export async function getVideoSignedUrl(lessonId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // RLS garante que o usuario so acessa licoes do seu subscription level
  const { data: lesson } = await supabase
    .from('lessons')
    .select('video_path')
    .eq('id', lessonId)
    .single()

  if (!lesson?.video_path) return { error: 'Lesson not found' }

  // Gerar signed URL com expiracao de 2 horas
  const { data: signedUrl } = await supabase.storage
    .from('lesson-videos')
    .createSignedUrl(lesson.video_path, 7200) // 2 horas em segundos

  if (!signedUrl) return { error: 'Failed to generate URL' }

  return { url: signedUrl.signedUrl }
}
```

**Regras de expiracao:**

| Tipo de conteudo | Expiracao do Signed URL |
|---|---|
| Videos de aula | 2 horas |
| Anexos de aula (PDFs) | 1 hora |
| Assets do marketplace | 24 horas (apos compra) |
| Conteudo premium (books) | 1 hora |

### 8.4 Validacao MIME Server-Side

Alem da validacao no upload (secao 5.5) com magic bytes, o Supabase Storage tambem deve ser configurado com restricoes por bucket:

| Bucket | Max Size | MIME Types Permitidos |
|---|---|---|
| `avatars` | 5MB | `image/jpeg`, `image/png`, `image/webp` |
| `lesson-videos` | 2GB | `video/mp4`, `video/webm` |
| `community-uploads` | 10MB | `image/*`, `application/pdf` |
| `course-thumbnails` | 5MB | `image/jpeg`, `image/png`, `image/webp` |
| `lesson-attachments` | 50MB | `application/pdf`, `application/epub+zip` |

---

## 9. Modelo de Ameacas STRIDE

### 9.1 Fluxo 1: Autenticacao

| Categoria | Ameaca | Mitigacao | Prioridade |
|---|---|---|---|
| **S** (Spoofing) | Atacante finge ser outro usuario usando token roubado | httpOnly + Secure cookies; Refresh token rotation; `getUser()` valida no servidor (nao apenas decode local) | Critica |
| **T** (Tampering) | Modificar JWT claims para escalar privilegios | JWT assinado com secret do Supabase (HS256); Claims verificadas no servidor a cada request; RLS como backup no banco | Critica |
| **R** (Repudiation) | Usuario nega ter realizado acao | Audit log com user_id, IP, timestamp em acoes criticas (pagamento, delete, role change) | Alta |
| **I** (Info Disclosure) | Token vazado via logs ou URL | Tokens nunca em URL params; Logs sanitizados (sem tokens/PII); CSP impede exfiltracao | Alta |
| **D** (Denial of Service) | Brute force no login | Rate limit 5 tentativas/min; Magic link como default (sem brute force de senha); CAPTCHA apos 3 falhas | Alta |
| **E** (Elevation) | Aluno tenta acessar rotas de admin | Role guard no middleware; RLS no banco; Double-check em Server Actions | Critica |

### 9.2 Fluxo 2: Acesso a Conteudo por Subscription

| Categoria | Ameaca | Mitigacao | Prioridade |
|---|---|---|---|
| **S** | Usuario free forja subscription_level no request | Subscription verificada via JWT claims + RLS no banco (defense-in-depth) | Critica |
| **T** | Manipular signed URL para acessar video premium | Signed URLs com HMAC; Expiracao curta (2h); Verificacao de subscription antes de gerar URL | Alta |
| **R** | Compartilhamento de conta | Limite de sessoes simultaneas (futuro); Watermark em videos (futuro) | Media |
| **I** | Scraping de conteudo via API | Rate limiting; Conteudo servido via signed URLs (nao URLs publicas); Sem API publica de conteudo | Alta |
| **D** | Download massivo de videos | Rate limit de signed URLs; Monitoramento de bandwidth por usuario | Media |
| **E** | Contribuidor publica curso sem aprovacao | Policy: `published = false` forcado no INSERT; Apenas moderadores+ mudam para `published = true` | Alta |

### 9.3 Fluxo 3: Payment Webhook (Stripe)

| Categoria | Ameaca | Mitigacao | Prioridade |
|---|---|---|---|
| **S** | Atacante envia webhook falso para dar premium | Verificacao de signature Stripe obrigatoria; Rejeitar se `stripe-signature` ausente ou invalido | Critica |
| **T** | Replay attack — reenviar webhook antigo | Idempotency key (event ID); Verificacao de timestamp (rejeitar eventos >5 min) | Critica |
| **R** | Disputar cobranca apos consumir conteudo | Log detalhado de acesso; Webhook `charge.dispute.created` revoga acesso imediatamente | Alta |
| **I** | Dados de pagamento expostos | Stripe Elements (PCI compliance); Nunca armazenar dados de cartao; Apenas Stripe customer_id no banco | Critica |
| **D** | Flood de webhooks falsos | Rate limit no endpoint de webhook; Verificacao de signature antes de qualquer processamento | Media |
| **E** | Webhook altera subscription de outro usuario | Mapear `stripe_customer_id` para `user_id` no banco; Verificar match antes de atualizar | Critica |

### 9.4 Fluxo 4: AI Feed Publishing

| Categoria | Ameaca | Mitigacao | Prioridade |
|---|---|---|---|
| **S** | API key roubada usada para publicar | Key hash no banco (nunca plaintext); Revogacao imediata; Rate limit por key; IP allowlist (futuro) | Alta |
| **T** | Injecao de script via conteudo do post | Sanitizacao de markdown (DOMPurify); CSP; Zod validation de schema | Alta |
| **R** | Autor nega ter publicado conteudo ofensivo | Log de `submitted_via: 'api'` com key_prefix e timestamp | Media |
| **I** | Conteudo nao aprovado visivel publicamente | Status `pending_approval` obrigatorio; RLS filtra por status | Alta |
| **D** | Spam massivo via API | Rate limit 30 posts/hora por key; Validacao de tamanho minimo (50 chars) | Alta |
| **E** | Usuario free tenta gerar API key | Verificacao de role (contribuidor+) e subscription (pro+) na geracao | Alta |

### 9.5 Fluxo 5: Comment Moderation

| Categoria | Ameaca | Mitigacao | Prioridade |
|---|---|---|---|
| **S** | Usuario edita comentario de outro | RLS: `auth.uid() = user_id` no UPDATE; Verificacao no Server Action | Critica |
| **T** | XSS via comentario com script | DOMPurify sanitization; CSP `script-src 'self'`; Markdown renderer seguro | Alta |
| **R** | Moderador deleta comentario sem justificativa | Audit log de moderacao com moderador_id, comentario_id, motivo, timestamp | Media |
| **I** | Comentarios deletados ainda visiveis | Soft delete (`deleted_at IS NOT NULL`); RLS filtra deleted_at | Media |
| **D** | Flood de comentarios | Rate limit 10 comentarios/hora; CAPTCHA apos deteccao de spam | Alta |
| **E** | Aluno tenta deletar comentario de outro | RLS: apenas dono ou moderador+; Verificacao no middleware e no banco | Alta |

---

## 10. Checklist OWASP Top 10

### A01:2021 — Broken Access Control

| Controle | Implementacao | Status |
|---|---|---|
| RLS em todas as tabelas | Secao 3 — policies para 25+ tabelas | Obrigatorio |
| Role guard no middleware | Secao 4.4 — `roleGuard()` | Obrigatorio |
| Subscription guard | Secao 4.5 — `subscriptionGuard()` | Obrigatorio |
| Deny by default | RLS: sem policy = sem acesso | Obrigatorio |
| Verificacao server-side em Server Actions | `getUser()` + role check em toda action | Obrigatorio |
| CORS restritivo | `next.config.ts` headers; Mesmo dominio elimina CORS | Obrigatorio |
| Teste: acessar `/admin` como aluno retorna 403 | E2E test | Obrigatorio |

### A02:2021 — Cryptographic Failures

| Controle | Implementacao | Status |
|---|---|---|
| CPF criptografado com AES-256 (pgcrypto) | Secao 6.2 | Obrigatorio |
| Chaves de criptografia no Supabase Vault | Nunca no codigo | Obrigatorio |
| API keys hasheadas (SHA-256) | Secao 7.1 | Obrigatorio |
| HTTPS forcado (HSTS) | Secao 4.3 — `Strict-Transport-Security` | Obrigatorio |
| Senhas hasheadas (bcrypt via Supabase Auth) | Gerenciado pelo GoTrue | Obrigatorio |
| WhatsApp criptografado com pgcrypto | Mesma abordagem do CPF | Obrigatorio |

### A03:2021 — Injection

| Controle | Implementacao | Status |
|---|---|---|
| Parametrized queries (Supabase Client) | Secao 5.2 — nenhum SQL concatenado | Obrigatorio |
| Zod validation em todos os inputs | Secao 5.1 — `withValidation()` wrapper | Obrigatorio |
| DOMPurify para sanitizacao de HTML/Markdown | Secao 5.3 | Obrigatorio |
| CSP header | Secao 4.3 — bloqueia inline scripts nao autorizados | Obrigatorio |
| Proibido `supabase.rpc('raw_query')` | Code review policy | Obrigatorio |

### A04:2021 — Insecure Design

| Controle | Implementacao | Status |
|---|---|---|
| STRIDE threat model | Secao 9 — 5 fluxos criticos analisados | Obrigatorio |
| Defense-in-depth (middleware + RLS + Server Action) | 3 camadas de verificacao | Obrigatorio |
| Principio de menor privilegio | Roles com permissoes minimas; `anon` key sem acesso | Obrigatorio |
| Conteudo AI Feed sandbox (pending_approval) | Secao 7.5 | Obrigatorio |
| Signed URLs com expiracao | Secao 8.3 | Obrigatorio |

### A05:2021 — Security Misconfiguration

| Controle | Implementacao | Status |
|---|---|---|
| Security headers configurados | Secao 4.3 — CSP, HSTS, X-Frame-Options, etc. | Obrigatorio |
| `X-Powered-By` removido | `headers.delete('X-Powered-By')` | Obrigatorio |
| Error messages genericas para usuarios | AppError com `isOperational` flag | Obrigatorio |
| Supabase Dashboard acesso restrito | MFA habilitado; IP allowlist | Obrigatorio |
| `.env` nao commitado | `.gitignore` + `.env.local.example` | Obrigatorio |
| Service role key apenas server-side | Nunca no `NEXT_PUBLIC_*` | Obrigatorio |

### A06:2021 — Vulnerable and Outdated Components

| Controle | Implementacao | Status |
|---|---|---|
| `npm audit` no CI/CD | GitHub Actions workflow | Obrigatorio |
| Dependabot habilitado | `.github/dependabot.yml` | Obrigatorio |
| Lock file commitado | `package-lock.json` ou `pnpm-lock.yaml` | Obrigatorio |
| Revisar dependencias antes de adicionar | Policy: max 1 dep por PR | Recomendado |

### A07:2021 — Identification and Authentication Failures

| Controle | Implementacao | Status |
|---|---|---|
| Rate limit no login (5/min) | Secao 4.2 | Obrigatorio |
| Magic link como default (sem brute force de senha) | Secao 1.2 | Obrigatorio |
| Refresh token rotation | Secao 1.6 | Obrigatorio |
| Session invalidation no logout | `signOut()` invalida refresh token | Obrigatorio |
| `getUser()` (server validation) em vez de `getSession()` (local decode) | Secao 1.6 | Obrigatorio |

### A08:2021 — Software and Data Integrity Failures

| Controle | Implementacao | Status |
|---|---|---|
| Stripe webhook signature verification | Secao 5.6 | Obrigatorio |
| Subresource Integrity (SRI) para CDN scripts | CSP + SRI hashes | Recomendado |
| CI/CD pipeline protegido | Branch protection rules; Required reviews | Obrigatorio |
| Dependencias verificadas | Lock file + npm audit | Obrigatorio |
| Idempotency em webhooks | Event ID deduplication | Obrigatorio |

### A09:2021 — Security Logging and Monitoring Failures

| Controle | Implementacao | Status |
|---|---|---|
| Structured logging (JSON em producao) | Secao 4.4 do ARCHITECTURE.md | Obrigatorio |
| Audit log para acoes criticas | Role changes, deletions, payments | Obrigatorio |
| Consent log (LGPD) | Secao 6.4 | Obrigatorio |
| LGPD deletion log | Secao 6.3 | Obrigatorio |
| Monitoramento de rate limit violations | Alertas via PostHog/Sentry | Recomendado |
| NAO loggar PII (tokens, CPF, senhas) | Policy no logger | Obrigatorio |

### A10:2021 — Server-Side Request Forgery (SSRF)

| Controle | Implementacao | Status |
|---|---|---|
| Validar URLs de input (source_url no AI Feed) | Zod `.url()` + allowlist de dominios | Obrigatorio |
| Nao permitir URLs internas (localhost, 10.x, 192.168.x) | URL validation function | Obrigatorio |
| GitHub API calls com token fixo (nao URL de usuario) | Octokit com auth token | Obrigatorio |
| Avatar URLs: apenas Supabase Storage ou Google | Allowlist de origins | Obrigatorio |

```typescript
// src/shared/lib/url-validation.ts

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // Bloquear protocolos internos
    if (!['http:', 'https:'].includes(parsed.protocol)) return false

    // Bloquear IPs internos
    const hostname = parsed.hostname
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.startsWith('192.168.') ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254'  // AWS/cloud metadata endpoint
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}
```

---

## 11. Checklist Pre-Lancamento

### Infraestrutura

- [ ] HTTPS forcado em todos os dominios (Vercel automatico)
- [ ] HSTS header com `preload` habilitado
- [ ] DNS CAA record configurado (apenas CAs autorizadas)
- [ ] Supabase Dashboard com MFA habilitado para todos os membros
- [ ] Supabase service_role key restrita a server-side (nunca `NEXT_PUBLIC_`)
- [ ] `.env` nao existe no repositorio (apenas `.env.local.example`)
- [ ] Secrets gerenciados via Vercel Environment Variables (encrypted)
- [ ] Branch protection no `main`: required reviews, status checks, no force push

### Autenticacao

- [ ] Magic link funcional e testado
- [ ] Google OAuth funcional e testado
- [ ] JWT custom claims (role, subscription_level) corretos apos login
- [ ] Refresh token rotation funcionando
- [ ] Logout invalida refresh token no servidor
- [ ] Session cookies: httpOnly=true, Secure=true, SameSite=Lax
- [ ] `getUser()` usado (nao `getSession()`) em todas as verificacoes server-side
- [ ] Rate limit no login testado (5 tentativas, depois 429)

### Autorizacao

- [ ] Role guard bloqueia `/admin` para nao-admins (teste: 403)
- [ ] Subscription guard bloqueia conteudo premium para free users (teste: 402)
- [ ] RLS habilitado em TODAS as tabelas (zero tabelas sem RLS)
- [ ] Teste: criar Supabase client com anon key sem autenticar nao retorna dados
- [ ] Teste: usuario A nao consegue acessar progresso do usuario B
- [ ] Teste: aluno nao consegue publicar curso (apenas draft)
- [ ] Teste: contribuidor free nao consegue gerar API key

### API Security

- [ ] Zod validation em todos os Route Handlers e Server Actions
- [ ] Nenhum SQL construido por concatenacao (grep no codebase)
- [ ] DOMPurify aplicado em todo conteudo markdown renderizado
- [ ] Rate limiting configurado e testado para todos os endpoints
- [ ] Stripe webhook signature verification testada (enviar payload falso retorna 400)
- [ ] File upload: magic bytes verification funcional
- [ ] File upload: limites de tamanho corretos (2GB video, 10MB image, 5MB avatar)
- [ ] Mass assignment prevenido (Zod filtra campos nao permitidos)

### LGPD

- [ ] CPF criptografado no banco (verificar: `SELECT cpf_encrypted FROM user_profiles` retorna bytea)
- [ ] CPF nunca armazenado em plaintext (grep no codebase por `cpf_raw`)
- [ ] WhatsApp criptografado no banco
- [ ] Consent log registrado no signup (terms + privacy policy)
- [ ] Newsletter opt-in com checkbox desmarcado por padrao
- [ ] Link de unsubscribe em todos os emails
- [ ] Account deletion flow funcional e testado
- [ ] LGPD deletion log preenchido apos exclusao
- [ ] Politica de Privacidade publicada e acessivel
- [ ] Termos de Uso publicados e acessiveis

### AI Feed

- [ ] API keys armazenadas como SHA-256 hash (nunca plaintext)
- [ ] Key exibida apenas uma vez na geracao
- [ ] Rate limit de 30 posts/hora por key testado
- [ ] Todo post via API entra como `pending_approval`
- [ ] Conteudo sanitizado antes de armazenar
- [ ] Zod validation no schema do post

### Storage

- [ ] Buckets privados para conteudo premium (lesson-videos, books)
- [ ] Storage policies alinhadas com RLS
- [ ] Signed URLs com expiracao configurada (2h video, 1h docs)
- [ ] Avatar upload restrito a 5MB e tipos image/*
- [ ] MIME type verificado server-side (magic bytes)

### Headers de Seguranca

- [ ] Content-Security-Policy configurado e testado (sem erros no console)
- [ ] Strict-Transport-Security com max-age >= 63072000
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy restritivo
- [ ] X-Powered-By removido

### Monitoramento

- [ ] Structured logging funcional em producao
- [ ] Alertas configurados para: rate limit violations, auth failures, webhook errors
- [ ] Audit log para: role changes, account deletions, subscription changes
- [ ] `npm audit` no CI pipeline (falha em vulnerabilidades high/critical)
- [ ] Dependabot habilitado no repositorio

### Testes de Seguranca

- [ ] E2E test: autenticacao completa (login, acesso, logout)
- [ ] E2E test: role escalation attempt retorna 403
- [ ] E2E test: subscription bypass attempt retorna 402
- [ ] E2E test: XSS payload em comentario sanitizado
- [ ] E2E test: SQL injection attempt parametrizado/rejeitado
- [ ] E2E test: CSRF cross-origin POST rejeitado
- [ ] E2E test: fake Stripe webhook retorna 400
- [ ] E2E test: expired signed URL retorna 403
- [ ] E2E test: account deletion anonimiza dados

---

> **Proxima revisao:** Antes de cada sprint de features que toque autenticacao, autorizacao, ou dados pessoais.
> **Responsavel:** Security Architect + Tech Lead
