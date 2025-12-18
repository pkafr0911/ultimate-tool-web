import { useState, useRef, useCallback } from 'react'; // Import React hooks for state and refs
import { Canvas, Path, Circle, Line, Object as FabricObject } from 'fabric'; // Import Fabric.js classes

interface Point {
  x: number; // X coordinate
  y: number; // Y coordinate
  cp1?: { x: number; y: number }; // Incoming control point (Bezier handle)
  cp2?: { x: number; y: number }; // Outgoing control point (Bezier handle)
}

// Extend Fabric Object type to include isTemp
declare module 'fabric' {
  interface Object {
    isTemp?: boolean; // Flag to identify temporary objects (markers, helpers)
  }
}

export const usePenTool = (canvas: Canvas | null, saveHistory?: () => void) => {
  const [isDrawing, setIsDrawing] = useState(false); // State to track if drawing is active
  const activePath = useRef<Path | null>(null); // Ref to store the current path being drawn
  const points = useRef<Point[]>([]); // Ref to store points of the path
  const markers = useRef<Circle[]>([]); // Ref to store visual markers (circles) at points
  const isDragging = useRef(false); // Ref to track if mouse is being dragged (for curves)
  const dragStartPoint = useRef<{ x: number; y: number } | null>(null); // Ref to store start point of drag
  const rubberBand = useRef<Path | null>(null); // Ref for the preview line (rubber band)
  const handleLines = useRef<Line[]>([]); // Ref for visual lines connecting control points

  const generatePathString = (pts: Point[], closed: boolean = false) => {
    if (pts.length === 0) return ''; // Return empty if no points

    let d = `M ${pts[0].x} ${pts[0].y}`; // Start path command (Move to)

    for (let i = 1; i < pts.length; i++) {
      const curr = pts[i]; // Current point
      const prev = pts[i - 1]; // Previous point

      if (prev.cp2 || curr.cp1) {
        // If control points exist, draw Bezier curve
        const cp1x = prev.cp2 ? prev.cp2.x : prev.x; // Control point 1 X
        const cp1y = prev.cp2 ? prev.cp2.y : prev.y; // Control point 1 Y
        const cp2x = curr.cp1 ? curr.cp1.x : curr.x; // Control point 2 X
        const cp2y = curr.cp1 ? curr.cp1.y : curr.y; // Control point 2 Y

        d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`; // Cubic Bezier command
      } else {
        d += ` L ${curr.x} ${curr.y}`; // Line command
      }
    }

    if (closed) {
      d += ' Z'; // Close path command
    }

    return d; // Return SVG path data string
  };

  const updatePath = useCallback(() => {
    if (!canvas || points.current.length === 0) return; // Exit if no canvas or points

    const d = generatePathString(points.current); // Generate path string

    if (activePath.current) {
      canvas.remove(activePath.current); // Remove old path instance
    }

    const newPath = new Path(d, {
      fill: '', // No fill
      stroke: 'black', // Black stroke
      strokeWidth: 2, // Stroke width
      selectable: false, // Not selectable while drawing
      evented: false, // No events
      objectCaching: false, // Disable caching for performance during draw
    });
    newPath.isTemp = true; // Mark as temporary

    canvas.add(newPath); // Add to canvas
    canvas.sendObjectToBack(newPath); // Send to back so markers are on top
    activePath.current = newPath; // Update ref
    canvas.requestRenderAll(); // Render canvas
  }, [canvas]);

  const addMarker = useCallback(
    (x: number, y: number, isStart: boolean = false) => {
      if (!canvas) return; // Exit if no canvas

      const marker = new Circle({
        left: x, // X position
        top: y, // Y position
        radius: 4, // Radius
        fill: isStart ? '#00ff00' : '#ffffff', // Green for start, white for others
        stroke: '#333', // Dark stroke
        strokeWidth: 1, // Stroke width
        originX: 'center', // Center origin
        originY: 'center', // Center origin
        selectable: false, // Not selectable
        evented: true, // Enable events (for clicking start point to close)
        hasControls: false, // No controls
        hasBorders: false, // No borders
      });
      marker.isTemp = true; // Mark as temporary

      canvas.add(marker); // Add to canvas
      markers.current.push(marker); // Add to markers array
      canvas.requestRenderAll(); // Render canvas
      return marker; // Return marker instance
    },
    [canvas],
  );

  const finishPath = useCallback(
    (closed: boolean = false) => {
      if (!canvas || !activePath.current) return; // Exit if no active path

      const d = generatePathString(points.current, closed); // Generate final path string

      if (activePath.current) canvas.remove(activePath.current); // Remove temporary path
      markers.current.forEach((m) => canvas.remove(m)); // Remove all markers
      markers.current = []; // Clear markers array

      if (rubberBand.current) {
        canvas.remove(rubberBand.current); // Remove rubber band
        rubberBand.current = null; // Clear ref
      }

      handleLines.current.forEach((l) => canvas.remove(l)); // Remove handle lines
      handleLines.current = []; // Clear handle lines array

      const finalPath = new Path(d, {
        fill: closed ? '#cccccc' : '', // Fill if closed
        stroke: 'black', // Stroke color
        strokeWidth: 2, // Stroke width
        selectable: true, // Make selectable
        evented: true, // Enable events
        objectCaching: true, // Enable caching
      });

      canvas.add(finalPath); // Add final path to canvas
      canvas.setActiveObject(finalPath); // Select the new path

      setIsDrawing(false); // Stop drawing mode
      activePath.current = null; // Clear active path ref
      points.current = []; // Clear points
      isDragging.current = false; // Reset dragging state
      dragStartPoint.current = null; // Reset drag start point

      if (saveHistory) saveHistory(); // Save to history
      canvas.requestRenderAll(); // Render canvas
    },
    [canvas, saveHistory],
  );

  const onMouseDown = useCallback(
    (e: any) => {
      if (!canvas) return; // Exit if no canvas
      const pointer = canvas.getPointer(e.e); // Get mouse pointer coordinates

      if (isDrawing && markers.current.length > 0) {
        const startMarker = markers.current[0]; // Get start marker
        if (e.target === startMarker) {
          finishPath(true); // Close path if start marker clicked
          return;
        }
        if (markers.current.includes(e.target)) {
          return; // Ignore clicks on other markers
        }
      }

      if (!isDrawing) {
        setIsDrawing(true); // Start drawing
        points.current = [{ x: pointer.x, y: pointer.y }]; // Initialize points
        addMarker(pointer.x, pointer.y, true); // Add start marker
        updatePath(); // Draw initial path
      } else {
        points.current.push({ x: pointer.x, y: pointer.y }); // Add new point
        addMarker(pointer.x, pointer.y); // Add marker
        updatePath(); // Update path
      }

      isDragging.current = true; // Start dragging (potential curve)
      dragStartPoint.current = { x: pointer.x, y: pointer.y }; // Record drag start
    },
    [canvas, isDrawing, updatePath, addMarker, finishPath],
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (!canvas || !isDrawing) return; // Exit if not drawing

      const pointer = canvas.getPointer(e.e); // Get pointer coordinates

      if (isDragging.current && points.current.length > 0) {
        // Dragging to create handles (Bezier curves)
        const currentPointIndex = points.current.length - 1; // Get last point index
        const currentPoint = points.current[currentPointIndex]; // Get last point

        const dx = pointer.x - currentPoint.x; // Calculate delta X
        const dy = pointer.y - currentPoint.y; // Calculate delta Y

        currentPoint.cp2 = { x: currentPoint.x + dx, y: currentPoint.y + dy }; // Set outgoing control point
        currentPoint.cp1 = { x: currentPoint.x - dx, y: currentPoint.y - dy }; // Set incoming control point (mirrored)

        updatePath(); // Update path with curves

        // Visualize handles
        handleLines.current.forEach((l) => canvas.remove(l)); // Remove old handle lines
        handleLines.current = []; // Clear array

        if (currentPoint.cp1) {
          const l1 = new Line(
            [currentPoint.x, currentPoint.y, currentPoint.cp1.x, currentPoint.cp1.y],
            {
              stroke: '#666', // Gray color
              strokeWidth: 1, // Thin line
              selectable: false, // Not selectable
              evented: false, // No events
            },
          );
          l1.isTemp = true; // Mark as temp
          canvas.add(l1); // Add to canvas
          handleLines.current.push(l1); // Store ref
        }
        if (currentPoint.cp2) {
          const l2 = new Line(
            [currentPoint.x, currentPoint.y, currentPoint.cp2.x, currentPoint.cp2.y],
            {
              stroke: '#666', // Gray color
              strokeWidth: 1, // Thin line
              selectable: false, // Not selectable
              evented: false, // No events
            },
          );
          l2.isTemp = true; // Mark as temp
          canvas.add(l2); // Add to canvas
          handleLines.current.push(l2); // Store ref
        }

        // Hide rubber band while dragging handles
        if (rubberBand.current) {
          canvas.remove(rubberBand.current);
          rubberBand.current = null;
        }
      } else if (points.current.length > 0) {
        // Rubber band preview (line to mouse cursor)
        const lastPoint = points.current[points.current.length - 1]; // Last placed point
        let d = `M ${lastPoint.x} ${lastPoint.y}`; // Start from last point

        if (lastPoint.cp2) {
          // Curve to mouse if last point has control point
          d += ` C ${lastPoint.cp2.x} ${lastPoint.cp2.y} ${pointer.x} ${pointer.y} ${pointer.x} ${pointer.y}`;
        } else {
          // Line to mouse otherwise
          d += ` L ${pointer.x} ${pointer.y}`;
        }

        if (rubberBand.current) {
          canvas.remove(rubberBand.current); // Remove old rubber band
        }

        const rb = new Path(d, {
          fill: '', // No fill
          stroke: '#999', // Light gray
          strokeWidth: 1, // Thin line
          strokeDashArray: [5, 5], // Dashed line
          selectable: false, // Not selectable
          evented: false, // No events
        });
        rb.isTemp = true; // Mark as temp
        canvas.add(rb); // Add to canvas
        rubberBand.current = rb; // Store ref
        canvas.requestRenderAll(); // Render canvas
      }
    },
    [canvas, isDrawing, updatePath],
  );

  const onMouseUp = useCallback(
    (e: any) => {
      isDragging.current = false; // Stop dragging
      dragStartPoint.current = null; // Clear drag start
      // Clear handle lines on mouse up
      if (canvas) {
        handleLines.current.forEach((l) => canvas.remove(l)); // Remove handle lines
        handleLines.current = []; // Clear array
        canvas.requestRenderAll(); // Render canvas
      }
    },
    [canvas],
  );

  const onDoubleClick = useCallback(
    (e: any) => {
      finishPath(false); // Finish path (open) on double click
    },
    [finishPath],
  );

  return {
    isDrawing, // Export drawing state
    onMouseDown, // Export mouse down handler
    onMouseMove, // Export mouse move handler
    onMouseUp, // Export mouse up handler
    onDoubleClick, // Export double click handler
    finishPath, // Export finish path function
  };
};
