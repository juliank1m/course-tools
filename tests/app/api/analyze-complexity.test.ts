// Mock OpenAI module before imports
const mockCreate = jest.fn();
jest.mock('openai', () => {
  const mockFn = jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  });
  return mockFn;
});

import { POST } from '@/app/api/analyze-complexity/route';
import { createMockRequest, getUniqueIP } from './__testUtils__';

describe('POST /api/analyze-complexity', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'sk-test-key-12345',
      OPENAI_MODEL: 'gpt-4o-mini',
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Happy path', () => {
    it('should analyze code complexity successfully', async () => {
      const mockResponse = {
        notation: 'O(n)',
        explanation: 'Linear time complexity due to single loop',
        steps: [
          'The function contains a single loop that iterates n times',
          'Each iteration performs constant time operations',
          'Therefore, the overall complexity is O(n)',
        ],
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        { code: 'for (let i = 0; i < n; i++) { console.log(i); }' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('notation');
      expect(data).toHaveProperty('explanation');
      expect(data).toHaveProperty('steps');
      expect(data.notation).toBe('O(n)');
      expect(Array.isArray(data.steps)).toBe(true);
    });

    it('should handle different complexity notations', async () => {
      const mockResponse = {
        notation: 'O(n²)',
        explanation: 'Quadratic time complexity',
        steps: ['Nested loops', 'Each loop iterates n times', 'Total: O(n²)'],
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        {
          code: `for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              console.log(i, j);
            }
          }`,
        },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notation).toBe('O(n²)');
    });
  });

  describe('Rate limiting', () => {
    it('should rate limit after exceeding limit', async () => {
      const ip = getUniqueIP();
      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': ip }
      );

      // Make 30 requests (the limit)
      for (let i = 0; i < 30; i++) {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  notation: 'O(1)',
                  explanation: 'test',
                  steps: ['test'],
                }),
                role: 'assistant',
              },
            },
          ],
        });
        const response = await POST(request);
        expect(response.status).toBe(200);
      }

      // 31st request should be rate limited
      const rateLimitedResponse = await POST(request);
      expect(rateLimitedResponse.status).toBe(429);
      const rateLimitData = await rateLimitedResponse.json();
      expect(rateLimitData.error).toBe('Rate limit exceeded');
    });
  });

  describe('Input validation', () => {
    it('should return 400 for missing code', async () => {
      const request = createMockRequest(
        {},
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Code is required');
    });

    it('should return 400 for invalid code type', async () => {
      const request = createMockRequest(
        { code: 123 },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Code is required');
    });
  });

  describe('OpenAI API key validation', () => {
    it('should return 503 when API key is missing', async () => {
      process.env.OPENAI_API_KEY = '';
      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI analysis is currently unavailable');
    });

    it('should return 503 when API key format is invalid', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key';
      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI analysis is currently unavailable');
    });
  });

  describe('OpenAI API errors', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockCreate.mockRejectedValue({
        code: 'insufficient_quota',
        message: 'Insufficient quota',
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('OpenAI API quota exceeded');
    });

    it('should handle 401 unauthorized errors', async () => {
      mockCreate.mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid API key');
    });

    it('should handle rate limit errors from OpenAI', async () => {
      mockCreate.mockRejectedValue({
        status: 429,
        code: 'rate_limit_exceeded',
        message: 'Rate limit exceeded',
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('should handle model not found errors', async () => {
      process.env.OPENAI_MODEL = 'gpt-5-mini';
      mockCreate.mockRejectedValue({
        code: 'model_not_found',
        message: 'Model not found',
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('GPT-5 model compatibility issue');
    });

    it('should handle network errors', async () => {
      mockCreate.mockRejectedValue({
        message: 'Network error: fetch failed',
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Network error');
    });
  });

  describe('Response parsing', () => {
    it('should handle empty OpenAI response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No response from AI model');
    });

    it('should handle invalid JSON response from OpenAI', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'not valid json',
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI response parsing error');
    });

    it('should handle missing notation field in response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ explanation: 'test', steps: [] }),
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI response parsing error');
    });

    it('should extract notation from malformed JSON as fallback', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is O(n log n) complexity',
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        { code: 'console.log("test");' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      // Should attempt to extract notation from malformed response
      expect(data).toHaveProperty('fallback');
    });
  });

  describe('Response format', () => {
    it('should return properly structured response', async () => {
      const mockResponse = {
        notation: 'O(log n)',
        explanation: 'Binary search complexity',
        steps: ['Divide and conquer', 'Each step halves the search space'],
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        {
          code: `function binarySearch(arr, target) {
            let left = 0, right = arr.length - 1;
            while (left <= right) {
              const mid = Math.floor((left + right) / 2);
              if (arr[mid] === target) return mid;
              if (arr[mid] < target) left = mid + 1;
              else right = mid - 1;
            }
            return -1;
          }`,
        },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notation).toBe('O(log n)');
      expect(typeof data.explanation).toBe('string');
      expect(Array.isArray(data.steps)).toBe(true);
      expect(data.steps.length).toBeGreaterThan(0);
    });
  });
});

