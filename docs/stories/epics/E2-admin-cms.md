# Epic E2 — Admin CMS (Content Management)

> **For epic-executor:** Execute wave-by-wave. Depends on E1 (auth/middleware must work).
> **Required pre-reading by every wave's build subagent:**
> 1. Admin feature: `automatiklabs/src/features/admin/` (all actions and components)
> 2. Course feature: `automatiklabs/src/features/courses/` (services, types)
> 3. Database: `automatiklabs/supabase/migrations/00003_learning.sql`
> 4. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml` (E1 must be completed)
> 5. Skills: `senior-frontend`, `senior-backend`
> 6. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Make the Admin CMS **fully functional** for creating and managing learning content (tracks, courses, modules, lessons). Admins must be able to create a complete learning path from scratch with cover images, Markdown descriptions, XP configuration, and module organization.

## Context

Admin CRUD routes and actions exist and are ~90% functional. Key gaps:
- **Module CRUD missing** — Modules can be listed but not created/edited in admin UI
- **Cover images** — Upload mechanism exists (avatar) but not wired for track/course covers
- **XP per lesson** — DB has the infrastructure but admin form doesn't expose XP configuration
- **Markdown descriptions** — Need proper Markdown editing with preview (safe rendering already exists via MarkdownRenderer)
- **Dashboard enrollment count** — Shows 0 (query doesn't join user_course_progress)
- All admin actions already have `assertAdmin()` checks

## Stories

### Phase 1: Module Management & Cover Images

#### Story 1: Module CRUD in admin
- **id:** CMS-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Admin can create modules within a course: title, description, position
  - [ ] Admin can edit module title, description, position
  - [ ] Admin can delete a module (with cascade to lessons warning)
  - [ ] Admin can reorder modules via position field
  - [ ] Module list shows under course edit page (or in content tabs)
  - [ ] Server actions: `createModule()`, `updateModule()`, `deleteModule()` exist with `assertAdmin()` checks
  - [ ] Zod validation for module form fields
- **contract_exposes:**
  - module_crud: "Full CRUD for modules. Actions: createModule, updateModule, deleteModule"
- **playwright_scenarios:**
  - Login as admin → /admin/content → select course → create new module → verify it appears in module list
  - Edit module title → save → verify change persists
  - Delete module → confirm → verify removed from list

#### Story 2: Cover image upload for tracks & courses
- **id:** CMS-02
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Track creation/edit form has an image upload field for `cover_image_url`
  - [ ] Course creation/edit form has an image upload field for `cover_image_url`
  - [ ] Images uploaded to Supabase Storage bucket (e.g., "covers") with proper path: `tracks/{id}/cover.{ext}` or `courses/{id}/cover.{ext}`
  - [ ] If `cover_image_url` column doesn't exist in `tracks`/`courses` tables, create migration to add it
  - [ ] Image preview shown in form after upload
  - [ ] Image displayed on track/course cards in student-facing pages
  - [ ] Max file size enforced (e.g., 5MB)
  - [ ] Accepted formats: JPEG, PNG, WebP
- **contract_exposes:**
  - cover_images: "Tracks and courses have cover_image_url. Stored in Supabase Storage 'covers' bucket."
- **playwright_scenarios:**
  - Login as admin → create new track → upload cover image → save → verify image URL stored in DB
  - Browse /learn → verify track card shows cover image

#### Story 3: XP configuration per lesson
- **id:** CMS-03
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Lesson creation form has `xp_reward` number input field (default: 10)
  - [ ] Lesson edit form shows and allows editing of `xp_reward`
  - [ ] If `xp_reward` column doesn't exist in `lessons` table, create migration to add it (INTEGER DEFAULT 10)
  - [ ] `createLesson()` and `updateLesson()` actions save `xp_reward` value
  - [ ] Value is used by XP engine when awarding lesson completion XP (contract with E3)
  - [ ] Minimum value: 0, Maximum value: 1000 (validation)
- **contract_exposes:**
  - lesson_xp_config: "Each lesson has xp_reward field (default 10). Used by XP engine on completion."
- **playwright_scenarios:**
  - Login as admin → create lesson with xp_reward=25 → save → edit lesson → verify xp_reward shows 25

### Phase 2: Descriptions & Dashboard Fixes

#### Story 4: Markdown description editing with preview
- **id:** CMS-04
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] Track/course/lesson description fields accept Markdown content
  - [ ] Description textarea in admin uses a taller multiline input with Markdown preview toggle
  - [ ] Student-facing rendering uses existing MarkdownRenderer component (already safe)
  - [ ] No XSS possible: raw HTML tags in Markdown are escaped by the renderer
  - [ ] Admin can preview how description will look before saving
  - [ ] Markdown supports: headings, bold, italic, code blocks, links, lists, images
- **contract_exposes:**
  - markdown_descriptions: "Descriptions are Markdown. Rendered safely via MarkdownRenderer."
- **playwright_scenarios:**
  - Admin creates track with Markdown description (bold, list, link) → student views track → verify rendered correctly
  - Admin tries script tag in description → student views → verify tag is escaped/not executed

#### Story 5: Fix dashboard enrollment counts
- **id:** CMS-05
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Admin dashboard "Top Courses" section shows actual enrollment count (from `user_course_progress` table)
  - [ ] `getWeeklyStats()` returns `topCourses` with correct enrollment numbers
  - [ ] Dashboard stat card "Courses" shows total published course count
  - [ ] If no enrollments exist, show 0 (not null or undefined)
- **contract_exposes:**
  - dashboard_stats: "Admin dashboard shows real enrollment counts from user_course_progress."
- **playwright_scenarios:**
  - Login as admin → /admin → verify "Top Courses" shows enrollment numbers

#### Story 6: Content publishing workflow
- **id:** CMS-06
- **points:** M
- **deps:** [CMS-01, CMS-02, CMS-03]
- **acceptance_criteria:**
  - [ ] Tracks, courses, and lessons have clear published/draft status indicator in admin
  - [ ] Toggle publish button works with confirmation dialog
  - [ ] Publishing a track requires at least 1 published course inside it
  - [ ] Publishing a course requires at least 1 published lesson inside it
  - [ ] Unpublishing a track hides it from `/learn` but doesn't delete student progress
  - [ ] Draft content (is_published=false) never appears in student-facing routes
  - [ ] Admin can see both published and draft content in admin panel
- **contract_exposes:**
  - publish_workflow: "Content has draft/published lifecycle. Publishing requires child content."
- **playwright_scenarios:**
  - Create track + course + lesson → publish lesson → publish course → publish track → verify visible on /learn
  - Unpublish track → verify hidden from /learn → republish → verify visible again
  - Try to publish empty track (no courses) → verify error/warning

### Phase 3: E2E Verification

#### Story 7: E2E test — Full content creation pipeline
- **id:** CMS-07
- **points:** L
- **deps:** [CMS-06]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/admin-cms/content-pipeline.spec.ts`
  - [ ] Test: Create track → create course in track → create module in course → create lesson in module → publish all → verify on /learn
  - [ ] Test: Edit track title → verify change reflects on /learn
  - [ ] Test: Delete lesson → verify removed from course (student view)
  - [ ] Test: Upload cover image for track → verify displays on /learn
  - [ ] Test: Set XP reward on lesson → verify saved correctly
  - [ ] Test: Non-admin user cannot access /admin/* routes (redirect to /feed)
  - [ ] Test: Admin creates content with Markdown description → student sees rendered Markdown
  - [ ] All tests pass
- **contract_exposes:**
  - cms_pipeline_tested: "Full content lifecycle verified: create → edit → publish → verify → delete"

#### Story 8: E2E test — Admin user management
- **id:** CMS-08
- **points:** M
- **deps:** [CMS-07]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/admin-cms/user-management.spec.ts`
  - [ ] Test: Admin views user list → verify users displayed with roles and XP
  - [ ] Test: Admin changes user role from aluno to contribuidor → verify change persists
  - [ ] Test: Admin changes user subscription tier → verify change persists
  - [ ] Test: Admin cannot demote themselves (self-protection)
  - [ ] Test: Non-admin cannot access user management
  - [ ] All tests pass
- **contract_exposes:**
  - user_management_tested: "Admin user CRUD verified E2E"

## Regression Suite

After this epic, run E1 regression suite PLUS:
- Admin content creation pipeline
- Publish/unpublish workflow
- Cover image upload
- XP configuration per lesson
- User role management
- Admin access control
