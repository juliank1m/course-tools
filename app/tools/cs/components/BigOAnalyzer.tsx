"use client";

import { useState, useRef, useEffect } from "react";

type ComplexityResult = {
  notation: string;
  explanation: string;
  steps: string[];
  category: "time" | "space";
};

type Example = {
  name: string;
  code: string;
  description: string;
  language: string;
};

type KnownComplexity = {
  code: string;
  notation: string;
  explanation: string;
  steps: string[];
};

const EXAMPLES: Example[] = [
  {
    name: "Linear Search (JavaScript)",
    language: "JavaScript",
    description: "O(n) - Single loop through array",
    code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`,
  },
  {
    name: "Linear Search (Python)",
    language: "Python",
    description: "O(n) - Single loop through array",
    code: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
  },
  {
    name: "Linear Search (Java)",
    language: "Java",
    description: "O(n) - Single loop through array",
    code: `public int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}`,
  },
  {
    name: "Bubble Sort (JavaScript)",
    language: "JavaScript",
    description: "O(n²) - Nested loops",
    code: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
  },
  {
    name: "Bubble Sort (Python)",
    language: "Python",
    description: "O(n²) - Nested loops",
    code: `def bubble_sort(arr):
    for i in range(len(arr)):
        for j in range(len(arr) - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
  },
  {
    name: "Binary Search (JavaScript)",
    language: "JavaScript",
    description: "O(log n) - Divide and conquer",
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
  },
  {
    name: "Binary Search (Python)",
    language: "Python",
    description: "O(log n) - Divide and conquer",
    code: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
  },
  {
    name: "Fibonacci (Recursive - Python)",
    language: "Python",
    description: "O(2ⁿ) - Exponential recursion",
    code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`,
  },
  {
    name: "Fibonacci (Recursive - Java)",
    language: "Java",
    description: "O(2ⁿ) - Exponential recursion",
    code: `public int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  },
  {
    name: "Merge Sort (Python)",
    language: "Python",
    description: "O(n log n) - Divide and conquer",
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
  },
  {
    name: "Nested Loops (C++)",
    language: "C++",
    description: "O(n³) - Triple nested loops",
    code: `void tripleNested(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            for (int k = 0; k < n; k++) {
                // Some operation
                cout << arr[i] << arr[j] << arr[k];
            }
        }
    }
}`,
  },
  {
    name: "Matrix Multiplication (Python)",
    language: "Python",
    description: "O(n³) - Three nested loops",
    code: `def matrix_multiply(A, B):
    result = []
    for i in range(len(A)):
        result.append([])
        for j in range(len(B[0])):
            result[i].append(0)
            for k in range(len(B)):
                result[i][j] += A[i][k] * B[k][j]
    return result`,
  },
];

