-- =============================================
-- Migration 00013: Gacha System — Schema + RLS + Seed
-- AutomatikLabs — EPIC-18 Story 18.1
-- Depends: 00001 (core_users, pgcrypto), 00007 (gamification)
-- =============================================

-- =============================================
-- ENUMS (7)
-- =============================================

CREATE TYPE item_rarity AS ENUM (
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary'
);

CREATE TYPE item_bind_type AS ENUM (
  'soulbound',
  'tradeable'
);

CREATE TYPE banner_type AS ENUM (
  'permanent',
  'limited',
  'themed'
);

CREATE TYPE banner_status AS ENUM (
  'draft',
  'active',
  'expired'
);

CREATE TYPE currency_type AS ENUM (
  'fragments',
  'credits'
);

CREATE TYPE currency_tx_type AS ENUM (
  'pull_spend',
  'marketplace_purchase',
  'marketplace_sale',
  'fusion_cost',
  'reward',
  'admin_grant',
  'admin_deduct',
  'xp_conversion',
  'duplicate_refund'
);

CREATE TYPE listing_status AS ENUM (
  'active',
  'sold',
  'cancelled',
  'expired'
);

-- =============================================
-- INTEGRATION: Extend EPIC-07 gamification types
-- =============================================

ALTER TYPE xp_source_type ADD VALUE IF NOT EXISTS 'gacha_duplicate';

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS fragment_reward INTEGER NOT NULL DEFAULT 0;

-- =============================================
-- TABLE: gacha_items — Item catalog
-- =============================================

CREATE TABLE public.gacha_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  rarity        item_rarity NOT NULL,
  bind_type     item_bind_type NOT NULL,
  base_weight   INTEGER NOT NULL,
  properties    JSONB NOT NULL DEFAULT '{}',
  icon_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT gacha_items_slug_unique UNIQUE (slug),
  CONSTRAINT gacha_items_weight_positive CHECK (base_weight > 0)
);

CREATE INDEX idx_gacha_items_rarity ON public.gacha_items (rarity);
CREATE INDEX idx_gacha_items_category ON public.gacha_items (category);
CREATE INDEX idx_gacha_items_active ON public.gacha_items (is_active) WHERE is_active = true;

COMMENT ON TABLE public.gacha_items IS 'Catalog of all gacha items with rarity, category, and binding rules';

-- =============================================
-- TABLE: gacha_banners — Banner configuration
-- =============================================

CREATE TABLE public.gacha_banners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL,
  banner_type           banner_type NOT NULL,
  status                banner_status NOT NULL DEFAULT 'draft',
  description           TEXT,
  image_url             TEXT,
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  pity_threshold        INTEGER NOT NULL DEFAULT 80,
  soft_pity_start       INTEGER NOT NULL DEFAULT 60,
  rate_up_item_ids      UUID[] NOT NULL DEFAULT '{}',
  pull_cost_fragments   INTEGER NOT NULL DEFAULT 100,
  ten_pull_cost         INTEGER NOT NULL DEFAULT 900,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT gacha_banners_slug_unique UNIQUE (slug),
  CONSTRAINT gacha_banners_dates_valid CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT gacha_banners_pity_valid CHECK (soft_pity_start < pity_threshold),
  CONSTRAINT gacha_banners_cost_positive CHECK (pull_cost_fragments > 0 AND ten_pull_cost > 0)
);

CREATE INDEX idx_gacha_banners_status ON public.gacha_banners (status);
CREATE INDEX idx_gacha_banners_active ON public.gacha_banners (status, starts_at, ends_at) WHERE status = 'active';

COMMENT ON TABLE public.gacha_banners IS 'Banner configurations: permanent, limited, or themed with pity thresholds';

-- =============================================
-- TABLE: gacha_banner_items — M:N pool
-- =============================================

