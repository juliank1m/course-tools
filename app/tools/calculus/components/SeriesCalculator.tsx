"use client";

import { useState } from "react";
import { parse, compile, derivative } from "mathjs";
import MathInput from "./MathInput";

export default function SeriesCalculator() {
  const [expression, setExpression] = useState("sin(x)");
  const [center, setCenter] = useState("0");
  const [order, setOrder] = useState("5");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Simplified factorial calculation
  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Recursive derivative computation for Taylor series
  const computeTaylorSeries = (expr: string, center: number, order: number): string => {
    try {
      const node = parse(expr);
      const compiled = compile(expr);

      const terms: string[] = [];

      // Evaluate function at center
      const f0 = compiled.evaluate({ x: center });
      if (Number.isFinite(f0) && Math.abs(f0) > 1e-10) {
        const f0Str = f0.toFixed(6).replace(/\.?0+$/, "");
        terms.push(f0Str);
      }

      // Compute derivatives
      let currentDeriv = node;
      for (let n = 1; n <= order; n++) {
        try {
          currentDeriv = derivative(currentDeriv, "x");
          const derivCompiled = compile(currentDeriv.toString());
          const derivAtCenter = derivCompiled.evaluate({ x: center });

          if (!Number.isFinite(derivAtCenter)) break;

          const fact = factorial(n);
          const coeff = derivAtCenter / fact;

          if (Math.abs(coeff) < 1e-10) continue;

          const coeffStr = coeff.toFixed(6).replace(/\.?0+$/, "");
          const xMinusA = center === 0 ? "x" : `(x - ${center})`;
          const power = n === 1 ? "" : `^${n}`;

          let term = "";
          if (coeff === 1) {
            term = `${xMinusA}${power}`;
          } else if (coeff === -1) {
            term = `-${xMinusA}${power}`;
          } else {
            term = `${coeffStr} * ${xMinusA}${power}`;
          }

          terms.push(term);
        } catch {
          break;
        }
      }

      if (terms.length === 0) return "0";
      return terms.join(" + ").replace(/\+\s*-/g, " - ");
    } catch (err) {
      throw err;
    }
  };

  const handleCompute = () => {
    setError(null);
    setResult("");

    const expr = expression.trim();
    if (!expr) {
      setError("Please enter a function of x.");
      return;
    }

    let centerValue: number;
    let orderValue: number;

    try {
      centerValue = Number(center);
      if (!Number.isFinite(centerValue)) {
        setError("Center value must be a finite number.");
        return;
      }
    } catch {
      setError("Invalid center value.");
      return;
    }

    try {
      orderValue = Math.floor(Number(order));
      if (orderValue < 1 || orderValue > 15) {
        setError("Order must be between 1 and 15.");
        return;
      }
    } catch {
      setError("Invalid order value.");
      return;
    }

    try {
      const series = computeTaylorSeries(expr, centerValue, orderValue);
      setResult(series);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to compute series. Make sure the function is valid and only uses x as the variable."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Taylor Series Calculator</h2>
        <p className="text-sm text-gray-600 mb-4">
          Compute Taylor series expansion using <span className="font-semibold">mathjs</span> symbolic differentiation.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Function f(x)
            </label>
            <MathInput
              value={expression}
              onChange={setExpression}
              placeholder="Enter function for series expansion"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use <code className="font-mono">x</code> as the variable. Common functions: sin, cos, exp, log.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Center point a
              </label>
              <input
                type="text"
                value={center}
                onChange={(e) => setCenter(e.target.value)}
                placeholder="Center point (0 for Maclaurin)"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Taylor series centered at this value (often 0 for Maclaurin).
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Order (max degree)
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Highest power term to compute (1-15).
              </p>
            </div>
          </div>

          <button
            onClick={handleCompute}
            className="px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-md hover:shadow-lg text-sm"
          >
            Compute Series
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
            Taylor Series
          </h3>
          <div>
            <p className="text-sm text-gray-700 mb-1">
              f(x) ≈ (terms up to order {order})
            </p>
            <div className="px-3 py-2 bg-white/80 rounded-lg border border-purple-100 font-mono text-sm text-gray-800 overflow-x-auto">
              {result}
            </div>
          </div>

          <div className="pt-2 border-t border-purple-100 text-xs text-gray-600">
            <p>
              This is a Taylor series expansion centered at x = {center}. Higher order terms may be truncated
              for complex functions. The series is valid near the center point.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

