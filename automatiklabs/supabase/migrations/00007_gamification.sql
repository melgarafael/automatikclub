-- =============================================
-- Migration 00007: Gamification Tables
-- AutomatikClub — EPIC-04 Story 04.4
-- =============================================

-- Enums
CREATE TYPE xp_source_type AS ENUM (
  'lesson_complete',
  'module_complete',
  'course_complete',
  'track_complete',
  'rating',
  'comment',
  'post',
  'marketplace_upload',
  'marketplace_review',
  'challenge',
  'contributor_lesson',
  'streak',
  'daily_login',
  'badge_earned'
);

CREATE TYPE badge_criteria_type AS ENUM (
  'total_points',
  'lessons_completed',
  'courses_completed',
  'comments_posted',
  'posts_created',
  'challenges_completed',
  'marketplace_items',
  'streak_days'
);

CREATE TYPE challenge_status AS ENUM (
  'draft',
  'active',
  'completed',
  'expired'
);

-- =============================================
-- TABLE: xp_transactions
-- =============================================

CREATE TABLE public.xp_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount                  INTEGER NOT NULL,
  source_type             xp_source_type NOT NULL,
  source_id               UUID,
  description             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Deduplication: prevent double-counting XP for the same action on the same entity
  CONSTRAINT xp_transactions_dedup UNIQUE (user_id, source_type, source_id),
  CONSTRAINT xp_transactions_positive CHECK (amount > 0)
);

CREATE INDEX idx_xp_transactions_user ON public.xp_transactions (user_id);
CREATE INDEX idx_xp_transactions_source ON public.xp_transactions (source_type);
CREATE INDEX idx_xp_transactions_created ON public.xp_transactions (created_at DESC);
CREATE INDEX idx_xp_transactions_user_date ON public.xp_transactions (user_id, created_at DESC);
-- Note: partial index with now() not allowed (must be IMMUTABLE). Use query-time filtering instead.
CREATE INDEX idx_xp_transactions_source_date ON public.xp_transactions (source_type, user_id, created_at DESC);

COMMENT ON TABLE public.xp_transactions IS 'Immutable XP transaction log. UNIQUE(user_id, source_type, source_id) prevents duplication';

-- =============================================
-- TABLE: user_xp
-- =============================================

CREATE TABLE public.user_xp (
  user_id                 UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  total_xp                INTEGER NOT NULL DEFAULT 0,
  level                   INTEGER NOT NULL DEFAULT 1,
  current_streak          INTEGER NOT NULL DEFAULT 0,
  longest_streak          INTEGER NOT NULL DEFAULT 0,
  last_activity_date      DATE,

  CONSTRAINT user_xp_total_non_negative CHECK (total_xp >= 0),
  CONSTRAINT user_xp_level_positive CHECK (level >= 1),
  CONSTRAINT user_xp_streak_non_negative CHECK (current_streak >= 0 AND longest_streak >= 0)
);

CREATE INDEX idx_user_xp_total ON public.user_xp (total_xp DESC);
CREATE INDEX idx_user_xp_level ON public.user_xp (level DESC);
CREATE INDEX idx_user_xp_streak ON public.user_xp (current_streak DESC);

COMMENT ON TABLE public.user_xp IS 'Aggregated XP summary, level, and streak data per user';

-- =============================================
-- TABLE: badges
-- =============================================

CREATE TABLE public.badges (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  description             TEXT,
  icon_url                TEXT,
  criteria_type           badge_criteria_type NOT NULL,
  criteria_value          INTEGER NOT NULL,
  xp_reward               INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT badges_slug_unique UNIQUE (slug),
  CONSTRAINT badges_name_unique UNIQUE (name),
  CONSTRAINT badges_criteria_positive CHECK (criteria_value > 0),
  CONSTRAINT badges_xp_non_negative CHECK (xp_reward >= 0)
);

CREATE INDEX idx_badges_slug ON public.badges (slug);
CREATE INDEX idx_badges_criteria ON public.badges (criteria_type);

COMMENT ON TABLE public.badges IS 'Badge definitions unlocked when criteria are met';

-- =============================================
-- TABLE: user_badges
-- =============================================

CREATE TABLE public.user_badges (
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  badge_id                UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges (user_id);
CREATE INDEX idx_user_badges_badge ON public.user_badges (badge_id);

COMMENT ON TABLE public.user_badges IS 'N:N relationship between users and badges earned';

-- =============================================
-- TABLE: challenges
-- =============================================

CREATE TABLE public.challenges (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  description             TEXT,
  criteria_type           badge_criteria_type NOT NULL,
  criteria_value          INTEGER NOT NULL,
  xp_reward               INTEGER NOT NULL,
  starts_at               TIMESTAMPTZ NOT NULL,
  ends_at                 TIMESTAMPTZ NOT NULL,
  status                  challenge_status NOT NULL DEFAULT 'draft',
  created_by              UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT challenges_dates_valid CHECK (ends_at > starts_at),
  CONSTRAINT challenges_criteria_positive CHECK (criteria_value > 0),
  CONSTRAINT challenges_reward_positive CHECK (xp_reward > 0)
);

CREATE INDEX idx_challenges_status ON public.challenges (status);
CREATE INDEX idx_challenges_dates ON public.challenges (starts_at, ends_at);
CREATE INDEX idx_challenges_active ON public.challenges (ends_at) WHERE status = 'active';

COMMENT ON TABLE public.challenges IS 'Time-limited challenges with XP rewards';

-- =============================================
-- TABLE: challenge_participations
-- =============================================

CREATE TABLE public.challenge_participations (
  challenge_id            UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  enrolled_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at            TIMESTAMPTZ,

  PRIMARY KEY (challenge_id, user_id)
);

CREATE INDEX idx_challenge_participations_user ON public.challenge_participations (user_id);
CREATE INDEX idx_challenge_participations_challenge ON public.challenge_participations (challenge_id);

COMMENT ON TABLE public.challenge_participations IS 'User enrollment and completion tracking for challenges';

-- =============================================
-- TRIGGER: Recalculate user_xp when xp_transaction is inserted
-- =============================================

CREATE OR REPLACE FUNCTION public.recalculate_user_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total INTEGER;
  v_level INTEGER;
  v_streak INTEGER;
  v_longest INTEGER;
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Calculate total XP
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM public.xp_transactions
  WHERE user_id = NEW.user_id;

  -- Calculate level: every 1000 XP = 1 level (floor), minimum level 1
  v_level := GREATEST(1, FLOOR(v_total / 1000.0)::int + 1);

  -- Get current streak info
  SELECT current_streak, longest_streak, last_activity_date
  INTO v_streak, v_longest, v_last_date
  FROM public.user_xp
  WHERE user_id = NEW.user_id;

  -- Update streak
  IF v_last_date IS NULL THEN
    v_streak := 1;
  ELSIF v_last_date = v_today - 1 THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSIF v_last_date = v_today THEN
    -- Same day, no change
    v_streak := COALESCE(v_streak, 1);
  ELSE
    -- Streak broken
    v_streak := 1;
  END IF;

  v_longest := GREATEST(COALESCE(v_longest, 0), v_streak);

  -- Upsert user_xp
  INSERT INTO public.user_xp (user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.user_id, v_total, v_level, v_streak, v_longest, v_today)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    last_activity_date = EXCLUDED.last_activity_date;

  -- Also update total_points in user_profiles for quick access
  UPDATE public.user_profiles SET total_points = v_total WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_user_xp_trigger
  AFTER INSERT ON public.xp_transactions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_xp();
