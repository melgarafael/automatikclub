import { describe, it, expect } from "vitest";
import {
  pullSchema,
  fuseSchema,
  listItemSchema,
  buyItemSchema,
  cancelListingSchema,
  recycleSchema,
  verifyFairnessSchema,
  validatePriceForRarity,
} from "./schemas";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("gacha schemas", () => {
  describe("pullSchema", () => {
    it("accepts valid single pull", () => {
      const result = pullSchema.safeParse({ bannerId: VALID_UUID, pullCount: 1 });
      expect(result.success).toBe(true);
    });

    it("accepts valid 10-pull", () => {
      const result = pullSchema.safeParse({ bannerId: VALID_UUID, pullCount: 10 });
      expect(result.success).toBe(true);
    });

    it("rejects non-uuid bannerId", () => {
      const result = pullSchema.safeParse({ bannerId: "not-a-uuid", pullCount: 1 });
      expect(result.success).toBe(false);
    });

    it("rejects pullCount !== 1 or 10", () => {
      const result = pullSchema.safeParse({ bannerId: VALID_UUID, pullCount: 5 });
      expect(result.success).toBe(false);
    });
  });

  describe("fuseSchema", () => {
    it("accepts 3 valid uuids", () => {
      const result = fuseSchema.safeParse({
        inventoryIds: [VALID_UUID, VALID_UUID, VALID_UUID],
      });
      expect(result.success).toBe(true);
    });

    it("rejects 2 uuids", () => {
      const result = fuseSchema.safeParse({
        inventoryIds: [VALID_UUID, VALID_UUID],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listItemSchema", () => {
    it("accepts valid listing", () => {
      const result = listItemSchema.safeParse({
        inventoryId: VALID_UUID,
        priceCredits: 500,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative price", () => {
      const result = listItemSchema.safeParse({
        inventoryId: VALID_UUID,
        priceCredits: -10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects price above max", () => {
      const result = listItemSchema.safeParse({
        inventoryId: VALID_UUID,
        priceCredits: 100_000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("buyItemSchema", () => {
    it("accepts valid uuid", () => {
      expect(buyItemSchema.safeParse({ listingId: VALID_UUID }).success).toBe(true);
    });
    it("rejects invalid uuid", () => {
      expect(buyItemSchema.safeParse({ listingId: "abc" }).success).toBe(false);
    });
  });

  describe("cancelListingSchema", () => {
    it("accepts valid uuid", () => {
      expect(cancelListingSchema.safeParse({ listingId: VALID_UUID }).success).toBe(true);
    });
  });

  describe("recycleSchema", () => {
    it("accepts valid uuid", () => {
      expect(recycleSchema.safeParse({ inventoryId: VALID_UUID }).success).toBe(true);
    });
  });

  describe("verifyFairnessSchema", () => {
    it("accepts valid uuid", () => {
      expect(verifyFairnessSchema.safeParse({ pullId: VALID_UUID }).success).toBe(true);
    });
  });

  describe("validatePriceForRarity", () => {
    it("accepts price within range", () => {
      expect(validatePriceForRarity(100, "uncommon")).toEqual({ valid: true });
    });

    it("rejects price below floor", () => {
      const result = validatePriceForRarity(5, "uncommon");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("50");
    });

    it("rejects price above ceiling", () => {
      const result = validatePriceForRarity(600, "uncommon");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("500");
    });
  });
});
