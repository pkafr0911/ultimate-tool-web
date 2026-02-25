import { useEffect, useRef } from 'react';
import { Canvas, FabricObject } from 'fabric';

// ─── Config ──────────────────────────────────────────────────────────────────
const SNAP_THRESHOLD = 8;
const SNAP_RELEASE = 14; // must drag this far from a snapped line to break free (hysteresis)
const GUIDE_COLOR = '#ff00ff';
const GUIDE_DASH = [4, 4];
const GUIDE_WIDTH = 0.8;
const GAP_MARKER_SIZE = 6; // size of the equal-spacing arrow markers
const DISTANCE_FONT = '10px sans-serif';
const DISTANCE_BG = 'rgba(255, 0, 255, 0.8)';
const DISTANCE_TEXT_COLOR = '#ff00ff';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
}

interface GuideLine {
  orientation: 'horizontal' | 'vertical';
  position: number; // canvas coordinate of the line
  from: number; // start of line span (cross-axis)
  to: number; // end of line span (cross-axis)
}

interface GapMarker {
  orientation: 'horizontal' | 'vertical';
  from: number; // start of gap
  to: number; // end of gap
  crossPos: number; // position on cross-axis to draw
}

interface SnapResult {
  dx: number;
  dy: number;
  guides: GuideLine[];
  gaps: GapMarker[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getRect = (obj: FabricObject): Rect => {
  const b = obj.getBoundingRect();
  return {
    left: b.left,
    top: b.top,
    width: b.width,
    height: b.height,
    right: b.left + b.width,
    bottom: b.top + b.height,
    cx: b.left + b.width / 2,
    cy: b.top + b.height / 2,
  };
};

const PAD = 10; // extra extension past aligned objects

/**
 * Build a guide line that spans between the moving rect and the target value,
 * with a small extension for visibility.
 */
const makeGuide = (
  orientation: 'horizontal' | 'vertical',
  pos: number,
  movingRect: Rect,
  targetRect: Rect | null, // null means canvas-level target
  canvasWidth: number,
  canvasHeight: number,
): GuideLine => {
  if (orientation === 'vertical') {
    // Vertical line: span Y between the two objects (or full height for canvas target)
    if (!targetRect) {
      return { orientation, position: pos, from: 0, to: canvasHeight };
    }
    const minY = Math.min(movingRect.top, targetRect.top) - PAD;
    const maxY = Math.max(movingRect.bottom, targetRect.bottom) + PAD;
    return { orientation, position: pos, from: Math.max(0, minY), to: maxY };
  } else {
    if (!targetRect) {
      return { orientation, position: pos, from: 0, to: canvasWidth };
    }
    const minX = Math.min(movingRect.left, targetRect.left) - PAD;
    const maxX = Math.max(movingRect.right, targetRect.right) + PAD;
    return { orientation, position: pos, from: Math.max(0, minX), to: maxX };
  }
};

// ─── Equal spacing detection ─────────────────────────────────────────────────

const computeEqualSpacingX = (
  movingRect: Rect,
  others: Rect[],
): { dy: number; gaps: GapMarker[] } => {
  // No equal-spacing if fewer than 2 others
  if (others.length < 2) return { dy: 0, gaps: [] };

  // Sort other objects by cy (vertical center)
  const sorted = [...others].sort((a, b) => a.cy - b.cy);

  // Try to find a slot between two consecutive objects where the spacing matches
  for (let i = 0; i < sorted.length - 1; i++) {
    const above = sorted[i];
    const below = sorted[i + 1];
    const gapBetween = below.top - above.bottom;
    if (gapBetween < 2) continue; // objects overlapping or touching

    // Where would the moving object need to be to create equal gaps?
    // Gap above moving = moving.top - above.bottom
    // Gap below moving = below.top - moving.bottom
    // Equal: moving.top - above.bottom = below.top - moving.bottom
    // => moving.top + moving.bottom = above.bottom + below.top
    // => moving.cy = (above.bottom + below.top) / 2
    const targetCy = (above.bottom + below.top) / 2;
    const dy = targetCy - movingRect.cy;

    if (Math.abs(dy) < SNAP_THRESHOLD) {
      const snappedTop = movingRect.top + dy;
      const snappedBottom = movingRect.bottom + dy;
      const gap1 = snappedTop - above.bottom;
      const gap2 = below.top - snappedBottom;

      if (Math.abs(gap1 - gap2) < 1) {
        const crossPos = movingRect.cx;
        return {
          dy,
          gaps: [
            {
              orientation: 'vertical',
              from: above.bottom,
              to: snappedTop,
              crossPos,
            },
            {
              orientation: 'vertical',
              from: snappedBottom,
              to: below.top,
              crossPos,
            },
          ],
        };
      }
    }
  }

  // Also check: equal spacing when placed before first or after last
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gap = b.top - a.bottom;
    if (gap < 2) continue;

    // Place above the first
    if (i === 0) {
      const targetBottom = a.top - gap;
      const targetTop = targetBottom - movingRect.height;
      const dy2 = targetTop - movingRect.top;
      if (Math.abs(dy2) < SNAP_THRESHOLD) {
        return {
          dy: dy2,
          gaps: [
            {
              orientation: 'vertical',
              from: targetTop + movingRect.height,
              to: a.top,
              crossPos: movingRect.cx,
            },
            { orientation: 'vertical', from: a.bottom, to: b.top, crossPos: movingRect.cx },
          ],
        };
      }
    }

    // Place below the last
    if (i === sorted.length - 2) {
      const targetTop = b.bottom + gap;
      const dy2 = targetTop - movingRect.top;
      if (Math.abs(dy2) < SNAP_THRESHOLD) {
        return {
          dy: dy2,
          gaps: [
            { orientation: 'vertical', from: a.bottom, to: b.top, crossPos: movingRect.cx },
            {
              orientation: 'vertical',
              from: b.bottom,
              to: targetTop,
              crossPos: movingRect.cx,
            },
          ],
        };
      }
    }
  }

  return { dy: 0, gaps: [] };
};

const computeEqualSpacingY = (
  movingRect: Rect,
  others: Rect[],
): { dx: number; gaps: GapMarker[] } => {
  if (others.length < 2) return { dx: 0, gaps: [] };

  const sorted = [...others].sort((a, b) => a.cx - b.cx);

  for (let i = 0; i < sorted.length - 1; i++) {
    const leftObj = sorted[i];
    const rightObj = sorted[i + 1];
    const gapBetween = rightObj.left - leftObj.right;
    if (gapBetween < 2) continue;

    const targetCx = (leftObj.right + rightObj.left) / 2;
    const dx = targetCx - movingRect.cx;

    if (Math.abs(dx) < SNAP_THRESHOLD) {
      const snappedLeft = movingRect.left + dx;
      const snappedRight = movingRect.right + dx;
      const gap1 = snappedLeft - leftObj.right;
      const gap2 = rightObj.left - snappedRight;

      if (Math.abs(gap1 - gap2) < 1) {
        const crossPos = movingRect.cy;
        return {
          dx,
          gaps: [
            { orientation: 'horizontal', from: leftObj.right, to: snappedLeft, crossPos },
            { orientation: 'horizontal', from: snappedRight, to: rightObj.left, crossPos },
          ],
        };
      }
    }
  }

  // Before first / after last
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gap = b.left - a.right;
    if (gap < 2) continue;

    if (i === 0) {
      const targetRight = a.left - gap;
      const targetLeft = targetRight - movingRect.width;
      const dx2 = targetLeft - movingRect.left;
      if (Math.abs(dx2) < SNAP_THRESHOLD) {
        return {
          dx: dx2,
          gaps: [
            {
              orientation: 'horizontal',
              from: targetLeft + movingRect.width,
              to: a.left,
              crossPos: movingRect.cy,
            },
            { orientation: 'horizontal', from: a.right, to: b.left, crossPos: movingRect.cy },
          ],
        };
      }
    }

    if (i === sorted.length - 2) {
      const targetLeft = b.right + gap;
      const dx2 = targetLeft - movingRect.left;
      if (Math.abs(dx2) < SNAP_THRESHOLD) {
        return {
          dx: dx2,
          gaps: [
            { orientation: 'horizontal', from: a.right, to: b.left, crossPos: movingRect.cy },
            {
              orientation: 'horizontal',
              from: b.right,
              to: targetLeft,
              crossPos: movingRect.cy,
            },
          ],
        };
      }
    }
  }

