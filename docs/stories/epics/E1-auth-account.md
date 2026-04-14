# Epic E1 — Auth & Account System

> **For epic-executor:** Execute wave-by-wave. This is the FOUNDATION epic — all other epics depend on it.
> **Required pre-reading by every wave's build subagent:**
> 1. Auth feature: `automatiklabs/src/features/auth/` (actions, components, schemas, types)
> 2. Database schema: `automatiklabs/supabase/migrations/00001_core_users.sql`
> 3. Middleware: `automatiklabs/src/proxy.ts`
> 4. Skills: `senior-frontend`, `senior-backend`
> 5. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Make the authentication, registration, profile, and account management flows **100% functional and tested end-to-end**. Fix all schema mismatches, wire the middleware, add missing social links, and ensure every auth flow works from login to logout.

## Context

The auth system is ~75% complete. Core Supabase auth calls work (login, register, magic link, password reset). BUT:
- **middleware.ts does NOT exist** — `proxy.ts` exports a function but nothing imports it. Protected routes may not be enforced.
- **Schema mismatches** — Code reads `xp`, `level`, `streak` from `user_profiles` but they live in `user_xp` table.
- **ProfileHeader crashes** on null `full_name` (`.split()` on null).
- **Social links missing** — Only Instagram & WhatsApp exist. Need LinkedIn, GitHub, YouTube, Reddit.
- **Soft-delete broken** — `is_deleted`/`deleted_at` columns don't exist in DB.
- **Preferences broken** — Code updates `user_profiles` but notification/privacy fields are in `user_preferences` table.

## Stories

### Phase 1: Critical Infrastructure

#### Story 1: Wire Next.js middleware
- **id:** AUTH-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] File `automatiklabs/src/middleware.ts` exists and exports a default middleware function
  - [ ] Middleware imports and calls the auth logic from `proxy.ts` (or inlines equivalent logic)
  - [ ] Middleware `config.matcher` covers all protected routes: `/feed`, `/learn`, `/community`, `/marketplace`, `/ranking`, `/members`, `/settings`, `/admin`, `/profile`
  - [ ] Unauthenticated users accessing any protected route are redirected to `/login?redirectTo={original_path}`
  - [ ] Authenticated users accessing `/login` or `/registro` are redirected to `/feed`
  - [ ] Admin routes (`/admin/*`) return redirect to `/feed` for non-admin users (NOT a 403)
  - [ ] Public routes (`/`, `/pricing`, `/free-content/*`) remain accessible without auth
  - [ ] Security headers (X-Frame-Options, X-Content-Type-Options, etc.) are applied
  - [ ] `npm run build` succeeds with no errors
- **contract_exposes:**
  - middleware: "All protected routes enforce auth at edge. Admin routes enforce role=admin."
- **playwright_scenarios:**
  - Navigate to /learn without auth → verify redirect to /login?redirectTo=/learn
  - Navigate to /admin without auth → verify redirect to /login
  - Login as aluno → navigate to /admin → verify redirect to /feed (not 403)
  - Navigate to / without auth → verify page loads normally
  - Navigate to /pricing without auth → verify page loads normally

#### Story 2: Fix ProfileHeader null crash
- **id:** AUTH-02
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] `ProfileHeader` component handles `full_name` being null, undefined, or empty string
  - [ ] When `full_name` is null, initials show a fallback (e.g., first letter of email, or "?" icon)
  - [ ] No runtime errors in console when rendering profile with null full_name
  - [ ] Component renders correctly with: full name, partial name (one word), null, empty string
- **contract_exposes:**
  - profile_header_safe: "ProfileHeader handles null/undefined full_name without crashing"
- **playwright_scenarios:**
  - Load profile page for user with full_name set → verify initials render correctly
  - (Unit test) Render ProfileHeader with null full_name → no crash

