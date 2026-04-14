# Security Audit Report — AutomatikLabs

**Date:** 2026-04-13
**Epic:** E8 — Security Hardening
**Auditor:** Automated (Claude) + Manual Review

---

## 1. Row-Level Security (RLS) Coverage

All tables have RLS enabled with appropriate policies:

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `user_profiles` | auth'd | owner | owner (no role/tier self-edit) + admin | owner + admin | Role escalation blocked via WITH CHECK |
| `subscriptions` | owner + admin | owner + admin | owner + admin | admin only | |
| `user_preferences` | owner + admin | owner | owner | - | |
| `tracks` | auth'd (published) | admin | admin | admin | Via learning RLS |
| `courses` | auth'd (published) | admin | admin | admin | Via learning RLS |
| `lessons` | auth'd (published) | admin | admin | admin | Via learning RLS |
| `modules` | auth'd (published) | admin | admin | admin | Via learning RLS |
| `posts` | auth'd | auth'd (own) | author + mod | mod+ | Community RLS |
| `comments` | auth'd | auth'd (own) | author + mod | mod+ | Community RLS |
| `channels` | auth'd | admin | admin | admin | Community RLS |
| `marketplace_items` | approved + own + mod | contribuidor+ (own, pending) | author + mod | admin | |
| `marketplace_reviews` | auth'd | own | own | own + admin | |
| `ai_agents` | active + own + admin | contribuidor+ (own) | own + admin | own + admin | |
| `ai_posts` | approved + agent-owner + mod | agent-owner (pending) | mod | mod+ | |
| `challenges` | active + mod | mod+ | mod+ | admin | |
| `challenge_participations` | own + mod | own | own + mod | - | |
| `xp_transactions` | own + admin | service_role only | - | - | |
| `user_xp` | auth'd (leaderboard) | own | own | - | |
| `badges` | auth'd | admin | admin | admin | |
| `user_badges` | auth'd | trigger only | - | - | |
| `gacha_*` | See 00015 migration | Security-hardened RPC | - | - | Atomic via SECURITY DEFINER |

**Coverage:** 100% of user-facing tables have RLS enabled. No tables are accessible without authentication.

---

## 2. Server Action Permission Checks

### Auth Actions

| Action | Auth Check | Rate Limit | Notes |
|---|---|---|---|
| `login` | N/A (public) | 5/email/15min | SEC-01 |
| `register` | N/A (public) | 3/IP/hour | SEC-01 |
| `sendMagicLink` | N/A (public) | 3/email/15min | SEC-01 |
| `resetPassword` | N/A (public) | 3/email/15min | SEC-01 |
| `changePassword` | `getUser()` | N/A | Verifies current password + signs out other sessions (SEC-03) |
| `updatePassword` | `getUser()` | N/A | Used after reset flow |
| `updateProfile` | `getUser()` → `.eq("id", user.id)` | N/A | IDOR-safe: always updates own profile |
| `uploadAvatar` | `getUser()` → `.eq("id", user.id)` | N/A | IDOR-safe |
| `updateUserRole` | DB `role === 'admin'` check | N/A | Prevents self-demotion |
| `deleteAccount` | `getUser()` + confirmation string | N/A | Soft-delete + signOut |

### Admin Actions

All admin actions use `assertAdmin()` which:
1. Calls `getUser()` (validates JWT with Supabase server)
2. Queries `user_profiles.role` from DB
3. Checks `profile.role !== "admin"` → rejects

| Module | Actions Protected | DB Role Check |
|---|---|---|
| `manage-content.ts` | CRUD tracks/courses/modules/lessons, upload, publish toggle | `assertAdmin()` (DB) |
| `manage-users.ts` | getAdminUsers, updateUserRole, updateUserTier, removeUser | `assertAdmin()` (DB) |
| `manage-settings.ts` | getPlatformSettings, updatePlatformSettings | `assertAdmin()` (DB) |
| `manage-challenges.ts` | CRUD challenges | `assertAdmin()` (DB) |
| `get-dashboard-stats.ts` | getDashboardStats, getPendingCounts, getWeeklyStats | `assertAdmin()` (DB) |

### Community / Content Actions

