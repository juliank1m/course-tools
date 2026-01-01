import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest for testing API routes
 */
export function createMockRequest(
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const headerMap = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    headerMap.set(key, value);
  });

  return {
    headers: headerMap,
    json: async () => body || {},
  } as NextRequest;
}


/**
 * Gets a unique IP address for rate limiting tests
 */
let ipCounter = 1;
export function getUniqueIP(): string {
  return `192.168.1.${ipCounter++}`;
}

