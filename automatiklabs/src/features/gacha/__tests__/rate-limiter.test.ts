import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  resetAllRateLimits,
  resetRateLimit,
  getRateLimitInfo,
} from "../middleware/rate-limiter";

describe("gacha rate-limiter", () => {
  beforeEach(() => {
    resetAllRateLimits();
    vi.restoreAllMocks();
  });

  describe("first request", () => {
    it("allows first request for new user", () => {
      const result = checkRateLimit("user-1", "gacha_pull");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });
  });

  describe("burst protection (1 req/sec)", () => {
    it("blocks second request within same millisecond", () => {
      checkRateLimit("user-1", "gacha_pull");
      const second = checkRateLimit("user-1", "gacha_pull");
      expect(second.allowed).toBe(false);
      expect(second.retryAfter).toBeGreaterThan(0);
    });

    it("allows request after 1 second cooldown", () => {
      const now = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(now);

      checkRateLimit("user-1", "gacha_pull");

      // Advance time by 1001ms
      vi.spyOn(Date, "now").mockReturnValue(now + 1001);

      const result = checkRateLimit("user-1", "gacha_pull");
      expect(result.allowed).toBe(true);
    });
  });

  describe("daily quota (100/day)", () => {
    it("blocks 101st request in same day window", () => {
      const now = Date.now();
      let tick = 0;
      vi.spyOn(Date, "now").mockImplementation(() => now + tick);

      // Exhaust 100 requests, each 1.1s apart
      for (let i = 0; i < 100; i++) {
        tick = i * 1100;
        const result = checkRateLimit("user-1", "gacha_pull");
        expect(result.allowed).toBe(true);
      }

      // 101st request
      tick = 100 * 1100;
      const blocked = checkRateLimit("user-1", "gacha_pull");
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });
  });

  describe("isolation", () => {
    it("isolates different users", () => {
      checkRateLimit("user-1", "gacha_pull");
      const result = checkRateLimit("user-2", "gacha_pull");
      expect(result.allowed).toBe(true);
    });

    it("isolates different actions for same user", () => {
      checkRateLimit("user-1", "gacha_pull");
      const result = checkRateLimit("user-1", "marketplace");
      expect(result.allowed).toBe(true);
    });
  });

  describe("reset helpers", () => {
    it("resetRateLimit clears specific user+action", () => {
      checkRateLimit("user-1", "gacha_pull");
      resetRateLimit("user-1", "gacha_pull");

      const info = getRateLimitInfo("user-1", "gacha_pull");
      expect(info.remaining).toBe(100);
    });

    it("resetAllRateLimits clears all state", () => {
      checkRateLimit("user-1", "gacha_pull");
      checkRateLimit("user-2", "marketplace");
      resetAllRateLimits();

      expect(getRateLimitInfo("user-1", "gacha_pull").remaining).toBe(100);
      expect(getRateLimitInfo("user-2", "marketplace").remaining).toBe(100);
    });
  });

  describe("getRateLimitInfo", () => {
    it("returns full quota for unknown user", () => {
      const info = getRateLimitInfo("unknown", "gacha_pull");
      expect(info.remaining).toBe(100);
      expect(info.resetInSeconds).toBe(0);
    });

    it("returns remaining count after requests", () => {
      const now = Date.now();
      let tick = 0;
      vi.spyOn(Date, "now").mockImplementation(() => now + tick);

      checkRateLimit("user-1", "gacha_pull"); // count=1
      tick = 1100;
      checkRateLimit("user-1", "gacha_pull"); // count=2
      tick = 2200;
      checkRateLimit("user-1", "gacha_pull"); // count=3

      const info = getRateLimitInfo("user-1", "gacha_pull");
      expect(info.remaining).toBe(97);
    });
  });
});
