import { describe, it, expect } from "vitest";
import { calculateEffectiveRate } from "../services/pity-engine";

describe("pity-engine: calculateEffectiveRate", () => {
  // Legendary: base 1.5%, soft_start=60, hard_pity=80
  const LEGENDARY_BASE = 0.015;
  const LEGENDARY_SOFT = 60;
  const LEGENDARY_HARD = 80;

  // Epic: base 3.5%, soft_start=30, hard_pity=40
  const EPIC_BASE = 0.035;
  const EPIC_SOFT = 30;
  const EPIC_HARD = 40;

  describe("before soft pity", () => {
    it("returns base rate at pull_count = 0", () => {
      expect(
        calculateEffectiveRate(LEGENDARY_BASE, 0, LEGENDARY_SOFT, LEGENDARY_HARD)
      ).toBe(LEGENDARY_BASE);
    });

    it("returns base rate at pull_count = 1", () => {
      expect(
        calculateEffectiveRate(LEGENDARY_BASE, 1, LEGENDARY_SOFT, LEGENDARY_HARD)
      ).toBe(LEGENDARY_BASE);
    });

    it("returns base rate at pull_count = soft_start - 1 (59)", () => {
      expect(
        calculateEffectiveRate(LEGENDARY_BASE, 59, LEGENDARY_SOFT, LEGENDARY_HARD)
      ).toBe(LEGENDARY_BASE);
    });
  });

  describe("soft pity zone (linear interpolation)", () => {
    it("starts increasing at pull_count = soft_start (60)", () => {
      const rate = calculateEffectiveRate(
        LEGENDARY_BASE, 60, LEGENDARY_SOFT, LEGENDARY_HARD
      );
      // progress = (60-60)/(80-60) = 0 → rate = 0.015 + 0*(1-0.015) = 0.015
      expect(rate).toBe(LEGENDARY_BASE);
    });

    it("increases linearly at pull_count = 70 (midpoint)", () => {
      const rate = calculateEffectiveRate(
        LEGENDARY_BASE, 70, LEGENDARY_SOFT, LEGENDARY_HARD
      );
      // progress = (70-60)/(80-60) = 0.5 → rate = 0.015 + 0.5*0.985 = 0.5075
      expect(rate).toBeCloseTo(0.5075, 4);
    });

    it("approaches 100% at pull_count = hard_pity - 1 (79)", () => {
      const rate = calculateEffectiveRate(
        LEGENDARY_BASE, 79, LEGENDARY_SOFT, LEGENDARY_HARD
      );
      // progress = (79-60)/(80-60) = 0.95 → rate = 0.015 + 0.95*0.985 = 0.95075
      expect(rate).toBeCloseTo(0.95075, 4);
    });
  });

  describe("hard pity (guaranteed)", () => {
    it("returns 100% at exactly hard_pity (80)", () => {
      expect(
        calculateEffectiveRate(LEGENDARY_BASE, 80, LEGENDARY_SOFT, LEGENDARY_HARD)
      ).toBe(1.0);
    });

    it("returns 100% beyond hard_pity (90)", () => {
      expect(
        calculateEffectiveRate(LEGENDARY_BASE, 90, LEGENDARY_SOFT, LEGENDARY_HARD)
      ).toBe(1.0);
    });
  });

  describe("epic rarity pity (different thresholds)", () => {
    it("returns base rate before soft pity (pull 29)", () => {
      expect(
        calculateEffectiveRate(EPIC_BASE, 29, EPIC_SOFT, EPIC_HARD)
      ).toBe(EPIC_BASE);
    });

    it("increases at soft_start (pull 30)", () => {
      const rate = calculateEffectiveRate(EPIC_BASE, 30, EPIC_SOFT, EPIC_HARD);
      // progress = 0 → base rate
      expect(rate).toBe(EPIC_BASE);
    });

    it("increases at pull 35 (midpoint-ish)", () => {
      const rate = calculateEffectiveRate(EPIC_BASE, 35, EPIC_SOFT, EPIC_HARD);
      // progress = (35-30)/(40-30) = 0.5 → rate = 0.035 + 0.5*0.965 = 0.5175
      expect(rate).toBeCloseTo(0.5175, 4);
    });

    it("guarantees at hard pity (pull 40)", () => {
      expect(
        calculateEffectiveRate(EPIC_BASE, 40, EPIC_SOFT, EPIC_HARD)
      ).toBe(1.0);
    });
  });

  describe("edge cases", () => {
    it("handles base rate of 0", () => {
      // progress = 0.5 → rate = 0 + 0.5*(1-0) = 0.5
      expect(calculateEffectiveRate(0, 70, 60, 80)).toBeCloseTo(0.5, 4);
    });

    it("handles soft_start === hard_pity (no soft pity zone)", () => {
      // pull_count >= hardPity → 1.0
      expect(calculateEffectiveRate(0.015, 50, 50, 50)).toBe(1.0);
    });
  });
});
