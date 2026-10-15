export const COLS = 10,
  ROWS = 22,
  HIDDEN = 2;
export const presets = {
  easy: { name: 'Easy', start: 1, lock: 0.55 },
  normal: { name: 'Normal', start: 5, lock: 0.5 },
  hard: { name: 'Hard', start: 10, lock: 0.4 },
  expert: { name: 'Expert', start: 15, lock: 0.3 },
};
export type Difficulty = keyof typeof presets;
export const pieces = [
  { name: 'I', color: '#70d7e6', matrix: ['0000', '1111', '0000', '0000'] },
  { name: 'O', color: '#efd47b', matrix: ['11', '11'] },
  { name: 'T', color: '#be9bea', matrix: ['010', '111', '000'] },
  { name: 'S', color: '#8dd3a5', matrix: ['011', '110', '000'] },
  { name: 'Z', color: '#ed8b9a', matrix: ['110', '011', '000'] },
  { name: 'J', color: '#8ba9f1', matrix: ['100', '111', '000'] },
  { name: 'L', color: '#efb07b', matrix: ['001', '111', '000'] },
];
export type Piece = { id: number; matrix: string[]; x: number; y: number };
export function cells(p: Piece) {
  return p.matrix.flatMap((row, y) =>
    [...row].flatMap((value, x) => (value === '1' ? [{ x: p.x + x, y: p.y + y }] : [])),
  );
}
export function fits(board: number[], p: Piece) {
  return cells(p).every(
    ({ x, y }) => x >= 0 && x < COLS && y >= 0 && y < ROWS && !board[y * COLS + x],
  );
}
export function rotateMatrix(matrix: string[], dir: number) {
  const n = matrix.length;
  return Array.from({ length: n }, (_, y) =>
    Array.from({ length: n }, (_, x) =>
      dir === 1 ? matrix[n - 1 - x][y] : matrix[x][n - 1 - y],
    ).join(''),
  );
}
export function ghost(board: number[], p: Piece) {
  const result = { ...p };
  while (fits(board, { ...result, y: result.y + 1 })) result.y++;
  return result;
}
export function clearRows(board: number[]) {
  const kept: number[][] = [];
  let count = 0;
  for (let y = 0; y < ROWS; y++) {
    const row = board.slice(y * COLS, (y + 1) * COLS);
    if (row.every(Boolean)) count++;
    else kept.push(row);
  }
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(0));
  return { board: kept.flat(), count };
}
export class ClassicGame {
  board = Array(COLS * ROWS).fill(0) as number[];
  active: Piece | null = null;
  queue: number[] = [];
  bag: number[] = [];
  held: number | null = null;
  holdUsed = false;
  phase: 'menu' | 'playing' | 'over' = 'menu';
  paused = false;
  difficulty: Difficulty = 'normal';
  score = 0;
  lines = 0;
  best = 0;
  fall = 0;
  lock = 0;
  resets = 0;
  accumulator = 0;
  soft = false;
  lastClear = 0;
  flash = 0;
  onChange = () => {};
  renderInput = () => {};
  constructor(public random = Math.random) {
    this.readBest();
  }
  get level() {
    return presets[this.difficulty].start + Math.floor(this.lines / 10);
  }
  get gravity() {
    return Math.max(0.035, 0.85 * Math.pow(0.82, this.level - 1));
  }
  get canPlay() {
    return this.phase === 'playing' && !this.paused && !!this.active;
  }
  readBest() {
    this.best = 0;
    try {
      const n = Number(localStorage.getItem(`crystal-classic.best.${this.difficulty}.v1`));
      if (Number.isSafeInteger(n) && n > 0) this.best = n;
    } catch {
      /* optional */
    }
  }
  record() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem(`crystal-classic.best.${this.difficulty}.v1`, String(this.best));
      } catch {
        /* optional */
      }
    }
  }
  draw() {
    if (!this.bag.length) {
      this.bag = pieces.map((_, i) => i);
      for (let i = 6; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }
  make(id: number): Piece {
    return {
      id,
      matrix: [...pieces[id].matrix],
      x: Math.floor((COLS - pieces[id].matrix.length) / 2),
      y: HIDDEN - pieces[id].matrix.findIndex((row) => row.includes('1')),
    };
  }
  spawn(id?: number) {
    const next = id ?? this.queue.shift()!;
    if (id === undefined) this.queue.push(this.draw());
    this.active = this.make(next);
    this.fall = 0;
    this.lock = 0;
    this.resets = 0;
    if (!fits(this.board, this.active)) {
      this.active = null;
      this.phase = 'over';
      this.record();
    }
  }
  start(difficulty: Difficulty) {
    this.difficulty = difficulty;
    this.readBest();
    this.board.fill(0);
    this.score = 0;
    this.lines = 0;
    this.bag = [];
    this.queue = Array.from({ length: 5 }, () => this.draw());
    this.held = null;
    this.holdUsed = false;
    this.soft = false;
    this.accumulator = 0;
    this.lastClear = 0;
    this.flash = 0;
    this.phase = 'playing';
    this.paused = false;
    this.spawn();
    this.onChange();
  }
  grounded() {
    return !!this.active && !fits(this.board, { ...this.active, y: this.active.y + 1 });
  }
  adjust(next: Piece) {
    if (!fits(this.board, next)) return false;
    const grounded = this.grounded();
    this.active = next;
    if (grounded && this.resets < 10) {
      this.lock = 0;
      this.resets++;
    }
    return true;
  }
  move(dx: number) {
    if (this.canPlay) this.adjust({ ...this.active!, x: this.active!.x + dx });
  }
  rotate(dir: number) {
    if (!this.canPlay || this.active!.id === 1) return;
    const p = this.active!,
      matrix = rotateMatrix(p.matrix, dir);
    for (const [x, y] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
      [-1, -1],
      [1, -1],
      [0, -2],
    ])
      if (this.adjust({ ...p, matrix, x: p.x + x, y: p.y + y })) return;
  }
  lower(award = false) {
    if (!this.canPlay) return false;
    const next = { ...this.active!, y: this.active!.y + 1 };
    if (!fits(this.board, next)) return false;
    this.active = next;
    if (award) {
      this.score++;
      this.onChange();
    }
    return true;
  }
  hold() {
    if (!this.canPlay || this.holdUsed) return;
    const id = this.active!.id,
      old = this.held;
    this.held = id;
    this.holdUsed = true;
    this.spawn(old ?? undefined);
    this.onChange();
  }
  hardDrop() {
    if (!this.canPlay) return;
    const p = this.active!,
      land = ghost(this.board, p);
    this.score += (land.y - p.y) * 2;
    this.active = land;
    this.commit();
  }
  commit() {
    if (!this.active) return;
    cells(this.active).forEach(({ x, y }) => {
      this.board[y * COLS + x] = this.active!.id + 1;
    });
    const result = clearRows(this.board);
    this.board = result.board;
    this.lastClear = result.count;
    this.score += ([0, 100, 300, 500, 800][result.count] ?? 0) * this.level;
    this.lines += result.count;
    this.flash = result.count ? 0.3 : 0;
    this.holdUsed = false;
    this.active = null;
    if (this.board.slice(0, COLS * HIDDEN).some(Boolean)) {
      this.phase = 'over';
      this.record();
    } else {
      this.spawn();
      if (result.count) this.record();
    }
    this.onChange();
  }
  pause() {
    if (this.phase !== 'playing') return;
    this.paused = !this.paused;
    this.soft = false;
    this.accumulator = 0;
    this.onChange();
  }
  tick(dt: number) {
    if (!this.canPlay) return;
    this.accumulator += Math.min(Math.max(dt, 0), 0.1);
    const step = 1 / 120;
    while (this.accumulator + 1e-10 >= step && this.canPlay) {
      this.accumulator -= step;
      this.flash = Math.max(0, this.flash - step);
      this.fall += step;
      const interval = this.soft ? Math.min(this.gravity, 0.025) : this.gravity;
      while (this.fall + 1e-10 >= interval) {
        this.fall -= interval;
        if (!this.lower(this.soft)) break;
      }
      if (this.grounded()) {
        this.lock += step;
        if (this.lock + 1e-10 >= presets[this.difficulty].lock) this.commit();
      }
    }
  }
}
export type Command = 'left' | 'right' | 'down' | 'cw' | 'ccw' | 'drop' | 'hold' | 'pause';
export class ClassicInput {
  held = new Set<Command>();
  direction: Command | null = null;
  elapsed = 0;
  repeating = false;
  constructor(public game: ClassicGame) {}
  press(command: Command) {
    if (this.held.has(command)) return;
    this.held.add(command);
    if (command === 'pause') {
      this.clear();
      this.game.pause();
    } else if (command === 'left' || command === 'right') {
      this.direction = command;
      this.elapsed = 0;
      this.repeating = false;
      this.game.move(command === 'left' ? -1 : 1);
    } else if (command === 'down') {
      this.game.soft = true;
      this.game.lower(true);
    } else if (command === 'cw' || command === 'ccw') this.game.rotate(command === 'cw' ? 1 : -1);
    else if (command === 'drop') this.game.hardDrop();
    else this.game.hold();
    this.game.renderInput();
  }
  release(command: Command) {
    this.held.delete(command);
    if (command === 'down') this.game.soft = false;
    if (command === this.direction) {
      this.direction = this.held.has('left') ? 'left' : this.held.has('right') ? 'right' : null;
      this.elapsed = 0;
      this.repeating = false;
      if (this.direction) this.game.move(this.direction === 'left' ? -1 : 1);
      this.game.renderInput();
    }
  }
  clear() {
    this.held.clear();
    this.direction = null;
    this.elapsed = 0;
    this.repeating = false;
    this.game.soft = false;
  }
  tick(dt: number) {
    if (!this.game.canPlay || !this.direction) return;
    this.elapsed += Math.min(dt, 0.1);
    let threshold = this.repeating ? 0.035 : 0.13;
    while (this.elapsed + 1e-10 >= threshold) {
      this.elapsed -= threshold;
      this.repeating = true;
      this.game.move(this.direction === 'left' ? -1 : 1);
      threshold = 0.035;
    }
  }
}
