# Epic E3 — Learning Experience & Progress Tracking

> **For epic-executor:** Execute wave-by-wave. Depends on E1 (auth) and E2 (content must be creatable).
> **Required pre-reading by every wave's build subagent:**
> 1. Courses feature: `automatiklabs/src/features/courses/` (actions, components, services)
> 2. Gamification XP engine: `automatiklabs/src/features/gamification/services/xp-engine.ts`
> 3. Database: `automatiklabs/supabase/migrations/00003_learning.sql`, `00007_gamification.sql`
> 4. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml`
> 5. Skills: `senior-frontend`, `senior-backend`
> 6. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Build the **complete student learning experience**: browsing tracks → entering a course → watching lessons → marking complete → earning XP → tracking progress. This is the core product loop.

## Context

Components and services exist but **critical routes are missing**. The student can browse tracks on `/learn` but cannot open a course detail or watch a lesson — those route files were deleted (see git status: `D` flags on learn/[trackSlug]/[courseSlug] routes). Course service functions exist and work. Progress tracking tables exist. XP engine exists but isn't wired to lesson completion.

## Stories

### Phase 1: Student-Facing Routes

#### Story 1: Track detail page
- **id:** LEARN-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Route: `/learn/[trackSlug]` renders track detail page
  - [ ] Shows track title, description (Markdown rendered), cover image, difficulty, tier required
  - [ ] Lists all published courses in the track with course cards
  - [ ] Each course card shows: title, cover image, lesson count, estimated duration, user progress %
  - [ ] If user is not enrolled in any course, shows "Start Learning" CTA
  - [ ] Tier-gated tracks show paywall for users without required subscription
  - [ ] Uses `fetchTrackBySlug()` from course-service (already exists)
  - [ ] Breadcrumb: Learn > {Track Name}
  - [ ] SSR (server component) with dynamic metadata for SEO
- **contract_exposes:**
  - track_detail_route: "GET /learn/[trackSlug] — server component, fetches track + courses"
- **playwright_scenarios:**
  - Navigate to /learn → click track card → verify track detail page loads with courses listed
  - Verify breadcrumb shows correct track name

#### Story 2: Course detail page with curriculum
- **id:** LEARN-02
- **points:** L
- **deps:** [LEARN-01]
- **acceptance_criteria:**
  - [ ] Route: `/learn/[trackSlug]/[courseSlug]` renders course detail page
  - [ ] Shows course title, description, cover image, instructor info, total duration
  - [ ] CurriculumSidebar (or accordion) shows all modules and lessons organized
  - [ ] Each lesson shows: title, duration, completion status (checkmark if completed)
  - [ ] Locked lessons (tier-gated) show lock icon
  - [ ] "Continue Learning" button takes user to next incomplete lesson
  - [ ] If no progress exists, shows "Start Course" button pointing to first lesson
  - [ ] Uses `fetchCourseDetail()` from course-service (already exists)
  - [ ] Progress bar showing overall course completion %
  - [ ] Breadcrumb: Learn > {Track} > {Course}
- **contract_exposes:**
  - course_detail_route: "GET /learn/[trackSlug]/[courseSlug] — shows curriculum with per-lesson progress"
- **playwright_scenarios:**
  - Navigate to track → click course → verify curriculum displayed with modules and lessons
  - Verify progress bar shows 0% for new course
  - Click "Start Course" → verify navigates to first lesson

#### Story 3: Lesson player page
- **id:** LEARN-03
- **points:** L
- **deps:** [LEARN-02]
- **acceptance_criteria:**
  - [ ] Route: `/learn/[trackSlug]/[courseSlug]/[lessonSlug]` renders lesson page
  - [ ] Video player renders correctly for YouTube, Vimeo, and uploaded videos
  - [ ] Lesson content (Markdown) renders below or beside video
  - [ ] CurriculumSidebar shows on the side with current lesson highlighted
  - [ ] "Mark as Complete" button visible (uses existing `MarkCompleteButton` component)
  - [ ] Previous/Next lesson navigation (uses `LessonNav` component)
  - [ ] Rating input visible after lesson completion (uses `RatingInput` component)
  - [ ] Uses `fetchLessonDetail()` from course-service (already exists)
  - [ ] Breadcrumb: Learn > {Track} > {Course} > {Lesson}
  - [ ] Tier-gated lessons show paywall instead of content
- **contract_exposes:**
  - lesson_player_route: "GET /learn/[trackSlug]/[courseSlug]/[lessonSlug] — video + content + completion"
- **playwright_scenarios:**
  - Navigate to course → click first lesson → verify video player renders
  - Verify lesson content (Markdown) displays below video
  - Verify prev/next navigation buttons work
  - Verify "Mark as Complete" button is visible

### Phase 2: Progress & XP Wiring

#### Story 4: Wire lesson completion to XP engine
- **id:** LEARN-04
- **points:** M
- **deps:** [LEARN-03]
- **acceptance_criteria:**
  - [ ] When user clicks "Mark as Complete", `markLessonComplete()` action:
    1. Updates `user_lesson_progress` (existing behavior)
    2. Calls `awardXP(userId, 'lesson_complete', lessonId, lesson.xp_reward)` from XP engine
    3. Checks if all lessons in module are complete → awards `module_complete` XP
    4. Checks if all lessons in course are complete → awards `course_complete` XP
    5. Checks if all courses in track are complete → awards `track_complete` XP
  - [ ] XP deduplication works: marking same lesson complete twice does NOT award XP twice (UNIQUE constraint)
  - [ ] Anti-gaming: `validateAntiGaming()` is called before XP award (cooldown + daily caps)
  - [ ] After XP award, `checkAndAwardBadges()` is called to check for new badge eligibility
  - [ ] Toast notification shows XP earned (uses existing `points-toast.tsx` component)
- **contract_exposes:**
  - xp_wired: "Lesson completion triggers XP cascade: lesson → module → course → track. Dedup enforced."
- **playwright_scenarios:**
  - Mark lesson as complete → verify XP toast appears with correct amount
  - Mark same lesson complete again → verify no additional XP awarded
  - Complete all lessons in a course → verify course_complete XP awarded

#### Story 5: Auto-create and update course progress
- **id:** LEARN-05
- **points:** M
- **deps:** [LEARN-04]
- **acceptance_criteria:**
  - [ ] When first lesson in a course is marked complete, `user_course_progress` row is auto-created (upsert)
  - [ ] `user_course_progress.completed_lessons` increments on each lesson completion
  - [ ] `user_course_progress.percentage` recalculates as `(completed_lessons / total_lessons) * 100`
  - [ ] When all lessons are complete, `user_course_progress.is_completed = true` and `completed_at` is set
  - [ ] Progress dashboard (`/learn/progresso`) shows accurate data from `user_course_progress`
  - [ ] Track-level progress aggregates correctly from course progress
- **contract_exposes:**
  - course_progress: "Auto-managed course progress rows. Percentage recalculated on each lesson completion."
- **playwright_scenarios:**
  - Mark first lesson in course as complete → verify course progress shows 1/N lessons (correct %)
  - Verify /learn/progresso shows the course in "in progress" section

#### Story 6: Progress dashboard verification
- **id:** LEARN-06
- **points:** M
- **deps:** [LEARN-05]
- **acceptance_criteria:**
  - [ ] `/learn/progresso` shows accurate data:
    - Total lessons completed (all-time count)
    - Total watch minutes (sum of lesson durations from completed lessons)
    - Current streak (from user_xp)
    - XP and level (from user_xp)
  - [ ] Tracks in progress section shows each track with per-course breakdown
  - [ ] Recent activity feed shows last 10 completed lessons with timestamps
  - [ ] Streak calendar shows activity days correctly
  - [ ] Empty state shows for new users with no progress
- **contract_exposes:**
  - progress_dashboard: "Progress dashboard shows real data from user_lesson_progress + user_course_progress + user_xp"

### Phase 3: E2E Verification

#### Story 7: E2E test — Complete learning flow
- **id:** LEARN-07
- **points:** L
- **deps:** [LEARN-06]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/learning/learning-flow.spec.ts`
  - [ ] Test: Browse /learn → click track → click course → click lesson → mark complete → verify progress updates
  - [ ] Test: Complete all lessons in course → verify course marked complete → XP awarded
  - [ ] Test: Verify /learn/progresso shows accurate data after completing lessons
  - [ ] Test: Lesson rating flow — complete lesson → rate 5 stars → verify rating persists
  - [ ] Test: Navigation — prev/next lesson buttons work correctly
  - [ ] Test: Tier-gated content shows paywall for free users
  - [ ] Test: XP deduplication — complete lesson twice → verify XP awarded only once
  - [ ] All tests pass
- **contract_exposes:**
  - learning_flow_tested: "Full learning loop verified: browse → learn → complete → XP → progress"

## Regression Suite

After this epic, run E1 + E2 regression PLUS:
- Track → course → lesson navigation
- Lesson completion with XP award
- Course progress auto-calculation
- Progress dashboard data accuracy
- Tier-gating enforcement
- XP deduplication
