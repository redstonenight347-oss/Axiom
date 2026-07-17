/**
 * Centralized rate-limit configuration.
 *
 * These values are reasonable defaults for a small-to-medium deployment.
 * Tune them based on observed traffic and infrastructure capacity.
 *
 * For a distributed production setup, replace the in-memory store in
 * lib/rate-limit.ts with Upstash Redis + @upstash/ratelimit.
 */

export interface RouteRateLimitConfig {
  /** Human-readable route category. */
  name: string;
  /** Max requests allowed in the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

export const rateLimits = {
  /** Streaming chat endpoint — expensive AI calls. */
  chat: {
    name: "chat",
    limit: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  } satisfies RouteRateLimitConfig,

  /** PDF upload + embedding generation — CPU/storage heavy. */
  upload: {
    name: "upload",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 5 uploads per hour
  } satisfies RouteRateLimitConfig,

  /** Chat list / chat detail / delete endpoints. */
  chats: {
    name: "chats",
    limit: 60,
    windowMs: 60 * 1000, // 60 requests per minute
  } satisfies RouteRateLimitConfig,

  /** Better Auth endpoints — protect against brute force / signup abuse. */
  auth: {
    name: "auth",
    limit: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  } satisfies RouteRateLimitConfig,
} as const;

export type RateLimitCategory = keyof typeof rateLimits;
