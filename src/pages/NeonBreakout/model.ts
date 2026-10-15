export const WIDTH = 18,
  HEIGHT = 24,
  RADIUS = 0.22,
  STEP = 1 / 120;
export type Kind = 'standard' | 'armored' | 'explosive' | 'barrier';
export type Power = 'wide' | 'slow' | 'multi';
export type Brick = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: Kind;
  hp: number;
};
export type Ball = { x: number; y: number; vx: number; vy: number; combo: number };
export type Drop = { x: number; y: number; kind: Power };
export const levels = [
  'First Contact',
  'Side Channels',
  'Hard Shell',
  'Chain Reaction',
  'Prism',
  'Neon Crown',
];
export function makeLevel(level: number): Brick[] {
  const bricks: Brick[] = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 9; col++) {
      if (level === 1 && (col === 2 || col === 6) && row % 2 === 0) continue;
      if (level === 5 && Math.abs(col - 4) > row + 1) continue;
      let kind: Kind = 'standard';
      if (level === 2 && (row === 0 || row === 4)) kind = 'armored';
      if (level === 3 && (col + row) % 4 === 0) kind = 'explosive';
      if (level === 4 && row === 3 && [1, 4, 7].includes(col)) kind = 'barrier';
      if (level === 5)
        kind = row === 0 ? 'armored' : (row + col) % 5 === 0 ? 'explosive' : 'standard';
      bricks.push({
        id: row * 9 + col,
        x: (col - 4) * 1.82,
        y: 21 - row * 1.35,
        w: 1.58,
        h: 0.78,
        kind,
        hp: kind === 'armored' ? 2 : 1,
      });
    }
  return bricks;
}
export function sweep(
  x: number,
  y: number,
  dx: number,
  dy: number,
  box: { x: number; y: number; w: number; h: number },
) {
  let entry = -Infinity,
    exit = Infinity,
    nx = 0,
    ny = 0;
  for (const [p, d, min, max, axis] of [
    [x, dx, box.x - box.w / 2 - RADIUS, box.x + box.w / 2 + RADIUS, 0],
    [y, dy, box.y - box.h / 2 - RADIUS, box.y + box.h / 2 + RADIUS, 1],
  ]) {
    if (Math.abs(d) < 1e-10) {
      if (p < min || p > max) return null;
      continue;
    }
    const near = Math.min((min - p) / d, (max - p) / d);
    if (near > entry) {
      entry = near;
      nx = axis === 0 ? -Math.sign(d) : 0;
      ny = axis === 1 ? -Math.sign(d) : 0;
    }
    exit = Math.min(exit, Math.max((min - p) / d, (max - p) / d));
  }
  return entry >= -1e-9 && entry <= 1 && entry <= exit ? { t: Math.max(0, entry), nx, ny } : null;
}
export type Checkpoint = { version: 1; level: number; score: number; lives: number };
export function readCheckpoint(): Checkpoint | null {
  try {
    const s = JSON.parse(localStorage.getItem('neon-breakout.save.v1') || 'null');
    return s?.version === 1 &&
      Number.isInteger(s.level) &&
      s.level >= 0 &&
      s.level < 6 &&
      Number.isSafeInteger(s.score) &&
      s.score >= 0 &&
      Number.isInteger(s.lives) &&
      s.lives > 0 &&
      s.lives <= 3
      ? s
      : null;
  } catch {
    return null;
  }
}
export class BreakoutGame {
  phase: 'menu' | 'serve' | 'playing' | 'cleared' | 'over' | 'won' = 'menu';
  paused = false;
  level = 0;
  score = 0;
  lives = 3;
  best = 0;
  saved = readCheckpoint();
  bricks = makeLevel(0);
  balls: Ball[] = [];
  drops: Drop[] = [];
  paddle = 0;
  target = 0;
  axis = 0;
  wide = 0;
  slow = 0;
  time = 0;
  accumulator = 0;
  revision = 0;
  onChange = () => {};
  onHit: (x: number, y: number, kind: string) => void = () => {};
  constructor() {
    try {
      const n = Number(localStorage.getItem('neon-breakout.best.v1'));
      if (Number.isSafeInteger(n) && n > 0) this.best = n;
    } catch {
      /* Optional persistence. */
    }
    this.attach();
  }
  get paddleWidth() {
    return this.wide > 0 ? 4.2 : 2.8;
  }
  get speed() {
    return Math.min(17, 9 + this.level * 0.65 + this.time * 0.025);
  }
  notify() {
    this.revision++;
    this.onChange();
  }
  checkpoint() {
    const s: Checkpoint = { version: 1, level: this.level, score: this.score, lives: this.lives };
    this.saved = s;
    try {
      localStorage.setItem('neon-breakout.save.v1', JSON.stringify(s));
    } catch {
      /* Optional persistence. */
    }
  }
  record() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem('neon-breakout.best.v1', String(this.best));
      } catch {
        /* Optional persistence. */
      }
    }
  }
  attach() {
    this.balls = [{ x: this.paddle, y: 1.85, vx: 0, vy: 0, combo: 0 }];
  }
  start(resume = false) {
    const s = resume ? this.saved : null;
    this.level = s?.level ?? 0;
    this.score = s?.score ?? 0;
    this.lives = s?.lives ?? 3;
    this.load();
    this.checkpoint();
    this.notify();
  }
  load() {
    this.bricks = makeLevel(this.level);
    this.drops = [];
    this.wide = 0;
    this.slow = 0;
    this.time = 0;
    this.accumulator = 0;
    this.paddle = 0;
    this.target = 0;
    this.axis = 0;
    this.paused = false;
    this.phase = 'serve';
    this.attach();
  }
  launch() {
    if (this.phase !== 'serve' || this.paused) return;
    this.move(this.target);
    this.paddle = this.target;
    this.attach();
    this.balls[0].vx = this.speed * 0.28;
    this.balls[0].vy = this.speed * Math.sqrt(1 - 0.28 ** 2);
    this.phase = 'playing';
    this.notify();
  }
  pause() {
    if (!['serve', 'playing'].includes(this.phase)) return;
    this.paused = !this.paused;
    this.axis = 0;
    this.accumulator = 0;
    this.notify();
  }
  move(x: number) {
    this.target = Math.max(-9 + this.paddleWidth / 2, Math.min(9 - this.paddleWidth / 2, x));
  }
  power(kind: Power) {
    if (kind === 'wide') this.wide = 12;
    else if (kind === 'slow') this.slow = 10;
    else {
      const b = this.balls[0];
      if (b)
        for (const angle of [-0.45, 0.45]) {
          if (this.balls.length >= 3) break;
          this.balls.push({
            ...b,
            vx: b.vx * Math.cos(angle) - b.vy * Math.sin(angle),
            vy: b.vx * Math.sin(angle) + b.vy * Math.cos(angle),
            combo: 0,
          });
        }
    }
    this.onHit(this.paddle, 1.5, kind);
    this.notify();
  }
  damage(brick: Brick, ball: Ball) {
    if (brick.hp <= 0 || brick.kind === 'barrier') return;
    brick.hp--;
    this.score += 10;
    if (brick.hp === 0) {
      ball.combo++;
      this.score += 100 * Math.min(5, ball.combo);
      this.onHit(brick.x, brick.y, brick.kind);
      if (brick.id % 11 === 3)
        this.drops.push({
          x: brick.x,
          y: brick.y,
          kind: (['wide', 'slow', 'multi'] as Power[])[Math.floor(brick.id / 11) % 3],
        });
      if (brick.kind === 'explosive')
        this.bricks
          .filter((b) => b.hp > 0 && Math.hypot(b.x - brick.x, b.y - brick.y) < 2.4)
          .forEach((b) => this.damage(b, ball));
    }
    this.notify();
  }
  advanceBall(ball: Ball, dt: number, paddleStart: number, paddleVelocity: number) {
    let remaining = dt,
      elapsed = 0;
    const speed = this.speed * (this.slow > 0 ? 0.68 : 1);
    const length = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx *= speed / length;
    ball.vy *= speed / length;
    for (let iteration = 0; iteration < 8 && remaining > 1e-7; iteration++) {
      const dx = ball.vx * remaining,
        dy = ball.vy * remaining;
      let hit: { t: number; nx: number; ny: number; brick?: Brick; paddle?: boolean } | null = null;
      const consider = (candidate: typeof hit) => {
        if (candidate && (!hit || candidate.t < hit.t)) hit = candidate;
      };
      for (const wall of [
        { x: -9.5, y: 12, w: 1, h: 26 },
        { x: 9.5, y: 12, w: 1, h: 26 },
        { x: 0, y: 24.5, w: 18, h: 1 },
      ])
        consider(sweep(ball.x, ball.y, dx, dy, wall));
      for (const brick of this.bricks)
        if (brick.hp > 0) {
          const candidate = sweep(ball.x, ball.y, dx, dy, brick);
          if (candidate) consider({ ...candidate, brick });
        }
      if (ball.vy < 0) {
        const candidate = sweep(ball.x, ball.y, dx - paddleVelocity * remaining, dy, {
          x: paddleStart + paddleVelocity * elapsed,
          y: 1.4,
          w: this.paddleWidth,
          h: 0.35,
        });
        if (candidate && candidate.ny === 1) consider({ ...candidate, paddle: true });
      }
      // TypeScript cannot track assignments made inside consider().
      const collision = hit as {
        t: number;
        nx: number;
        ny: number;
        brick?: Brick;
        paddle?: boolean;
      } | null;
      if (!collision) {
        ball.x += dx;
        ball.y += dy;
        break;
      }
      ball.x += dx * collision.t + collision.nx * 0.001;
      ball.y += dy * collision.t + collision.ny * 0.001;
      elapsed += remaining * collision.t;
      remaining *= 1 - collision.t;
      if (collision.paddle) {
        const contact = Math.max(
          -1,
          Math.min(1, (ball.x - (paddleStart + paddleVelocity * elapsed)) / (this.paddleWidth / 2)),
        );
        const angle = Math.max(
          -1.12,
          Math.min(1.12, contact * 1.05 + Math.max(-0.12, Math.min(0.12, paddleVelocity * 0.008))),
        );
        ball.vx = Math.sin(angle) * speed;
        ball.vy = Math.cos(angle) * speed;
        ball.combo = 0;
        this.onHit(ball.x, ball.y, 'paddle');
      } else {
        if (collision.nx) ball.vx *= -1;
        if (collision.ny) ball.vy *= -1;
        if (collision.brick) this.damage(collision.brick, ball);
      }
      if (Math.abs(ball.vy) < speed * 0.22) {
        ball.vy = Math.sign(ball.vy || 1) * speed * 0.22;
        ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(speed * speed - ball.vy * ball.vy);
      }
    }
  }
  tick(delta: number) {
    if (this.paused || !['serve', 'playing'].includes(this.phase)) return;
    this.accumulator += Math.min(delta, 0.1);
    while (this.accumulator + 1e-10 >= STEP) {
      this.accumulator -= STEP;
      if (this.axis) this.move(this.target + this.axis * 17 * STEP);
      const old = this.paddle;
      this.move(this.target);
      this.paddle = this.target;
      if (this.phase === 'serve') {
        this.attach();
        continue;
      }
      this.time += STEP;
      const seconds = Math.ceil(this.wide) + Math.ceil(this.slow);
      this.wide = Math.max(0, this.wide - STEP);
      this.slow = Math.max(0, this.slow - STEP);
      if (seconds !== Math.ceil(this.wide) + Math.ceil(this.slow)) this.notify();
      for (const ball of this.balls) this.advanceBall(ball, STEP, old, (this.paddle - old) / STEP);
      this.balls = this.balls.filter((b) => b.y > -0.6);
      for (const drop of this.drops) {
        drop.y -= STEP * 4;
        if (
          Math.abs(drop.y - 1.4) < 0.3 &&
          Math.abs(drop.x - this.paddle) < this.paddleWidth / 2 + 0.25
        ) {
          this.power(drop.kind);
          drop.y = -2;
        }
      }
      this.drops = this.drops.filter((d) => d.y > 0);
      if (!this.bricks.some((b) => b.kind !== 'barrier' && b.hp > 0)) {
        this.phase = 'cleared';
        this.drops = [];
        this.record();
        this.notify();
        break;
      }
      if (!this.balls.length) {
        this.lives--;
        this.wide = 0;
        this.slow = 0;
        this.drops = [];
        if (this.lives === 0) {
          this.phase = 'over';
          this.record();
          this.saved = null;
          try {
            localStorage.removeItem('neon-breakout.save.v1');
          } catch {
            /* Optional storage. */
          }
        } else {
          this.phase = 'serve';
          this.attach();
        }
        this.notify();
        break;
      }
    }
  }
  next() {
    if (this.phase !== 'cleared') return;
    if (this.level === 5) {
      this.phase = 'won';
      this.saved = null;
      this.record();
      try {
        localStorage.removeItem('neon-breakout.save.v1');
      } catch {
        /* Optional storage. */
      }
    } else {
      this.level++;
      this.load();
      this.checkpoint();
    }
    this.notify();
  }
}
