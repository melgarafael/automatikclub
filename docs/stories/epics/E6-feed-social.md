# Epic E6 — Feed & Social Interactions

> **For epic-executor:** Execute wave-by-wave. Depends on E1 (auth).
> **Required pre-reading by every wave's build subagent:**
> 1. Community feature: `automatiklabs/src/features/community/` (actions, components, hooks)
> 2. Comments feature: `automatiklabs/src/features/comments/`
> 3. AI Feed feature: `automatiklabs/src/features/ai-feed/`
> 4. Database: `automatiklabs/supabase/migrations/00005_community.sql`
> 5. Cross-epic contracts: `.epic-executor/cross-epic-contracts.yaml`
> 6. Skills: `senior-frontend`, `senior-backend`
> 7. IMPORTANT: This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any code.

## Goal

Make the social feed **fully interactive**: posting, commenting, liking, and sharing — all persisted and working in realtime. Wire the AI feed for real content display.

## Context

GOOD NEWS: The feed system is surprisingly complete. `post-feed.tsx` has infinite scroll, realtime new post notifications, and filter tabs. `get-feed.ts` has proper cursor-based pagination. Realtime subscriptions via `use-realtime-posts.ts` work. Comments system has create, thread, and like actions.

Key gaps:
- **Post creation** — Need to verify PostComposer actually creates posts
- **Like action on posts** — Need to verify like/unlike toggles and counts update
- **Share action** — Not implemented (copy link, or share to socials)
- **Post reactions** — DB has `reactions` table with 6 types but UI may not be wired
- **AI Feed tab** — Components exist but content pipeline (agents posting) needs verification
- **Comment duplication** — Two identical `create-comment.ts` files exist (community/ and comments/)
- **User profile popup** — When clicking a user's avatar in feed, should show their profile (link to /members/[username])

## Stories

### Phase 1: Post & Interaction Wiring

#### Story 1: Verify and fix post creation flow
- **id:** FEED-01
- **points:** M
- **deps:** []
- **acceptance_criteria:**
  - [ ] PostComposer component allows typing and submitting a new post
  - [ ] `createPost()` server action inserts into `posts` table with `author_id`, `content`, `channel_id`
  - [ ] New post appears in feed immediately (optimistic update or refetch)
  - [ ] Realtime notification shows for other users when a new post is created
  - [ ] Post supports Markdown content (rendered via MarkdownRenderer)
  - [ ] Empty post submission is prevented (validation)
  - [ ] Post shows author avatar, name, role badge, and timestamp
  - [ ] XP awarded for creating a post (via XP engine, with daily cap)
- **contract_exposes:**
  - post_creation: "Users can create posts. Posts appear in realtime. XP awarded (capped)."
- **playwright_scenarios:**
  - Login → /feed → type post content → submit → verify post appears in feed
  - Verify empty post submission is blocked

#### Story 2: Post like/reaction system
- **id:** FEED-02
- **points:** M
- **deps:** [FEED-01]
- **acceptance_criteria:**
  - [ ] Like button on each post toggles like/unlike
  - [ ] Like count updates immediately (optimistic UI)
  - [ ] Like state persists: liked posts stay liked after page refresh
  - [ ] `likePost()` server action inserts/deletes from `reactions` table (type='like')
  - [ ] DB: `reactions` table uses UNIQUE(user_id, post_id, type) to prevent duplicates
  - [ ] Post card shows total like count
  - [ ] Optional: support multiple reaction types (fire, clap, rocket) — DB supports it
  - [ ] XP awarded for first like on a post (not per-like, per-post dedup)
- **contract_exposes:**
  - post_reactions: "Like/unlike toggle with optimistic UI. Reactions table with dedup."
- **playwright_scenarios:**
  - View post → click like → verify count increments → refresh → verify like persists
  - Click like again → verify unlike → count decrements

#### Story 3: Comment on posts
- **id:** FEED-03
- **points:** M
- **deps:** [FEED-01]
- **acceptance_criteria:**
  - [ ] Each post has a "comment" action that opens comment section
  - [ ] CommentComposer allows typing and submitting comments
  - [ ] Comments display threaded (up to 3 levels deep)
  - [ ] Comment count shows on post card
  - [ ] `createComment()` server action works (consolidate the duplicated code in community/ and comments/ — use one canonical location)
  - [ ] XP awarded for commenting (with daily cap from anti-gaming)
  - [ ] Author can delete own comments
  - [ ] Moderators can delete any comment
