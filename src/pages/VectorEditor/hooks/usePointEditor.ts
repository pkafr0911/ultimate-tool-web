import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, Circle, Line, FabricObject, Path, Point, TPointerEvent } from 'fabric';

// Types for anchor points
export interface AnchorPoint {
  x: number;
  y: number;
  cp1?: { x: number; y: number }; // Incoming control point (handle before)
  cp2?: { x: number; y: number }; // Outgoing control point (handle after)
  type: 'corner' | 'smooth'; // Smooth = symmetric handles, Corner = independent handles
}

// Event types for callbacks
export interface PointEditEvent {
  type:
    | 'anchor-select'
    | 'anchor-move'
    | 'handle-move'
    | 'anchor-add'
    | 'anchor-delete'
    | 'type-convert';
  anchorIndex: number | null;
  anchor?: AnchorPoint;
}

// Options for the hook
export interface UsePointEditorOptions {
  onChange?: (event: PointEditEvent) => void;
  onCommit?: (object: FabricObject) => void;
  anchorRadius?: number;
  handleRadius?: number;
  anchorColor?: string;
  selectedAnchorColor?: string;
  handleColor?: string;
  handleLineColor?: string;
}

// History interface
interface History {
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Helper object types
interface AnchorHandle extends Circle {
  isTemp?: boolean;
  _pointEditorType?: 'anchor';
  _anchorIndex?: number;
}

interface ControlHandle extends Circle {
  isTemp?: boolean;
  _pointEditorType?: 'cp1' | 'cp2';
  _anchorIndex?: number;
}

interface HandleLine extends Line {
  isTemp?: boolean;
  _pointEditorType?: 'handleLine';
  _anchorIndex?: number;
  _cpType?: 'cp1' | 'cp2';
}

type HandleObject = AnchorHandle | ControlHandle | HandleLine;

// Default configuration
const DEFAULT_OPTIONS: Required<UsePointEditorOptions> = {
  onChange: () => {},
  onCommit: () => {},
  anchorRadius: 5,
  handleRadius: 4,
  anchorColor: '#ffffff',
  selectedAnchorColor: '#1890ff',
  handleColor: '#ff6b6b',
  handleLineColor: '#888888',
};

/**
 * Parse a path's path data into an array of AnchorPoints
 */
function parsePathToAnchors(path: Path): AnchorPoint[] {
  const anchors: AnchorPoint[] = [];
  const pathData = path.path;

  if (!pathData || pathData.length === 0) return anchors;

  let currentX = 0;
  let currentY = 0;
  let lastAnchor: AnchorPoint | null = null;

  for (let i = 0; i < pathData.length; i++) {
    const cmd = pathData[i];
    const cmdType = cmd[0] as string;

    switch (cmdType) {
      case 'M': // Move to
        currentX = cmd[1] as number;
        currentY = cmd[2] as number;
        lastAnchor = { x: currentX, y: currentY, type: 'corner' };
        anchors.push(lastAnchor);
        break;

      case 'L': // Line to
        currentX = cmd[1] as number;
        currentY = cmd[2] as number;
        lastAnchor = { x: currentX, y: currentY, type: 'corner' };
        anchors.push(lastAnchor);
        break;

      case 'C': // Cubic bezier
        // C cp1x cp1y cp2x cp2y x y
        const cp1x = cmd[1] as number;
        const cp1y = cmd[2] as number;
        const cp2x = cmd[3] as number;
        const cp2y = cmd[4] as number;
        const endX = cmd[5] as number;
        const endY = cmd[6] as number;

        // Set outgoing control point on previous anchor
        if (lastAnchor) {
          lastAnchor.cp2 = { x: cp1x, y: cp1y };
          // Determine if smooth based on symmetry
          if (lastAnchor.cp1) {
            lastAnchor.type = isSymmetric(
              lastAnchor.x,
              lastAnchor.y,
              lastAnchor.cp1,
              lastAnchor.cp2,
            )
              ? 'smooth'
              : 'corner';
          }
        }

        // Create new anchor with incoming control point
        currentX = endX;
        currentY = endY;
        lastAnchor = {
          x: currentX,
          y: currentY,
          cp1: { x: cp2x, y: cp2y },
          type: 'smooth',
        };
        anchors.push(lastAnchor);
        break;

      case 'Q': // Quadratic bezier
        // Q cpx cpy x y
        const qcpx = cmd[1] as number;
        const qcpy = cmd[2] as number;
        const qEndX = cmd[3] as number;
        const qEndY = cmd[4] as number;

        // Convert quadratic to conceptual representation
        if (lastAnchor) {
          lastAnchor.cp2 = { x: qcpx, y: qcpy };
        }

        currentX = qEndX;
        currentY = qEndY;
        lastAnchor = {
          x: currentX,
          y: currentY,
          cp1: { x: qcpx, y: qcpy },
          type: 'smooth',
        };
        anchors.push(lastAnchor);
        break;

      case 'Z': // Close path
      case 'z':
        // Path is closed; might want to mark this
        break;

      default:
        console.warn('Unhandled path command:', cmdType);
    }
  }

  return anchors;
}

/**
 * Convert anchors back to path data array
 */
function anchorsToPathData(anchors: AnchorPoint[], closed: boolean = false): any[] {
  if (anchors.length === 0) return [];

  const pathData: any[] = [];

  // Start with Move command
  pathData.push(['M', anchors[0].x, anchors[0].y]);

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];

