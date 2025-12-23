"use client";

import { useState } from "react";
import Link from "next/link";
import { Matrix } from "ml-matrix";
import { det } from "mathjs";

export default function LinearAlgebraPage() {
  const [matrixSize, setMatrixSize] = useState(2);
  const [matrix, setMatrix] = useState<string[][]>([
    ["1", "0"],
    ["0", "1"],
  ]);
  const [result, setResult] = useState<string>("");

  const updateMatrixSize = (size: number) => {
    if (size < 1 || size > 10) return;
    setMatrixSize(size);
    const newMatrix = Array(size)
      .fill(null)
      .map(() => Array(size).fill("0"));
    setMatrix(newMatrix);
    setResult("");
  };

  const updateMatrixValue = (row: number, col: number, value: string) => {
    const newMatrix = matrix.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? value : c))
    );
    setMatrix(newMatrix);
    setResult("");
  };

  const calculateDeterminant = () => {
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const determinant = det(numMatrix);
      setResult(`Determinant: ${determinant.toFixed(4)}`);
    } catch (error) {
      setResult("Error: Invalid matrix");
    }
  };

  const calculateTranspose = () => {
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const m = new Matrix(numMatrix);
      const transposed = m.transpose();
      setResult(
        `Transpose:\n${transposed
          .to2DArray()
          .map((row) => row.map((n) => n.toFixed(2)).join("  "))
          .join("\n")}`
      );
    } catch (error) {
      setResult("Error: Invalid matrix");
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-6">Linear Algebra Calculator</h1>

        <div className="mb-6">
          <label className="block mb-2">
            Matrix Size:
            <input
              type="number"
              min="1"
              max="10"
              value={matrixSize}
              onChange={(e) => updateMatrixSize(parseInt(e.target.value) || 2)}
              className="ml-2 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800"
            />
          </label>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Matrix:</h2>
          <div className="inline-block border-2 border-gray-300 dark:border-gray-700 p-4 rounded">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}>
              {matrix.map((row, i) =>
                row.map((val, j) => (
                  <input
                    key={`${i}-${j}`}
                    type="text"
                    value={val}
                    onChange={(e) => updateMatrixValue(i, j, e.target.value)}
                    className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800"
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={calculateDeterminant}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Calculate Determinant
          </button>
          <button
            onClick={calculateTranspose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Calculate Transpose
          </button>
        </div>

        {result && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <pre className="whitespace-pre-wrap font-mono">{result}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> Plan to add features such as matrix multiplication, inverse, eigenvalues, etc.
          </p>
        </div>
      </div>
    </main>
  );
}

