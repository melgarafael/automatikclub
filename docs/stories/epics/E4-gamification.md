# Epic E4 — Gamification System (Levels, XP Display, Level Math)

> **For epic-executor:** Execute wave-by-wave. Depends on E3 (XP wiring must work).
> **Required pre-reading by every wave's build subagent:**
> 1. Gamification feature: `automatiklabs/src/features/gamification/` (services, actions, components)
> 2. XP engine: `automatiklabs/src/features/gamification/services/xp-engine.ts`
> 3. Levels service: `automatiklabs/src/features/gamification/services/levels.ts`
> 4. Database: `automatiklabs/supabase/migrations/00007_gamification.sql`
> 5. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml`
> 6. Skills: `senior-frontend`, `senior-backend`
> 7. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Define coherent **long-term level math**, wire XP display to the profile and UI, implement level-up notifications, and prepare the level-gating infrastructure for future features.

## Context

The gamification engine is well-built (XP engine, badges, anti-gaming, challenges). Levels service has 15 levels defined but the math needs review for long-term coherence. Current level formula: `FLOOR(total_xp / 1000) + 1` in DB trigger. The levels.ts service defines named levels with XP thresholds up to 50,000 XP. Need to ensure these are coherent — a student completing 1 track (~10 courses × 10 lessons = 100 lessons × 10 XP = 1000 XP base) should feel meaningful progression.

Key issues:
- Level math needs balancing (current formula is too simple)
- XP display on profile uses wrong table (fixed in E1/AUTH-03 contract)
- Level-up notifications/animations don't trigger
- No level-gating infrastructure (future feature unlock by level)
- Streak calculation has a date comparison bug
- Badge criteria stats count XP transactions instead of actual actions

## Stories

### Phase 1: Level Math & Streak Fix

#### Story 1: Define coherent level progression math
- **id:** GAM-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Updated `levels.ts` with balanced XP thresholds for 20 levels that scale logarithmically
  - [ ] Level progression guidelines documented in code comments:
    - Level 1-5: Beginner (0-500 XP) — achievable in first track (~50 lessons)
    - Level 6-10: Intermediate (500-3000 XP) — 2-3 tracks
    - Level 11-15: Advanced (3000-12000 XP) — consistent engagement over months
    - Level 16-20: Master (12000-50000 XP) — long-term commitment, challenges, contributions
  - [ ] XP thresholds follow a curve: each level requires ~50% more XP than the previous (not linear)
  - [ ] DB trigger `recalculate_user_xp_trigger` updated to use the new thresholds (not simple formula)
  - [ ] Migration updates the trigger function
  - [ ] Each level has: name (Portuguese), icon/emoji, color theme, min_xp
  - [ ] `getLevelForXP()` and `getLevelProgress()` functions work with new thresholds
  - [ ] Unit tests verify level boundaries: XP=0 → level 1, XP at each boundary → correct level
- **contract_exposes:**
  - level_math: "20 levels with logarithmic XP curve. getLevelForXP() is the source of truth."
- **playwright_scenarios:**
  - (Unit tests) Verify getLevelForXP(0)=1, getLevelForXP(500)=6, getLevelForXP(50000)=20

#### Story 2: Fix streak calculation
- **id:** GAM-02
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Fix the streak trigger in DB: compare DATE values (not timestamps) for day difference
  - [ ] Streak increments when user has activity on consecutive days
  - [ ] Streak resets to 1 when gap > 1 day
  - [ ] `longest_streak` is updated whenever `current_streak > longest_streak`
  - [ ] Streak bonus XP awarded at milestones: 7 days (50 XP), 30 days (200 XP), 90 days (500 XP)
  - [ ] Migration updates the trigger
  - [ ] Streak data displays correctly on profile and progress dashboard
- **contract_exposes:**
  - streaks_fixed: "Streak calculation uses DATE comparison. Bonus XP at 7/30/90 day milestones."

#### Story 3: Fix badge criteria stats
- **id:** GAM-03
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] `getUserCriteriaStats()` counts ACTUAL actions, not XP transactions:
    - `lessons_completed` → count from `user_lesson_progress WHERE is_completed = true`
    - `courses_completed` → count from `user_course_progress WHERE is_completed = true`
    - `comments_posted` → count from `comments WHERE author_id = userId`
    - `posts_created` → count from `posts WHERE author_id = userId`
  - [ ] `total_points` still comes from `user_xp.total_xp` (correct)
  - [ ] Badge check runs after each XP award (already wired in E3)
  - [ ] New badges awarded show in achievement modal
- **contract_exposes:**
  - badge_criteria_fixed: "Badge criteria use actual action counts, not XP transaction counts."

### Phase 2: XP Display & Level-Up

#### Story 4: XP and level display across UI
- **id:** GAM-04
- **points:** M
- **deps:** [GAM-01]
- **acceptance_criteria:**
  - [ ] Profile page shows: current level (name + icon), XP progress bar to next level, total XP
  - [ ] Left sidebar shows current level icon/badge next to user avatar
  - [ ] Right panel leaderboard shows real data from `user_xp` (not hardcoded)
  - [ ] `/ranking` page displays leaderboard with real rankings (weekly, monthly, all-time)
  - [ ] Member cards on `/members` show level badge
  - [ ] All XP/level data comes from `user_xp` table (contract from E1/AUTH-03)
- **contract_exposes:**
  - xp_display: "XP/level visible on profile, sidebar, ranking, members. All from user_xp table."
- **playwright_scenarios:**
  - Login → verify sidebar shows level icon next to avatar
  - Navigate to /profile → verify level name, XP bar, total XP displayed
  - Navigate to /ranking → verify leaderboard shows real users ordered by XP

#### Story 5: Level-up notification system
- **id:** GAM-05
- **points:** M
- **deps:** [GAM-04]
- **acceptance_criteria:**
  - [ ] When XP award causes level-up, a notification is triggered
  - [ ] Level-up UI: achievement modal (existing component) shows "Level Up!" with new level name and icon
  - [ ] The `awardXP()` function returns `{ leveledUp: boolean, newLevel: LevelDefinition }` in response
  - [ ] `markLessonComplete` action checks response and triggers level-up state in client
  - [ ] Level-up animation plays (modal with confetti or visual celebration)
  - [ ] Level-up is a one-time event per level (not triggered on every XP award)
- **contract_exposes:**
  - level_up_notifications: "Level-up triggers achievement modal with animation. Detected in awardXP response."
- **playwright_scenarios:**
  - Complete enough lessons to trigger level-up → verify achievement modal appears with new level

#### Story 6: Level-gating infrastructure (future-ready)
- **id:** GAM-06
- **points:** M
- **deps:** [GAM-01]
- **acceptance_criteria:**
  - [ ] `user_profiles` (or new table) can store `features_unlocked` JSON or a `feature_gates` table
  - [ ] Helper function: `isFeatureUnlocked(userId, featureName): boolean`
  - [ ] Helper function: `getFeatureUnlockLevel(featureName): number`
  - [ ] Configuration: define which features require which level (stored in DB or constants)
  - [ ] Example gates (not enforced yet, just infrastructure):
    - Level 3: Can create posts in community
    - Level 5: Can access marketplace
    - Level 10: Can contribute lessons
  - [ ] UI component: `<LevelGate requiredLevel={5}>` wraps features and shows level requirement if not met
  - [ ] No features are ACTUALLY gated yet — this is infrastructure only
- **contract_exposes:**
  - level_gating: "LevelGate component + isFeatureUnlocked helper. Infrastructure ready, no features gated yet."

### Phase 3: E2E Verification

#### Story 7: E2E test — Gamification system
- **id:** GAM-07
- **points:** L
- **deps:** [GAM-05, GAM-06]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/gamification/gamification.spec.ts`
  - [ ] Test: Complete lessons → verify XP accumulates correctly on profile
  - [ ] Test: Verify level calculation matches expected thresholds
  - [ ] Test: Verify leaderboard shows correct ranking order (by total XP)
  - [ ] Test: Verify streak counter increments on consecutive-day activity
  - [ ] Test: Verify badge awarded when criteria met (e.g., complete 10 lessons → badge)
  - [ ] Test: LevelGate component shows lock for insufficient level, content for sufficient level
  - [ ] All tests pass
- **contract_exposes:**
  - gamification_tested: "Level math, XP display, streaks, badges, leaderboard all verified E2E"

## Regression Suite

After this epic, run E1 + E2 + E3 regression PLUS:
- Level progression with new math
- Streak calculation accuracy
- Badge criteria correctness
- XP display across all UI surfaces
- Level-up notifications
- Leaderboard real data
