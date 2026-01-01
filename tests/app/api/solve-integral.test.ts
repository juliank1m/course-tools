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

import { POST } from '@/app/api/solve-integral/route';
import { createMockRequest, getUniqueIP } from './__testUtils__';

describe('POST /api/solve-integral', () => {
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
    it('should compute indefinite integral successfully', async () => {
      const mockResponse = {
        integralExpression: '∫ x^2 dx = (x^3)/3 + C',
        value: null,
        explanation: 'The antiderivative of x^2 is (x^3)/3 + C',
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
      expect(data).toHaveProperty('integralExpression');
      expect(data).toHaveProperty('value');
      expect(data).toHaveProperty('explanation');
      expect(data.value).toBeNull();
    });

    it('should compute definite integral successfully', async () => {
      const mockResponse = {
        integralExpression: '∫_0^2 x^2 dx',
        value: 2.6666666667,
        explanation: 'The definite integral from 0 to 2',
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
        { expression: 'x^2', lower: '0', upper: '2' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('integralExpression');
      expect(data).toHaveProperty('value');
      expect(data.value).not.toBeNull();
      expect(typeof data.value).toBe('number');
    });

    it('should use numeric integration for definite integrals', async () => {
      const mockResponse = {
        integralExpression: '∫_0^1 x dx',
        value: 0.5,
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
        { expression: 'x', lower: '0', upper: '1' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Numeric integration should compute a value close to 0.5
      expect(data.value).toBeCloseTo(0.5, 4);
    });

    it('should handle one bound provided', async () => {
      const mockResponse = {
        integralExpression: '∫_0^b x^2 dx',
        value: null,
        explanation: 'Symbolic integral',
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
        { expression: 'x^2', lower: '0' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('integralExpression');
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
                content: JSON.stringify({
                  integralExpression: 'test',
                  value: null,
                  explanation: 'test',
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
    it('should return 400 for missing expression', async () => {
      const request = createMockRequest(
        { lower: '0', upper: '1' },
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

    it('should handle missing integralExpression field in response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ value: 1, explanation: 'test' }),
              role: 'assistant',
            },
          },
        ],
      });

      const request = createMockRequest(
        { expression: 'invalid-expression' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI response parsing error');
    });
  });

  describe('Numeric integration', () => {
    it('should round numeric value to 5 decimals', async () => {
      const mockResponse = {
        integralExpression: '∫_0^1 x dx',
        value: 0.5123456789,
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
        { expression: 'x', lower: '0', upper: '1' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Numeric integration should compute and round to 5 decimals
      if (data.value !== null) {
        const decimalPlaces = data.value.toString().split('.')[1]?.length || 0;
        expect(decimalPlaces).toBeLessThanOrEqual(5);
      }
    });

    it('should handle invalid bounds gracefully', async () => {
      const mockResponse = {
        integralExpression: '∫_a^b x dx',
        value: null,
        explanation: 'Symbolic',
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
        { expression: 'x', lower: 'invalid', upper: 'invalid' },
        { 'x-forwarded-for': getUniqueIP() }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should still return a response, but value might be null
      expect(data).toHaveProperty('integralExpression');
    });
  });
});

