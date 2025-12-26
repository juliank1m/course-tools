"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { MathField } from "react-mathquill";

// Dynamically import MathQuill only on client side to avoid SSR issues
const EditableMathField = dynamic(
  () => import("react-mathquill").then((mod) => {
    // Add styles when component loads
    if (typeof window !== "undefined") {
      mod.addStyles();
    }
    return mod.EditableMathField;
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 min-h-[2.5rem] flex items-center">
        <span className="text-gray-400 text-sm">Loading math editor...</span>
      </div>
    )
  }
);

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onMathFieldReady?: (insertText: (text: string) => void, focus: () => void, backspace: () => void, moveCursorRight: () => void) => void;
}

// Helper function to convert LaTeX content to mathjs
function latexToMathJSHelper(content: string, skipFractions: boolean = false): string {
  if (!content) return "";
  
  let result = content;

  // Replace \left( and \right) (but NOT \left| and \right| - handle those separately for absolute value)
  result = result.replace(/\\left\(/g, "(");
  result = result.replace(/\\right\)/g, ")");

  // Handle fractions only if not skipping
  if (!skipFractions) {
    const parseBracedContent = (str: string, startPos: number): { content: string; endPos: number } => {
      let depth = 0;
      let content = "";
      let pos = startPos;
      
      if (str[pos] !== '{') {
        return { content: "", endPos: pos };
      }
      
      pos++; // Skip opening brace
      while (pos < str.length) {
        if (str[pos] === '\\' && pos + 1 < str.length && str[pos + 1] === '}') {
          content += '}';
          pos += 2;
          continue;
        }
        if (str[pos] === '\\' && pos + 1 < str.length && str[pos + 1] === '{') {
          content += '{';
          pos += 2;
          continue;
        }
        if (str[pos] === '{') {
          depth++;
          content += '{';
        } else if (str[pos] === '}') {
          if (depth === 0) {
            return { content, endPos: pos + 1 };
          }
          depth--;
          content += '}';
        } else {
          content += str[pos];
        }
        pos++;
      }
      return { content, endPos: pos };
    };

    // Process fractions
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
      const prev = result;
      let newResult = "";
      let i = 0;
      
      while (i < result.length) {
        if (result.substr(i, 5) === '\\frac') {
          i += 5; // Skip \frac
          // Parse numerator
          const numMatch = parseBracedContent(result, i);
          if (numMatch.endPos > i) {
            i = numMatch.endPos;
            // Parse denominator
            const denMatch = parseBracedContent(result, i);
            if (denMatch.endPos > i) {
              // Convert numerator and denominator (skip fractions in recursion to avoid infinite loops)
              let numClean = latexToMathJSHelper(numMatch.content, true);
              let denClean = latexToMathJSHelper(denMatch.content, true);
              newResult += `(${numClean})/(${denClean})`;
              i = denMatch.endPos;
              continue;
            }
          }
          // If parsing failed, keep the original
          newResult += '\\frac';
        } else {
          newResult += result[i];
          i++;
        }
      }
      
      result = newResult;
      changed = prev !== result;
      iterations++;
    }
  }

  // Process other LaTeX commands (functions, symbols, superscripts, etc.)
  // This is needed when skipFractions=true to process content inside fractions
  
  // Handle function commands
  result = result.replace(/\\sin\s*\(/g, "sin(");
  result = result.replace(/\\cos\s*\(/g, "cos(");
  result = result.replace(/\\tan\s*\(/g, "tan(");
  result = result.replace(/\\csc\s*\(/g, "csc(");
  result = result.replace(/\\sec\s*\(/g, "sec(");
  result = result.replace(/\\cot\s*\(/g, "cot(");
  result = result.replace(/\\arcsin\s*\(/g, "arcsin(");
  result = result.replace(/\\arccos\s*\(/g, "arccos(");
  result = result.replace(/\\arctan\s*\(/g, "arctan(");
  result = result.replace(/\\sinh\s*\(/g, "sinh(");
  result = result.replace(/\\cosh\s*\(/g, "cosh(");
  result = result.replace(/\\tanh\s*\(/g, "tanh(");
  result = result.replace(/\\ln\s*\(/g, "ln(");
  // Don't convert \log here - handle it specially for log with base
  // Only convert standalone \log( without subscript
  result = result.replace(/\\log\s*\(/g, "log(");
  result = result.replace(/\\exp\s*\(/g, "exp(");

  // Replace Greek letters and symbols
  result = result.replace(/\\pi\b/g, "pi");
  result = result.replace(/\\e\b(?!x)/g, "e");
  result = result.replace(/\\inf\b/g, "inf");
  result = result.replace(/\\infty\b/g, "inf");
  result = result.replace(/\\theta\b/g, "theta");
  result = result.replace(/\\alpha\b/g, "alpha");
  result = result.replace(/\\beta\b/g, "beta");
  result = result.replace(/\\gamma\b/g, "gamma");

  // Handle superscripts
  result = result.replace(/\^\{([^}]+)\}/g, "^$1");
  result = result.replace(/\^([a-zA-Z0-9+\-*/().])/g, "^$1");

  // Handle subscripts
  // Convert _\{base\} to _base, but keep log subscripts for special handling
  result = result.replace(/_\{([^}]+)\}/g, "_$1");

  // Handle multiplication
  result = result.replace(/\\cdot/g, "*");

  // Remove remaining braces
  result = result.replace(/\{([^{}]+)\}/g, "$1");

  return result;
}

// Convert LaTeX to mathjs-compatible format
// This function converts MathQuill's LaTeX output to a format that mathjs can parse
// Exported for use in other components to ensure consistent conversion
export function latexToMathJS(latex: string): string {
  if (!latex) return "";
  
  // Handle log with subscript BEFORE calling helper (which converts \log to log)
  // This ensures we catch \log_{base} patterns before they get converted
  let result = latex;
  
  // First handle \log_{base}\left(arg\right) pattern (from MathQuill LaTeX output)
  // This must match BEFORE helper processes \log
  // Match \left(...\right) - need to match until \right) not just )
  // Use a pattern that matches everything between \left( and \right)
  result = result.replace(/\\log_\{([^}]+)\}\\left\(([^)]*(?:\([^)]*\)[^)]*)*)\\right\)/g, (match, base, arg) => {
    const cleanBase = base.trim();
    // Process the argument through helper to handle any nested LaTeX
    const cleanArg = latexToMathJSHelper(arg.trim(), false);
    // log_2(x) means log base 2 of x
    // mathjs log(x, base) means log base of x, so log_2(x) -> log(x, 2)
    return `log(${cleanArg}, ${cleanBase})`;
  });
  
  // Also handle \log_{base}(arg) without \left (in case MathQuill doesn't use \left)
  result = result.replace(/\\log_\{([^}]+)\}\s*\(([^)]+)\)/g, (match, base, arg) => {
    const cleanBase = base.trim();
    const cleanArg = arg.trim();
    // log_2(x) means log base 2 of x
    // mathjs log(x, base) means log base of x, so log_2(x) -> log(x, 2)
    return `log(${cleanArg}, ${cleanBase})`;
  });
  
  // Now process through helper
  result = latexToMathJSHelper(result, false);

  // Handle absolute value: \left|x\right| -> abs(x)
  // This needs to be done before other replacements that might interfere
  // Match \left|...\right| where ... can contain nested content
  result = result.replace(/\\left\|\s*([^|]*?)\s*\\right\|/g, (match, content) => {
    // Recursively process the content inside the absolute value
    const processedContent = latexToMathJSHelper(content, false);
    return `abs(${processedContent})`;
  });
  // Also handle single | characters (simple absolute value)
  // Match |...| where ... doesn't contain |
  result = result.replace(/\|\s*([^|]+?)\s*\|/g, (match, content) => {
    const processedContent = latexToMathJSHelper(content, false);
    return `abs(${processedContent})`;
  });

  // Handle sqrt: \sqrt{expr} or \sqrt[n]{expr}
  result = result.replace(/\\sqrt\[(\d+)\]\s*\{([^{}]*)\}/g, "nthRoot($2, $1)");
  result = result.replace(/\\sqrt\s*\{([^{}]*)\}/g, "sqrt($1)");
  
  // Handle abs, floor, ceil (these are for explicit \abs{} commands)
  result = result.replace(/\\abs\s*\{([^{}]*)\}/g, "abs($1)");
  result = result.replace(/\\floor\s*\{([^{}]*)\}/g, "floor($1)");
  result = result.replace(/\\ceil\s*\{([^{}]*)\}/g, "ceil($1)");

  // Handle log with subscript (base): log_base(arg) -> log(arg, base)
  // This needs to be done after processing subscripts but BEFORE implicit multiplication
  // After helper processing, log_2(x) should be log_2(x) (subscript converted but log_ preserved)
  // mathjs log(x, base) means log base of x, so log_2(x) -> log(x, 2)
  result = result.replace(/log_([a-zA-Z0-9]+)\s*\(([^)]+)\)/g, (match, base, arg) => {
    const cleanBase = base.trim();
    const cleanArg = arg.trim();
    // log_2(x) means log base 2 of x, so in mathjs it's log(x, 2)
    return `log(${cleanArg}, ${cleanBase})`;
  });
  
  // Also handle log_base without parentheses: log_3 x -> log(x, 3)
  // This must happen BEFORE implicit multiplication adds * between log_3 and x
  result = result.replace(/log_([a-zA-Z0-9]+)\s+([a-zA-Z0-9x]+)/g, (match, base, arg) => {
    const cleanBase = base.trim();
    const cleanArg = arg.trim();
    return `log(${cleanArg}, ${cleanBase})`;
  });
  
  // Handle log_basearg (no space): log_3x -> log(x, 3)
  // This handles cases where there's no space between log_3 and x
  // Only match single-letter variables to avoid false matches
  result = result.replace(/log_([a-zA-Z0-9]+)([a-zA-Z])(?![a-zA-Z0-9])/g, (match, base, arg) => {
    const cleanBase = base.trim();
    const cleanArg = arg.trim();
    return `log(${cleanArg}, ${cleanBase})`;
  });

  // Preserve spaces but normalize multiple spaces to single space
  // Don't trim - allow leading/trailing spaces if user typed them
  result = result.replace(/\s+/g, " ");

  // Don't add implicit multiplication here - let mathjs handle it
  // Mathjs can parse expressions like "2x" and "sin(x)" without explicit *
  // Only add * in cases where it's absolutely necessary and safe
  // Add * only between digit and variable (not function): 2x -> 2*x, but 2sin stays as is
  result = result.replace(/(\d)([a-z]+)\s*\(/g, "$1$2("); // Protect function names like 2sin(
  result = result.replace(/(\d)([a-zA-Z])(?!\w*\()/g, "$1*$2"); // Only add * for single letters after digits

  return result;
}

// Convert mathjs format to LaTeX for MathQuill (simplified - just pass through if already LaTeX-like)
function mathJSToLaTeX(mathjs: string): string {
  if (!mathjs) return "";
  
  let result = mathjs;

  // Handle exponents first: x^2 -> x^{2}, x^(2+3) -> x^{2+3}
  // This needs to be done before other conversions
  result = result.replace(/\^\(([^)]+)\)/g, "^{$1}"); // x^(expr) -> x^{expr}
  result = result.replace(/\^([a-zA-Z0-9]+)/g, "^{$1}"); // x^2 -> x^{2}, x^n -> x^{n}

  // Convert function names to LaTeX commands (simple cases)
  result = result.replace(/\bsin\s*\(/g, "\\sin\\left(");
  result = result.replace(/\bcos\s*\(/g, "\\cos\\left(");
  result = result.replace(/\btan\s*\(/g, "\\tan\\left(");
  result = result.replace(/\bcsc\s*\(/g, "\\csc\\left(");
  result = result.replace(/\bsec\s*\(/g, "\\sec\\left(");
  result = result.replace(/\bcot\s*\(/g, "\\cot\\left(");
  result = result.replace(/\barcsin\s*\(/g, "\\arcsin\\left(");
  result = result.replace(/\barccos\s*\(/g, "\\arccos\\left(");
  result = result.replace(/\barctan\s*\(/g, "\\arctan\\left(");
  result = result.replace(/\bsinh\s*\(/g, "\\sinh\\left(");
  result = result.replace(/\bcosh\s*\(/g, "\\cosh\\left(");
  result = result.replace(/\btanh\s*\(/g, "\\tanh\\left(");
  result = result.replace(/\bln\s*\(/g, "\\ln\\left(");
  
  // Handle log(x, base) -> \log_{base}\left(x\right)
  // This must come before the general log( replacement
  result = result.replace(/\blog\s*\(([^,]+),\s*([^)]+)\)/g, (match, arg, base) => {
    const cleanArg = arg.trim();
    const cleanBase = base.trim();
    return `\\log_{${cleanBase}}\\left(${cleanArg}\\right)`;
  });
  
  // Handle log_base(arg) -> \log_{base}\left(arg\right) for display
  // This handles the case where user types log_2(x) and we want to display it properly
  // Note: MathQuill will output \log_{base} with braces, but we want to display it as log_base
  result = result.replace(/\blog_([a-zA-Z0-9]+)\s*\(([^)]+)\)/g, (match, base, arg) => {
    const cleanBase = base.trim();
    const cleanArg = arg.trim();
    return `\\log_{${cleanBase}}\\left(${cleanArg}\\right)`;
  });
  
  result = result.replace(/\blog\s*\(/g, "\\log\\left(");
  result = result.replace(/\bexp\s*\(/g, "\\exp\\left(");
  result = result.replace(/\bsqrt\s*\(/g, "\\sqrt{");
  result = result.replace(/\babs\s*\(/g, "\\abs{");

  // Convert symbols
  result = result.replace(/\bpi\b/g, "\\pi");
  result = result.replace(/\binf\b/g, "\\infty");
  result = result.replace(/\btheta\b/g, "\\theta");
  result = result.replace(/\balpha\b/g, "\\alpha");
  result = result.replace(/\bbeta\b/g, "\\beta");
  result = result.replace(/\bgamma\b/g, "\\gamma");

  // Fix parentheses - close opened left(
  result = result.replace(/\\left\(([^)]*)\)/g, "\\left($1\\right)");
  // Close unclosed sqrt and abs
  result = result.replace(/\\sqrt\{([^}]*)([^}])/g, "\\sqrt{$1$2}");
  result = result.replace(/\\abs\{([^}]*)([^}])/g, "\\abs{$1$2}");

  return result;
}

export default function MathInput({ value, onChange, placeholder, className = "", onMathFieldReady }: MathInputProps) {
  const mathFieldRef = useRef<MathField | null>(null);
  const [internalLatex, setInternalLatex] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Expose insertText, focus, and backspace functions to parent
  useEffect(() => {
    if (isMounted && mathFieldRef.current && onMathFieldReady) {
      const insertText = (text: string) => {
        if (mathFieldRef.current) {
          // Use typedText to insert text - MathQuill handles special characters like ^ correctly
          mathFieldRef.current.typedText(text);
          // Trigger onChange to sync state
          const latex = mathFieldRef.current.latex();
          setInternalLatex(latex);
          const mathjsValue = latexToMathJS(latex);
          onChange(mathjsValue || "");
        }
      };
      
      const moveCursorRight = () => {
        if (mathFieldRef.current) {
          (mathFieldRef.current as any).keystroke('Right');
        }
      };

      const focus = () => {
        if (mathFieldRef.current) {
          const el = (mathFieldRef.current as any).el();
          if (el) {
            el.focus();
          }
        }
      };

      const backspace = () => {
        if (mathFieldRef.current) {
          try {
            // Use MathQuill's keystroke method to handle backspace properly
            (mathFieldRef.current as any).keystroke('Backspace');
            // Trigger onChange to sync state
            const latex = mathFieldRef.current.latex();
            setInternalLatex(latex);
            const mathjsValue = latexToMathJS(latex);
            onChange(mathjsValue || "");
          } catch (e) {
            // Fallback: manually delete last character from LaTeX
            const latex = mathFieldRef.current.latex();
            if (latex.length > 0) {
              const newLatex = latex.slice(0, -1);
              mathFieldRef.current.latex(newLatex);
              setInternalLatex(newLatex);
              const mathjsValue = latexToMathJS(newLatex);
              onChange(mathjsValue || "");
            }
          }
        }
      };

      onMathFieldReady(insertText, focus, backspace, moveCursorRight);
    }
  }, [isMounted, onMathFieldReady, onChange]);

  // Initialize internalLatex from value prop on mount
  useEffect(() => {
    if (value && !internalLatex && !isMounted) {
      const convertedLatex = mathJSToLaTeX(value);
      setInternalLatex(convertedLatex);
    }
  }, [value, internalLatex, isMounted]);

  // Convert value prop to LaTeX when it changes externally (after mount)
  // Only update if the value prop is actually different from what we have
  useEffect(() => {
    if (isMounted && mathFieldRef.current) {
      const currentLatex = mathFieldRef.current.latex();
      const currentMathJS = latexToMathJS(currentLatex);
      
      // Only update if the value prop is different from what MathQuill currently has
      // This prevents overwriting user input while they're typing
      if (value !== currentMathJS) {
        if (value === "") {
          // Clear the field
          if (currentLatex !== "") {
            mathFieldRef.current.latex("");
            setInternalLatex("");
          }
        } else {
          // Update with new value
          const convertedLatex = mathJSToLaTeX(value);
          if (currentLatex !== convertedLatex) {
            mathFieldRef.current.latex(convertedLatex);
            setInternalLatex(convertedLatex);
          }
        }
      }
    }
  }, [value, isMounted]);

  const handleChange = (mathField: MathField) => {
    const latex = mathField.latex();
    setInternalLatex(latex);
    
    // Convert LaTeX to mathjs format
    let mathjsValue = latexToMathJS(latex);
    
    // If conversion results in empty or problematic string, try text() method
    if (!mathjsValue || mathjsValue.trim() === "") {
      const plainText = mathField.text();
      mathjsValue = plainText || "";
    }
    
    // Always call onChange to keep parent in sync
    // Empty string is valid (user cleared the field)
    onChange(mathjsValue);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <EditableMathField
          latex={internalLatex}
          onChange={handleChange}
          mathquillDidMount={(mathField: MathField) => {
            mathFieldRef.current = mathField;
            setIsMounted(true);
            
            // Initialize with value if provided
            const initLatex = value ? mathJSToLaTeX(value) : (internalLatex || "");
            if (initLatex) {
              // Use setTimeout to ensure MathQuill is fully initialized
              setTimeout(() => {
                mathField.latex(initLatex);
                setInternalLatex(initLatex);
              }, 0);
            }
            
            // Get the underlying DOM element
            const el = (mathField as any).el();
            if (el) {
              // Add keydown listener to handle space before MathQuill processes it
              // Let MathQuill handle ^ natively for proper exponent support
              const handleKeyDown = (e: KeyboardEvent) => {
                // Handle space key - insert as text and prevent default tab behavior
                if (e.key === " " && !e.ctrlKey && !e.altKey && !e.metaKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  mathField.typedText(" ");
                  return false;
                }
              };
              
              el.addEventListener("keydown", handleKeyDown, true); // Use capture phase
              
              // Clean up listener on unmount
              return () => {
                el.removeEventListener("keydown", handleKeyDown, true);
              };
            }
          }}
          config={{
            autoCommands: "pi theta sqrt sum prod alpha beta gamma delta epsilon lambda mu sigma phi",
            autoOperatorNames: "sin cos tan sec csc cot arcsin arccos arctan sinh cosh tanh ln log exp abs floor ceil",
            spaceBehavesLikeTab: false,
            leftRightIntoCmdGoes: "up",
            restrictMismatchedBrackets: false,
            sumStartsWithNEquals: true,
            supSubsRequireOperand: true, // Require operand for proper exponent handling
            charsThatBreakOutOfSupSub: "+-=<>",
            autoSubscriptNumerals: false,
            maxDepth: 10,
          }}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[2.5rem]"
        />
      </div>
    </div>
  );
}
