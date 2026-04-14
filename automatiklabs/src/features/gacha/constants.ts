// =============================================
// Gacha System Constants — AutomatikClub
// =============================================

import type { ItemRarity } from "./types";

// -- Pull Costs --

export const GACHA_PULL_COST = {
  single: 100,
  ten: 900,
} as const;

// -- Fragment Rewards by Action --

export const GACHA_FRAGMENT_REWARDS = {
  lesson_complete: 10,
  module_complete: 75,
  course_complete: 350,
  daily_login: [5, 5, 10, 10, 15, 15, 30] as readonly number[],
  weekly_challenge: 60,
  badge_earned: 50,
  community_contribution: 15,
} as const;

// -- Recycle Credits by Rarity --

export const GACHA_RECYCLE_VALUES: Record<ItemRarity, number> = {
  common: 10,
  uncommon: 30,
  rare: 100,
  epic: 300,
  legendary: 1000,
};

// -- Anti-inflation --

export const DIMINISHING_THRESHOLD = 5;
export const DIMINISHING_CUTOFF = 10;
export const DIMINISHING_FACTOR = 0.5;
export const SOFT_CEILING = 10_000;

// -- XP Milestone → Credits Conversion --

export const XP_MILESTONE_CREDITS: Record<number, number> = {
  1000: 50,
  5000: 200,
  10000: 500,
};

// -- Marketplace --

export const MARKETPLACE_TAX_RATE = 0.1;
export const LISTING_DURATION_DAYS = 7;

// -- Fusion --

export const FUSION_INPUT_COUNT = 3;

// -- Badge → Gacha Triggers --

export const BADGE_GACHA_TRIGGERS: Record<
  string,
  { type: "free_pull"; banner: string } | { type: "guaranteed_pull"; rarity: ItemRarity }
> = {
  "curso-completo": { type: "free_pull", banner: "course_theme" },
  "streak-master-30": { type: "guaranteed_pull", rarity: "rare" },
};

// -- Price Floors/Ceilings (mirrors gacha_rarity_price_config) --

export const PRICE_FLOORS: Record<ItemRarity, number> = {
  common: 10,
  uncommon: 50,
  rare: 200,
  epic: 1000,
  legendary: 5000,
};

export const PRICE_CEILINGS: Record<ItemRarity, number> = {
  common: 100,
  uncommon: 500,
  rare: 2000,
  epic: 10000,
  legendary: 50000,
};

// -- Base Rates (for display / client-side info only — actual rates are in RPC) --

export const BASE_RATES: Record<ItemRarity, number> = {
  common: 0.55,
  uncommon: 0.28,
  rare: 0.12,
  epic: 0.035,
  legendary: 0.015,
};
