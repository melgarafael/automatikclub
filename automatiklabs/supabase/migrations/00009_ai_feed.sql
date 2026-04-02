-- =============================================
-- Migration 00009: AI Feed Tables
-- AutomatikClub — EPIC-04 Story 04.4
-- =============================================

-- =============================================
-- TABLE: ai_agents
-- =============================================

CREATE TABLE public.ai_agents (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  avatar_url              TEXT,
  api_key_hash            TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_agents_slug_unique UNIQUE (slug),
  CONSTRAINT ai_agents_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_ai_agents_owner ON public.ai_agents (owner_id);
CREATE INDEX idx_ai_agents_slug ON public.ai_agents (slug);
CREATE INDEX idx_ai_agents_active ON public.ai_agents (is_active) WHERE is_active = true;

COMMENT ON TABLE public.ai_agents IS 'AI agent definitions with API key hashes for authentication';

-- =============================================
-- TABLE: ai_posts
-- =============================================

CREATE TABLE public.ai_posts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  content_md              TEXT NOT NULL,
  images                  TEXT[] DEFAULT '{}',
  status                  moderation_status NOT NULL DEFAULT 'pending',
  reply_to_id             UUID REFERENCES public.ai_posts(id) ON DELETE SET NULL,
  likes_count             INTEGER NOT NULL DEFAULT 0,
  comments_count          INTEGER NOT NULL DEFAULT 0,
  approved_by             UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ai_posts_content_not_empty CHECK (length(trim(content_md)) > 0),
  CONSTRAINT ai_posts_likes_non_negative CHECK (likes_count >= 0),
  CONSTRAINT ai_posts_comments_non_negative CHECK (comments_count >= 0),
  CONSTRAINT ai_posts_approval_consistency CHECK (
    (status != 'approved') OR (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
  )
);

CREATE INDEX idx_ai_posts_agent ON public.ai_posts (agent_id);
CREATE INDEX idx_ai_posts_status ON public.ai_posts (status);
CREATE INDEX idx_ai_posts_reply ON public.ai_posts (reply_to_id);
CREATE INDEX idx_ai_posts_approved_feed ON public.ai_posts (created_at DESC) WHERE status = 'approved';

COMMENT ON TABLE public.ai_posts IS 'AI-generated posts with moderation and threading';

-- =============================================
-- TABLE: ai_post_likes
-- =============================================

CREATE TABLE public.ai_post_likes (
  post_id                 UUID NOT NULL REFERENCES public.ai_posts(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_ai_post_likes_post ON public.ai_post_likes (post_id);
CREATE INDEX idx_ai_post_likes_user ON public.ai_post_likes (user_id);

COMMENT ON TABLE public.ai_post_likes IS 'User likes on AI-generated posts';

-- =============================================
-- TRIGGER: Increment/decrement ai_posts likes_count
-- =============================================

CREATE OR REPLACE FUNCTION public.update_ai_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_ai_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.ai_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_post_likes_count();

-- =============================================
-- TRIGGER: Increment/decrement ai_posts comments_count
-- (comments with commentable_type = 'ai_post')
-- =============================================

CREATE OR REPLACE FUNCTION public.update_ai_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.commentable_type = 'ai_post' THEN
    UPDATE public.ai_posts SET comments_count = comments_count + 1 WHERE id = NEW.commentable_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.commentable_type = 'ai_post' THEN
    UPDATE public.ai_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.commentable_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_ai_post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_post_comments_count();

-- =============================================
-- TRIGGER: updated_at for ai_agents
-- =============================================

CREATE TRIGGER set_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
