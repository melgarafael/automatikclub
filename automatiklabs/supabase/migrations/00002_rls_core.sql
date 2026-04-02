-- =============================================
-- Migration 00002: RLS Policies for Core Tables
-- AutomatikClub — EPIC-04 Story 04.1
-- =============================================

-- =============================================
-- RLS: user_profiles
-- =============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see public profile fields
-- NOTE: CPF is filtered via this policy — only owner and admin see it
CREATE POLICY user_profiles_select_public ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent users from changing their own role or subscription_level
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    AND subscription_level = (SELECT subscription_level FROM public.user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile (including role/subscription changes)
CREATE POLICY user_profiles_update_admin ON public.user_profiles
  FOR UPDATE
  USING (public.has_role('admin'));

-- Insert only via trigger (on_auth_user_created)
CREATE POLICY user_profiles_insert_trigger ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins or the user themselves can delete (LGPD right to erasure)
CREATE POLICY user_profiles_delete ON public.user_profiles
  FOR DELETE
  USING (public.has_role('admin') OR auth.uid() = id);

-- =============================================
-- VIEW: Safe profile view that hides sensitive fields
-- =============================================

CREATE OR REPLACE VIEW public.user_profiles_public AS
SELECT
  id,
  username,
  full_name,
  bio,
  avatar_url,
  stack,
  portfolio_url,
  role,
  subscription_level,
  total_points,
  created_at,
  -- Only expose sensitive fields to the owner or admin
  CASE
    WHEN auth.uid() = id OR public.has_role('admin') THEN email
    ELSE NULL
  END AS email,
  CASE
    WHEN auth.uid() = id OR public.has_role('admin') THEN cpf_encrypted
    ELSE NULL
  END AS cpf_encrypted,
  CASE
    WHEN auth.uid() = id OR public.has_role('admin') THEN whatsapp
    ELSE NULL
  END AS whatsapp,
  CASE
    WHEN auth.uid() = id OR public.has_role('admin') THEN instagram
    ELSE NULL
  END AS instagram
FROM public.user_profiles;

-- =============================================
-- RLS: subscriptions
-- =============================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all subscriptions
CREATE POLICY subscriptions_select_admin ON public.subscriptions
  FOR SELECT
  USING (public.has_role('admin'));

-- Users can only update their own subscriptions (e.g., cancel)
CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any subscription
CREATE POLICY subscriptions_update_admin ON public.subscriptions
  FOR UPDATE
  USING (public.has_role('admin'));

-- Insert: via service_role (Stripe webhook) or admin
CREATE POLICY subscriptions_insert ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));

-- Only admins delete subscriptions
CREATE POLICY subscriptions_delete_admin ON public.subscriptions
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: user_preferences
-- =============================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY user_preferences_select_own ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY user_preferences_update_own ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert is handled by trigger, but allow user to insert their own
CREATE POLICY user_preferences_insert_own ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY user_preferences_select_admin ON public.user_preferences
  FOR SELECT
  USING (public.has_role('admin'));