  return { dx: 0, gaps: [] };
};

// ─── Core snap computation ───────────────────────────────────────────────────

const computeSnap = (
  movingObj: FabricObject,
  allObjects: FabricObject[],
  canvasWidth: number,
  canvasHeight: number,
): SnapResult => {
  const movingRect = getRect(movingObj);

  // Collect targets from other visible objects
  type Target = { x: number; rect: Rect | null };
  type TargetY = { y: number; rect: Rect | null };
  const targetXs: Target[] = [];
  const targetYs: TargetY[] = [];
  const otherRects: Rect[] = [];

  for (const obj of allObjects) {
    if (obj === movingObj || !obj.visible) continue;
    const r = getRect(obj);
    otherRects.push(r);
    targetXs.push({ x: r.left, rect: r }, { x: r.cx, rect: r }, { x: r.right, rect: r });
    targetYs.push({ y: r.top, rect: r }, { y: r.cy, rect: r }, { y: r.bottom, rect: r });
  }

  // Canvas edges + center
  targetXs.push(
    { x: 0, rect: null },
    { x: canvasWidth / 2, rect: null },
    { x: canvasWidth, rect: null },
  );
  targetYs.push(
    { y: 0, rect: null },
    { y: canvasHeight / 2, rect: null },
    { y: canvasHeight, rect: null },
  );

  const movingXs = [movingRect.left, movingRect.cx, movingRect.right];
  const movingYs = [movingRect.top, movingRect.cy, movingRect.bottom];

  let bestDx = Infinity;
  let bestDy = Infinity;
  let matchedXTargets: { pos: number; rect: Rect | null }[] = [];
  let matchedYTargets: { pos: number; rect: Rect | null }[] = [];

  // --- X axis ---
  for (const mx of movingXs) {
    for (const t of targetXs) {
      const dist = Math.abs(mx - t.x);
      if (dist < SNAP_THRESHOLD) {
        if (dist < Math.abs(bestDx)) {
          bestDx = t.x - mx;
          matchedXTargets = [{ pos: t.x, rect: t.rect }];
        } else if (Math.abs(dist - Math.abs(bestDx)) < 0.5) {
          matchedXTargets.push({ pos: t.x, rect: t.rect });
        }
      }
    }
  }

  // --- Y axis ---
  for (const my of movingYs) {
    for (const t of targetYs) {
      const dist = Math.abs(my - t.y);
      if (dist < SNAP_THRESHOLD) {
        if (dist < Math.abs(bestDy)) {
          bestDy = t.y - my;
          matchedYTargets = [{ pos: t.y, rect: t.rect }];
        } else if (Math.abs(dist - Math.abs(bestDy)) < 0.5) {
          matchedYTargets.push({ pos: t.y, rect: t.rect });
        }
      }
    }
  }

  // Build guides
  const guides: GuideLine[] = [];

  const adjustedMoving: Rect = {
    ...movingRect,
    left: movingRect.left + (Math.abs(bestDx) < SNAP_THRESHOLD ? bestDx : 0),
    right: movingRect.right + (Math.abs(bestDx) < SNAP_THRESHOLD ? bestDx : 0),
    cx: movingRect.cx + (Math.abs(bestDx) < SNAP_THRESHOLD ? bestDx : 0),
    top: movingRect.top + (Math.abs(bestDy) < SNAP_THRESHOLD ? bestDy : 0),
    bottom: movingRect.bottom + (Math.abs(bestDy) < SNAP_THRESHOLD ? bestDy : 0),
    cy: movingRect.cy + (Math.abs(bestDy) < SNAP_THRESHOLD ? bestDy : 0),
  };

  if (Math.abs(bestDx) < SNAP_THRESHOLD) {
    // Collect all unique guide positions
    const seen = new Set<number>();
    for (const mx of [adjustedMoving.left, adjustedMoving.cx, adjustedMoving.right]) {
      for (const t of matchedXTargets) {
        if (Math.abs(mx - t.pos) < 0.5 && !seen.has(Math.round(t.pos * 10))) {
          seen.add(Math.round(t.pos * 10));
          guides.push(
            makeGuide('vertical', t.pos, adjustedMoving, t.rect, canvasWidth, canvasHeight),
          );
        }
      }
    }
  } else {
    bestDx = 0;
  }

  if (Math.abs(bestDy) < SNAP_THRESHOLD) {
    const seen = new Set<number>();
    for (const my of [adjustedMoving.top, adjustedMoving.cy, adjustedMoving.bottom]) {
      for (const t of matchedYTargets) {
        if (Math.abs(my - t.pos) < 0.5 && !seen.has(Math.round(t.pos * 10))) {
          seen.add(Math.round(t.pos * 10));
          guides.push(
            makeGuide('horizontal', t.pos, adjustedMoving, t.rect, canvasWidth, canvasHeight),
          );
        }
      }
    }
  } else {
    bestDy = 0;
  }

  // --- Equal spacing ---
  let gaps: GapMarker[] = [];

  if (bestDy === 0) {
    // Pass adjusted cx (alignment snap may have shifted X already)
    const adjRect: Rect = {
      ...movingRect,
      left: movingRect.left + bestDx,
      right: movingRect.right + bestDx,
      cx: movingRect.cx + bestDx,
    };
    const eqY = computeEqualSpacingX(adjRect, otherRects);
    if (eqY.dy !== 0) {
      bestDy = eqY.dy;
      gaps = [...gaps, ...eqY.gaps];
    }
  }

  if (bestDx === 0) {
    // Pass adjusted cy (alignment/equal-spacing snap may have shifted Y already)
    const adjRect: Rect = {
      ...movingRect,
      top: movingRect.top + bestDy,
      bottom: movingRect.bottom + bestDy,
      cy: movingRect.cy + bestDy,
    };
    const eqX = computeEqualSpacingY(adjRect, otherRects);
    if (eqX.dx !== 0) {
      bestDx = eqX.dx;
      gaps = [...gaps, ...eqX.gaps];
    }
  }

  return { dx: bestDx, dy: bestDy, guides, gaps };
};

