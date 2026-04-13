"use server";

import { fuseItems } from "../services/inventory-engine";
import { fuseSchema } from "../schemas";
import type { FusionResult } from "../types";

export type FuseItemsResult = {
  result?: FusionResult;
  error?: string;
};

export async function fuseItemsAction(
  inventoryIds: [string, string, string]
): Promise<FuseItemsResult> {
  const parsed = fuseSchema.safeParse({ inventoryIds });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  try {
    const result = await fuseItems(parsed.data.inventoryIds);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao fundir itens" };
  }
}
