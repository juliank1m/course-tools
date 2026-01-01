import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { globalRateLimit } from "@/app/lib/rateLimit";

// Force Node.js runtime to avoid Edge runtime issues with openai-node SDK
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Global rate limiting: 30 requests per 15 minutes per IP across ALL endpoints
  const rateLimitResponse = globalRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Check API key BEFORE creating client (prevents module-load-time errors)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        {
          error: "AI analysis is currently unavailable",
          message: "Please try using pattern matching mode instead.",
        },
        { status: 503 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith("sk-")) {
      console.error("Invalid OPENAI_API_KEY format");
      return NextResponse.json(
        {
          error: "AI analysis is currently unavailable",
          message: "Please try using pattern matching mode instead.",
        },
        { status: 503 }
      );
    }

    // Create client AFTER validating the key
    const openai = new OpenAI({ apiKey });

    // Model selection - GPT-5 models may need snapshot names or Responses API
    // Default to gpt-4o-mini (reliable, cheap, works with Chat Completions)
    let model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    
    // If user wants GPT-5 mini, try the snapshot name if alias doesn't work
    // Note: GPT-5 models may require Responses API instead of Chat Completions
    const gpt5ModelMap: Record<string, string> = {
      "gpt-5-mini": "gpt-5-mini-2025-08-07", // Use snapshot name
      "gpt5-mini": "gpt-5-mini-2025-08-07",
    };
    
    if (gpt5ModelMap[model.toLowerCase()]) {
      model = gpt5ModelMap[model.toLowerCase()];
    }

    const prompt = `Analyze the time complexity of the following code and provide a detailed Big O analysis.

Code:
\`\`\`
${code}
\`\`\`

Return ONLY a JSON object with this exact structure:
{
  "notation": "O(n)",
  "explanation": "Brief explanation here",
  "steps": ["Step 1", "Step 2", "Step 3"]
}

Requirements:
- "notation" must be a valid Big O notation (e.g., O(n), O(n²), O(log n), O(n log n), O(2ⁿ), etc.)
- "explanation" should briefly explain why this complexity
- "steps" should be an array of strings explaining the analysis

Consider loop structures, recursive calls, data structure operations, divide-and-conquer patterns, and optimizations.`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model,
        temperature: 0.2, // Lower temperature for more deterministic responses
        max_tokens: 500,
        response_format: { type: "json_object" }, // Guarantees valid JSON output
        messages: [
          {
            role: "system",
            content:
              "You are an expert computer scientist specializing in algorithm analysis and Big O complexity. Always output valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });
    } catch (modelError: any) {
      // If model not found and it's a GPT-5 model, try the snapshot name
      if (
        (modelError.message?.includes("model") || modelError.code === "model_not_found") &&
        model.includes("gpt-5")
      ) {
        // GPT-5 models might need Responses API instead of Chat Completions
        // Or might need the exact snapshot name
        return NextResponse.json(
          {
            error: "GPT-5 model compatibility issue",
            message: `GPT-5 models (like ${model}) may require the Responses API instead of Chat Completions, or may need a different model name.`,
            suggestion:
              "Try using 'gpt-4o-mini' instead, or check OpenAI docs for GPT-5 Chat Completions support.",
            attemptedModel: model,
          },
          { status: 400 }
        );
      }
      throw modelError; // Re-throw if not a model error
    }

    const responseText = completion.choices[0]?.message?.content || "";

    if (!responseText) {
      console.error("Empty response from OpenAI API");
      return NextResponse.json(
        {
          error: "No response from AI model",
          details: "The API returned an empty response. Check server logs for details.",
        },
        { status: 500 }
      );
    }

    // Parse JSON (should be guaranteed valid by response_format)
    let analysis;
    try {
      analysis = JSON.parse(responseText);

      // Validate structure
      if (!analysis.notation) {
        throw new Error("Missing 'notation' field in response");
      }
    } catch (parseError: any) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response text:", responseText);

      // Fallback: try to extract notation even if JSON is malformed
      const notationMatch = responseText.match(/O\([^)]+\)/);
      return NextResponse.json(
        {
          error: "AI response parsing error",
          message: "The AI response could not be parsed as valid JSON.",
          fallback: notationMatch
            ? {
                notation: notationMatch[0],
                explanation: "Parsed from malformed response",
                steps: ["Could not parse full response"],
              }
            : null,
          rawResponse: responseText.substring(0, 500),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to analyze complexity";
    let errorDetails = error.message || "Unknown error";

    // Check for specific error codes
    if (error.code === "insufficient_quota" || error.error?.code === "insufficient_quota") {
      errorMessage = "OpenAI API quota exceeded";
      errorDetails =
        "Your OpenAI account has no credits remaining. Please add billing information or purchase credits at https://platform.openai.com/account/billing";
    } else if (
      error.status === 401 ||
      error.message?.includes("401") ||
      error.message?.includes("Unauthorized")
    ) {
      errorMessage = "Invalid API key";
      errorDetails = "Please check that your OpenAI API key is correct and has not expired";
    } else if (
      error.status === 429 ||
      error.code === "rate_limit_exceeded" ||
      error.message?.includes("429") ||
      error.message?.includes("rate limit")
    ) {
      errorMessage = "Rate limit exceeded";
      errorDetails = "You've exceeded your OpenAI API rate limit. Please try again in a few moments";
    } else if (error.message?.includes("model") || error.code === "model_not_found") {
      errorMessage = "Model not found";
      errorDetails = `The model "${process.env.OPENAI_MODEL || "gpt-4o-mini"}" is not available. Try using "gpt-4o-mini" instead.`;
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error";
      errorDetails = "Could not connect to OpenAI API. Check your internet connection";
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
