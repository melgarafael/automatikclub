import { describe, it, expect } from "vitest";
import {
  getFragmentRewardForAction,
  calculateDiminishedReward,
} from "../services/economy-engine";
import {
  GACHA_FRAGMENT_REWARDS,
  DIMINISHING_THRESHOLD,
  DIMINISHING_CUTOFF,
  SOFT_CEILING,
} from "../constants";

describe("economy-engine: getFragmentRewardForAction", () => {
  it("returns 10 for lesson_complete", () => {
    expect(getFragmentRewardForAction("lesson_complete")).toBe(10);
  });

  it("returns 75 for module_complete", () => {
    expect(getFragmentRewardForAction("module_complete")).toBe(75);
  });

  it("returns 350 for course_complete", () => {
    expect(getFragmentRewardForAction("course_complete")).toBe(350);
  });

  it("returns 60 for weekly_challenge", () => {
    expect(getFragmentRewardForAction("weekly_challenge")).toBe(60);
  });

  it("returns 50 for badge_earned", () => {
    expect(getFragmentRewardForAction("badge_earned")).toBe(50);
  });

  it("returns 15 for community_contribution", () => {
    expect(getFragmentRewardForAction("community_contribution")).toBe(15);
  });

  it("returns first day value for daily_login (array type)", () => {
    // daily_login is [5, 5, 10, 10, 15, 15, 30] — function returns first element
    expect(getFragmentRewardForAction("daily_login")).toBe(5);
  });

  it("daily_login array matches spec (7-day cycle)", () => {
    const cycle = GACHA_FRAGMENT_REWARDS.daily_login;
    expect(cycle).toEqual([5, 5, 10, 10, 15, 15, 30]);
    expect(cycle.reduce((a, b) => a + b, 0)).toBe(90); // ~90/week per spec
  });
});

describe("economy-engine: calculateDiminishedReward", () => {
  const BASE = 10;

  describe("normal range (below threshold)", () => {
    it("returns full reward for first action of the day", () => {
      expect(calculateDiminishedReward(BASE, 0, 0)).toBe(BASE);
    });

    it("returns full reward at threshold - 1 actions", () => {
      expect(
        calculateDiminishedReward(BASE, DIMINISHING_THRESHOLD - 1, 0)
      ).toBe(BASE);
    });
  });

  describe("diminishing range (threshold to cutoff)", () => {
    it("returns half reward at exactly threshold (5th action)", () => {
      expect(
        calculateDiminishedReward(BASE, DIMINISHING_THRESHOLD, 0)
      ).toBe(Math.floor(BASE * 0.5));
    });

    it("returns half reward at cutoff - 1 actions (9th)", () => {
      expect(
        calculateDiminishedReward(BASE, DIMINISHING_CUTOFF - 1, 0)
      ).toBe(Math.floor(BASE * 0.5));
    });
  });

  describe("cutoff (zero reward)", () => {
    it("returns 0 at exactly cutoff (10th action)", () => {
      expect(
        calculateDiminishedReward(BASE, DIMINISHING_CUTOFF, 0)
      ).toBe(0);
    });

    it("returns 0 at 20th action", () => {
      expect(calculateDiminishedReward(BASE, 20, 0)).toBe(0);
    });
  });

  describe("soft ceiling (high balance)", () => {
    it("returns 0 when balance equals soft ceiling", () => {
      expect(
        calculateDiminishedReward(BASE, 0, SOFT_CEILING)
      ).toBe(0);
    });

    it("returns 0 when balance exceeds soft ceiling", () => {
      expect(
        calculateDiminishedReward(BASE, 0, SOFT_CEILING + 1000)
      ).toBe(0);
    });

    it("returns full reward when balance is just under soft ceiling", () => {
      expect(
        calculateDiminishedReward(BASE, 0, SOFT_CEILING - 1)
      ).toBe(BASE);
    });
  });

  describe("floor rounding", () => {
    it("floors odd base amounts during diminishing", () => {
      // 15 * 0.5 = 7.5 → floor to 7
      expect(
        calculateDiminishedReward(15, DIMINISHING_THRESHOLD, 0)
      ).toBe(7);
    });
  });
});