CREATE TABLE public.gacha_banner_items (
  banner_id       UUID NOT NULL REFERENCES public.gacha_banners(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES public.gacha_items(id) ON DELETE CASCADE,
  weight_override INTEGER,
  is_rate_up      BOOLEAN NOT NULL DEFAULT false,

  PRIMARY KEY (banner_id, item_id),
  CONSTRAINT gacha_banner_items_weight_positive CHECK (weight_override IS NULL OR weight_override > 0)
);

CREATE INDEX idx_gacha_banner_items_item ON public.gacha_banner_items (item_id);

COMMENT ON TABLE public.gacha_banner_items IS 'M:N association between banners and their item pools with optional weight overrides';

-- =============================================
-- TABLE: user_wallets — Currency balances
-- =============================================

CREATE TABLE public.user_wallets (
  user_id     UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  fragments   INTEGER NOT NULL DEFAULT 0,
  credits     INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_wallets_fragments_non_negative CHECK (fragments >= 0),
  CONSTRAINT user_wallets_credits_non_negative CHECK (credits >= 0)
);

COMMENT ON TABLE public.user_wallets IS 'User currency balances: fragments (pull currency) and credits (marketplace currency)';

-- =============================================
-- TABLE: user_inventory — Item instances per user
-- =============================================

CREATE TABLE public.user_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES public.gacha_items(id) ON DELETE RESTRICT,
  obtained_via    TEXT NOT NULL,
  is_locked       BOOLEAN NOT NULL DEFAULT false,
  source_pull_id  UUID,
  obtained_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_inventory_user ON public.user_inventory (user_id);
CREATE INDEX idx_user_inventory_user_item ON public.user_inventory (user_id, item_id);
CREATE INDEX idx_user_inventory_item ON public.user_inventory (item_id);

COMMENT ON TABLE public.user_inventory IS 'One row per item instance owned by a user. source_pull_id links to pull_history';

-- =============================================
-- TABLE: user_pity — Pity state per user per banner
-- =============================================

CREATE TABLE public.user_pity (
  user_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  banner_id        UUID NOT NULL REFERENCES public.gacha_banners(id) ON DELETE CASCADE,
  pull_count       INTEGER NOT NULL DEFAULT 0,
  guaranteed_next  BOOLEAN NOT NULL DEFAULT false,
  last_pull_at     TIMESTAMPTZ,

  PRIMARY KEY (user_id, banner_id),
  CONSTRAINT user_pity_count_non_negative CHECK (pull_count >= 0)
);

COMMENT ON TABLE public.user_pity IS 'Tracks pity counter and 50/50 guarantee state per user per banner';

-- =============================================
-- TABLE: pull_history — Immutable audit log
-- =============================================

CREATE TABLE public.pull_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  banner_id         UUID NOT NULL REFERENCES public.gacha_banners(id) ON DELETE RESTRICT,
  item_id           UUID NOT NULL REFERENCES public.gacha_items(id) ON DELETE RESTRICT,
  rarity            item_rarity NOT NULL,
  pity_count_at     INTEGER NOT NULL,
  was_pity          BOOLEAN NOT NULL DEFAULT false,
  was_soft_pity     BOOLEAN NOT NULL DEFAULT false,
  was_guaranteed    BOOLEAN NOT NULL DEFAULT false,
  fragments_spent   INTEGER NOT NULL,
  server_seed_hash  TEXT NOT NULL,
  nonce             BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pull_history_user_date ON public.pull_history (user_id, created_at DESC);
CREATE INDEX idx_pull_history_banner ON public.pull_history (banner_id);
CREATE INDEX idx_pull_history_user_banner ON public.pull_history (user_id, banner_id);

COMMENT ON TABLE public.pull_history IS 'Immutable audit log of all gacha pulls. Append-only — no UPDATE or DELETE allowed';

-- =============================================
-- TABLE: gacha_seeds — Provably fair seed management
-- =============================================

CREATE TABLE public.gacha_seeds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  server_seed       TEXT NOT NULL,
  server_seed_hash  TEXT NOT NULL,
  client_seed       TEXT NOT NULL,
  nonce             BIGINT NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at       TIMESTAMPTZ
);

