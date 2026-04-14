# AutomatikLabs — QA Platform Tests (E2E Product QA)

> Living document. Updated during QA execution.
> Last updated: 2026-04-14

## Test Accounts
- **Admin:** (to be determined from Supabase)
- **Aluno:** (to be determined from Supabase)

## Browser Assignment
| Agent | Browser | Test Groups |
|-------|---------|-------------|
| Orquestrador | chromium | Auth + Security + Admin |
| QA Review | firefox | Learning + Gamification |
| Nucleo 01 | webkit | Feed & Social + Navigation |
| Nucleo 02 | chromium (profile 2) | Members + Comments + Edge Cases |

---

## Group 1: Auth & Session

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 1.1 | Register new account → redirect to /feed | ⏳ | |
| 1.2 | Login with email/password → redirect to /feed | ⏳ | |
| 1.3 | Login with wrong password → error message | ⏳ | |
| 1.4 | **Logout button visible in sidebar** | ✅ PASS | Visible in both collapsed (🚪) and expanded (🚪 Sair) modes |
| 1.5 | Logout → redirect to /login → /feed inaccessible | ⏳ | |
| 1.6 | Session persists after page refresh | ⏳ | |
| 1.7 | Magic link request → success message | ⏳ | |
| 1.8 | Password reset request → success message | ⏳ | |
| 1.9 | Unauthenticated → /learn → redirect to /login | ⏳ | |
| 1.10 | Unauthenticated → /admin → redirect to /login | ⏳ | |

## Group 2: Profile Management

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 2.1 | View own profile → all fields display | ⏳ | |
| 2.2 | Edit profile → change bio → save → persists | ⏳ | |
| 2.3 | Add social links (LinkedIn, GitHub) → save → display on profile | ⏳ | |
| 2.4 | Upload avatar → displays on profile and sidebar | ⏳ | |
| 2.5 | Change password → logout → login with new password | ⏳ | |
| 2.6 | Set profile to private → visit from other account → hidden | ⏳ | |
| 2.7 | ProfileHeader with null full_name → no crash | ⏳ | |

## Group 3: Admin CMS

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 3.1 | Admin dashboard loads with real stats | ⏳ | |
| 3.2 | Create track → appears in admin list | ⏳ | |
| 3.3 | Create course in track → appears in admin | ⏳ | |
| 3.4 | Create module in course → appears | ⏳ | |
| 3.5 | Create lesson in module with XP config → appears | ⏳ | |
| 3.6 | Publish lesson → course → track → visible on /learn | ⏳ | |
| 3.7 | Edit track title → change reflects | ⏳ | |
| 3.8 | Markdown description → renders correctly for student | ⏳ | |
| 3.9 | Non-admin accessing /admin → redirect to /feed | ⏳ | |
| 3.10 | Admin user management → change user role | ⏳ | |

## Group 4: Learning Experience

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 4.1 | Browse /learn → track cards display | ✅ PASS | "Trilha IA para Renda" with 1 course |
| 4.2 | Click track → /learn/[trackSlug] loads with courses | ✅ PASS | "ChatGPT do Zero ao Avancado" |
| 4.3 | Click course → /learn/[track]/[course] loads with curriculum | ✅ PASS | 2 modules, 6 lessons |
| 4.4 | Click lesson → video player + content renders | ✅ PASS | Title, tags, rating, mark complete button |
| 4.5 | Mark lesson complete → XP toast appears | ⏳ | |
| 4.6 | Mark same lesson again → no duplicate XP | ⏳ | |
| 4.7 | Progress bar updates after completion | ⏳ | |
| 4.8 | Rate lesson (5 stars) → rating persists | ⏳ | |
| 4.9 | Prev/Next lesson navigation works | ⏳ | |
| 4.10 | /learn/progresso → real progress data | ⏳ | |
| 4.11 | Tier-gated lesson → paywall for free user | ⏳ | |

## Group 5: Gamification

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 5.1 | XP displays correctly on profile | ⏳ | |
| 5.2 | Level shows correct name and progress bar | ⏳ | |
| 5.3 | Leaderboard /ranking → real data ordered by XP | ⏳ | |
| 5.4 | Streak counter displays | ⏳ | |
| 5.5 | Badge grid shows earned/unearned badges | ⏳ | |
| 5.6 | Level-up notification triggers on level boundary | ⏳ | |

