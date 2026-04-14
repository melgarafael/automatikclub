import { describe, it, expect } from "vitest";
import { fuseSchema } from "../schemas";
import { FUSION_INPUT_COUNT } from "../constants";
import type { ItemRarity } from "../types";
import { RARITY_ORDER } from "../types";

/**
 * Fusion business logic — mirrors the RPC validation.
 * 3 items of same rarity → 1 item of next rarity tier.
 */
function validateFusionInput(
  items: Array<{ rarity: ItemRarity; isLocked: boolean }>
): { valid: boolean; error?: string; outputRarity?: ItemRarity } {
  if (items.length !== FUSION_INPUT_COUNT) {
    return { valid: false, error: `Exactly ${FUSION_INPUT_COUNT} items required` };
  }

  const rarity = items[0].rarity;

  // All items must be same rarity
  if (!items.every((i) => i.rarity === rarity)) {
    return { valid: false, error: "All items must be same rarity" };
  }

  // Legendary cannot be fused
  if (rarity === "legendary") {
    return { valid: false, error: "Legendary items cannot be fused" };
  }

  // No locked items
  if (items.some((i) => i.isLocked)) {
    return { valid: false, error: "Cannot fuse locked items" };
  }

  // Determine output rarity (next tier)
  const currentIndex = RARITY_ORDER.indexOf(rarity);
  const outputRarity = RARITY_ORDER[currentIndex + 1];

  return { valid: true, outputRarity };
}

// Valid v4 UUIDs for schema tests
const UUID_1 = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const UUID_2 = "b1ffcd00-ad1c-4f09-ac7e-7ccace491b22";
const UUID_3 = "c2aade11-be2d-4a10-8d8f-8ddbdf502c33";
const UUID_4 = "d3bbef22-cf3e-4b21-ae90-9eece0613d44";

describe("fusion-logic: schema validation", () => {
  it("accepts exactly 3 UUIDs", () => {
    const result = fuseSchema.safeParse({
      inventoryIds: [UUID_1, UUID_2, UUID_3],
    });
    expect(result.success).toBe(true);
  });

  it("rejects 2 UUIDs", () => {
    const result = fuseSchema.safeParse({
      inventoryIds: [UUID_1, UUID_2],
    });
    expect(result.success).toBe(false);
  });

  it("rejects 4 UUIDs", () => {
    const result = fuseSchema.safeParse({
      inventoryIds: [UUID_1, UUID_2, UUID_3, UUID_4],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID format", () => {
    const result = fuseSchema.safeParse({
      inventoryIds: ["not-a-uuid", "also-not", "nope"],
    });
    expect(result.success).toBe(false);
  });
});

describe("fusion-logic: business rules", () => {
  const makeItem = (
    rarity: ItemRarity,
    isLocked = false
  ) => ({ rarity, isLocked });

  describe("valid fusions (tier progression)", () => {
    it("3 common → 1 uncommon", () => {
      const result = validateFusionInput([
        makeItem("common"),
        makeItem("common"),
        makeItem("common"),
      ]);
      expect(result.valid).toBe(true);
      expect(result.outputRarity).toBe("uncommon");
    });

    it("3 uncommon → 1 rare", () => {
      const result = validateFusionInput([
        makeItem("uncommon"),
        makeItem("uncommon"),
        makeItem("uncommon"),
      ]);
      expect(result.valid).toBe(true);
      expect(result.outputRarity).toBe("rare");
    });

    it("3 rare → 1 epic", () => {
      const result = validateFusionInput([
        makeItem("rare"),
        makeItem("rare"),
        makeItem("rare"),
      ]);
      expect(result.valid).toBe(true);
      expect(result.outputRarity).toBe("epic");
    });

    it("3 epic → 1 legendary", () => {
      const result = validateFusionInput([
        makeItem("epic"),
        makeItem("epic"),
        makeItem("epic"),
      ]);
      expect(result.valid).toBe(true);
      expect(result.outputRarity).toBe("legendary");
    });
  });

  describe("invalid fusions", () => {
    it("legendary cannot be fused", () => {
      const result = validateFusionInput([
        makeItem("legendary"),
        makeItem("legendary"),
        makeItem("legendary"),
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Legendary");
    });

    it("mixed rarities rejected", () => {
      const result = validateFusionInput([
        makeItem("common"),
        makeItem("common"),
        makeItem("uncommon"),
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("same rarity");
    });

    it("less than 3 items rejected", () => {
      const result = validateFusionInput([
        makeItem("common"),
        makeItem("common"),
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("3");
    });

    it("locked items rejected", () => {
      const result = validateFusionInput([
        makeItem("common"),
        makeItem("common"),
        makeItem("common", true),
      ]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("locked");
    });
  });
});