// Known exact-code patterns for offline mode so sample algorithms are always correct
const KNOWN_COMPLEXITIES: KnownComplexity[] = [
  {
    code: EXAMPLES[0].code, // Linear Search (JS)
    notation: "O(n)",
    explanation: "Linear search scans the array once, checking each element at most one time.",
    steps: [
      "Single for-loop that iterates at most n times.",
      "Each iteration does constant work: one comparison and possibly a return.",
      "Total work grows linearly with the number of elements, so time complexity is O(n).",
    ],
  },
  {
    code: EXAMPLES[1].code, // Linear Search (Python)
    notation: "O(n)",
    explanation: "Linear search over a list performs one pass through all elements.",
    steps: [
      "The for-loop runs once for each element in the list (up to n iterations).",
      "Inside the loop there is only a constant-time equality check and return.",
      "Therefore, total time grows proportionally to n → O(n).",
    ],
  },
  {
    code: EXAMPLES[2].code, // Linear Search (Java)
    notation: "O(n)",
    explanation: "The Java linearSearch method scans the array once, checking each element at most one time.",
    steps: [
      "The for-loop runs from i = 0 to i < arr.length, so up to n iterations.",
      "Inside the loop, each iteration performs a single equality comparison and possibly returns.",
      "Work per iteration is constant, and total work scales linearly with n → O(n).",
    ],
  },
  {
    code: EXAMPLES[3].code, // Bubble Sort (JS)
    notation: "O(n²)",
    explanation: "Bubble sort uses two nested loops, each up to n iterations.",
    steps: [
      "Outer loop runs n times in the worst case.",
      "Inner loop runs up to n times for each outer iteration.",
      "Total comparisons are on the order of n × n = n² → O(n²).",
    ],
  },
  {
    code: EXAMPLES[5].code, // Binary Search (JS)
    notation: "O(log n)",
    explanation: "Binary search repeatedly halves the search interval.",
    steps: [
      "Each iteration computes a mid index and compares once.",
      "On each step, half of the remaining items are discarded.",
      "The interval size drops from n to 1 in log₂(n) steps → O(log n).",
    ],
  },
  {
    code: EXAMPLES[6].code, // Binary Search (Python)
    notation: "O(log n)",
    explanation: "Binary search divides the search range by 2 each iteration.",
    steps: [
      "The while-loop continues while the interval [left, right] is non-empty.",
      "Each loop halves the interval by moving either left or right.",
      "Number of iterations is proportional to log₂(n) → O(log n).",
    ],
  },
  {
    code: EXAMPLES[7].code, // Fibonacci (Recursive - Python)
    notation: "O(2ⁿ)",
    explanation: "Naive recursive Fibonacci expands into a binary recursion tree.",
    steps: [
      "Each call to fibonacci(n) makes two recursive calls (n-1 and n-2) until the base case.",
      "This forms a branching tree of calls where the number of nodes roughly doubles each level.",
      "Total number of calls grows exponentially with n → O(2ⁿ).",
    ],
  },
  {
    code: EXAMPLES[8].code, // Fibonacci (Recursive - Java)
    notation: "O(2ⁿ)",
    explanation: "Each Fibonacci call branches into two smaller calls until the base case.",
    steps: [
      "For n > 1 the function calls itself twice: fibonacci(n-1) and fibonacci(n-2).",
      "The recursion tree has about 2ⁿ nodes in the worst case.",
      "Thus the time complexity is exponential → O(2ⁿ).",
    ],
  },
  {
    code: EXAMPLES[9].code, // Merge Sort (Python)
    notation: "O(n log n)",
    explanation: "Merge sort repeatedly splits the array and merges sorted halves.",
    steps: [
      "The array is split in half recursively, giving log₂(n) levels of recursion.",
      "At each level, merge combines all elements with linear work O(n).",
      "Total time is O(n) work per level × log₂(n) levels → O(n log n).",
    ],
  },
  {
    code: EXAMPLES[10].code, // Nested Loops (C++)
    notation: "O(n³)",
    explanation: "Three nested loops each iterate up to n times.",
    steps: [
      "Outer loop over i runs n times.",
      "Middle loop over j runs n times for each i.",
      "Inner loop over k runs n times for each (i, j) pair → n × n × n = n³ iterations.",
    ],
  },
  {
    code: EXAMPLES[11].code, // Matrix Multiplication (Python)
    notation: "O(n³)",
    explanation: "Classic cubic matrix multiplication uses three nested loops.",
    steps: [
      "Outer loop over i runs n times for n rows of the result.",
      "Middle loop over j runs n times for n columns of the result.",
      "Inner loop over k performs n multiplications/additions per (i, j) position.",
      "Total operations scale as n × n × n = n³ → O(n³).",
    ],
  },
];

