// ── In-memory sliding window rate limiter ──
// Reusable across API routes. Each route creates its own limiter instance.
// For distributed deployments, replace with @upstash/ratelimit + Redis.

interface RateLimiterConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

const stores = new Map<string, Map<string, number[]>>();

export function createRateLimiter(name: string, config: RateLimiterConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const timestamps = store.get(key) ?? [];
    const recent = timestamps.filter((t) => t > windowStart);

    if (recent.length >= config.limit) {
      store.set(key, recent);
      const oldestInWindow = recent[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: oldestInWindow + config.windowMs - now,
      };
    }

    recent.push(now);
    store.set(key, recent);

    return {
      allowed: true,
      remaining: config.limit - recent.length,
      retryAfterMs: 0,
    };
  };
}