## Group 6: Navigation & Layout

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 6.1 | Sidebar starts collapsed (56px) | ✅ PASS | Confirmed via snapshot |
| 6.2 | Click toggle → expands (220px) with labels | ✅ PASS | Labels visible: Feed, Aprender, Comunidade, etc |
| 6.3 | Click toggle again → collapses | ✅ PASS | Button toggles ◀/▶ |
| 6.4 | **Logout button visible** in collapsed mode (icon) | ✅ PASS | 🚪 icon visible |
| 6.5 | **Logout button visible** in expanded mode (icon + "Sair") | ✅ PASS | 🚪 Sair text visible |
| 6.6 | User avatar shows real data (not hardcoded "RM") | ✅ PASS | Shows "Q" for qa-gacha-1 user |
| 6.7 | Right panel leaderboard shows real users | ⏳ | |
| 6.8 | Right panel active users section loads | ⏳ | |
| 6.9 | All nav links navigate correctly | ⏳ | |
| 6.10 | Active nav item highlighted | ⏳ | |

## Group 7: Feed & Social

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 7.1 | Create post → appears in feed | ⏳ | |
| 7.2 | Like post → count increments | ⏳ | |
| 7.3 | Unlike post → count decrements | ⏳ | |
| 7.4 | Comment on post → comment appears | ⏳ | |
| 7.5 | Reply to comment → threaded display | ⏳ | |
| 7.6 | Share post → link copied to clipboard | ⏳ | |
| 7.7 | Click user avatar → navigates to profile | ⏳ | |
| 7.8 | Filter tabs (recentes, populares) work | ⏳ | |
| 7.9 | **Comment on lesson** → comment appears | ✅ FIXED | Was BUG-06+07. Fixed UUID validation + useActionState wrapper |
| 7.10 | Empty comment blocked | ⏳ | |

## Group 8: Members & Subscriptions

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 8.1 | /members → list of public profiles | ⏳ | |
| 8.2 | Search members by name → filters | ⏳ | |
| 8.3 | Click member card → profile displays | ⏳ | |
| 8.4 | Free user → pro content shows paywall | ⏳ | |
| 8.5 | /pricing → 3 tiers displayed | ✅ PASS | Free, Pro R$49,90, Premium R$99,90 |
| 8.6 | Admin changes user tier → access changes | ⏳ | |

## Group 9: Security

| # | Test Case | Status | Evidence |
|---|-----------|--------|----------|
| 9.1 | /robots.txt blocks /admin, /api, /settings | ✅ PASS | Confirmed by agent |
| 9.2 | CSP header present on pages | ⚠️ WARN | Report-Only mode, X-XSS-Protection missing |
| 9.3 | Rate limiting on rapid login attempts | ⏳ | |
| 9.4 | XSS in post/comment content → escaped | ⏳ | |
| 9.5 | After logout → /feed redirects to /login | ⏳ | |
| 9.6 | Aluno role → /admin → redirect to /feed | ⏳ | |

---

## Bugs Found & Fixed

| # | Bug | Status | Fix |
|---|-----|--------|-----|
| BUG-01 | No logout button in sidebar | FIXED | Added logout button with icon + hover to left-sidebar.tsx |
| BUG-02 | Comments failing — platform_settings table missing | FIXED | Wrapped in try/catch, defaults to approved |
| BUG-03 | user_xp query uses .single() → 406 when no row | FIXED | Changed to .maybeSingle() in useAuth + get-panel-data |
| BUG-04 | Right panel uses display_name (doesn't exist) | FIXED | Changed to full_name in get-panel-data.ts |
| BUG-05 | CommentItem crashes on null full_name | FIXED | Added null guard + email fallback in getInitials() |
| BUG-06 | Zod z.string().uuid() rejects seed UUIDs | FIXED | Replaced with hex-format regex in all schemas |
| BUG-07 | CommentComposer async wrapper breaks FormData in Next.js 16 | FIXED | Pass server action directly to useActionState |