-- Only one active seed per user at any time
CREATE UNIQUE INDEX idx_gacha_seeds_user_active ON public.gacha_seeds (user_id) WHERE is_active = true;
CREATE INDEX idx_gacha_seeds_user ON public.gacha_seeds (user_id);

COMMENT ON TABLE public.gacha_seeds IS 'Provably fair seed pairs. Partial unique index ensures max 1 active seed per user';

-- =============================================
-- TABLE: currency_transactions — Immutable financial log
-- =============================================

CREATE TABLE public.currency_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  currency      currency_type NOT NULL,
  amount        INTEGER NOT NULL,
  tx_type       currency_tx_type NOT NULL,
  reference_id  UUID,
  description   TEXT,
  balance_after INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT currency_tx_balance_non_negative CHECK (balance_after >= 0)
);

CREATE INDEX idx_currency_tx_user_date ON public.currency_transactions (user_id, created_at DESC);
CREATE INDEX idx_currency_tx_type ON public.currency_transactions (tx_type);
CREATE INDEX idx_currency_tx_ref ON public.currency_transactions (reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE public.currency_transactions IS 'Immutable financial log for all currency movements. Append-only';

-- =============================================
-- TABLE: fusion_history — Fusion audit log
-- =============================================

CREATE TABLE public.fusion_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  input_item_ids  UUID[] NOT NULL,
  output_item_id  UUID NOT NULL,
  input_rarity    item_rarity NOT NULL,
  output_rarity   item_rarity NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fusion_history_input_count CHECK (array_length(input_item_ids, 1) = 3)
);

CREATE INDEX idx_fusion_history_user ON public.fusion_history (user_id);

COMMENT ON TABLE public.fusion_history IS 'Audit log of item fusions (3 same-rarity → 1 higher-rarity)';

-- =============================================
-- TABLE: gacha_marketplace_listings — Item trading
-- =============================================

CREATE TABLE public.gacha_marketplace_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  inventory_id    UUID NOT NULL REFERENCES public.user_inventory(id) ON DELETE RESTRICT,
  item_id         UUID NOT NULL REFERENCES public.gacha_items(id) ON DELETE RESTRICT,
  price_credits   INTEGER NOT NULL,
  status          listing_status NOT NULL DEFAULT 'active',
  buyer_id        UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  listed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sold_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,

  CONSTRAINT gacha_marketplace_price_positive CHECK (price_credits > 0),
  CONSTRAINT gacha_marketplace_inventory_unique UNIQUE (inventory_id)
);

CREATE INDEX idx_gacha_marketplace_status ON public.gacha_marketplace_listings (status, expires_at) WHERE status = 'active';
CREATE INDEX idx_gacha_marketplace_seller ON public.gacha_marketplace_listings (seller_id);
CREATE INDEX idx_gacha_marketplace_item ON public.gacha_marketplace_listings (item_id) WHERE status = 'active';

COMMENT ON TABLE public.gacha_marketplace_listings IS 'Marketplace listings for tradeable gacha items. 7-day expiry, 10% tax on sales';

-- =============================================
-- TABLE: gacha_rarity_price_config — Price floors/ceilings
-- =============================================

CREATE TABLE public.gacha_rarity_price_config (
  rarity        item_rarity PRIMARY KEY,
  price_floor   INTEGER NOT NULL,
  price_ceiling INTEGER NOT NULL,

  CONSTRAINT gacha_price_floor_positive CHECK (price_floor > 0),
  CONSTRAINT gacha_price_ceiling_valid CHECK (price_ceiling > price_floor)
);

COMMENT ON TABLE public.gacha_rarity_price_config IS 'Price floor/ceiling config per rarity for marketplace listings';

-- =============================================
-- TRIGGER: updated_at auto-update
-- =============================================

CREATE OR REPLACE FUNCTION public.gacha_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER gacha_items_updated_at
  BEFORE UPDATE ON public.gacha_items
  FOR EACH ROW EXECUTE FUNCTION public.gacha_set_updated_at();

CREATE TRIGGER gacha_banners_updated_at
  BEFORE UPDATE ON public.gacha_banners
  FOR EACH ROW EXECUTE FUNCTION public.gacha_set_updated_at();