    if (prev.cp2 || curr.cp1) {
      // Use cubic bezier
      const cp1x = prev.cp2 ? prev.cp2.x : prev.x;
      const cp1y = prev.cp2 ? prev.cp2.y : prev.y;
      const cp2x = curr.cp1 ? curr.cp1.x : curr.x;
      const cp2y = curr.cp1 ? curr.cp1.y : curr.y;
      pathData.push(['C', cp1x, cp1y, cp2x, cp2y, curr.x, curr.y]);
    } else {
      // Use line
      pathData.push(['L', curr.x, curr.y]);
    }
  }

  // Close path if needed
  if (closed && anchors.length > 2) {
    const last = anchors[anchors.length - 1];
    const first = anchors[0];
    if (last.cp2 || first.cp1) {
      const cp1x = last.cp2 ? last.cp2.x : last.x;
      const cp1y = last.cp2 ? last.cp2.y : last.y;
      const cp2x = first.cp1 ? first.cp1.x : first.x;
      const cp2y = first.cp1 ? first.cp1.y : first.y;
      pathData.push(['C', cp1x, cp1y, cp2x, cp2y, first.x, first.y]);
    }
    pathData.push(['Z']);
  }

  return pathData;
}

/**
 * Check if two control points are symmetric around an anchor
 */
function isSymmetric(
  anchorX: number,
  anchorY: number,
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  tolerance: number = 1,
): boolean {
  const dx1 = cp1.x - anchorX;
  const dy1 = cp1.y - anchorY;
  const dx2 = cp2.x - anchorX;
  const dy2 = cp2.y - anchorY;

  return Math.abs(dx1 + dx2) < tolerance && Math.abs(dy1 + dy2) < tolerance;
}

/**
 * Transform local path coordinates to canvas global coordinates
 * Path coordinates are relative to the path's internal coordinate system,
 * which needs to be offset by pathOffset and then transformed by the object's matrix
 */
function localToGlobal(
  object: FabricObject,
  localPoint: { x: number; y: number },
): { x: number; y: number } {
  if (!(object instanceof Path)) {
    const matrix = object.calcTransformMatrix();
    const point = new Point(localPoint.x, localPoint.y);
    const transformed = point.transform(matrix);
    return { x: transformed.x, y: transformed.y };
  }

  // For paths, we need to account for pathOffset
  // Path coordinates are relative to the path's bounding box center
  const path = object as Path;
  const pathOffset = path.pathOffset || { x: 0, y: 0 };

  // First, offset the point by -pathOffset (path coords are relative to pathOffset)
  const offsetPoint = new Point(localPoint.x - pathOffset.x, localPoint.y - pathOffset.y);

  // Then apply the object's transformation matrix
  const matrix = path.calcTransformMatrix();
  const transformed = offsetPoint.transform(matrix);

  return { x: transformed.x, y: transformed.y };
}

/**
 * Transform canvas global coordinates to local path coordinates
 */
