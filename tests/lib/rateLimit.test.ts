import { rateLimit, globalRateLimit, GLOBAL_RATE_LIMIT } from '@/app/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextRequest constructor
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  const headerMap = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headerMap.set(key, value);
  });

  return {
    headers: headerMap,
  } as NextRequest;
}

describe('rateLimit', () => {
  // Use unique IPs for each test to avoid interference from shared in-memory store
  let ipCounter = 1;
  
  function getUniqueIP(): string {
    return `192.168.1.${ipCounter++}`;
  }

  describe('rate limiting logic', () => {
    it('should allow requests within the limit', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });
      const options = { maxRequests: 5, windowSeconds: 1 }; // 1 second window for faster tests

      // Make 5 requests (should all be allowed)
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(request, options);
        expect(result).toBeNull();
      }
    });

    it('should rate limit after exceeding max requests', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });
      const options = { maxRequests: 3, windowSeconds: 1 };

      // Make 3 requests (should be allowed)
      for (let i = 0; i < 3; i++) {
        const result = rateLimit(request, options);
        expect(result).toBeNull();
      }

      // 4th request should be rate limited
      const result = rateLimit(request, options);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(NextResponse);
      if (result) {
        expect(result.status).toBe(429);
      }
    });

    it('should reset after window expires', async () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });
      const options = { maxRequests: 2, windowSeconds: 1 }; // 1 second window

      // Make 2 requests (should be allowed)
      rateLimit(request, options);
      rateLimit(request, options);

      // 3rd request should be rate limited
      let result = rateLimit(request, options);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Request should be allowed again
      result = rateLimit(request, options);
      expect(result).toBeNull();
    });
  });

  describe('IP address extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });
      const options = { maxRequests: 1, windowSeconds: 1 };

      // First request should be allowed
      expect(rateLimit(request, options)).toBeNull();

      // Second request should be rate limited
      expect(rateLimit(request, options)?.status).toBe(429);
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': `${ip}, 10.0.0.1` });
      const options = { maxRequests: 1, windowSeconds: 1 };

      expect(rateLimit(request, options)).toBeNull();
      expect(rateLimit(request, options)?.status).toBe(429);
    });

    it('should fall back to x-real-ip header', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-real-ip': ip });
      const options = { maxRequests: 1, windowSeconds: 1 };

      expect(rateLimit(request, options)).toBeNull();
      expect(rateLimit(request, options)?.status).toBe(429);
    });

    it('should fall back to x-vercel-forwarded-for header', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-vercel-forwarded-for': ip });
      const options = { maxRequests: 1, windowSeconds: 1 };

      expect(rateLimit(request, options)).toBeNull();
      expect(rateLimit(request, options)?.status).toBe(429);
    });

    it('should use "unknown" as fallback when no IP headers are present', () => {
      // Use a unique identifier to avoid conflicts with other "unknown" tests
      const request = createMockRequest({});
      const options = { maxRequests: 1, windowSeconds: 1 };

      // Both requests from "unknown" IP should share the same limit
      expect(rateLimit(request, options)).toBeNull();
      expect(rateLimit(request, options)?.status).toBe(429);
    });
  });

  describe('rate limit response headers', () => {
    it('should include proper headers in rate limit response', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });
      const options = { maxRequests: 1, windowSeconds: 1 };

      // First request allowed
      rateLimit(request, options);

      // Second request rate limited
      const response = rateLimit(request, options);
      expect(response).not.toBeNull();
      if (response) {
        expect(response.headers.get('Retry-After')).toBeTruthy();
        expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
      }
    });

    it('should include retry-after in response body', async () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });
      const options = { maxRequests: 1, windowSeconds: 1 };

      rateLimit(request, options);
      const response = rateLimit(request, options);
      
      expect(response).not.toBeNull();
      if (response) {
        const body = await response.json();
        expect(body.error).toBe('Rate limit exceeded');
        expect(body.retryAfter).toBeGreaterThan(0);
        expect(body.retryAfter).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('default options', () => {
    it('should use default options when none provided', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });

      // Default is 30 requests per 15 minutes
      // Make 30 requests (should all be allowed)
      for (let i = 0; i < 30; i++) {
        const result = rateLimit(request);
        expect(result).toBeNull();
      }

      // 31st request should be rate limited
      const result = rateLimit(request);
      expect(result?.status).toBe(429);
    });
  });

  describe('globalRateLimit', () => {
    it('should use GLOBAL_RATE_LIMIT configuration', () => {
      const ip = getUniqueIP();
      const request = createMockRequest({ 'x-forwarded-for': ip });

      // Make requests up to the global limit
      for (let i = 0; i < GLOBAL_RATE_LIMIT.maxRequests; i++) {
        const result = globalRateLimit(request);
        expect(result).toBeNull();
      }

      // Next request should be rate limited
      const result = globalRateLimit(request);
      expect(result?.status).toBe(429);
    });
  });

  describe('different IP addresses', () => {
    it('should track rate limits separately for different IPs', () => {
      const ip1 = getUniqueIP();
      const ip2 = getUniqueIP();
      const request1 = createMockRequest({ 'x-forwarded-for': ip1 });
      const request2 = createMockRequest({ 'x-forwarded-for': ip2 });
      const options = { maxRequests: 2, windowSeconds: 1 };

      // Both IPs should have separate limits
      rateLimit(request1, options);
      rateLimit(request1, options);
      expect(rateLimit(request1, options)?.status).toBe(429);

      // Second IP should still have requests available
      expect(rateLimit(request2, options)).toBeNull();
      expect(rateLimit(request2, options)).toBeNull();
      expect(rateLimit(request2, options)?.status).toBe(429);
    });
  });
});

