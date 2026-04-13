-- =============================================
-- Migration 00014: Gacha RPC Functions
-- AutomatikLabs — EPIC-18 Story 18.2
-- Depends: 00001 (pgcrypto), 00013 (gacha schema)
-- =============================================

-- Ensure pgcrypto is available (already created in 00001, but defensive)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- HELPER: hmac_to_float
-- Converts HMAC-SHA256 output to a float in [0, 1)
-- Used for provably fair random number generation.
-- =============================================

CREATE OR REPLACE FUNCTION public.hmac_to_float(
  p_server_seed TEXT,
  p_client_seed TEXT,
  p_nonce       BIGINT,
  p_cursor      INTEGER DEFAULT 0
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_message TEXT;
  v_hmac    BYTEA;
  v_hex     TEXT;
  v_int     BIGINT;
BEGIN
  v_message := p_client_seed || ':' || p_nonce || ':' || p_cursor;
  v_hmac := extensions.hmac(v_message::bytea, p_server_seed::bytea, 'sha256');
  -- Take first 4 bytes (8 hex chars), convert to unsigned integer, normalize to [0,1)
  v_hex := encode(substring(v_hmac from 1 for 4), 'hex');
  v_int := ('x' || v_hex)::bit(32)::bigint;
  RETURN v_int::double precision / 4294967296.0;
END;
$$;

COMMENT ON FUNCTION public.hmac_to_float IS 'Provably fair RNG: HMAC-SHA256 → [0,1) float. Deterministic given same inputs.';

-- =============================================
-- HELPER: ensure_gacha_seed
-- Creates a seed pair for the user if none exists.
-- Returns the active seed row.
-- =============================================

CREATE OR REPLACE FUNCTION public.ensure_gacha_seed(p_user_id UUID)
RETURNS public.gacha_seeds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_seed public.gacha_seeds;
  v_server_seed TEXT;
BEGIN
  SELECT * INTO v_seed
  FROM public.gacha_seeds
  WHERE user_id = p_user_id AND is_active = true;

  IF v_seed.id IS NOT NULL THEN
    RETURN v_seed;
  END IF;

  -- Generate new seed pair
  v_server_seed := encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.gacha_seeds (user_id, server_seed, server_seed_hash, client_seed, nonce, is_active)
  VALUES (
    p_user_id,
    v_server_seed,
    encode(extensions.digest(v_server_seed::bytea, 'sha256'), 'hex'),
    encode(extensions.gen_random_bytes(16), 'hex'),
    0,
    true
  )
  RETURNING * INTO v_seed;

  RETURN v_seed;
END;
$$;

-- =============================================
-- HELPER: rarity_to_int / int_to_rarity
-- Ordinal mapping for rarity comparison and upgrade.
-- =============================================

CREATE OR REPLACE FUNCTION public.rarity_to_int(r item_rarity)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE r
    WHEN 'common'    THEN 1
    WHEN 'uncommon'  THEN 2
    WHEN 'rare'      THEN 3
    WHEN 'epic'      THEN 4
    WHEN 'legendary' THEN 5
  END;
$$;

CREATE OR REPLACE FUNCTION public.int_to_rarity(i INTEGER)
RETURNS item_rarity
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE i
    WHEN 1 THEN 'common'::item_rarity
    WHEN 2 THEN 'uncommon'::item_rarity
    WHEN 3 THEN 'rare'::item_rarity
    WHEN 4 THEN 'epic'::item_rarity
    WHEN 5 THEN 'legendary'::item_rarity
  END;
$$;

-- =============================================
-- FUNCTION: perform_gacha_pull
-- Atomic gacha pull with pity, weighted random, provably fair.
-- =============================================

CREATE OR REPLACE FUNCTION public.perform_gacha_pull(
  p_banner_id  UUID,
  p_pull_count INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id          UUID;
  v_banner           public.gacha_banners;
  v_cost             INTEGER;
  v_wallet           public.user_wallets;
  v_seed             public.gacha_seeds;
  v_pity             public.user_pity;
  v_pity_count       INTEGER;
  v_guaranteed_next  BOOLEAN;
  v_nonce            BIGINT;
  v_roll             DOUBLE PRECISION;
  v_results          JSONB := '[]'::jsonb;
  v_pull_id          UUID;
  v_selected_item    RECORD;
  v_was_pity         BOOLEAN;
  v_was_soft_pity    BOOLEAN;
  v_was_guaranteed   BOOLEAN;
  v_has_uncommon_plus BOOLEAN := false;
  v_i                INTEGER;
  -- Rate tiers (base rates from spec §3)
  v_rate_common      DOUBLE PRECISION := 0.55;
  v_rate_uncommon    DOUBLE PRECISION := 0.28;
  v_rate_rare        DOUBLE PRECISION := 0.12;
  v_rate_epic        DOUBLE PRECISION := 0.035;
  v_rate_legendary   DOUBLE PRECISION := 0.015;
  -- Pity-adjusted rates
  v_adj_legendary    DOUBLE PRECISION;
  v_adj_epic         DOUBLE PRECISION;
  v_threshold        DOUBLE PRECISION;
  v_rarity_pick      item_rarity;
  v_per_pull_cost    INTEGER;
BEGIN
  -- Identify caller
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate pull count
  IF p_pull_count NOT IN (1, 10) THEN
    RAISE EXCEPTION 'pull_count must be 1 or 10';
  END IF;

  -- ── Validate banner ──────────────────────────
  SELECT * INTO v_banner
  FROM public.gacha_banners
  WHERE id = p_banner_id;

  IF v_banner.id IS NULL THEN
    RAISE EXCEPTION 'Banner not found';
  END IF;

  IF v_banner.status <> 'active' THEN
    RAISE EXCEPTION 'Banner not active';
  END IF;

  IF v_banner.banner_type IN ('limited', 'themed') THEN
    IF v_banner.starts_at IS NOT NULL AND now() < v_banner.starts_at THEN
      RAISE EXCEPTION 'Banner not yet started';
    END IF;
    IF v_banner.ends_at IS NOT NULL AND now() > v_banner.ends_at THEN
      RAISE EXCEPTION 'Banner has expired';
    END IF;
  END IF;

  -- ── Calculate cost ───────────────────────────
  IF p_pull_count = 10 THEN
    v_cost := v_banner.ten_pull_cost;
  ELSE
    v_cost := v_banner.pull_cost_fragments;
  END IF;
  v_per_pull_cost := v_cost / p_pull_count;

  -- ── Lock wallet & check balance ──────────────
  SELECT * INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet.user_id IS NULL THEN
    -- Auto-create wallet
    INSERT INTO public.user_wallets (user_id, fragments, credits)
    VALUES (v_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  IF v_wallet.fragments < v_cost THEN
    RAISE EXCEPTION 'Insufficient fragments: have %, need %', v_wallet.fragments, v_cost;
  END IF;

  -- ── Get/create seed ──────────────────────────
  v_seed := public.ensure_gacha_seed(v_user_id);
  v_nonce := v_seed.nonce;

  -- ── Get/create pity ──────────────────────────
  SELECT * INTO v_pity
  FROM public.user_pity
  WHERE user_id = v_user_id AND banner_id = p_banner_id
  FOR UPDATE;

  IF v_pity.user_id IS NULL THEN
    INSERT INTO public.user_pity (user_id, banner_id, pull_count, guaranteed_next)
    VALUES (v_user_id, p_banner_id, 0, false)
    RETURNING * INTO v_pity;
  END IF;

  v_pity_count := v_pity.pull_count;
  v_guaranteed_next := v_pity.guaranteed_next;

  -- ── Pull loop ────────────────────────────────
  FOR v_i IN 1..p_pull_count LOOP
    v_nonce := v_nonce + 1;
    v_pity_count := v_pity_count + 1;
    v_was_pity := false;
    v_was_soft_pity := false;
    v_was_guaranteed := false;

    -- Generate random float
    v_roll := public.hmac_to_float(v_seed.server_seed, v_seed.client_seed, v_nonce, 0);

    -- ── Pity-adjusted rates ──────────────────
    v_adj_legendary := v_rate_legendary;
    v_adj_epic := v_rate_epic;

    -- Legendary soft pity: linear ramp from soft_pity_start to pity_threshold
    IF v_pity_count >= v_banner.pity_threshold THEN
      -- Hard pity: guaranteed legendary
      v_adj_legendary := 1.0;
      v_was_pity := true;
    ELSIF v_pity_count >= v_banner.soft_pity_start THEN
      -- Soft pity: linear ramp
      v_adj_legendary := v_rate_legendary +
        (v_pity_count - v_banner.soft_pity_start)::double precision /
        (v_banner.pity_threshold - v_banner.soft_pity_start)::double precision *
        (1.0 - v_rate_legendary);
      v_was_soft_pity := true;
    END IF;

    -- ── Rarity selection via weighted thresholds ─
    -- Order: legendary first (so pity boosting works correctly)
    v_threshold := 0.0;

    v_threshold := v_threshold + v_adj_legendary;
    IF v_roll < v_threshold THEN
      v_rarity_pick := 'legendary';
    ELSE
      v_threshold := v_threshold + v_adj_epic;
      IF v_roll < v_threshold THEN
        v_rarity_pick := 'epic';
      ELSE
        v_threshold := v_threshold + v_rate_rare;
        IF v_roll < v_threshold THEN
          v_rarity_pick := 'rare';
        ELSE
          v_threshold := v_threshold + v_rate_uncommon;
          IF v_roll < v_threshold THEN
            v_rarity_pick := 'uncommon';
          ELSE
            v_rarity_pick := 'common';
          END IF;
        END IF;
      END IF;
    END IF;

    -- ── 10-pull guarantee: last pull must be uncommon+ if none so far ─
    IF p_pull_count = 10 AND v_i = 10 AND NOT v_has_uncommon_plus AND v_rarity_pick = 'common' THEN
      v_rarity_pick := 'uncommon';
    END IF;

    -- Track if we got uncommon+ for 10-pull guarantee
    IF v_rarity_pick <> 'common' THEN
      v_has_uncommon_plus := true;
    END IF;

    -- ── 50/50 for limited banners with rate-up items ─
    IF v_rarity_pick = 'legendary'
       AND v_banner.banner_type = 'limited'
       AND array_length(v_banner.rate_up_item_ids, 1) > 0
    THEN
      IF v_guaranteed_next THEN
        -- Won the 50/50 last time or this is guaranteed featured
        v_was_guaranteed := true;
        v_guaranteed_next := false;
      ELSE
        -- 50/50 roll using a second cursor
        IF public.hmac_to_float(v_seed.server_seed, v_seed.client_seed, v_nonce, 1) >= 0.5 THEN
          -- Lost the 50/50 → next legendary is guaranteed featured
          v_guaranteed_next := true;
        END IF;
        -- If won (< 0.5), guaranteed_next stays false
      END IF;
    END IF;

    -- ── Select specific item from the banner pool ─
    -- If guaranteed or won 50/50 on limited banner, pick from rate_up items
    IF v_rarity_pick = 'legendary'
       AND v_banner.banner_type = 'limited'
       AND array_length(v_banner.rate_up_item_ids, 1) > 0
       AND (v_was_guaranteed OR NOT v_guaranteed_next)
       -- v_was_guaranteed means forced featured; NOT v_guaranteed_next means we won 50/50
    THEN
      -- Deterministic selection among rate-up items using HMAC
      SELECT gi.id AS item_id, gi.name, gi.slug, gi.rarity, gi.category, gi.bind_type, gi.icon_url, gi.properties
      INTO v_selected_item
      FROM public.gacha_items gi
      WHERE gi.id = ANY(v_banner.rate_up_item_ids)
        AND gi.rarity = v_rarity_pick
        AND gi.is_active = true
      ORDER BY public.hmac_to_float(v_seed.server_seed, gi.id::text, v_nonce, 2)
      LIMIT 1;
    END IF;

    -- Fallback: weighted random from general pool via cumulative weight + HMAC
    IF v_selected_item IS NULL OR v_selected_item.item_id IS NULL THEN
      WITH pool AS (
        SELECT gi.id AS item_id, gi.name, gi.slug, gi.rarity, gi.category,
               gi.bind_type, gi.icon_url, gi.properties,
               COALESCE(gbi.weight_override, gi.base_weight) AS w,
               SUM(COALESCE(gbi.weight_override, gi.base_weight))
                 OVER (ORDER BY gi.id) AS cum_w,
               SUM(COALESCE(gbi.weight_override, gi.base_weight))
                 OVER () AS total_w
        FROM public.gacha_banner_items gbi
        JOIN public.gacha_items gi ON gi.id = gbi.item_id
        WHERE gbi.banner_id = p_banner_id
          AND gi.rarity = v_rarity_pick
          AND gi.is_active = true
      )
      SELECT item_id, name, slug, rarity, category, bind_type, icon_url, properties
      INTO v_selected_item
      FROM pool
      WHERE cum_w > public.hmac_to_float(v_seed.server_seed, v_seed.client_seed, v_nonce, 3) * total_w
      ORDER BY cum_w
      LIMIT 1;
    END IF;

    -- Safety: if no item found for this rarity (e.g. empty pool), pick any from banner
    IF v_selected_item IS NULL OR v_selected_item.item_id IS NULL THEN
      SELECT gi.id AS item_id, gi.name, gi.slug, gi.rarity, gi.category, gi.bind_type, gi.icon_url, gi.properties
      INTO v_selected_item
      FROM public.gacha_banner_items gbi
      JOIN public.gacha_items gi ON gi.id = gbi.item_id
      WHERE gbi.banner_id = p_banner_id
        AND gi.is_active = true
      ORDER BY public.hmac_to_float(v_seed.server_seed, gi.id::text, v_nonce, 4)
      LIMIT 1;
    END IF;

    -- ── Pity bookkeeping ─────────────────────
    IF v_rarity_pick = 'legendary' THEN
      v_pity_count := 0; -- Reset pity on legendary pull
    END IF;

    -- ── Insert pull history ──────────────────
    v_pull_id := gen_random_uuid();

    INSERT INTO public.pull_history (
      id, user_id, banner_id, item_id, rarity,
      pity_count_at, was_pity, was_soft_pity, was_guaranteed,
      fragments_spent, server_seed_hash, nonce
    ) VALUES (
      v_pull_id, v_user_id, p_banner_id, v_selected_item.item_id, v_selected_item.rarity,
      v_pity_count, v_was_pity, v_was_soft_pity, v_was_guaranteed,
      v_per_pull_cost, v_seed.server_seed_hash, v_nonce
    );

    -- ── Insert inventory ─────────────────────
    INSERT INTO public.user_inventory (user_id, item_id, obtained_via, source_pull_id)
    VALUES (v_user_id, v_selected_item.item_id, 'gacha_pull', v_pull_id);

    -- ── Accumulate result ────────────────────
    v_results := v_results || jsonb_build_object(
      'pull_id',       v_pull_id,
      'item_id',       v_selected_item.item_id,
      'name',          v_selected_item.name,
      'slug',          v_selected_item.slug,
      'rarity',        v_selected_item.rarity,
      'category',      v_selected_item.category,
      'bind_type',     v_selected_item.bind_type,
      'icon_url',      v_selected_item.icon_url,
      'properties',    v_selected_item.properties,
      'was_pity',      v_was_pity,
      'was_soft_pity', v_was_soft_pity,
      'was_guaranteed', v_was_guaranteed,
      'pity_count',    v_pity_count,
      'nonce',         v_nonce
    );

    -- Reset v_selected_item for next iteration
    v_selected_item := NULL;
  END LOOP;

  -- ── Deduct fragments ─────────────────────────
  UPDATE public.user_wallets
  SET fragments = fragments - v_cost
  WHERE user_id = v_user_id;

  -- ── Log currency transaction ─────────────────
  INSERT INTO public.currency_transactions (
    user_id, currency, amount, tx_type, reference_id, description, balance_after
  ) VALUES (
    v_user_id, 'fragments', -v_cost, 'pull_spend', p_banner_id,
    p_pull_count || '-pull on ' || v_banner.name,
    v_wallet.fragments - v_cost
  );

  -- ── Update pity state ────────────────────────
  UPDATE public.user_pity
  SET pull_count = v_pity_count,
      guaranteed_next = v_guaranteed_next,
      last_pull_at = now()
  WHERE user_id = v_user_id AND banner_id = p_banner_id;

  -- ── Update seed nonce ────────────────────────
  UPDATE public.gacha_seeds
  SET nonce = v_nonce
  WHERE id = v_seed.id;

  -- ── Return results ───────────────────────────
  RETURN jsonb_build_object(
    'results',             v_results,
    'fragments_spent',     v_cost,
    'fragments_remaining', v_wallet.fragments - v_cost,
    'pity_count',          v_pity_count,
    'pull_count',          p_pull_count
  );
END;
$$;

COMMENT ON FUNCTION public.perform_gacha_pull IS 'Atomic gacha pull: validates banner, deducts fragments, weighted random with pity system, provably fair HMAC-SHA256';

-- =============================================
-- FUNCTION: perform_fusion
-- Fuse 3 same-rarity items into 1 higher-rarity item.
-- =============================================

CREATE OR REPLACE FUNCTION public.perform_fusion(p_inventory_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id       UUID;
  v_input_rarity  item_rarity;
  v_output_rarity item_rarity;
  v_rarity_int    INTEGER;
  v_output_item   RECORD;
  v_inv_row       RECORD;
  v_count         INTEGER;
  v_output_inv_id UUID;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate array length
  IF array_length(p_inventory_ids, 1) IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'Exactly 3 inventory items required for fusion';
  END IF;

  -- Validate all items belong to user, same rarity, not locked, not legendary
  v_count := 0;
  v_input_rarity := NULL;

  FOR v_inv_row IN
    SELECT ui.id, ui.user_id, ui.item_id, ui.is_locked, gi.rarity
    FROM public.user_inventory ui
    JOIN public.gacha_items gi ON gi.id = ui.item_id
    WHERE ui.id = ANY(p_inventory_ids)
    FOR UPDATE OF ui
  LOOP
    v_count := v_count + 1;

    IF v_inv_row.user_id <> v_user_id THEN
      RAISE EXCEPTION 'Item not owned: %', v_inv_row.id;
    END IF;

    IF v_inv_row.is_locked THEN
      RAISE EXCEPTION 'Item is locked: %', v_inv_row.id;
    END IF;

    IF v_inv_row.rarity = 'legendary' THEN
      RAISE EXCEPTION 'Legendary items cannot be fused';
    END IF;

    IF v_input_rarity IS NULL THEN
      v_input_rarity := v_inv_row.rarity;
    ELSIF v_inv_row.rarity <> v_input_rarity THEN
      RAISE EXCEPTION 'Items must be same rarity: expected %, got %', v_input_rarity, v_inv_row.rarity;
    END IF;
  END LOOP;

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Not all inventory items found: expected 3, found %', v_count;
  END IF;

  -- Determine output rarity (one tier up)
  v_rarity_int := public.rarity_to_int(v_input_rarity);
  v_output_rarity := public.int_to_rarity(v_rarity_int + 1);

  -- Select random item of the output rarity
  SELECT gi.id AS item_id, gi.name, gi.slug, gi.rarity, gi.category, gi.bind_type, gi.icon_url, gi.properties
  INTO v_output_item
  FROM public.gacha_items gi
  WHERE gi.rarity = v_output_rarity
    AND gi.is_active = true
  ORDER BY random()
  LIMIT 1;

  IF v_output_item IS NULL OR v_output_item.item_id IS NULL THEN
    RAISE EXCEPTION 'No active items available for rarity %', v_output_rarity;
  END IF;

  -- Delete the 3 input items from inventory
  DELETE FROM public.user_inventory
  WHERE id = ANY(p_inventory_ids);

  -- Insert the new item
  INSERT INTO public.user_inventory (user_id, item_id, obtained_via)
  VALUES (v_user_id, v_output_item.item_id, 'fusion')
  RETURNING id INTO v_output_inv_id;

  -- Log in fusion_history
  INSERT INTO public.fusion_history (user_id, input_item_ids, output_item_id, input_rarity, output_rarity)
  VALUES (v_user_id, p_inventory_ids, v_output_item.item_id, v_input_rarity, v_output_rarity);

  RETURN jsonb_build_object(
    'inventory_id', v_output_inv_id,
    'item_id',      v_output_item.item_id,
    'name',         v_output_item.name,
    'slug',         v_output_item.slug,
    'rarity',       v_output_item.rarity::text,
    'category',     v_output_item.category,
    'bind_type',    v_output_item.bind_type::text,
    'icon_url',     v_output_item.icon_url,
    'properties',   v_output_item.properties,
    'input_rarity', v_input_rarity::text,
    'items_consumed', 3
  );
END;
$$;

COMMENT ON FUNCTION public.perform_fusion IS 'Fuse 3 same-rarity items → 1 higher-rarity item. Validates ownership, rarity match, not locked, not legendary.';

-- =============================================
-- FUNCTION: recycle_item
-- Destroy an item for credits.
-- =============================================

CREATE OR REPLACE FUNCTION public.recycle_item(p_inventory_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id       UUID;
  v_inv_row       RECORD;
  v_credits       INTEGER;
  v_new_balance   INTEGER;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock and validate the inventory item
  SELECT ui.id, ui.user_id, ui.item_id, ui.is_locked, gi.rarity, gi.name, gi.slug
  INTO v_inv_row
  FROM public.user_inventory ui
  JOIN public.gacha_items gi ON gi.id = ui.item_id
  WHERE ui.id = p_inventory_id
  FOR UPDATE OF ui;

  IF v_inv_row IS NULL OR v_inv_row.id IS NULL THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  IF v_inv_row.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Item not owned';
  END IF;

  IF v_inv_row.is_locked THEN
    RAISE EXCEPTION 'Item is locked and cannot be recycled';
  END IF;

  -- Lookup recycle credits by rarity (hardcoded per spec §6.2)
  v_credits := CASE v_inv_row.rarity
    WHEN 'common'    THEN 10
    WHEN 'uncommon'  THEN 30
    WHEN 'rare'      THEN 100
    WHEN 'epic'      THEN 300
    WHEN 'legendary' THEN 1000
  END;

  -- Delete the item
  DELETE FROM public.user_inventory WHERE id = p_inventory_id;

  -- Credit the user's wallet
  UPDATE public.user_wallets
  SET credits = credits + v_credits
  WHERE user_id = v_user_id
  RETURNING credits INTO v_new_balance;

  -- Auto-create wallet if not exists
  IF NOT FOUND THEN
    INSERT INTO public.user_wallets (user_id, fragments, credits)
    VALUES (v_user_id, 0, v_credits)
    RETURNING credits INTO v_new_balance;
  END IF;

  -- Log currency transaction
  INSERT INTO public.currency_transactions (
    user_id, currency, amount, tx_type, reference_id, description, balance_after
  ) VALUES (
    v_user_id, 'credits', v_credits, 'fusion_cost', p_inventory_id,
    'Recycled ' || v_inv_row.name || ' (' || v_inv_row.rarity || ')',
    v_new_balance
  );

  RETURN jsonb_build_object(
    'credits_gained', v_credits,
    'credits_balance', v_new_balance,
    'item_name',       v_inv_row.name,
    'item_rarity',     v_inv_row.rarity::text
  );
END;
$$;

COMMENT ON FUNCTION public.recycle_item IS 'Destroy an inventory item and receive credits based on rarity. Validates ownership and lock status.';

-- =============================================
-- FUNCTION: perform_marketplace_purchase
-- Atomic marketplace buy: lock listing + wallets, transfer item + credits.
-- =============================================

CREATE OR REPLACE FUNCTION public.perform_marketplace_purchase(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_buyer_id       UUID;
  v_listing        public.gacha_marketplace_listings;
  v_item           public.gacha_items;
  v_buyer_wallet   public.user_wallets;
  v_seller_wallet  public.user_wallets;
  v_tax            INTEGER;
  v_seller_receives INTEGER;
  v_buyer_balance  INTEGER;
  v_seller_balance INTEGER;
BEGIN
  v_buyer_id := (SELECT auth.uid());
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── Lock listing ─────────────────────────────
  SELECT * INTO v_listing
  FROM public.gacha_marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.status <> 'active' THEN
    RAISE EXCEPTION 'Listing is not active (status: %)', v_listing.status;
  END IF;

  IF v_listing.expires_at < now() THEN
    -- Auto-expire
    UPDATE public.gacha_marketplace_listings
    SET status = 'expired'
    WHERE id = p_listing_id;
    RAISE EXCEPTION 'Listing has expired';
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'Cannot buy your own listing';
  END IF;

  -- Get item info for response
  SELECT * INTO v_item
  FROM public.gacha_items
  WHERE id = v_listing.item_id;

  -- ── Lock wallets (consistent order by user_id to prevent deadlocks) ─
  IF v_buyer_id < v_listing.seller_id THEN
    SELECT * INTO v_buyer_wallet  FROM public.user_wallets WHERE user_id = v_buyer_id FOR UPDATE;
    SELECT * INTO v_seller_wallet FROM public.user_wallets WHERE user_id = v_listing.seller_id FOR UPDATE;
  ELSE
    SELECT * INTO v_seller_wallet FROM public.user_wallets WHERE user_id = v_listing.seller_id FOR UPDATE;
    SELECT * INTO v_buyer_wallet  FROM public.user_wallets WHERE user_id = v_buyer_id FOR UPDATE;
  END IF;

  -- Auto-create buyer wallet if needed
  IF v_buyer_wallet.user_id IS NULL THEN
    INSERT INTO public.user_wallets (user_id, fragments, credits)
    VALUES (v_buyer_id, 0, 0)
    RETURNING * INTO v_buyer_wallet;
  END IF;

  -- Auto-create seller wallet if needed
  IF v_seller_wallet.user_id IS NULL THEN
    INSERT INTO public.user_wallets (user_id, fragments, credits)
    VALUES (v_listing.seller_id, 0, 0)
    RETURNING * INTO v_seller_wallet;
  END IF;

  -- ── Check buyer balance ──────────────────────
  IF v_buyer_wallet.credits < v_listing.price_credits THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_buyer_wallet.credits, v_listing.price_credits;
  END IF;

  -- ── Calculate tax ────────────────────────────
  v_tax := floor(v_listing.price_credits * 0.10);
  v_seller_receives := v_listing.price_credits - v_tax;

  -- ── Transfer credits ─────────────────────────
  v_buyer_balance := v_buyer_wallet.credits - v_listing.price_credits;
  v_seller_balance := v_seller_wallet.credits + v_seller_receives;

  UPDATE public.user_wallets
  SET credits = v_buyer_balance
  WHERE user_id = v_buyer_id;

  UPDATE public.user_wallets
  SET credits = v_seller_balance
  WHERE user_id = v_listing.seller_id;

  -- ── Transfer item ────────────────────────────
  UPDATE public.user_inventory
  SET user_id = v_buyer_id, is_locked = false
  WHERE id = v_listing.inventory_id;

  -- ── Update listing ───────────────────────────
  UPDATE public.gacha_marketplace_listings
  SET status = 'sold',
      buyer_id = v_buyer_id,
      sold_at = now()
  WHERE id = p_listing_id;

  -- ── Log currency transactions ────────────────
  -- Buyer debit
  INSERT INTO public.currency_transactions (
    user_id, currency, amount, tx_type, reference_id, description, balance_after
  ) VALUES (
    v_buyer_id, 'credits', -v_listing.price_credits, 'marketplace_purchase', p_listing_id,
    'Purchased ' || v_item.name || ' from marketplace',
    v_buyer_balance
  );

  -- Seller credit
  INSERT INTO public.currency_transactions (
    user_id, currency, amount, tx_type, reference_id, description, balance_after
  ) VALUES (
    v_listing.seller_id, 'credits', v_seller_receives, 'marketplace_sale', p_listing_id,
    'Sold ' || v_item.name || ' on marketplace (10% tax: ' || v_tax || ')',
    v_seller_balance
  );

  RETURN jsonb_build_object(
    'listing_id',       p_listing_id,
    'item_id',          v_listing.item_id,
    'item_name',        v_item.name,
    'item_rarity',      v_item.rarity::text,
    'price_paid',       v_listing.price_credits,
    'tax',              v_tax,
    'seller_received',  v_seller_receives,
    'buyer_balance',    v_buyer_balance,
    'seller_balance',   v_seller_balance
  );
END;
$$;

COMMENT ON FUNCTION public.perform_marketplace_purchase IS 'Atomic marketplace buy: locks listing + wallets, transfers credits (10% tax) and item ownership.';

-- =============================================
-- FUNCTION: rotate_server_seed
-- Rotate the provably fair server seed for a user.
-- Reveals the old seed and creates a new one.
-- =============================================

CREATE OR REPLACE FUNCTION public.rotate_server_seed()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id        UUID;
  v_old_seed       public.gacha_seeds;
  v_new_server     TEXT;
  v_new_hash       TEXT;
  v_new_seed       public.gacha_seeds;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Deactivate current seed and reveal server_seed
  UPDATE public.gacha_seeds
  SET is_active = false, revealed_at = now()
  WHERE user_id = v_user_id AND is_active = true
  RETURNING * INTO v_old_seed;

  -- Generate new seed pair
  v_new_server := encode(extensions.gen_random_bytes(32), 'hex');
  v_new_hash := encode(extensions.digest(v_new_server::bytea, 'sha256'), 'hex');

  INSERT INTO public.gacha_seeds (user_id, server_seed, server_seed_hash, client_seed, nonce, is_active)
  VALUES (
    v_user_id,
    v_new_server,
    v_new_hash,
    COALESCE(v_old_seed.client_seed, encode(extensions.gen_random_bytes(16), 'hex')),
    0,
    true
  )
  RETURNING * INTO v_new_seed;

  RETURN jsonb_build_object(
    'new_seed_hash',      v_new_hash,
    'old_server_seed',    v_old_seed.server_seed,
    'old_seed_hash',      v_old_seed.server_seed_hash,
    'old_nonce',          v_old_seed.nonce,
    'client_seed',        v_new_seed.client_seed
  );
END;
$$;

COMMENT ON FUNCTION public.rotate_server_seed IS 'Rotate provably fair seed: reveals old server_seed for verification, creates new pair.';

-- =============================================
-- REVOKE: Only authenticated users can call RPCs
-- =============================================

REVOKE EXECUTE ON FUNCTION public.hmac_to_float(TEXT, TEXT, BIGINT, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_gacha_seed(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rarity_to_int(item_rarity) FROM anon;
REVOKE EXECUTE ON FUNCTION public.int_to_rarity(INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.perform_gacha_pull(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.perform_fusion(UUID[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recycle_item(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.perform_marketplace_purchase(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rotate_server_seed() FROM anon;
