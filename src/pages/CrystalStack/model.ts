export const SIZE = 5,
  HEIGHT = 12;
export type Cell = { x: number; y: number; z: number };
export type Axis = 'x' | 'y' | 'z';
export type Piece = { id: number; cells: Cell[]; position: Cell };
export const shapes = [
  {
    name: 'Line',
    color: '#72d5e4',
    cells: [
      [-1, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
    ],
  },
  {
    name: 'Corner',
    color: '#efb27c',
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  },
  {
    name: 'Square',
    color: '#e2cd7e',
    cells: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
    ],
  },
  {
    name: 'Tee',
    color: '#bb9ce9',
    cells: [
      [-1, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  },
  {
    name: 'Zigzag',
    color: '#8ac9a5',
    cells: [
      [-1, 0, 0],
      [0, 0, 0],
      [0, 0, 1],
      [1, 0, 1],
    ],
  },
];
export const index = (x: number, y: number, z: number) => y * SIZE * SIZE + z * SIZE + x;
export const worldCells = (piece: Piece) =>
  piece.cells.map((c) => ({
    x: c.x + piece.position.x,
    y: c.y + piece.position.y,
    z: c.z + piece.position.z,
  }));
export function fits(board: number[], piece: Piece) {
  return worldCells(piece).every(
    (c) =>
      c.x >= 0 &&
      c.x < SIZE &&
      c.z >= 0 &&
      c.z < SIZE &&
      c.y >= 0 &&
      c.y < HEIGHT &&
      !board[index(c.x, c.y, c.z)],
  );
}
export function rotated(cells: Cell[], axis: Axis, direction: number): Cell[] {
  return cells.map(({ x, y, z }) =>
    axis === 'x'
      ? { x, y: -direction * z, z: direction * y }
      : axis === 'y'
        ? { x: direction * z, y, z: -direction * x }
        : { x: -direction * y, y: direction * x, z },
  );
}
export function landing(board: number[], piece: Piece): Piece {
  let result = { ...piece, position: { ...piece.position } };
  while (fits(board, { ...result, position: { ...result.position, y: result.position.y - 1 } }))
    result.position.y--;
  return result;
}
export function clearLayers(board: number[]) {
  const kept: number[][] = [],
    cleared: number[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    const layer = board.slice(y * 25, (y + 1) * 25);
    if (layer.every(Boolean)) cleared.push(y);
    else kept.push(layer);
  }
  while (kept.length < HEIGHT) kept.push(Array(25).fill(0));
  return { board: kept.flat(), cleared };
}
export function viewMove(dx: number, dz: number, view: number) {
  let x = dx,
    z = dz;
  for (let i = 0; i < ((view % 4) + 4) % 4; i++) [x, z] = [z, -x];
  return { x, z };
}
export class StackGame {
  board: number[] = Array(SIZE * SIZE * HEIGHT).fill(0);
  phase: 'menu' | 'playing' | 'clearing' | 'over' = 'menu';
  mode: 'practice' | 'endless' = 'practice';
  active: Piece | null = null;
  queue: number[] = [];
  bag: number[] = [];
  held: number | null = null;
  holdUsed = false;
  score = 0;
  layers = 0;
  best = 0;
  paused = false;
  view = 0;
  cameraYaw = Math.PI / 4;
  cameraPitch = Math.atan2(13, 16);
  soft = false;
  fallTime = 0;
  lockTime = 0;
  resets = 0;
  clearTime = 0;
  cleared: number[] = [];
  rejection = 0;
  revision = 0;
  learned = { move: false, rotate: false, drop: false };
  onChange = () => {};
  constructor(public random = Math.random) {
    try {
      const n = Number(localStorage.getItem('crystal-stack.best.v1'));
      if (Number.isSafeInteger(n) && n > 0) this.best = n;
    } catch {
      /* Optional storage. */
    }
  }
  get level() {
    return 1 + Math.floor(this.layers / 5);
  }
  get interval() {
    return Math.max(0.12, 1.15 * 0.83 ** (this.level - 1));
  }
  notify() {
    this.revision++;
    this.onChange();
  }
  draw() {
    if (!this.bag.length) {
      this.bag = shapes.map((_, i) => i);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
  make(id: number): Piece {
    return {
      id,
      cells: shapes[id].cells.map(([x, y, z]) => ({ x, y, z })),
      position: { x: 2, y: 10, z: 2 },
    };
  }
  spawn(id?: number) {
    const nextId = id ?? this.queue.shift()!;
    if (id === undefined) this.queue.push(this.draw());
    this.active = this.make(nextId);
    this.fallTime = 0;
    this.lockTime = 0;
    this.resets = 0;
    if (!fits(this.board, this.active)) {
      this.active = null;
      this.phase = 'over';
      this.record();
    }
  }
  record() {
    if (this.mode === 'endless' && this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem('crystal-stack.best.v1', String(this.best));
      } catch {
        /* Optional storage. */
      }
    }
  }
  start(mode: 'practice' | 'endless') {
    this.learned = { move: false, rotate: false, drop: false };
    this.mode = mode;
    this.board.fill(0);
    this.score = 0;
    this.layers = 0;
    this.paused = false;
    this.soft = false;
    this.held = null;
    this.holdUsed = false;
    this.bag = [];
    this.queue = [this.draw(), this.draw(), this.draw()];
    this.cleared = [];
    this.rejection = 0;
    this.phase = 'playing';
    this.spawn();
    this.notify();
  }
  get canPlay() {
    return this.phase === 'playing' && !this.paused && !!this.active;
  }
  grounded() {
    return (
      !!this.active &&
      !fits(this.board, {
        ...this.active,
        position: { ...this.active.position, y: this.active.position.y - 1 },
      })
    );
  }
  accept(piece: Piece) {
    const wasGrounded = this.grounded();
    this.active = piece;
    if (wasGrounded && this.resets < 10) {
      this.lockTime = 0;
      this.resets++;
    }
    this.notify();
  }
  move(dx: number, dz: number) {
    if (!this.canPlay) return;
    const delta = viewMove(dx, dz, this.view);
    const a = this.active!;
    const piece = {
      ...a,
      position: { ...a.position, x: a.position.x + delta.x, z: a.position.z + delta.z },
    };
    if (fits(this.board, piece)) {
      this.learned.move = true;
      this.accept(piece);
    } else {
      this.rejection = 0.2;
      this.notify();
    }
  }
  rotate(axis: Axis, direction: number) {
    if (!this.canPlay) return;
    const a = this.active!,
      cells = rotated(a.cells, axis, direction);
    for (const [x, y, z] of [
      [0, 0, 0],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
      [0, 1, 0],
      [0, -1, 0],
    ]) {
      const candidate = {
        ...a,
        cells,
        position: { x: a.position.x + x, y: a.position.y + y, z: a.position.z + z },
      };
      if (fits(this.board, candidate)) {
        this.learned.rotate = true;
        this.accept(candidate);
        return;
      }
    }
    this.rejection = 0.25;
    this.notify();
  }
  lower() {
    if (!this.canPlay) return false;
    const a = this.active!,
      candidate = { ...a, position: { ...a.position, y: a.position.y - 1 } };
    if (!fits(this.board, candidate)) return false;
    this.active = candidate;
    this.notify();
    return true;
  }
  hardDrop() {
    if (!this.canPlay) return;
    this.learned.drop = true;
    const a = this.active!,
      ghost = landing(this.board, a);
    if (this.mode === 'endless') this.score += (a.position.y - ghost.position.y) * 2;
    this.active = ghost;
    this.lock();
  }
  hold() {
    if (!this.canPlay || this.holdUsed) return;
    const current = this.active!.id,
      previous = this.held;
    this.held = current;
    this.holdUsed = true;
    this.spawn(previous ?? undefined);
    this.notify();
  }
  lock() {
    if (!this.active || !fits(this.board, this.active)) return;
    worldCells(this.active).forEach((c) => {
      this.board[index(c.x, c.y, c.z)] = this.active!.id + 1;
    });
    const result = clearLayers(this.board);
    this.board = result.board;
    this.cleared = result.cleared;
    const count = result.cleared.length;
    this.score += ([0, 100, 300, 500, 800][count] ?? count * 250) * this.level;
    this.layers += count;
    this.active = null;
    this.holdUsed = false;
    if (count) {
      this.phase = 'clearing';
      this.clearTime = 0.3;
      this.record();
    } else this.spawn();
    this.notify();
  }
  pause() {
    if (this.phase !== 'playing' && this.phase !== 'clearing') return;
    this.paused = !this.paused;
    this.soft = false;
    this.notify();
  }
  orbit(yaw: number, pitch: number) {
    this.cameraYaw = ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    this.cameraPitch = Math.max((Math.PI * 25) / 180, Math.min((Math.PI * 75) / 180, pitch));
    // Grid input and the map use the nearest quarter-view while the camera orbits freely.
    this.view = ((Math.round((this.cameraYaw - Math.PI / 4) / (Math.PI / 2)) % 4) + 4) % 4;
    this.notify();
  }
  turn(direction: number) {
    const next = (this.view + direction + 4) % 4;
    this.orbit(Math.PI / 4 + (next * Math.PI) / 2, this.cameraPitch);
  }
  resetCamera() {
    this.orbit(Math.PI / 4, Math.atan2(13, 16));
  }
  tick(delta: number) {
    if (this.paused || this.phase === 'menu' || this.phase === 'over') return;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (this.rejection > 0) this.rejection = Math.max(0, this.rejection - dt);
    if (this.phase === 'clearing') {
      this.clearTime -= dt;
      if (this.clearTime <= 0) {
        this.cleared = [];
        this.phase = 'playing';
        this.spawn();
        this.notify();
      }
      return;
    }
    if (this.mode === 'practice') return;
    this.fallTime += dt;
    const interval = this.soft ? 0.045 : this.interval;
    while (this.fallTime >= interval) {
      this.fallTime -= interval;
      if (this.lower() && this.soft) {
        this.score++;
        this.notify();
      }
    }
    if (this.grounded()) {
      this.lockTime += dt;
      if (this.lockTime >= 0.5) this.lock();
    }
  }
}
