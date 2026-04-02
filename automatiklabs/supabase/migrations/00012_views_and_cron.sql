-- =============================================
-- Migration 00012: Materialized Views and Cron Functions
-- AutomatikClub — EPIC-04 Story 04.5
-- =============================================

-- =============================================
-- MATERIALIZED VIEW: leaderboard_weekly
-- =============================================

CREATE MATERIALIZED VIEW public.leaderboard_weekly AS
SELECT
  xt.user_id,
  up.username,
  up.full_name,
  up.avatar_url,
  COALESCE(SUM(xt.amount), 0)::INTEGER AS xp_week,
  RANK() OVER (ORDER BY COALESCE(SUM(xt.amount), 0) DESC) AS rank
FROM public.xp_transactions xt
JOIN public.user_profiles up ON up.id = xt.user_id
WHERE xt.created_at > (now() - interval '7 days')
GROUP BY xt.user_id, up.username, up.full_name, up.avatar_url
ORDER BY xp_week DESC;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_leaderboard_weekly_user ON public.leaderboard_weekly (user_id);
CREATE INDEX idx_leaderboard_weekly_rank ON public.leaderboard_weekly (rank);

COMMENT ON MATERIALIZED VIEW public.leaderboard_weekly IS 'Weekly XP leaderboard, refreshed hourly via pg_cron';

-- =============================================
-- MATERIALIZED VIEW: leaderboard_alltime
-- =============================================

CREATE MATERIALIZED VIEW public.leaderboard_alltime AS
SELECT
  ux.user_id,
  up.username,
  up.full_name,
  up.avatar_url,
  ux.total_xp,
  ux.level,
  ux.current_streak,
  RANK() OVER (ORDER BY ux.total_xp DESC) AS rank
FROM public.user_xp ux
JOIN public.user_profiles up ON up.id = ux.user_id
ORDER BY ux.total_xp DESC;

CREATE UNIQUE INDEX idx_leaderboard_alltime_user ON public.leaderboard_alltime (user_id);
CREATE INDEX idx_leaderboard_alltime_rank ON public.leaderboard_alltime (rank);

COMMENT ON MATERIALIZED VIEW public.leaderboard_alltime IS 'All-time XP leaderboard, refreshed hourly via pg_cron';

-- =============================================
-- MATERIALIZED VIEW: course_stats
-- =============================================

CREATE MATERIALIZED VIEW public.course_stats AS
SELECT
  c.id AS course_id,
  c.title AS course_title,
  c.slug AS course_slug,
  COUNT(DISTINCT ucp.user_id) AS enrolled_count,
  COALESCE(
    ROUND(
      (COUNT(DISTINCT CASE WHEN ucp.percentage >= 100 THEN ucp.user_id END)::NUMERIC /
       NULLIF(COUNT(DISTINCT ucp.user_id), 0)) * 100,
      2
    ),
    0
  ) AS completion_rate,
  COALESCE(
    ROUND(AVG(lr.rating)::NUMERIC, 2),
    0
  ) AS avg_rating,
  COUNT(DISTINCT lr.id) AS rating_count
FROM public.courses c
LEFT JOIN public.user_course_progress ucp ON ucp.course_id = c.id
LEFT JOIN public.modules m ON m.course_id = c.id
LEFT JOIN public.lessons l ON l.module_id = m.id
LEFT JOIN public.lesson_ratings lr ON lr.lesson_id = l.id
WHERE c.is_published = true
GROUP BY c.id, c.title, c.slug;

CREATE UNIQUE INDEX idx_course_stats_course ON public.course_stats (course_id);

COMMENT ON MATERIALIZED VIEW public.course_stats IS 'Course statistics: enrollment, completion rate, avg rating. Refreshed daily';

-- =============================================
-- FUNCTION: Refresh all materialized views
-- =============================================

CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_alltime;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.course_stats;
END;
$$;

COMMENT ON FUNCTION public.refresh_materialized_views IS 'Refreshes all materialized views concurrently. Called by pg_cron hourly.';

-- =============================================
-- FUNCTION: Refresh leaderboards only (hourly)
-- =============================================

CREATE OR REPLACE FUNCTION public.refresh_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_alltime;
END;
$$;

-- =============================================
-- FUNCTION: Refresh course stats only (daily)
-- =============================================

CREATE OR REPLACE FUNCTION public.refresh_course_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.course_stats;
END;
$$;

-- =============================================
-- FUNCTION: Expire old challenges
-- =============================================

CREATE OR REPLACE FUNCTION public.expire_old_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.challenges
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at < now();
END;
$$;

-- =============================================
-- pg_cron JOBS (wrapped in DO block for conditional execution)
-- NOTE: pg_cron must be enabled in Supabase dashboard.
-- These will fail gracefully if pg_cron is not available.
-- =============================================

DO $$
BEGIN
  -- Refresh leaderboards every hour
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'refresh-leaderboards',
      '0 * * * *',  -- every hour at minute 0
      'SELECT public.refresh_leaderboards()'
    );

    -- Refresh course stats daily at 3 AM UTC
    PERFORM cron.schedule(
      'refresh-course-stats',
      '0 3 * * *',
      'SELECT public.refresh_course_stats()'
    );

    -- Expire old challenges daily at midnight
    PERFORM cron.schedule(
      'expire-challenges',
      '0 0 * * *',
      'SELECT public.expire_old_challenges()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available. Cron jobs not scheduled. Error: %', SQLERRM;
END;
$$;

-- =============================================
-- GRANT SELECT on materialized views to authenticated
-- =============================================

-- Note: RLS does not apply to materialized views.
-- Access control is handled at the application/API level.
-- Grant read access to authenticated users via the anon/authenticated roles.

GRANT SELECT ON public.leaderboard_weekly TO authenticated;
GRANT SELECT ON public.leaderboard_alltime TO authenticated;
GRANT SELECT ON public.course_stats TO authenticated;
