-- =============================================
-- Migration 00005: Community Tables
-- AutomatikClub — EPIC-04 Story 04.3
-- =============================================

-- Additional enums
CREATE TYPE channel_type AS ENUM ('general', 'course', 'topic');
CREATE TYPE channel_visibility AS ENUM ('public', 'members', 'private');
CREATE TYPE channel_tab_type AS ENUM ('discussion', 'resources', 'events');
CREATE TYPE commentable_type AS ENUM ('lesson', 'post', 'ai_post');
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected', 'deleted');
CREATE TYPE reaction_type AS ENUM ('like', 'love', 'fire', 'clap', 'think', 'rocket');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived', 'deleted');

-- =============================================
-- TABLE: channels
-- =============================================

CREATE TABLE public.channels (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  image_url               TEXT,
  type                    channel_type NOT NULL DEFAULT 'general',
  visibility              channel_visibility NOT NULL DEFAULT 'public',
  tier_required           subscription_tier NOT NULL DEFAULT 'free',
  position                INTEGER NOT NULL DEFAULT 0,
  is_archived             BOOLEAN NOT NULL DEFAULT false,
  created_by              UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT channels_slug_unique UNIQUE (slug),
  CONSTRAINT channels_name_not_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_channels_slug ON public.channels (slug);
CREATE INDEX idx_channels_position ON public.channels (position);
CREATE INDEX idx_channels_type ON public.channels (type);
CREATE INDEX idx_channels_visibility ON public.channels (visibility);
CREATE INDEX idx_channels_active ON public.channels (position) WHERE is_archived = false;

COMMENT ON TABLE public.channels IS 'Community channels (Circle.so-style spaces)';

-- =============================================
-- TABLE: channel_tabs
-- =============================================

CREATE TABLE public.channel_tabs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id              UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  type                    channel_tab_type NOT NULL,
  position                INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT channel_tabs_unique_type UNIQUE (channel_id, type)
);

CREATE INDEX idx_channel_tabs_channel ON public.channel_tabs (channel_id);
CREATE INDEX idx_channel_tabs_sort ON public.channel_tabs (channel_id, position);

COMMENT ON TABLE public.channel_tabs IS 'Tabs within a channel: discussion, resources, events';

-- =============================================
-- TABLE: posts
-- =============================================

CREATE TABLE public.posts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id              UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  tab_id                  UUID REFERENCES public.channel_tabs(id) ON DELETE SET NULL,
  author_id               UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title                   TEXT,
  content_md              TEXT NOT NULL,
  images                  TEXT[] DEFAULT '{}',
  is_pinned               BOOLEAN NOT NULL DEFAULT false,
  likes_count             INTEGER NOT NULL DEFAULT 0,
  comments_count          INTEGER NOT NULL DEFAULT 0,
  status                  post_status NOT NULL DEFAULT 'published',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT posts_content_not_empty CHECK (length(trim(content_md)) > 0),
  CONSTRAINT posts_likes_non_negative CHECK (likes_count >= 0),
  CONSTRAINT posts_comments_non_negative CHECK (comments_count >= 0)
);

CREATE INDEX idx_posts_channel ON public.posts (channel_id);
CREATE INDEX idx_posts_tab ON public.posts (tab_id);
CREATE INDEX idx_posts_author ON public.posts (author_id);
CREATE INDEX idx_posts_channel_feed ON public.posts (channel_id, created_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_pinned ON public.posts (channel_id) WHERE is_pinned = true AND status = 'published';
CREATE INDEX idx_posts_content_search ON public.posts
  USING gin (to_tsvector('portuguese', coalesce(title, '') || ' ' || content_md));

COMMENT ON TABLE public.posts IS 'Community feed posts within channels';

-- =============================================
-- TABLE: post_likes
-- =============================================

CREATE TABLE public.post_likes (
  post_id                 UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_post_likes_user ON public.post_likes (user_id);
CREATE INDEX idx_post_likes_post ON public.post_likes (post_id);

COMMENT ON TABLE public.post_likes IS 'Post like records (one per user per post)';

-- =============================================
-- TABLE: comments (polymorphic)
-- =============================================

CREATE TABLE public.comments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commentable_type        commentable_type NOT NULL,
  commentable_id          UUID NOT NULL,
  author_id               UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  parent_id               UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content                 TEXT NOT NULL,
  is_ai_response          BOOLEAN NOT NULL DEFAULT false,
  ai_model                TEXT,
  status                  comment_status NOT NULL DEFAULT 'approved',
  depth                   SMALLINT NOT NULL DEFAULT 0,
  likes_count             INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT comments_content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT comments_depth_limit CHECK (depth <= 3),
  CONSTRAINT comments_likes_non_negative CHECK (likes_count >= 0),
  CONSTRAINT comments_ai_model_required CHECK (
    (is_ai_response = false) OR (is_ai_response = true AND ai_model IS NOT NULL)
  )
);

CREATE INDEX idx_comments_commentable ON public.comments (commentable_type, commentable_id);
CREATE INDEX idx_comments_author ON public.comments (author_id);
CREATE INDEX idx_comments_parent ON public.comments (parent_id);
CREATE INDEX idx_comments_status ON public.comments (status);
CREATE INDEX idx_comments_approved ON public.comments (commentable_type, commentable_id, created_at DESC)
  WHERE status = 'approved';

COMMENT ON TABLE public.comments IS 'Polymorphic comments for lessons, posts, and AI posts with threading (max 3 depth)';

-- =============================================
-- TABLE: comment_likes
-- =============================================

CREATE TABLE public.comment_likes (
  comment_id              UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON public.comment_likes (comment_id);
CREATE INDEX idx_comment_likes_user ON public.comment_likes (user_id);

COMMENT ON TABLE public.comment_likes IS 'Comment like records';

-- =============================================
-- TRIGGER: Increment/decrement post likes_count
-- =============================================

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- =============================================
-- TRIGGER: Increment/decrement post comments_count
-- =============================================

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.commentable_type = 'post' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.commentable_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.commentable_type = 'post' THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.commentable_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- =============================================
-- TRIGGER: Increment/decrement comment likes_count
-- =============================================

CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- =============================================
-- TRIGGERS: updated_at
-- =============================================

CREATE TRIGGER set_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
