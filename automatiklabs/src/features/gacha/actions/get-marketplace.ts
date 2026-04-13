"use server";

import {
  getListings,
  getMyListings,
  type MarketplaceFilters,
} from "../services/marketplace-engine";
import type { MarketplaceListing } from "../types";

export type GetMarketplaceResult = {
  listings?: MarketplaceListing[];
  error?: string;
};

export async function getMarketplaceAction(
  filters?: MarketplaceFilters
): Promise<GetMarketplaceResult> {
  try {
    const listings = await getListings(filters);
    return { listings };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar marketplace" };
  }
}

export async function getMyListingsAction(): Promise<GetMarketplaceResult> {
  try {
    const listings = await getMyListings();
    return { listings };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao buscar suas listings" };
  }
}
