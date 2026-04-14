# Epic E7 — Members & Subscription Management

> **For epic-executor:** Execute wave-by-wave. Depends on E1 (auth) and E2 (admin panel).
> **Required pre-reading by every wave's build subagent:**
> 1. Auth feature: `automatiklabs/src/features/auth/` (subscription guards, role guards)
> 2. Billing feature: `automatiklabs/src/features/billing/`
> 3. Admin feature: `automatiklabs/src/features/admin/actions/manage-users.ts`
> 4. Database: `automatiklabs/supabase/migrations/00001_core_users.sql` (subscriptions table)
> 5. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml`
> 6. Skills: `senior-frontend`, `senior-backend`
> 7. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Make the **membership and subscription system functional**: admin can manage subscription tiers, free tier gates content appropriately, and the paywall system works end-to-end.

## Context

Infrastructure exists: `subscriptions` table with tiers (free/pro/premium), `SubscriptionGuard` component, `hasMinTier()` function, `paywall.tsx` component, `/pricing` page. Admin can change user tiers. BUT:
- **Subscription tier management** — Admin can change individual user tiers but there's no broader subscription management
- **Free tier gating** — `tier_required` exists on tracks/courses but enforcement needs verification
- **Paywall flow** — Component exists but the full flow (see paywall → upgrade → verify) not tested
- **Create account flow** — Registration exists but the free-to-paid journey not wired
- **No Stripe integration** — Stripe client exists but webhook handling is a stub

## Stories

### Phase 1: Free Tier & Content Gating

#### Story 1: Free tier content gating enforcement
- **id:** MEM-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] All new users get `subscription_level = 'free'` by default (existing behavior, verify)
  - [ ] Tracks with `tier_required = 'pro'` show paywall to free users
  - [ ] Tracks with `tier_required = 'premium'` show paywall to free and pro users
  - [ ] Tracks with `tier_required = 'free'` (or null) are accessible to all users
  - [ ] Lessons with `tier_required` set show paywall to insufficient tier users
  - [ ] Paywall shows which tier is required and links to /pricing
  - [ ] Content listing (track cards on /learn) shows lock icon for tier-gated content
  - [ ] Student can see that tier-gated content exists (preview) but cannot access full content
  - [ ] RLS policies enforce tier check at database level (not just UI)
- **contract_exposes:**
  - content_gating: "Free/pro/premium gating enforced on tracks and lessons. UI + DB level."
- **playwright_scenarios:**
  - Login as free user → /learn → verify pro tracks show lock icon
  - Click locked track → verify paywall displayed with tier requirement
  - Login as pro user → verify same track is accessible

#### Story 2: Pricing page with tier comparison
- **id:** MEM-02
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] `/pricing` page shows clear comparison of free, pro, and premium tiers
  - [ ] Each tier shows: price (if applicable), features included, content access level
  - [ ] Free tier highlights: what's included for free (community access, X free tracks, etc.)
  - [ ] Pro/Premium tiers show upgrade benefits
  - [ ] "Current plan" indicator for logged-in users
  - [ ] Call-to-action button: Free users see "Upgrade", paid users see "Current Plan" on their tier
  - [ ] If Stripe is not integrated: CTA links to a contact/WhatsApp form instead of checkout
  - [ ] Pricing page accessible without login (public route)
- **contract_exposes:**
  - pricing_page: "Tier comparison page at /pricing. Shows current plan for logged-in users."
- **playwright_scenarios:**
  - Visit /pricing (not logged in) → verify 3 tiers displayed
  - Login as free user → /pricing → verify "Current Plan" on free tier

#### Story 3: Admin subscription tier management
- **id:** MEM-03
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Admin user management page shows subscription tier for each user
  - [ ] Admin can change a user's subscription tier (free → pro → premium)
  - [ ] Tier change takes effect immediately (no Stripe needed for admin-managed tiers)
  - [ ] Admin can filter user list by subscription tier
  - [ ] Admin can see count of users per tier (stats on dashboard)
  - [ ] Tier change is logged (optional: audit trail in `subscriptions` table history)
  - [ ] Admin cannot change their own tier to below current (self-protection)
- **contract_exposes:**
  - admin_tier_management: "Admin can view and change user subscription tiers. Immediate effect."
- **playwright_scenarios:**
  - Login as admin → /admin/users → change user tier from free to pro → verify change persists
  - Verify user now has access to pro content

### Phase 2: Registration & Onboarding

#### Story 4: Registration to free member flow
- **id:** MEM-04
- **points:** M
- **deps:** [MEM-01]
- **acceptance_criteria:**
  - [ ] New user registers → automatically gets `subscription_level = 'free'`
  - [ ] After registration, user is redirected to /feed (or onboarding page if we create one)
  - [ ] Free user can access: feed, community, free tracks, profile, ranking, members
  - [ ] Free user sees paywall on: pro/premium tracks, pro/premium lessons
  - [ ] Free user can see the full platform navigation (all sidebar items visible)
  - [ ] No features are completely hidden from free users — they see locked content with upgrade prompts
  - [ ] Email verification flow works (if Supabase email verification is enabled)
- **contract_exposes:**
  - free_member_flow: "Registration → free tier → full navigation with gated content."
- **playwright_scenarios:**
  - Register new account → verify redirected to /feed
  - Navigate through platform → verify free content accessible, paid content shows paywall

#### Story 5: Member directory enhancements
- **id:** MEM-05
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] `/members` page shows all public profiles with search and filter
  - [ ] Filters: role (aluno, contribuidor, moderador), subscription tier, search by name
  - [ ] Each member card shows: avatar, name, role badge, tier badge, level, XP
  - [ ] Clicking member card navigates to `/members/[username]`
  - [ ] Member profile page shows: bio, social links (from E1), stack, XP, level, badges, recent activity
  - [ ] Private profiles show "This profile is private" message
  - [ ] Members-only profiles visible to authenticated users, hidden from public
- **contract_exposes:**
  - member_directory: "Searchable member directory with role/tier filters. Profile privacy enforced."
- **playwright_scenarios:**
  - Login → /members → search by name → verify results filter
  - Click member card → verify profile displays with all fields
  - Set profile to private → visit from other account → verify "private" message

### Phase 3: E2E Verification

#### Story 6: E2E test — Subscription and gating
- **id:** MEM-06
- **points:** L
- **deps:** [MEM-04, MEM-05]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/members/subscription-gating.spec.ts`
  - [ ] Test: Free user sees paywall on pro tracks → cannot access lesson content
  - [ ] Test: Admin upgrades user to pro → user can now access pro tracks
  - [ ] Test: Pricing page displays correctly for logged-in and logged-out users
  - [ ] Test: Registration creates free-tier user with full navigation
  - [ ] Test: Member directory search and filter works
  - [ ] Test: Private profile not visible to other users
  - [ ] Test: Admin tier management works (change tier → verify access changes)
  - [ ] All tests pass
- **contract_exposes:**
  - subscription_tested: "Content gating, tier management, registration flow, member directory all verified E2E"

## Regression Suite

After this epic, run E1-E6 regression PLUS:
- Free tier content gating
- Pricing page display
- Admin tier management
- Registration to free member flow
- Member directory search/filter
- Profile privacy
