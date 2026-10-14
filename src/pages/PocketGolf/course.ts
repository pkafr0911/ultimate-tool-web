export type Point = { x: number; z: number };
export type Rect = { x: number; z: number; w: number; d: number };
export type Hole = {
  name: string;
  par: number;
  hint: string;
  width: number;
  depth: number;
  tee: Point;
  cup: Point;
  blocks: Rect[];
  water: Rect[];
  gate?: Rect;
};
export const holes: Hole[] = [
  {
    name: 'First Putt',
    par: 2,
    hint: 'A gentle start. Pull back from the ball and release.',
    width: 8,
    depth: 12,
    tee: { x: -1.5, z: 4 },
    cup: { x: 1, z: -4 },
    blocks: [],
    water: [],
  },
  {
    name: 'Around the Corner',
    par: 3,
    hint: 'Find the corner. A bank off the border can help.',
    width: 9,
    depth: 12,
    tee: { x: -2.8, z: 4 },
    cup: { x: 2.7, z: -4 },
    blocks: [{ x: 1.7, z: 1.5, w: 5.6, d: 9 }],
    water: [],
  },
  {
    name: 'Split Decision',
    par: 3,
    hint: 'Take the roomy left route or thread the narrow right side.',
    width: 10,
    depth: 12,
    tee: { x: 0, z: 4.4 },
    cup: { x: 1, z: -4.4 },
    blocks: [{ x: 1, z: 0, w: 4.8, d: 3 }],
    water: [],
  },
  {
    name: 'Pond Crossing',
    par: 3,
    hint: 'Line up with the bridge. Water adds one penalty stroke.',
    width: 9,
    depth: 13,
    tee: { x: -2, z: 4.7 },
    cup: { x: 2, z: -4.7 },
    blocks: [],
    water: [
      { x: -2.9, z: 0, w: 3.2, d: 3.4 },
      { x: 2.9, z: 0, w: 3.2, d: 3.4 },
    ],
  },
  {
    name: 'Garden Gate',
    par: 4,
    hint: 'Time the sliding gate, or take the open route on the left.',
    width: 10,
    depth: 13,
    tee: { x: 1.5, z: 4.6 },
    cup: { x: 1.5, z: -4.6 },
    blocks: [{ x: 3.7, z: 0, w: 2.6, d: 0.6 }],
    water: [],
    gate: { x: 0, z: 0, w: 2.4, d: 0.5 },
  },
  {
    name: 'The Courtyard',
    par: 4,
    hint: 'Plot a path around the pond. Use the stone walls to bank.',
    width: 11,
    depth: 14,
    tee: { x: -3.5, z: 5.2 },
    cup: { x: 3.5, z: -5.2 },
    blocks: [
      { x: -3.9, z: -3.4, w: 3.2, d: 0.6 },
      { x: 3.9, z: 3.4, w: 3.2, d: 0.6 },
    ],
    water: [{ x: 0, z: 0, w: 4.6, d: 4.6 }],
  },
];
export const coursePar = holes.reduce((sum, hole) => sum + hole.par, 0);
export const gateAt = (hole: Hole, time: number): Rect | undefined =>
  hole.gate && { ...hole.gate, x: Math.sin(time * 0.85) * 1.6 };
