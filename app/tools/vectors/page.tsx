"use client";

import { useState } from "react";
import Link from "next/link";

type Vector = number[];

export default function VectorsPage() {
  const [vector1, setVector1] = useState<string[]>(["1", "0", "0"]);
  const [vector2, setVector2] = useState<string[]>(["0", "1", "0"]);
  const [vector3, setVector3] = useState<string[]>(["0", "0", "1"]);
  const [dimension, setDimension] = useState(3);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [linearCombCoeffs, setLinearCombCoeffs] = useState<string[]>(["1", "1"]);
  const [projectionVector, setProjectionVector] = useState<string[]>(["1", "0", "0"]);
  const [projectionOnto, setProjectionOnto] = useState<string[]>(["0", "1", "0"]);

  const isValidNumericInput = (value: string): boolean => {
    if (value === "" || value === "-" || value === "." || value === "-.") return true;
    const numericRegex = /^-?\d*\.?\d*$/;
    return numericRegex.test(value);
  };

  const parseVector = (vec: string[]): Vector => {
    return vec.map((val) => parseFloat(val) || 0);
  };

  const formatNumber = (num: number): string => {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    const fixed = num.toFixed(4);
    return parseFloat(fixed).toString();
  };

  const formatVector = (vec: Vector, name?: string): string => {
    const formatted = vec.map(formatNumber).join(", ");
    return name ? `${name} = (${formatted})` : `(${formatted})`;
  };

  const updateDimension = (dim: number) => {
    if (dim < 2 || dim > 3) return;
    setDimension(dim);
    const padVector = (vec: string[], targetDim: number) => {
      const newVec = [...vec];
      while (newVec.length < targetDim) newVec.push("0");
      return newVec.slice(0, targetDim);
    };
    setVector1(padVector(vector1, dim));
    setVector2(padVector(vector2, dim));
    setVector3(padVector(vector3, dim));
    setProjectionVector(padVector(projectionVector, dim));
    setProjectionOnto(padVector(projectionOnto, dim));
    setResult("");
  };

  const calculateNorm = () => {
    setSelectedOperation("norm");
    const v = parseVector(vector1);
    const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    setResult(`||v|| = ${formatNumber(norm)}`);
  };

  const calculateDotProduct = () => {
    setSelectedOperation("dot");
    const v1 = parseVector(vector1);
    const v2 = parseVector(vector2);
    if (v1.length !== v2.length) {
      setResult("Error: Vectors must have the same dimension");
      return;
    }
    const dot = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    setResult(`${formatVector(v1, "v₁")} · ${formatVector(v2, "v₂")} = ${formatNumber(dot)}`);
  };

  const calculateCrossProduct = () => {
    setSelectedOperation("cross");
    if (dimension !== 3) {
      setResult("Error: Cross product is only defined for 3D vectors");
      return;
    }
    const v1 = parseVector(vector1);
    const v2 = parseVector(vector2);
    const cross = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
    setResult(`${formatVector(v1, "v₁")} × ${formatVector(v2, "v₂")} = ${formatVector(cross, "v₁ × v₂")}`);
  };

  const calculateLinearCombination = () => {
    setSelectedOperation("linearComb");
    const v1 = parseVector(vector1);
    const v2 = parseVector(vector2);
    if (v1.length !== v2.length) {
      setResult("Error: Vectors must have the same dimension");
      return;
    }
    const c1 = parseFloat(linearCombCoeffs[0]) || 0;
    const c2 = parseFloat(linearCombCoeffs[1]) || 0;
    const resultVec = v1.map((val, i) => c1 * val + c2 * v2[i]);
    setResult(`${formatNumber(c1)}${formatVector(v1, "v₁")} + ${formatNumber(c2)}${formatVector(v2, "v₂")} = ${formatVector(resultVec)}`);
  };

  const calculateProjection = () => {
    setSelectedOperation("projection");
    const v = parseVector(projectionVector);
    const u = parseVector(projectionOnto);
    if (v.length !== u.length) {
      setResult("Error: Vectors must have the same dimension");
      return;
    }
    const dotUV = v.reduce((sum, val, i) => sum + val * u[i], 0);
    const dotUU = u.reduce((sum, val) => sum + val * val, 0);
    if (Math.abs(dotUU) < 1e-10) {
      setResult("Error: Cannot project onto zero vector");
      return;
    }
    const scalar = dotUV / dotUU;
    const projection = u.map((val) => scalar * val);
    setResult(`projᵤ(v) = ${formatVector(projection)}\n\nScalar: ${formatNumber(scalar)}`);
  };

  const calculateLineEquation = () => {
    setSelectedOperation("line");
    if (dimension === 2) {
      const point = parseVector(vector1);
      const direction = parseVector(vector2);
      if (Math.abs(direction[0]) < 1e-10 && Math.abs(direction[1]) < 1e-10) {
        setResult("Error: Direction vector cannot be zero");
        return;
      }
      // Parametric form: r = point + t * direction
      // Also show symmetric form if possible
      let resultStr = `Parametric form:\n`;
      resultStr += `x = ${formatNumber(point[0])} + ${formatNumber(direction[0])}t\n`;
      resultStr += `y = ${formatNumber(point[1])} + ${formatNumber(direction[1])}t\n\n`;
      
      if (Math.abs(direction[0]) > 1e-10 && Math.abs(direction[1]) > 1e-10) {
        resultStr += `Symmetric form:\n`;
        resultStr += `(x - ${formatNumber(point[0])}) / ${formatNumber(direction[0])} = (y - ${formatNumber(point[1])}) / ${formatNumber(direction[1])}`;
      }
      setResult(resultStr);
    } else {
      const point = parseVector(vector1);
      const direction = parseVector(vector2);
      if (direction.every((val) => Math.abs(val) < 1e-10)) {
        setResult("Error: Direction vector cannot be zero");
        return;
      }
      let resultStr = `Parametric form:\n`;
      resultStr += `x = ${formatNumber(point[0])} + ${formatNumber(direction[0])}t\n`;
      resultStr += `y = ${formatNumber(point[1])} + ${formatNumber(direction[1])}t\n`;
      resultStr += `z = ${formatNumber(point[2])} + ${formatNumber(direction[2])}t`;
      setResult(resultStr);
    }
  };

  const calculatePlaneEquation = () => {
    setSelectedOperation("plane");
    if (dimension !== 3) {
      setResult("Error: Plane equation requires 3D vectors");
      return;
    }
    const point = parseVector(vector1);
    const v1 = parseVector(vector2);
    const v2 = parseVector(vector3);
    
    // Calculate normal vector using cross product
    const normal = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
    
    const normMag = Math.sqrt(normal.reduce((sum, val) => sum + val * val, 0));
    if (normMag < 1e-10) {
      setResult("Error: Vectors are linearly dependent (parallel)");
      return;
    }
    
    const d = -(normal[0] * point[0] + normal[1] * point[1] + normal[2] * point[2]);
    
    let resultStr = `Plane equation:\n`;
    resultStr += `${formatNumber(normal[0])}x + ${formatNumber(normal[1])}y + ${formatNumber(normal[2])}z + ${formatNumber(d)} = 0\n\n`;
    resultStr += `Normal vector: ${formatVector(normal, "n")}`;
    setResult(resultStr);
  };

  const getButtonClass = (operation: string, baseColor: string) => {
    const isSelected = selectedOperation === operation;
    const baseClasses = "px-4 py-2 rounded-lg transition-all text-sm font-medium";
    
    if (baseColor === "blue") {
      if (isSelected) {
        return `${baseClasses} bg-blue-500 text-white ring-2 ring-offset-2 ring-offset-white ring-blue-400 shadow-md`;
      }
      return `${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 hover:shadow-sm`;
    } else if (baseColor === "green") {
      if (isSelected) {
        return `${baseClasses} bg-green-500 text-white ring-2 ring-offset-2 ring-offset-white ring-green-400 shadow-md`;
      }
      return `${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 hover:shadow-sm`;
    } else {
      if (isSelected) {
        return `${baseClasses} bg-purple-500 text-white ring-2 ring-offset-2 ring-offset-white ring-purple-400 shadow-md`;
      }
      return `${baseClasses} bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 hover:shadow-sm`;
    }
  };

  const updateVectorValue = (vecIndex: number, index: number, value: string) => {
    if (!isValidNumericInput(value)) return;
    const vectors = [vector1, vector2, vector3];
    const setters = [setVector1, setVector2, setVector3];
    const newVec = [...vectors[vecIndex]];
    newVec[index] = value;
    setters[vecIndex](newVec);
    setResult("");
  };

  const updateCoeffValue = (index: number, value: string) => {
    if (!isValidNumericInput(value)) return;
    const newCoeffs = [...linearCombCoeffs];
    newCoeffs[index] = value;
    setLinearCombCoeffs(newCoeffs);
    setResult("");
  };

  const updateProjectionVector = (index: number, value: string, isOnto: boolean) => {
    if (!isValidNumericInput(value)) return;
    const vec = isOnto ? projectionOnto : projectionVector;
    const setter = isOnto ? setProjectionOnto : setProjectionVector;
    const newVec = [...vec];
    newVec[index] = value;
    setter(newVec);
    setResult("");
  };

  const VectorGraph2D = () => {
    if (dimension !== 2) return null;
    
    const v1 = parseVector(vector1);
    const v2 = parseVector(vector2);
    const size = 400;
    const center = size / 2;
    const scale = 30; // pixels per unit
    
    const toScreen = (x: number, y: number) => ({
      x: center + x * scale,
      y: center - y * scale, // Flip y-axis
    });

    const maxAbs = Math.max(
      Math.abs(v1[0]), Math.abs(v1[1]),
      Math.abs(v2[0]), Math.abs(v2[1]),
      5
    );
    const gridSize = Math.ceil(maxAbs) + 2;

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, label: string) => {
      const start = toScreen(x1, y1);
      const end = toScreen(x2, y2);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;

      return (
        <g key={label}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={color}
            strokeWidth="3"
            markerEnd={`url(#arrowhead-${color.replace('#', '')})`}
          />
          <text
            x={end.x + 10}
            y={end.y - 5}
            fill={color}
            fontSize="14"
            fontWeight="bold"
          >
            {label}
          </text>
        </g>
      );
    };

    return (
      <div className="mt-8 p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-2 border-green-200 rounded-xl shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">2D Visualization</h3>
        </div>
        <div className="overflow-x-auto">
          <svg width={size} height={size} className="border border-gray-200 rounded-lg bg-white min-w-[300px] max-w-full" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="arrowhead-blue"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
            <marker
              id="arrowhead-purple"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
            </marker>
            <marker
              id="arrowhead-green"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
            </marker>
          </defs>
          
          {/* Grid */}
          {Array.from({ length: gridSize * 2 + 1 }, (_, i) => {
            const val = i - gridSize;
            const pos = toScreen(val, 0);
            const pos2 = toScreen(0, val);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={pos.x}
                  y1={0}
                  x2={pos.x}
                  y2={size}
                  stroke="#e5e7eb"
                  strokeWidth={val === 0 ? 2 : 1}
                />
                <line
                  x1={0}
                  y1={pos2.y}
                  x2={size}
                  y2={pos2.y}
                  stroke="#e5e7eb"
                  strokeWidth={val === 0 ? 2 : 1}
                />
                {val !== 0 && (
                  <>
                    <text x={pos.x} y={center + 15} textAnchor="middle" fontSize="10" fill="#6b7280">
                      {val}
                    </text>
                    <text x={center - 15} y={pos2.y} textAnchor="middle" fontSize="10" fill="#6b7280">
                      {val}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Axes labels */}
          <text x={size - 20} y={center - 10} fontSize="14" fontWeight="bold" fill="#374151">x</text>
          <text x={center + 10} y={20} fontSize="14" fontWeight="bold" fill="#374151">y</text>

          {/* Vectors */}
          {drawArrow(0, 0, v1[0], v1[1], "#3b82f6", "v₁")}
          {drawArrow(0, 0, v2[0], v2[1], "#a855f7", "v₂")}

          {/* Linear combination if selected */}
          {selectedOperation === "linearComb" && (() => {
            const c1 = parseFloat(linearCombCoeffs[0]) || 0;
            const c2 = parseFloat(linearCombCoeffs[1]) || 0;
            const resultVec = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]];
            return drawArrow(0, 0, resultVec[0], resultVec[1], "#10b981", "result");
          })()}

          {/* Projection if selected */}
          {selectedOperation === "projection" && (() => {
            const v = parseVector(projectionVector);
            const u = parseVector(projectionOnto);
            const dotUV = v[0] * u[0] + v[1] * u[1];
            const dotUU = u[0] * u[0] + u[1] * u[1];
            if (Math.abs(dotUU) > 1e-10) {
              const scalar = dotUV / dotUU;
              const proj = [scalar * u[0], scalar * u[1]];
              return drawArrow(0, 0, proj[0], proj[1], "#10b981", "proj");
            }
            return null;
          })()}
        </svg>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 hover:underline mb-6 inline-block font-medium transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gray-800">Vector </span>
            <span className="text-green-600">Math</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">Vector operations, projections, and geometric equations</p>
        </div>

        <div className="mb-8 p-4 bg-green-50/50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-green-600 font-semibold text-base sm:text-lg whitespace-nowrap">Dimension:</span>
            <button
              onClick={() => updateDimension(2)}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                dimension === 2
                  ? "bg-green-500 text-white ring-2 ring-offset-2 ring-offset-white ring-green-400 shadow-md"
                  : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
              }`}
            >
              2D
            </button>
            <button
              onClick={() => updateDimension(3)}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                dimension === 3
                  ? "bg-green-500 text-white ring-2 ring-offset-2 ring-offset-white ring-green-400 shadow-md"
                  : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
              }`}
            >
              3D
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-green-200"></div>
            <h2 className="text-xl font-bold text-gray-800 px-4">Operations</h2>
            <div className="flex-1 h-px bg-green-200"></div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={calculateNorm}
              className={getButtonClass("norm", "blue")}
            >
              Norm (Magnitude)
            </button>
            <button
              onClick={calculateDotProduct}
              className={getButtonClass("dot", "blue")}
            >
              Dot Product
            </button>
            <button
              onClick={calculateCrossProduct}
              disabled={dimension !== 3}
              className={`${getButtonClass("cross", "blue")} ${dimension !== 3 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Cross Product
            </button>
            <button
              onClick={calculateLinearCombination}
              className={getButtonClass("linearComb", "green")}
            >
              Linear Combination
            </button>
            <button
              onClick={calculateProjection}
              className={getButtonClass("projection", "green")}
            >
              Projection
            </button>
            <button
              onClick={calculateLineEquation}
              className={getButtonClass("line", "purple")}
            >
              Line Equation
            </button>
            <button
              onClick={calculatePlaneEquation}
              disabled={dimension !== 3}
              className={`${getButtonClass("plane", "purple")} ${dimension !== 3 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Plane Equation
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="text-lg font-bold text-gray-800">Vector 1 (v₁)</h3>
            </div>
            <div className="border-2 border-blue-300 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="flex flex-wrap gap-2">
                {vector1.slice(0, dimension).map((val, i) => (
                  <input
                    key={`v1-${i}`}
                    type="text"
                    value={val}
                    onChange={(e) => updateVectorValue(0, i, e.target.value)}
                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-blue-200 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium text-sm sm:text-base"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <h3 className="text-lg font-bold text-gray-800">Vector 2 (v₂)</h3>
            </div>
            <div className="border-2 border-purple-300 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="flex flex-wrap gap-2">
                {vector2.slice(0, dimension).map((val, i) => (
                  <input
                    key={`v2-${i}`}
                    type="text"
                    value={val}
                    onChange={(e) => updateVectorValue(1, i, e.target.value)}
                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-purple-200 rounded-lg bg-white text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium text-sm sm:text-base"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>
          </div>

          {dimension === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector 3 (v₃)</h3>
              </div>
              <div className="border-2 border-pink-300 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2">
                  {vector3.slice(0, dimension).map((val, i) => (
                    <input
                      key={`v3-${i}`}
                      type="text"
                      value={val}
                      onChange={(e) => updateVectorValue(2, i, e.target.value)}
                      className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-pink-200 rounded-lg bg-white text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 font-medium text-sm sm:text-base"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedOperation === "linearComb" && (
          <div className="mb-8 p-4 bg-green-50/50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Linear Combination Coefficients</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">c₁:</span>
                <input
                  type="text"
                  value={linearCombCoeffs[0]}
                  onChange={(e) => updateCoeffValue(0, e.target.value)}
                  className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-green-200 rounded-lg bg-white text-gray-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 font-medium text-sm sm:text-base"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">c₂:</span>
                <input
                  type="text"
                  value={linearCombCoeffs[1]}
                  onChange={(e) => updateCoeffValue(1, e.target.value)}
                  className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-green-200 rounded-lg bg-white text-gray-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 font-medium text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )}

        {selectedOperation === "projection" && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector v</h3>
              </div>
              <div className="border-2 border-teal-300 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2">
                  {projectionVector.slice(0, dimension).map((val, i) => (
                    <input
                      key={`proj-v-${i}`}
                      type="text"
                      value={val}
                      onChange={(e) => updateProjectionVector(i, e.target.value, false)}
                      className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-teal-200 rounded-lg bg-white text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium text-sm sm:text-base"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector u (onto)</h3>
              </div>
              <div className="border-2 border-cyan-300 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2">
                  {projectionOnto.slice(0, dimension).map((val, i) => (
                    <input
                      key={`proj-u-${i}`}
                      type="text"
                      value={val}
                      onChange={(e) => updateProjectionVector(i, e.target.value, true)}
                      className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-cyan-200 rounded-lg bg-white text-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 font-medium text-sm sm:text-base"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {dimension === 2 && (selectedOperation === "dot" || selectedOperation === "linearComb" || selectedOperation === "projection" || selectedOperation === "line") && (
          <VectorGraph2D />
        )}

        {result && (
          <div className="mt-8 p-6 bg-gradient-to-br from-green-50/70 via-emerald-50/50 to-teal-50/60 backdrop-blur-sm border-2 border-green-200 rounded-xl shadow-md overflow-x-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <h3 className="text-lg font-bold text-gray-800">Result</h3>
            </div>
            <pre className="whitespace-pre font-mono text-sm text-gray-800 leading-relaxed bg-white/50 p-4 rounded-lg border border-green-100">{result}</pre>
          </div>
        )}
      </div>
    </main>
  );
}

