"use server";

import { buyItem } from "../services/marketplace-engine";
import { buyItemSchema } from "../schemas";
import { createClient } from "@/shared/lib/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const listing = await buyItem(parsed.data.listingId);
    return { listing };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao comprar item" };
  }
}