#### Story 3: Fix schema mismatch — XP/Level/Streak
- **id:** AUTH-03
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] `useAuth()` hook fetches XP data from `user_xp` table (joined or separate query), NOT from `user_profiles`
  - [ ] `AuthUser` type still has `xp`, `level`, `streak` fields (contract preserved)
  - [ ] When `user_xp` row doesn't exist for a user, defaults to `{ total_xp: 0, level: 1, current_streak: 0 }`
  - [ ] ProfileHeader displays correct XP, level, and streak from `user_xp`
  - [ ] No TypeScript errors after the change
  - [ ] `user_profiles` table is NOT modified (no migration needed for this)
- **contract_exposes:**
  - auth_user_xp: "useAuth() returns merged profile + XP data. XP comes from user_xp table."
- **playwright_scenarios:**
  - Login → navigate to /profile → verify XP/level/streak display matches user_xp table data
  - New user with no user_xp row → verify defaults (0 XP, level 1, 0 streak)

#### Story 4: Fix preferences — notification & privacy
- **id:** AUTH-04
- **points:** M
- **deps:** [AUTH-03]
- **acceptance_criteria:**
  - [ ] `updateNotificationPreferences()` action updates `user_preferences` table (not `user_profiles`)
  - [ ] `updatePrivacyPreferences()` action updates `user_preferences.profile_visibility`
  - [ ] `useAuth()` hook fetches preferences from `user_preferences` table and merges into user object
  - [ ] Settings page (/settings) displays current notification and privacy settings correctly
  - [ ] Changing notification preferences persists after page refresh
  - [ ] Changing profile visibility persists and is respected by `/members/[username]` page
  - [ ] If `user_preferences` row doesn't exist, auto-create with defaults on first save
- **contract_exposes:**
  - preferences_system: "Preferences read/write from user_preferences table. Auto-creates row if missing."
- **playwright_scenarios:**
  - Login → /settings → toggle notification_email off → refresh → verify toggle is still off
  - Login → /settings → set visibility to "private" → visit own profile from another browser context → verify profile not visible

### Phase 2: Social Links & Profile

#### Story 5: Add social links to database
- **id:** AUTH-05
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] New Supabase migration adds columns to `user_profiles`: `linkedin TEXT`, `github TEXT`, `youtube TEXT`, `reddit TEXT`
  - [ ] Migration is idempotent (uses IF NOT EXISTS or similar pattern)
  - [ ] Existing data is preserved (ALTER TABLE ADD COLUMN, no drops)
  - [ ] RLS policies still work after migration
- **contract_exposes:**
  - social_links_schema: "user_profiles has linkedin, github, youtube, reddit TEXT columns"
- **playwright_scenarios:**
  - (DB verification) After migration, columns exist in user_profiles table

#### Story 6: Add social links to profile edit form
- **id:** AUTH-06
- **points:** M
- **deps:** [AUTH-05]
- **acceptance_criteria:**
  - [ ] Profile edit form (`/profile/edit`) has fields for: Instagram, LinkedIn, GitHub, YouTube, Reddit, WhatsApp (6 total)
  - [ ] Each field has appropriate validation (URL format for LinkedIn/GitHub/YouTube, @username for Instagram/Reddit)
  - [ ] `updateProfile()` action saves all 6 social link fields to `user_profiles`
  - [ ] `profileSchema` Zod schema validates all 6 fields
  - [ ] Social links display on profile page (`/profile` and `/members/[username]`) with clickable icons/links
  - [ ] Empty social links don't render (no broken empty links)
  - [ ] ProfileHeader component shows social link icons when present
- **contract_exposes:**
  - social_links_ui: "Profile edit form supports 6 social links. Profile display shows icons for set links."
- **playwright_scenarios:**
  - Login → /profile/edit → fill LinkedIn URL → save → go to /profile → verify LinkedIn icon appears with correct link
  - Login → /profile/edit → leave YouTube empty → save → /profile → verify no YouTube icon
  - Visit /members/{username} → verify social links display for that user

