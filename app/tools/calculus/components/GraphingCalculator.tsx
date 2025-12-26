"use client";

import { useState, useRef, useEffect } from "react";
import { compile, derivative } from "mathjs";
import MathInput from "./MathInput";
import VirtualMathKeyboard from "./VirtualMathKeyboard";

export default function GraphingCalculator() {
  const [expression, setExpression] = useState("sin(x)");
  const [xMin, setXMin] = useState("-5");
  const [xMax, setXMax] = useState("5");
  const [yMin, setYMin] = useState("-3");
  const [yMax, setYMax] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFunctionMenu, setShowFunctionMenu] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const functionPointsRef = useRef<{ x: number; y: number; canvasX: number; canvasY: number }[]>([]);
  const importantPointsRef = useRef<{ x: number; y: number; type: string }[]>([]);
  const mathInputContainerRef = useRef<HTMLDivElement>(null);
  const insertTextRef = useRef<((text: string) => void) | null>(null);
  const focusMathInputRef = useRef<(() => void) | null>(null);
  const backspaceMathInputRef = useRef<(() => void) | null>(null);
  const moveCursorRightRef = useRef<(() => void) | null>(null);


  useEffect(() => {
    drawGraph();
  }, [expression, xMin, xMax, yMin, yMax, selectedPoint]);

  const findImportantPoints = (compiled: any, xMinVal: number, xMaxVal: number, yMinVal: number, yMaxVal: number) => {
    const importantPoints: { x: number; y: number; type: string }[] = [];
    const tolerance = 1e-6;
    const sampleStep = (xMaxVal - xMinVal) / 2000; // Sample at 2000 points for better detection
    const snapThreshold = (xMaxVal - xMinVal) * 0.01; // 1% of range for duplicate detection

    try {
      const expr = expression.trim();
      
      // Try to find derivative and second derivative for critical points
      let compiledFirstDeriv: any = null;
      let compiledSecondDeriv: any = null;
      try {
        const firstDeriv = derivative(expr, 'x');
        const secondDeriv = derivative(firstDeriv.toString(), 'x');
        compiledFirstDeriv = compile(firstDeriv.toString());
        compiledSecondDeriv = compile(secondDeriv.toString());
      } catch {
        // Derivatives might fail, we'll use function-based detection
      }

      // Check for exact mathematical points first (x = 0)
      if (xMinVal <= 0 && xMaxVal >= 0) {
        try {
          const yAtZero = compiled.evaluate({ x: 0 });
          if (Number.isFinite(yAtZero)) {
            // Check for x-intercept at x=0
            if (Math.abs(yAtZero) < tolerance && (yMinVal <= 0 && yMaxVal >= 0)) {
              importantPoints.push({ x: 0, y: 0, type: 'x-intercept' });
            } else {
              // Check for y-intercept at x=0
              importantPoints.push({ x: 0, y: yAtZero, type: 'y-intercept' });
            }
          }
        } catch {}
      }

      // Sample function values to find local extrema directly
      const sampleData: { x: number; y: number }[] = [];

      for (let x = xMinVal; x <= xMaxVal; x += sampleStep) {
        try {
          const y = compiled.evaluate({ x });
          if (Number.isFinite(y)) {
            sampleData.push({ x, y });

            // Check for x-intercepts (where y ≈ 0) - but skip x=0 as we already checked it
            if (Math.abs(x) > sampleStep && Math.abs(y) < tolerance && (yMinVal <= 0 && yMaxVal >= 0)) {
              // Refine the x-intercept using binary search
              let lowX = x - sampleStep;
              let highX = x;
              let refinedX = x;
              
              // Binary search to find exact root
              for (let refine = 0; refine < 20; refine++) {
                const midX = (lowX + highX) / 2;
                const midY = compiled.evaluate({ x: midX });
                
                if (Math.abs(midY) < tolerance) {
                  refinedX = midX;
                  break;
                } else if (midY * compiled.evaluate({ x: lowX }) < 0) {
                  highX = midX;
                } else {
                  lowX = midX;
                }
              }
              
              const isDuplicate = importantPoints.some(
                (p) => p.type === 'x-intercept' && Math.abs(p.x - refinedX) < snapThreshold
              );
              if (!isDuplicate) {
                importantPoints.push({ x: refinedX, y: 0, type: 'x-intercept' });
              }
            }
          }
        } catch {
          continue;
        }
      }

      // Find local maxima and minima by comparing neighboring points
      const windowSize = Math.max(3, Math.floor(sampleData.length / 200)); // Adaptive window size
      for (let i = windowSize; i < sampleData.length - windowSize; i++) {
        const center = sampleData[i];
        let isLocalMax = true;
        let isLocalMin = true;

        // Check neighbors in a window
        for (let j = i - windowSize; j <= i + windowSize; j++) {
          if (j === i) continue;
          const neighbor = sampleData[j];
          if (neighbor.y > center.y) isLocalMax = false;
          if (neighbor.y < center.y) isLocalMin = false;
        }

        if (isLocalMax || isLocalMin) {
          // Refine using derivative if available, otherwise use function values
          let refinedX = center.x;
          let refinedY = center.y;
          let type = isLocalMax ? 'maximum' : 'minimum';

          // If we have derivatives, refine more accurately
          if (compiledFirstDeriv) {
            try {
              // Use binary search to find exact critical point
              let lowX = sampleData[Math.max(0, i - windowSize)].x;
              let highX = sampleData[Math.min(sampleData.length - 1, i + windowSize)].x;
              
              for (let refine = 0; refine < 15; refine++) {
                const midX = (lowX + highX) / 2;
                const midDeriv = compiledFirstDeriv.evaluate({ x: midX });
                
                if (Math.abs(midDeriv) < tolerance) {
                  refinedX = midX;
                  refinedY = compiled.evaluate({ x: midX });
                  
                  // Classify using second derivative
                  if (compiledSecondDeriv) {
                    try {
                      const secondDerivVal = compiledSecondDeriv.evaluate({ x: midX });
                      if (secondDerivVal < -tolerance) type = 'maximum';
                      else if (secondDerivVal > tolerance) type = 'minimum';
                    } catch {}
                  }
                  break;
                } else if (midDeriv > 0) {
                  if (isLocalMax) highX = midX;
                  else lowX = midX;
                } else {
                  if (isLocalMax) lowX = midX;
                  else highX = midX;
                }
              }
            } catch {
              // Refinement failed, use original point
            }
          }

          // Check if this is a duplicate (allow multiple max/mins)
          const isDuplicate = importantPoints.some(
            (p) => {
              const sameType = p.type === type || 
                (p.type === 'maximum' && type === 'maximum') ||
                (p.type === 'minimum' && type === 'minimum') ||
                (p.type === 'critical' && (type === 'maximum' || type === 'minimum'));
              return sameType && Math.abs(p.x - refinedX) < snapThreshold;
            }
          );

          if (!isDuplicate && Number.isFinite(refinedY)) {
            importantPoints.push({ x: refinedX, y: refinedY, type });
          }
        }
      }

      // Also check for critical points using derivatives (more thorough)
      if (compiledFirstDeriv) {
        let prevFirstDeriv: number | null = null;
        for (let x = xMinVal; x <= xMaxVal; x += sampleStep * 2) {
          try {
            const firstDerivVal = compiledFirstDeriv.evaluate({ x });
            if (Number.isFinite(firstDerivVal) && prevFirstDeriv !== null) {
              // Sign change indicates a critical point we might have missed
              if (
                (prevFirstDeriv > tolerance && firstDerivVal < -tolerance) ||
                (prevFirstDeriv < -tolerance && firstDerivVal > tolerance)
              ) {
                // Binary search for exact zero
                let lowX = x - sampleStep * 2;
                let highX = x;
                for (let refine = 0; refine < 15; refine++) {
                  const midX = (lowX + highX) / 2;
                  const midDeriv = compiledFirstDeriv.evaluate({ x: midX });
                  
                  if (Math.abs(midDeriv) < tolerance) {
                    const refinedY = compiled.evaluate({ x: midX });
                    if (Number.isFinite(refinedY)) {
                      let type = 'critical';
                      if (compiledSecondDeriv) {
                        try {
                          const secondDerivVal = compiledSecondDeriv.evaluate({ x: midX });
                          if (secondDerivVal < -tolerance) type = 'maximum';
                          else if (secondDerivVal > tolerance) type = 'minimum';
                        } catch {}
                      }

                      // Only add if not already found by local extrema detection
                      const isDuplicate = importantPoints.some(
                        (p) => Math.abs(p.x - midX) < snapThreshold
                      );
                      
                      if (!isDuplicate) {
                        importantPoints.push({ x: midX, y: refinedY, type });
                      }
                    }
                    break;
                  } else if (midDeriv * compiledFirstDeriv.evaluate({ x: lowX }) < 0) {
                    highX = midX;
                  } else {
                    lowX = midX;
                  }
                }
              }
            }
            prevFirstDeriv = firstDerivVal;
          } catch {
            continue;
          }
        }
      }

      // Find inflection points using second derivative
      if (compiledSecondDeriv) {
        // First check for exact zero at x=0
        if (xMinVal <= 0 && xMaxVal >= 0) {
          try {
            const secondDerivAtZero = compiledSecondDeriv.evaluate({ x: 0 });
            if (Number.isFinite(secondDerivAtZero) && Math.abs(secondDerivAtZero) < tolerance) {
              const yAtZero = compiled.evaluate({ x: 0 });
              if (Number.isFinite(yAtZero)) {
                importantPoints.push({ x: 0, y: yAtZero, type: 'inflection' });
              }
            }
          } catch {}
        }
        
        // Then check for other inflection points using sign changes
        let prevSecondDeriv: number | null = null;
        for (let x = xMinVal; x <= xMaxVal; x += sampleStep * 2) {
          try {
            // Skip x=0 as we already checked it
            if (Math.abs(x) < sampleStep) {
              prevSecondDeriv = compiledSecondDeriv.evaluate({ x });
              continue;
            }
            
            const secondDerivVal = compiledSecondDeriv.evaluate({ x });
            if (Number.isFinite(secondDerivVal) && prevSecondDeriv !== null) {
              // Check for exact zero or sign change
              if (
                Math.abs(secondDerivVal) < tolerance ||
                (prevSecondDeriv > tolerance && secondDerivVal < -tolerance) ||
                (prevSecondDeriv < -tolerance && secondDerivVal > tolerance)
              ) {
                let refinedX = x;
                
                // If it's not already at zero, refine using binary search
                if (Math.abs(secondDerivVal) >= tolerance) {
                  let lowX = x - sampleStep * 2;
                  let highX = x;
                  
                  for (let refine = 0; refine < 20; refine++) {
                    const midX = (lowX + highX) / 2;
                    const midSecondDeriv = compiledSecondDeriv.evaluate({ x: midX });
                    
                    if (Math.abs(midSecondDeriv) < tolerance) {
                      refinedX = midX;
                      break;
                    } else if (midSecondDeriv * compiledSecondDeriv.evaluate({ x: lowX }) < 0) {
                      highX = midX;
                    } else {
                      lowX = midX;
                    }
                  }
                }
                
                const refinedY = compiled.evaluate({ x: refinedX });
                if (Number.isFinite(refinedY)) {
                  const isDuplicate = importantPoints.some(
                    (p) => p.type === 'inflection' && Math.abs(p.x - refinedX) < snapThreshold
                  );
                  
                  if (!isDuplicate) {
                    importantPoints.push({ x: refinedX, y: refinedY, type: 'inflection' });
                  }
                }
              }
            }
            prevSecondDeriv = secondDerivVal;
          } catch {
            continue;
          }
        }
      }

    } catch {
      // Failed to find important points
    }

    return importantPoints;
  };

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
      const compiled = compile(expr);

      // Find important points (intercepts, extrema, inflection points)
      importantPointsRef.current = findImportantPoints(
        compiled,
        xMinVal,
        xMaxVal,
        yMinVal,
        yMaxVal
      );

      // Calculate optimal step size for tick marks
      // Goal: at most 4 ticks on each positive/negative side, prefer whole numbers
      const xRange = xMaxVal - xMinVal;
      const yRange = yMaxVal - yMinVal;
      
      // Helper function to find step size for at most 4 ticks per side
      const findStepSize = (min: number, max: number) => {
        const maxTicksPerSide = 4;
        const posRange = Math.max(0, max);
        const negRange = Math.max(0, -min);
        
        // Calculate rough step needed for each side
        const posStepNeeded = posRange > 0 ? posRange / maxTicksPerSide : Infinity;
        const negStepNeeded = negRange > 0 ? negRange / maxTicksPerSide : Infinity;
        const roughStep = Math.min(posStepNeeded, negStepNeeded);
        
        if (!isFinite(roughStep) || roughStep === 0) {
          return 1; // Default fallback
        }
        
        // Find nice round step (prefer whole numbers: 1, 2, 5, 10, 20, 50, etc.)
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalized = roughStep / magnitude;
        
        let niceStep;
        if (normalized <= 1) niceStep = 1 * magnitude;
        else if (normalized <= 2) niceStep = 2 * magnitude;
        else if (normalized <= 5) niceStep = 5 * magnitude;
        else niceStep = 10 * magnitude;
        
        return niceStep;
      };
      
      const finalXStep = findStepSize(xMinVal, xMaxVal);
      const finalYStep = findStepSize(yMinVal, yMaxVal);

      // Draw grid lines
      ctx.strokeStyle = "#f3f4f6";
      ctx.lineWidth = 1;
      
      const xStart = Math.floor(xMinVal / finalXStep) * finalXStep;
      const yStart = Math.floor(yMinVal / finalYStep) * finalYStep;
      
      for (let x = xStart; x <= xMaxVal; x += finalXStep) {
        const canvasX = ((x - xMinVal) / (xMaxVal - xMinVal)) * width;
        if (canvasX >= 0 && canvasX <= width) {
          ctx.beginPath();
          ctx.moveTo(canvasX, 0);
          ctx.lineTo(canvasX, height);
          ctx.stroke();
        }
      }

      for (let y = yStart; y <= yMaxVal; y += finalYStep) {
        const canvasY = height - ((y - yMinVal) / (yMaxVal - yMinVal)) * height;
        if (canvasY >= 0 && canvasY <= height) {
          ctx.beginPath();
          ctx.moveTo(0, canvasY);
          ctx.lineTo(width, canvasY);
          ctx.stroke();
        }
      }

      // Draw axes (darker, thicker)
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 2;

      // X-axis
      const yZero = height - ((0 - yMinVal) / (yMaxVal - yMinVal)) * height;
      if (yZero >= 0 && yZero <= height) {
        ctx.beginPath();
        ctx.moveTo(0, yZero);
        ctx.lineTo(width, yZero);
        ctx.stroke();
        
        // Draw tick marks and labels on X-axis
        ctx.fillStyle = "#374151";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        // Draw negative side (if applicable) - up to 4 ticks
        if (xMinVal < 0) {
          let x = Math.ceil(xMinVal / finalXStep) * finalXStep;
          // Start from closest tick to 0, going backwards
          if (x >= 0) {
            x = -finalXStep;
          } else {
            // Find the tick just below 0
            x = Math.ceil(-finalXStep / finalXStep) * finalXStep;
            if (x >= 0) x = -finalXStep;
          }
          
          let negCount = 0;
          while (x >= xMinVal && negCount < 4) {
            const canvasX = ((x - xMinVal) / (xMaxVal - xMinVal)) * width;
            if (canvasX >= 0 && canvasX <= width) {
              // Draw tick mark
              ctx.beginPath();
              ctx.moveTo(canvasX, yZero - 5);
              ctx.lineTo(canvasX, yZero + 5);
              ctx.stroke();
              
              // Draw label (prefer whole numbers)
              const label = Number.isInteger(x) ? x.toString() : x.toFixed(2).replace(/\.?0+$/, '');
              ctx.fillText(label, canvasX, yZero + 8);
              negCount++;
            }
            x -= finalXStep;
          }
        }
        
        // Always draw 0 if it's in range
        if (xMinVal <= 0 && xMaxVal >= 0) {
          const canvasX = ((0 - xMinVal) / (xMaxVal - xMinVal)) * width;
          ctx.beginPath();
          ctx.moveTo(canvasX, yZero - 5);
          ctx.lineTo(canvasX, yZero + 5);
          ctx.stroke();
          ctx.fillText("0", canvasX, yZero + 8);
        }
        
        // Draw positive side (if applicable) - up to 4 ticks
        if (xMaxVal > 0) {
          let x = finalXStep; // Start from first positive tick
          let posCount = 0;
          while (x <= xMaxVal && posCount < 4) {
            const canvasX = ((x - xMinVal) / (xMaxVal - xMinVal)) * width;
            if (canvasX >= 0 && canvasX <= width) {
              // Draw tick mark
              ctx.beginPath();
              ctx.moveTo(canvasX, yZero - 5);
              ctx.lineTo(canvasX, yZero + 5);
              ctx.stroke();
              
              // Draw label (prefer whole numbers)
              const label = Number.isInteger(x) ? x.toString() : x.toFixed(2).replace(/\.?0+$/, '');
              ctx.fillText(label, canvasX, yZero + 8);
              posCount++;
            }
            x += finalXStep;
          }
        }
        
        // X-axis label
        ctx.fillStyle = "#111827";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("x", width - 20, yZero + 25);
      }

      // Y-axis
      const xZero = ((0 - xMinVal) / (xMaxVal - xMinVal)) * width;
      if (xZero >= 0 && xZero <= width) {
        ctx.beginPath();
        ctx.moveTo(xZero, 0);
        ctx.lineTo(xZero, height);
        ctx.stroke();
        
        // Draw tick marks and labels on Y-axis
        ctx.fillStyle = "#374151";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        
        // Draw negative side (if applicable) - up to 4 ticks
        if (yMinVal < 0) {
          let y = -finalYStep; // Start from first negative tick (just below 0)
          let negCount = 0;
          while (y >= yMinVal && negCount < 4) {
            // Skip if this is exactly 0 (will be drawn separately)
            if (Math.abs(y) > 1e-10) {
              const canvasY = height - ((y - yMinVal) / (yMaxVal - yMinVal)) * height;
              if (canvasY >= 0 && canvasY <= height) {
                // Draw tick mark
                ctx.beginPath();
                ctx.moveTo(xZero - 5, canvasY);
                ctx.lineTo(xZero + 5, canvasY);
                ctx.stroke();
                
                // Draw label (prefer whole numbers)
                const label = Number.isInteger(y) ? y.toString() : y.toFixed(2).replace(/\.?0+$/, '');
                ctx.fillText(label, xZero - 8, canvasY);
                negCount++;
              }
            }
            y -= finalYStep;
          }
        }
        
        // Always draw 0 if it's in range (but skip if x-axis is too close)
        if (yMinVal <= 0 && yMaxVal >= 0) {
          const canvasY = height - ((0 - yMinVal) / (yMaxVal - yMinVal)) * height;
          // Only draw 0 label if x-axis is not too close to avoid overlap
          const yZero = height - ((0 - yMinVal) / (yMaxVal - yMinVal)) * height;
          if (Math.abs(canvasY - yZero) > 15 || Math.abs(xZero) > 30) {
            ctx.beginPath();
            ctx.moveTo(xZero - 5, canvasY);
            ctx.lineTo(xZero + 5, canvasY);
            ctx.stroke();
            ctx.fillText("0", xZero - 8, canvasY);
          }
        }
        
        // Draw positive side (if applicable) - up to 4 ticks
        if (yMaxVal > 0) {
          let y = finalYStep; // Start from first positive tick
          let posCount = 0;
          while (y <= yMaxVal && posCount < 4) {
            // Skip if this is exactly 0 (will be drawn separately)
            if (Math.abs(y) > 1e-10) {
              const canvasY = height - ((y - yMinVal) / (yMaxVal - yMinVal)) * height;
              if (canvasY >= 0 && canvasY <= height) {
                // Draw tick mark
                ctx.beginPath();
                ctx.moveTo(xZero - 5, canvasY);
                ctx.lineTo(xZero + 5, canvasY);
                ctx.stroke();
                
                // Draw label (prefer whole numbers)
                const label = Number.isInteger(y) ? y.toString() : y.toFixed(2).replace(/\.?0+$/, '');
                ctx.fillText(label, xZero - 8, canvasY);
                posCount++;
              }
            }
            y += finalYStep;
          }
        }
        
        // Y-axis label (only if not too close to origin)
        if (xZero > 25) {
          ctx.fillStyle = "#111827";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText("y", xZero - 20, 15);
        }
      }

      // Draw function
      ctx.strokeStyle = "#9333ea";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const points: { x: number; y: number; canvasX: number; canvasY: number }[] = [];
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
                const jump = Math.abs(canvasY - prevPoint.canvasY);
                if (jump > height * 0.5) {
                  // Likely a discontinuity, start a new path
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.moveTo(canvasX, canvasY);
                } else {
                  ctx.lineTo(canvasX, canvasY);
                }
              }
              points.push({ x, y, canvasX, canvasY });
            }
          }
        } catch {
          // Skip points where evaluation fails
          continue;
        }
      }

      ctx.stroke();
      
      // Store points for mouse interaction
      functionPointsRef.current = points;

      // Draw selected point if exists
      if (selectedPoint) {
        const canvasX = ((selectedPoint.x - xMinVal) / (xMaxVal - xMinVal)) * width;
        const canvasY = height - ((selectedPoint.y - yMinVal) / (yMaxVal - yMinVal)) * height;
        
        if (canvasX >= 0 && canvasX <= width && canvasY >= 0 && canvasY <= height) {
          // Draw point
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw crosshair
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(canvasX, 0);
          ctx.lineTo(canvasX, height);
          ctx.moveTo(0, canvasY);
          ctx.lineTo(width, canvasY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to graph function. Make sure the function is valid and only uses x as the variable."
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const xMinVal = Number(xMin);
    const xMaxVal = Number(xMax);
    const yMinVal = Number(yMin);
    const yMaxVal = Number(yMax);
    const width = canvas.width;
    const height = canvas.height;

    // Convert click position to graph coordinates
    const clickGraphX = xMinVal + (canvasX / width) * (xMaxVal - xMinVal);
    const clickGraphY = yMaxVal - (canvasY / height) * (yMaxVal - yMinVal);

    // First check if we're near an important point (snap to it)
    // Use mathematical distance, not pixel distance
    const xRange = xMaxVal - xMinVal;
    const yRange = yMaxVal - yMinVal;
    const snapThreshold = Math.min(xRange, yRange) * 0.05; // 5% of smaller range
    let snappedPoint = null as { x: number; y: number; type: string } | null;
    let minSnapDist = snapThreshold;

    for (const importantPoint of importantPointsRef.current) {
      // Calculate distance in graph coordinates
      const dx = importantPoint.x - clickGraphX;
      const dy = importantPoint.y - clickGraphY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minSnapDist) {
        minSnapDist = dist;
        snappedPoint = importantPoint;
      }
    }

    if (snappedPoint) {
      setSelectedPoint({ x: snappedPoint.x, y: snappedPoint.y });
      setIsDragging(true);
      return;
    }

    // Otherwise, find closest point on function using graph coordinates
    const points = functionPointsRef.current;
    if (points.length === 0) return;

    let closestPoint = points[0];
    let minDist = Math.sqrt(
      Math.pow(clickGraphX - closestPoint.x, 2) + Math.pow(clickGraphY - closestPoint.y, 2)
    );

    for (const point of points) {
      const dist = Math.sqrt(
        Math.pow(clickGraphX - point.x, 2) + Math.pow(clickGraphY - point.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
      }
    }

    // Only select if within reasonable mathematical distance
    const selectThreshold = Math.min(xRange, yRange) * 0.05; // 5% of smaller range
    if (minDist < selectThreshold) {
      setSelectedPoint({ x: closestPoint.x, y: closestPoint.y });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (e.clientX - rect.left) * scaleX;

    // Convert canvas X to graph X
    const xMinVal = Number(xMin);
    const xMaxVal = Number(xMax);
    const yMinVal = Number(yMin);
    const yMaxVal = Number(yMax);
    const graphX = xMinVal + (canvasX / canvas.width) * (xMaxVal - xMinVal);

    // Clamp to bounds
    let targetX = Math.max(xMinVal, Math.min(xMaxVal, graphX));

    // Check if we're near an important point and snap to it
    const snapThreshold = (xMaxVal - xMinVal) * 0.02; // 2% of range
    for (const importantPoint of importantPointsRef.current) {
      if (Math.abs(importantPoint.x - targetX) < snapThreshold) {
        targetX = importantPoint.x;
        setSelectedPoint({ x: importantPoint.x, y: importantPoint.y });
        return;
      }
    }

    // Evaluate function at this x
    try {
      const expr = expression.trim();
      if (!expr) return;

      const compiled = compile(expr);
      const y = compiled.evaluate({ x: targetX });

      if (Number.isFinite(y)) {
        setSelectedPoint({ x: targetX, y: Number(y) });
      }
    } catch {
      // Ignore errors during drag
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
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
                  // Prevent button from stealing focus from input
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
                placeholder="Enter function to graph"
                onMathFieldReady={(insertText, focus, backspace, moveCursorRight) => {
                  insertTextRef.current = insertText;
                  focusMathInputRef.current = focus;
                  backspaceMathInputRef.current = backspace;
                  moveCursorRightRef.current = moveCursorRight;
                }}
              />
            </div>
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

          {/* Selected point coordinates display */}
          {selectedPoint && (() => {
            // Find if selected point matches an important point
            const importantPoint = importantPointsRef.current.find(
              (p) => Math.abs(p.x - selectedPoint!.x) < 1e-6 && Math.abs(p.y - selectedPoint!.y) < 1e-6
            );
            const pointType = importantPoint?.type || 'point';
            const typeLabels: { [key: string]: string } = {
              'x-intercept': 'X-Intercept',
              'y-intercept': 'Y-Intercept',
              'maximum': 'Local Maximum',
              'minimum': 'Local Minimum',
              'vertex': 'Vertex',
              'critical': 'Critical Point',
              'inflection': 'Inflection Point',
              'point': 'Point',
            };

            return (
              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  {typeLabels[pointType]}: ({selectedPoint.x.toFixed(4)}, {selectedPoint.y.toFixed(4)})
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Click and drag left/right to traverse along the function. Points snap to intercepts, extrema, and inflection points.
                </p>
              </div>
            );
          })()}

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
            className="w-full h-auto cursor-crosshair"
            style={{ maxWidth: "100%" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        <p className="mt-3 text-xs text-gray-600">
          The graph updates automatically as you change the function or bounds. Purple line represents f(x).
          Click on a point to select it, then drag left/right to traverse along the function.
        </p>
      </div>

      {/* Virtual Keyboard */}
      <VirtualMathKeyboard
        insertText={(text) => {
          if (insertTextRef.current) {
            insertTextRef.current(text);
          } else {
            // Fallback to state update if MathField not ready
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
            // Fallback to state update
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

