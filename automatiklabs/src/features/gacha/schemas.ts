import { z } from "zod";
import { PRICE_FLOORS, PRICE_CEILINGS } from "./constants";
import type { ItemRarity } from "./types";

// -- Shared --

const uuidSchema = z.string().uuid("ID invalido");

// -- Pull --

export const pullSchema = z.object({
  bannerId: uuidSchema,
  pullCount: z.union([z.literal(1), z.literal(10)]),
});

export type PullInput = z.infer<typeof pullSchema>;

// -- Fusion --

export const fuseSchema = z.object({
  inventoryIds: z.tuple([uuidSchema, uuidSchema, uuidSchema]),
});

export type FuseInput = z.infer<typeof fuseSchema>;

// -- List Item --

export const listItemSchema = z.object({
  inventoryId: uuidSchema,
  priceCredits: z
    .number()
    .int("Preco deve ser inteiro")
    .positive("Preco deve ser positivo")
    .max(50_000, "Preco acima do maximo permitido"),
});

export type ListItemInput = z.infer<typeof listItemSchema>;

/**
 * Validates price against rarity-specific floor/ceiling.
 * Call after basic schema validation when rarity is known.
 */
export function validatePriceForRarity(
  price: number,
  rarity: ItemRarity
): { valid: boolean; error?: string } {
  const floor = PRICE_FLOORS[rarity];
  const ceiling = PRICE_CEILINGS[rarity];

  if (price < floor || price > ceiling) {
    return {
      valid: false,
      error: `Preco para ${rarity} deve ser entre ${floor} e ${ceiling} creditos`,
    };
  }

  return { valid: true };
}

// -- Buy Item --

export const buyItemSchema = z.object({
  listingId: uuidSchema,
});

export type BuyItemInput = z.infer<typeof buyItemSchema>;

// -- Cancel Listing --

export const cancelListingSchema = z.object({
  listingId: uuidSchema,
});

export type CancelListingInput = z.infer<typeof cancelListingSchema>;

// -- Recycle --

export const recycleSchema = z.object({
  inventoryId: uuidSchema,
});

export type RecycleInput = z.infer<typeof recycleSchema>;

// -- Verify Fairness --

export const verifyFairnessSchema = z.object({
  pullId: uuidSchema,
});

export type VerifyFairnessInput = z.infer<typeof verifyFairnessSchema>;

// -- Rotate Seed --

export const rotateSeedSchema = z.object({});

export type RotateSeedInput = z.infer<typeof rotateSeedSchema>;
