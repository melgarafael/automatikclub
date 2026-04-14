"use server";

import {
  getListings,
  getMyListings,
  type MarketplaceFilters,
} from "../services/marketplace-engine";
import { createClient } from "@/shared/lib/supabase/server";
import type { MarketplaceListing } from "../types";

export type GetMarketplaceResult = {
  listings?: MarketplaceListing[];
  error?: string;
};

export async function getMarketplaceAction(
  filters?: MarketplaceFilters
): Promise<GetMarketplaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const listings = await getListings(filters);
    return { listings };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar marketplace" };
  }
}

export async function getMyListingsAction(): Promise<GetMarketplaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const listings = await getMyListings();
    return { listings };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar suas listings" };
  }
}
