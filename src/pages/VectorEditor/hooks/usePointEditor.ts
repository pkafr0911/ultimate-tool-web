import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, Circle, Line, Point, util } from 'fabric';
import {
  AnchorPoint,
  pathToAnchors,
  updateObjectFromAnchors,
  findInsertionIndex,
  createBoundingAnchors,
  calculateSymmetricCP,
} from '../utils/pathGeometry';

export interface UsePointEditorOptions {
  handleRadius?: number;
  anchorRadius?: number;
  handleStyle?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  lineStyle?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDashArray?: number[];
  };
  onChange?: (event: PointEditEvent) => void;
  onCommit?: (object: any) => void;
  onCancel?: () => void;
}

export interface PointEditEvent {
  type: 'anchor:move' | 'anchor:add' | 'anchor:remove' | 'handle:move' | 'type:change';
  objectId?: string;
  anchorIndex?: number;
  before?: AnchorPoint;
  after?: AnchorPoint;
}

declare module 'fabric' {
  interface FabricObject {
    isTemp?: boolean;
    anchorIndex?: number;
    handleType?: string;
    pointMeta?: AnchorPoint[];
  }
}

export function usePointEditor(
  canvas: Canvas | null,
  history: { saveState: () => void; undo: () => void; redo: () => void },
  options: UsePointEditorOptions = {},
) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [selectedAnchorIndex, setSelectedAnchorIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<'anchor' | 'handle' | 'add'>('anchor');

  const handlesRef = useRef<Circle[]>([]);
  const linesRef = useRef<Line[]>([]);
  const anchorsRef = useRef<AnchorPoint[]>([]);
  const snapshotRef = useRef<any>(null);
  const isDraggingRef = useRef(false);

  // Extract anchors from object
  const extractAnchors = useCallback((object: any): AnchorPoint[] => {
    // Check if object has pointMeta
    if (object.pointMeta) {
      return object.pointMeta;
    }

    // Convert from path
    if (object.type === 'path') {
      return pathToAnchors(object.path);
    }

    // Convert from polyline/polygon
    if (object.type === 'polyline' || object.type === 'polygon') {
      return object.points.map((p: any) => ({ x: p.x, y: p.y, type: 'corner' as const }));
    }

    // For other shapes, create anchors from bounding points
    return createBoundingAnchors(object);
  }, []);

  // Clear all handles
  const clearHandles = useCallback(() => {
    if (!canvas) return;
    [...handlesRef.current, ...linesRef.current].forEach((obj) => {
      canvas.remove(obj);
    });
    handlesRef.current = [];
    linesRef.current = [];
  }, [canvas]);

  // Create handle objects
  const createHandles = useCallback(
    (obj?: any) => {
      const targetObject = obj || activeObject;
      console.log('createHandles called', { canvas: !!canvas, targetObject: !!targetObject });
      if (!canvas || !targetObject) return;

      clearHandles();

      const anchors = anchorsRef.current;
      console.log('Creating handles for', anchors.length, 'anchors:', anchors);
      const matrix = targetObject.calcTransformMatrix();
      console.log('Transform matrix:', matrix);

      anchors.forEach((anchor, index) => {
        // Transform to canvas coordinates
        const point = new Point(anchor.x, anchor.y).transform(matrix);
        console.log(
          `Anchor ${index}: local (${anchor.x}, ${anchor.y}) -> canvas (${point.x}, ${point.y})`,
        );
        const anchorHandle = new Circle({
          left: point.x,
          top: point.y,
          radius: options.anchorRadius || 5,
          fill: selectedAnchorIndex === index ? '#0066ff' : '#fff',
          stroke: '#0066ff',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: false,
          isTemp: true,
        });
        (anchorHandle as any).anchorIndex = index;
        (anchorHandle as any).handleType = 'anchor';

        handlesRef.current.push(anchorHandle);
        canvas.add(anchorHandle);

        // Create control point handles if anchor has them
        if (anchor.cp1) {
          const cp1Point = new Point(anchor.cp1.x, anchor.cp1.y).transform(matrix);
          const line1 = new Line([point.x, point.y, cp1Point.x, cp1Point.y], {
            stroke: options.lineStyle?.stroke || '#0066ff',
            strokeWidth: options.lineStyle?.strokeWidth || 1,
            strokeDashArray: options.lineStyle?.strokeDashArray || [3, 3],
            selectable: false,
            evented: false,
            isTemp: true,
          });
          linesRef.current.push(line1);
          canvas.add(line1);

          const cp1Handle = new Circle({
            left: cp1Point.x,
            top: cp1Point.y,
            radius: options.handleRadius || 4,
            fill: options.handleStyle?.fill || '#0066ff',
            stroke: options.handleStyle?.stroke || '#fff',
            strokeWidth: options.handleStyle?.strokeWidth || 1,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            hasControls: false,
            hasBorders: false,
            isTemp: true,
          });
          (cp1Handle as any).anchorIndex = index;
          (cp1Handle as any).handleType = 'cp1';

          handlesRef.current.push(cp1Handle);
          canvas.add(cp1Handle);
        }

        if (anchor.cp2) {
          const cp2Point = new Point(anchor.cp2.x, anchor.cp2.y).transform(matrix);
          const line2 = new Line([point.x, point.y, cp2Point.x, cp2Point.y], {
            stroke: options.lineStyle?.stroke || '#0066ff',
            strokeWidth: options.lineStyle?.strokeWidth || 1,
            strokeDashArray: options.lineStyle?.strokeDashArray || [3, 3],
            selectable: false,
            evented: false,
            isTemp: true,
          });
          linesRef.current.push(line2);
          canvas.add(line2);

          const cp2Handle = new Circle({
            left: cp2Point.x,
            top: cp2Point.y,
            radius: options.handleRadius || 4,
            fill: options.handleStyle?.fill || '#0066ff',
            stroke: options.handleStyle?.stroke || '#fff',
            strokeWidth: options.handleStyle?.strokeWidth || 1,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            hasControls: false,
            hasBorders: false,
            isTemp: true,
          });
          (cp2Handle as any).anchorIndex = index;
          (cp2Handle as any).handleType = 'cp2';

          handlesRef.current.push(cp2Handle);
          canvas.add(cp2Handle);
        }
      });

      console.log(
        'Created',
        handlesRef.current.length,
        'handles and',
        linesRef.current.length,
        'lines',
      );
      canvas.requestRenderAll();
    },
    [canvas, activeObject, selectedAnchorIndex, options, clearHandles],
  );

  // Enter point edit mode
  const enter = useCallback(
    (object: any, opts: { mode?: 'anchor' | 'handle' } = {}) => {
      console.log('Point editor enter called', {
        canvas: !!canvas,
        object: !!object,
        type: object?.type,
      });
      if (!canvas || !object) return;

      // Take snapshot for cancel
      snapshotRef.current = object.toObject(['pointMeta']);

      // Extract anchors
      const anchors = extractAnchors(object);
      console.log('Extracted anchors:', anchors);
      console.log('Object details:', {
        type: object.type,
        left: object.left,
        top: object.top,
        width: object.width,
        height: object.height,
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        angle: object.angle,
      });
      anchorsRef.current = anchors;

      // Set state
      setActiveObject(object);
      setIsEditing(true);
      setMode(opts.mode || 'anchor');

      // Hide object controls
      object.set({
        hasControls: false,
        hasBorders: false,
        selectable: false,
        evented: false,
      });

      // Disable canvas selection
      canvas.selection = false;

      // Create handles
      createHandles(object);

      canvas.requestRenderAll();
    },
    [canvas, extractAnchors, createHandles],
  );

  // Exit point edit mode
  const exit = useCallback(
    (commit: boolean = true) => {
      if (!activeObject || !canvas) return;

      if (commit) {
        // Update object with new anchors
        updateObjectFromAnchors(activeObject, anchorsRef.current);

        // Save to history
        history.saveState();

        // Trigger onChange
        options.onCommit?.(activeObject);
      } else {
        // Restore from snapshot
        activeObject.set(snapshotRef.current);
        options.onCancel?.();
      }

      // Restore object controls
      activeObject.set({
        hasControls: true,
        hasBorders: true,
        selectable: true,
        evented: true,
      });

      // Clear handles
      clearHandles();

      // Re-enable canvas selection
      canvas.selection = true;

      // Reset state
      setActiveObject(null);
      setIsEditing(false);
      setSelectedAnchorIndex(null);
      anchorsRef.current = [];
      snapshotRef.current = null;

      canvas.requestRenderAll();
    },
    [activeObject, canvas, history, clearHandles, options],
  );

  // Move point
  const movePoint = useCallback(
    (index: number, localPoint: { x: number; y: number }) => {
      if (index < 0 || index >= anchorsRef.current.length || !activeObject) return;

      anchorsRef.current[index] = {
        ...anchorsRef.current[index],
        x: localPoint.x,
        y: localPoint.y,
      };

      updateObjectFromAnchors(activeObject, anchorsRef.current);
      createHandles(activeObject);

      options.onChange?.({
        type: 'anchor:move',
        objectId: activeObject.id,
        anchorIndex: index,
        after: anchorsRef.current[index],
      });
    },
    [activeObject, createHandles, options],
  );

  // Move handle (control point)
  const moveHandle = useCallback(
    (
      anchorIndex: number,
      handleType: 'cp1' | 'cp2',
      localPoint: { x: number; y: number },
      breakSymmetry: boolean = false,
    ) => {
      if (anchorIndex < 0 || anchorIndex >= anchorsRef.current.length || !activeObject) return;

      const anchor = anchorsRef.current[anchorIndex];

      // Update the control point
      if (handleType === 'cp1') {
        anchor.cp1 = localPoint;
      } else {
        anchor.cp2 = localPoint;
      }

      // Handle symmetry for smooth points
      if (anchor.type === 'smooth' && !breakSymmetry && !anchor.handlesBroken) {
        const otherHandle = handleType === 'cp1' ? 'cp2' : 'cp1';
        const symmetric = calculateSymmetricCP(anchor, localPoint);
        (anchor as any)[otherHandle] = symmetric;
      } else if (breakSymmetry) {
        anchor.handlesBroken = true;
      }

      updateObjectFromAnchors(activeObject, anchorsRef.current);
      createHandles(activeObject);

      options.onChange?.({
        type: 'handle:move',
        objectId: activeObject.id,
        anchorIndex,
        after: anchor,
      });
    },
    [activeObject, createHandles, options],
  );

  // Add point
  const addPoint = useCallback(
    (canvasPoint: { x: number; y: number }) => {
      if (!activeObject || !canvas) return null;

      // Convert to local coordinates
      const matrix = activeObject.calcTransformMatrix();
      const invMatrix = util.invertTransform(matrix);
      const localPoint = new Point(canvasPoint.x, canvasPoint.y).transform(invMatrix);

      // Find insertion position on path
      const insertIndex = findInsertionIndex(anchorsRef.current, localPoint);

      // Insert new anchor
      const newAnchor: AnchorPoint = {
        x: localPoint.x,
        y: localPoint.y,
        type: 'smooth',
      };

      anchorsRef.current.splice(insertIndex, 0, newAnchor);

      updateObjectFromAnchors(activeObject, anchorsRef.current);
      createHandles(activeObject);

      options.onChange?.({
        type: 'anchor:add',
        objectId: activeObject.id,
        anchorIndex: insertIndex,
        after: newAnchor,
      });

      return { index: insertIndex };
    },
    [activeObject, canvas, createHandles, options],
  );

  // Remove point
  const removePoint = useCallback(
    (index: number) => {
      if (index < 0 || index >= anchorsRef.current.length || !activeObject) return;
      if (anchorsRef.current.length <= 2) return; // Keep minimum 2 points

      const removed = anchorsRef.current[index];
      anchorsRef.current.splice(index, 1);

      updateObjectFromAnchors(activeObject, anchorsRef.current);
      createHandles(activeObject);

      if (selectedAnchorIndex === index) {
        setSelectedAnchorIndex(null);
      }

      options.onChange?.({
        type: 'anchor:remove',
        objectId: activeObject.id,
        anchorIndex: index,
        before: removed,
      });
    },
    [activeObject, selectedAnchorIndex, createHandles, options],
  );

  // Convert point type
  const convertPointType = useCallback(
    (index: number, type: 'corner' | 'smooth' | 'symmetric') => {
      if (index < 0 || index >= anchorsRef.current.length || !activeObject) return;

      const anchor = anchorsRef.current[index];
      const before = { ...anchor };
      anchor.type = type;

      if (type === 'corner') {
        // Remove control points for corner
        delete anchor.cp1;
        delete anchor.cp2;
        anchor.handlesBroken = false;
      } else if (type === 'smooth' && !anchor.cp1 && !anchor.cp2) {
        // Add default control points for smooth
        const offset = 20;
        anchor.cp1 = { x: anchor.x - offset, y: anchor.y };
        anchor.cp2 = { x: anchor.x + offset, y: anchor.y };
        anchor.handlesBroken = false;
      }

      updateObjectFromAnchors(activeObject, anchorsRef.current);
      createHandles(activeObject);

      options.onChange?.({
        type: 'type:change',
        objectId: activeObject.id,
        anchorIndex: index,
        before,
        after: anchor,
      });
    },
    [activeObject, createHandles, options],
  );

  // Handle dragging
  useEffect(() => {
    if (!canvas || !isEditing) return;

    let draggedHandle: any = null;

    const onMouseDown = (e: any) => {
      if (!e.target || !e.target.isTemp) return;

      draggedHandle = e.target;
      isDraggingRef.current = true;

      const anchorIndex = draggedHandle.anchorIndex;
      if (draggedHandle.handleType === 'anchor') {
        setSelectedAnchorIndex(anchorIndex);
      }
    };

    const onMouseMove = (e: any) => {
      if (!isDraggingRef.current || !draggedHandle || !activeObject) return;

      const pointer = canvas.getPointer(e.e);
      draggedHandle.set({ left: pointer.x, top: pointer.y });

      // Update anchor/handle in local coordinates
      const matrix = activeObject.calcTransformMatrix();
      const invMatrix = util.invertTransform(matrix);
      const localPoint = new Point(pointer.x, pointer.y).transform(invMatrix);

      const anchorIndex = draggedHandle.anchorIndex;
      const handleType = draggedHandle.handleType;

      if (handleType === 'anchor') {
        movePoint(anchorIndex, localPoint);
      } else if (handleType === 'cp1' || handleType === 'cp2') {
        moveHandle(anchorIndex, handleType, localPoint, e.e.altKey);
      }

      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        draggedHandle = null;
      }
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [canvas, isEditing, activeObject, movePoint, moveHandle]);

  return {
    isEditing,
    activeObject,
    selectedAnchorIndex,
    mode,
    enter,
    exit,
    addPoint,
    removePoint,
    movePoint,
    selectPoint: setSelectedAnchorIndex,
    convertPointType,
    setMode,
    getAnchors: () => anchorsRef.current,
    dispose: clearHandles,
  };
}
