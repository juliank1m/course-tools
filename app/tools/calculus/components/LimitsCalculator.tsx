"use client";

import { MathExpression, EvalFunction } from "mathjs";
import { useState } from "react";
import { parse, compile } from "mathjs";

export default function LimitsCalculator() {
  const [expression, setExpression] = useState("sin(x) / x");
  const [approachValue, setApproachValue] = useState("0");
  const [direction, setDirection] = useState<"both" | "left" | "right">("both");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleCompute = () => {
    setError(null);
    setResult("");

    const expr = expression.trim();
    if (!expr) {
      setError("Please enter a function of x.");
      return;
    }

    let approach: number;
    try {
      approach = Number(approachValue);
      if (!Number.isFinite(approach)) {
        setError("Approach value must be a finite number (use 'inf' or '-inf' for infinity).");
        return;
      }
    } catch {
      setError("Invalid approach value.");
      return;
    }

    try {
      const node = parse(expr);
      const compiled = compile(expr);

      // For infinity limits, approach from large values
      const isInfinity = !Number.isFinite(approach);
      const isNegativeInfinity = approachValue.toLowerCase() === "-inf" || approachValue.toLowerCase() === "-infinity";

      let limitValue: number | string | null = null;

      if (direction === "both" || direction === "right") {
        let testValue: number;
        if (isNegativeInfinity) {
          testValue = -1e10;
        } else if (isInfinity) {
          testValue = 1e10;
        } else {
          testValue = approach + 1e-8;
        }

        try {
          const rightLimit = compiled.evaluate({ x: testValue });
          if (Number.isFinite(rightLimit)) {
            limitValue = rightLimit;
          }
        } catch {
          // Try from even closer
          if (!isInfinity) {
            try {
              const rightLimit = compiled.evaluate({ x: approach + 1e-12 });
              if (Number.isFinite(rightLimit)) {
                limitValue = rightLimit;
              }
            } catch {}
          }
        }
      }

      if ((direction === "both" || direction === "left") && limitValue === null) {
        let testValue: number;
        if (isNegativeInfinity) {
          testValue = -1e10;
        } else if (isInfinity) {
          testValue = 1e10;
        } else {
          testValue = approach - 1e-8;
        }

        try {
          const leftLimit = compiled.evaluate({ x: testValue });
          if (Number.isFinite(leftLimit)) {
            limitValue = leftLimit;
          }
        } catch {
          // Try from even closer
          if (!isInfinity) {
            try {
              const leftLimit = compiled.evaluate({ x: approach - 1e-12 });
              if (Number.isFinite(leftLimit)) {
                limitValue = leftLimit;
              }
            } catch {}
          }
        }
      }

      if (limitValue === null) {
        // Try evaluating at the exact point for removable discontinuities
        if (!isInfinity) {
          try {
            const exactValue = compiled.evaluate({ x: approach });
            if (Number.isFinite(exactValue)) {
              limitValue = exactValue;
            }
          } catch {}
        }
      }

      if (limitValue === null) {
        setError(
          "Could not compute limit. The function may have a discontinuity, vertical asymptote, or the limit may not exist. Try a different approach value or check the function."
        );
        return;
      }

      // Format the result
      if (typeof limitValue === "number") {
        if (Math.abs(limitValue) > 1e10) {
          setResult(limitValue > 0 ? "∞" : "-∞");
        } else {
          setResult(Number(limitValue.toFixed(8)).toString());
        }
      } else {
        setResult(limitValue);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to compute limit. Make sure the function is valid and only uses x as the variable."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Limit Calculator</h2>
        <p className="text-sm text-gray-600 mb-4">
          Numerically approximate limits using <span className="font-semibold">mathjs</span>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Function f(x)
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. sin(x) / x, (x^2 - 1) / (x - 1), 1 / x"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use <code className="font-mono">x</code> as the variable. For infinity, use{" "}
              <code className="font-mono">inf</code> or <code className="font-mono">-inf</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Approach value
              </label>
              <input
                type="text"
                value={approachValue}
                onChange={(e) => setApproachValue(e.target.value)}
                placeholder="e.g. 0, inf, -inf, 1"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "both" | "left" | "right")}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="both">Both sides</option>
                <option value="left">Left side only</option>
                <option value="right">Right side only</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCompute}
            className="px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-md hover:shadow-lg text-sm"
          >
            Compute Limit
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
            <p className="text-sm text-gray-700 mb-1">
              Limit as x →{" "}
              {approachValue.toLowerCase() === "inf" || approachValue.toLowerCase() === "infinity"
                ? "∞"
                : approachValue.toLowerCase() === "-inf" ||
                    approachValue.toLowerCase() === "-infinity"
                  ? "-∞"
                  : approachValue}
            </p>
            <div className="px-3 py-2 bg-white/80 rounded-lg border border-purple-100 font-mono text-lg text-gray-800">
              {result}
            </div>
          </div>

          <div className="pt-2 border-t border-purple-100 text-xs text-gray-600">
            <p>
              This is a numerical approximation. For exact limits, especially those involving
              infinity or removable discontinuities, the result may not be perfectly accurate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

