"use server";

import { cancelListing } from "../services/marketplace-engine";

export type CancelListingResult = {
  success?: boolean;
  error?: string;
};

export async function cancelListingAction(
  listingId: string
): Promise<CancelListingResult> {
  try {
    await cancelListing(listingId);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao cancelar listing" };
  }
}