function globalToLocal(
  object: FabricObject,
  globalPoint: { x: number; y: number },
): { x: number; y: number } {
  if (!(object instanceof Path)) {
    const matrix = object.calcTransformMatrix();
    const invertedMatrix = [...matrix] as [number, number, number, number, number, number];
    const det = matrix[0] * matrix[3] - matrix[1] * matrix[2];
    if (Math.abs(det) < 1e-10) {
      return globalPoint;
    }
    invertedMatrix[0] = matrix[3] / det;
    invertedMatrix[1] = -matrix[1] / det;
    invertedMatrix[2] = -matrix[2] / det;
    invertedMatrix[3] = matrix[0] / det;
    invertedMatrix[4] = (matrix[2] * matrix[5] - matrix[3] * matrix[4]) / det;
    invertedMatrix[5] = (matrix[1] * matrix[4] - matrix[0] * matrix[5]) / det;

    const point = new Point(globalPoint.x, globalPoint.y);
    const transformed = point.transform(invertedMatrix);
    return { x: transformed.x, y: transformed.y };
  }

  // For paths, we need to account for pathOffset
  const path = object as Path;
  const pathOffset = path.pathOffset || { x: 0, y: 0 };

  // First, apply the inverse transformation matrix
  const matrix = path.calcTransformMatrix();
  const invertedMatrix = [...matrix] as [number, number, number, number, number, number];
  const det = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  if (Math.abs(det) < 1e-10) {
    return globalPoint;
  }
  invertedMatrix[0] = matrix[3] / det;
  invertedMatrix[1] = -matrix[1] / det;
  invertedMatrix[2] = -matrix[2] / det;
  invertedMatrix[3] = matrix[0] / det;
  invertedMatrix[4] = (matrix[2] * matrix[5] - matrix[3] * matrix[4]) / det;
  invertedMatrix[5] = (matrix[1] * matrix[4] - matrix[0] * matrix[5]) / det;

  const point = new Point(globalPoint.x, globalPoint.y);
  const transformed = point.transform(invertedMatrix);

  // Then add pathOffset to get back to path coordinates
  return {
    x: transformed.x + pathOffset.x,
    y: transformed.y + pathOffset.y,
  };
}

/**
 * Calculate distance from a point to a bezier curve segment
 */
function distanceToSegment(
  px: number,
  py: number,
  anchor1: AnchorPoint,
  anchor2: AnchorPoint,
  samples: number = 20,
): { distance: number; t: number; point: { x: number; y: number } } {
  let minDist = Infinity;
  let closestT = 0;
  let closestPoint = { x: anchor1.x, y: anchor1.y };

  const hasCurve = anchor1.cp2 || anchor2.cp1;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    let x: number, y: number;

    if (hasCurve) {
      // Cubic bezier interpolation
      const cp1x = anchor1.cp2 ? anchor1.cp2.x : anchor1.x;
      const cp1y = anchor1.cp2 ? anchor1.cp2.y : anchor1.y;
      const cp2x = anchor2.cp1 ? anchor2.cp1.x : anchor2.x;
      const cp2y = anchor2.cp1 ? anchor2.cp1.y : anchor2.y;

      const mt = 1 - t;
      x =
        mt * mt * mt * anchor1.x +
        3 * mt * mt * t * cp1x +
        3 * mt * t * t * cp2x +
        t * t * t * anchor2.x;
      y =
        mt * mt * mt * anchor1.y +
        3 * mt * mt * t * cp1y +
        3 * mt * t * t * cp2y +
        t * t * t * anchor2.y;
    } else {
      // Linear interpolation
      x = anchor1.x + t * (anchor2.x - anchor1.x);
      y = anchor1.y + t * (anchor2.y - anchor1.y);
    }

    const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closestT = t;
      closestPoint = { x, y };
    }
  }

  return { distance: minDist, t: closestT, point: closestPoint };
}

/**
 * The usePointEditor hook - provides Illustrator-style point editing
 */
