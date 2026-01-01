import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production with multiple instances, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  lastCleanup = now;

  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers (in order of preference)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address (if available)
  const remoteAddr = request.headers.get("x-vercel-forwarded-for");
  if (remoteAddr) {
    return remoteAddr.split(",")[0].trim();
  }

  // Last resort: use a default key (less ideal, but better than nothing)
  return "unknown";
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed */
  maxRequests?: number;
  /** Time window in seconds */
  windowSeconds?: number;
}

const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  maxRequests: 30,
  windowSeconds: 900, // 15 minutes
};

// Global rate limit configuration shared across all OpenAI API endpoints
export const GLOBAL_RATE_LIMIT = {
  maxRequests: 30,
  windowSeconds: 900, // 15 minutes
};

/**
 * Rate limit middleware for API routes
 * Returns null if allowed, or a NextResponse with 429 status if rate limited
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  cleanupOldEntries();

  const { maxRequests, windowSeconds } = { ...DEFAULT_OPTIONS, ...options };
  const ip = getClientIP(request);
  const now = Date.now();
  const resetTime = now + windowSeconds * 1000;

  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // New entry or expired entry, start fresh
    rateLimitStore.set(ip, { count: 1, resetTime });
    return null; // Allow request
  }

  if (entry.count >= maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
        },
      }
    );
  }

  // Increment count
  entry.count++;
  return null; // Allow request
}

/**
 * Global rate limit function for OpenAI API endpoints
 * All endpoints share the same rate limit (30 requests per 15 minutes per IP across all endpoints)
 */
export function globalRateLimit(request: NextRequest): NextResponse | null {
  return rateLimit(request, GLOBAL_RATE_LIMIT);
}

