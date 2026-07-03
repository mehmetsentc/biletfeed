import { Redis } from '@upstash/redis';

let cached: Redis | null | undefined;

export function getRedisClient(): Redis | null {
  if (cached !== undefined) return cached;

  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    cached = null;
    return null;
  }

  cached = new Redis({ url, token });
  return cached;
}

/** @deprecated Yeni kod `getRedisClient()` kullanmalı. */
export const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? ''
});
