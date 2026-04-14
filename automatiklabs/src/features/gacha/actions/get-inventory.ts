"use server";

import {
  getInventory,
  getItemCount,
  getCollectionProgress,
  type InventoryFilters,
} from "../services/inventory-engine";
import { createClient } from "@/shared/lib/supabase/server";
import type { InventoryItem } from "../types";

export type GetInventoryResult = {
  items?: InventoryItem[];
  error?: string;
};

export async function getInventoryAction(
  filters?: InventoryFilters
): Promise<GetInventoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const items = await getInventory(filters);
    return { items };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar inventario" };
  }
}

export async function getItemCountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, byRarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 } };

  try {
    return await getItemCount();
  } catch {
    return { total: 0, byRarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 } };
  }
}

export async function getCollectionProgressAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { owned: 0, total: 0, byCategory: {} };

  try {
    return await getCollectionProgress();
  } catch {
    return { owned: 0, total: 0, byCategory: {} };
  }
}
