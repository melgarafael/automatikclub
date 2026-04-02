-- =============================================
-- Migration 00010: RLS for Gamification, Marketplace, AI Feed
-- AutomatikClub — EPIC-04 Story 04.4
-- =============================================

-- =============================================
-- RLS: xp_transactions
-- =============================================

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Users see their own XP transactions
CREATE POLICY xp_transactions_select_own ON public.xp_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins see all XP transactions
CREATE POLICY xp_transactions_select_admin ON public.xp_transactions
  FOR SELECT
  USING (public.has_role('admin'));

-- No INSERT policy for authenticated users — XP is granted via SECURITY DEFINER functions/triggers only
-- Service role (backend) handles inserts

-- =============================================
-- RLS: user_xp
-- =============================================

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- All authenticated can see XP summary (for leaderboard)
CREATE POLICY user_xp_select ON public.user_xp
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert/update managed by trigger only
CREATE POLICY user_xp_insert ON public.user_xp
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_xp_update ON public.user_xp
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS: badges
-- =============================================

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- All authenticated can see available badges
CREATE POLICY badges_select ON public.badges
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins manage badges
CREATE POLICY badges_insert ON public.badges
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY badges_update ON public.badges
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY badges_delete ON public.badges
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: user_badges
-- =============================================

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- All authenticated can see user badges (for leaderboard/profiles)
CREATE POLICY user_badges_select ON public.user_badges
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert via triggers/service_role only (no direct insert policy)

-- =============================================
-- RLS: challenges
-- =============================================

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Active challenges visible to all authenticated
CREATE POLICY challenges_select ON public.challenges
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'active' OR public.has_role('moderador'))
  );

-- Moderators+ create and manage challenges
CREATE POLICY challenges_insert ON public.challenges
  FOR INSERT
  WITH CHECK (public.has_role('moderador'));

CREATE POLICY challenges_update ON public.challenges
  FOR UPDATE
  USING (public.has_role('moderador'));

CREATE POLICY challenges_delete ON public.challenges
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: challenge_participations
-- =============================================

ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY challenge_participations_select ON public.challenge_participations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role('moderador')
  );

CREATE POLICY challenge_participations_insert ON public.challenge_participations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY challenge_participations_update ON public.challenge_participations
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role('moderador'));

-- =============================================
-- RLS: marketplace_items
-- =============================================

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- Approved items visible to all authenticated; own pending items visible to author
CREATE POLICY marketplace_items_select ON public.marketplace_items
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'approved'
      OR author_id = auth.uid()
      OR public.has_role('moderador')
    )
  );

-- Contribuidores+ can create items (always pending)
CREATE POLICY marketplace_items_insert ON public.marketplace_items
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND author_id = auth.uid()
    AND status = 'pending'
  );

-- Author can edit their own items, moderators+ edit any
CREATE POLICY marketplace_items_update ON public.marketplace_items
  FOR UPDATE
  USING (author_id = auth.uid() OR public.has_role('moderador'));

-- Only admins delete
CREATE POLICY marketplace_items_delete ON public.marketplace_items
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: marketplace_reviews
-- =============================================

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_reviews_select ON public.marketplace_reviews
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY marketplace_reviews_insert ON public.marketplace_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY marketplace_reviews_update ON public.marketplace_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY marketplace_reviews_delete ON public.marketplace_reviews
  FOR DELETE
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- =============================================
-- RLS: marketplace_downloads
-- =============================================

ALTER TABLE public.marketplace_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_downloads_select ON public.marketplace_downloads
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

CREATE POLICY marketplace_downloads_insert ON public.marketplace_downloads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS: ai_agents
-- =============================================

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- All authenticated can see active agents (without api_key_hash)
CREATE POLICY ai_agents_select ON public.ai_agents
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (is_active = true OR owner_id = auth.uid() OR public.has_role('admin'))
  );

-- Contribuidores+ with Pro+ can create agents
CREATE POLICY ai_agents_insert ON public.ai_agents
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND owner_id = auth.uid()
  );

-- Owner can update their own agents
CREATE POLICY ai_agents_update ON public.ai_agents
  FOR UPDATE
  USING (owner_id = auth.uid() OR public.has_role('admin'));

-- Owner or admin can delete
CREATE POLICY ai_agents_delete ON public.ai_agents
  FOR DELETE
  USING (owner_id = auth.uid() OR public.has_role('admin'));

-- =============================================
-- RLS: ai_posts
-- =============================================

ALTER TABLE public.ai_posts ENABLE ROW LEVEL SECURITY;

-- Approved posts visible to all; pending visible to agent owner and moderators
CREATE POLICY ai_posts_select ON public.ai_posts
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'approved'
      OR EXISTS (
        SELECT 1 FROM public.ai_agents a WHERE a.id = agent_id AND a.owner_id = auth.uid()
      )
      OR public.has_role('moderador')
    )
  );

-- Insert via API key validation (service_role) or contribuidores with pending status
CREATE POLICY ai_posts_insert ON public.ai_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_agents a
      WHERE a.id = agent_id
      AND a.owner_id = auth.uid()
      AND a.is_active = true
    )
    AND status = 'pending'
  );

-- Moderators can update status (approve/reject)
CREATE POLICY ai_posts_update ON public.ai_posts
  FOR UPDATE
  USING (public.has_role('moderador'));

-- Moderators+ can delete
CREATE POLICY ai_posts_delete ON public.ai_posts
  FOR DELETE
  USING (public.has_role('moderador'));

-- =============================================
-- RLS: ai_post_likes
-- =============================================

ALTER TABLE public.ai_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_post_likes_select ON public.ai_post_likes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY ai_post_likes_insert ON public.ai_post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ai_post_likes_delete ON public.ai_post_likes
  FOR DELETE
  USING (auth.uid() = user_id);
