# Epic E8 — Security Hardening

> **For epic-executor:** Execute wave-by-wave. This is the FINAL epic — runs after all others. Audit-focused.
> **Required pre-reading by every wave's build subagent:**
> 1. Middleware: `automatiklabs/src/middleware.ts` (created in E1)
> 2. RLS policies: `automatiklabs/supabase/migrations/00002_rls_core.sql`, `00006_rls_community.sql`, `00010_rls_features.sql`
> 3. Security headers: `automatiklabs/next.config.ts`
> 4. All env files: `.env.local`, `.env.example`
> 5. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml`
> 6. Skills: `senior-backend`
> 7. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Comprehensive **security audit and hardening** of the entire platform. Fix vulnerabilities, harden auth, prevent data leaks, ensure RLS coverage, and validate with penetration-style E2E tests.

## Context

The platform has good foundational security:
- RLS policies exist across 6 migration files
- Security headers configured in next.config.ts (HSTS, X-Frame-Options, etc.)
- DOMPurify used for HTML content sanitization
- API key hashing (SHA256) for AI agents
- Role-based and subscription-based guards exist

But several gaps were identified:
- **Middleware was dead code** (fixed in E1, needs verification)
- **JWT admin check can be stale** — role from JWT, not DB
- **No CSP header** — Content Security Policy not configured
- **No rate limiting** on auth endpoints
- **No robots.txt** blocking protected pages from indexing
- **Potential IDOR** — need to verify server actions check ownership
- **Client-side state manipulation** — verify guards can't be bypassed

## Stories

### Phase 1: Auth Hardening

#### Story 1: Rate limiting on auth endpoints
- **id:** SEC-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Rate limiting applied to: login, register, magic-link, reset-password actions
  - [ ] Limits: max 5 attempts per email per 15 minutes for login, max 3 registrations per IP per hour
  - [ ] Use existing `rate-limit.ts` utility (or enhance it)
  - [ ] Rate limit info stored in memory (or Supabase if persistent needed)
  - [ ] When rate limited, return clear error message: "Too many attempts. Try again in X minutes."
  - [ ] Rate limit headers returned: X-RateLimit-Limit, X-RateLimit-Remaining
  - [ ] Does NOT affect legitimate users (limits are generous enough for normal use)
- **contract_exposes:**
  - auth_rate_limiting: "Auth endpoints rate limited: 5 login/15min, 3 register/hour per IP."
- **playwright_scenarios:**
  - Submit login form 6 times rapidly with wrong password → verify rate limit error on 6th attempt

#### Story 2: Admin role verification from database
- **id:** SEC-02
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Admin routes (server actions, not just middleware) verify role from `user_profiles` table, not just JWT claims
  - [ ] `assertAdmin()` helper already checks DB (verify this is the case)
  - [ ] If JWT says admin but DB says aluno, access is denied
  - [ ] Admin API routes also check DB role (not just server actions)
  - [ ] Log suspicious attempts: JWT role mismatch with DB role
- **contract_exposes:**
  - admin_db_check: "Admin access verified against DB, not just JWT claims."
- **playwright_scenarios:**
  - (Verified via code review + existing admin tests from E2)

#### Story 3: Session security hardening
- **id:** SEC-03
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Supabase session cookies use: HttpOnly, Secure, SameSite=Lax (verify config)
  - [ ] Session refresh works correctly (no stale sessions persisting)
  - [ ] After password change, all other sessions are invalidated
  - [ ] After account deletion (soft-delete), session is terminated immediately
  - [ ] No session data exposed in client-side JavaScript (only in HttpOnly cookies)
  - [ ] CSRF protection: verify Next.js server actions have built-in CSRF protection
- **contract_exposes:**
  - session_security: "Sessions use HttpOnly + Secure cookies. Password change invalidates sessions."

### Phase 2: Data Protection

#### Story 4: Content Security Policy (CSP) headers
- **id:** SEC-04
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] CSP header added to next.config.ts headers
  - [ ] Policy allows: self for scripts/styles, Supabase domain for API calls, YouTube/Vimeo for video embeds
  - [ ] Policy blocks: inline scripts (except Next.js required), external scripts from unknown domains
  - [ ] Report-only mode first (Content-Security-Policy-Report-Only) to detect issues
  - [ ] No existing functionality breaks after adding CSP
  - [ ] Test: verify script injection via Markdown content is blocked by CSP even if renderer has a bug
- **contract_exposes:**
  - csp_headers: "Content Security Policy blocks unauthorized scripts. Report-only initially."
- **playwright_scenarios:**
  - Load any page → verify CSP header present in response
  - Verify YouTube/Vimeo video embeds still work with CSP

#### Story 5: IDOR protection audit
- **id:** SEC-05
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Audit ALL server actions that accept an ID parameter (user_id, post_id, lesson_id, etc.)
  - [ ] Every action that modifies data verifies the requesting user has permission (not just auth)
  - [ ] Examples to verify:
    - `updateProfile(userId)` → verify userId matches authenticated user (or admin)
    - `deleteComment(commentId)` → verify comment belongs to user (or user is moderator)
    - `updateUserRole(targetId)` → verify requesting user is admin
    - `createPost(channelId)` → verify user has access to channel
  - [ ] Fix any actions that don't verify ownership/permission
  - [ ] RLS policies serve as defense-in-depth (even if action doesn't check, RLS blocks)
  - [ ] Document all verified actions in a security checklist
- **contract_exposes:**
  - idor_protection: "All mutation actions verify ownership/permission. RLS as defense-in-depth."

#### Story 6: SEO and indexing protection
- **id:** SEC-06
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] `robots.txt` exists at `/public/robots.txt`
  - [ ] Blocks: /admin/*, /api/*, /profile/*, /settings/*
  - [ ] Allows: /, /pricing, /free-content/*
  - [ ] Protected pages have `<meta name="robots" content="noindex, nofollow">` via metadata
  - [ ] `sitemap.xml` only includes public pages (if it exists)
  - [ ] No user data leaked in HTML source of public pages
- **contract_exposes:**
  - seo_protection: "robots.txt blocks sensitive routes. Protected pages have noindex meta."
- **playwright_scenarios:**
  - Fetch /robots.txt → verify /admin/* and /api/* are disallowed
  - Check /feed page source → verify noindex meta tag present

### Phase 3: E2E Security Verification

#### Story 7: E2E test — Security penetration tests
- **id:** SEC-07
- **points:** L
- **deps:** [SEC-01, SEC-03, SEC-04, SEC-05, SEC-06]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/security/security.spec.ts`
  - [ ] Test: Unauthenticated access to /admin → redirect to /login
  - [ ] Test: Aluno role access to /admin → redirect to /feed
  - [ ] Test: Rate limiting on login endpoint (rapid attempts → blocked)
  - [ ] Test: CSP header present on all pages
  - [ ] Test: robots.txt blocks sensitive routes
  - [ ] Test: Protected page HTML source has noindex meta
  - [ ] Test: XSS attempt in post content → rendered as escaped text (not executed)
  - [ ] Test: Direct URL access to another user's edit profile → denied
  - [ ] Test: After logout, cannot access /feed (redirect to /login)
  - [ ] All tests pass
- **contract_exposes:**
  - security_tested: "Auth enforcement, rate limiting, CSP, IDOR, XSS, SEO protection all verified E2E"

#### Story 8: Final security audit report
- **id:** SEC-08
- **points:** M
- **deps:** [SEC-07]
- **acceptance_criteria:**
  - [ ] Run FULL regression suite (all E1-E7 tests)
  - [ ] Generate security audit report documenting:
    - All RLS policies and their coverage
    - All server action permission checks
    - All security headers configured
    - All rate limits in place
    - Known limitations and recommended future improvements
  - [ ] Report saved to `docs/security-audit-report.md`
  - [ ] No critical or high-severity issues remaining
  - [ ] All E2E tests pass (including all regression tests from E1-E7)
- **contract_exposes:**
  - security_audit_complete: "Full platform security audit documented. All tests passing."

## Regression Suite

FINAL regression: ALL tests from E1-E8 must pass:
- Auth flows (E1)
- Admin CMS (E2)
- Learning flow (E3)
- Gamification (E4)
- Navigation (E5)
- Feed & social (E6)
- Subscriptions (E7)
- Security (E8)
