import { createClient } from "@/shared/lib/supabase/server";
import type {
  InventoryItem,
  FusionResult,
  RecycleResult,
  ItemRarity,
  GachaItem,
} from "../types";

// -- Filters --

export interface InventoryFilters {
  rarity?: ItemRarity;
  category?: GachaItem["category"];
  obtainedVia?: InventoryItem["obtainedVia"];
}

// -- Inventory Queries --

export async function getInventory(
  filters?: InventoryFilters
): Promise<InventoryItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("user_inventory")
    .select(
      `
      id,
      user_id,
      item_id,
      obtained_via,
      is_locked,
      source_pull_id,
      obtained_at,
      gacha_items (
        id,
        name,
        slug,
        description,
        rarity,
        bind_type,
        category,
        icon_url,
        base_weight,
        properties,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("obtained_at", { ascending: false });

  if (filters?.obtainedVia) {
    query = query.eq("obtained_via", filters.obtainedVia);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch inventory: ${error.message}`);
  if (!data) return [];

  let items: InventoryItem[] = data.map((row) => {
    const item = row.gacha_items as unknown as Record<string, unknown>;
    return {
      id: row.id,
      userId: row.user_id,
      itemId: row.item_id,
      obtainedVia: row.obtained_via as InventoryItem["obtainedVia"],
      isLocked: row.is_locked,
      sourcePullId: row.source_pull_id,
      obtainedAt: row.obtained_at,
      item: item
        ? {
            id: item.id as string,
            name: item.name as string,
            slug: item.slug as string,
            description: item.description as string | null,
            rarity: item.rarity as ItemRarity,
            bindType: item.bind_type as GachaItem["bindType"],
            category: item.category as GachaItem["category"],
            iconUrl: item.icon_url as string | null,
            baseWeight: item.base_weight as number,
            properties: item.properties as Record<string, unknown>,
            createdAt: item.created_at as string,
          }
        : undefined,
    };
  });

  // Post-query filters (on joined data)
  if (filters?.rarity) {
    items = items.filter((i) => i.item?.rarity === filters.rarity);
  }
  if (filters?.category) {
    items = items.filter((i) => i.item?.category === filters.category);
  }

  // Sort by rarity descending
  const rarityOrder: Record<ItemRarity, number> = {
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
  };
  items.sort(
    (a, b) =>
      rarityOrder[b.item?.rarity ?? "common"] -
      rarityOrder[a.item?.rarity ?? "common"]
  );

  return items;
}

export async function getItemCount(): Promise<{
  total: number;
  byRarity: Record<ItemRarity, number>;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_inventory")
    .select("id, gacha_items ( rarity )")
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to count items: ${error.message}`);

  const byRarity: Record<ItemRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  for (const row of data ?? []) {
    const item = row.gacha_items as unknown as { rarity: ItemRarity } | null;
    if (item) {
      byRarity[item.rarity] = (byRarity[item.rarity] ?? 0) + 1;
    }
  }

  return {
    total: data?.length ?? 0,
    byRarity,
  };
}

export async function getCollectionProgress(): Promise<{
  owned: number;
  total: number;
  byCategory: Record<string, { owned: number; total: number }>;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // All active items
  const { data: allItems, error: itemsError } = await supabase
    .from("gacha_items")
    .select("id, category")
    .eq("is_active", true);

  if (itemsError)
    throw new Error(`Failed to fetch items: ${itemsError.message}`);

  // User's distinct owned item_ids
  const { data: ownedRows, error: ownedError } = await supabase
    .from("user_inventory")
    .select("item_id")
    .eq("user_id", user.id);

  if (ownedError)
    throw new Error(`Failed to fetch owned items: ${ownedError.message}`);

  const ownedItemIds = new Set((ownedRows ?? []).map((r) => r.item_id));

  const byCategory: Record<string, { owned: number; total: number }> = {};

  for (const item of allItems ?? []) {
    const cat = item.category as string;
    if (!byCategory[cat]) {
      byCategory[cat] = { owned: 0, total: 0 };
    }
    byCategory[cat].total++;
    if (ownedItemIds.has(item.id)) {
      byCategory[cat].owned++;
    }
  }

  const total = allItems?.length ?? 0;
  const owned = ownedItemIds.size;

  return { owned, total, byCategory };
}

// -- Mutations (RPC wrappers) --

export async function fuseItems(
  inventoryIds: [string, string, string]
): Promise<FusionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("perform_fusion", {
    p_inventory_ids: inventoryIds,
  });

  if (error) throw new Error(error.message);

  const result = data as Record<string, unknown>;

  return {
    fusionId: result.inventory_id as string,
    inputItems: [], // RPC doesn't return full input items
    outputItem: {
      id: result.inventory_id as string,
      userId: "", // caller's user
      itemId: result.item_id as string,
      obtainedVia: "fusion",
      isLocked: false,
      sourcePullId: null,
      obtainedAt: new Date().toISOString(),
      item: {
        id: result.item_id as string,
        name: result.name as string,
        slug: result.slug as string,
        description: null,
        rarity: result.rarity as ItemRarity,
        bindType: result.bind_type as GachaItem["bindType"],
        category: result.category as GachaItem["category"],
        iconUrl: result.icon_url as string | null,
        baseWeight: 0,
        properties: (result.properties as Record<string, unknown>) ?? {},
        createdAt: new Date().toISOString(),
      },
    },
    inputRarity: result.input_rarity as ItemRarity,
    outputRarity: result.rarity as ItemRarity,
  };
}

export async function recycleItem(
  inventoryId: string
): Promise<RecycleResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("recycle_item", {
    p_inventory_id: inventoryId,
  });

  if (error) throw new Error(error.message);

  const result = data as Record<string, unknown>;

  return {
    itemId: inventoryId,
    creditsGained: result.credits_gained as number,
    rarity: result.item_rarity as ItemRarity,
  };
}
