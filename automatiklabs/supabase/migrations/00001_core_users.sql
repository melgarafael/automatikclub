-- =============================================
-- Migration 00001: Core Users, Profiles, Subscriptions
-- AutomatikClub — EPIC-04 Story 04.1
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM (
  'aluno',
  'contribuidor',
  'moderador',
  'admin'
);

CREATE TYPE subscription_tier AS ENUM (
  'free',
  'pro',
  'premium'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'trialing'
);

CREATE TYPE profile_visibility AS ENUM (
  'public',
  'members_only',
  'private'
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user has at least the required role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role TEXT;
  role_levels JSONB := '{"aluno":1,"contribuidor":2,"moderador":3,"admin":4}'::jsonb;
BEGIN
  user_role := (auth.jwt() -> 'app_metadata' ->> 'role');
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN (role_levels ->> user_role)::int >= (role_levels ->> required_role)::int;
END;
$$;

-- Check if user has at least the required subscription tier
CREATE OR REPLACE FUNCTION public.has_subscription(required_level TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_level TEXT;
  sub_levels JSONB := '{"free":1,"pro":2,"premium":3}'::jsonb;
BEGIN
  -- Moderadores and admins bypass subscription check
  IF public.has_role('moderador') THEN
    RETURN TRUE;
  END IF;
  user_level := (auth.jwt() -> 'app_metadata' ->> 'subscription_level');
  IF user_level IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN (sub_levels ->> user_level)::int >= (sub_levels ->> required_level)::int;
END;
$$;

-- Tier checking helper (alternative using subscription_tier enum)
CREATE OR REPLACE FUNCTION public.user_has_tier(required_tier subscription_tier)
RETURNS BOOLEAN AS $$
  SELECT CASE
    WHEN required_tier = 'free' THEN true
    WHEN required_tier = 'pro' THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND tier IN ('pro', 'premium')
      )
    )
    WHEN required_tier = 'premium' THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND tier = 'premium'
      )
    )
    ELSE false
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Alias for auth.uid() for clarity
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Check resource ownership
CREATE OR REPLACE FUNCTION public.is_owner(resource_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = resource_user_id;
$$;

-- =============================================
-- TABLE: user_profiles
-- =============================================

CREATE TABLE public.user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE,
  full_name             TEXT,
  email                 TEXT NOT NULL,
  cpf_encrypted         BYTEA,  -- LGPD: encrypted at rest
  whatsapp              TEXT,
  instagram             TEXT,
  bio                   TEXT,
  avatar_url            TEXT,
  stack                 TEXT[] DEFAULT '{}',
  portfolio_url         TEXT,
  role                  user_role NOT NULL DEFAULT 'aluno',
  subscription_level    subscription_tier NOT NULL DEFAULT 'free',
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT true,
  total_points          INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_profiles_email_unique UNIQUE (email),
  CONSTRAINT user_profiles_total_points_non_negative CHECK (total_points >= 0)
);

-- Indexes
CREATE INDEX idx_user_profiles_role ON public.user_profiles (role);
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles (subscription_level);
CREATE INDEX idx_user_profiles_total_points ON public.user_profiles (total_points DESC);
CREATE INDEX idx_user_profiles_email_trgm ON public.user_profiles USING gin (email gin_trgm_ops);
CREATE INDEX idx_user_profiles_username ON public.user_profiles (username) WHERE username IS NOT NULL;

COMMENT ON TABLE public.user_profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.user_profiles.cpf_encrypted IS 'CPF encrypted with pgcrypto for LGPD compliance';

-- =============================================
-- TABLE: subscriptions
-- =============================================

CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  tier                    subscription_tier NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);
CREATE UNIQUE INDEX idx_subscriptions_active_user ON public.subscriptions (user_id) WHERE status = 'active';

COMMENT ON TABLE public.subscriptions IS 'Stripe subscription records linked to user profiles';

-- =============================================
-- TABLE: user_preferences
-- =============================================

CREATE TABLE public.user_preferences (
  user_id               UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  notification_email    BOOLEAN NOT NULL DEFAULT true,
  notification_push     BOOLEAN NOT NULL DEFAULT true,
  notification_inapp    BOOLEAN NOT NULL DEFAULT true,
  profile_visibility    profile_visibility NOT NULL DEFAULT 'public',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_preferences IS 'User notification and privacy preferences';

-- =============================================
-- TRIGGER: auto-create profile on user registration
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create default profile
  INSERT INTO public.user_profiles (id, email, role, subscription_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'aluno',
    'free'
  );

  -- Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- Set custom claims in JWT
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    json_build_object(
      'role', 'aluno',
      'subscription_level', 'free'
    )::jsonb
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: sync JWT claims when role/subscription changes
-- =============================================

CREATE OR REPLACE FUNCTION public.sync_user_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    json_build_object(
      'role', NEW.role::text,
      'subscription_level', NEW.subscription_level::text
    )::jsonb
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_claims_updated
  AFTER UPDATE OF role, subscription_level ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role
    OR OLD.subscription_level IS DISTINCT FROM NEW.subscription_level)
  EXECUTE FUNCTION public.sync_user_claims();

-- =============================================
-- TRIGGER: auto-update updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
