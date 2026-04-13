"use server";

import { recycleItem } from "../services/inventory-engine";
import type { RecycleResult } from "../types";

export type RecycleItemResult = {
  result?: RecycleResult;
  error?: string;
};

export async function recycleItemAction(
  inventoryId: string
): Promise<RecycleItemResult> {
  try {
    const result = await recycleItem(inventoryId);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao reciclar item" };
  }
}
