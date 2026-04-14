-- =============================================
-- Migration 00018: Updated level math + streak fix
-- EPIC E4: GAM-01, GAM-02
-- Replaces simple FLOOR(xp/1000)+1 formula with lookup-based levels.
-- Fixes streak DATE comparison.
-- =============================================

-- Update recalculate_user_xp to use threshold-based level calculation
CREATE OR REPLACE FUNCTION public.recalculate_user_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_xp   INTEGER;
  v_level      INTEGER;
  v_old_streak INTEGER;
  v_new_streak INTEGER;
  v_longest    INTEGER;
  v_last_date  DATE;
  v_today      DATE;
BEGIN
  -- Sum all XP for this user
  SELECT COALESCE(SUM(amount), 0) INTO v_total_xp
  FROM public.xp_transactions
  WHERE user_id = NEW.user_id;

  -- 20-level logarithmic progression lookup
  v_level := CASE
    WHEN v_total_xp >= 50000 THEN 20
    WHEN v_total_xp >= 40000 THEN 19
    WHEN v_total_xp >= 30000 THEN 18
    WHEN v_total_xp >= 22000 THEN 17
    WHEN v_total_xp >= 16000 THEN 16
    WHEN v_total_xp >= 12000 THEN 15
    WHEN v_total_xp >= 10000 THEN 14
    WHEN v_total_xp >= 8000  THEN 13
    WHEN v_total_xp >= 6000  THEN 12
    WHEN v_total_xp >= 4500  THEN 11
    WHEN v_total_xp >= 3000  THEN 10
    WHEN v_total_xp >= 2400  THEN 9
    WHEN v_total_xp >= 1800  THEN 8
    WHEN v_total_xp >= 1200  THEN 7
    WHEN v_total_xp >= 800   THEN 6
    WHEN v_total_xp >= 500   THEN 5
    WHEN v_total_xp >= 250   THEN 4
    WHEN v_total_xp >= 125   THEN 3
    WHEN v_total_xp >= 50    THEN 2
    ELSE 1
  END;

  -- Streak calculation using DATE comparison (not timestamp)
  v_today := CURRENT_DATE;

  SELECT current_streak, longest_streak, last_activity_date
  INTO v_old_streak, v_longest, v_last_date
  FROM public.user_xp
  WHERE user_id = NEW.user_id;

  IF v_last_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last_date = v_today THEN
    -- Same day: streak unchanged
    v_new_streak := COALESCE(v_old_streak, 1);
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day: increment
    v_new_streak := COALESCE(v_old_streak, 0) + 1;
  ELSE
    -- Gap > 1 day: reset
    v_new_streak := 1;
  END IF;

  v_longest := GREATEST(COALESCE(v_longest, 0), v_new_streak);

  -- Upsert user_xp
  INSERT INTO public.user_xp (user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.user_id, v_total_xp, v_level, v_new_streak, v_longest, v_today)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = v_total_xp,
    level = v_level,
    current_streak = v_new_streak,
    longest_streak = v_longest,
    last_activity_date = v_today;

  -- Sync total_points on user_profiles
  UPDATE public.user_profiles
  SET total_points = v_total_xp
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.recalculate_user_xp IS 'Recalculates user XP, level (20-level log curve), and streak on each xp_transaction insert. Fixed DATE comparison for streaks.';
