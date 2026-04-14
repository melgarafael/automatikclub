import { describe, it, expect } from "vitest";
import {
  GACHA_RECYCLE_VALUES,
  MARKETPLACE_TAX_RATE,
  PRICE_FLOORS,
  PRICE_CEILINGS,
} from "../constants";
import type { ItemRarity } from "../types";
import { RARITY_ORDER } from "../types";

describe("recycle-values: credit rewards by rarity", () => {
  it("common → 10 credits", () => {
    expect(GACHA_RECYCLE_VALUES.common).toBe(10);
  });

  it("uncommon → 30 credits", () => {
    expect(GACHA_RECYCLE_VALUES.uncommon).toBe(30);
  });

  it("rare → 100 credits", () => {
    expect(GACHA_RECYCLE_VALUES.rare).toBe(100);
  });

  it("epic → 300 credits", () => {
    expect(GACHA_RECYCLE_VALUES.epic).toBe(300);
  });

  it("legendary → 1000 credits", () => {
    expect(GACHA_RECYCLE_VALUES.legendary).toBe(1000);
  });

  it("all 5 rarities are defined", () => {
    for (const rarity of RARITY_ORDER) {
      expect(GACHA_RECYCLE_VALUES[rarity]).toBeDefined();
      expect(GACHA_RECYCLE_VALUES[rarity]).toBeGreaterThan(0);
    }
  });

  it("values strictly increase with rarity tier", () => {
    for (let i = 1; i < RARITY_ORDER.length; i++) {
      const current = GACHA_RECYCLE_VALUES[RARITY_ORDER[i]];
      const previous = GACHA_RECYCLE_VALUES[RARITY_ORDER[i - 1]];
      expect(current).toBeGreaterThan(previous);
    }
  });
});

describe("marketplace-tax: 10% destruction", () => {
  it("tax rate is 10%", () => {
    expect(MARKETPLACE_TAX_RATE).toBe(0.1);
  });

  it("1000 credit sale → seller receives 900", () => {
    const salePrice = 1000;
    const tax = Math.floor(salePrice * MARKETPLACE_TAX_RATE);
    const sellerReceives = salePrice - tax;
    expect(tax).toBe(100);
    expect(sellerReceives).toBe(900);
  });

  it("50 credit sale → seller receives 45", () => {
    const salePrice = 50;
    const tax = Math.floor(salePrice * MARKETPLACE_TAX_RATE);
    expect(tax).toBe(5);
    expect(salePrice - tax).toBe(45);
  });
});

describe("marketplace-prices: floor/ceiling by rarity", () => {
  const expectedFloors: Record<ItemRarity, number> = {
    common: 10,
    uncommon: 50,
    rare: 200,
    epic: 1000,
    legendary: 5000,
  };

  const expectedCeilings: Record<ItemRarity, number> = {
    common: 100,
    uncommon: 500,
    rare: 2000,
    epic: 10000,
    legendary: 50000,
  };

  for (const rarity of RARITY_ORDER) {
    it(`${rarity} floor = ${expectedFloors[rarity]}`, () => {
      expect(PRICE_FLOORS[rarity]).toBe(expectedFloors[rarity]);
    });

    it(`${rarity} ceiling = ${expectedCeilings[rarity]}`, () => {
      expect(PRICE_CEILINGS[rarity]).toBe(expectedCeilings[rarity]);
    });
  }

  it("floor < ceiling for every rarity", () => {
    for (const rarity of RARITY_ORDER) {
      expect(PRICE_FLOORS[rarity]).toBeLessThan(PRICE_CEILINGS[rarity]);
    }
  });

  it("recycle value ≤ floor price (recycling is worse than selling)", () => {
    for (const rarity of RARITY_ORDER) {
      expect(GACHA_RECYCLE_VALUES[rarity]).toBeLessThanOrEqual(
        PRICE_FLOORS[rarity]
      );
    }
  });
});