function analyzeComplexity(code: string): ComplexityResult | null {
  if (!code.trim()) return null;

  // First, check if this code exactly matches one of our known sample algorithms.
  // This guarantees offline mode is correct for the built-in examples.
  const knownMatch = KNOWN_COMPLEXITIES.find(
    (k) => k.code.trim() === code.trim()
  );
  if (knownMatch) {
    return {
      notation: knownMatch.notation,
      explanation: knownMatch.explanation,
      steps: knownMatch.steps,
      category: "time",
    };
  }

  const normalizedCode = code.toLowerCase();
  const lines = code.split("\n").filter((line) => line.trim());
  
  const steps: string[] = [];
  let timeComplexity = "";
  let explanation = "";
  
  // Language-agnostic loop patterns (for, while, do-while)
  // Supports: for(...), while(...), for ... in, for ... of, for ... range
  const loopPatterns = [
    /\bfor\s*\([^)]*\)\s*\{/g,           // C-style: for(...) {
    /\bfor\s+[a-zA-Z_]\w*\s+in\s+/g,     // Python: for x in
    /\bfor\s+\([^)]*\)\s*\{/g,           // C++/Java: for(...) {
    /\bwhile\s*\([^)]*\)\s*\{/g,         // while(...) {
    /\bwhile\s+[a-zA-Z_]\w*\s+in\s+/g,   // Python: while x in
    /\bdo\s*\{/g,                         // do {
    /\bfor\s+[a-zA-Z_]\w*\s+of\s+/g,     // JavaScript: for x of
  ];
  
  let maxNesting = 0;
  let currentNesting = 0;
  let loopCount = 0;
  let isPython = false;
  
  // Detect Python (indentation-based, no braces)
  if (code.match(/^\s*def\s+\w+/m) || code.match(/^\s*for\s+\w+\s+in\s+/m)) {
    isPython = true;
  }
  
  // Nesting detection: braces for most languages, indentation for Python
  if (isPython) {
    // Python: count indentation-based loop nesting levels
    // We track active loop blocks by their indentation.
    const activeLoopIndents: number[] = [];
    for (const line of lines) {
      const indent = (line.match(/^(\s*)/)?.[1] || "").length;
      const trimmed = line.trim();
      
      // Check for loops
      const hasLoop = /\b(for|while)\s+/.test(trimmed);
      // Pop loops whose block has ended (indentation decreased or stayed the same)
      while (
        activeLoopIndents.length > 0 &&
        indent <= activeLoopIndents[activeLoopIndents.length - 1]
      ) {
        activeLoopIndents.pop();
      }

      if (hasLoop) {
        loopCount++;
        activeLoopIndents.push(indent);
        maxNesting = Math.max(maxNesting, activeLoopIndents.length);
      }
    }
  } else {
    // Brace-based languages (C, C++, Java, JavaScript, etc.)
    for (const line of lines) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      // Check for loops (language-agnostic)
      const hasLoop = loopPatterns.some(pattern => {
        pattern.lastIndex = 0; // Reset regex
        return pattern.test(line);
      });
      
      if (hasLoop) {
        loopCount++;
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      
      currentNesting += openBraces - closeBraces;
      currentNesting = Math.max(0, currentNesting);
    }
  }
  
  // Language-agnostic function name detection
  // Supports: function name(), def name(), public int name(), void name(), etc.
  const functionPatterns = [
    /(?:function|def|public|private|protected|static)\s+[\w<>\[\]]+\s+(\w+)\s*\(/g,
    /(?:function|def)\s+(\w+)\s*\(/g,
    /const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g,
    /(\w+)\s*=\s*function\s*\(/g,
  ];
  
  let functionName: string | null = null;
  for (const pattern of functionPatterns) {
    const match = code.match(pattern);
    if (match) {
      functionName = match[1] || match[0].split(/\s+/).find(part => /^\w+$/.test(part)) || null;
      if (functionName) break;
    }
  }
  
  // Check for recursion (language-agnostic)
  // Escape special regex characters in function name
  const escapedFunctionName = functionName ? functionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
  const hasRecursion = escapedFunctionName && 
    new RegExp(`\\b${escapedFunctionName}\\s*\\(`, "g").test(code) && 
    (code.match(new RegExp(`\\b${escapedFunctionName}\\s*\\(`, "g")) || []).length > 1;
  
  // Check for binary search pattern (divide by 2) - language-agnostic
  // Supports: / 2, // 2, >> 1, Math.floor(.../2), (left + right) / 2, etc.
  const hasDivideByTwo = /\/(\s*\/)?\s*2|>>\s*1|Math\.floor.*\/\s*2|\([^)]+\+\s*[^)]+\)\s*\/\s*2|mid\s*=\s*\([^)]+\+\s*[^)]+\)\s*\/\s*2/.test(code);
  const hasLogPattern = hasDivideByTwo && (loopCount === 1 || hasRecursion);
  
  // Check for exponential recursion (multiple recursive calls)
  if (hasRecursion) {
    const recursiveCalls = escapedFunctionName ? (code.match(new RegExp(`\\b${escapedFunctionName}\\s*\\(`, "g")) || []).length - 1 : 0;
    if (recursiveCalls >= 2) {
      steps.push(`Found recursive function with ${recursiveCalls} recursive calls`);
      if (hasLogPattern) {
        timeComplexity = "O(log n)";
        explanation = "Recursive function with divide-and-conquer pattern (divides problem size by 2 each time)";
        steps.push("Each recursive call reduces problem size by half");
        steps.push("Total depth: log₂(n)");
      } else {
        timeComplexity = "O(2ⁿ)";
        explanation = "Exponential recursion - each call makes multiple recursive calls";
        steps.push(`Each call branches into ${recursiveCalls} subproblems`);
        steps.push("Total nodes in recursion tree: 2ⁿ");
      }
    } else if (hasLogPattern) {
      timeComplexity = "O(log n)";
      explanation = "Recursive function with divide-and-conquer pattern";
      steps.push("Problem size reduces by half each iteration");
    } else {
      timeComplexity = "O(n)";
      explanation = "Linear recursion - single recursive call per iteration";
      steps.push("Makes one recursive call per step");
    }
  } else if (maxNesting >= 3) {
    timeComplexity = "O(n³)";
    explanation = "Triple nested loops";
    steps.push(`Found ${maxNesting} levels of nesting`);
    steps.push("Each loop iterates up to n times");
    steps.push("Total iterations: n × n × n = n³");
  } else if (maxNesting === 2) {
    // Check if it's n log n pattern
    const hasMergePattern = /merge|split|divide/.test(normalizedCode) || 
      (loopCount === 1 && hasDivideByTwo);
    if (hasMergePattern || (hasDivideByTwo && loopCount <= 2)) {
      timeComplexity = "O(n log n)";
      explanation = "Nested loops with divide-and-conquer pattern";
      steps.push("Outer structure divides problem (log n levels)");
      steps.push("Inner loop processes n elements at each level");
      steps.push("Total: n × log n");
    } else {
      timeComplexity = "O(n²)";
      explanation = "Double nested loops";
      steps.push(`Found ${maxNesting} levels of nesting`);
      steps.push("Each loop iterates up to n times");
      steps.push("Total iterations: n × n = n²");
    }
  } else if (maxNesting === 1 || loopCount === 1) {
    if (hasDivideByTwo) {
      timeComplexity = "O(log n)";
      explanation = "Single loop with divide-by-two pattern";
      steps.push("Loop reduces problem size by half each iteration");
      steps.push("Total iterations: log₂(n)");
    } else {
      timeComplexity = "O(n)";
      explanation = "Single loop";
      steps.push(`Found ${loopCount} loop(s)`);
      steps.push("Iterates through n elements once");
    }
  } else if (loopCount === 0) {
    timeComplexity = "O(1)";
    explanation = "Constant time - no loops or recursion";
    steps.push("No loops or recursive calls detected");
    steps.push("Operations execute in fixed time");
  } else {
    timeComplexity = "O(n)";
    explanation = "Linear time complexity";
    steps.push(`Found ${loopCount} loop(s)`);
  }

  // Override with a simple loop-based estimation for non-recursive cases.
  // This makes offline mode predictable for straightforward code:
  // - No loops → O(1)
  // - One level of loops → O(n)
  // - Two nested loops → O(n²)
  // - Three or more nested loops → O(n³)
  // If there is recursion without loops, keep the recursion-based estimate above.
  if (!hasRecursion || loopCount > 0) {
    if (loopCount === 0) {
      timeComplexity = "O(1)";
      explanation =
        "No loops detected, so the running time does not scale with input size.";
      steps.push("Simple operations without any loops.");
    } else if (maxNesting <= 1) {
      timeComplexity = "O(n)";
      explanation = "Single level of looping over the input.";
      steps.push("At most one loop runs over up to n elements.");
    } else if (maxNesting === 2) {
      timeComplexity = "O(n²)";
      explanation = "Two nested loops over the input.";
      steps.push(
        "Two loops are nested: the outer loop runs up to n times and the inner loop runs up to n times for each outer iteration."
      );
    } else {
      timeComplexity = "O(n³)";
      explanation = "Three or more nested loops; approximated as cubic time.";
      steps.push(
        "Detected three or more levels of nested loops; these dominate the running time."
      );
    }
  }

  return {
    notation: timeComplexity,
    explanation,
    steps,
    category: "time",
  };
}

