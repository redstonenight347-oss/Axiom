import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * NOTE: This implementation stores counters in process memory. It works well
 * for a single Node.js instance / development, but it will NOT share state
 * across serverless invocations, load-balanced instances, or container restarts.
 *
 * For production deployments, replace this with a distributed store such as
 * Upstash Redis + @upstash/ratelimit:
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *
 *   const redis = new Redis({
 *     url: process.env.UPSTASH_REDIS_REST_URL!,
 *     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 *   });
 *
 *   const ratelimit = new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(10, "1 m"),
 *     analytics: true,
 *   });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Unique identifier for the caller (e.g. userId or IP). */
  key: string;
  /** Maximum number of requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/**
 * Check whether a request is within the allowed rate limit.
 * Uses a fixed-window counter stored in memory.
 */
export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowMs;
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start a new window.
    const result: RateLimitEntry = { count: 1, resetAt };
    store.set(key, result);
    return { success: true, limit, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Build standard rate-limit headers for a successful or throttled response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * Create a 429 Too Many Requests response with retry info.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/**
 * Extract a client identifier from a NextRequest.
 * Prefers the authenticated user id, falling back to the request IP.
 */
export function getClientIdentifier(req: NextRequest, userId?: string | null): string {
  if (userId) return `user:${userId}`;

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  return `ip:${ip}`;
}
