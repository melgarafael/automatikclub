-- =============================================
-- Migration 00003: Learning Engine Tables
-- AutomatikClub — EPIC-04 Story 04.2
-- =============================================

-- Additional enums for learning
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo', 'upload');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- =============================================
-- TABLE: tracks (learning paths)
-- =============================================

CREATE TABLE public.tracks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  thumbnail_url           TEXT,
  category                TEXT,
  difficulty              difficulty_level NOT NULL DEFAULT 'beginner',
  position                INTEGER NOT NULL DEFAULT 0,
  is_published            BOOLEAN NOT NULL DEFAULT false,
  tier_required           subscription_tier NOT NULL DEFAULT 'free',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tracks_slug_unique UNIQUE (slug),
  CONSTRAINT tracks_position_non_negative CHECK (position >= 0)
);

-- Indexes
CREATE INDEX idx_tracks_slug ON public.tracks (slug);
CREATE INDEX idx_tracks_position ON public.tracks (position);
CREATE INDEX idx_tracks_published ON public.tracks (position) WHERE is_published = true;
CREATE INDEX idx_tracks_tier ON public.tracks (tier_required);

COMMENT ON TABLE public.tracks IS 'Learning paths that group courses into logical sequences';

-- =============================================
-- TABLE: courses
-- =============================================

CREATE TABLE public.courses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id                UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  thumbnail_url           TEXT,
  instructor_id           UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  duration_minutes        INTEGER,
  tier_required           subscription_tier NOT NULL DEFAULT 'free',
  position                INTEGER NOT NULL DEFAULT 0,
  is_published            BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT courses_slug_unique UNIQUE (slug),
  CONSTRAINT courses_position_non_negative CHECK (position >= 0),
  CONSTRAINT courses_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Indexes
CREATE INDEX idx_courses_track ON public.courses (track_id);
CREATE INDEX idx_courses_slug ON public.courses (slug);
CREATE INDEX idx_courses_instructor ON public.courses (instructor_id);
CREATE INDEX idx_courses_sort ON public.courses (track_id, position);
CREATE INDEX idx_courses_published ON public.courses (track_id, position) WHERE is_published = true;
CREATE INDEX idx_courses_tier ON public.courses (tier_required);

COMMENT ON TABLE public.courses IS 'Courses within a learning track';

-- =============================================
-- TABLE: modules
-- =============================================

CREATE TABLE public.modules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id               UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  position                INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT modules_slug_unique UNIQUE (slug),
  CONSTRAINT modules_position_non_negative CHECK (position >= 0)
);

-- Indexes
CREATE INDEX idx_modules_course ON public.modules (course_id);
CREATE INDEX idx_modules_slug ON public.modules (slug);
CREATE INDEX idx_modules_sort ON public.modules (course_id, position);

COMMENT ON TABLE public.modules IS 'Modules that organize lessons within a course';

-- =============================================
-- TABLE: lessons
-- =============================================

