-- =============================================
-- Migration 00008: Marketplace Tables
-- AutomatikClub — EPIC-04 Story 04.4
-- =============================================

-- Enums
CREATE TYPE marketplace_item_type AS ENUM ('skill', 'github_project', 'template');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- TABLE: marketplace_items
-- =============================================

CREATE TABLE public.marketplace_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  type                    marketplace_item_type NOT NULL,
  description_md          TEXT,
  thumbnail_url           TEXT,
  file_url                TEXT,
  external_url            TEXT,
  author_id               UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  avg_rating              NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count            INTEGER NOT NULL DEFAULT 0,
  download_count          INTEGER NOT NULL DEFAULT 0,
  tags                    TEXT[] DEFAULT '{}',
  status                  moderation_status NOT NULL DEFAULT 'pending',
  tier_required           subscription_tier NOT NULL DEFAULT 'free',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT marketplace_items_slug_unique UNIQUE (slug),
  CONSTRAINT marketplace_items_has_url CHECK (file_url IS NOT NULL OR external_url IS NOT NULL),
  CONSTRAINT marketplace_items_rating_range CHECK (avg_rating BETWEEN 0 AND 5),
  CONSTRAINT marketplace_items_counts_non_negative CHECK (review_count >= 0 AND download_count >= 0)
);

CREATE INDEX idx_marketplace_items_slug ON public.marketplace_items (slug);
CREATE INDEX idx_marketplace_items_author ON public.marketplace_items (author_id);
CREATE INDEX idx_marketplace_items_type ON public.marketplace_items (type);
CREATE INDEX idx_marketplace_items_status ON public.marketplace_items (status);
CREATE INDEX idx_marketplace_items_tags ON public.marketplace_items USING gin (tags);
CREATE INDEX idx_marketplace_items_approved ON public.marketplace_items (created_at DESC) WHERE status = 'approved';
CREATE INDEX idx_marketplace_items_rating ON public.marketplace_items (avg_rating DESC) WHERE status = 'approved';

COMMENT ON TABLE public.marketplace_items IS 'Community marketplace items: skills, GitHub projects, templates';

-- =============================================
-- TABLE: marketplace_reviews
-- =============================================

CREATE TABLE public.marketplace_reviews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id                 UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  rating                  SMALLINT NOT NULL,
  content                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT marketplace_reviews_unique UNIQUE (user_id, item_id),
  CONSTRAINT marketplace_reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_marketplace_reviews_item ON public.marketplace_reviews (item_id);
CREATE INDEX idx_marketplace_reviews_user ON public.marketplace_reviews (user_id);

COMMENT ON TABLE public.marketplace_reviews IS 'Marketplace item reviews (1-5 stars, one per user per item)';

-- =============================================
-- TABLE: marketplace_downloads
-- =============================================

CREATE TABLE public.marketplace_downloads (
  item_id                 UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  downloaded_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (item_id, user_id)
);

CREATE INDEX idx_marketplace_downloads_item ON public.marketplace_downloads (item_id);
CREATE INDEX idx_marketplace_downloads_user ON public.marketplace_downloads (user_id);

COMMENT ON TABLE public.marketplace_downloads IS 'Download tracking for marketplace items';

-- =============================================
-- TRIGGER: Recalculate avg_rating and review_count on review insert/update/delete
-- =============================================

CREATE OR REPLACE FUNCTION public.recalculate_marketplace_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item_id UUID;
  v_avg NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  v_item_id := COALESCE(NEW.item_id, OLD.item_id);

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO v_avg, v_count
  FROM public.marketplace_reviews
  WHERE item_id = v_item_id;

  UPDATE public.marketplace_items
  SET avg_rating = v_avg, review_count = v_count, updated_at = now()
  WHERE id = v_item_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER recalculate_marketplace_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_marketplace_rating();

-- =============================================
-- TRIGGER: Increment download_count on download insert
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.marketplace_items
  SET download_count = download_count + 1
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_download_count_trigger
  AFTER INSERT ON public.marketplace_downloads
  FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

-- =============================================
-- TRIGGER: updated_at
-- =============================================

CREATE TRIGGER set_marketplace_items_updated_at
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
