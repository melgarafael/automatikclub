-- =============================================
-- Migration 00004: RLS Policies for Learning Tables
-- AutomatikClub — EPIC-04 Story 04.2
-- =============================================

-- =============================================
-- RLS: tracks
-- =============================================

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tracks_select_published ON public.tracks
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      (is_published = true AND public.has_subscription(tier_required::text))
      OR public.has_role('moderador')
    )
  );

CREATE POLICY tracks_insert ON public.tracks
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY tracks_update ON public.tracks
  FOR UPDATE
  USING (public.has_role('moderador'));

CREATE POLICY tracks_delete ON public.tracks
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: courses
-- =============================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY courses_select ON public.courses
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      (is_published = true AND public.has_subscription(tier_required::text))
      OR instructor_id = auth.uid()
      OR public.has_role('moderador')
    )
  );

CREATE POLICY courses_insert ON public.courses
  FOR INSERT
  WITH CHECK (
    public.has_role('contribuidor')
    AND (instructor_id = auth.uid() OR public.has_role('admin'))
  );

CREATE POLICY courses_update ON public.courses
  FOR UPDATE
  USING (
    instructor_id = auth.uid()
    OR public.has_role('moderador')
  );

CREATE POLICY courses_delete ON public.courses
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: modules
-- =============================================

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY modules_select ON public.modules
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
    )
  );

CREATE POLICY modules_insert ON public.modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND (c.instructor_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY modules_update ON public.modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND (c.instructor_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY modules_delete ON public.modules
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: lessons
-- =============================================

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lessons_select ON public.lessons
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (
        (c.is_published = true AND public.has_subscription(c.tier_required::text))
        OR c.instructor_id = auth.uid()
        OR public.has_role('moderador')
      )
    )
  );

CREATE POLICY lessons_insert ON public.lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (c.instructor_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY lessons_update ON public.lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (c.instructor_id = auth.uid() OR public.has_role('moderador'))
    )
  );

CREATE POLICY lessons_delete ON public.lessons
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: lesson_embeddings
-- =============================================

ALTER TABLE public.lesson_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_embeddings_select ON public.lesson_embeddings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service_role or admin can manage embeddings
CREATE POLICY lesson_embeddings_manage ON public.lesson_embeddings
  FOR ALL
  USING (public.has_role('admin'));

-- =============================================
-- RLS: lesson_ratings
-- =============================================

ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_ratings_select ON public.lesson_ratings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY lesson_ratings_insert ON public.lesson_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY lesson_ratings_update ON public.lesson_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY lesson_ratings_delete ON public.lesson_ratings
  FOR DELETE
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- =============================================
-- RLS: user_lesson_progress
-- =============================================

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY progress_select_own ON public.user_lesson_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY progress_insert_own ON public.user_lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY progress_update_own ON public.user_lesson_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all progress (for analytics)
CREATE POLICY progress_select_admin ON public.user_lesson_progress
  FOR SELECT
  USING (public.has_role('admin'));

-- =============================================
-- RLS: user_course_progress
-- =============================================

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY course_progress_select_own ON public.user_course_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY course_progress_select_admin ON public.user_course_progress
  FOR SELECT
  USING (public.has_role('admin'));

-- Insert/update managed by trigger only, but allow own user
CREATE POLICY course_progress_insert_own ON public.user_course_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY course_progress_update_own ON public.user_course_progress
  FOR UPDATE
  USING (auth.uid() = user_id);
