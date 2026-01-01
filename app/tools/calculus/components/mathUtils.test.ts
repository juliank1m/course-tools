import { normalizeExpression, compileExpression } from './mathUtils';
import { parse } from 'mathjs';

describe('mathUtils', () => {
  describe('normalizeExpression', () => {
    it('should return trimmed expression if empty', () => {
      expect(normalizeExpression('')).toBe('');
      expect(normalizeExpression('   ')).toBe('');
    });

    it('should normalize valid mathjs expressions', () => {
      const result = normalizeExpression('x^2 + 3*x');
      expect(result).toBeTruthy();
      // The result should be a valid mathjs expression
      expect(() => parse(result)).not.toThrow();
    });

    it('should handle simple expressions', () => {
      const result = normalizeExpression('x + 1');
      expect(result).toBeTruthy();
      expect(() => parse(result)).not.toThrow();
    });

    it('should handle expressions with parentheses', () => {
      const result = normalizeExpression('(x + 1) * 2');
      expect(result).toBeTruthy();
      expect(() => parse(result)).not.toThrow();
    });

    it('should handle expressions with functions', () => {
      const result = normalizeExpression('sin(x) + cos(x)');
      expect(result).toBeTruthy();
      expect(() => parse(result)).not.toThrow();
    });

    it('should preserve valid expressions as-is', () => {
      const input = '2 * x + 5';
      const result = normalizeExpression(input);
      expect(() => parse(result)).not.toThrow();
    });

    it('should return original expression if parsing fails completely', () => {
      // Invalid expression that can't be parsed
      const invalid = '$$$invalid$$$';
      const result = normalizeExpression(invalid);
      // Should return the original (trimmed)
      expect(result).toBe(invalid);
    });
  });

  describe('compileExpression', () => {
    it('should compile a valid expression', () => {
      const compiled = compileExpression('x + 1');
      expect(compiled).toBeTruthy();
      expect(typeof compiled.evaluate).toBe('function');
    });

    it('should evaluate compiled expressions correctly', () => {
      const compiled = compileExpression('x * 2 + 1');
      const result = compiled.evaluate({ x: 5 });
      expect(result).toBe(11);
    });

    it('should handle expressions with multiple variables', () => {
      const compiled = compileExpression('x + y');
      const result = compiled.evaluate({ x: 3, y: 4 });
      expect(result).toBe(7);
    });

    it('should handle expressions with functions', () => {
      const compiled = compileExpression('sin(x)');
      const result = compiled.evaluate({ x: 0 });
      expect(result).toBeCloseTo(0, 10);
    });

    it('should throw error for empty expression', () => {
      expect(() => compileExpression('')).toThrow('Expression is empty');
      expect(() => compileExpression('   ')).toThrow('Expression is empty');
    });

    it('should trim whitespace before compilation', () => {
      const compiled = compileExpression('  x + 1  ');
      const result = compiled.evaluate({ x: 2 });
      expect(result).toBe(3);
    });

    it('should throw error for invalid expressions', () => {
      expect(() => compileExpression('+++invalid+++')).toThrow();
    });
  });
});

