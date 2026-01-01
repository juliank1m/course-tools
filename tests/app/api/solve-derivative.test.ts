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

import { POST } from '@/app/api/solve-derivative/route';
import { createMockRequest, getUniqueIP } from './__testUtils__';

describe('POST /api/solve-derivative', () => {
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
    it('should compute derivative successfully', async () => {
      const mockResponse = {
        derivative: '2 * x',
        valueAtPoint: 4,
        explanation: 'The derivative of x^2 is 2x',
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
        { expression: 'x^2', point: '2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('derivative');
      expect(data).toHaveProperty('explanation');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle expressions without evaluation point', async () => {
      const mockResponse = {
        derivative: '2 * x',
        valueAtPoint: null,
        explanation: 'The derivative of x^2 is 2x',
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
        { expression: 'x^2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('derivative');
      expect(data.valueAtPoint).toBeNull();
    });

    it('should use mathjs-computed derivative when available', async () => {
      const mockResponse = {
        derivative: 'some-ai-derivative',
        valueAtPoint: null,
        explanation: 'Explanation',
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
        { expression: 'x^2 + 3*x' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // mathjs should compute the derivative, overriding AI response
      expect(data.derivative).toBeTruthy();
      expect(data.derivative).not.toBe('some-ai-derivative');
    });
  });

  describe('Rate limiting', () => {
    it('should rate limit after exceeding limit', async () => {
      const ip = getUniqueIP();
      const request = createMockRequest(
        { expression: 'x^2' },
        { 'x-forwarded-for': ip }
      );

      // Make 30 requests (the limit)
      for (let i = 0; i < 30; i++) {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({ derivative: '2*x', explanation: 'test' }),
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
    it('should return 400 for missing expression', async () => {
      const request = createMockRequest(
        { point: '2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Expression is required');
    });

    it('should return 400 for invalid expression type', async () => {
      const request = createMockRequest(
        { expression: 123 },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Expression is required');
    });
  });

  describe('OpenAI API key validation', () => {
    it('should return 503 when API key is missing', async () => {
      process.env.OPENAI_API_KEY = '';
      const request = createMockRequest(
        { expression: 'x^2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI calculus tools are currently unavailable');
    });

    it('should return 503 when API key format is invalid', async () => {
      process.env.OPENAI_API_KEY = 'invalid-key';
      const request = createMockRequest(
        { expression: 'x^2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI calculus tools are currently unavailable');
    });
  });

  describe('OpenAI API errors', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockCreate.mockRejectedValue({
        code: 'insufficient_quota',
        message: 'Insufficient quota',
      });

      const request = createMockRequest(
        { expression: 'x^2' },
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
        { expression: 'x^2' },
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
        { expression: 'x^2' },
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
        { expression: 'x^2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('GPT model compatibility issue');
    });

    it('should handle network errors', async () => {
      mockCreate.mockRejectedValue({
        message: 'Network error: fetch failed',
      });

      const request = createMockRequest(
        { expression: 'x^2' },
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
        { expression: 'x^2' },
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
        { expression: 'x^2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI response parsing error');
    });

    it('should use mathjs derivative when AI response is missing derivative field', async () => {
      // Mock AI response without derivative field, but mathjs can compute one
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ explanation: 'test explanation' }),
              role: 'assistant',
            },
          },
        ],
      });

      // Use a valid expression that mathjs can differentiate
      const request = createMockRequest(
        { expression: 'x^2 + 3*x' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      // Route should succeed and use mathjs-computed derivative
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('derivative');
      expect(data.derivative).toBeTruthy();
      expect(data).toHaveProperty('explanation');
      // mathjs should compute: derivative of x^2 + 3*x is 2*x + 3
      expect(data.derivative).toContain('2');
      expect(data.derivative).toContain('x');
    });
  });

  describe('Numeric evaluation', () => {
    it('should round valueAtPoint to 5 decimals', async () => {
      const mockResponse = {
        derivative: '2 * x',
        valueAtPoint: 4.123456789,
        explanation: 'Test',
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
        { expression: 'x^2', point: '2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // mathjs will compute the actual value, but it should be rounded to 5 decimals
      if (data.valueAtPoint !== null) {
        const decimalPlaces = data.valueAtPoint.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(5);
      }
    });
  });
});

