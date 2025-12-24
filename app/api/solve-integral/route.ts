import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { parse, compile } from "mathjs";

export const runtime = "nodejs";

// Normalize the user expression into a canonical math syntax using mathjs.
// This helps avoid ambiguity with exponents and implicit multiplication.
function canonicalizeExpression(expression: string): {
  canonical: string;
  original: string;
} {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { canonical: trimmed, original: trimmed };
  }

  try {
    const node = parse(trimmed);
    return {
      canonical: node.toString(),
      original: trimmed,
    };
  } catch {
    // If parsing fails, fall back to the raw user input
    return { canonical: trimmed, original: trimmed };
  }
}

// Numeric definite integral using the composite trapezoidal rule.
// This is used to compute a reliable numeric value for definite integrals,
// independent of the AI model.
function computeNumericDefiniteIntegral(
  canonicalExpression: string,
  a: number,
  b: number
): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a === b) return 0;

  try {
    const expr = compile(canonicalExpression);
    const f = (x: number): number => {
      const v = expr.evaluate({ x });
      return typeof v === "number" ? v : Number(v);
    };

    const n = 2000; // number of subintervals
    const h = (b - a) / n;
    let sum = 0.5 * (f(a) + f(b));

    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += f(x);
    }

    const result = sum * h;
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { expression, lower, upper } = await request.json();

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

    const hasLower = lower !== undefined && lower !== null && String(lower).trim() !== "";
    const hasUpper = upper !== undefined && upper !== null && String(upper).trim() !== "";

    let numericValue: number | null = null;
    if (hasLower && hasUpper) {
      const lowerNum = Number(String(lower).trim());
      const upperNum = Number(String(upper).trim());
      if (Number.isFinite(lowerNum) && Number.isFinite(upperNum)) {
        numericValue = computeNumericDefiniteIntegral(canonical, lowerNum, upperNum);
      }
    }

    let prompt: string;

    if (!hasLower && !hasUpper) {
      // Indefinite integral (no bounds provided)
      prompt = `You are a precise calculus assistant.

Given a real-valued function f(x), compute its indefinite integral (antiderivative).

Original user input:
f(x) = ${original}

Canonical math syntax (parsed by mathjs, use this as the source of truth):
f(x) = ${canonical}

Return ONLY a JSON object with this exact structure:
{
  "integralExpression": "Integral expression in math notation, e.g. ∫ f(x) dx = F(x) + C",
  "value": null,
  "explanation": "Short explanation that this is an indefinite integral and how it was obtained"
}

Requirements:
- Treat the canonical expression as the authoritative definition of f(x).
- Handle exponents exactly as written (e.g., x^2 means x squared, x^(2x) means x to the 2x, etc.).
- Provide an antiderivative F(x) such that F'(x) = f(x).
- Always include the + C constant of integration in the expression.
- Set "value" to null for indefinite integrals.
- Keep "explanation" short and student-friendly.`;
    } else {
      // Definite integral (at least one bound provided)
      const lowerText = hasLower ? String(lower).trim() : "a";
      const upperText = hasUpper ? String(upper).trim() : "b";

      prompt = `You are a precise calculus assistant.

Given a real-valued function f(x), compute a definite integral over the given bounds and give a clean result.

Original user input:
f(x) = ${original}

Canonical math syntax (parsed by mathjs, use this as the source of truth):
f(x) = ${canonical}

Bounds:
Lower = ${lowerText}
Upper = ${upperText}

Return ONLY a JSON object with this exact structure:
{
  "integralExpression": "Integral expression here (in math notation, e.g. ∫_${lowerText}^${upperText} x^2 dx)",
  "value": 1.2345678901,          // numeric approximation, or null if symbolic only
  "explanation": "Short explanation of the result and any approximations"
}

Requirements:
- Use ${lowerText} and ${upperText} as the limits of integration.
- If you can compute a numeric value, set "value" to a number with at least 10 significant digits (do NOT round to just 2–3 decimals). You may assume that any high-precision numeric value you compute should closely match a trusted numeric integrator.
- Keep "explanation" short and student-friendly.
- If one or both bounds are symbolic (like a, b, π), give the most informative expression you can.`;
    }

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: 350,
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
      console.error("Empty response from OpenAI API (solve-integral)");
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
      if (!result.integralExpression) {
        throw new Error("Missing 'integralExpression' field in response");
      }
    } catch (parseError: any) {
      console.error("Failed to parse AI integral response:", parseError);
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

    // Override the numeric value with our own high-precision numeric integration
    // when both bounds are numeric and the computation succeeded.
    if (numericValue !== null && Number.isFinite(numericValue)) {
      // Round to a reasonable number of decimal places to smooth out FP noise.
      // 5 decimals is usually enough to agree visually with simple fractions like 1/3.
      const rounded = Number(numericValue.toFixed(5));
      result.value = rounded;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenAI integral API error:", error);

    let errorMessage = "Failed to compute integral";
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


