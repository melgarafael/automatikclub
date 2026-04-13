// =============================================
// Gacha Engine — Pull orchestration
// Calls perform_gacha_pull RPC (SECURITY DEFINER)
// which handles pity, weighted random, provably fair.
// =============================================

import { createClient } from "@/shared/lib/supabase/server";
import type {
  GachaBanner,
  BannerItem,
  GachaItem,
  PullResult,
  ItemRarity,
} from "../types";

// -- RPC return shape from perform_gacha_pull --

interface RpcPullRow {
  pull_id: string;
  item_id: string;
  name: string;
  slug: string;
  rarity: ItemRarity;
  category: string;
  bind_type: string;
  icon_url: string | null;
  properties: Record<string, unknown>;
  was_pity: boolean;
  was_soft_pity: boolean;
  was_guaranteed: boolean;
  pity_count: number;
  nonce: number;
}

interface RpcPullResponse {
  results: RpcPullRow[];
  fragments_spent: number;
  fragments_remaining: number;
  pity_count: number;
  pull_count: number;
}

// -- Helpers --

function mapRpcRowToPullResult(
  row: RpcPullRow,
  fragmentsPerPull: number
): PullResult {
  return {
    pullId: row.pull_id,
    item: {
      id: row.item_id,
      name: row.name,
      slug: row.slug,
      description: null,
      rarity: row.rarity,
      bindType: row.bind_type as "soulbound" | "tradeable",
      category: row.category as GachaItem["category"],
      iconUrl: row.icon_url,
      baseWeight: 0,
      properties: row.properties ?? {},
      createdAt: "",
    },
    rarity: row.rarity,
    isNew: true, // RPC doesn't track this; UI can compare against inventory
    wasPity: row.was_pity,
    wasSoftPity: row.was_soft_pity,
    wasGuaranteed: row.was_guaranteed,
    pityCountAt: row.pity_count,
    fragmentsSpent: fragmentsPerPull,
  };
}

// -- Public API --

export async function executePull(
  bannerId: string
): Promise<PullResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("perform_gacha_pull", {
    p_banner_id: bannerId,
    p_pull_count: 1,
  });

  if (error) throw new Error(error.message);

  const response = data as unknown as RpcPullResponse;
  const perPull = response.fragments_spent / response.pull_count;

  return response.results.map((row) => mapRpcRowToPullResult(row, perPull));
}

export async function execute10Pull(
  bannerId: string
): Promise<PullResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("perform_gacha_pull", {
    p_banner_id: bannerId,
    p_pull_count: 10,
  });

  if (error) throw new Error(error.message);

  const response = data as unknown as RpcPullResponse;
  const perPull = response.fragments_spent / response.pull_count;

  return response.results.map((row) => mapRpcRowToPullResult(row, perPull));
}

// -- DB row → type mappers --

interface BannerRow {
  id: string;
  name: string;
  slug: string;
  banner_type: GachaBanner["bannerType"];
  status: GachaBanner["status"];
  starts_at: string;
  ends_at: string | null;
  pity_threshold: number;
  soft_pity_start: number;
  rate_up_item_ids: string[];
  pull_cost_fragments: number;
  ten_pull_cost: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

function mapBannerRow(row: BannerRow): GachaBanner {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    bannerType: row.banner_type,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    pityThreshold: row.pity_threshold,
    softPityStart: row.soft_pity_start,
    rateUpItemIds: row.rate_up_item_ids ?? [],
    createdAt: row.created_at,
  };
}

export async function getBanners(): Promise<GachaBanner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gacha_banners")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapBannerRow(row as unknown as BannerRow));
}

export async function getBannerItems(
  bannerId: string
): Promise<BannerItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gacha_banner_items")
    .select(
      `
      banner_id,
      item_id,
      weight_override,
      is_rate_up,
      gacha_items (
        id, name, slug, description, rarity, bind_type,
        category, icon_url, base_weight, properties, created_at
      )
    `
    )
    .eq("banner_id", bannerId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const itemRow = raw.gacha_items as Record<string, unknown> | null;
    return {
      bannerId: raw.banner_id as string,
      itemId: raw.item_id as string,
      weightOverride: raw.weight_override as number | null,
      isRateUp: raw.is_rate_up as boolean,
      item: itemRow
        ? {
            id: itemRow.id as string,
            name: itemRow.name as string,
            slug: itemRow.slug as string,
            description: (itemRow.description as string) ?? null,
            rarity: itemRow.rarity as ItemRarity,
            bindType: itemRow.bind_type as "soulbound" | "tradeable",
            category: itemRow.category as GachaItem["category"],
            iconUrl: (itemRow.icon_url as string) ?? null,
            baseWeight: itemRow.base_weight as number,
            properties:
              (itemRow.properties as Record<string, unknown>) ?? {},
            createdAt: itemRow.created_at as string,
          }
        : undefined,
    };
  });
}
