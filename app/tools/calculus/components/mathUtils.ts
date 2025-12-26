import { parse, compile } from "mathjs";
import { latexToMathJS } from "./MathInput";

/**
 * Normalize an expression to ensure it's in mathjs-compatible format.
 * This function ensures consistent parsing across all calculators.
 * 
 * If the expression is already in mathjs format (from MathInput), it will be validated.
 * If it's in LaTeX format, it will be converted using the same logic as MathInput.
 * 
 * @param expression - The expression to normalize (can be LaTeX or mathjs format)
 * @returns The normalized expression in mathjs format
 */
export function normalizeExpression(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return trimmed;

  // First, try to parse it as-is (it might already be in mathjs format from MathInput)
  try {
    const node = parse(trimmed);
    // If parsing succeeds, return the canonical form
    return node.toString();
  } catch {
    // If parsing fails, it might be LaTeX format - convert it using the same logic as MathInput
    try {
      const converted = latexToMathJS(trimmed);
      // Try parsing the converted version
      const node = parse(converted);
      return node.toString();
    } catch {
      // If both fail, return the original (might be invalid, but let the caller handle it)
      return trimmed;
    }
  }
}

/**
 * Compile an expression for evaluation, ensuring consistent conversion.
 * This is the same approach used in GraphingCalculator.
 * 
 * @param expression - The expression to compile (should be in mathjs format from MathInput)
 * @returns A compiled expression ready for evaluation
 */
export function compileExpression(expression: string) {
  const expr = expression.trim();
  if (!expr) {
    throw new Error("Expression is empty");
  }
  return compile(expr);
}

