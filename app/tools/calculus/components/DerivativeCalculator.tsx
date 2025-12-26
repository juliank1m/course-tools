"use client";

import { useState, useRef, useEffect } from "react";
import MathInput from "./MathInput";
import VirtualMathKeyboard from "./VirtualMathKeyboard";

type DerivativeResult = {
  derivative: string;
  valueAtPoint: number | null;
  explanation: string;
};

export default function DerivativeCalculator() {
  const [expression, setExpression] = useState("x^2");
  const [point, setPoint] = useState<string>("");
  const [result, setResult] = useState<DerivativeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFunctionMenu, setShowFunctionMenu] = useState(false);
  const mathInputContainerRef = useRef<HTMLDivElement>(null);
  const insertTextRef = useRef<((text: string) => void) | null>(null);
  const focusMathInputRef = useRef<(() => void) | null>(null);
  const backspaceMathInputRef = useRef<(() => void) | null>(null);
  const moveCursorRightRef = useRef<(() => void) | null>(null);


  const handleCompute = async () => {
    setError(null);
    setResult(null);

    const expr = expression.trim();
    if (!expr) {
      setError("Please enter a function of x, like x^2 or sin(x).");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/solve-derivative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression: expr,
          point: point.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || "Failed to compute derivative";
        const details = errorData.message || errorData.details || "";
        throw new Error(details ? `${errorMsg}: ${details}` : errorMsg);
      }

      const data = (await response.json()) as DerivativeResult;
      setResult(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to compute derivative. Make sure your OpenAI API key is configured."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Derivative Calculator (AI)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter a function of x and optionally a point to evaluate the derivative at. This uses{" "}
          <span className="font-semibold">OpenAI</span> to symbolically differentiate and explain the
          result.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Function f(x)
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowFunctionMenu(!showFunctionMenu);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                className="p-2 rounded-lg bg-gradient-to-br from-purple-100/80 to-pink-100/80 hover:from-purple-200/80 hover:to-pink-200/80 border-2 border-purple-200/50 text-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Open function keyboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </button>
            </div>
            <div ref={mathInputContainerRef}>
              <MathInput
                value={expression}
                onChange={setExpression}
                placeholder="Enter function, e.g. x^3 - 4x + 1"
                onMathFieldReady={(insertText, focus, backspace, moveCursorRight) => {
                  insertTextRef.current = insertText;
                  focusMathInputRef.current = focus;
                  backspaceMathInputRef.current = backspace;
                  moveCursorRightRef.current = moveCursorRight;
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Use <code className="font-mono">x</code> as the variable. You can include functions like{" "}
              <code className="font-mono">sin</code>, <code className="font-mono">cos</code>,{" "}
              <code className="font-mono">tan</code>, <code className="font-mono">e^x</code>,{" "}
              <code className="font-mono">ln(x)</code>, and more.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Evaluate at x = <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={point}
              onChange={(e) => setPoint(e.target.value)}
              placeholder="Optional: x value to evaluate at"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              If provided, the AI will compute f&apos;(x) at this x value when possible.
            </p>
          </div>

          <div>
            <button
              onClick={handleCompute}
              disabled={isLoading}
              className="mt-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                "Compute Derivative"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="p-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/60 to-purple-50/60 backdrop-blur-sm border border-blue-200 rounded-xl shadow-md space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Result
          </h3>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Symbolic derivative f&apos;(x)
            </p>
            <div className="px-3 py-2 bg-white/80 rounded-lg border border-blue-100 font-mono text-sm text-gray-800 overflow-x-auto">
              {result.derivative}
            </div>
          </div>

          {result.valueAtPoint !== null && point.trim() && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Value at x = {point.trim()}
              </p>
              <div className="px-3 py-2 bg-white/80 rounded-lg border border-purple-100 font-mono text-sm text-gray-800">
                {result.valueAtPoint}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-blue-100 text-xs text-gray-600">
            <p>{result.explanation}</p>
          </div>
        </div>
      )}

      {/* Virtual Keyboard */}
      <VirtualMathKeyboard
        insertText={(text) => {
          if (insertTextRef.current) {
            insertTextRef.current(text);
          } else {
            setExpression((prev) => {
              if (prev === null || prev === undefined) {
                return text;
              }
              return prev + text;
            });
          }
        }}
        focus={() => {
          if (focusMathInputRef.current) {
            focusMathInputRef.current();
          }
        }}
        backspace={() => {
          if (backspaceMathInputRef.current) {
            backspaceMathInputRef.current();
          } else {
            setExpression((prev) => {
              if (!prev || prev.length === 0) return prev;
              return prev.slice(0, -1);
            });
          }
        }}
        moveCursorRight={() => {
          if (moveCursorRightRef.current) {
            moveCursorRightRef.current();
          }
        }}
        isOpen={showFunctionMenu}
        onClose={() => setShowFunctionMenu(false)}
        mathInputContainerRef={mathInputContainerRef}
      />
    </div>
  );
}

