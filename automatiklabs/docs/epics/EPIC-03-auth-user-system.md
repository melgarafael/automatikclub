# Epic 03: Auth & User System

## Objetivo
Implementar autenticacao completa via Supabase Auth (email/senha, OAuth Google/GitHub, magic link), sistema de perfil rico, roles (aluno/contribuidor/moderador/admin), niveis de assinatura (free/pro/premium) com Stripe, e middleware guards.

## Dependencias
- EPIC-01: Project Scaffolding
- EPIC-02: Design System & Core UI

## Stories

### Story 03.1: Supabase Auth — Login, Registro, OAuth
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar fluxos de autenticacao: registro com email/senha, login, OAuth (Google + GitHub), magic link, recuperar senha, redefinir senha. Todas as telas em `/login`, `/registro`, `/recuperar-senha`, `/redefinir-senha`.
**Acceptance Criteria:**
- [ ] AC1: Given um visitante na pagina `/registro` When preenche nome/email/senha e submete Then conta e criada, `user_profiles` row e inserida via trigger, e redirect para `/feed`
- [ ] AC2: Given um visitante na pagina `/login` When clica "Entrar com Google" Then OAuth flow completa e redirect para `/feed`
- [ ] AC3: Given um usuario na `/recuperar-senha` When submete email Then email de reset e enviado via Supabase Auth
- [ ] AC4: Given um usuario com link de reset When acessa `/redefinir-senha` com token Then consegue definir nova senha
- [ ] AC5: Given um usuario logado When clica "Sair" Then session e destruida e redirect para `/login`
**Tasks:**
- [ ] Criar pagina `/login` com `LoginForm`, `SocialLoginButtons`, `MagicLinkButton`
- [ ] Criar pagina `/registro` com `RegisterForm`, `SocialLoginButtons`
- [ ] Criar pagina `/recuperar-senha` com `ResetPasswordForm`
- [ ] Criar pagina `/redefinir-senha` com `NewPasswordForm`
- [ ] Criar `src/app/api/auth/callback/route.ts` para OAuth callback
- [ ] Criar Server Actions: `login.ts`, `register.ts`, `logout.ts`
- [ ] Criar hook `useAuth` para estado de autenticacao no cliente
- [ ] Criar `AuthGuard` component (redirect se nao autenticado)
**Arquivos a criar/modificar:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/registro/page.tsx`
- `src/app/(auth)/recuperar-senha/page.tsx`
- `src/app/(auth)/redefinir-senha/page.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/api/auth/callback/route.ts`
- `src/features/auth/actions/login.ts`
- `src/features/auth/actions/register.ts`
- `src/features/auth/actions/logout.ts`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/register-form.tsx`
- `src/features/auth/components/social-buttons.tsx`
- `src/features/auth/components/auth-guard.tsx`
- `src/features/auth/hooks/use-auth.ts`
- `src/features/auth/types.ts`

### Story 03.2: Edge Middleware — Auth + Role + Tier Guards
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar Edge Middleware que valida JWT, refresha tokens expirados, protege rotas por role (admin, moderador), e redireciona para paywall quando tier insuficiente.
**Acceptance Criteria:**
- [ ] AC1: Given um visitante nao autenticado When acessa `/feed` Then e redirecionado para `/login`
- [ ] AC2: Given um aluno When acessa `/admin` Then e redirecionado para `/feed` com erro 403
- [ ] AC3: Given um usuario free When acessa curso pro Then ve paywall com CTA de upgrade
- [ ] AC4: Given um JWT expirado When middleware detecta Then refresha automaticamente sem redirect
**Tasks:**
- [ ] Implementar `src/middleware.ts` com chain: rateLimiter → securityHeaders → authValidator → roleGuard → tierGuard
- [ ] Criar matcher patterns para rotas protegidas
- [ ] Criar funcao `getSessionFromRequest` que valida/refresha JWT
- [ ] Criar funcao `checkRole` com mapeamento rota → role minimo
- [ ] Criar funcao `checkTier` com mapeamento conteudo → tier minimo
- [ ] Criar pagina `/unauthorized` para acessos negados
**Arquivos a criar/modificar:**
- `src/middleware.ts`
- `src/shared/lib/supabase/middleware.ts`
- `src/app/(platform)/unauthorized/page.tsx`

### Story 03.3: Perfil Completo — Edicao e Visualizacao
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar perfil rico com todos os campos: nome, email, CPF, WhatsApp, Instagram, bio, foto (upload), stack (tags), portfolio URL. Tela de edicao e visualizacao publica.
**Acceptance Criteria:**
- [ ] AC1: Given um usuario logado When acessa `/perfil/editar` Then ve form com todos os campos preenchidos
- [ ] AC2: Given um usuario editando perfil When faz upload de foto Then imagem e salva no Supabase Storage e URL atualizada no perfil
- [ ] AC3: Given qualquer usuario logado When acessa `/membros/[username]` Then ve perfil publico com info e estatisticas
- [ ] AC4: Given campos sensiveis (CPF, WhatsApp) When perfil publico e visualizado Then esses campos NAO aparecem
**Tasks:**
- [ ] Criar pagina `/perfil/editar` com `ProfileEditForm`
- [ ] Criar componente `AvatarUploader` (crop + upload para Supabase Storage)
- [ ] Criar componente `StackTagSelector` (multi-select com tags predefinidas)
- [ ] Criar Server Actions: `updateProfile.ts`, `uploadAvatar.ts`
- [ ] Criar pagina `/membros/[username]` com `ProfileHeader`, `ProfileStats`
- [ ] Criar pagina `/membros` com grid de membros
- [ ] Implementar validacao Zod para todos os campos do perfil
**Arquivos a criar/modificar:**
- `src/app/(platform)/perfil/editar/page.tsx`
- `src/app/(platform)/membros/page.tsx`
- `src/app/(platform)/membros/[username]/page.tsx`
- `src/features/auth/actions/update-profile.ts`
- `src/features/auth/actions/upload-avatar.ts`
- `src/features/auth/components/profile-edit-form.tsx`
- `src/features/auth/components/avatar-uploader.tsx`
- `src/features/auth/components/stack-tag-selector.tsx`
- `src/features/auth/components/profile-header.tsx`
- `src/features/auth/components/profile-stats.tsx`
- `src/features/auth/components/member-grid.tsx`
- `src/features/auth/components/member-card.tsx`

