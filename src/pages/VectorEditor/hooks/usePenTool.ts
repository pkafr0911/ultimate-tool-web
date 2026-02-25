import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, Path, Circle, Line } from 'fabric';

// ── Types ──────────────────────────────────────────────────────────────────

/** An anchor along the path being drawn */
interface Anchor {
  x: number;
  y: number;
  /** Incoming control point (handle before the anchor) */
  cp1?: { x: number; y: number };
  /** Outgoing control point (handle after the anchor) */
  cp2?: { x: number; y: number };
}

/** Custom circle type used for interactive control-point handles */
interface ControlCircle extends Circle {
  isTemp?: boolean;
  _penRole?: 'anchor' | 'cpIn' | 'cpOut';
  _anchorIdx?: number;
}

/** Custom line used for handle-to-anchor connectors */
interface HandleLine extends Line {
  isTemp?: boolean;
  _penRole?: 'handleLine';
  _anchorIdx?: number;
  _cpType?: 'cpIn' | 'cpOut';
}

// Extend Fabric Object type
declare module 'fabric' {
  interface Object {
    isTemp?: boolean;
  }
}

// ── Helper: rebuild path commands from anchors ─────────────────────────────

function anchorsToPathString(anchors: Anchor[], closed: boolean = false): string {
  if (anchors.length === 0) return '';

  let d = `M ${anchors[0].x} ${anchors[0].y}`;

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];

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

  if (closed && anchors.length > 2) {
    const last = anchors[anchors.length - 1];
    const first = anchors[0];
    if (last.cp2 || first.cp1) {
      const cp1x = last.cp2 ? last.cp2.x : last.x;
      const cp1y = last.cp2 ? last.cp2.y : last.y;
      const cp2x = first.cp1 ? first.cp1.x : first.x;
      const cp2y = first.cp1 ? first.cp1.y : first.y;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${first.x} ${first.y}`;
    } else {
      d += ` L ${first.x} ${first.y}`;
    }
    d += ' Z';
  }

  return d;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export const usePenTool = (canvas: Canvas | null, saveHistory?: () => void) => {
  // ── State ──
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // ── Refs (mutable data that doesn't trigger re-renders) ──
  const pathRef = useRef<Path | null>(null);
  const anchorsRef = useRef<Anchor[]>([]);
  const controlObjects = useRef<(ControlCircle | HandleLine)[]>([]);
  const rubberBand = useRef<Path | null>(null);
  const isClosedRef = useRef(false);

  /** True while the mouse is held down (for drag-to-curve) */
  const isDragging = useRef(false);
  /** The index of the anchor whose handles are being dragged */
  const dragAnchorIdx = useRef<number | null>(null);

  // ── Edit-mode refs (for post-finish interactive editing) ──
  const editDragTarget = useRef<{
    type: 'anchor' | 'cpIn' | 'cpOut';
    index: number;
  } | null>(null);

  // ── Style constants ──
  const ANCHOR_RADIUS = 5;
  const HANDLE_RADIUS = 4;
  const ANCHOR_FILL = '#ffffff';
  const ANCHOR_FILL_START = '#4CAF50';
  const ANCHOR_STROKE = '#333333';
  const HANDLE_FILL = '#1890ff';
  const HANDLE_LINE_COLOR = '#999999';
  const PATH_STROKE = '#333333';
  const PATH_STROKE_WIDTH = 2;
  const RUBBERBAND_STROKE = '#999999';

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Remove all temporary control objects (circles, lines) from canvas */
  const clearControlObjects = useCallback(() => {
    if (!canvas) return;
    controlObjects.current.forEach((obj) => canvas.remove(obj));
    controlObjects.current = [];
  }, [canvas]);

  /** Remove rubber band preview */
  const clearRubberBand = useCallback(() => {
    if (!canvas || !rubberBand.current) return;
    canvas.remove(rubberBand.current);
    rubberBand.current = null;
  }, [canvas]);

  // ── Path manipulation ────────────────────────────────────────────────

  /**
   * Sync the path by recreating it from current anchors.
   * Fabric.js v6 needs fresh pathOffset / width / height calculation
   * which only happens during Path construction — mutating `.path` in-place
   * leaves stale dimensions and the stroke can disappear.
   */
  const syncPathData = useCallback(() => {
    if (!canvas || !pathRef.current) return;

    const d = anchorsToPathString(anchorsRef.current, isClosedRef.current);
    if (!d) return;

    const old = pathRef.current;
    const replacement = new Path(d, {
      fill: old.fill ?? '',
      stroke: old.stroke ?? PATH_STROKE,
      strokeWidth: old.strokeWidth ?? PATH_STROKE_WIDTH,
      selectable: false,
      evented: false,
      objectCaching: false,
      perPixelTargetFind: true,
    });
    replacement.isTemp = true;

    canvas.remove(old);
    canvas.add(replacement);
    canvas.sendObjectToBack(replacement);
    pathRef.current = replacement;
    canvas.requestRenderAll();
  }, [canvas]);

  /**
   * Create the initial Path object (first click) or update it in-place.
   */
  const ensurePath = useCallback(() => {
    if (!canvas) return;

    if (pathRef.current) {
      syncPathData();
      return;
    }

    const d = anchorsToPathString(anchorsRef.current);
    if (!d) return;

    const path = new Path(d, {
      fill: '',
      stroke: PATH_STROKE,
      strokeWidth: PATH_STROKE_WIDTH,
      selectable: false,
      evented: false,
      objectCaching: false,
      perPixelTargetFind: true,
    });
    path.isTemp = true;
    canvas.add(path);
    canvas.sendObjectToBack(path);
    pathRef.current = path;
  }, [canvas, syncPathData]);

  // ── Control-point rendering ────────────────────────────────────────────

  const makeAnchorCircle = useCallback(
    (x: number, y: number, index: number, isStart: boolean = false): ControlCircle => {
      const c = new Circle({
        left: x,
        top: y,
        radius: ANCHOR_RADIUS,
        fill: isStart ? ANCHOR_FILL_START : ANCHOR_FILL,
        stroke: ANCHOR_STROKE,
        strokeWidth: 1.5,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: isStart ? 'pointer' : 'default',
      }) as ControlCircle;
      c.isTemp = true;
      c._penRole = 'anchor';
      c._anchorIdx = index;
      return c;
    },
    [],
  );

  const makeHandleCircle = useCallback(
    (x: number, y: number, index: number, role: 'cpIn' | 'cpOut'): ControlCircle => {
      const c = new Circle({
        left: x,
        top: y,
        radius: HANDLE_RADIUS,
        fill: HANDLE_FILL,
        stroke: '#ffffff',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'move',
      }) as ControlCircle;
      c.isTemp = true;
      c._penRole = role;
      c._anchorIdx = index;
      return c;
    },
    [],
  );

  const makeHandleLine = useCallback(
    (
      ax: number,
      ay: number,
      hx: number,
      hy: number,
      index: number,
      cpType: 'cpIn' | 'cpOut',
    ): HandleLine => {
      const l = new Line([ax, ay, hx, hy], {
        stroke: HANDLE_LINE_COLOR,
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      }) as HandleLine;
      l.isTemp = true;
      l._penRole = 'handleLine';
      l._anchorIdx = index;
      l._cpType = cpType;
      return l;
    },
    [],
  );

  /**
   * Re-render all interactive control circles & handle lines.
   */
  const renderControls = useCallback(() => {
    if (!canvas) return;
    clearControlObjects();

    const objs: (ControlCircle | HandleLine)[] = [];
    const ancs = anchorsRef.current;

    for (let i = 0; i < ancs.length; i++) {
      const a = ancs[i];

      // Incoming control handle + line
      if (a.cp1) {
        const hl = makeHandleLine(a.x, a.y, a.cp1.x, a.cp1.y, i, 'cpIn');
        objs.push(hl);
        canvas.add(hl);

        const hc = makeHandleCircle(a.cp1.x, a.cp1.y, i, 'cpIn');
        objs.push(hc);
        canvas.add(hc);
      }

      // Outgoing control handle + line
      if (a.cp2) {
        const hl = makeHandleLine(a.x, a.y, a.cp2.x, a.cp2.y, i, 'cpOut');
        objs.push(hl);
        canvas.add(hl);

        const hc = makeHandleCircle(a.cp2.x, a.cp2.y, i, 'cpOut');
        objs.push(hc);
        canvas.add(hc);
      }

      // Anchor circle (drawn on top)
      const ac = makeAnchorCircle(a.x, a.y, i, i === 0);
      objs.push(ac);
      canvas.add(ac);
    }

    controlObjects.current = objs;
    canvas.requestRenderAll();
  }, [canvas, clearControlObjects, makeAnchorCircle, makeHandleCircle, makeHandleLine]);

  // ── Rubber band (preview line from last anchor to cursor) ──────────────

  const updateRubberBand = useCallback(
    (pointerX: number, pointerY: number) => {
      if (!canvas || anchorsRef.current.length === 0) return;

      clearRubberBand();

      const last = anchorsRef.current[anchorsRef.current.length - 1];
      let d: string;

      if (last.cp2) {
        d = `M ${last.x} ${last.y} C ${last.cp2.x} ${last.cp2.y} ${pointerX} ${pointerY} ${pointerX} ${pointerY}`;
      } else {
        d = `M ${last.x} ${last.y} L ${pointerX} ${pointerY}`;
      }

      const rb = new Path(d, {
        fill: '',
        stroke: RUBBERBAND_STROKE,
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      rb.isTemp = true;
      canvas.add(rb);
      rubberBand.current = rb;
      canvas.requestRenderAll();
    },
    [canvas, clearRubberBand],
  );

  // ── Finish / close path ───────────────────────────────────────────────

  /**
   * Finish the current path and enter edit mode.
   * Control points stay on canvas and are draggable – exactly like the
   * Fabric.js quadratic-curve & stickman demos.
   */
  const finishPath = useCallback(
    (closed: boolean = false) => {
      if (!canvas || anchorsRef.current.length < 2) {
        // Not enough points – cancel
        if (pathRef.current) canvas?.remove(pathRef.current);
        clearControlObjects();
        clearRubberBand();
        pathRef.current = null;
        anchorsRef.current = [];
        setIsDrawing(false);
        return;
      }

      clearRubberBand();
      isClosedRef.current = closed;

      // Build final path string
      const d = anchorsToPathString(anchorsRef.current, closed);

      // Remove the temporary in-progress Path
      if (pathRef.current) canvas.remove(pathRef.current);

      // Create a fresh Path (objectCaching: false so direct .path[] edits render)
      const finalPath = new Path(d, {
        fill: closed ? 'rgba(200,200,200,0.3)' : '',
        stroke: PATH_STROKE,
        strokeWidth: PATH_STROKE_WIDTH,
        selectable: false,
        evented: false,
        objectCaching: false,
        perPixelTargetFind: true,
      });
      canvas.add(finalPath);
      canvas.sendObjectToBack(finalPath);
      pathRef.current = finalPath;

      // Re-render interactive control handles
      clearControlObjects();
      renderControls();

      setIsDrawing(false);
      setIsEditMode(true);
      isDragging.current = false;
      dragAnchorIdx.current = null;

      if (saveHistory) saveHistory();
      canvas.requestRenderAll();
    },
    [canvas, clearControlObjects, clearRubberBand, renderControls, saveHistory],
  );

  /**
   * Exit edit mode: make the path a normal selectable object.
   */
  const exitEditMode = useCallback(() => {
    if (!canvas) return;

    clearControlObjects();
    clearRubberBand();

    if (pathRef.current) {
      // Rebuild path from current anchors so position/dimensions are correct
      const d = anchorsToPathString(anchorsRef.current, isClosedRef.current);
      const newPath = new Path(d, {
        fill: pathRef.current.fill,
        stroke: pathRef.current.stroke,
        strokeWidth: pathRef.current.strokeWidth,
        selectable: true,
        evented: true,
        objectCaching: true,
        perPixelTargetFind: true,
      });
      canvas.remove(pathRef.current);
      canvas.add(newPath);
      canvas.setActiveObject(newPath);
    }

    pathRef.current = null;
    anchorsRef.current = [];
    isClosedRef.current = false;
    editDragTarget.current = null;
    setIsEditMode(false);
    canvas.requestRenderAll();
  }, [canvas, clearControlObjects, clearRubberBand]);

  /**
   * Cancel drawing (discard everything).
   */
  const cancelDrawing = useCallback(() => {
    if (!canvas) return;

    if (pathRef.current) canvas.remove(pathRef.current);
    clearControlObjects();
    clearRubberBand();

    pathRef.current = null;
    anchorsRef.current = [];
    isClosedRef.current = false;
    isDragging.current = false;
    dragAnchorIdx.current = null;
    setIsDrawing(false);
    setIsEditMode(false);
    canvas.requestRenderAll();
  }, [canvas, clearControlObjects, clearRubberBand]);

  // ── Drawing-mode mouse handlers ───────────────────────────────────────

  const onMouseDown = useCallback(
    (e: any) => {
      if (!canvas) return;

      // ── Edit mode: start dragging a control point ──
      if (isEditMode) {
        const target = e.target as ControlCircle | undefined;
        if (target && target.isTemp && target._penRole) {
          if (target._penRole === 'anchor') {
            editDragTarget.current = { type: 'anchor', index: target._anchorIdx! };
            isDragging.current = true;
          } else if (target._penRole === 'cpIn') {
            editDragTarget.current = { type: 'cpIn', index: target._anchorIdx! };
            isDragging.current = true;
          } else if (target._penRole === 'cpOut') {
            editDragTarget.current = { type: 'cpOut', index: target._anchorIdx! };
            isDragging.current = true;
          }
          return;
        }
        // Click on empty area – exit edit mode
        exitEditMode();
        return;
      }

      const pointer = canvas.getPointer(e.e);

      // ── Check if clicking the start anchor to close the path ──
      if (isDrawing && anchorsRef.current.length > 2) {
        const target = e.target as ControlCircle | undefined;
        if (target && target.isTemp && target._penRole === 'anchor' && target._anchorIdx === 0) {
          finishPath(true);
          return;
        }
      }

      // ── Start or continue drawing ──
      if (!isDrawing) {
        anchorsRef.current = [{ x: pointer.x, y: pointer.y }];
        setIsDrawing(true);
        ensurePath();
        renderControls();
      } else {
        anchorsRef.current.push({ x: pointer.x, y: pointer.y });
        syncPathData();
        renderControls();
      }

      // Start tracking drag (for creating curve handles)
      isDragging.current = true;
      dragAnchorIdx.current = anchorsRef.current.length - 1;
    },
    [
      canvas,
      isDrawing,
      isEditMode,
      ensurePath,
      syncPathData,
      renderControls,
      finishPath,
      exitEditMode,
    ],
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (!canvas) return;

      const pointer = canvas.getPointer(e.e);

      // ── Edit mode: drag a control point ──
      if (isEditMode && isDragging.current && editDragTarget.current) {
        const { type, index } = editDragTarget.current;
        const anchor = anchorsRef.current[index];
        if (!anchor) return;

        if (type === 'anchor') {
          const dx = pointer.x - anchor.x;
          const dy = pointer.y - anchor.y;
          anchor.x = pointer.x;
          anchor.y = pointer.y;
          if (anchor.cp1) {
            anchor.cp1.x += dx;
            anchor.cp1.y += dy;
          }
          if (anchor.cp2) {
            anchor.cp2.x += dx;
            anchor.cp2.y += dy;
          }
        } else if (type === 'cpIn') {
          anchor.cp1 = { x: pointer.x, y: pointer.y };
          // Mirror to cp2 unless Alt is held (break tangent)
          if (!e.e.altKey && anchor.cp2) {
            const dx = pointer.x - anchor.x;
            const dy = pointer.y - anchor.y;
            anchor.cp2 = { x: anchor.x - dx, y: anchor.y - dy };
          }
        } else if (type === 'cpOut') {
          anchor.cp2 = { x: pointer.x, y: pointer.y };
          if (!e.e.altKey && anchor.cp1) {
            const dx = pointer.x - anchor.x;
            const dy = pointer.y - anchor.y;
            anchor.cp1 = { x: anchor.x - dx, y: anchor.y - dy };
          }
        }

        // Directly update the path data (like the Fabric demos)
        syncPathData();
        renderControls();
        return;
      }

      // ── Drawing mode ──
      if (!isDrawing) return;

      if (isDragging.current && dragAnchorIdx.current !== null) {
        const idx = dragAnchorIdx.current;
        const anchor = anchorsRef.current[idx];
        if (!anchor) return;

        const dx = pointer.x - anchor.x;
        const dy = pointer.y - anchor.y;

        // Set outgoing + mirrored incoming control handles
        anchor.cp2 = { x: anchor.x + dx, y: anchor.y + dy };
        anchor.cp1 = { x: anchor.x - dx, y: anchor.y - dy };

        syncPathData();
        renderControls();
        clearRubberBand();
      } else {
        updateRubberBand(pointer.x, pointer.y);
      }
    },
    [
      canvas,
      isDrawing,
      isEditMode,
      syncPathData,
      renderControls,
      clearRubberBand,
      updateRubberBand,
    ],
  );

  const onMouseUp = useCallback(
    (_e: any) => {
      if (isEditMode && isDragging.current && editDragTarget.current) {
        isDragging.current = false;
        editDragTarget.current = null;
        if (saveHistory) saveHistory();
        return;
      }

      isDragging.current = false;
      dragAnchorIdx.current = null;
    },
    [isEditMode, saveHistory],
  );

  const onDoubleClick = useCallback(
    (_e: any) => {
      if (isDrawing) {
        // Remove the extra anchor added by the first click of the dblclick
        if (anchorsRef.current.length > 2) {
          anchorsRef.current.pop();
        }
        finishPath(false);
      }
    },
    [isDrawing, finishPath],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditMode) {
          exitEditMode();
        } else if (isDrawing) {
          cancelDrawing();
        }
      } else if (e.key === 'Enter') {
        if (isDrawing) {
          finishPath(false);
        } else if (isEditMode) {
          exitEditMode();
        }
      }
    },
    [isDrawing, isEditMode, finishPath, exitEditMode, cancelDrawing],
  );

  // ── Keyboard listener ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isDrawing && !isEditMode) return;

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawing, isEditMode, onKeyDown]);

  // ── Public API ─────────────────────────────────────────────────────────

  return {
    /** True while placing anchor points */
    isDrawing,
    /** True while in post-finish edit mode (draggable control points) */
    isEditMode,
    /** Canvas event handlers */
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onDoubleClick,
    /** Programmatically finish the current path */
    finishPath,
    /** Leave edit mode, make path a normal selectable object */
    exitEditMode,
    /** Discard the current drawing */
    cancelDrawing,
  };
};