CREATE TRIGGER user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.gacha_set_updated_at();

-- =============================================
-- RLS: Enable on all tables
-- =============================================

ALTER TABLE public.gacha_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_banner_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pull_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fusion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_rarity_price_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS: gacha_items (public catalog, admin-managed)
-- =============================================

CREATE POLICY gacha_items_select ON public.gacha_items
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (is_active = true OR public.has_role('admin'))
  );

CREATE POLICY gacha_items_insert ON public.gacha_items
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY gacha_items_update ON public.gacha_items
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY gacha_items_delete ON public.gacha_items
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: gacha_banners (active banners public, admin-managed)
-- =============================================

CREATE POLICY gacha_banners_select ON public.gacha_banners
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (status = 'active' OR public.has_role('admin'))
  );

CREATE POLICY gacha_banners_insert ON public.gacha_banners
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY gacha_banners_update ON public.gacha_banners
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY gacha_banners_delete ON public.gacha_banners
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: gacha_banner_items (read follows banner visibility, admin-managed)
-- =============================================

CREATE POLICY gacha_banner_items_select ON public.gacha_banner_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY gacha_banner_items_insert ON public.gacha_banner_items
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY gacha_banner_items_update ON public.gacha_banner_items
  FOR UPDATE
  USING (public.has_role('admin'));

CREATE POLICY gacha_banner_items_delete ON public.gacha_banner_items
  FOR DELETE
  USING (public.has_role('admin'));

-- =============================================
-- RLS: user_wallets (own data only)
-- =============================================

CREATE POLICY user_wallets_select ON public.user_wallets
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- Insert/update managed by RPC functions (SECURITY DEFINER) only
-- No direct insert/update policies for authenticated users

-- =============================================
-- RLS: user_inventory (own data only)
-- =============================================

CREATE POLICY user_inventory_select ON public.user_inventory
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- Insert/update/delete managed by RPC functions only

-- =============================================
-- RLS: user_pity (own data only)
-- =============================================

CREATE POLICY user_pity_select ON public.user_pity
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- Managed by RPC functions only

-- =============================================
-- RLS: pull_history (own data, APPEND-ONLY)
-- =============================================

CREATE POLICY pull_history_select ON public.pull_history
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- No INSERT policy for authenticated — inserts via SECURITY DEFINER RPCs only
-- No UPDATE or DELETE policies at all — append-only by design

-- =============================================
-- RLS: gacha_seeds (own data only)
-- =============================================

CREATE POLICY gacha_seeds_select ON public.gacha_seeds
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- Users can set their own client_seed
CREATE POLICY gacha_seeds_update_client ON public.gacha_seeds
  FOR UPDATE
  USING (auth.uid() = user_id AND is_active = true)
  WITH CHECK (auth.uid() = user_id AND is_active = true);

-- =============================================
-- RLS: currency_transactions (own data, APPEND-ONLY)
-- =============================================

CREATE POLICY currency_tx_select ON public.currency_transactions
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- No INSERT/UPDATE/DELETE for authenticated — append-only via SECURITY DEFINER RPCs

-- =============================================
-- RLS: fusion_history (own data, read-only)
-- =============================================

CREATE POLICY fusion_history_select ON public.fusion_history
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role('admin'));

-- =============================================
-- RLS: gacha_marketplace_listings (active listings public)
-- =============================================

CREATE POLICY gacha_marketplace_select ON public.gacha_marketplace_listings
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      status = 'active'
      OR seller_id = auth.uid()
      OR buyer_id = auth.uid()
      OR public.has_role('admin')
    )
  );

-- Sellers can list their own tradeable items (via RPC, but policy guards direct access too)
CREATE POLICY gacha_marketplace_insert ON public.gacha_marketplace_listings
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Updates (cancel, purchase) via RPC functions
CREATE POLICY gacha_marketplace_update ON public.gacha_marketplace_listings
  FOR UPDATE
  USING (seller_id = auth.uid() OR public.has_role('admin'));

