"use server";

import { buyItem } from "../services/marketplace-engine";
import type { MarketplaceListing } from "../types";

export type BuyItemResult = {
  listing?: MarketplaceListing;
  error?: string;
};

export async function buyItemAction(
  listingId: string
): Promise<BuyItemResult> {
  try {
    const listing = await buyItem(listingId);
    return { listing };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao comprar item" };
  }
}
