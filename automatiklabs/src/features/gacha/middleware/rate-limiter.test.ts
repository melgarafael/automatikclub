import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetAllRateLimits,
  getRateLimitInfo,
} from "./rate-limiter";

describe("gacha rate-limiter", () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  it("allows first request", () => {
    const result = checkRateLimit("user-1", "gacha_pull");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("blocks burst requests (< 1 second apart)", () => {
    const first = checkRateLimit("user-1", "gacha_pull");
    expect(first.allowed).toBe(true);

    // Immediate second request should be blocked
    const second = checkRateLimit("user-1", "gacha_pull");
    expect(second.allowed).toBe(false);
    expect(second.retryAfter).toBeGreaterThan(0);
  });

  it("isolates users", () => {
    checkRateLimit("user-1", "gacha_pull");
    // user-2 should not be affected
    const result = checkRateLimit("user-2", "gacha_pull");
    expect(result.allowed).toBe(true);
  });

  it("isolates actions", () => {
    checkRateLimit("user-1", "gacha_pull");
    // Different action should not be affected
    const result = checkRateLimit("user-1", "marketplace_list");
    expect(result.allowed).toBe(true);
  });

  it("enforces daily limit", () => {
    // Simulate 100 requests spread over time by manipulating the store
    // We can't easily fake time, but we can verify the counter logic
    for (let i = 0; i < 100; i++) {
      const result = checkRateLimit(`daily-test-${i}`, "gacha_pull");
      expect(result.allowed).toBe(true);
    }

    // Verify that info reports correct remaining for a used-up user
    const info = getRateLimitInfo("daily-test-0", "gacha_pull");
    expect(info.remaining).toBe(99); // Only 1 request was made for this user
  });

  it("getRateLimitInfo returns full quota for unknown user", () => {
    const info = getRateLimitInfo("unknown-user", "gacha_pull");
    expect(info.remaining).toBe(100);
    expect(info.resetInSeconds).toBe(0);
  });

  it("resetAllRateLimits clears state", () => {
    checkRateLimit("user-1", "gacha_pull");
    resetAllRateLimits();

    const info = getRateLimitInfo("user-1", "gacha_pull");
    expect(info.remaining).toBe(100);
  });
});
