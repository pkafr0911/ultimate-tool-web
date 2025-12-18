import { useState, useRef, useCallback } from 'react';
import { Canvas, Path, Circle, Line, Object as FabricObject } from 'fabric';

interface Point {
  x: number;
  y: number;
  cp1?: { x: number; y: number }; // Incoming control point
  cp2?: { x: number; y: number }; // Outgoing control point
}

// Extend Fabric Object type to include isTemp
declare module 'fabric' {
  interface Object {
    isTemp?: boolean;
  }
}

export const usePenTool = (canvas: Canvas | null, saveHistory?: () => void) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const activePath = useRef<Path | null>(null);
  const points = useRef<Point[]>([]);
  const markers = useRef<Circle[]>([]);
  const isDragging = useRef(false);
  const dragStartPoint = useRef<{ x: number; y: number } | null>(null);
  const rubberBand = useRef<Path | null>(null);
  const handleLines = useRef<Line[]>([]);

  const generatePathString = (pts: Point[], closed: boolean = false) => {
    if (pts.length === 0) return '';

    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 1; i < pts.length; i++) {
      const curr = pts[i];
      const prev = pts[i - 1];

      if (prev.cp2 || curr.cp1) {
        const cp1x = prev.cp2 ? prev.cp2.x : prev.x;
        const cp1y = prev.cp2 ? prev.cp2.y : prev.y;
        const cp2x = curr.cp1 ? curr.cp1.x : curr.x;
        const cp2y = curr.cp1 ? curr.cp1.y : curr.y;

        d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }

    if (closed) {
      d += ' Z';
    }

    return d;
  };

  const updatePath = useCallback(() => {
    if (!canvas || points.current.length === 0) return;

    const d = generatePathString(points.current);

    if (activePath.current) {
      canvas.remove(activePath.current);
    }

    const newPath = new Path(d, {
      fill: '',
      stroke: 'black',
      strokeWidth: 2,
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    newPath.isTemp = true;

    canvas.add(newPath);
    canvas.sendObjectToBack(newPath);
    activePath.current = newPath;
    canvas.requestRenderAll();
  }, [canvas]);

  const addMarker = useCallback(
    (x: number, y: number, isStart: boolean = false) => {
      if (!canvas) return;

      const marker = new Circle({
        left: x,
        top: y,
        radius: 4,
        fill: isStart ? '#00ff00' : '#ffffff',
        stroke: '#333',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hasControls: false,
        hasBorders: false,
      });
      marker.isTemp = true;

      canvas.add(marker);
      markers.current.push(marker);
      canvas.requestRenderAll();
      return marker;
    },
    [canvas],
  );

  const finishPath = useCallback(
    (closed: boolean = false) => {
      if (!canvas || !activePath.current) return;

      const d = generatePathString(points.current, closed);

      if (activePath.current) canvas.remove(activePath.current);
      markers.current.forEach((m) => canvas.remove(m));
      markers.current = [];

      if (rubberBand.current) {
        canvas.remove(rubberBand.current);
        rubberBand.current = null;
      }

      handleLines.current.forEach((l) => canvas.remove(l));
      handleLines.current = [];

      const finalPath = new Path(d, {
        fill: closed ? '#cccccc' : '',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        objectCaching: true,
      });

      canvas.add(finalPath);
      canvas.setActiveObject(finalPath);

      setIsDrawing(false);
      activePath.current = null;
      points.current = [];
      isDragging.current = false;
      dragStartPoint.current = null;

      if (saveHistory) saveHistory();
      canvas.requestRenderAll();
    },
    [canvas, saveHistory],
  );

  const onMouseDown = useCallback(
    (e: any) => {
      if (!canvas) return;
      const pointer = canvas.getPointer(e.e);

      if (isDrawing && markers.current.length > 0) {
        const startMarker = markers.current[0];
        if (e.target === startMarker) {
          finishPath(true);
          return;
        }
        if (markers.current.includes(e.target)) {
          return;
        }
      }

      if (!isDrawing) {
        setIsDrawing(true);
        points.current = [{ x: pointer.x, y: pointer.y }];
        addMarker(pointer.x, pointer.y, true);
        updatePath();
      } else {
        points.current.push({ x: pointer.x, y: pointer.y });
        addMarker(pointer.x, pointer.y);
        updatePath();
      }

      isDragging.current = true;
      dragStartPoint.current = { x: pointer.x, y: pointer.y };
    },
    [canvas, isDrawing, updatePath, addMarker, finishPath],
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (!canvas || !isDrawing) return;

      const pointer = canvas.getPointer(e.e);

      if (isDragging.current && points.current.length > 0) {
        // Dragging to create handles
        const currentPointIndex = points.current.length - 1;
        const currentPoint = points.current[currentPointIndex];

        const dx = pointer.x - currentPoint.x;
        const dy = pointer.y - currentPoint.y;

        currentPoint.cp2 = { x: currentPoint.x + dx, y: currentPoint.y + dy };
        currentPoint.cp1 = { x: currentPoint.x - dx, y: currentPoint.y - dy };

        updatePath();

        // Visualize handles
        handleLines.current.forEach((l) => canvas.remove(l));
        handleLines.current = [];

        if (currentPoint.cp1) {
          const l1 = new Line(
            [currentPoint.x, currentPoint.y, currentPoint.cp1.x, currentPoint.cp1.y],
            {
              stroke: '#666',
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          );
          l1.isTemp = true;
          canvas.add(l1);
          handleLines.current.push(l1);
        }
        if (currentPoint.cp2) {
          const l2 = new Line(
            [currentPoint.x, currentPoint.y, currentPoint.cp2.x, currentPoint.cp2.y],
            {
              stroke: '#666',
              strokeWidth: 1,
              selectable: false,
              evented: false,
            },
          );
          l2.isTemp = true;
          canvas.add(l2);
          handleLines.current.push(l2);
        }

        // Hide rubber band while dragging handles
        if (rubberBand.current) {
          canvas.remove(rubberBand.current);
          rubberBand.current = null;
        }
      } else if (points.current.length > 0) {
        // Rubber band preview
        const lastPoint = points.current[points.current.length - 1];
        let d = `M ${lastPoint.x} ${lastPoint.y}`;

        if (lastPoint.cp2) {
          // Curve to mouse
          d += ` C ${lastPoint.cp2.x} ${lastPoint.cp2.y} ${pointer.x} ${pointer.y} ${pointer.x} ${pointer.y}`;
        } else {
          // Line to mouse
          d += ` L ${pointer.x} ${pointer.y}`;
        }

        if (rubberBand.current) {
          canvas.remove(rubberBand.current);
        }

        const rb = new Path(d, {
          fill: '',
          stroke: '#999',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        rb.isTemp = true;
        canvas.add(rb);
        rubberBand.current = rb;
        canvas.requestRenderAll();
      }
    },
    [canvas, isDrawing, updatePath],
  );

  const onMouseUp = useCallback(
    (e: any) => {
      isDragging.current = false;
      dragStartPoint.current = null;
      // Clear handle lines on mouse up
      if (canvas) {
        handleLines.current.forEach((l) => canvas.remove(l));
        handleLines.current = [];
        canvas.requestRenderAll();
      }
    },
    [canvas],
  );

  const onDoubleClick = useCallback(
    (e: any) => {
      finishPath(false);
    },
    [finishPath],
  );

  return {
    isDrawing,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    finishPath,
  };
};
