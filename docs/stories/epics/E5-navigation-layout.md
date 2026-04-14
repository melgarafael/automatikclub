# Epic E5 — Navigation & Layout (Expandable Sidebar)

> **For epic-executor:** Execute wave-by-wave. Depends on E1 (auth for user avatar).
> **Required pre-reading by every wave's build subagent:**
> 1. Layout components: `automatiklabs/src/shared/components/layouts/` (left-sidebar, right-panel, tri-panel, topbar)
> 2. Constants: `automatiklabs/src/shared/utils/constants.ts` (RAIL_WIDTH, RIGHT_PANEL_WIDTH)
> 3. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml`
> 4. Skills: `senior-frontend`
> 5. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Transform the sidebar from a fixed icon-only rail into an **expandable sidebar** with labels, and connect the right panel to real data. Improve overall navigation UX.

## Context

Current sidebar is a 56px icon-only rail with emoji icons and hardcoded "RM" user initials. Right panel has entirely hardcoded/placeholder data (fake leaderboard, fake streak, fake badges, fake online users). Topbar search is non-functional.

## Stories

### Phase 1: Expandable Sidebar

#### Story 1: Sidebar expand/collapse toggle
- **id:** NAV-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Sidebar has two states: collapsed (56px, icon-only) and expanded (~220px, icons + labels)
  - [ ] Toggle button (hamburger/chevron icon) at the top of sidebar switches between states
  - [ ] Expanded state shows: icon + text label for each nav item
  - [ ] Collapsed state shows: icon only with tooltip on hover (existing behavior)
  - [ ] Sidebar state persists across page navigation (React state, not localStorage)
  - [ ] Smooth CSS transition between states (width + opacity for labels)
  - [ ] Tri-panel layout adjusts: center panel takes remaining space when sidebar changes width
  - [ ] Keyboard shortcut: `[` key toggles sidebar (when not in an input field)
- **contract_exposes:**
  - expandable_sidebar: "Sidebar has collapsed (56px) and expanded (220px) states with toggle."
- **playwright_scenarios:**
  - Load /feed → verify sidebar starts collapsed (icon-only)
  - Click toggle button → verify sidebar expands with labels visible
  - Click toggle again → verify sidebar collapses
  - Navigate to /learn → verify sidebar state persists

#### Story 2: Dynamic user avatar in sidebar
- **id:** NAV-02
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Sidebar bottom shows current user's actual avatar (from `user_profiles.avatar_url`)
  - [ ] If no avatar, shows initials derived from `full_name` (first letter of each word)
  - [ ] If no full_name, shows first letter of email
  - [ ] Avatar is clickable → navigates to /profile
  - [ ] In expanded mode, shows user's name next to avatar
  - [ ] Uses `useAuth()` hook to get user data (contract from E1)
- **contract_exposes:**
  - dynamic_avatar: "Sidebar shows real user avatar/initials from useAuth()"
- **playwright_scenarios:**
  - Login → verify sidebar shows correct user initials or avatar
  - Click avatar → verify navigation to /profile

### Phase 2: Right Panel Real Data

#### Story 3: Right panel with real leaderboard data
- **id:** NAV-03
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Right panel leaderboard section fetches real data from `user_xp` table (top 5-10 users)
  - [ ] Shows user avatar, name, XP, level for each entry
  - [ ] Current user highlighted in the list
  - [ ] Updates periodically (every 60 seconds) or on page navigation
  - [ ] "Ver ranking completo" link navigates to /ranking
  - [ ] Empty state if no users have XP yet
- **contract_exposes:**
  - real_leaderboard: "Right panel shows top users by XP from user_xp table."
- **playwright_scenarios:**
  - Login → verify leaderboard shows real user data (at least current user if only one)

#### Story 4: Right panel with real online/active users
- **id:** NAV-04
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Right panel shows recently active users (activity in last 15 minutes) using Supabase Presence or last_activity_date
  - [ ] Shows user avatar, name, and activity indicator (green dot)
  - [ ] If using Supabase Presence: subscribes to a presence channel and tracks online status
  - [ ] If using last_activity_date: fetches users with recent activity from DB
  - [ ] Maximum 10 users shown, with "e mais X online" count if more
  - [ ] AI agents (if any) marked with bot indicator
  - [ ] Fallback: if realtime not available, show "Recently Active" instead of "Online Now"
- **contract_exposes:**
  - online_users: "Right panel shows recently active users with presence indicators."
- **playwright_scenarios:**
  - Login → verify at least current user appears in active users section

### Phase 3: E2E Verification

#### Story 5: E2E test — Navigation and layout
- **id:** NAV-05
- **points:** M
- **deps:** [NAV-01, NAV-02, NAV-03, NAV-04]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/navigation/layout.spec.ts`
  - [ ] Test: Sidebar toggle expand/collapse works
  - [ ] Test: All sidebar nav links navigate to correct pages
  - [ ] Test: User avatar shows real user data
  - [ ] Test: Right panel leaderboard shows data
  - [ ] Test: Right panel active users shows at least current user
  - [ ] Test: Mobile responsive — sidebar auto-collapses on small screens
  - [ ] Test: Active nav item highlighted correctly on each page
  - [ ] All tests pass
- **contract_exposes:**
  - navigation_tested: "Sidebar toggle, nav links, right panel data all verified E2E"

## Regression Suite

After this epic, run E1-E4 regression PLUS:
- Sidebar expand/collapse toggle
- Dynamic user avatar
- Right panel real data (leaderboard + active users)
- Navigation links
- Mobile responsive behavior