// ─── Drawing ─────────────────────────────────────────────────────────────────

const drawGuides = (
  ctx: CanvasRenderingContext2D,
  guides: GuideLine[],
  gaps: GapMarker[],
  vpt: number[],
) => {
  ctx.save();
  ctx.strokeStyle = GUIDE_COLOR;
  ctx.lineWidth = GUIDE_WIDTH;
  ctx.setLineDash(GUIDE_DASH);

  // --- Guide lines (span between objects) ---
  for (const g of guides) {
    ctx.beginPath();
    if (g.orientation === 'vertical') {
      const sx = g.position * vpt[0] + vpt[4];
      const sy1 = g.from * vpt[3] + vpt[5];
      const sy2 = g.to * vpt[3] + vpt[5];
      ctx.moveTo(sx, sy1);
      ctx.lineTo(sx, sy2);
    } else {
      const sy = g.position * vpt[3] + vpt[5];
      const sx1 = g.from * vpt[0] + vpt[4];
      const sx2 = g.to * vpt[0] + vpt[4];
      ctx.moveTo(sx1, sy);
      ctx.lineTo(sx2, sy);
    }
    ctx.stroke();
  }

  // --- Equal spacing gap markers ---
  for (const gap of gaps) {
    const gapSize = gap.to - gap.from;
    if (gapSize < 2) continue;

    if (gap.orientation === 'vertical') {
      // Vertical gap: draw a vertical line with arrows at top/bottom
      const sx = gap.crossPos * vpt[0] + vpt[4];
      const sy1 = gap.from * vpt[3] + vpt[5];
      const sy2 = gap.to * vpt[3] + vpt[5];
      const mid = (sy1 + sy2) / 2;

      // Dashed center line
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(sx, sy1);
      ctx.lineTo(sx, sy2);
      ctx.stroke();
      ctx.restore();

      // Top/bottom arrows
      ctx.fillStyle = GUIDE_COLOR;
      drawArrow(ctx, sx, sy1, 'down', GAP_MARKER_SIZE);
      drawArrow(ctx, sx, sy2, 'up', GAP_MARKER_SIZE);

      // Distance label
      const dist = Math.round(gapSize);
      drawDistanceLabel(ctx, sx, mid, `${dist}`);
    } else {
      // Horizontal gap
      const sy = gap.crossPos * vpt[3] + vpt[5];
      const sx1 = gap.from * vpt[0] + vpt[4];
      const sx2 = gap.to * vpt[0] + vpt[4];
      const mid = (sx1 + sx2) / 2;

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(sx1, sy);
      ctx.lineTo(sx2, sy);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = GUIDE_COLOR;
      drawArrow(ctx, sx1, sy, 'right', GAP_MARKER_SIZE);
      drawArrow(ctx, sx2, sy, 'left', GAP_MARKER_SIZE);

      const dist = Math.round(gapSize);
      drawDistanceLabel(ctx, mid, sy, `${dist}`);
    }
  }

  ctx.restore();
};

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: 'up' | 'down' | 'left' | 'right',
  size: number,
) => {
  ctx.beginPath();
  const s = size / 2;
  switch (dir) {
    case 'up':
      ctx.moveTo(x, y);
      ctx.lineTo(x - s, y + size);
      ctx.lineTo(x + s, y + size);
      break;
    case 'down':
      ctx.moveTo(x, y);
      ctx.lineTo(x - s, y - size);
      ctx.lineTo(x + s, y - size);
      break;
    case 'left':
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y - s);
      ctx.lineTo(x + size, y + s);
      break;
    case 'right':
      ctx.moveTo(x, y);
      ctx.lineTo(x - size, y - s);
      ctx.lineTo(x - size, y + s);
      break;
  }
  ctx.closePath();
  ctx.fill();
};

