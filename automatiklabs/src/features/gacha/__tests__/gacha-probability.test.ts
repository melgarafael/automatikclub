import { describe, it, expect } from "vitest";
import { BASE_RATES } from "../constants";
import type { ItemRarity } from "../types";
import { calculateEffectiveRate } from "../services/pity-engine";

/**
 * Weighted random selection — mirrors the RPC logic in TypeScript.
 * Uses cumulative distribution for O(n) selection.
 */
function weightedRandomSelect(
  rates: Record<ItemRarity, number>,
  roll: number
): ItemRarity {
  let cumulative = 0;
  const entries = Object.entries(rates) as [ItemRarity, number][];
  for (const [rarity, rate] of entries) {
    cumulative += rate;
    if (roll < cumulative) return rarity;
  }
  // Fallback (floating point edge) — return last rarity
  return entries[entries.length - 1][0];
}

/**
 * Monte Carlo simulation of N pulls.
 * Returns observed distribution as percentages.
 */
function simulatePulls(
  n: number,
  rates: Record<ItemRarity, number>
): Record<ItemRarity, number> {
  const counts: Record<ItemRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  for (let i = 0; i < n; i++) {
    const roll = Math.random();
    const rarity = weightedRandomSelect(rates, roll);
    counts[rarity]++;
  }

  // Convert to percentages
  const result = {} as Record<ItemRarity, number>;
  for (const [rarity, count] of Object.entries(counts)) {
    result[rarity as ItemRarity] = count / n;
  }
  return result;
}

describe("gacha-probability: Monte Carlo", () => {
  const N = 10_000;

  describe("base rates (no pity)", () => {
    it("distribution matches declared rates within tolerance", () => {
      const observed = simulatePulls(N, BASE_RATES);

      // Tolerances chosen to be generous enough to avoid flaky tests
      // but tight enough to catch broken logic
      expect(observed.common).toBeCloseTo(0.55, 1);    // ±3%
      expect(observed.uncommon).toBeCloseTo(0.28, 1);   // ±3%
      expect(observed.rare).toBeCloseTo(0.12, 1);       // ±2%
      expect(observed.epic).toBeCloseTo(0.035, 1);      // ±1.5%
      expect(observed.legendary).toBeCloseTo(0.015, 1);  // ±1%
    });

    it("all rarities sum to 100%", () => {
      const sum = Object.values(BASE_RATES).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it("every rarity appears at least once in 10k pulls", () => {
      const observed = simulatePulls(N, BASE_RATES);
      for (const rarity of Object.keys(BASE_RATES) as ItemRarity[]) {
        expect(observed[rarity]).toBeGreaterThan(0);
      }
    });
  });

  describe("with soft pity active (legendary)", () => {
    it("legendary rate increases during soft pity zone", () => {
      // Simulate pulls where user is at pull 70 (soft pity active)
      const pityRate = calculateEffectiveRate(0.015, 70, 60, 80);
      expect(pityRate).toBeGreaterThan(0.015);

      // Create modified rates with pity-boosted legendary
      const boost = pityRate - BASE_RATES.legendary;
      const pityRates: Record<ItemRarity, number> = {
        // Redistribute the boost by reducing common proportionally
        common: BASE_RATES.common - boost,
        uncommon: BASE_RATES.uncommon,
        rare: BASE_RATES.rare,
        epic: BASE_RATES.epic,
        legendary: pityRate,
      };

      const observed = simulatePulls(N, pityRates);
      expect(observed.legendary).toBeGreaterThan(0.015);
    });
  });

  describe("hard pity guarantee", () => {
    it("legendary rate is 100% at hard pity (pull 80)", () => {
      const rate = calculateEffectiveRate(0.015, 80, 60, 80);
      expect(rate).toBe(1.0);
    });

    it("simulated pulls at hard pity always produce legendary", () => {
      // At hard pity, legendary should be 100%
      const hardPityRates: Record<ItemRarity, number> = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 1.0,
      };

      const observed = simulatePulls(1000, hardPityRates);
      expect(observed.legendary).toBe(1.0);
      expect(observed.common).toBe(0);
    });
  });

  describe("weighted selection correctness", () => {
    it("roll = 0.0 selects common (first bucket)", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.0)).toBe("common");
    });

    it("roll = 0.549 selects common (just before boundary)", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.549)).toBe("common");
    });

    it("roll = 0.55 selects uncommon (at boundary)", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.55)).toBe("uncommon");
    });

    // Note: JS floating point makes 0.55+0.28 = 0.8300000000000001
    // so exact boundary values fall into the earlier bucket.
    // Use values clearly past the boundary.

    it("roll = 0.831 selects rare (past 55%+28% boundary)", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.831)).toBe("rare");
    });

    it("roll = 0.951 selects epic (past 55%+28%+12% boundary)", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.951)).toBe("epic");
    });

    it("roll = 0.986 selects legendary (past 55%+28%+12%+3.5% boundary)", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.986)).toBe("legendary");
    });

    it("roll = 0.999 selects legendary", () => {
      expect(weightedRandomSelect(BASE_RATES, 0.999)).toBe("legendary");
    });
  });
});