-- =============================================
-- RLS: gacha_rarity_price_config (public read, admin-managed)
-- =============================================

CREATE POLICY gacha_rarity_price_select ON public.gacha_rarity_price_config
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY gacha_rarity_price_insert ON public.gacha_rarity_price_config
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY gacha_rarity_price_update ON public.gacha_rarity_price_config
  FOR UPDATE
  USING (public.has_role('admin'));

-- =============================================
-- SEED: gacha_rarity_price_config
-- =============================================

INSERT INTO public.gacha_rarity_price_config (rarity, price_floor, price_ceiling) VALUES
  ('common',    10,    100),
  ('uncommon',  50,    500),
  ('rare',      200,   2000),
  ('epic',      1000,  10000),
  ('legendary', 5000,  50000);

-- =============================================
-- SEED: gacha_items — 25 items (5 per category)
-- =============================================

-- Category A: Boosters de Aprendizado (soulbound)
INSERT INTO public.gacha_items (name, slug, description, category, rarity, bind_type, base_weight, properties) VALUES
  ('Poção de Foco',           'pocao-de-foco',           '+5% XP por 24 horas',                                  'booster',   'common',    'soulbound', 550, '{"effect": "xp_boost", "multiplier": 1.05, "duration_hours": 24}'),
  ('Escudo de Streak',        'escudo-de-streak',        'Protege 1 dia de streak contra inatividade',            'booster',   'uncommon',  'soulbound', 280, '{"effect": "streak_shield", "uses": 1}'),
  ('Elixir de XP Dobrado',   'elixir-xp-dobrado',       '+100% XP por 2 horas',                                 'booster',   'rare',      'soulbound', 120, '{"effect": "xp_boost", "multiplier": 2.0, "duration_hours": 2}'),
  ('Passe de Preview',        'passe-de-preview',        'Acesso antecipado ao próximo módulo por 1 semana',      'booster',   'epic',      'soulbound', 35,  '{"effect": "early_access", "duration_days": 7}'),
  ('Token de Mentoria',       'token-de-mentoria',       '30 minutos de mentoria 1-on-1 com instrutor/fundador',  'booster',   'legendary', 'soulbound', 15,  '{"effect": "mentorship", "duration_minutes": 30}');

-- Category B: Cosméticos de Perfil (soulbound)
INSERT INTO public.gacha_items (name, slug, description, category, rarity, bind_type, base_weight, properties) VALUES
  ('Moldura Básica',          'moldura-basica',          'Borda colorida simples para o perfil',                  'cosmetic',  'common',    'soulbound', 550, '{"type": "frame", "style": "basic"}'),
  ('Moldura Animada',         'moldura-animada',         'Animação sutil na borda do perfil',                     'cosmetic',  'uncommon',  'soulbound', 280, '{"type": "frame", "style": "animated"}'),
  ('Título Alquimista',       'titulo-alquimista',       'Título custom: Alquimista de Dados',                    'cosmetic',  'rare',      'soulbound', 120, '{"type": "title", "text": "Alquimista de Dados"}'),
  ('Tema Cyberpunk',          'tema-cyberpunk',          'Visual completo do perfil em estilo cyberpunk',          'cosmetic',  'epic',      'soulbound', 35,  '{"type": "theme", "theme_id": "cyberpunk"}'),
  ('Aura Neon',               'aura-neon',               'Efeito de partículas neon persistente no avatar',       'cosmetic',  'legendary', 'soulbound', 15,  '{"type": "aura", "effect": "neon_particles"}');

