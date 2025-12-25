"use client";

import { useState, useRef, useEffect } from "react";
import { parse, compile } from "mathjs";

export default function GraphingCalculator() {
  const [expression, setExpression] = useState("sin(x)");
  const [xMin, setXMin] = useState("-5");
  const [xMax, setXMax] = useState("5");
  const [yMin, setYMin] = useState("-3");
  const [yMax, setYMax] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawGraph();
  }, [expression, xMin, xMax, yMin, yMax]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    let xMinVal: number, xMaxVal: number, yMinVal: number, yMaxVal: number;

    try {
      xMinVal = Number(xMin);
      xMaxVal = Number(xMax);
      yMinVal = Number(yMin);
      yMaxVal = Number(yMax);

      if (!Number.isFinite(xMinVal) || !Number.isFinite(xMaxVal) || !Number.isFinite(yMinVal) || !Number.isFinite(yMaxVal)) {
        setError("All bounds must be finite numbers.");
        return;
      }

      if (xMinVal >= xMaxVal || yMinVal >= yMaxVal) {
        setError("Min values must be less than max values.");
        return;
      }
    } catch {
      setError("Invalid bound values.");
      return;
    }

    const expr = expression.trim();
    if (!expr) {
      return;
    }

    try {
      const node = parse(expr);
      const compiled = compile(node);

      // Draw axes
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;

      // X-axis
      const yZero = height - ((0 - yMinVal) / (yMaxVal - yMinVal)) * height;
      if (yZero >= 0 && yZero <= height) {
        ctx.beginPath();
        ctx.moveTo(0, yZero);
        ctx.lineTo(width, yZero);
        ctx.stroke();
      }

      // Y-axis
      const xZero = ((0 - xMinVal) / (xMaxVal - xMinVal)) * width;
      if (xZero >= 0 && xZero <= width) {
        ctx.beginPath();
        ctx.moveTo(xZero, 0);
        ctx.lineTo(xZero, height);
        ctx.stroke();
      }

      // Draw grid lines
      ctx.strokeStyle = "#f3f4f6";
      const xStep = (xMaxVal - xMinVal) / 10;
      const yStep = (yMaxVal - yMinVal) / 10;

      for (let i = 0; i <= 10; i++) {
        const x = (xMinVal + i * xStep - xMinVal) / (xMaxVal - xMinVal) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let i = 0; i <= 10; i++) {
        const y = height - ((yMinVal + i * yStep - yMinVal) / (yMaxVal - yMinVal) * height);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw function
      ctx.strokeStyle = "#9333ea";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const points: { x: number; y: number }[] = [];
      let firstPoint = true;

      for (let i = 0; i <= width; i++) {
        const x = xMinVal + (i / width) * (xMaxVal - xMinVal);

        try {
          const y = compiled.evaluate({ x });

          if (Number.isFinite(y)) {
            const canvasX = i;
            const canvasY = height - ((y - yMinVal) / (yMaxVal - yMinVal)) * height;

            // Only draw if point is within canvas bounds (or close to it)
            if (canvasY >= -100 && canvasY <= height + 100) {
              if (firstPoint) {
                ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
              } else {
                // Check if there's a discontinuity (large jump)
                const prevPoint = points[points.length - 1];
                const jump = Math.abs(canvasY - prevPoint.y);
                if (jump > height * 0.5) {
                  // Likely a discontinuity, start a new path
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.moveTo(canvasX, canvasY);
                } else {
                  ctx.lineTo(canvasX, canvasY);
                }
              }
              points.push({ x: canvasX, y: canvasY });
            }
          }
        } catch {
          // Skip points where evaluation fails
          continue;
        }
      }

      ctx.stroke();
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to graph function. Make sure the function is valid and only uses x as the variable."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Function Grapher</h2>
        <p className="text-sm text-gray-600 mb-4">
          Graph functions using <span className="font-semibold">mathjs</span> evaluation and HTML5 canvas.
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
              placeholder="e.g. sin(x), x^2, exp(x), log(x)"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use <code className="font-mono">x</code> as the variable. Graph updates automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                X Min
              </label>
              <input
                type="text"
                value={xMin}
                onChange={(e) => setXMin(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                X Max
              </label>
              <input
                type="text"
                value={xMax}
                onChange={(e) => setXMax(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Y Min
              </label>
              <input
                type="text"
                value={yMin}
                onChange={(e) => setYMin(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Y Max
              </label>
              <input
                type="text"
                value={yMax}
                onChange={(e) => setYMax(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-auto"
            style={{ maxWidth: "100%" }}
          />
        </div>
        <p className="mt-3 text-xs text-gray-600">
          The graph updates automatically as you change the function or bounds. Purple line represents f(x).
        </p>
      </div>
    </div>
  );
}

