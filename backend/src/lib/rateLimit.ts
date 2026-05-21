import type { Context, Next, Env } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

type KeyFn<E extends Env> = (c: Context<E>) => string;

/**
 * Creates a Hono middleware that rate-limits by a caller-supplied key.
 * In test environments (NODE_ENV=test) the limiter is a no-op.
 */
export function createRateLimiter<E extends Env>(
  limit: number,
  windowMs: number,
  getKey: KeyFn<E>,
) {
  const hits = new Map<string, RateLimitEntry>();

  return async (c: Context<E>, next: Next) => {
    if (process.env.NODE_ENV === "test") return next();

    const key = getKey(c);
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > limit) {
      return c.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." } },
        429,
      );
    }
    return next();
  };
}
