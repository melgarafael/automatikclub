-- =============================================
-- Migration 00017: XP reward per lesson
-- EPIC E2: CMS-03
-- Adds xp_reward column to lessons table
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'xp_reward'
  ) THEN
    ALTER TABLE public.lessons ADD COLUMN xp_reward INTEGER NOT NULL DEFAULT 10;
  END IF;
END;
$$;

-- Constraint: 0 to 1000
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_xp_reward_range;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_xp_reward_range CHECK (xp_reward >= 0 AND xp_reward <= 1000);

COMMENT ON COLUMN public.lessons.xp_reward IS 'XP awarded when student completes this lesson. Default 10, range 0-1000.';
