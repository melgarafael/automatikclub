// =============================================
// Gacha Rate Limiter — In-Memory Implementation
// Max 1 pull/second, max 100 pulls/day per user.
// Production: swap for Upstash @upstash/ratelimit
// when Redis is available.
// =============================================

interface RateLimitEntry {
  /** Timestamp of last request (ms) */
  lastRequestMs: number;
  /** Requests in the current day window */
  dayCount: number;
  /** Start of the current day window (ms) */
  dayWindowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Seconds until next allowed request */
  retryAfter?: number;
  /** Remaining requests in daily quota */
  remaining?: number;
}

// -- Configuration --

const LIMITS = {
  /** Minimum interval between pulls (ms) */
  burstIntervalMs: 1_000,
  /** Maximum pulls per day */
  dailyMax: 100,
  /** Day window duration (ms) */
  dayWindowMs: 24 * 60 * 60 * 1_000,
  /** Cleanup entries older than this (ms) */
  gcThresholdMs: 2 * 24 * 60 * 60 * 1_000,
} as const;

// -- Storage --

const store = new Map<string, RateLimitEntry>();

/** Periodic cleanup of stale entries (every 10 min) */
let gcInterval: ReturnType<typeof setInterval> | null = null;

function ensureGc(): void {
  if (gcInterval) return;
  gcInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.dayWindowStart > LIMITS.gcThresholdMs) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1_000);
  // Allow process to exit cleanly
  if (typeof gcInterval === "object" && "unref" in gcInterval) {
    gcInterval.unref();
  }
}

// -- Key helpers --

function makeKey(userId: string, action: string): string {
  return `${action}:${userId}`;
}

// -- Public API --

/**
 * Check if a user action is within rate limits.
 * Call BEFORE executing the action. Non-blocking, O(1).
 */
export function checkRateLimit(
  userId: string,
  action: string
): RateLimitResult {
  ensureGc();

  const key = makeKey(userId, action);
  const now = Date.now();
  const entry = store.get(key);

  // First request ever for this user+action
  if (!entry) {
    store.set(key, {
      lastRequestMs: now,
      dayCount: 1,
      dayWindowStart: now,
    });
    return { allowed: true, remaining: LIMITS.dailyMax - 1 };
  }

  // Reset day window if expired
  if (now - entry.dayWindowStart >= LIMITS.dayWindowMs) {
    entry.dayCount = 0;
    entry.dayWindowStart = now;
  }

  // Check burst (1 req/sec)
  const elapsed = now - entry.lastRequestMs;
  if (elapsed < LIMITS.burstIntervalMs) {
    const retryAfter = Math.ceil(
      (LIMITS.burstIntervalMs - elapsed) / 1_000
    );
    return {
      allowed: false,
      retryAfter,
      remaining: LIMITS.dailyMax - entry.dayCount,
    };
  }

  // Check daily quota
  if (entry.dayCount >= LIMITS.dailyMax) {
    const retryAfter = Math.ceil(
      (entry.dayWindowStart + LIMITS.dayWindowMs - now) / 1_000
    );
    return { allowed: false, retryAfter, remaining: 0 };
  }

  // Allow
  entry.lastRequestMs = now;
  entry.dayCount += 1;

  return { allowed: true, remaining: LIMITS.dailyMax - entry.dayCount };
}

/**
 * Reset rate limit state for a user+action. Useful for testing.
 */
export function resetRateLimit(userId: string, action: string): void {
  store.delete(makeKey(userId, action));
}

/**
 * Clear all rate limit state. Useful for testing.
 */
export function resetAllRateLimits(): void {
  store.clear();
}

/**
 * Get current rate limit info without consuming a request.
 */
export function getRateLimitInfo(
  userId: string,
  action: string
): { remaining: number; resetInSeconds: number } {
  const key = makeKey(userId, action);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    return { remaining: LIMITS.dailyMax, resetInSeconds: 0 };
  }

  // Reset day window if expired
  if (now - entry.dayWindowStart >= LIMITS.dayWindowMs) {
    return { remaining: LIMITS.dailyMax, resetInSeconds: 0 };
  }

  return {
    remaining: Math.max(0, LIMITS.dailyMax - entry.dayCount),
    resetInSeconds: Math.ceil(
      (entry.dayWindowStart + LIMITS.dayWindowMs - now) / 1_000
    ),
  };
}
