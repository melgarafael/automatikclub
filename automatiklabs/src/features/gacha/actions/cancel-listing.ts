"use server";

import { cancelListing } from "../services/marketplace-engine";
import { cancelListingSchema } from "../schemas";

export type CancelListingResult = {
  success?: boolean;
  error?: string;
};

export async function cancelListingAction(
  listingId: string
): Promise<CancelListingResult> {
  const parsed = cancelListingSchema.safeParse({ listingId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  try {
    await cancelListing(parsed.data.listingId);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao cancelar listing" };
  }
}
