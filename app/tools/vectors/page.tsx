"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Vector = number[];

export default function VectorsPage() {
  const [vector1, setVector1] = useState<string[]>(["1", "0", "0"]);
  const [vector2, setVector2] = useState<string[]>(["0", "1", "0"]);
  const [vector3, setVector3] = useState<string[]>(["0", "0", "1"]);
  const [vector4, setVector4] = useState<string[]>(["0", "0", "0", "1"]);
  const [vector5, setVector5] = useState<string[]>(["0", "0", "0", "0", "1"]);
  const [numVectors, setNumVectors] = useState(1);
  const [dimension, setDimension] = useState(3);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [linearCombCoeffs, setLinearCombCoeffs] = useState<string[]>(["1", "1", "", "", ""]);
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

  const toSubscript = (num: number): string => {
    const subscripts = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
    return num.toString().split("").map(d => subscripts[parseInt(d)]).join("");
  };

  const formatVectorVar = (num: number): string => {
    return `v⃗${toSubscript(num)}`;
  };

  const formatVector = (vec: Vector, name?: string): string => {
    const formatted = vec.map(formatNumber).join(", ");
    return name ? `${name} = (${formatted})` : `(${formatted})`;
  };

  const formatVectorVertical = (vec: Vector): string => {
    const formatted = vec.map(formatNumber);
    const maxWidth = Math.max(...formatted.map((s) => s.length), 1);
    const padded = formatted.map((s) => s.padStart(maxWidth));
    
    if (vec.length === 1) {
      return "┌ " + padded[0] + " ┐";
    }
    
    let result = "┌ " + padded[0] + " ┐\n";
    for (let i = 1; i < padded.length - 1; i++) {
      result += "│ " + padded[i] + " │\n";
    }
    result += "└ " + padded[padded.length - 1] + " ┘";
    
    return result;
  };

  const formatPlaneVectorForm = (v1: Vector, v2: Vector): string => {
    return `r = s${formatVector(v1)} + t${formatVector(v2)}`;
  };

  const updateDimension = (dim: number) => {
    if (dim < 2 || dim > 5) return;
    setDimension(dim);
    const padVector = (vec: string[], targetDim: number) => {
      const newVec = [...vec];
      while (newVec.length < targetDim) newVec.push("0");
      return newVec.slice(0, targetDim);
    };
    setVector1(padVector(vector1, dim));
    setVector2(padVector(vector2, dim));
    setVector3(padVector(vector3, dim));
    setVector4(padVector(vector4, dim));
    setVector5(padVector(vector5, dim));
    setProjectionVector(padVector(projectionVector, dim));
    setProjectionOnto(padVector(projectionOnto, dim));
    setResult("");
  };

  const addVector = () => {
    if (numVectors >= 5) return;
    setNumVectors(numVectors + 1);
    // Ensure coefficients array has enough elements
    const newCoeffs = [...linearCombCoeffs];
    while (newCoeffs.length < numVectors + 1) newCoeffs.push("");
    setLinearCombCoeffs(newCoeffs);
    // Don't clear result - useEffect will update it if operation is selected
  };

  const removeVector = () => {
    if (numVectors <= 1) return;
    setNumVectors(numVectors - 1);
    // Don't clear result - useEffect will update it if operation is selected
  };

  const calculateNorm = () => {
    setSelectedOperation("norm");
    const vectors = [vector1, vector2, vector3, vector4, vector5];
    let resultStr = "";
    for (let i = 0; i < numVectors; i++) {
      const v = parseVector(vectors[i]);
      const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
      if (i > 0) resultStr += "\n";
      resultStr += `||${formatVectorVar(i + 1)}|| = ${formatNumber(norm)}`;
    }
    setResult(resultStr);
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
    setResult(`${formatVector(v1, "v⃗₁")} · ${formatVector(v2, "v⃗₂")} = ${formatNumber(dot)}`);
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
    setResult(`${formatVector(v1, "v⃗₁")} × ${formatVector(v2, "v⃗₂")} = ${formatVector(cross, "v⃗₁ × v⃗₂")}`);
  };

  const calculateLinearCombination = () => {
    setSelectedOperation("linearComb");
    const vectors = [vector1, vector2, vector3, vector4, vector5];
    const parsedVectors = vectors.slice(0, numVectors).map(v => parseVector(v));
    
    // Check all vectors have same dimension
    const firstDim = parsedVectors[0].length;
    if (!parsedVectors.every(v => v.length === firstDim)) {
      setResult("Error: All vectors must have the same dimension");
      return;
    }
    
    // Calculate linear combination
    const resultVec = new Array(firstDim).fill(0);
    let resultStr = "";
    
    for (let i = 0; i < numVectors; i++) {
      const coeff = parseFloat(linearCombCoeffs[i]) || 0;
      const vec = parsedVectors[i];
      
      for (let j = 0; j < firstDim; j++) {
        resultVec[j] += coeff * vec[j];
      }
      
      if (i > 0 && coeff >= 0) resultStr += " + ";
      else if (i > 0) resultStr += " ";
      resultStr += `${formatNumber(coeff)}${formatVectorVar(i + 1)}`;
    }
    
    resultStr += ` = ${formatVector(resultVec)}`;
    setResult(resultStr);
  };

  const calculateProjection = () => {
    setSelectedOperation("projection");
    const v = parseVector(vector1);
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
    const direction = parseVector(vector1);
    
    if (dimension === 2) {
      if (Math.abs(direction[0]) < 1e-10 && Math.abs(direction[1]) < 1e-10) {
        setResult("Error: Direction vector cannot be zero");
        return;
      }
      let resultStr = `Vector form:\n`;
      resultStr += `r = t${formatVector(direction)}\n\n`;
      
      resultStr += `Parametric form:\n`;
      if (Math.abs(direction[0]) > 1e-10) {
        const coeff = formatNumber(direction[0]);
        if (coeff === "1") {
          resultStr += `x = t\n`;
        } else if (coeff === "-1") {
          resultStr += `x = -t\n`;
        } else {
          resultStr += `x = ${coeff}t\n`;
        }
      }
      if (Math.abs(direction[1]) > 1e-10) {
        const coeff = formatNumber(direction[1]);
        if (coeff === "1") {
          resultStr += `y = t`;
        } else if (coeff === "-1") {
          resultStr += `y = -t`;
        } else {
          resultStr += `y = ${coeff}t`;
        }
      }
      setResult(resultStr);
    } else if (dimension === 3) {
      if (direction.every((val) => Math.abs(val) < 1e-10)) {
        setResult("Error: Direction vector cannot be zero");
        return;
      }
      let resultStr = `Vector form:\n`;
      resultStr += `r = t${formatVector(direction)}\n\n`;
      
      resultStr += `Parametric form:\n`;
      const parts: string[] = [];
      if (Math.abs(direction[0]) > 1e-10) {
        const coeff = formatNumber(direction[0]);
        if (coeff === "1") {
          parts.push("x = t");
        } else if (coeff === "-1") {
          parts.push("x = -t");
        } else {
          parts.push(`x = ${coeff}t`);
        }
      }
      if (Math.abs(direction[1]) > 1e-10) {
        const coeff = formatNumber(direction[1]);
        if (coeff === "1") {
          parts.push("y = t");
        } else if (coeff === "-1") {
          parts.push("y = -t");
        } else {
          parts.push(`y = ${coeff}t`);
        }
      }
      if (Math.abs(direction[2]) > 1e-10) {
        const coeff = formatNumber(direction[2]);
        if (coeff === "1") {
          parts.push("z = t");
        } else if (coeff === "-1") {
          parts.push("z = -t");
        } else {
          parts.push(`z = ${coeff}t`);
        }
      }
      resultStr += parts.join("\n");
      setResult(resultStr);
    }
  };

  const formatPlaneEquation = (coeffs: number[], d: number): string => {
    const terms: string[] = [];
    
    const addTerm = (coeff: number, varName: string) => {
      if (Math.abs(coeff) < 1e-10) return;
      
      const isFirst = terms.length === 0;
      const absCoeff = Math.abs(coeff);
      const isNegative = coeff < 0;
      
      if (absCoeff === 1) {
        if (isFirst) {
          terms.push(isNegative ? `-${varName}` : varName);
        } else {
          terms.push(isNegative ? `- ${varName}` : `+ ${varName}`);
        }
      } else {
        const coeffStr = formatNumber(absCoeff);
        if (isFirst) {
          terms.push(isNegative ? `-${coeffStr}${varName}` : `${coeffStr}${varName}`);
        } else {
          terms.push(isNegative ? `- ${coeffStr}${varName}` : `+ ${coeffStr}${varName}`);
        }
      }
    };
    
    addTerm(coeffs[0], "x");
    addTerm(coeffs[1], "y");
    addTerm(coeffs[2], "z");
    
    if (Math.abs(d) > 1e-10) {
      const isFirst = terms.length === 0;
      const absD = Math.abs(d);
      const isNegative = d < 0;
      const dStr = formatNumber(absD);
      
      if (isFirst) {
        terms.push(isNegative ? `-${dStr}` : dStr);
      } else {
        terms.push(isNegative ? `- ${dStr}` : `+ ${dStr}`);
      }
    }
    
    if (terms.length === 0) {
      return "0 = 0";
    }
    
    return `${terms.join(" ")} = 0`;
  };

  const calculatePlaneEquation = () => {
    setSelectedOperation("plane");
    if (dimension !== 3) {
      setResult("Error: Plane equation requires 3D vectors");
      return;
    }
    const v1 = parseVector(vector1);
    const v2 = parseVector(vector2);
    
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
    
    // Since no point is given, plane goes through origin, so d = 0
    const d = 0;
    
    let resultStr = `Vector form:\n`;
    resultStr += `${formatPlaneVectorForm(v1, v2)}\n\n`;
    
    resultStr += `Scalar form:\n`;
    resultStr += `${formatPlaneEquation([normal[0], normal[1], normal[2]], d)}\n\n`;
    
    resultStr += `Parametric form:\n`;
    const xParts: string[] = [];
    const yParts: string[] = [];
    const zParts: string[] = [];
    
    if (Math.abs(v1[0]) > 1e-10) {
      const absCoeff = Math.abs(v1[0]);
      const isNegative = v1[0] < 0;
      const coeff = formatNumber(absCoeff);
      if (coeff === "1") {
        xParts.push(isNegative ? "-s" : "s");
      } else {
        xParts.push(isNegative ? `-${coeff}s` : `${coeff}s`);
      }
    }
    if (Math.abs(v2[0]) > 1e-10) {
      const absCoeff = Math.abs(v2[0]);
      const isNegative = v2[0] < 0;
      const coeff = formatNumber(absCoeff);
      if (xParts.length === 0) {
        if (coeff === "1") {
          xParts.push(isNegative ? "-t" : "t");
        } else {
          xParts.push(isNegative ? `-${coeff}t` : `${coeff}t`);
        }
      } else {
        if (isNegative) {
          xParts.push(`- ${coeff}t`);
        } else {
          xParts.push(`+ ${coeff}t`);
        }
      }
    }
    if (xParts.length === 0) xParts.push("0");
    
    if (Math.abs(v1[1]) > 1e-10) {
      const absCoeff = Math.abs(v1[1]);
      const isNegative = v1[1] < 0;
      const coeff = formatNumber(absCoeff);
      if (coeff === "1") {
        yParts.push(isNegative ? "-s" : "s");
      } else {
        yParts.push(isNegative ? `-${coeff}s` : `${coeff}s`);
      }
    }
    if (Math.abs(v2[1]) > 1e-10) {
      const absCoeff = Math.abs(v2[1]);
      const isNegative = v2[1] < 0;
      const coeff = formatNumber(absCoeff);
      if (yParts.length === 0) {
        if (coeff === "1") {
          yParts.push(isNegative ? "-t" : "t");
        } else {
          yParts.push(isNegative ? `-${coeff}t` : `${coeff}t`);
        }
      } else {
        if (isNegative) {
          yParts.push(`- ${coeff}t`);
        } else {
          yParts.push(`+ ${coeff}t`);
        }
      }
    }
    if (yParts.length === 0) yParts.push("0");
    
    if (Math.abs(v1[2]) > 1e-10) {
      const absCoeff = Math.abs(v1[2]);
      const isNegative = v1[2] < 0;
      const coeff = formatNumber(absCoeff);
      if (coeff === "1") {
        zParts.push(isNegative ? "-s" : "s");
      } else {
        zParts.push(isNegative ? `-${coeff}s` : `${coeff}s`);
      }
    }
    if (Math.abs(v2[2]) > 1e-10) {
      const absCoeff = Math.abs(v2[2]);
      const isNegative = v2[2] < 0;
      const coeff = formatNumber(absCoeff);
      if (zParts.length === 0) {
        if (coeff === "1") {
          zParts.push(isNegative ? "-t" : "t");
        } else {
          zParts.push(isNegative ? `-${coeff}t` : `${coeff}t`);
        }
      } else {
        if (isNegative) {
          zParts.push(`- ${coeff}t`);
        } else {
          zParts.push(`+ ${coeff}t`);
        }
      }
    }
    if (zParts.length === 0) zParts.push("0");
    
    resultStr += `x = ${xParts.join(" ")}\n`;
    resultStr += `y = ${yParts.join(" ")}\n`;
    resultStr += `z = ${zParts.join(" ")}`;
    
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
    const vectors = [vector1, vector2, vector3, vector4, vector5];
    const setters = [setVector1, setVector2, setVector3, setVector4, setVector5];
    const newVec = [...vectors[vecIndex]];
    newVec[index] = value;
    setters[vecIndex](newVec);
    // Don't clear result if an operation is selected - useEffect will update it
    if (!selectedOperation) {
      setResult("");
    }
  };

  const updateCoeffValue = (index: number, value: string) => {
    if (!isValidNumericInput(value)) return;
    const newCoeffs = [...linearCombCoeffs];
    // Ensure array is long enough
    while (newCoeffs.length <= index) newCoeffs.push("");
    newCoeffs[index] = value;
    setLinearCombCoeffs(newCoeffs);
    // Don't clear result if linear combination is selected - useEffect will update it
    if (selectedOperation !== "linearComb") {
      setResult("");
    }
  };

  const updateProjectionVector = (index: number, value: string, isOnto: boolean) => {
    if (!isValidNumericInput(value)) return;
    const vec = isOnto ? projectionOnto : projectionVector;
    const setter = isOnto ? setProjectionOnto : setProjectionVector;
    const newVec = [...vec];
    newVec[index] = value;
    setter(newVec);
    if (selectedOperation !== "projection") {
      setResult("");
    }
  };

  // Auto-update operations when vectors change
  useEffect(() => {
    if (selectedOperation === "norm" && numVectors >= 1) {
      const vectors = [vector1, vector2, vector3, vector4, vector5];
      let resultStr = "";
      for (let i = 0; i < numVectors; i++) {
        const v = parseVector(vectors[i]);
        const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
        if (i > 0) resultStr += "\n";
        resultStr += `||${formatVectorVar(i + 1)}|| = ${formatNumber(norm)}`;
      }
      setResult(resultStr);
    }
  }, [vector1, vector2, vector3, vector4, vector5, dimension, selectedOperation, numVectors]);

  useEffect(() => {
    if (selectedOperation === "dot") {
      if (numVectors !== 2) {
        setResult("");
        return;
      }
      const v1 = parseVector(vector1);
      const v2 = parseVector(vector2);
      if (v1.length === v2.length) {
        const dot = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
        setResult(`${formatVector(v1, "v⃗₁")} · ${formatVector(v2, "v⃗₂")} = ${formatNumber(dot)}`);
      }
    }
  }, [vector1, vector2, dimension, selectedOperation, numVectors]);

  useEffect(() => {
    if (selectedOperation === "cross") {
      if (numVectors !== 2 || dimension !== 3) {
        setResult("");
        return;
      }
      const v1 = parseVector(vector1);
      const v2 = parseVector(vector2);
      const cross = [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0],
      ];
      setResult(`${formatVector(v1, "v⃗₁")} × ${formatVector(v2, "v⃗₂")} = ${formatVector(cross, "v⃗₁ × v⃗₂")}`);
    }
  }, [vector1, vector2, dimension, selectedOperation, numVectors]);

  useEffect(() => {
    if (selectedOperation === "linearComb") {
      if (numVectors < 2) {
        setResult("");
        return;
      }
      const vectors = [vector1, vector2, vector3, vector4, vector5];
      const parsedVectors = vectors.slice(0, numVectors).map(v => parseVector(v));
      
      // Check all vectors have same dimension
      const firstDim = parsedVectors[0].length;
      if (!parsedVectors.every(v => v.length === firstDim)) {
        setResult("Error: All vectors must have the same dimension");
        return;
      }
      
      // Calculate linear combination
      const resultVec = new Array(firstDim).fill(0);
      let resultStr = "";
      
      for (let i = 0; i < numVectors; i++) {
        const coeff = parseFloat(linearCombCoeffs[i]) || 0;
        const vec = parsedVectors[i];
        
        for (let j = 0; j < firstDim; j++) {
          resultVec[j] += coeff * vec[j];
        }
        
        if (i > 0 && coeff >= 0) resultStr += " + ";
        else if (i > 0) resultStr += " ";
        resultStr += `${formatNumber(coeff)}${formatVectorVar(i + 1)}`;
      }
      
      resultStr += ` = ${formatVector(resultVec)}`;
      setResult(resultStr);
    }
  }, [vector1, vector2, vector3, vector4, vector5, linearCombCoeffs, dimension, selectedOperation, numVectors]);

  useEffect(() => {
    if (selectedOperation === "projection") {
      if (numVectors !== 1) {
        setResult("");
        return;
      }
      const v = parseVector(vector1);
      const u = parseVector(projectionOnto);
      if (v.length === u.length && v.length > 0) {
        const dotUV = v.reduce((sum, val, i) => sum + val * u[i], 0);
        const dotUU = u.reduce((sum, val) => sum + val * val, 0);
        if (Math.abs(dotUU) < 1e-10) {
          setResult("Error: Cannot project onto zero vector");
          return;
        }
        const scalar = dotUV / dotUU;
        const projection = u.map((val) => scalar * val);
        setResult(`projᵤ(v⃗) = ${formatVector(projection)}\n\nScalar: ${formatNumber(scalar)}`);
      }
    }
  }, [vector1, projectionOnto, dimension, selectedOperation, numVectors]);

  useEffect(() => {
    if (selectedOperation === "line") {
      if (numVectors !== 1 || (dimension !== 2 && dimension !== 3)) {
        setResult("");
        return;
      }
      const direction = parseVector(vector1);
      
      if (dimension === 2) {
        if (Math.abs(direction[0]) < 1e-10 && Math.abs(direction[1]) < 1e-10) {
          setResult("Error: Direction vector cannot be zero");
          return;
        }
        let resultStr = `Vector form:\n`;
        resultStr += `r = t${formatVector(direction)}\n\n`;
        
        resultStr += `Parametric form:\n`;
        if (Math.abs(direction[0]) > 1e-10) {
          const coeff = formatNumber(direction[0]);
          if (coeff === "1") {
            resultStr += `x = t\n`;
          } else if (coeff === "-1") {
            resultStr += `x = -t\n`;
          } else {
            resultStr += `x = ${coeff}t\n`;
          }
        }
        if (Math.abs(direction[1]) > 1e-10) {
          const coeff = formatNumber(direction[1]);
          if (coeff === "1") {
            resultStr += `y = t`;
          } else if (coeff === "-1") {
            resultStr += `y = -t`;
          } else {
            resultStr += `y = ${coeff}t`;
          }
        }
        setResult(resultStr);
      } else if (dimension === 3) {
        if (direction.every((val) => Math.abs(val) < 1e-10)) {
          setResult("Error: Direction vector cannot be zero");
          return;
        }
        let resultStr = `Vector form:\n`;
        resultStr += `r = t${formatVector(direction)}\n\n`;
        
        resultStr += `Parametric form:\n`;
        const parts: string[] = [];
        if (Math.abs(direction[0]) > 1e-10) {
          const coeff = formatNumber(direction[0]);
          if (coeff === "1") {
            parts.push("x = t");
          } else if (coeff === "-1") {
            parts.push("x = -t");
          } else {
            parts.push(`x = ${coeff}t`);
          }
        }
        if (Math.abs(direction[1]) > 1e-10) {
          const coeff = formatNumber(direction[1]);
          if (coeff === "1") {
            parts.push("y = t");
          } else if (coeff === "-1") {
            parts.push("y = -t");
          } else {
            parts.push(`y = ${coeff}t`);
          }
        }
        if (Math.abs(direction[2]) > 1e-10) {
          const coeff = formatNumber(direction[2]);
          if (coeff === "1") {
            parts.push("z = t");
          } else if (coeff === "-1") {
            parts.push("z = -t");
          } else {
            parts.push(`z = ${coeff}t`);
          }
        }
        resultStr += parts.join("\n");
        setResult(resultStr);
      }
    }
  }, [vector1, dimension, selectedOperation, numVectors]);

  useEffect(() => {
    if (selectedOperation === "plane") {
      if (numVectors !== 2 || dimension !== 3) {
        setResult("");
        return;
      }
      const v1 = parseVector(vector1);
      const v2 = parseVector(vector2);
      
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
      
      // Since no point is given, plane goes through origin, so d = 0
      const d = 0;
      
      let resultStr = `Vector form:\n`;
      resultStr += `${formatPlaneVectorForm(v1, v2)}\n\n`;
      
      resultStr += `Scalar form:\n`;
      resultStr += `${formatPlaneEquation([normal[0], normal[1], normal[2]], d)}\n\n`;
      
      resultStr += `Parametric form:\n`;
      const xParts: string[] = [];
      const yParts: string[] = [];
      const zParts: string[] = [];
      
      if (Math.abs(v1[0]) > 1e-10) {
        const absCoeff = Math.abs(v1[0]);
        const isNegative = v1[0] < 0;
        const coeff = formatNumber(absCoeff);
        if (coeff === "1") {
          xParts.push(isNegative ? "-s" : "s");
        } else {
          xParts.push(isNegative ? `-${coeff}s` : `${coeff}s`);
        }
      }
      if (Math.abs(v2[0]) > 1e-10) {
        const absCoeff = Math.abs(v2[0]);
        const isNegative = v2[0] < 0;
        const coeff = formatNumber(absCoeff);
        if (xParts.length === 0) {
          if (coeff === "1") {
            xParts.push(isNegative ? "-t" : "t");
          } else {
            xParts.push(isNegative ? `-${coeff}t` : `${coeff}t`);
          }
        } else {
          if (isNegative) {
            xParts.push(`- ${coeff}t`);
          } else {
            xParts.push(`+ ${coeff}t`);
          }
        }
      }
      if (xParts.length === 0) xParts.push("0");
      
    if (Math.abs(v1[1]) > 1e-10) {
      const absCoeff = Math.abs(v1[1]);
      const isNegative = v1[1] < 0;
      const coeff = formatNumber(absCoeff);
      if (coeff === "1") {
        yParts.push(isNegative ? "-s" : "s");
      } else {
        yParts.push(isNegative ? `-${coeff}s` : `${coeff}s`);
      }
    }
      if (Math.abs(v2[1]) > 1e-10) {
        const absCoeff = Math.abs(v2[1]);
        const isNegative = v2[1] < 0;
        const coeff = formatNumber(absCoeff);
        if (yParts.length === 0) {
          if (coeff === "1") {
            yParts.push(isNegative ? "-t" : "t");
          } else {
            yParts.push(isNegative ? `-${coeff}t` : `${coeff}t`);
          }
        } else {
          if (isNegative) {
            yParts.push(`- ${coeff}t`);
          } else {
            yParts.push(`+ ${coeff}t`);
          }
        }
      }
      if (yParts.length === 0) yParts.push("0");
      
    if (Math.abs(v1[2]) > 1e-10) {
      const absCoeff = Math.abs(v1[2]);
      const isNegative = v1[2] < 0;
      const coeff = formatNumber(absCoeff);
      if (coeff === "1") {
        zParts.push(isNegative ? "-s" : "s");
      } else {
        zParts.push(isNegative ? `-${coeff}s` : `${coeff}s`);
      }
    }
      if (Math.abs(v2[2]) > 1e-10) {
        const absCoeff = Math.abs(v2[2]);
        const isNegative = v2[2] < 0;
        const coeff = formatNumber(absCoeff);
        if (zParts.length === 0) {
          if (coeff === "1") {
            zParts.push(isNegative ? "-t" : "t");
          } else {
            zParts.push(isNegative ? `-${coeff}t` : `${coeff}t`);
          }
        } else {
          if (isNegative) {
            zParts.push(`- ${coeff}t`);
          } else {
            zParts.push(`+ ${coeff}t`);
          }
        }
      }
      if (zParts.length === 0) zParts.push("0");
      
      resultStr += `x = ${xParts.join(" ")}\n`;
      resultStr += `y = ${yParts.join(" ")}\n`;
      resultStr += `z = ${zParts.join(" ")}`;
      
      setResult(resultStr);
    }
  }, [vector1, vector2, dimension, selectedOperation, numVectors]);

  const handleVectorKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    vecIndex: number,
    index: number,
    vectorType: "v1" | "v2" | "v3" | "v4" | "v5" | "proj-v" | "proj-u"
  ) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      
      const maxIndex = dimension - 1;
      let newIndex = index;
      
      if (e.key === "ArrowUp") {
        newIndex = Math.max(0, index - 1);
      } else if (e.key === "ArrowDown") {
        newIndex = Math.min(maxIndex, index + 1);
      }
      
      // Focus the next input within the same vector
      const nextInput = document.getElementById(
        `${vectorType}-${newIndex}`
      ) as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
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
            <span className="text-gray-800">Vector </span>
            <span className="text-green-600">Math</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">Vector operations, projections, and geometric equations</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="p-4 bg-green-50/50 border border-green-200 rounded-lg w-full sm:w-auto">
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
                <button
                  onClick={() => updateDimension(4)}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                    dimension === 4
                      ? "bg-green-500 text-white ring-2 ring-offset-2 ring-offset-white ring-green-400 shadow-md"
                      : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                  }`}
                >
                  4D
                </button>
                <button
                  onClick={() => updateDimension(5)}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                    dimension === 5
                      ? "bg-green-500 text-white ring-2 ring-offset-2 ring-offset-white ring-green-400 shadow-md"
                      : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                  }`}
                >
                  5D
                </button>
              </div>
            </div>
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg w-full sm:w-auto">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="text-blue-600 font-semibold text-base sm:text-lg whitespace-nowrap">Vectors:</span>
                <button
                  onClick={removeVector}
                  disabled={numVectors <= 1}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                    numVectors <= 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                  }`}
                >
                  −
                </button>
                <span className="text-blue-600 font-semibold text-base sm:text-lg">{numVectors}</span>
                <button
                  onClick={addVector}
                  disabled={numVectors >= 5}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-medium ${
                    numVectors >= 5
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                  }`}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-1 justify-center">
          {numVectors >= 1 && (
            <div className="flex items-start gap-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedOperation === "projection" ? "Vector v⃗" : `Vector 1 (v⃗₁)`}</h3>
                </div>
                <div className="border-2 border-blue-300 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md inline-block">
                  <div className="flex items-stretch gap-1">
                    <span className="text-blue-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">[</span>
                    <div className="flex flex-col gap-0">
                      {vector1.slice(0, dimension).map((val, i) => (
                        <input
                          key={`v1-${i}`}
                          id={`v1-${i}`}
                          type="text"
                          value={val}
                          onChange={(e) => updateVectorValue(0, i, e.target.value)}
                          onKeyDown={(e) => handleVectorKeyDown(e, 0, i, "v1")}
                          className="w-16 sm:w-20 px-2 py-1 text-center border-2 border-blue-200 rounded bg-white text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium text-sm sm:text-base"
                          placeholder="0"
                        />
                      ))}
                    </div>
                    <span className="text-blue-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">]</span>
                  </div>
                </div>
              </div>
              {selectedOperation === "projection" && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <h3 className="text-lg font-bold text-gray-800">Vector u⃗ (onto)</h3>
                  </div>
                  <div className="border-2 border-cyan-300 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md inline-block">
                    <div className="flex items-stretch gap-1">
                      <span className="text-cyan-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">[</span>
                      <div className="flex flex-col gap-0">
                        {projectionOnto.slice(0, dimension).map((val, i) => (
                          <input
                            key={`proj-u-${i}`}
                            id={`proj-u-${i}`}
                            type="text"
                            value={val}
                            onChange={(e) => updateProjectionVector(i, e.target.value, true)}
                            onKeyDown={(e) => handleVectorKeyDown(e, 0, i, "proj-u")}
                            className="w-16 sm:w-20 px-2 py-1 text-center border-2 border-cyan-200 rounded bg-white text-gray-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 font-medium text-sm sm:text-base"
                            placeholder="0"
                          />
                        ))}
                      </div>
                      <span className="text-cyan-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">]</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {numVectors >= 2 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector 2 (v⃗₂)</h3>
              </div>
              <div className="border-2 border-purple-300 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md inline-block">
                <div className="flex items-stretch gap-1">
                  <span className="text-purple-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">[</span>
                  <div className="flex flex-col gap-0">
                    {vector2.slice(0, dimension).map((val, i) => (
                      <input
                        key={`v2-${i}`}
                        id={`v2-${i}`}
                        type="text"
                        value={val}
                        onChange={(e) => updateVectorValue(1, i, e.target.value)}
                        onKeyDown={(e) => handleVectorKeyDown(e, 1, i, "v2")}
                        className="w-16 sm:w-20 px-2 py-1 text-center border-2 border-purple-200 rounded bg-white text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-medium text-sm sm:text-base"
                        placeholder="0"
                      />
                    ))}
                  </div>
                  <span className="text-purple-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">]</span>
                </div>
              </div>
            </div>
          )}

          {numVectors >= 3 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector 3 (v⃗₃)</h3>
              </div>
              <div className="border-2 border-pink-300 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md inline-block">
                <div className="flex items-stretch gap-1">
                  <span className="text-pink-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">[</span>
                  <div className="flex flex-col gap-0">
                    {vector3.slice(0, dimension).map((val, i) => (
                      <input
                        key={`v3-${i}`}
                        id={`v3-${i}`}
                        type="text"
                        value={val}
                        onChange={(e) => updateVectorValue(2, i, e.target.value)}
                        onKeyDown={(e) => handleVectorKeyDown(e, 2, i, "v3")}
                        className="w-16 sm:w-20 px-2 py-1 text-center border-2 border-pink-200 rounded bg-white text-gray-700 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 font-medium text-sm sm:text-base"
                        placeholder="0"
                      />
                    ))}
                  </div>
                  <span className="text-pink-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">]</span>
                </div>
              </div>
            </div>
          )}
          {numVectors >= 4 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector 4 (v⃗₄)</h3>
              </div>
              <div className="border-2 border-orange-300 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md inline-block">
                <div className="flex items-stretch gap-1">
                  <span className="text-orange-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">[</span>
                  <div className="flex flex-col gap-0">
                    {vector4.slice(0, dimension).map((val, i) => (
                      <input
                        key={`v4-${i}`}
                        id={`v4-${i}`}
                        type="text"
                        value={val}
                        onChange={(e) => updateVectorValue(3, i, e.target.value)}
                        onKeyDown={(e) => handleVectorKeyDown(e, 3, i, "v4")}
                        className="w-16 sm:w-20 px-2 py-1 text-center border-2 border-orange-200 rounded bg-white text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 font-medium text-sm sm:text-base"
                        placeholder="0"
                      />
                    ))}
                  </div>
                  <span className="text-orange-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">]</span>
                </div>
              </div>
            </div>
          )}
          {numVectors >= 5 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <h3 className="text-lg font-bold text-gray-800">Vector 5 (v⃗₅)</h3>
              </div>
              <div className="border-2 border-red-300 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md inline-block">
                <div className="flex items-stretch gap-1">
                  <span className="text-red-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">[</span>
                  <div className="flex flex-col gap-0">
                    {vector5.slice(0, dimension).map((val, i) => (
                      <input
                        key={`v5-${i}`}
                        id={`v5-${i}`}
                        type="text"
                        value={val}
                        onChange={(e) => updateVectorValue(4, i, e.target.value)}
                        onKeyDown={(e) => handleVectorKeyDown(e, 4, i, "v5")}
                        className="w-16 sm:w-20 px-2 py-1 text-center border-2 border-red-200 rounded bg-white text-gray-700 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 font-medium text-sm sm:text-base"
                        placeholder="0"
                      />
                    ))}
                  </div>
                  <span className="text-red-600 font-bold text-2xl sm:text-3xl leading-none flex items-center">]</span>
                </div>
              </div>
            </div>
          )}
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
              disabled={numVectors !== 2}
              className={`${getButtonClass("dot", "blue")} ${numVectors !== 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={numVectors !== 2 ? "Requires exactly 2 vectors" : ""}
            >
              Dot Product
            </button>
            <button
              onClick={calculateCrossProduct}
              disabled={dimension !== 3 || numVectors !== 2}
              className={`${getButtonClass("cross", "blue")} ${dimension !== 3 || numVectors !== 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={dimension !== 3 ? "Requires 3D" : numVectors !== 2 ? "Requires exactly 2 vectors" : ""}
            >
              Cross Product
            </button>
            <button
              onClick={calculateLinearCombination}
              disabled={numVectors < 2}
              className={`${getButtonClass("linearComb", "green")} ${numVectors < 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={numVectors < 2 ? "Requires 2 vectors" : ""}
            >
              Linear Combination
            </button>
            <button
              onClick={calculateProjection}
              disabled={numVectors !== 1}
              className={`${getButtonClass("projection", "green")} ${numVectors !== 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={numVectors !== 1 ? "Requires exactly 1 vector" : ""}
            >
              Projection
            </button>
            <button
              onClick={calculateLineEquation}
              disabled={(dimension !== 2 && dimension !== 3) || numVectors !== 1}
              className={`${getButtonClass("line", "purple")} ${(dimension !== 2 && dimension !== 3) || numVectors !== 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={(dimension !== 2 && dimension !== 3) ? "Line equation only works for 2D and 3D" : numVectors !== 1 ? "Requires exactly 1 vector" : ""}
            >
              Line Equation
            </button>
            <button
              onClick={calculatePlaneEquation}
              disabled={dimension !== 3 || numVectors !== 2}
              className={`${getButtonClass("plane", "purple")} ${dimension !== 3 || numVectors !== 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={dimension !== 3 ? "Requires 3D" : numVectors !== 2 ? "Requires exactly 2 vectors" : ""}
            >
              Plane Equation
            </button>
          </div>
        </div>

        {selectedOperation === "linearComb" && (
          <div className="mb-8 p-4 bg-green-50/50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Linear Combination Coefficients</h3>
            <div className="flex items-center gap-4 flex-wrap">
              {Array.from({ length: numVectors }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-700">c{String.fromCharCode(8320 + i + 1)}:</span>
                  <input
                    type="text"
                    value={linearCombCoeffs[i] ?? ""}
                    onChange={(e) => updateCoeffValue(i, e.target.value)}
                    className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center border-2 border-green-200 rounded-lg bg-white text-gray-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 font-medium text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
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

