"use client";

import { useState } from "react";

type IntegralResult = {
  integralExpression: string;
  value: number | null;
  explanation: string;
};

export default function IntegralCalculator() {
  const [expression, setExpression] = useState("x^2");
  const [lower, setLower] = useState<string>("0");
  const [upper, setUpper] = useState<string>("1");
  const [result, setResult] = useState<IntegralResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompute = async () => {
    setError(null);
    setResult(null);

    const expr = expression.trim();
    if (!expr) {
      setError("Please enter a function of x to integrate.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/solve-integral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression: expr,
          lower: lower.trim() || null,
          upper: upper.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || "Failed to compute integral";
        const details = errorData.message || errorData.details || "";
        throw new Error(details ? `${errorMsg}: ${details}` : errorMsg);
      }

      const data = (await response.json()) as IntegralResult;
      setResult(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to compute integral. Make sure your OpenAI API key is configured."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Integral Calculator (AI)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Compute and explain definite integrals using{" "}
          <span className="font-semibold">OpenAI</span>. The model will try to give both an exact
          expression and a numeric value when possible.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Integrand f(x)
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. x^3 - 4x + 1, sin(x), e^(2x)"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use <code className="font-mono">x</code> as the variable. You can include functions like{" "}
              <code className="font-mono">sin</code>, <code className="font-mono">cos</code>,{" "}
              <code className="font-mono">e^x</code>, <code className="font-mono">ln(x)</code>, etc.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Lower bound a
              </label>
              <input
                type="text"
                value={lower}
                onChange={(e) => setLower(e.target.value)}
                placeholder="e.g. 0"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Upper bound b
              </label>
              <input
                type="text"
                value={upper}
                onChange={(e) => setUpper(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          <button
            onClick={handleCompute}
            disabled={isLoading}
            className="px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-md hover:shadow-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Computing...
              </>
            ) : (
              "Compute Integral"
            )}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="p-6 bg-gradient-to-br from-purple-50/70 via-pink-50/60 to-blue-50/60 backdrop-blur-sm border border-purple-200 rounded-xl shadow-md space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Result
          </h3>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Integral</p>
            <div className="px-3 py-2 bg-white/80 rounded-lg border border-purple-100 font-mono text-sm text-gray-800 overflow-x-auto">
              {result.integralExpression}
            </div>
          </div>

          {result.value !== null && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Numeric value</p>
              <div className="px-3 py-2 bg-white/80 rounded-lg border border-blue-100 font-mono text-sm text-gray-800">
                {result.value}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-purple-100 text-xs text-gray-600">
            <p>{result.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

