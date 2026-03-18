/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window approach per IP address.
 *
 * NOTE: This works per-instance. If multiple Railway replicas are running,
 * each has its own counter. For most small-to-medium sites this is fine.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

/**
 * Check if a request from `ip` is within the rate limit.
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfterSeconds }`
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  cleanup()

  const now = Date.now()
  const key = ip
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start fresh
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    })
    return { allowed: true }
  }

  if (entry.count < config.limit) {
    entry.count++
    return { allowed: true }
  }

  // Over limit
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
  return { allowed: false, retryAfterSeconds }
}

/**
 * Extract client IP from Next.js request headers.
 * Railway/Cloudflare sets x-forwarded-for; fallback to a generic key.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
