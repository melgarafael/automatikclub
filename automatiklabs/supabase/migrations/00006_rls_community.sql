-- =============================================
-- Migration 00006: RLS Policies for Community Tables
-- AutomatikClub — EPIC-04 Story 04.3
-- =============================================

-- =============================================
-- RLS: channels
-- =============================================

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY channels_select ON public.channels
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      visibility = 'public'
      OR public.has_subscription(tier_required::text)
      OR public.has_role('moderador')
    )
  );

CREATE POLICY channels_insert ON public.channels
  FOR INSERT
  WITH CHECK (public.has_role('moderador'));

CREATE POLICY channels_update ON public.channels
  FOR UPDATE
  USING (public.has_role('moderador'));

CREATE POLICY channels_delete ON public.channels
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: channel_tabs
-- =============================================

ALTER TABLE public.channel_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY channel_tabs_select ON public.channel_tabs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
    )
  );

CREATE POLICY channel_tabs_insert ON public.channel_tabs
  FOR INSERT
  WITH CHECK (public.has_role('moderador'));

CREATE POLICY channel_tabs_update ON public.channel_tabs
  FOR UPDATE
  USING (public.has_role('moderador'));

CREATE POLICY channel_tabs_delete ON public.channel_tabs
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: posts
-- =============================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts visible if user can access the channel
CREATE POLICY posts_select ON public.posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
      AND (
        c.visibility = 'public'
        OR public.has_subscription(c.tier_required::text)
        OR public.has_role('moderador')
      )
    )
  );

-- Authors can see their own posts regardless of status
CREATE POLICY posts_select_own ON public.posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Moderators can see all posts
CREATE POLICY posts_select_mod ON public.posts
  FOR SELECT
  USING (public.has_role('moderador'));

-- Any authenticated user can create a post in an accessible channel
CREATE POLICY posts_insert ON public.posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.channels c
      WHERE c.id = channel_id
      AND (
        c.visibility = 'public'
        OR public.has_subscription(c.tier_required::text)
        OR public.has_role('moderador')
      )
    )
  );

-- Owner can edit their own posts, moderators+ can edit any
CREATE POLICY posts_update ON public.posts
  FOR UPDATE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

-- Owner can delete their own posts, moderators+ can delete any
CREATE POLICY posts_delete ON public.posts
  FOR DELETE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

-- =============================================
-- RLS: post_likes
-- =============================================

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_likes_select ON public.post_likes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY post_likes_insert ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY post_likes_delete ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS: comments
-- =============================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see approved comments
CREATE POLICY comments_select_approved ON public.comments
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = 'approved'
  );

-- Authors can see their own comments regardless of status
CREATE POLICY comments_select_own ON public.comments
  FOR SELECT
  USING (auth.uid() = author_id);

-- Moderators can see all comments (for moderation)
CREATE POLICY comments_select_mod ON public.comments
  FOR SELECT
  USING (public.has_role('moderador'));

-- Any authenticated user can comment
CREATE POLICY comments_insert ON public.comments
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = author_id
  );

-- Owner can edit their own comment
CREATE POLICY comments_update_own ON public.comments
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Moderators can update status of any comment (approve/reject)
CREATE POLICY comments_update_mod ON public.comments
  FOR UPDATE
  USING (public.has_role('moderador'));

-- Owner can soft-delete, moderators can delete any
CREATE POLICY comments_delete ON public.comments
  FOR DELETE
  USING (auth.uid() = author_id OR public.has_role('moderador'));

-- =============================================
-- RLS: comment_likes
-- =============================================

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_likes_select ON public.comment_likes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY comment_likes_insert ON public.comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY comment_likes_delete ON public.comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);
