"use client";

import { useState, useRef, useEffect } from "react";

interface VirtualMathKeyboardProps {
  insertText: (text: string) => void;
  focus: () => void;
  backspace: () => void;
  moveCursorRight?: () => void;
  isOpen: boolean;
  onClose: () => void;
  mathInputContainerRef?: React.RefObject<HTMLElement>;
}

export default function VirtualMathKeyboard({
  insertText,
  focus,
  backspace,
  moveCursorRight,
  isOpen,
  onClose,
  mathInputContainerRef,
}: VirtualMathKeyboardProps) {
  const [showFunctionMenu, setShowFunctionMenu] = useState(false);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const functionMenuRef = useRef<HTMLDivElement>(null);

  // Close keyboard when clicking outside (but not on the MathInput field)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking on the keyboard itself
      if (keyboardRef.current && keyboardRef.current.contains(target)) {
        return;
      }
      // Don't close if clicking on the MathInput field
      if (mathInputContainerRef?.current && mathInputContainerRef.current.contains(target)) {
        return;
      }
      // Close if clicking anywhere else
      onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose, mathInputContainerRef]);

  // Close function menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (functionMenuRef.current && !functionMenuRef.current.contains(target)) {
        setShowFunctionMenu(false);
      }
    };

    if (showFunctionMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFunctionMenu]);

  // Maintain focus when keyboard opens
  useEffect(() => {
    if (isOpen && focus) {
      setTimeout(() => {
        focus();
      }, 50);
    }
  }, [isOpen, focus]);

  const insertFunction = (func: string) => {
    // Focus input first
    if (focus) {
      focus();
    }
    
    // Special handling for log_ to insert opening bracket after subscript
    if (func === "log_(") {
      // Insert log_ first, which puts cursor in subscript for the base
      setTimeout(() => {
        if (insertText) {
          insertText("log_");
          // Wait for MathQuill to process, then move cursor right to exit subscript
          setTimeout(() => {
            if (moveCursorRight) {
              moveCursorRight();
              // Wait a bit longer to ensure cursor has exited subscript, then insert ( in normal script
              setTimeout(() => {
                if (insertText) {
                  insertText("(");
                  // Maintain focus after insertion
                  setTimeout(() => {
                    if (focus) {
                      focus();
                    }
                  }, 10);
                }
              }, 100);
            }
          }, 100);
        }
      }, 0);
    } else {
      // Small delay to ensure focus is set before inserting text
      setTimeout(() => {
        if (insertText) {
          insertText(func);
          // Maintain focus after insertion
          setTimeout(() => {
            if (focus) {
              focus();
            }
          }, 10);
        }
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-transparent pointer-events-none"
      onClick={onClose}
    >
      <div
        ref={keyboardRef}
        className="w-full max-w-4xl bg-gray-200 border-t-4 border-purple-300 rounded-t-2xl shadow-2xl p-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-12 gap-2">
          {/* Symbols and Variables Section */}
          <div className="col-span-4">
            <div className="text-xs font-semibold text-gray-600 mb-2 px-2">SYMBOLS & VARIABLES</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("x");
                }}
                className="px-2 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                x
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("e");
                }}
                className="px-2 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                e
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("^2");
                }}
                className="px-2 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                x<sup>2</sup>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("^");
                }}
                className="px-2 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                x<sup>n</sup>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("(");
                }}
                className="px-2 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                (
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction(")");
                }}
                className="px-2 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                )
              </button>
            </div>
          </div>

          {/* Numbers and Operators Section */}
          <div className="col-span-4">
            <div className="text-xs font-semibold text-gray-600 mb-2 px-2">NUMBERS & OPERATORS</div>
            <div className="grid grid-cols-4 gap-1.5">
              {/* Row 1 */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("7");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                7
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("8");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                8
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("9");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                9
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("/");
                }}
                className="px-3 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("4");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                4
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("5");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                5
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("6");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                6
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("*");
                }}
                className="px-3 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("1");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                1
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("2");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                2
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("3");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                3
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("-");
                }}
                className="px-3 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                −
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("0");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                0
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction(".");
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                .
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction(")");
                }}
                className="px-3 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                )
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertFunction("+");
                }}
                className="px-3 py-2 text-sm bg-white hover:bg-purple-50 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
              >
                +
              </button>
            </div>
          </div>

          {/* Functions Section with Custom Menu */}
          <div className="col-span-4 relative">
            {/* Functions Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFunctionMenu(!showFunctionMenu);
                // Maintain focus on input
                if (focus) {
                  focus();
                }
              }}
              className="w-full px-3 py-2 text-sm font-semibold bg-gradient-to-br from-purple-100/80 to-pink-100/80 hover:from-purple-200/80 hover:to-pink-200/80 border-2 border-purple-200 rounded-lg text-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {showFunctionMenu ? "▼ Functions" : "▶ Functions"}
            </button>
            
            {/* Backspace and Done buttons */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Focus input first
                  if (focus) {
                    focus();
                  }
                  // Then perform backspace
                  setTimeout(() => {
                    if (backspace) {
                      backspace();
                      // Maintain focus after backspace
                      setTimeout(() => {
                        if (focus) {
                          focus();
                        }
                      }, 10);
                    }
                  }, 0);
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all"
              >
                ⌫ Backspace
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-sm bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                Done
              </button>
            </div>

            {/* Custom Function Menu - Opens Upwards */}
            {showFunctionMenu && (
              <div
                ref={functionMenuRef}
                className="absolute bottom-full left-0 mb-2 z-10 w-full bg-white border-2 border-purple-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* All Functions in One Scrollable List with Category Titles */}
                <div className="p-2">
                  {/* Trig Functions */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2 px-1">Trig Functions</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "sin", value: "sin(" },
                        { label: "cos", value: "cos(" },
                        { label: "tan", value: "tan(" },
                        { label: "csc", value: "csc(" },
                        { label: "sec", value: "sec(" },
                        { label: "cot", value: "cot(" },
                      ].map((func, index) => (
                        <button
                          key={`trig-${func.label}-${index}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertFunction(func.value);
                          }}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
                        >
                          {func.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inverse Trig Functions */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2 px-1">Inverse Trig Functions</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "sin", superscript: "-1", value: "arcsin(" },
                        { label: "cos", superscript: "-1", value: "arccos(" },
                        { label: "tan", superscript: "-1", value: "arctan(" },
                        { label: "csc", superscript: "-1", value: "arccsc(" },
                        { label: "sec", superscript: "-1", value: "arcsec(" },
                        { label: "cot", superscript: "-1", value: "arccot(" },
                      ].map((func, index) => (
                        <button
                          key={`inv-trig-${func.label}-${index}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertFunction(func.value);
                          }}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
                        >
                          {func.label}<sup>{func.superscript}</sup>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hyperbolic Functions */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2 px-1">Hyperbolic Functions</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "sinh", value: "sinh(" },
                        { label: "cosh", value: "cosh(" },
                        { label: "tanh", value: "tanh(" },
                        { label: "csch", value: "csch(" },
                        { label: "sech", value: "sech(" },
                        { label: "coth", value: "coth(" },
                      ].map((func, index) => (
                        <button
                          key={`hyperbolic-${func.label}-${index}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertFunction(func.value);
                          }}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
                        >
                          {func.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculus Functions */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2 px-1">Calculus Functions</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "exp", value: "exp(" },
                        { label: "ln", value: "ln(" },
                        { label: "log", value: "log(" },
                        { label: "log", subscript: "a", value: "log_(" },
                        { label: "d/dx", value: "derivative(" },
                        { label: "f'", value: "'" },
                        { label: "∫", value: "integral(" },
                        { label: "Σ", value: "n=" },
                        { label: "Π", value: "n=" },
                        { label: "√", value: "sqrt" },
                        { label: "|x|", value: "|" },
                        { label: "π", value: "pi" },
                      ].map((func, index) => (
                        <button
                          key={`calculus-${func.label}-${index}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertFunction(func.value);
                          }}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
                        >
                          {func.subscript ? (
                            <>
                              {func.label}<sub>{func.subscript}</sub>
                            </>
                          ) : (
                            func.label
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number Theory Functions */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-purple-700 mb-2 px-1">Number Theory Functions</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: "lcm", value: "lcm(" },
                        { label: "gcd", value: "gcd(" },
                        { label: "mod", value: "mod(" },
                        { label: "ceil", value: "ceil(" },
                        { label: "floor", value: "floor(" },
                        { label: "round", value: "round(" },
                        { label: "sign", value: "sign(" },
                        { label: "n", subscript: "√", value: "nthRoot(" },
                        { label: "n", superscript: "P", subscript: "r", value: "permutations(" },
                        { label: "n", superscript: "C", subscript: "r", value: "combinations(" },
                      ].map((func, index) => (
                        <button
                          key={`number-theory-${func.label}-${index}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertFunction(func.value);
                          }}
                          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all hover:shadow-md"
                        >
                          {func.subscript ? (
                            <>
                              <sub>{func.label}</sub>{func.subscript}
                            </>
                          ) : func.superscript ? (
                            <>
                              {func.label}<sup>{func.superscript}</sup><sub>{func.subscript || ""}</sub>
                            </>
                          ) : (
                            func.label
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

