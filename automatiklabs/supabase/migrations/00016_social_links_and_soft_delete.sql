-- =============================================
-- Migration 00016: Social Links + Soft Delete
-- EPIC E1: AUTH-05, AUTH-07
-- Adds missing social link columns and soft-delete fields
-- =============================================

-- AUTH-05: Add social link columns to user_profiles
-- Using DO block for idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN linkedin TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'github'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN github TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'youtube'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN youtube TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'reddit'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN reddit TEXT;
  END IF;

  -- AUTH-07: Add soft-delete columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END;
$$;

-- Index for filtering out deleted users
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_deleted
  ON public.user_profiles (is_deleted)
  WHERE is_deleted = false;

-- Update RLS: exclude soft-deleted from public queries
-- Drop and recreate the SELECT policy for authenticated users
DO $$
BEGIN
  -- Only create if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_select_exclude_deleted'
  ) THEN
    CREATE POLICY user_profiles_select_exclude_deleted
      ON public.user_profiles
      FOR SELECT
      TO authenticated
      USING (
        is_deleted = false
        OR id = (SELECT auth.uid())
      );
  END IF;
END;
$$;

COMMENT ON COLUMN public.user_profiles.linkedin IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.user_profiles.github IS 'GitHub username or profile URL';
COMMENT ON COLUMN public.user_profiles.youtube IS 'YouTube channel URL';
COMMENT ON COLUMN public.user_profiles.reddit IS 'Reddit username (u/username format)';
COMMENT ON COLUMN public.user_profiles.is_deleted IS 'Soft-delete flag — true means account is deactivated';
COMMENT ON COLUMN public.user_profiles.deleted_at IS 'Timestamp when the account was soft-deleted';
