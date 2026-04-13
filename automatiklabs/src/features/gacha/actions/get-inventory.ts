"use server";

import {
  getInventory,
  getItemCount,
  getCollectionProgress,
  type InventoryFilters,
} from "../services/inventory-engine";
import type { InventoryItem } from "../types";

export type GetInventoryResult = {
  items?: InventoryItem[];
  error?: string;
};

export async function getInventoryAction(
  filters?: InventoryFilters
): Promise<GetInventoryResult> {
  try {
    const items = await getInventory(filters);
    return { items };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar inventario" };
  }
}

export async function getItemCountAction() {
  try {
    return await getItemCount();
  } catch {
    return { total: 0, byRarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 } };
  }
}

export async function getCollectionProgressAction() {
  try {
    return await getCollectionProgress();
  } catch {
    return { owned: 0, total: 0, byCategory: {} };
  }
}
