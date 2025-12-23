"use client";

import { useState } from "react";
import Link from "next/link";
import { Matrix, EigenvalueDecomposition } from "ml-matrix";
import { det, multiply, inv } from "mathjs";

export default function LinearAlgebraPage() {
  const [matrixRows, setMatrixRows] = useState(2);
  const [matrixCols, setMatrixCols] = useState(2);
  const [matrix, setMatrix] = useState<string[][]>([
    ["1", "0"],
    ["0", "1"],
  ]);
  const [matrixB, setMatrixB] = useState<string[][]>([
    ["1", "0"],
    ["0", "1"],
  ]);
  const [matrixBCols, setMatrixBCols] = useState(2);
  const [showMatrixB, setShowMatrixB] = useState(false);
  const [result, setResult] = useState<string>("");
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);

  const isSquare = matrixRows === matrixCols;

  const handleMultiplyClick = () => {
    if (!showMatrixB) {
      // Initialize Matrix B with correct dimensions for multiplication (matrixCols rows × matrixBCols cols)
      const newMatrixB = Array(matrixCols)
        .fill(null)
        .map(() => Array(matrixBCols).fill("0"));
      setMatrixB(newMatrixB);
      setShowMatrixB(true);
      setSelectedOperation("multiply");
    } else {
      calculateMultiply();
    }
  };

  const updateMatrixBCols = (cols: number) => {
    if (cols < 1 || cols > 10) return;
    setMatrixBCols(cols);
    // Update Matrix B to match new column count
    const newMatrixB = matrixB.map((row) => {
      const newRow = [...row];
      while (newRow.length < cols) newRow.push("0");
      return newRow.slice(0, cols);
    });
    // Ensure we have enough rows (should be matrixCols)
    while (newMatrixB.length < matrixCols) {
      newMatrixB.push(Array(cols).fill("0"));
    }
    setMatrixB(newMatrixB.slice(0, matrixCols));
    setResult("");
  };

  const calculateMultiply = () => {
    setSelectedOperation("multiply");
    try {
      const numMatrixA = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const numMatrixB = matrixB.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const product = multiply(numMatrixA, numMatrixB);
      setResult(`A × B:\n${formatMatrix(product as number[][])}`);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Invalid matrices for multiplication"}`);
    }
  };

  const updateMatrixRows = (rows: number) => {
    if (rows < 1 || rows > 10) return;
    setMatrixRows(rows);
    const newMatrix = Array(rows)
      .fill(null)
      .map(() => Array(matrixCols).fill("0"));
    setMatrix(newMatrix);
    // Update Matrix B if it's visible (for multiplication, B rows = A cols)
    if (showMatrixB) {
      const newMatrixB = Array(matrixCols)
        .fill(null)
        .map(() => Array(matrixBCols).fill("0"));
      setMatrixB(newMatrixB);
    } else {
      setMatrixB(Array(rows).fill(null).map(() => Array(matrixCols).fill("0")));
    }
    setResult("");
  };

  const updateMatrixCols = (cols: number) => {
    if (cols < 1 || cols > 10) return;
    setMatrixCols(cols);
    const newMatrix = matrix.map((row) => {
      const newRow = [...row];
      while (newRow.length < cols) newRow.push("0");
      return newRow.slice(0, cols);
    });
    while (newMatrix.length < matrixRows) {
      newMatrix.push(Array(cols).fill("0"));
    }
    setMatrix(newMatrix.slice(0, matrixRows));
    // Update Matrix B if it's visible (for multiplication, B rows = A cols)
    if (showMatrixB) {
      const newMatrixB = Array(cols)
        .fill(null)
        .map(() => Array(matrixBCols).fill("0"));
      setMatrixB(newMatrixB);
    } else {
      setMatrixB(Array(matrixRows).fill(null).map(() => Array(cols).fill("0")));
    }
    setResult("");
  };

  const updateMatrixSize = (size: number) => {
    if (size < 1 || size > 10) return;
    // Update both dimensions atomically
    setMatrixRows(size);
    setMatrixCols(size);
    // Create new matrix with correct dimensions
    const newMatrix = Array(size)
      .fill(null)
      .map(() => Array(size).fill("0"));
    setMatrix(newMatrix);
    // Update Matrix B if it's visible (for multiplication, B should be cols × cols)
    if (showMatrixB) {
      setMatrixB(Array(size).fill(null).map(() => Array(size).fill("0")));
    } else {
      setMatrixB(Array(size).fill(null).map(() => Array(size).fill("0")));
    }
    setResult("");
  };

  const handleMatrixKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    row: number,
    col: number,
    matrixType: "A" | "B"
  ) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      
      // Matrix B for multiplication is matrixCols rows × matrixBCols cols
      const maxRows = matrixType === "A" ? matrixRows : (showMatrixB ? matrixCols : matrixRows);
      const maxCols = matrixType === "A" ? matrixCols : (showMatrixB ? matrixBCols : matrixCols);
      
      let newRow = row;
      let newCol = col;
      
      if (e.key === "ArrowUp") {
        newRow = Math.max(0, row - 1);
      } else if (e.key === "ArrowDown") {
        newRow = Math.min(maxRows - 1, row + 1);
      } else if (e.key === "ArrowLeft") {
        newCol = Math.max(0, col - 1);
      } else if (e.key === "ArrowRight") {
        newCol = Math.min(maxCols - 1, col + 1);
      }
      
      // Focus the next input
      const nextInput = document.getElementById(
        `${matrixType.toLowerCase()}-${newRow}-${newCol}`
      ) as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const isValidNumericInput = (value: string): boolean => {
    // Allow empty string (for clearing), digits, decimal point, and negative sign
    if (value === "" || value === "-" || value === "." || value === "-.") return true;
    // Check if it's a valid number (including negative decimals)
    const numericRegex = /^-?\d*\.?\d*$/;
    return numericRegex.test(value);
  };

  const updateMatrixValue = (row: number, col: number, value: string) => {
    if (!isValidNumericInput(value)) return;
    const newMatrix = matrix.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? value : c))
    );
    setMatrix(newMatrix);
    setResult("");
  };

  const updateMatrixBValue = (row: number, col: number, value: string) => {
    if (!isValidNumericInput(value)) return;
    const newMatrix = matrixB.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? value : c))
    );
    setMatrixB(newMatrix);
    setResult("");
  };

  const formatNumber = (n: number): string => {
    // If it's a whole number, don't show decimals
    if (Math.abs(n - Math.round(n)) < 1e-10) {
      return Math.round(n).toString();
    }
    // Otherwise show up to 4 decimal places, removing trailing zeros
    return parseFloat(n.toFixed(4)).toString();
  };

  const formatMatrix = (mat: number[][]): string => {
    // Format all numbers first
    const formatted = mat.map((row) => row.map(formatNumber));
    
    // Find max width for each column for alignment
    const maxWidths: number[] = [];
    for (let col = 0; col < formatted[0]?.length || 0; col++) {
      let maxWidth = 0;
      for (let row = 0; row < formatted.length; row++) {
        const width = formatted[row][col]?.length || 0;
        maxWidth = Math.max(maxWidth, width);
      }
      maxWidths.push(maxWidth);
    }
    
    // Pad each column to max width
    return formatted
      .map((row) =>
        row.map((val, colIdx) => val.padStart(maxWidths[colIdx] || 0)).join("  ")
      )
      .join("\n");
  };

  const formatVector = (vec: number[], label: string = ""): string => {
    const formatted = vec.map(formatNumber);
    const maxWidth = Math.max(...formatted.map((s) => s.length), 6);
    const padded = formatted.map((s) => s.padStart(maxWidth));
    
    // Calculate label width for alignment
    const labelPrefix = label ? `${label} = ` : "";
    const labelWidth = labelPrefix.length;
    const spacer = " ".repeat(labelWidth);
    
    let result = "";
    
    if (vec.length === 1) {
      result += labelPrefix + "┌ " + padded[0] + " ┐";
    } else {
      result += labelPrefix + "┌ " + padded[0] + " ┐\n";
      for (let i = 1; i < padded.length - 1; i++) {
        result += spacer + "│ " + padded[i] + " │\n";
      }
      result += spacer + "└ " + padded[padded.length - 1] + " ┘";
    }
    
    return result;
  };

  const calculateDeterminant = () => {
    setShowMatrixB(false);
    setSelectedOperation("determinant");
    if (!isSquare) {
      setResult("Error: Determinant is only defined for square matrices");
      return;
    }
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const determinant = det(numMatrix);
      setResult(`Determinant: ${formatNumber(determinant)}`);
    } catch (error) {
      setResult("Error: Invalid matrix");
    }
  };

  const calculateTranspose = () => {
    setShowMatrixB(false);
    setSelectedOperation("transpose");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const m = new Matrix(numMatrix);
      const transposed = m.transpose();
      setResult(`Transpose:\n${formatMatrix(transposed.to2DArray())}`);
    } catch (error) {
      setResult("Error: Invalid matrix");
    }
  };


  const calculateInverse = () => {
    setShowMatrixB(false);
    setSelectedOperation("inverse");
    if (!isSquare) {
      setResult("Error: Inverse is only defined for square matrices");
      return;
    }
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const determinant = det(numMatrix);
      if (Math.abs(determinant) < 1e-10) {
        setResult("Error: Matrix is singular (determinant = 0), no inverse exists");
        return;
      }
      const inverse = inv(numMatrix);
      setResult(`Inverse:\n${formatMatrix(inverse as number[][])}`);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Invalid matrix"}`);
    }
  };

  const calculateEigenvalues = () => {
    setShowMatrixB(false);
    setSelectedOperation("eigenvalues");
    if (!isSquare) {
      setResult("Error: Eigenvalues are only defined for square matrices");
      return;
    }
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const m = new Matrix(numMatrix);
      const eig = new EigenvalueDecomposition(m);
      const real = eig.realEigenvalues;
      const imaginary = eig.imaginaryEigenvalues;
      
      let resultStr = "Eigenvalues:\n";
      for (let i = 0; i < real.length; i++) {
        if (Math.abs(imaginary[i]) < 1e-10) {
          resultStr += `λ${i + 1} = ${real[i].toFixed(4)}\n`;
        } else {
          resultStr += `λ${i + 1} = ${real[i].toFixed(4)} ${imaginary[i] >= 0 ? "+" : ""}${imaginary[i].toFixed(4)}i\n`;
        }
      }
      setResult(resultStr);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to calculate eigenvalues"}`);
    }
  };

  const calculateEigenvectors = () => {
    setShowMatrixB(false);
    setSelectedOperation("eigenvectors");
    if (!isSquare) {
      setResult("Error: Eigenvectors are only defined for square matrices");
      return;
    }
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const m = new Matrix(numMatrix);
      const eig = new EigenvalueDecomposition(m);
      const eigenvectorMatrix = eig.eigenvectorMatrix;
      const realEigenvalues = eig.realEigenvalues;
      const imaginaryEigenvalues = eig.imaginaryEigenvalues;
      
      let resultStr = "Eigenvalues and Eigenvectors:\n\n";
      for (let i = 0; i < realEigenvalues.length; i++) {
        if (Math.abs(imaginaryEigenvalues[i]) < 1e-10) {
          resultStr += `Eigenvalue λ${i + 1} = ${realEigenvalues[i].toFixed(4)}\n`;
          const vec = eigenvectorMatrix.getColumn(i);
          resultStr += formatVector(Array.from(vec), `v${i + 1}`) + "\n\n";
        } else {
          resultStr += `Eigenvalue λ${i + 1} = ${realEigenvalues[i].toFixed(4)} ${imaginaryEigenvalues[i] >= 0 ? "+" : ""}${imaginaryEigenvalues[i].toFixed(4)}i\n`;
          resultStr += `(Complex eigenvectors not displayed)\n\n`;
        }
      }
      setResult(resultStr);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to calculate eigenvectors"}`);
    }
  };

  // Helper function to compute RREF
  const computeRREF = (mat: number[][]): number[][] => {
    const rows = mat.length;
    const cols = mat[0].length;
    const rref = mat.map(row => [...row]);
    let lead = 0;
    
    for (let r = 0; r < rows; r++) {
      if (lead >= cols) break;
      
      let i = r;
      while (Math.abs(rref[i][lead]) < 1e-10) {
        i++;
        if (i === rows) {
          i = r;
          lead++;
          if (lead === cols) return rref;
        }
      }
      
      // Swap rows
      [rref[i], rref[r]] = [rref[r], rref[i]];
      
      // Scale pivot row
      const val = rref[r][lead];
      if (Math.abs(val) > 1e-10) {
        for (let j = 0; j < cols; j++) {
          rref[r][j] /= val;
        }
      }
      
      // Eliminate
      for (let i = 0; i < rows; i++) {
        if (i !== r) {
          const factor = rref[i][lead];
          for (let j = 0; j < cols; j++) {
            rref[i][j] -= factor * rref[r][j];
          }
        }
      }
      lead++;
    }
    return rref;
  };

  const calculateRank = () => {
    setShowMatrixB(false);
    setSelectedOperation("rank");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const rref = computeRREF(numMatrix);
      
      // Count non-zero rows
      let rank = 0;
      for (let i = 0; i < rref.length; i++) {
        if (rref[i].some((val) => Math.abs(val) > 1e-10)) {
          rank++;
        }
      }
      setResult(`Rank: ${rank}`);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to calculate rank"}`);
    }
  };

  const calculateKernel = () => {
    setShowMatrixB(false);
    setSelectedOperation("kernel");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      
      // Find null space by solving Ax = 0
      // Use RREF to find free variables
      const rrefMatrix = computeRREF(numMatrix);
      
      // Find pivot columns
      const pivotCols: number[] = [];
      let row = 0;
      for (let col = 0; col < matrixCols && row < matrixRows; col++) {
        if (Math.abs(rrefMatrix[row][col]) > 1e-10) {
          pivotCols.push(col);
          row++;
        }
      }
      
      const freeCols = Array.from({ length: matrixCols }, (_, i) => i)
        .filter((i) => !pivotCols.includes(i));
      
      if (freeCols.length === 0) {
        setResult("Kernel (Null Space): {0}\n(Dimension: 0)");
        return;
      }
      
      // Build basis vectors for null space
      let resultStr = `Kernel (Null Space) Basis:\n\n`;
      resultStr += `Dimension: ${freeCols.length}\n\n`;
      
      for (let f = 0; f < freeCols.length; f++) {
        const freeCol = freeCols[f];
        const basisVec = new Array(matrixCols).fill(0);
        basisVec[freeCol] = 1;
        
        // Solve for dependent variables
        for (let i = pivotCols.length - 1; i >= 0; i--) {
          const pivotRow = i;
          const pivotCol = pivotCols[i];
          let sum = 0;
          for (let j = pivotCol + 1; j < matrixCols; j++) {
            sum += rrefMatrix[pivotRow][j] * basisVec[j];
          }
          basisVec[pivotCol] = -sum / rrefMatrix[pivotRow][pivotCol];
        }
        
        resultStr += formatVector(basisVec, `v${f + 1}`) + "\n\n";
      }
      
      setResult(resultStr);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to calculate kernel"}`);
    }
  };

  const calculateRange = () => {
    setShowMatrixB(false);
    setSelectedOperation("range");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      
      // Column space is spanned by pivot columns of RREF
      const rrefMatrix = computeRREF(numMatrix);
      
      const pivotCols: number[] = [];
      let row = 0;
      for (let col = 0; col < matrixCols && row < matrixRows; col++) {
        if (Math.abs(rrefMatrix[row][col]) > 1e-10) {
          pivotCols.push(col);
          row++;
        }
      }
      
      if (pivotCols.length === 0) {
        setResult("Range (Column Space): {0}\n(Dimension: 0)");
        return;
      }
      
      let resultStr = `Range (Column Space) Basis:\n\n`;
      resultStr += `Dimension: ${pivotCols.length}\n\n`;
      
      for (let i = 0; i < pivotCols.length; i++) {
        const col = pivotCols[i];
        const colVec = numMatrix.map((row) => row[col]);
        resultStr += formatVector(colVec, `v${i + 1}`) + "\n\n";
      }
      
      setResult(resultStr);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to calculate range"}`);
    }
  };

  const checkLinearDependence = () => {
    setShowMatrixB(false);
    setSelectedOperation("linearDependence");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const rref = computeRREF(numMatrix);
      
      // Count non-zero rows (rank)
      let rank = 0;
      for (let i = 0; i < rref.length; i++) {
        if (rref[i].some((val) => Math.abs(val) > 1e-10)) {
          rank++;
        }
      }
      const numCols = matrixCols;
      
      if (rank < numCols) {
        setResult(`Linearly Dependent\n\nRank: ${rank}\nColumns: ${numCols}\n\nSince rank < number of columns, the columns are linearly dependent.`);
      } else {
        setResult(`Linearly Independent\n\nRank: ${rank}\nColumns: ${numCols}\n\nSince rank = number of columns, the columns are linearly independent.`);
      }
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to check linear dependence"}`);
    }
  };

  const calculateDimension = () => {
    setShowMatrixB(false);
    setSelectedOperation("dimension");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const rref = computeRREF(numMatrix);
      
      // Count non-zero rows (rank)
      let rank = 0;
      for (let i = 0; i < rref.length; i++) {
        if (rref[i].some((val) => Math.abs(val) > 1e-10)) {
          rank++;
        }
      }
      
      setResult(`Dimension of Column Space: ${rank}\nDimension of Row Space: ${rank}\nDimension of Null Space: ${matrixCols - rank}`);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to calculate dimension"}`);
    }
  };

  const findBasis = () => {
    setShowMatrixB(false);
    setSelectedOperation("basis");
    try {
      const numMatrix = matrix.map((row) =>
        row.map((val) => parseFloat(val) || 0)
      );
      const rrefMatrix = computeRREF(numMatrix);
      
      const pivotCols: number[] = [];
      let row = 0;
      for (let col = 0; col < matrixCols && row < matrixRows; col++) {
        if (Math.abs(rrefMatrix[row][col]) > 1e-10) {
          pivotCols.push(col);
          row++;
        }
      }
      
      let resultStr = `Basis for Column Space:\n\n`;
      if (pivotCols.length === 0) {
        resultStr += "{0}\n";
      } else {
        for (let i = 0; i < pivotCols.length; i++) {
          const col = pivotCols[i];
          const colVec = numMatrix.map((r) => r[col]);
          resultStr += formatVector(colVec, `v${i + 1}`) + "\n\n";
        }
      }
      
      resultStr += `\nBasis for Row Space:\n\n`;
      const nonZeroRows: number[] = [];
      for (let i = 0; i < matrixRows; i++) {
        if (rrefMatrix[i].some((val: number) => Math.abs(val) > 1e-10)) {
          nonZeroRows.push(i);
        }
      }
      
      if (nonZeroRows.length === 0) {
        resultStr += "{0}\n";
      } else {
        for (let i = 0; i < nonZeroRows.length; i++) {
          const rowIdx = nonZeroRows[i];
          resultStr += formatVector(rrefMatrix[rowIdx], `v${i + 1}`) + "\n\n";
        }
      }
      
      setResult(resultStr);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to find basis"}`);
    }
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
        return `${baseClasses} bg-gray-500 text-white ring-2 ring-offset-2 ring-offset-white ring-gray-400 shadow-md`;
      }
      return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 hover:shadow-sm`;
    } else {
      if (isSelected) {
        return `${baseClasses} bg-purple-500 text-white ring-2 ring-offset-2 ring-offset-white ring-purple-400 shadow-md`;
      }
      return `${baseClasses} bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 hover:shadow-sm`;
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 hover:underline mb-6 inline-block font-medium transition-colors text-sm sm:text-base"
        >
          ← Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gray-800">Linear Algebra </span>
            <span className="text-blue-600">Calculator</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">Perform matrix operations and analyze linear transformations</p>
        </div>

        <div className="mb-8 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            <span className="text-blue-600 font-semibold text-base sm:text-lg whitespace-nowrap">Matrix Dimensions:</span>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-gray-700 text-xs sm:text-sm whitespace-nowrap">Rows:</span>
                <button
                  onClick={() => updateMatrixRows(Math.max(1, matrixRows - 1))}
                  disabled={matrixRows <= 1}
                  className="px-1.5 sm:px-2 py-1 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors text-sm sm:text-base"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={matrixRows}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= 10) {
                      updateMatrixRows(val);
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const clamped = Math.max(1, Math.min(10, val));
                    if (clamped !== matrixRows) {
                      updateMatrixRows(clamped);
                    }
                  }}
                  className="px-2 sm:px-3 py-1 bg-white border-2 border-blue-300 rounded-lg text-gray-700 font-bold w-12 sm:min-w-[40px] text-center text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={() => updateMatrixRows(Math.min(10, matrixRows + 1))}
                  disabled={matrixRows >= 10}
                  className="px-1.5 sm:px-2 py-1 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors text-sm sm:text-base"
                >
                  +
                </button>
              </div>
              
              <span className="text-gray-400 text-lg sm:text-xl">×</span>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-gray-700 text-xs sm:text-sm whitespace-nowrap">Cols:</span>
                <button
                  onClick={() => updateMatrixCols(Math.max(1, matrixCols - 1))}
                  disabled={matrixCols <= 1}
                  className="px-1.5 sm:px-2 py-1 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors text-sm sm:text-base"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={matrixCols}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= 10) {
                      updateMatrixCols(val);
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const clamped = Math.max(1, Math.min(10, val));
                    if (clamped !== matrixCols) {
                      updateMatrixCols(clamped);
                    }
                  }}
                  className="px-2 sm:px-3 py-1 bg-white border-2 border-blue-300 rounded-lg text-gray-700 font-bold w-12 sm:min-w-[40px] text-center text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={() => updateMatrixCols(Math.min(10, matrixCols + 1))}
                  disabled={matrixCols >= 10}
                  className="px-1.5 sm:px-2 py-1 bg-blue-200 text-blue-700 rounded-lg hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors text-sm sm:text-base"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:ml-4 flex-wrap">
              <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">Quick select:</span>
              <div className="flex gap-1">
                {[2, 3, 4, 5].map((size) => (
                  <button
                    key={size}
                    onClick={() => updateMatrixSize(size)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isSquare && matrixRows === size
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <h2 className="text-xl font-bold text-gray-800 px-4">Operations</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={calculateDeterminant}
              disabled={!isSquare}
              className={`${getButtonClass("determinant", "blue")} ${!isSquare ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!isSquare ? "Requires square matrix" : ""}
            >
              Determinant
            </button>
            <button
              onClick={calculateTranspose}
              className={getButtonClass("transpose", "blue")}
            >
              Transpose
            </button>
            <button
              onClick={handleMultiplyClick}
              className={getButtonClass("multiply", "blue")}
            >
              {showMatrixB ? "Multiply (A×B)" : "Multiply"}
            </button>
            <button
              onClick={calculateInverse}
              disabled={!isSquare}
              className={`${getButtonClass("inverse", "blue")} ${!isSquare ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!isSquare ? "Requires square matrix" : ""}
            >
              Inverse
            </button>
            <button
              onClick={calculateEigenvalues}
              disabled={!isSquare}
              className={`${getButtonClass("eigenvalues", "green")} ${!isSquare ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!isSquare ? "Requires square matrix" : ""}
            >
              Eigenvalues
            </button>
            <button
              onClick={calculateEigenvectors}
              disabled={!isSquare}
              className={`${getButtonClass("eigenvectors", "green")} ${!isSquare ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!isSquare ? "Requires square matrix" : ""}
            >
              Eigenvectors
            </button>
            <button
              onClick={calculateRank}
              className={getButtonClass("rank", "purple")}
            >
              Rank
            </button>
            <button
              onClick={calculateDimension}
              className={getButtonClass("dimension", "purple")}
            >
              Dimension
            </button>
            <button
              onClick={calculateKernel}
              className={getButtonClass("kernel", "purple")}
            >
              Kernel (Null Space)
            </button>
            <button
              onClick={calculateRange}
              className={getButtonClass("range", "purple")}
            >
              Range (Column Space)
            </button>
            <button
              onClick={checkLinearDependence}
              className={getButtonClass("linearDependence", "purple")}
            >
              Linear Dependence
            </button>
            <button
              onClick={findBasis}
              className={getButtonClass("basis", "purple")}
            >
              Find Basis
            </button>
          </div>
        </div>

        <div className={`mb-8 ${showMatrixB && (matrixCols <= 5 || matrixBCols <= 5) ? 'flex flex-col lg:flex-row items-start gap-6' : showMatrixB ? 'flex flex-col gap-6' : ''}`}>
          <div className={showMatrixB ? 'w-full' : ''}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h2 className="text-xl font-bold text-gray-800">Matrix A</h2>
            </div>
            <div className="inline-block border-2 border-blue-300 bg-white/80 backdrop-blur-sm p-2 sm:p-4 rounded-lg shadow-md overflow-x-auto max-w-full">
              <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${matrixCols}, minmax(48px, auto))` }}>
                {matrix.map((row, i) =>
                  row.map((val, j) => (
                    <input
                      key={`a-${i}-${j}`}
                      id={`a-${i}-${j}`}
                      type="text"
                      value={val}
                      onChange={(e) => updateMatrixValue(i, j, e.target.value)}
                      onKeyDown={(e) => handleMatrixKeyDown(e, i, j, "A")}
                      className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-center border-2 border-blue-200 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium text-sm sm:text-base"
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {showMatrixB && (
            <div className="w-full">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <h2 className="text-xl font-bold text-gray-800">Matrix B</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Columns:</span>
                  <button
                    onClick={() => updateMatrixBCols(Math.max(1, matrixBCols - 1))}
                    disabled={matrixBCols <= 1}
                    className="px-2 py-1 bg-purple-200 text-purple-700 rounded-lg hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors text-xs"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={matrixBCols}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (val >= 1 && val <= 10) {
                        updateMatrixBCols(val);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const clamped = Math.max(1, Math.min(10, val));
                      if (clamped !== matrixBCols) {
                        updateMatrixBCols(clamped);
                      }
                    }}
                    className="px-2 py-1 bg-white border-2 border-purple-300 rounded-lg text-gray-700 font-bold w-10 sm:w-12 text-center text-xs focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <button
                    onClick={() => updateMatrixBCols(Math.min(10, matrixBCols + 1))}
                    disabled={matrixBCols >= 10}
                    className="px-2 py-1 bg-purple-200 text-purple-700 rounded-lg hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors text-xs"
                  >
                    +
                  </button>
                  <span className="text-gray-500 text-xs ml-1">({matrixB.length}×{matrixBCols})</span>
                </div>
              </div>
              <div className="inline-block border-2 border-purple-300 bg-white/80 backdrop-blur-sm p-2 sm:p-4 rounded-lg shadow-md overflow-x-auto max-w-full">
                <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${matrixBCols}, minmax(48px, auto))` }}>
                  {matrixB.map((row, i) =>
                    row.map((val, j) => (
                      <input
                        key={`b-${i}-${j}`}
                        id={`b-${i}-${j}`}
                        type="text"
                        value={val}
                        onChange={(e) => updateMatrixBValue(i, j, e.target.value)}
                        onKeyDown={(e) => handleMatrixKeyDown(e, i, j, "B")}
                        className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-center border-2 border-purple-200 rounded-lg bg-white text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium text-sm sm:text-base"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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