#### Story 7: Fix soft-delete account
- **id:** AUTH-07
- **points:** S
- **deps:** [AUTH-05]
- **acceptance_criteria:**
  - [ ] New migration adds `is_deleted BOOLEAN DEFAULT FALSE` and `deleted_at TIMESTAMPTZ` to `user_profiles`
  - [ ] `deleteAccount()` action successfully sets `is_deleted = true` and `deleted_at = now()`
  - [ ] RLS policy updated: `is_deleted = true` profiles are excluded from all SELECT queries (except admin)
  - [ ] Soft-deleted users cannot login (middleware or auth check rejects them)
  - [ ] Admin can see soft-deleted users in admin panel (with visual indicator)
- **contract_exposes:**
  - soft_delete: "Deleted accounts are soft-deleted, hidden from public queries, and cannot login."
- **playwright_scenarios:**
  - Login → /settings → delete account → confirm → verify redirected to /login
  - After deletion → try to login with same credentials → verify rejected

### Phase 3: Auth Flow Verification

#### Story 8: E2E test — Registration flow
- **id:** AUTH-08
- **points:** M
- **deps:** [AUTH-01, AUTH-02, AUTH-03]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/auth/register.spec.ts`
  - [ ] Test: Fill registration form (full_name, email, password, confirm, terms) → submit → verify redirect to /feed or email confirmation page
  - [ ] Test: Register with existing email → verify error message shown
  - [ ] Test: Register with weak password → verify validation error
  - [ ] Test: Register with mismatched passwords → verify validation error
  - [ ] Test: Register without accepting terms → verify button disabled or error
  - [ ] After successful registration, `user_profiles` row exists in DB
  - [ ] After successful registration, `user_xp` row exists (or is created on first profile load)
  - [ ] All tests pass in CI
- **contract_exposes:**
  - registration_tested: "Registration flow verified E2E with 5+ scenarios"
- **playwright_scenarios:**
  - (This IS the test story — the acceptance criteria define the tests)

#### Story 9: E2E test — Login & session flows
- **id:** AUTH-09
- **points:** M
- **deps:** [AUTH-01, AUTH-08]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/auth/login.spec.ts`
  - [ ] Test: Login with valid email/password → verify redirect to /feed
  - [ ] Test: Login with wrong password → verify error message
  - [ ] Test: Login with non-existent email → verify error message
  - [ ] Test: Magic link flow (request → verify success message shown)
  - [ ] Test: Session persistence — login → close tab → reopen /feed → verify still logged in
  - [ ] Test: Logout → verify redirect to /login → verify /feed redirects to /login
  - [ ] Test: Password reset flow — request → verify success message
  - [ ] All tests pass in CI
- **contract_exposes:**
  - login_tested: "Login, logout, magic link, password reset verified E2E"

#### Story 10: E2E test — Profile management
- **id:** AUTH-10
- **points:** M
- **deps:** [AUTH-06, AUTH-07]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/auth/profile.spec.ts`
  - [ ] Test: View own profile → verify all fields display correctly
  - [ ] Test: Edit profile (change bio, add social links) → save → verify changes persist
  - [ ] Test: Upload avatar → verify avatar displays on profile and sidebar
  - [ ] Test: Change password → logout → login with new password → verify success
  - [ ] Test: Visit another user's profile via /members/[username] → verify public fields visible
  - [ ] Test: Set profile to private → visit from another account → verify profile hidden
  - [ ] All tests pass in CI
- **contract_exposes:**
  - profile_tested: "Profile view, edit, avatar upload, privacy all verified E2E"

## Regression Suite

After this epic, the regression suite includes:
- Auth middleware enforcement (protected routes redirect)
- Registration → profile creation
- Login/logout session flow
- Profile edit with social links
- Privacy settings enforcement
- Soft-delete account flow