CREATE TABLE public.lessons (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id               UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  video_url               TEXT,
  video_source            video_provider,
  content_md              TEXT,
  duration_minutes        INTEGER,
  position                INTEGER NOT NULL DEFAULT 0,
  is_published            BOOLEAN NOT NULL DEFAULT false,
  tier_required           subscription_tier NOT NULL DEFAULT 'free',
  tags                    TEXT[] DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT lessons_slug_unique UNIQUE (slug),
  CONSTRAINT lessons_position_non_negative CHECK (position >= 0),
  CONSTRAINT lessons_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Indexes
CREATE INDEX idx_lessons_module ON public.lessons (module_id);
CREATE INDEX idx_lessons_slug ON public.lessons (slug);
CREATE INDEX idx_lessons_sort ON public.lessons (module_id, position);
CREATE INDEX idx_lessons_published ON public.lessons (module_id, position) WHERE is_published = true;
CREATE INDEX idx_lessons_tags ON public.lessons USING gin (tags);
CREATE INDEX idx_lessons_tier ON public.lessons (tier_required);

COMMENT ON TABLE public.lessons IS 'Individual lessons with video, markdown content, and tags';

-- =============================================
-- TABLE: lesson_embeddings (pgvector)
-- =============================================

CREATE TABLE public.lesson_embeddings (
  lesson_id               UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  embedding               vector(1536) NOT NULL,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index for semantic search
CREATE INDEX idx_lesson_embeddings_vector ON public.lesson_embeddings
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

COMMENT ON TABLE public.lesson_embeddings IS 'Vector embeddings for lesson content (OpenAI text-embedding-3-small)';

-- =============================================
-- TABLE: lesson_ratings
-- =============================================

CREATE TABLE public.lesson_ratings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  lesson_id               UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  rating                  SMALLINT NOT NULL,
  feedback                TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT lesson_ratings_unique UNIQUE (user_id, lesson_id),
  CONSTRAINT lesson_ratings_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_lesson_ratings_lesson ON public.lesson_ratings (lesson_id);
CREATE INDEX idx_lesson_ratings_user ON public.lesson_ratings (user_id);

COMMENT ON TABLE public.lesson_ratings IS 'Lesson ratings (1-5 stars) with optional text feedback';

-- =============================================
-- TABLE: user_lesson_progress
-- =============================================

CREATE TABLE public.user_lesson_progress (
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  lesson_id               UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  progress_percentage     INTEGER NOT NULL DEFAULT 0,
  is_completed            BOOLEAN NOT NULL DEFAULT false,
  completed_at            TIMESTAMPTZ,
  last_watched_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating                  SMALLINT,

  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT progress_percentage_range CHECK (progress_percentage BETWEEN 0 AND 100),
  CONSTRAINT progress_rating_range CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

-- Indexes
CREATE INDEX idx_user_lesson_progress_user ON public.user_lesson_progress (user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON public.user_lesson_progress (lesson_id);
CREATE INDEX idx_user_lesson_progress_completed ON public.user_lesson_progress (user_id) WHERE is_completed = true;

COMMENT ON TABLE public.user_lesson_progress IS 'Per-user per-lesson progress tracking (0-100%)';

-- =============================================
-- TABLE: user_course_progress
-- =============================================

CREATE TABLE public.user_course_progress (
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id               UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lessons       INTEGER NOT NULL DEFAULT 0,
  total_lessons           INTEGER NOT NULL DEFAULT 0,
  percentage              NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_activity_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, course_id),
  CONSTRAINT course_progress_percentage_range CHECK (percentage BETWEEN 0 AND 100),
  CONSTRAINT course_progress_lessons_non_negative CHECK (completed_lessons >= 0 AND total_lessons >= 0)
);

-- Indexes
CREATE INDEX idx_user_course_progress_user ON public.user_course_progress (user_id);
CREATE INDEX idx_user_course_progress_course ON public.user_course_progress (course_id);

COMMENT ON TABLE public.user_course_progress IS 'Aggregated course-level progress for each user';

-- =============================================
-- TRIGGER: Recalculate course progress when lesson progress changes
-- =============================================

CREATE OR REPLACE FUNCTION public.recalculate_course_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_course_id UUID;
  v_total INTEGER;
  v_completed INTEGER;
  v_pct NUMERIC(5,2);
BEGIN
  -- Find the course_id for this lesson
  SELECT c.id INTO v_course_id
  FROM public.modules m
  JOIN public.courses c ON c.id = m.course_id
  JOIN public.lessons l ON l.module_id = m.id
  WHERE l.id = COALESCE(NEW.lesson_id, OLD.lesson_id)
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count total published lessons in the course
  SELECT COUNT(*) INTO v_total
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = v_course_id
    AND l.is_published = true;

  -- Count completed lessons for this user in this course
  SELECT COUNT(*) INTO v_completed
  FROM public.user_lesson_progress ulp
  JOIN public.lessons l ON l.id = ulp.lesson_id
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = v_course_id
    AND ulp.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND ulp.is_completed = true;

  -- Calculate percentage
  IF v_total > 0 THEN
    v_pct := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100, 2);
  ELSE
    v_pct := 0;
  END IF;

  -- Upsert user_course_progress
  INSERT INTO public.user_course_progress (user_id, course_id, completed_lessons, total_lessons, percentage, last_activity_at)
  VALUES (COALESCE(NEW.user_id, OLD.user_id), v_course_id, v_completed, v_total, v_pct, now())
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    completed_lessons = EXCLUDED.completed_lessons,
    total_lessons = EXCLUDED.total_lessons,
    percentage = EXCLUDED.percentage,
    last_activity_at = EXCLUDED.last_activity_at;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER recalculate_course_progress_on_lesson
  AFTER INSERT OR UPDATE OF is_completed ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_course_progress();

-- =============================================
-- TRIGGER: Auto-complete lesson when progress >= 90
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_complete_lesson()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.progress_percentage >= 90 AND NOT NEW.is_completed THEN
    NEW.is_completed := true;
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_complete_lesson_trigger
  BEFORE INSERT OR UPDATE OF progress_percentage ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_lesson();

-- =============================================
-- TRIGGERS: updated_at for learning tables
-- =============================================

CREATE TRIGGER set_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
