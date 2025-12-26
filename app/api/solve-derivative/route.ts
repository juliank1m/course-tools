import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { parse, derivative as mathDerivative, compile } from "mathjs";
import { latexToMathJS } from "@/app/tools/calculus/components/MathInput";

export const runtime = "nodejs";

// Normalize the user expression into a canonical math syntax using mathjs.
// This uses the same conversion logic as MathInput to ensure consistency.
function canonicalizeExpression(expression: string): {
  canonical: string;
  original: string;
} {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { canonical: trimmed, original: trimmed };
  }

  // First try parsing directly (expression should already be in mathjs format from MathInput)
  try {
    const node = parse(trimmed);
    return {
      canonical: node.toString(), // e.g. "x ^ 2 + 3 * x"
      original: trimmed,
    };
  } catch {
    // If parsing fails, it might be LaTeX format - convert using the same logic as MathInput
    try {
      const converted = latexToMathJS(trimmed);
      const node = parse(converted);
      return {
        canonical: node.toString(),
        original: trimmed,
      };
    } catch {
      // If both fail, fall back to the raw user input
      return { canonical: trimmed, original: trimmed };
    }
  }
}

// Compute the symbolic derivative and an optional numeric value at a point
// using mathjs. This gives us a trusted result independent of the AI model.
function computeDerivativeAndValue(
  canonicalExpression: string,
  point: unknown
): { derivative: string | null; valueAtPoint: number | null } {
  try {
    const node = mathDerivative(canonicalExpression, "x");
    const derivativeStr = node.toString();

    let numeric: number | null = null;
    const pointText =
      point !== undefined && point !== null && String(point).trim() !== ""
        ? String(point).trim()
        : null;

    if (pointText !== null) {
      const x0 = Number(pointText);
      if (Number.isFinite(x0)) {
        const expr = compile(derivativeStr);
        const val = expr.evaluate({ x: x0 });
        const numVal = typeof val === "number" ? val : Number(val);
        if (Number.isFinite(numVal)) {
          numeric = numVal;
        }
      }
    }

    return { derivative: derivativeStr, valueAtPoint: numeric };
  } catch {
    return { derivative: null, valueAtPoint: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { expression, point } = await request.json();

    if (!expression || typeof expression !== "string") {
      return NextResponse.json(
        { error: "Expression is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        {
          error: "AI calculus tools are currently unavailable",
          message: "Set OPENAI_API_KEY in your environment to enable this feature.",
        },
        { status: 503 }
      );
    }

    if (!apiKey.startsWith("sk-")) {
      console.error("Invalid OPENAI_API_KEY format");
      return NextResponse.json(
        {
          error: "AI calculus tools are currently unavailable",
          message: "Please check the format of your OpenAI API key.",
        },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey });

    let model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const gpt5ModelMap: Record<string, string> = {
      "gpt-5-mini": "gpt-5-mini-2025-08-07",
      "gpt5-mini": "gpt-5-mini-2025-08-07",
    };
    if (gpt5ModelMap[model.toLowerCase()]) {
      model = gpt5ModelMap[model.toLowerCase()];
    }

    const { canonical, original } = canonicalizeExpression(expression);
    const { derivative, valueAtPoint } = computeDerivativeAndValue(canonical, point);

    const pointText =
      point !== undefined && point !== null && String(point).trim() !== ""
        ? `x0 = ${String(point).trim()}`
        : "no point provided";

    const prompt = `You are a precise calculus assistant.

Given a real-valued function f(x), compute its derivative and optionally evaluate it at a point.

Original user input:
f(x) = ${original}

Canonical math syntax (parsed by mathjs, use this as the source of truth):
f(x) = ${canonical}

If available, a trusted computer algebra system (mathjs) has already computed the derivative:
${derivative ? `f'(x) = ${derivative}` : "Derivative could not be computed reliably."}

Point:
${pointText}

Return ONLY a JSON object with this exact structure:
{
  "derivative": "f'(x) expression here",
  "valueAtPoint": 1.234,          // null if no point or cannot be evaluated
  "explanation": "Short explanation of the derivative and evaluation"
}

Requirements:
- Treat the canonical expression as the authoritative definition of f(x).
- Handle exponents exactly as written (e.g., x^2 means x squared, x^(2x) means x to the 2x, etc.).
- Prefer the provided derivative from the trusted system when explaining the result.
- "derivative" should be a clean mathematical expression in terms of x (no backticks).
- If a numeric point is provided and evaluation is possible, set "valueAtPoint" to a number; otherwise use null.
- Keep "explanation" short and student-friendly.`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert calculus tutor. Always output valid JSON only and avoid extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });
    } catch (modelError: any) {
      if (
        (modelError.message?.includes("model") ||
          modelError.code === "model_not_found") &&
        model.includes("gpt-5")
      ) {
        return NextResponse.json(
          {
            error: "GPT model compatibility issue",
            message: `The model "${model}" is not available via Chat Completions. Try using "gpt-4o-mini" instead.`,
            attemptedModel: model,
          },
          { status: 400 }
        );
      }
      throw modelError;
    }

    const responseText = completion.choices[0]?.message?.content || "";
    if (!responseText) {
      console.error("Empty response from OpenAI API (solve-derivative)");
      return NextResponse.json(
        {
          error: "No response from AI model",
          details: "The API returned an empty response.",
        },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
      if (!result.derivative && !derivative) {
        throw new Error("Missing 'derivative' field in response");
      }
    } catch (parseError: any) {
      console.error("Failed to parse AI derivative response:", parseError);
      console.error("Response text:", responseText);
      return NextResponse.json(
        {
          error: "AI response parsing error",
          message: "The AI response could not be parsed as valid JSON.",
          rawResponse: responseText.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Override derivative and numeric value with our mathjs-based computation when available
    if (derivative) {
      result.derivative = derivative;
    }
    if (valueAtPoint !== null && Number.isFinite(valueAtPoint)) {
      // Round to a reasonable number of decimal places to smooth out FP noise
      const rounded = Number(valueAtPoint.toFixed(5));
      result.valueAtPoint = rounded;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenAI derivative API error:", error);

    let errorMessage = "Failed to compute derivative";
    let errorDetails = error.message || "Unknown error";

    if (error.code === "insufficient_quota" || error.error?.code === "insufficient_quota") {
      errorMessage = "OpenAI API quota exceeded";
      errorDetails =
        "Your OpenAI account has no credits remaining. Please add billing information or purchase credits.";
    } else if (
      error.status === 401 ||
      error.message?.includes("401") ||
      error.message?.includes("Unauthorized")
    ) {
      errorMessage = "Invalid API key";
      errorDetails = "Please check that your OpenAI API key is correct and has not expired.";
    } else if (
      error.status === 429 ||
      error.code === "rate_limit_exceeded" ||
      error.message?.includes("429") ||
      error.message?.includes("rate limit")
    ) {
      errorMessage = "Rate limit exceeded";
      errorDetails = "You've exceeded your OpenAI API rate limit. Please try again in a few moments.";
    } else if (error.message?.includes("model") || error.code === "model_not_found") {
      errorMessage = "Model not found";
      errorDetails = `The model "${process.env.OPENAI_MODEL || "gpt-4o-mini"}" is not available. Try using "gpt-4o-mini" instead.`;
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error";
      errorDetails = "Could not connect to OpenAI API. Check your internet connection.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: errorDetails,
        type: error.constructor?.name || "Error",
      },
      { status: 500 }
    );
  }
}