const drawDistanceLabel = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
  ctx.save();
  ctx.font = DISTANCE_FONT;
  const m = ctx.measureText(text);
  const pw = 4;
  const ph = 2;
  const bw = m.width + pw * 2;
  const bh = 14 + ph * 2;

  ctx.fillStyle = DISTANCE_BG;
  const rx = x - bw / 2;
  const ry = y - bh / 2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, bw, bh, 3);
  ctx.fill();

  ctx.fillStyle = DISTANCE_TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Canva-style smart snapping guides for a Fabric.js canvas.
 *
 * - Snaps to edges / center of other layers, canvas edges, and canvas center.
 * - Guide lines span between aligned objects (not full canvas).
 * - Equal-spacing detection with gap arrows + distance labels.
 * - Guides disappear when the drag ends.
 */
export const useSnappingGuides = (canvas: Canvas | null) => {
  const activeGuidesRef = useRef<GuideLine[]>([]);
  const activeGapsRef = useRef<GapMarker[]>([]);
  // Track the snap offset applied in the previous frame.
  // Photoshop & Canva both separate "where the mouse intends" from "where the object displays".
  // Without this, the snap compounds frame-over-frame causing jitter near guide lines.
  const snapOffsetRef = useRef({ x: 0, y: 0 });
  // Hysteresis: once snapped, we need a larger movement to break free.
  // This prevents shaking from tiny hand tremors while holding the mouse.
  const lockedSnapRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    if (!canvas) return;

    const onObjectMoving = (e: any) => {
      const target: FabricObject | undefined = e.target;
      if (!target) return;

      // 1. Undo previous snap to recover the raw mouse-intended position.
      //    Fabric moves from the snapped position, so we must subtract
      //    the old offset to find where the cursor actually wants the object.
      const rawLeft = (target.left || 0) - snapOffsetRef.current.x;
      const rawTop = (target.top || 0) - snapOffsetRef.current.y;
      target.set({ left: rawLeft, top: rawTop });
      // Must recalculate cached coordinates after changing position,
      // otherwise getBoundingRect() returns stale data and equal-spacing detection fails.
      target.setCoords();

      // 2. Compute snap from the raw position (just like Photoshop/Canva).
      const allObjects = canvas.getObjects();
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const { dx, dy, guides, gaps } = computeSnap(target, allObjects, canvasWidth, canvasHeight);

      // 3. Hysteresis — once locked to a snap line, stay locked until the
      //    raw position moves beyond SNAP_RELEASE. This prevents shaking
      //    from tiny hand tremors while the mouse is held down.
      const locked = lockedSnapRef.current;
      let finalDx = dx;
      let finalDy = dy;

      // X axis hysteresis
      if (locked.x !== null) {
        // Currently locked on X — check if we should stay locked
        const movingRect = getRect(target);
        const distFromLock = Math.min(
          Math.abs(movingRect.left - locked.x),
          Math.abs(movingRect.cx - locked.x),
          Math.abs(movingRect.right - locked.x),
        );
        if (distFromLock < SNAP_RELEASE) {
          // Stay locked: snap to the locked line
          const bestEdgeDist = [movingRect.left, movingRect.cx, movingRect.right]
            .map((v) => ({ v, d: Math.abs(v - locked.x!) }))
            .sort((a, b) => a.d - b.d)[0];
          finalDx = locked.x - bestEdgeDist.v;
        } else {
          // Break free
          locked.x = null;
          finalDx = 0;
        }
      } else if (finalDx !== 0) {
        // New snap — lock to it. Find which target line we snapped to.
        const movingRect = getRect(target);
        const snappedEdge = [
          movingRect.left + finalDx,
          movingRect.cx + finalDx,
          movingRect.right + finalDx,
        ];
        // The snap target is the value that one of our edges aligns to
        // Pick the position from guides if available, otherwise compute
        const xGuide = guides.find((g) => g.orientation === 'vertical');
        locked.x = xGuide ? xGuide.position : snappedEdge[0];
      }

      // Y axis hysteresis
      if (locked.y !== null) {
        const movingRect = getRect(target);
        const distFromLock = Math.min(
          Math.abs(movingRect.top - locked.y),
          Math.abs(movingRect.cy - locked.y),
          Math.abs(movingRect.bottom - locked.y),
        );
        if (distFromLock < SNAP_RELEASE) {
          const bestEdgeDist = [movingRect.top, movingRect.cy, movingRect.bottom]
            .map((v) => ({ v, d: Math.abs(v - locked.y!) }))
            .sort((a, b) => a.d - b.d)[0];
          finalDy = locked.y - bestEdgeDist.v;
        } else {
          locked.y = null;
          finalDy = 0;
        }
      } else if (finalDy !== 0) {
        const movingRect = getRect(target);
        const snappedEdge = [
          movingRect.top + finalDy,
          movingRect.cy + finalDy,
          movingRect.bottom + finalDy,
        ];
        const yGuide = guides.find((g) => g.orientation === 'horizontal');
        locked.y = yGuide ? yGuide.position : snappedEdge[0];
      }

      // 4. Apply final snap offset for display.
      target.set({ left: rawLeft + finalDx, top: rawTop + finalDy });

      // 5. Remember offset so we can undo it next frame.
      snapOffsetRef.current = { x: finalDx, y: finalDy };

      activeGuidesRef.current = guides;
      activeGapsRef.current = gaps;
      canvas.requestRenderAll();
    };

    const clearGuides = () => {
      // Reset snap offset and locked lines when drag ends.
      snapOffsetRef.current = { x: 0, y: 0 };
      lockedSnapRef.current = { x: null, y: null };
      if (activeGuidesRef.current.length > 0 || activeGapsRef.current.length > 0) {
        activeGuidesRef.current = [];
        activeGapsRef.current = [];
        canvas.requestRenderAll();
      }
    };

    const afterRender = (e: any) => {
      const guides = activeGuidesRef.current;
      const gaps = activeGapsRef.current;
      if (guides.length === 0 && gaps.length === 0) return;

      const ctx: CanvasRenderingContext2D = e.ctx || canvas.getContext();
      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

      drawGuides(ctx, guides, gaps, vpt);
    };

    canvas.on('object:moving', onObjectMoving);
    canvas.on('object:modified', clearGuides);
    canvas.on('mouse:up', clearGuides);
    canvas.on('after:render', afterRender);

    return () => {
      canvas.off('object:moving', onObjectMoving);
      canvas.off('object:modified', clearGuides);
      canvas.off('mouse:up', clearGuides);
      canvas.off('after:render', afterRender);
    };
  }, [canvas]);
};

export default useSnappingGuides;
