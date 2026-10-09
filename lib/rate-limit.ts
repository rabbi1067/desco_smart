import "server-only";

import { headers } from "next/headers";

/**
 * In-process fixed-window rate limiter.
 *
 * SCOPE & LIMITATIONS
 * -------------------
 * State lives in this Node process's memory. That is exactly right for a single
 * long-lived instance (local dev, a single Render service) and acts as a fast,
 * zero-dependency first line of defence. On a horizontally-scaled/serverless
 * deployment (e.g. Vercel with many lambdas) each instance keeps its own
 * counters, so the effective limit is per-instance — swap `hit()` for a shared
 * store (Upstash/Redis) there. The call sites do not change; only this file.
 *
 * This complements, and never replaces, Supabase Auth's own server-side limits
 * and the database's RLS.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** Drop expired buckets occasionally so the map can't grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Records a hit against `key` and reports whether it is within `limit` per
 * `windowMs`. The first hit opens a window; subsequent hits in the same window
 * count down; once the limit is reached further hits are rejected until reset.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client identifier for rate-limit keys, taken from the proxy
 * headers set by Vercel/Render/Nginx. Falls back to a constant so a missing
 * header degrades to a shared (stricter) bucket rather than throwing.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "local";
}
