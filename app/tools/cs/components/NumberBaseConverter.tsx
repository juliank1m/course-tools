"use client";

import { useState } from "react";

type Base = 2 | 8 | 10 | 16;

const BASE_NAMES: Record<Base, string> = {
  2: "Binary",
  8: "Octal",
  10: "Decimal",
  16: "Hexadecimal",
};

export default function NumberBaseConverter() {
  const [inputValue, setInputValue] = useState("");
  const [fromBase, setFromBase] = useState<Base>(10);
  const [results, setResults] = useState<Record<Base, string>>({
    2: "",
    8: "",
    10: "",
    16: "",
  });
  const [error, setError] = useState<string | null>(null);

  const isValidForBase = (value: string, base: Base): boolean => {
    if (!value.trim()) return true;
    
    const patterns: Record<Base, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^-?\d+$/,
      16: /^[0-9A-Fa-f]+$/,
    };

    return patterns[base].test(value.trim());
  };

  const convertFromBase = (value: string, base: Base): number | null => {
    if (!value.trim()) return null;
    
    try {
      // Handle negative numbers
      const isNegative = value.trim().startsWith("-");
      const absValue = isNegative ? value.trim().slice(1) : value.trim();
      
      const decimal = parseInt(absValue, base);
      if (isNaN(decimal)) return null;
      
      return isNegative ? -decimal : decimal;
    } catch {
      return null;
    }
  };

  const convertToBase = (decimal: number, base: Base): string => {
    if (decimal === 0) return "0";
    
    const isNegative = decimal < 0;
    let num = Math.abs(decimal);
    let result = "";

    if (base === 10) {
      return isNegative ? `-${num}` : num.toString();
    }

    while (num > 0) {
      const remainder = num % base;
      result = (remainder < 10 ? remainder : String.fromCharCode(55 + remainder)) + result;
      num = Math.floor(num / base);
    }

    return isNegative ? `-${result}` : result;
  };

  const handleInputChange = (value: string, base: Base) => {
    setInputValue(value);
    setError(null);

    if (!value.trim()) {
      setResults({ 2: "", 8: "", 10: "", 16: "" });
      return;
    }

    if (!isValidForBase(value, base)) {
      setError(`Invalid ${BASE_NAMES[base]} number. ${getBaseHint(base)}`);
      setResults({ 2: "", 8: "", 10: "", 16: "" });
      return;
    }

    const decimal = convertFromBase(value, base);
    if (decimal === null) {
      setError("Invalid number format");
      setResults({ 2: "", 8: "", 10: "", 16: "" });
      return;
    }

    setResults({
      2: convertToBase(decimal, 2),
      8: convertToBase(decimal, 8),
      10: convertToBase(decimal, 10),
      16: convertToBase(decimal, 16).toUpperCase(),
    });
  };

  const getBaseHint = (base: Base): string => {
    switch (base) {
      case 2:
        return "Binary numbers can only contain 0 and 1.";
      case 8:
        return "Octal numbers can only contain digits 0-7.";
      case 10:
        return "Decimal numbers can contain digits 0-9 and optional minus sign.";
      case 16:
        return "Hexadecimal numbers can contain digits 0-9 and letters A-F.";
      default:
        return "";
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const getBaseColor = (base: Base): string => {
    switch (base) {
      case 2:
        return "bg-blue-50 border-blue-200 text-blue-700";
      case 8:
        return "bg-purple-50 border-purple-200 text-purple-700";
      case 10:
        return "bg-green-50 border-green-200 text-green-700";
      case 16:
        return "bg-orange-50 border-orange-200 text-orange-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div>
      <div className="mb-6 p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Number Base Converter</h2>
        <p className="text-sm text-gray-600 mb-4">
          Convert numbers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16).
        </p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enter Number:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value, fromBase)}
              placeholder={`Enter ${BASE_NAMES[fromBase]} number...`}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <select
              value={fromBase}
              onChange={(e) => {
                const newBase = parseInt(e.target.value) as Base;
                setFromBase(newBase);
                handleInputChange(inputValue, newBase);
              }}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-medium"
            >
              <option value="2">Binary (Base 2)</option>
              <option value="8">Octal (Base 8)</option>
              <option value="10">Decimal (Base 10)</option>
              <option value="16">Hexadecimal (Base 16)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {inputValue.trim() && !error && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Converted Values:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([2, 8, 10, 16] as Base[]).map((base) => (
              <div
                key={base}
                className={`p-4 rounded-lg border-2 ${getBaseColor(base)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{BASE_NAMES[base]} (Base {base})</span>
                  <button
                    onClick={() => handleCopy(results[base])}
                    className="text-xs px-2 py-1 bg-white/50 hover:bg-white/80 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="font-mono text-lg font-bold break-all">
                  {results[base] || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3">About Number Bases</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Binary (Base 2):</strong> Uses only 0 and 1. Commonly used in computer science.
          </p>
          <p>
            <strong>Octal (Base 8):</strong> Uses digits 0-7. Less common but used in some programming contexts.
          </p>
          <p>
            <strong>Decimal (Base 10):</strong> Uses digits 0-9. The standard number system we use daily.
          </p>
          <p>
            <strong>Hexadecimal (Base 16):</strong> Uses digits 0-9 and letters A-F. Widely used in programming and memory addresses.
          </p>
        </div>
      </div>
    </div>
  );
}