-- Category C: Perks de Comunidade (soulbound)
INSERT INTO public.gacha_items (name, slug, description, category, rarity, bind_type, base_weight, properties) VALUES
  ('Emoji Fogueira',          'emoji-fogueira',          'Emoji temático de fogueira para o chat',                'perk',      'common',    'soulbound', 550, '{"type": "emoji", "emoji_id": "fogueira"}'),
  ('Token Post Destaque',     'token-post-destaque',     'Pina seu post no topo por 24 horas',                   'perk',      'uncommon',  'soulbound', 280, '{"type": "pin_post", "duration_hours": 24}'),
  ('Suporte Prioritário',     'suporte-prioritario',     'Fila prioritária de suporte por 1 semana',             'perk',      'rare',      'soulbound', 120, '{"type": "priority_support", "duration_days": 7}'),
  ('Spotlight Homepage',      'spotlight-homepage',      'Destaque na homepage da plataforma por 1 dia',         'perk',      'epic',      'soulbound', 35,  '{"type": "spotlight", "duration_days": 1}'),
  ('Passe Workshop VIP',      'passe-workshop-vip',      'Acesso a AMA/workshop exclusivo fechado',              'perk',      'legendary', 'soulbound', 15,  '{"type": "workshop_pass"}');

-- Category D: Assets de Marketplace (tradeable)
INSERT INTO public.gacha_items (name, slug, description, category, rarity, bind_type, base_weight, properties) VALUES
  ('Template de Prompt',      'template-prompt',         'Prompt pré-construído para uso geral',                  'asset',     'common',    'tradeable', 550, '{"type": "prompt_template"}'),
  ('Workflow Automação',      'workflow-automacao',       'Template de automação n8n/Make simples',                'asset',     'uncommon',  'tradeable', 280, '{"type": "workflow_template", "platform": "n8n"}'),
  ('Code Snippets IA',        'code-snippets-ia',        'Coleção curada de snippets para integração com IA',    'asset',     'rare',      'tradeable', 120, '{"type": "code_snippets", "language": "typescript"}'),
  ('Projeto Starter SaaS',   'projeto-starter-saas',    'Projeto starter completo com docs para SaaS',           'asset',     'epic',      'tradeable', 35,  '{"type": "project_template", "stack": "nextjs"}'),
  ('Licença Ferramenta Pro',  'licenca-ferramenta-pro',  'Trial 30 dias de ferramenta premium parceira',          'asset',     'legendary', 'tradeable', 15,  '{"type": "partner_license", "duration_days": 30}');

-- Category E: Recompensas Externas (soulbound)
INSERT INTO public.gacha_items (name, slug, description, category, rarity, bind_type, base_weight, properties) VALUES
  ('Desconto Parceiro 5%',    'desconto-parceiro-5',     'Cupom de 5% para ferramenta parceira',                  'external',  'common',    'soulbound', 550, '{"type": "discount", "percentage": 5}'),
  ('Acesso Antecipado Evento','acesso-antecipado-evento','Registro prioritário para próximo evento',              'external',  'uncommon',  'soulbound', 280, '{"type": "early_event_access"}'),
  ('Upgrade Certificado',     'upgrade-certificado',     'Visual premium no certificado de conclusão',            'external',  'rare',      'soulbound', 120, '{"type": "certificate_upgrade"}'),
  ('Mentoria Express 15min',  'mentoria-express-15',     'Sessão de 15 minutos com instrutor',                    'external',  'epic',      'soulbound', 35,  '{"type": "mentorship", "duration_minutes": 15}'),
  ('Assento VIP Conferência', 'assento-vip-conferencia', 'Lugar reservado em conferência parceira',               'external',  'legendary', 'soulbound', 15,  '{"type": "vip_seat"}');

-- =============================================
-- SEED: Banner Permanente "Forja Padrão"
-- =============================================

INSERT INTO public.gacha_banners (name, slug, banner_type, status, description, pity_threshold, soft_pity_start, pull_cost_fragments, ten_pull_cost)
VALUES (
  'Forja Padrão',
  'forja-padrao',
  'permanent',
  'active',
  'Banner permanente com todos os itens não-limitados. Pity persistente para sempre.',
  80,
  60,
  100,
  900
);

-- Associate all active items with the permanent banner
INSERT INTO public.gacha_banner_items (banner_id, item_id, weight_override, is_rate_up)
SELECT
  (SELECT id FROM public.gacha_banners WHERE slug = 'forja-padrao'),
  gi.id,
  NULL,
  false
FROM public.gacha_items gi
WHERE gi.is_active = true;
