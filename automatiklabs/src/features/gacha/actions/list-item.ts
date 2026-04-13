"use server";

import { listItem } from "../services/marketplace-engine";
import type { MarketplaceListing } from "../types";

export type ListItemResult = {
  listing?: MarketplaceListing;
  error?: string;
};

export async function listItemAction(
  inventoryId: string,
  price: number
): Promise<ListItemResult> {
  try {
    const listing = await listItem(inventoryId, price);
    return { listing };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao listar item" };
  }
}
