"use server";

import { fuseItems } from "../services/inventory-engine";
import type { FusionResult } from "../types";

export type FuseItemsResult = {
  result?: FusionResult;
  error?: string;
};

export async function fuseItemsAction(
  inventoryIds: [string, string, string]
): Promise<FuseItemsResult> {
  try {
    const result = await fuseItems(inventoryIds);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao fundir itens" };
  }
}