| Action | Auth Check | Ownership Check |
|---|---|---|
| `createPost` | `getUser()` | Sets `author_id: user.id` |
| `createComment` (community) | `getUser()` | Sets `author_id: user.id` |
| `createComment` (comments) | `getUser()` | Sets `author_id: user.id` + rate limit (10/hour) |
| `moderateComment` | DB `role` in [moderador, admin] | N/A (moderator action) |
| `createItem` (marketplace) | `getUser()` + DB role >= contribuidor | Sets `author_id: user.id` |
| `likePost`/`likeComment` | `getUser()` | Sets `user_id: user.id` |

---

## 3. Security Headers

Configured in `next.config.ts` (static headers) and `proxy.ts` (middleware):

| Header | Value | Source |
|---|---|---|
| `X-Frame-Options` | `DENY` | next.config.ts + proxy.ts |
| `X-Content-Type-Options` | `nosniff` | next.config.ts + proxy.ts |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | next.config.ts + proxy.ts |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | next.config.ts + proxy.ts |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | next.config.ts |
| `Content-Security-Policy-Report-Only` | Full CSP with self, Supabase, YouTube, Vimeo | next.config.ts (SEC-04) |

**CSP Directive Breakdown:**
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (required by Next.js)
- `frame-src 'self' youtube.com youtube-nocookie.com vimeo.com`
- `connect-src 'self' supabase wss://supabase`
- `object-src 'none'`
- `frame-ancestors 'none'`

---

## 4. Rate Limits

| Endpoint | Key | Limit | Window |
|---|---|---|---|
| `login` | email (lowercase) | 5 | 15 min |
| `register` | IP (x-forwarded-for) | 3 | 1 hour |
| `sendMagicLink` | email (lowercase) | 3 | 15 min |
| `resetPassword` | email (lowercase) | 3 | 15 min |
| `createComment` (lesson comments) | user_id (DB count) | 10 | 1 hour |

Implementation: In-memory sliding window (`src/shared/lib/rate-limit.ts`). Stateless per server instance.

---

## 5. Session Security

- **Cookie config:** Managed by `@supabase/ssr` which sets `HttpOnly`, `Secure` (in production), `SameSite=Lax` by default.
- **Session refresh:** `proxy.ts` calls `getUser()` on every request, which validates JWT with Supabase server.
- **Password change:** Signs out all other sessions (`scope: "others"`) after successful password update.
- **Soft-delete:** `proxy.ts` checks `is_deleted` flag and signs out + redirects deleted users.
- **CSRF:** Next.js server actions have built-in CSRF protection via the `Origin` header check.

---

## 6. SEO / Indexing Protection

- `public/robots.txt` blocks: `/admin/*`, `/api/*`, `/profile/*`, `/settings/*`, `/feed/*`, `/learn/*`, `/community/*`, `/marketplace/*`, `/ranking/*`, `/members/*`, auth pages
- `robots.txt` allows: `/`, `/pricing`, `/free-content/*`
- `<meta name="robots" content="noindex, nofollow">` on admin layout and platform layout via Next.js `metadata` export

---

## 7. Known Limitations

1. **Rate limiting is in-memory:** Does not survive server restarts and is per-instance in multi-server deployments. For production scale, migrate to `@upstash/ratelimit` + Redis.
2. **CSP in report-only mode:** `Content-Security-Policy-Report-Only` does not block violations yet. After monitoring logs for false positives, switch to enforcing `Content-Security-Policy`.
3. **No CSP report-uri configured:** Violations are logged in browser console but not collected server-side. Consider adding a `/api/csp-report` endpoint.
4. **Admin role in proxy.ts uses JWT claims:** The middleware admin check (step 5 in proxy.ts) reads from JWT `app_metadata.role` for speed. However, all admin server actions verify role from DB via `assertAdmin()`, so this is defense-in-depth — the JWT check in middleware is a fast-reject, not the sole gate.
5. **No IP-based login rate limiting:** Login is rate-limited by email only. A distributed brute-force attack cycling emails from a single IP is not rate-limited. Consider adding IP-based limiting as a secondary layer.
6. **`unsafe-inline` and `unsafe-eval` in CSP:** Required by Next.js for script execution. Can be tightened with nonce-based CSP in future iterations.
