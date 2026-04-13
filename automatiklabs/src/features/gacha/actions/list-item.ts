"use server";

import { listItem } from "../services/marketplace-engine";
import { listItemSchema } from "../schemas";
import { createClient } from "@/shared/lib/supabase/server";
import type { MarketplaceListing } from "../types";

export type ListItemResult = {
  listing?: MarketplaceListing;
  error?: string;
};

export async function listItemAction(
  inventoryId: string,
  price: number
): Promise<ListItemResult> {
  const parsed = listItemSchema.safeParse({ inventoryId, priceCredits: price });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const listing = await listItem(
      parsed.data.inventoryId,
      parsed.data.priceCredits
    );
    return { listing };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao listar item" };
  }
}
