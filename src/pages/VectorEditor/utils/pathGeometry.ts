import { Point, FabricObject } from 'fabric';

export interface AnchorPoint {
  x: number;
  y: number;
  type: 'corner' | 'smooth' | 'symmetric';
  cp1?: { x: number; y: number }; // control point before
  cp2?: { x: number; y: number }; // control point after
  handlesBroken?: boolean; // true if cp1/cp2 are independent
}

/**
 * Convert Fabric path commands to anchor points with Bezier handles
 */
export function pathToAnchors(pathData: any[]): AnchorPoint[] {
  if (!pathData || pathData.length === 0) return [];

  const anchors: AnchorPoint[] = [];
  let currentPoint = { x: 0, y: 0 };

  pathData.forEach((cmd) => {
    const type = cmd[0];

    switch (type) {
      case 'M': // Move to
        currentPoint = { x: cmd[1], y: cmd[2] };
        anchors.push({ x: cmd[1], y: cmd[2], type: 'corner' });
        break;

      case 'L': // Line to
        anchors.push({ x: cmd[1], y: cmd[2], type: 'corner' });
        currentPoint = { x: cmd[1], y: cmd[2] };
        break;

      case 'C': // Cubic Bezier
        const lastAnchor = anchors[anchors.length - 1];
        if (lastAnchor) {
          lastAnchor.cp2 = { x: cmd[1], y: cmd[2] };
          lastAnchor.type = 'smooth';
        }
        anchors.push({
          x: cmd[5],
          y: cmd[6],
          type: 'smooth',
          cp1: { x: cmd[3], y: cmd[4] },
        });
        currentPoint = { x: cmd[5], y: cmd[6] };
        break;

      case 'Q': // Quadratic Bezier - convert to cubic
        const cp1 = {
          x: currentPoint.x + (2 / 3) * (cmd[1] - currentPoint.x),
          y: currentPoint.y + (2 / 3) * (cmd[2] - currentPoint.y),
        };
        const cp2 = {
          x: cmd[3] + (2 / 3) * (cmd[1] - cmd[3]),
          y: cmd[4] + (2 / 3) * (cmd[2] - cmd[4]),
        };
        const lastAnchor2 = anchors[anchors.length - 1];
        if (lastAnchor2) {
          lastAnchor2.cp2 = cp1;
          lastAnchor2.type = 'smooth';
        }
        anchors.push({
          x: cmd[3],
          y: cmd[4],
          type: 'smooth',
          cp1: cp2,
        });
        currentPoint = { x: cmd[3], y: cmd[4] };
        break;

      case 'Z': // Close path
        break;
    }
  });

  return anchors;
}

/**
 * Convert anchor points to Fabric path commands
 */
export function anchorsToPath(anchors: AnchorPoint[]): any[] {
  if (anchors.length === 0) return [];

  const path: any[] = [];

  // Move to first point
  path.push(['M', anchors[0].x, anchors[0].y]);

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];

    if (prev.cp2 || curr.cp1) {
      // Cubic Bezier curve
      const cp1 = prev.cp2 || { x: prev.x, y: prev.y };
      const cp2 = curr.cp1 || { x: curr.x, y: curr.y };
      path.push(['C', cp1.x, cp1.y, cp2.x, cp2.y, curr.x, curr.y]);
    } else {
      // Straight line
      path.push(['L', curr.x, curr.y]);
    }
  }

  return path;
}

/**
 * Update Fabric object from anchors
 */
export function updateObjectFromAnchors(object: any, anchors: AnchorPoint[]): void {
  console.log(
    'updateObjectFromAnchors called with',
    anchors.length,
    'anchors for object type:',
    object.type,
  );
  // Store anchors in object metadata
  object.set('pointMeta', anchors);

  if (object.type === 'path') {
    const path = anchorsToPath(anchors);
    object.set('path', path);
    object.setCoords();
  } else if (object.type === 'polyline' || object.type === 'polygon') {
    object.set(
      'points',
      anchors.map((a) => ({ x: a.x, y: a.y })),
    );
    object.setCoords();
  }
}

/**
 * Find closest segment for point insertion
 */
export function findInsertionIndex(
  anchors: AnchorPoint[],
  point: { x: number; y: number },
): number {
  if (anchors.length < 2) return anchors.length;

  let minDist = Infinity;
  let bestIndex = 1;

  for (let i = 0; i < anchors.length - 1; i++) {
    const dist = distanceToSegment(point, anchors[i], anchors[i + 1]);
    if (dist < minDist) {
      minDist = dist;
      bestIndex = i + 1;
    }
  }

  return bestIndex;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len2 = dx * dx + dy * dy;

  if (len2 === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  const projX = start.x + t * dx;
  const projY = start.y + t * dy;

  return Math.hypot(point.x - projX, point.y - projY);
}

/**
 * Create bounding anchors for basic shapes (Rect, Circle, etc.)
 */
export function createBoundingAnchors(object: FabricObject): AnchorPoint[] {
  const type = object.type;

  if (type === 'rect') {
    const rect = object as any;
    const w = rect.width || 0;
    const h = rect.height || 0;
    return [
      { x: 0, y: 0, type: 'corner' },
      { x: w, y: 0, type: 'corner' },
      { x: w, y: h, type: 'corner' },
      { x: 0, y: h, type: 'corner' },
    ];
  }

  if (type === 'circle' || type === 'ellipse') {
    const circle = object as any;
    const r = circle.radius || 0;
    const cx = r;
    const cy = r;
    // Create 4 control points with bezier handles for smooth circle
    const kappa = 0.5522847498; // Magic number for circle approximation
    return [
      {
        x: cx,
        y: 0,
        type: 'smooth',
        cp1: { x: cx + r * kappa, y: 0 },
        cp2: { x: cx + r * kappa, y: 0 },
      },
      {
        x: cx + r,
        y: cy,
        type: 'smooth',
        cp1: { x: cx + r, y: cy - r * kappa },
        cp2: { x: cx + r, y: cy + r * kappa },
      },
      {
        x: cx,
        y: cy + r,
        type: 'smooth',
        cp1: { x: cx + r * kappa, y: cy + r },
        cp2: { x: cx - r * kappa, y: cy + r },
      },
      {
        x: 0,
        y: cy,
        type: 'smooth',
        cp1: { x: 0, y: cy + r * kappa },
        cp2: { x: 0, y: cy - r * kappa },
      },
    ];
  }

  // Default: return empty
  return [];
}

/**
 * Transform point using matrix (for coordinate conversion)
 */
export function transformPoint(
  point: { x: number; y: number },
  matrix: number[],
): { x: number; y: number } {
  return {
    x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
    y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
  };
}

/**
 * Calculate symmetric control point
 */
export function calculateSymmetricCP(
  anchor: { x: number; y: number },
  cp: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: 2 * anchor.x - cp.x,
    y: 2 * anchor.y - cp.y,
  };
}
