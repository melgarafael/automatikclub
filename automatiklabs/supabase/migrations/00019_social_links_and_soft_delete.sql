-- =============================================
-- Migration 00019: Social Links + Soft Delete
-- Adds missing columns referenced by E1 code
-- =============================================

-- Social link columns (referenced by profile-edit-form.tsx and update-profile.ts)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS github TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS reddit TEXT;

-- Soft-delete columns (referenced by proxy.ts and delete-account action)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for soft-delete queries (proxy.ts checks is_deleted on every protected route)
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_deleted
  ON public.user_profiles (is_deleted)
  WHERE is_deleted = true;

-- Update RLS: exclude soft-deleted profiles from public SELECT
-- Drop and recreate the public select policy to include is_deleted check
DO $$
BEGIN
  -- Only alter if the policy exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Users can view all profiles'
  ) THEN
    DROP POLICY "Users can view all profiles" ON public.user_profiles;
    CREATE POLICY "Users can view all profiles"
      ON public.user_profiles FOR SELECT
      USING (is_deleted = false OR id = auth.uid());
  END IF;

  -- Also try the alternate policy name
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'user_profiles_select_policy'
  ) THEN
    DROP POLICY "user_profiles_select_policy" ON public.user_profiles;
    CREATE POLICY "user_profiles_select_policy"
      ON public.user_profiles FOR SELECT
      USING (is_deleted = false OR id = auth.uid());
  END IF;
END $$;

-- Cover image columns for tracks and courses (E2 CMS)
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
