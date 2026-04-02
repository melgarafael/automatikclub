-- =============================================
-- Migration 00011: Supporting Tables
-- AutomatikClub — EPIC-04 Story 04.5
-- =============================================

-- Enums
CREATE TYPE newsletter_status AS ENUM ('draft', 'sent');
CREATE TYPE contributor_lesson_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- TABLE: newsletters
-- =============================================

CREATE TABLE public.newsletters (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  content_html            TEXT,
  status                  newsletter_status NOT NULL DEFAULT 'draft',
  sent_at                 TIMESTAMPTZ,
  created_by              UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT newsletters_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_newsletters_slug ON public.newsletters (slug);
CREATE INDEX idx_newsletters_status ON public.newsletters (status);
CREATE INDEX idx_newsletters_created_by ON public.newsletters (created_by);

COMMENT ON TABLE public.newsletters IS 'Newsletter editions with HTML content and send tracking';

-- =============================================
-- TABLE: newsletter_subscribers
-- =============================================

CREATE TABLE public.newsletter_subscribers (
  email                   TEXT PRIMARY KEY,
  user_id                 UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  subscribed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at         TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_subscribers_user ON public.newsletter_subscribers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_newsletter_subscribers_active ON public.newsletter_subscribers (email) WHERE is_active = true;

COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter subscriber list with opt-in/opt-out tracking';

-- =============================================
-- TABLE: books
-- =============================================

CREATE TABLE public.books (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  author_name             TEXT,
  description             TEXT,
  cover_url               TEXT,
  purchase_url            TEXT,
  tags                    TEXT[] DEFAULT '{}',
  created_by              UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_books_tags ON public.books USING gin (tags);
CREATE INDEX idx_books_created_by ON public.books (created_by);

COMMENT ON TABLE public.books IS 'Recommended books with purchase links and tags';

-- =============================================
-- TABLE: contributor_lessons
-- =============================================

CREATE TABLE public.contributor_lessons (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  description             TEXT,
  video_url               TEXT,
  video_source            video_provider,
  content_md              TEXT,
  tags                    TEXT[] DEFAULT '{}',
  status                  contributor_lesson_status NOT NULL DEFAULT 'pending',
  reviewed_by             UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  feedback                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT contributor_lessons_approval_consistency CHECK (
    (status != 'approved') OR (status = 'approved' AND reviewed_by IS NOT NULL)
  )
);

CREATE INDEX idx_contributor_lessons_contributor ON public.contributor_lessons (contributor_id);
CREATE INDEX idx_contributor_lessons_status ON public.contributor_lessons (status);
CREATE INDEX idx_contributor_lessons_tags ON public.contributor_lessons USING gin (tags);
CREATE INDEX idx_contributor_lessons_approved ON public.contributor_lessons (created_at DESC)
  WHERE status = 'approved';

COMMENT ON TABLE public.contributor_lessons IS 'Community-submitted lessons pending moderation';

-- =============================================
-- RLS: newsletters
-- =============================================

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY newsletters_select ON public.newsletters
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'sent' OR public.has_role('admin'))
  );

CREATE POLICY newsletters_insert ON public.newsletters
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY newsletters_update ON public.newsletters
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY newsletters_delete ON public.newsletters
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: newsletter_subscribers
-- =============================================

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Users can see their own subscription
CREATE POLICY newsletter_subscribers_select_own ON public.newsletter_subscribers
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin can see all
CREATE POLICY newsletter_subscribers_select_admin ON public.newsletter_subscribers
  FOR SELECT
  USING (public.has_role('admin'));

-- Anyone authenticated can subscribe
CREATE POLICY newsletter_subscribers_insert ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own subscription (unsubscribe)
CREATE POLICY newsletter_subscribers_update ON public.newsletter_subscribers
  FOR UPDATE
  USING (user_id = auth.uid() OR public.has_role('admin'));

-- =============================================
-- RLS: books
-- =============================================

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY books_select ON public.books
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY books_insert ON public.books
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY books_update ON public.books
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY books_delete ON public.books
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: contributor_lessons
-- =============================================

ALTER TABLE public.contributor_lessons ENABLE ROW LEVEL SECURITY;

-- Approved lessons visible to all; pending visible to author and moderators
CREATE POLICY contributor_lessons_select ON public.contributor_lessons
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'approved'
      OR contributor_id = auth.uid()
      OR public.has_role('moderador')
    )
  );

-- Contribuidores+ can submit lessons
CREATE POLICY contributor_lessons_insert ON public.contributor_lessons
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND contributor_id = auth.uid()
    AND status = 'pending'
  );

-- Author can edit pending lessons; moderators can edit any
CREATE POLICY contributor_lessons_update ON public.contributor_lessons
  FOR UPDATE
  USING (
    (contributor_id = auth.uid() AND status = 'pending')
    OR public.has_role('moderador')
  );

-- Admin only delete
CREATE POLICY contributor_lessons_delete ON public.contributor_lessons
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- TRIGGERS: updated_at
-- =============================================

CREATE TRIGGER set_newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_contributor_lessons_updated_at
  BEFORE UPDATE ON public.contributor_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