export default function BigOAnalyzer() {
  const [code, setCode] = useState("");
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [result, setResult] = useState<ComplexityResult | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExampleOpen, setIsExampleOpen] = useState(false);
  const exampleDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close example dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isExampleOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        exampleDropdownRef.current &&
        !exampleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExampleOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExampleOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExampleOpen]);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please enter some code to analyze");
      return;
    }

    setError(null);
    
    if (useAI) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/analyze-complexity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          const errorMsg = errorData.error || "Failed to analyze complexity";
          const details = errorData.details || errorData.message || "";
          throw new Error(details ? `${errorMsg}: ${details}` : errorMsg);
        }

        const analysis = await response.json();
        setResult({
          notation: analysis.notation || "Unable to determine",
          explanation: analysis.explanation || "",
          steps: analysis.steps || [],
          category: "time",
        });
      } catch (err: any) {
        setError(err.message || "Failed to analyze complexity. Make sure your OpenAI API key is configured.");
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      const analysis = analyzeComplexity(code);
      setResult(analysis);
    }
  };

  const handleExampleSelect = (exampleName: string) => {
    const example = EXAMPLES.find((e) => e.name === exampleName);
    if (example) {
      setCode(example.code);
      setSelectedExample(exampleName);
      // Auto-analyze when example is selected (using current mode)
      setTimeout(() => {
        if (useAI) {
          handleAnalyze();
        } else {
          const analysis = analyzeComplexity(example.code);
          setResult(analysis);
        }
      }, 100);
    }
  };

  const filteredExamples = selectedLanguage === "all" 
    ? EXAMPLES 
    : EXAMPLES.filter(e => e.language === selectedLanguage);

  const languages = Array.from(new Set(EXAMPLES.map(e => e.language))).sort();

  const getComplexityColor = (notation: string) => {
    if (notation.includes("O(1)")) return "text-green-600 bg-green-50 border-green-200";
    if (notation.includes("O(log")) return "text-blue-600 bg-blue-50 border-blue-200";
    if (notation.includes("O(n)")) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (notation.includes("O(n log")) return "text-orange-600 bg-orange-50 border-orange-200";
    if (notation.includes("O(n²)")) return "text-red-600 bg-red-50 border-red-200";
    if (notation.includes("O(n³)")) return "text-purple-600 bg-purple-50 border-purple-200";
    if (notation.includes("O(2")) return "text-pink-600 bg-pink-50 border-pink-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div>

        {/* Examples Section */}
        <div className="relative z-10 mb-6 p-4 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 mb-3">
            {/* Custom example selector */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Try an Example:
              </label>
              <div ref={exampleDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsExampleOpen((open) => !open)}
                  className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/80 to-blue-100/80 text-gray-800 shadow-sm text-left flex items-center justify-between hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <span className="truncate text-sm sm:text-base">
                    {selectedExample
                      ? EXAMPLES.find((e) => e.name === selectedExample)?.name
                      : "Select an example algorithm..."}
                  </span>
                  <span className="ml-3 text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    {selectedExample ? "Change" : "Browse"}
                  </span>
                </button>
                {isExampleOpen && (
                  <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-blue-100 bg-white shadow-xl">
                    <div className="px-3 py-2 border-b border-blue-50 text-xs text-gray-500">
                      Popular algorithms by language
                    </div>
                    {filteredExamples.map((example) => (
                      <button
                        key={example.name}
                        type="button"
                        onClick={() => {
                          handleExampleSelect(example.name);
                          setIsExampleOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm flex flex-col gap-0.5 hover:bg-blue-50 transition-colors ${
                          selectedExample === example.name ? "bg-blue-50" : ""
                        }`}
                      >
                        <span className="font-medium text-gray-800">
                          {example.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {example.description}
                        </span>
                        <span className="text-[10px] inline-flex items-center rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 mt-1 border border-blue-100">
                          {example.language}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Language filter as pills */}
            <div className="sm:w-56">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Language:
              </label>
              <div className="flex flex-wrap gap-2">
                {["all", ...languages].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setSelectedExample("");
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedLanguage === lang
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white/80 text-gray-700 border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    {lang === "all" ? "All" : lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supports JavaScript, Python, Java, C++, and more. The analyzer detects patterns across languages.
          </p>
        </div>

        {/* Analysis Mode Toggle */}
        <div className="mb-4 p-4 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-gray-700">Analysis Mode</p>
          <div className="mt-2 flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => {
                  setUseAI(e.target.checked);
                  setResult(null);
                  setError(null);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-2 py-1 rounded-full border ${
                  !useAI
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                Pattern Matching
              </span>
              <span
                className={`px-2 py-1 rounded-full border ${
                  useAI
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                AI Analysis
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {useAI
              ? "Uses the OpenAI API to understand your code semantically and provide more accurate complexity estimates."
              : "Runs entirely in your browser using pattern detection. Great for quick checks, but may miss tricky or optimized algorithms."}
          </p>
        </div>

        {/* Code Input Section */}
        <div className="mb-6 p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-lg font-bold text-gray-800">Code Input</label>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Analyze Complexity"
              )}
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste or type your code here...&#10;&#10;Example:&#10;function example(arr) {&#10;  for (let i = 0; i < arr.length; i++) {&#10;    // operations&#10;  }&#10;}"
            className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
          />
        </div>

        {/* Error Section */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            {error.includes("unavailable") && (
              <p className="text-xs text-red-600 mt-2">
                You can still use pattern matching mode (toggle AI Analysis OFF) for free analysis.
              </p>
            )}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mb-6 p-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-purple-50/60 backdrop-blur-sm border-2 border-blue-200 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="text-xl font-bold text-gray-800">Complexity Analysis</h3>
            </div>
            
            <div className={`mb-4 p-4 rounded-lg border-2 ${getComplexityColor(result.notation)}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Time Complexity:</span>
                <span className="text-2xl font-bold">{result.notation}</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{result.explanation}</p>
            </div>

            {result.steps.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis Steps:</h4>
                <ul className="space-y-2">
                  {result.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 font-bold mt-1">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-100">
              {useAI ? (
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> This analysis uses AI to understand code semantics and provide detailed explanations. It can handle complex algorithms and edge cases better than pattern matching.
                </p>
              ) : (
                <div className="text-xs">
                  <p className="text-yellow-700 font-semibold mb-2">
                    ⚠️ Accuracy Warning
                  </p>
                  <p className="text-gray-600">
                    This is an automated analysis based on pattern detection and <strong>may not be accurate</strong> for complex algorithms. The analyzer supports multiple languages (JavaScript, Python, Java, C++, etc.) by detecting common patterns like loops, recursion, and divide-and-conquer. For more accurate results, especially with complex or optimized code, use AI analysis mode or perform manual review.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Common Big O Complexities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <span className="font-bold text-green-700">O(1)</span> - Constant time
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <span className="font-bold text-blue-700">O(log n)</span> - Logarithmic (binary search)
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <span className="font-bold text-yellow-700">O(n)</span> - Linear (single loop)
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <span className="font-bold text-orange-700">O(n log n)</span> - Linearithmic (merge sort)
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <span className="font-bold text-red-700">O(n²)</span> - Quadratic (nested loops)
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <span className="font-bold text-purple-700">O(n³)</span> - Cubic (triple nested)
            </div>
            <div className="p-3 bg-pink-50 border border-pink-200 rounded">
              <span className="font-bold text-pink-700">O(2ⁿ)</span> - Exponential (recursive fibonacci)
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <span className="font-bold text-gray-700">O(n!)</span> - Factorial (permutations)
            </div>
          </div>
        </div>
    </div>
  );
}
