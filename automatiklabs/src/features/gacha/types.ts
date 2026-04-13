// =============================================
// Gacha System Types — AutomatikClub
// =============================================

// -- Rarity (mirrors DB enum item_rarity) --

export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

export const RARITY_ORDER: readonly ItemRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;

// -- Bind Type (mirrors DB enum item_bind_type) --

export type BindType = "soulbound" | "tradeable";

// -- Banner Types (mirrors DB enums) --

export type BannerType = "permanent" | "limited" | "themed";

export type BannerStatus = "draft" | "active" | "expired";

// -- Currency (mirrors DB enums) --

export type CurrencyType = "fragments" | "credits";

export type CurrencyTxType =
  | "pull_spend"
  | "marketplace_purchase"
  | "marketplace_sale"
  | "fusion_cost"
  | "reward"
  | "admin_grant"
  | "admin_deduct"
  | "xp_conversion"
  | "duplicate_refund";

// -- Marketplace (mirrors DB enum listing_status) --

export type ListingStatus = "active" | "sold" | "cancelled" | "expired";

// -- Item --

export interface GachaItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rarity: ItemRarity;
  bindType: BindType;
  category: "booster" | "cosmetic" | "community" | "asset" | "external";
  iconUrl: string | null;
  baseWeight: number;
  properties: Record<string, unknown>;
  createdAt: string;
}

// -- Banner --

export interface GachaBanner {
  id: string;
  name: string;
  slug: string;
  bannerType: BannerType;
  status: BannerStatus;
  startsAt: string;
  endsAt: string | null;
  pityThreshold: number;
  softPityStart: number;
  rateUpItemIds: string[];
  createdAt: string;
}

export interface BannerItem {
  bannerId: string;
  itemId: string;
  weightOverride: number | null;
  isRateUp: boolean;
  item?: GachaItem;
}

// -- User State --

export interface UserWallet {
  userId: string;
  fragments: number;
  credits: number;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  obtainedVia: "pull" | "fusion" | "reward" | "marketplace";
  isLocked: boolean;
  sourcePullId: string | null;
  obtainedAt: string;
  item?: GachaItem;
}

export interface PityState {
  userId: string;
  bannerId: string;
  pullCount: number;
  guaranteedNext: boolean;
}

// -- Results --

export interface PullResult {
  pullId: string;
  item: GachaItem;
  rarity: ItemRarity;
  isNew: boolean;
  wasPity: boolean;
  wasSoftPity: boolean;
  wasGuaranteed: boolean;
  pityCountAt: number;
  fragmentsSpent: number;
}

export interface FusionResult {
  fusionId: string;
  inputItems: InventoryItem[];
  outputItem: InventoryItem;
  inputRarity: ItemRarity;
  outputRarity: ItemRarity;
}

export interface RecycleResult {
  itemId: string;
  creditsGained: number;
  rarity: ItemRarity;
}

// -- Marketplace --

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  inventoryId: string;
  itemId: string;
  priceCredits: number;
  status: ListingStatus;
  buyerId: string | null;
  expiresAt: string;
  createdAt: string;
  item?: GachaItem;
}

// -- Provably Fair / Fairness Verification --

export interface FairnessRecord {
  pullId: string;
  serverSeedHash: string;
  nonce: number;
  rarity: ItemRarity;
  itemName: string;
  createdAt: string;
  /** Only available after seed rotation */
  serverSeed: string | null;
  clientSeed: string | null;
}

export interface SeedRotationResult {
  newSeedHash: string;
  oldServerSeed: string | null;
  oldSeedHash: string | null;
  oldNonce: number | null;
  clientSeed: string;
}

export interface FairnessVerification {
  pullId: string;
  verified: boolean;
  serverSeedHash: string;
  nonce: number;
  /** null if seed still active (not yet revealed) */
  serverSeed: string | null;
  clientSeed: string | null;
  expectedHash: string | null;
  resultRarity: ItemRarity;
  message: string;
}
