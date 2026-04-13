"use server";

import { buyItem } from "../services/marketplace-engine";
import { buyItemSchema } from "../schemas";
import type { MarketplaceListing } from "../types";

export type BuyItemResult = {
  listing?: MarketplaceListing;
  error?: string;
};

export async function buyItemAction(
  listingId: string
): Promise<BuyItemResult> {
  const parsed = buyItemSchema.safeParse({ listingId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  try {
    const listing = await buyItem(parsed.data.listingId);
    return { listing };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao comprar item" };
  }
}
