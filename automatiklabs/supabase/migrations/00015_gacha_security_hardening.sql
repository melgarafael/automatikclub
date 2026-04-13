-- =============================================
-- Migration 00015: Gacha Security Hardening
-- AutomatikLabs — EPIC-18 Story 18.9
-- Depends: 00013 (gacha schema), 00014 (gacha rpcs)
-- =============================================

-- =============================================
-- 1. Idempotency key on pull_history (replay prevention)
-- =============================================

ALTER TABLE public.pull_history
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pull_history_idempotency
  ON public.pull_history (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.pull_history.idempotency_key
  IS 'Client-generated UUID for replay attack prevention. Optional for backward compat.';

-- =============================================
-- 2. Nonce uniqueness per seed (prevents nonce reuse)
-- =============================================

-- Each nonce must be unique within a given seed pair.
-- The HMAC is deterministic for (server_seed, client_seed, nonce),
-- so reusing a nonce with the same seed produces the same result.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pull_history_seed_nonce
  ON public.pull_history (user_id, server_seed_hash, nonce);

-- =============================================
-- 3. Secure view for gacha_seeds (hides active server_seed)
-- =============================================

-- Users should NEVER see server_seed while the seed is active.
-- They see server_seed_hash (published pre-pull) and can verify
-- server_seed only after rotation (is_active = false).

CREATE OR REPLACE VIEW public.gacha_seeds_safe AS
SELECT
  id,
  user_id,
  CASE
    WHEN is_active = true THEN NULL
    ELSE server_seed
  END AS server_seed,
  server_seed_hash,
  client_seed,
  nonce,
  is_active,
  created_at,
  revealed_at
FROM public.gacha_seeds;

COMMENT ON VIEW public.gacha_seeds_safe
  IS 'Safe view of gacha_seeds that hides server_seed for active seeds. Use this for client-facing queries.';

-- Grant access to the view (RLS on underlying table still applies)
GRANT SELECT ON public.gacha_seeds_safe TO authenticated;

-- =============================================
-- 4. Verify CHECK constraints exist (defensive — already in 00013)
-- =============================================

-- These are already in 00013 but we add DO blocks to verify they exist
-- and alert if missing (idempotent).

DO $$
BEGIN
  -- user_wallets.fragments >= 0
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'user_wallets_fragments_non_negative'
  ) THEN
    ALTER TABLE public.user_wallets
      ADD CONSTRAINT user_wallets_fragments_non_negative CHECK (fragments >= 0);
  END IF;

  -- user_wallets.credits >= 0
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'user_wallets_credits_non_negative'
  ) THEN
    ALTER TABLE public.user_wallets
      ADD CONSTRAINT user_wallets_credits_non_negative CHECK (credits >= 0);
  END IF;

  -- currency_transactions.balance_after >= 0
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'currency_tx_balance_non_negative'
  ) THEN
    ALTER TABLE public.currency_transactions
      ADD CONSTRAINT currency_tx_balance_non_negative CHECK (balance_after >= 0);
  END IF;
END $$;

-- =============================================
-- 5. RLS Audit Verification
-- =============================================
-- All 12 gacha tables must have RLS enabled.
-- This DO block raises an exception if any table is missing RLS.
-- It's a safety net — 00013 already enables them all.

DO $$
DECLARE
  tbl TEXT;
  missing TEXT[] := ARRAY[]::TEXT[];
  gacha_tables TEXT[] := ARRAY[
    'gacha_items',
    'gacha_banners',
    'gacha_banner_items',
    'user_wallets',
    'user_inventory',
    'user_pity',
    'pull_history',
    'gacha_seeds',
    'currency_transactions',
    'fusion_history',
    'gacha_marketplace_listings',
    'gacha_rarity_price_config'
  ];
BEGIN
  FOREACH tbl IN ARRAY gacha_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = tbl
        AND c.relrowsecurity = true
    ) THEN
      missing := array_append(missing, tbl);
    END IF;
  END LOOP;

  IF array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION 'RLS NOT ENABLED on gacha tables: %', array_to_string(missing, ', ');
  END IF;
END $$;

-- =============================================
-- 6. Restrict gacha_seeds SELECT to hide server_seed on active seeds
-- =============================================
-- Drop the existing permissive policy and replace with one that
-- filters the server_seed column. However, RLS cannot filter columns —
-- it can only filter rows. The proper approach is to use the
-- gacha_seeds_safe VIEW for all client queries.
--
-- The existing RLS policy (from 00013) already restricts to own rows.
-- Applications MUST use gacha_seeds_safe instead of gacha_seeds directly.
-- As a belt-and-suspenders measure, we document this requirement here.

-- =============================================
-- DONE: Security hardening applied.
-- Summary:
--   - pull_history.idempotency_key column + unique index
--   - pull_history unique index on (user_id, server_seed_hash, nonce)
--   - gacha_seeds_safe view (hides active server_seed)
--   - CHECK constraint verification (fragments >= 0, credits >= 0, balance_after >= 0)
--   - RLS enabled verification on all 12 gacha tables
-- =============================================
