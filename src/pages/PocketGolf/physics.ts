import { gateAt, Hole, Point, Rect } from './course';
export const BALL_RADIUS = 0.19;
export const MAX_SPEED = 12;
export const STEP = 1 / 120;
export type Ball = Point & { vx: number; vz: number };
export type StepResult = 'rolling' | 'rest' | 'water' | 'cup';
export const createBall = (point: Point): Ball => ({ ...point, vx: 0, vz: 0 });
export function contains(point: Point, rect: Rect, padding = 0) {
  return (
    Math.abs(point.x - rect.x) < rect.w / 2 + padding &&
    Math.abs(point.z - rect.z) < rect.d / 2 + padding
  );
}
export function walls(hole: Hole): Rect[] {
  return [
    { x: -hole.width / 2 - 0.2, z: 0, w: 0.4, d: hole.depth + 0.8 },
    { x: hole.width / 2 + 0.2, z: 0, w: 0.4, d: hole.depth + 0.8 },
    { x: 0, z: -hole.depth / 2 - 0.2, w: hole.width, d: 0.4 },
    { x: 0, z: hole.depth / 2 + 0.2, w: hole.width, d: 0.4 },
    ...hole.blocks,
  ];
}
// Swept point versus radius-expanded box. Resolve the earliest time of impact,
// rather than testing only the end position (which can tunnel through a wall).
export function sweep(ball: Point, dx: number, dz: number, rect: Rect) {
  const minX = rect.x - rect.w / 2 - BALL_RADIUS;
  const maxX = rect.x + rect.w / 2 + BALL_RADIUS;
  const minZ = rect.z - rect.d / 2 - BALL_RADIUS;
  const maxZ = rect.z + rect.d / 2 + BALL_RADIUS;
  let entry = -Infinity;
  let leave = Infinity;
  let nx = 0;
  let nz = 0;
  for (const [p, d, min, max, axis] of [
    [ball.x, dx, minX, maxX, 0],
    [ball.z, dz, minZ, maxZ, 1],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < min || p > max) return null;
      continue;
    }
    const a = (min - p) / d;
    const b = (max - p) / d;
    const near = Math.min(a, b);
    if (near > entry) {
      entry = near;
      nx = axis === 0 ? -Math.sign(d) : 0;
      nz = axis === 1 ? -Math.sign(d) : 0;
    }
    leave = Math.min(leave, Math.max(a, b));
  }
  return entry >= 0 && entry <= 1 && entry <= leave ? { t: entry, nx, nz } : null;
}
export function stepBall(ball: Ball, hole: Hole, time: number, dt = STEP): StepResult {
  const gate = gateAt(hole, time);
  const barriers = gate ? [...walls(hole), gate] : walls(hole);
  // A moving gate may overlap a stationary ball between frames; push it to a free face.
  if (gate && contains(ball, gate, BALL_RADIUS)) {
    const left = Math.abs(ball.x - (gate.x - gate.w / 2 - BALL_RADIUS));
    const right = Math.abs(ball.x - (gate.x + gate.w / 2 + BALL_RADIUS));
    const front = Math.abs(ball.z - (gate.z - gate.d / 2 - BALL_RADIUS));
    const back = Math.abs(ball.z - (gate.z + gate.d / 2 + BALL_RADIUS));
    const nearest = Math.min(left, right, front, back);
    if (nearest === left || nearest === right) {
      ball.x = gate.x + (nearest === left ? -1 : 1) * (gate.w / 2 + BALL_RADIUS + 0.001);
      ball.vx = (nearest === left ? -1 : 1) * Math.max(1, Math.abs(ball.vx));
    } else {
      ball.z = gate.z + (nearest === front ? -1 : 1) * (gate.d / 2 + BALL_RADIUS + 0.001);
      ball.vz = (nearest === front ? -1 : 1) * Math.max(1, Math.abs(ball.vz));
    }
  }
  let remaining = dt;
  for (let bounce = 0; bounce < 5 && remaining > 1e-7; bounce++) {
    const dx = ball.vx * remaining;
    const dz = ball.vz * remaining;
    let hit: ReturnType<typeof sweep> = null;
    for (const rect of barriers) {
      const candidate = sweep(ball, dx, dz, rect);
      if (candidate && (!hit || candidate.t < hit.t)) hit = candidate;
    }
    if (!hit) {
      ball.x += dx;
      ball.z += dz;
      break;
    }
    ball.x += dx * hit.t + hit.nx * 0.0001;
    ball.z += dz * hit.t + hit.nz * 0.0001;
    if (hit.nx) ball.vx *= -0.76;
    if (hit.nz) ball.vz *= -0.76;
    remaining *= 1 - hit.t;
  }
  if (hole.water.some((rect) => contains(ball, rect))) return 'water';
  const speed = Math.hypot(ball.vx, ball.vz);
  if (Math.hypot(ball.x - hole.cup.x, ball.z - hole.cup.z) < 0.32 && speed < 3.2) {
    ball.x = hole.cup.x;
    ball.z = hole.cup.z;
    ball.vx = 0;
    ball.vz = 0;
    return 'cup';
  }
  const nextSpeed = Math.max(0, speed - (0.65 + speed * 0.22) * dt);
  if (nextSpeed < 0.08) {
    ball.vx = 0;
    ball.vz = 0;
    return 'rest';
  }
  ball.vx *= nextSpeed / speed;
  ball.vz *= nextSpeed / speed;
  return 'rolling';
}
export function aimPath(
  ball: Point,
  hole: Hole,
  angle: number,
  power: number,
  time: number,
): Point[] {
  const length = 1 + power * 4;
  const dx = Math.cos(angle) * length;
  const dz = Math.sin(angle) * length;
  const gate = gateAt(hole, time);
  let fraction = 1;
  for (const rect of [...walls(hole), ...(gate ? [gate] : [])]) {
    const hit = sweep(ball, dx, dz, rect);
    if (hit) fraction = Math.min(fraction, hit.t);
  }
  return Array.from({ length: 17 }, (_, i) => ({
    x: ball.x + (dx * fraction * i) / 16,
    z: ball.z + (dz * fraction * i) / 16,
  }));
}