### Story 03.4: Roles System (aluno/contribuidor/moderador/admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar sistema de roles com JWT custom claims. Role default: aluno. Admins podem alterar roles via admin panel. UI condicional baseada em role.
**Acceptance Criteria:**
- [ ] AC1: Given um novo usuario When se registra Then role default e `aluno` no `user_profiles` e JWT claims
- [ ] AC2: Given um admin When altera role de usuario para `contribuidor` Then JWT claims sao atualizados no proximo refresh
- [ ] AC3: Given um componente com `requireRole="moderador"` When renderizado por aluno Then nao aparece
**Tasks:**
- [ ] Criar coluna `role` em `user_profiles` (enum: aluno, contribuidor, moderador, admin)
- [ ] Criar funcao SQL que injeta role nos JWT claims via auth.hook
- [ ] Criar Server Action `updateUserRole.ts` (admin only)
- [ ] Criar hook `useRole` para verificar role no cliente
- [ ] Criar component wrapper `RoleGate` (renderiza children apenas se role >= minimo)
**Arquivos a criar/modificar:**
- `supabase/migrations/00003_roles_system.sql`
- `src/features/auth/actions/update-user-role.ts`
- `src/features/auth/hooks/use-role.ts`
- `src/features/auth/components/role-gate.tsx`

### Story 03.5: Subscription Tiers (free/pro/premium) + Stripe Integration
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Integrar Stripe para gerenciar assinaturas. Tiers: free (default), pro, premium. Checkout via Stripe Checkout, portal de billing, webhook para sincronizar status.
**Acceptance Criteria:**
- [ ] AC1: Given um usuario free When clica "Upgrade para Pro" Then e redirecionado para Stripe Checkout
- [ ] AC2: Given pagamento confirmado via webhook When Stripe envia `checkout.session.completed` Then `subscriptions` row e criada/atualizada com tier correto
- [ ] AC3: Given um usuario pro When acessa `/configuracoes` aba Assinatura Then ve plano atual e botao para gerenciar no Stripe Portal
- [ ] AC4: Given assinatura cancelada When webhook recebe `customer.subscription.deleted` Then tier volta para `free`
**Tasks:**
- [ ] Configurar Stripe SDK (`src/shared/lib/stripe.ts`)
- [ ] Criar tabela `subscriptions` (user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end)
- [ ] Criar Server Actions: `createCheckout.ts`, `manageSubscription.ts` (portal)
- [ ] Criar Route Handler `src/app/api/webhooks/stripe/route.ts` (processar eventos)
- [ ] Criar Edge Function `supabase/functions/stripe-webhook/index.ts` como fallback
- [ ] Criar pagina `/precos` com `PricingTable`
- [ ] Criar componente `TierGate` (renderiza paywall se tier insuficiente)
- [ ] Criar hook `useTier` para verificar nivel no cliente
**Arquivos a criar/modificar:**
- `src/shared/lib/stripe.ts`
- `supabase/migrations/00004_subscriptions.sql`
- `src/features/billing/actions/create-checkout.ts`
- `src/features/billing/actions/manage-subscription.ts`
- `src/features/billing/components/pricing-table.tsx`
- `src/features/billing/components/tier-gate.tsx`
- `src/features/billing/hooks/use-tier.ts`
- `src/features/billing/types.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/(marketing)/precos/page.tsx`

### Story 03.6: Configuracoes de Conta
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina de configuracoes com tabs: Conta (alterar email/senha, deletar conta), Assinatura (plano atual, historico), Notificacoes (toggles), Privacidade (visibilidade perfil).
**Acceptance Criteria:**
- [ ] AC1: Given um usuario na aba Conta When altera email Then email e atualizado via Supabase Auth com confirmacao
- [ ] AC2: Given um usuario na aba Assinatura When clica "Gerenciar" Then e redirecionado para Stripe Billing Portal
- [ ] AC3: Given um usuario na aba Notificacoes When desativa emails Then preferencia e salva em `user_preferences`
**Tasks:**
- [ ] Criar pagina `/configuracoes` com `SettingsTabs`
- [ ] Criar componentes: `AccountSettings`, `SubscriptionSettings`, `NotificationSettings`, `PrivacySettings`
- [ ] Criar Server Actions: `updateEmail.ts`, `updatePassword.ts`, `deleteAccount.ts`, `updatePreferences.ts`
- [ ] Criar tabela `user_preferences` (notification_email, notification_push, profile_visibility)
**Arquivos a criar/modificar:**
- `src/app/(platform)/configuracoes/page.tsx`
- `src/features/auth/components/settings-tabs.tsx`
- `src/features/auth/components/account-settings.tsx`
- `src/features/auth/components/subscription-settings.tsx`
- `src/features/auth/components/notification-settings.tsx`
- `src/features/auth/components/privacy-settings.tsx`
- `src/features/auth/actions/update-email.ts`
- `src/features/auth/actions/update-password.ts`
- `src/features/auth/actions/delete-account.ts`
- `src/features/auth/actions/update-preferences.ts`
- `supabase/migrations/00005_user_preferences.sql`