export const usePointEditor = (
  canvas: Canvas | null,
  history: History,
  options: UsePointEditorOptions = {},
) => {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAnchorIndex, setSelectedAnchorIndex] = useState<number | null>(null);

  // Refs for mutable data
  const editingObject = useRef<FabricObject | null>(null);
  const anchors = useRef<AnchorPoint[]>([]);
  const handleObjects = useRef<HandleObject[]>([]);
  const originalPathData = useRef<any[] | null>(null);
  const isPathClosed = useRef(false);
  const isDragging = useRef(false);
  const dragTarget = useRef<{ type: 'anchor' | 'cp1' | 'cp2'; index: number } | null>(null);
  const altKeyPressed = useRef(false);

  /**
   * Create visual handle for an anchor point
   */
  const createAnchorHandle = useCallback(
    (anchor: AnchorPoint, index: number, isSelected: boolean): AnchorHandle => {
      if (!editingObject.current) {
        throw new Error('No editing object');
      }

      const globalPos = localToGlobal(editingObject.current, anchor);

      const handle = new Circle({
        left: globalPos.x,
        top: globalPos.y,
        radius: config.anchorRadius,
        fill: isSelected ? config.selectedAnchorColor : config.anchorColor,
        stroke: '#333333',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'pointer',
      }) as AnchorHandle;

      handle.isTemp = true;
      handle._pointEditorType = 'anchor';
      handle._anchorIndex = index;

      return handle;
    },
    [config.anchorRadius, config.anchorColor, config.selectedAnchorColor],
  );

  /**
   * Create visual handle for a control point
   */
  const createControlHandle = useCallback(
    (
      anchor: AnchorPoint,
      cpType: 'cp1' | 'cp2',
      index: number,
    ): { handle: ControlHandle; line: HandleLine } | null => {
      if (!editingObject.current) return null;

      const cp = cpType === 'cp1' ? anchor.cp1 : anchor.cp2;
      if (!cp) return null;

      const anchorGlobal = localToGlobal(editingObject.current, anchor);
      const cpGlobal = localToGlobal(editingObject.current, cp);

      // Create the line connecting anchor to control point
      const line = new Line([anchorGlobal.x, anchorGlobal.y, cpGlobal.x, cpGlobal.y], {
        stroke: config.handleLineColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      }) as HandleLine;

      line.isTemp = true;
      line._pointEditorType = 'handleLine';
      line._anchorIndex = index;
      line._cpType = cpType;

      // Create the control point handle
      const handle = new Circle({
        left: cpGlobal.x,
        top: cpGlobal.y,
        radius: config.handleRadius,
        fill: config.handleColor,
        stroke: '#333333',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'pointer',
      }) as ControlHandle;

      handle.isTemp = true;
      handle._pointEditorType = cpType;
      handle._anchorIndex = index;

      return { handle, line };
    },
    [config.handleRadius, config.handleColor, config.handleLineColor],
  );

  /**
   * Clear all visual handle objects from canvas
   */
  const clearHandleObjects = useCallback(() => {
    if (!canvas) return;

    handleObjects.current.forEach((obj) => {
      canvas.remove(obj);
    });
    handleObjects.current = [];
    canvas.requestRenderAll();
  }, [canvas]);

  /**
   * Render all visual handles for current anchors
   */
  const renderHandles = useCallback(() => {
    if (!canvas || !editingObject.current) return;

    clearHandleObjects();

    const newHandles: HandleObject[] = [];

    anchors.current.forEach((anchor, index) => {
      const isSelected = selectedAnchorIndex === index;

      // Create anchor handle
      const anchorHandle = createAnchorHandle(anchor, index, isSelected);
      newHandles.push(anchorHandle);
      canvas.add(anchorHandle);

      // Create control point handles (only for selected anchor or all if you prefer)
      // For MVP, show handles for selected anchor only to reduce clutter
      if (isSelected || anchor.cp1 || anchor.cp2) {
        if (anchor.cp1) {
          const cp1Result = createControlHandle(anchor, 'cp1', index);
          if (cp1Result) {
            newHandles.push(cp1Result.line);
            newHandles.push(cp1Result.handle);
            canvas.add(cp1Result.line);
            canvas.add(cp1Result.handle);
          }
        }

        if (anchor.cp2) {
          const cp2Result = createControlHandle(anchor, 'cp2', index);
          if (cp2Result) {
            newHandles.push(cp2Result.line);
            newHandles.push(cp2Result.handle);
            canvas.add(cp2Result.line);
            canvas.add(cp2Result.handle);
          }
        }
      }
    });

    handleObjects.current = newHandles;
    canvas.requestRenderAll();
  }, [canvas, selectedAnchorIndex, clearHandleObjects, createAnchorHandle, createControlHandle]);

  /**
   * Update the path object with current anchors
   */
  const updatePathFromAnchors = useCallback(() => {
    if (!editingObject.current || !(editingObject.current instanceof Path)) return;

    const pathData = anchorsToPathData(anchors.current, isPathClosed.current);
    (editingObject.current as Path).path = pathData as any;

    // Need to recalculate path dimensions
    editingObject.current.setCoords();
    editingObject.current.dirty = true;

    canvas?.requestRenderAll();
  }, [canvas]);

  /**
   * Enter point editing mode for an object
   */
  const enter = useCallback(
    (object: FabricObject) => {
      if (!canvas || isEditing) return;

      // Only Path objects can be point-edited
      if (!(object instanceof Path)) {
        console.warn('Point editing is only available for Path objects');
        return;
      }

      console.log('Entering point edit mode for:', object.type);

      // Save original state for potential cancel
      originalPathData.current = JSON.parse(JSON.stringify(object.path));

      // Check if path is closed
      const pathData = object.path || [];
      isPathClosed.current = pathData.some((cmd: any) => cmd[0] === 'Z' || cmd[0] === 'z');

      // Parse path to anchors
      anchors.current = parsePathToAnchors(object);
      editingObject.current = object;

      // Disable object selection/movement
      object.selectable = false;
      object.evented = false;
      object.hasControls = false;
      object.hasBorders = false;

      // Deselect from canvas
      canvas.discardActiveObject();

      setIsEditing(true);
      setSelectedAnchorIndex(null);

      // Render handles
      renderHandles();

      config.onChange({
        type: 'anchor-select',
        anchorIndex: null,
      });
    },
    [canvas, isEditing, renderHandles, config],
  );

  /**
   * Exit point editing mode
   */
  const exit = useCallback(
    (commit: boolean = true) => {
      if (!canvas || !isEditing || !editingObject.current) return;

      console.log('Exiting point edit mode, commit:', commit);

      clearHandleObjects();

      if (commit) {
        // Apply final changes and save to history
        updatePathFromAnchors();
        history.saveState();
        config.onCommit(editingObject.current);
      } else {
        // Revert to original path data
        if (originalPathData.current && editingObject.current instanceof Path) {
          (editingObject.current as Path).path = originalPathData.current as any;
          editingObject.current.setCoords();
          editingObject.current.dirty = true;
        }
      }

      // Re-enable object selection
      if (editingObject.current) {
        editingObject.current.selectable = true;
        editingObject.current.evented = true;
        editingObject.current.hasControls = true;
        editingObject.current.hasBorders = true;
        canvas.setActiveObject(editingObject.current);
      }

      // Reset state
      editingObject.current = null;
      anchors.current = [];
      originalPathData.current = null;
      isPathClosed.current = false;

      setIsEditing(false);
      setSelectedAnchorIndex(null);

      canvas.requestRenderAll();
    },
    [canvas, isEditing, clearHandleObjects, updatePathFromAnchors, history, config],
  );

  /**
   * Select an anchor by index
   */
  const selectAnchor = useCallback(
    (index: number | null) => {
      if (!isEditing) return;

      setSelectedAnchorIndex(index);
      renderHandles();

      config.onChange({
        type: 'anchor-select',
        anchorIndex: index,
        anchor: index !== null ? anchors.current[index] : undefined,
      });
    },
    [isEditing, renderHandles, config],
  );

  /**
   * Move an anchor point
   */
  const moveAnchor = useCallback(
    (index: number, newX: number, newY: number) => {
      if (!isEditing || !editingObject.current) return;

      const anchor = anchors.current[index];
      if (!anchor) return;

      // Convert global position to local
      const localPos = globalToLocal(editingObject.current, { x: newX, y: newY });

      // Calculate delta to also move control points
      const dx = localPos.x - anchor.x;
      const dy = localPos.y - anchor.y;

      anchor.x = localPos.x;
      anchor.y = localPos.y;

      // Move control points with anchor
      if (anchor.cp1) {
        anchor.cp1.x += dx;
        anchor.cp1.y += dy;
      }
      if (anchor.cp2) {
        anchor.cp2.x += dx;
        anchor.cp2.y += dy;
      }

      updatePathFromAnchors();
      renderHandles();

      config.onChange({
        type: 'anchor-move',
        anchorIndex: index,
        anchor,
      });
    },
    [isEditing, updatePathFromAnchors, renderHandles, config],
  );

  /**
   * Move a control point handle
   */
  const moveHandle = useCallback(
    (
      index: number,
      cpType: 'cp1' | 'cp2',
      newX: number,
      newY: number,
      breakSymmetry: boolean = false,
    ) => {
      if (!isEditing || !editingObject.current) return;

      const anchor = anchors.current[index];
      if (!anchor) return;

      // Convert global position to local
      const localPos = globalToLocal(editingObject.current, { x: newX, y: newY });

      // Update the control point
      if (cpType === 'cp1') {
        anchor.cp1 = { x: localPos.x, y: localPos.y };

        // If smooth and not breaking symmetry, mirror to cp2
        if (anchor.type === 'smooth' && !breakSymmetry && anchor.cp2) {
          const dx = localPos.x - anchor.x;
          const dy = localPos.y - anchor.y;
          anchor.cp2 = { x: anchor.x - dx, y: anchor.y - dy };
        }
      } else {
        anchor.cp2 = { x: localPos.x, y: localPos.y };

        // If smooth and not breaking symmetry, mirror to cp1
        if (anchor.type === 'smooth' && !breakSymmetry && anchor.cp1) {
          const dx = localPos.x - anchor.x;
          const dy = localPos.y - anchor.y;
          anchor.cp1 = { x: anchor.x - dx, y: anchor.y - dy };
        }
      }

      // If breaking symmetry, convert to corner
      if (breakSymmetry && anchor.type === 'smooth') {
        anchor.type = 'corner';
      }

      updatePathFromAnchors();
      renderHandles();

      config.onChange({
        type: 'handle-move',
        anchorIndex: index,
        anchor,
      });
    },
    [isEditing, updatePathFromAnchors, renderHandles, config],
  );

  /**
   * Add a new point at a position on the path
   */
  const addPoint = useCallback(
    (globalX: number, globalY: number): number | null => {
      if (!isEditing || !editingObject.current) return null;

      // Convert to local coordinates
      const localPos = globalToLocal(editingObject.current, { x: globalX, y: globalY });

      // Find the nearest segment
      let bestSegment = -1;
      let bestT = 0;
      let bestDist = Infinity;

      for (let i = 0; i < anchors.current.length - 1; i++) {
        const result = distanceToSegment(
          localPos.x,
          localPos.y,
          anchors.current[i],
          anchors.current[i + 1],
        );
        if (result.distance < bestDist) {
          bestDist = result.distance;
          bestSegment = i;
          bestT = result.t;
        }
      }

      // Also check closing segment if path is closed
      if (isPathClosed.current && anchors.current.length > 2) {
        const result = distanceToSegment(
          localPos.x,
          localPos.y,
          anchors.current[anchors.current.length - 1],
          anchors.current[0],
        );
        if (result.distance < bestDist) {
          bestDist = result.distance;
          bestSegment = anchors.current.length - 1;
          bestT = result.t;
        }
      }

      // Only add if reasonably close to the path
      if (bestDist > 20 || bestSegment < 0) return null;

      // Split the segment at t
      const insertIndex = bestSegment + 1;
      const newAnchor: AnchorPoint = {
        x: localPos.x,
        y: localPos.y,
        type: 'corner',
      };

      // Insert the new anchor
      anchors.current.splice(insertIndex, 0, newAnchor);

      updatePathFromAnchors();
      setSelectedAnchorIndex(insertIndex);
      renderHandles();

      config.onChange({
        type: 'anchor-add',
        anchorIndex: insertIndex,
        anchor: newAnchor,
      });

      return insertIndex;
    },
    [isEditing, updatePathFromAnchors, renderHandles, config],
  );

  /**
   * Remove an anchor point
   */
  const removePoint = useCallback(
    (index: number) => {
      if (!isEditing || anchors.current.length <= 2) {
        console.warn('Cannot remove: path must have at least 2 points');
        return;
      }

      if (index < 0 || index >= anchors.current.length) return;

      anchors.current.splice(index, 1);

      updatePathFromAnchors();

      // Adjust selection
      if (selectedAnchorIndex !== null) {
        if (selectedAnchorIndex === index) {
          setSelectedAnchorIndex(null);
        } else if (selectedAnchorIndex > index) {
          setSelectedAnchorIndex(selectedAnchorIndex - 1);
        }
      }

      renderHandles();

      config.onChange({
        type: 'anchor-delete',
        anchorIndex: index,
      });
    },
    [isEditing, selectedAnchorIndex, updatePathFromAnchors, renderHandles, config],
  );

  /**
   * Convert an anchor between smooth and corner types
   */
  const convertPointType = useCallback(
    (index: number, type: 'smooth' | 'corner') => {
      if (!isEditing) return;

      const anchor = anchors.current[index];
      if (!anchor) return;

      anchor.type = type;

      if (type === 'smooth' && anchor.cp1 && anchor.cp2) {
        // Make handles symmetric
        const dx = (anchor.cp2.x - anchor.cp1.x) / 2;
        const dy = (anchor.cp2.y - anchor.cp1.y) / 2;
        anchor.cp1 = { x: anchor.x - dx, y: anchor.y - dy };
        anchor.cp2 = { x: anchor.x + dx, y: anchor.y + dy };
      }

      updatePathFromAnchors();
      renderHandles();

      config.onChange({
        type: 'type-convert',
        anchorIndex: index,
        anchor,
      });
    },
    [isEditing, updatePathFromAnchors, renderHandles, config],
  );

  /**
   * Get all anchors
   */
  const getAnchors = useCallback(() => {
    return [...anchors.current];
  }, []);

  /**
   * Handle mouse events on the canvas for point editing
   */
  useEffect(() => {
    if (!canvas || !isEditing) return;

    const handleMouseDown = (opt: any) => {
      const target = opt.target;
      const pointer = canvas.getPointer(opt.e);

      // Check if clicking on a handle object
      if (target && target.isTemp && target._pointEditorType) {
        const type = target._pointEditorType;
        const index = target._anchorIndex;

        if (type === 'anchor') {
          selectAnchor(index);
          dragTarget.current = { type: 'anchor', index };
          isDragging.current = true;
        } else if (type === 'cp1' || type === 'cp2') {
          selectAnchor(index);
          dragTarget.current = { type, index };
          isDragging.current = true;
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
        return;
      }

      // Double-click on path to add point
      // (handled separately via dblclick event)

      // Click outside handles - could add point or deselect
      if (!target || !target.isTemp) {
        // Check if clicking on the edited path itself
        if (target === editingObject.current) {
          // Add a point at click location
          addPoint(pointer.x, pointer.y);
        } else {
          // Clicked elsewhere - deselect anchor
          selectAnchor(null);
        }
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isDragging.current || !dragTarget.current) return;

      const pointer = canvas.getPointer(opt.e);
      const { type, index } = dragTarget.current;

      // Check if Alt/Option is pressed for breaking symmetry
      const breakSymmetry = opt.e.altKey;
      altKeyPressed.current = breakSymmetry;

      if (type === 'anchor') {
        moveAnchor(index, pointer.x, pointer.y);
      } else if (type === 'cp1' || type === 'cp2') {
        moveHandle(index, type, pointer.x, pointer.y, breakSymmetry);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      dragTarget.current = null;
      altKeyPressed.current = false;
    };

    const handleDoubleClick = (opt: any) => {
      const pointer = canvas.getPointer(opt.e);

      // Add a point on double-click
      if (opt.target === editingObject.current || !opt.target) {
        addPoint(pointer.x, pointer.y);
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleDoubleClick);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleDoubleClick);
    };
  }, [canvas, isEditing, selectAnchor, moveAnchor, moveHandle, addPoint]);

  // Re-render handles when selection changes
  useEffect(() => {
    if (isEditing) {
      renderHandles();
    }
  }, [isEditing, selectedAnchorIndex, renderHandles]);

  return {
    // State
    isEditing,
    selectedAnchorIndex,
    editingObject: editingObject.current,

    // Actions
    enter,
    exit,
    selectAnchor,
    moveAnchor,
    moveHandle,
    addPoint,
    removePoint,
    convertPointType,
    getAnchors,
  };
};

export default usePointEditor;