- **contract_exposes:**
  - post_comments: "Threaded comments up to 3 levels. XP for commenting (capped). Delete own/moderate."
- **playwright_scenarios:**
  - View post → type comment → submit → verify comment appears under post
  - Reply to comment → verify threaded display
  - Delete own comment → verify removed

#### Story 4: Share post (copy link)
- **id:** FEED-04
- **points:** S
- **deps:** [FEED-01]
- **acceptance_criteria:**
  - [ ] Each post has a "share" button
  - [ ] Clicking share copies the post URL to clipboard (e.g., `/community/{channelSlug}/post/{postId}`)
  - [ ] Toast notification confirms "Link copied!"
  - [ ] Post detail page (`/community/[channelSlug]/post/[postId]`) renders the single post with full comments
  - [ ] Shared link is accessible to authenticated users (respects auth middleware)
- **contract_exposes:**
  - share_post: "Share button copies post URL. Post detail page exists at /community/[channel]/post/[id]"
- **playwright_scenarios:**
  - View post → click share → verify clipboard contains correct URL
  - Navigate to post detail URL → verify post and comments display

#### Story 5: User profile link from feed interactions
- **id:** FEED-05
- **points:** S
- **deps:** []
- **acceptance_criteria:**
  - [ ] Clicking a user's avatar or name in the feed navigates to `/members/[username]`
  - [ ] Clicking a user's avatar or name in comments navigates to `/members/[username]`
  - [ ] PostCard component wraps author info in a Link component
  - [ ] CommentItem component wraps author info in a Link component
  - [ ] If user has no username set, link goes to `/members` (fallback)
- **contract_exposes:**
  - user_profile_links: "All user avatars/names in feed and comments link to /members/[username]"
- **playwright_scenarios:**
  - View post → click author avatar → verify navigation to /members/[username]

### Phase 2: AI Feed & Cleanup

#### Story 6: AI Feed verification and wiring
- **id:** FEED-06
- **points:** M
- **deps:** [FEED-02]
- **acceptance_criteria:**
  - [ ] "AI Feed" tab in feed page shows AI-generated posts from `ai_posts` table
  - [ ] AI posts render with agent avatar, agent name, and "AI" badge
  - [ ] AI posts support likes (same reaction system as regular posts)
  - [ ] AI posts show in the "AI Feed" filter tab
  - [ ] Admin can moderate AI posts from `/admin/ai-feed` (approve/reject pending posts)
  - [ ] AI agent management works: admin can view registered agents
  - [ ] If no AI posts exist, show empty state with explanation
- **contract_exposes:**
  - ai_feed: "AI Feed tab shows approved AI posts. Admin moderates via /admin/ai-feed."
- **playwright_scenarios:**
  - Login → /feed → click "AI Feed" tab → verify AI posts display (or empty state)
  - Login as admin → /admin/ai-feed → verify moderation queue visible

### Phase 3: E2E Verification

#### Story 7: E2E test — Feed and social interactions
- **id:** FEED-07
- **points:** L
- **deps:** [FEED-06]
- **acceptance_criteria:**
  - [ ] Playwright test file: `tests/e2e/feed/social-feed.spec.ts`
  - [ ] Test: Create post → verify appears in feed
  - [ ] Test: Like post → verify count updates → unlike → verify decrements
  - [ ] Test: Comment on post → verify comment appears → reply to comment → verify thread
  - [ ] Test: Share post (copy link) → navigate to link → verify post displays
  - [ ] Test: Click user avatar in feed → verify navigates to user profile
  - [ ] Test: AI Feed tab shows content (or empty state)
  - [ ] Test: Filter tabs work (recentes, populares, ai-feed)
  - [ ] Test: Infinite scroll loads more posts
  - [ ] All tests pass
- **contract_exposes:**
  - feed_tested: "Post creation, likes, comments, sharing, AI feed, filters all verified E2E"

## Regression Suite

After this epic, run E1-E5 regression PLUS:
- Post creation and display
- Like/unlike toggle
- Comment threading
- Share link flow
- AI Feed display
- Feed filter tabs
- User profile links from interactions
