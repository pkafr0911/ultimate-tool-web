import { Rect, Circle, Ellipse, Triangle, Line, Polygon, IText } from 'fabric';

export interface ShapeDefaults {
  fill: string;
  stroke: string;
  left?: number;
  top?: number;
}

/**
 * Generate evenly-spaced vertices for a regular polygon inscribed in a circle.
 */
export function regularPolygonPoints(
  sides: number,
  radius: number,
  cx = radius,
  cy = radius,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const step = (Math.PI * 2) / sides;
  const start = -Math.PI / 2; // Point facing up
  for (let i = 0; i < sides; i++) {
    pts.push({
      x: cx + Math.cos(start + step * i) * radius,
      y: cy + Math.sin(start + step * i) * radius,
    });
  }
  return pts;
}

/**
 * Generate vertices for a star with `points` spikes, alternating outer/inner radius.
 */
export function starPoints(
  points: number,
  outerR: number,
  innerR: number,
  cx = outerR,
  cy = outerR,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const step = Math.PI / points;
  const start = -Math.PI / 2;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push({
      x: cx + Math.cos(start + step * i) * r,
      y: cy + Math.sin(start + step * i) * r,
    });
  }
  return pts;
}

export const makeRect = (d: ShapeDefaults) =>
  new Rect({
    left: d.left ?? 100,
    top: d.top ?? 100,
    width: 120,
    height: 90,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: 1,
  });

export const makeCircle = (d: ShapeDefaults) =>
  new Circle({
    left: d.left ?? 100,
    top: d.top ?? 100,
    radius: 50,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: 1,
  });

export const makeEllipse = (d: ShapeDefaults) =>
  new Ellipse({
    left: d.left ?? 100,
    top: d.top ?? 100,
    rx: 70,
    ry: 40,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: 1,
  });

export const makeTriangle = (d: ShapeDefaults) =>
  new Triangle({
    left: d.left ?? 100,
    top: d.top ?? 100,
    width: 100,
    height: 90,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: 1,
  });

export const makeLine = (d: ShapeDefaults) =>
  new Line([100, 150, 260, 150], {
    stroke: d.stroke || '#000000',
    strokeWidth: 2,
  });

export const makePolygon = (sides: number, d: ShapeDefaults) =>
  new Polygon(regularPolygonPoints(sides, 50), {
    left: d.left ?? 100,
    top: d.top ?? 100,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: 1,
  });

export const makeStar = (points: number, d: ShapeDefaults) =>
  new Polygon(starPoints(points, 55, 25), {
    left: d.left ?? 100,
    top: d.top ?? 100,
    fill: d.fill,
    stroke: d.stroke,
    strokeWidth: 1,
  });

export const makeText = (d: ShapeDefaults) =>
  new IText('Type here', {
    left: d.left ?? 100,
    top: d.top ?? 100,
    fontFamily: 'Arial',
    fill: d.fill || '#1f1f1f',
    fontSize: 32,
  });
