import { gateAt, holes, Point } from './course';
import { Ball, BALL_RADIUS, contains, createBall, MAX_SPEED, STEP, stepBall } from './physics';
export type Phase = 'start' | 'ready' | 'rolling' | 'recovering' | 'holed' | 'finished';
export type Save = {
  version: 1;
  index: number;
  scores: number[];
  strokes: number;
  ball: Point;
  practice: boolean;
  completed: boolean;
};
const SAVE_KEY = 'pocket-golf.round.v1';
const BEST_KEY = 'pocket-golf.best.v1';
export function readSave(): Save | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (
      !s ||
      s.version !== 1 ||
      !Number.isInteger(s.index) ||
      s.index < 0 ||
      s.index >= holes.length ||
      !Array.isArray(s.scores) ||
      s.scores.length !== s.index ||
      !s.scores.every((n: number) => Number.isInteger(n) && n > 0 && n < 10000) ||
      !Number.isInteger(s.strokes) ||
      s.strokes < 0 ||
      s.strokes >= 10000 ||
      typeof s.practice !== 'boolean' ||
      typeof s.completed !== 'boolean'
    )
      return null;
    const h = holes[s.index];
    if (
      !s.ball ||
      !Number.isFinite(s.ball.x) ||
      !Number.isFinite(s.ball.z) ||
      Math.abs(s.ball.x) > h.width / 2 ||
      Math.abs(s.ball.z) > h.depth / 2
    )
      return null;
    if (s.completed && s.strokes === 0) return null;
    return s;
  } catch {
    return null;
  }
}
export function readBest(): number | null {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isInteger(n) && n >= holes.length && n < 60000 ? n : null;
  } catch {
    return null;
  }
}
export class GolfGame {
  index = 0;
  scores: number[] = [];
  strokes = 0;
  practice = false;
  ball: Ball = createBall(holes[0].tee);
  previous: Point = { ...holes[0].tee };
  phase: Phase = 'start';
  paused = false;
  aiming = false;
  angle = -Math.PI / 2;
  power = 0.45;
  time = 0;
  elapsed = 0;
  accumulator = 0;
  notice = '';
  saved = readSave();
  best = readBest();
  onChange = () => {};
  onSound: (kind: 'putt' | 'cup' | 'water') => void = () => {};
  get hole() {
    return holes[this.index];
  }
  notify() {
    this.onChange();
  }
  persist() {
    const s: Save = {
      version: 1,
      index: this.index,
      scores: this.scores,
      strokes: this.strokes,
      ball: { x: this.ball.x, z: this.ball.z },
      practice: this.practice,
      completed: this.phase === 'holed',
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      this.saved = s;
    } catch {
      /* Play remains available when storage is denied. */
    }
  }
  start(resume = false) {
    const s = resume ? this.saved : null;
    this.index = s?.index ?? 0;
    this.scores = s ? [...s.scores] : [];
    this.strokes = s?.strokes ?? 0;
    this.practice = s?.practice ?? false;
    this.ball = createBall(s?.ball ?? this.hole.tee);
    this.phase = s?.completed ? 'holed' : 'ready';
    this.paused = false;
    this.time = 0;
    this.elapsed = 0;
    this.accumulator = 0;
    this.aiming = false;
    this.notice = '';
    this.pointAtCup();
    this.persist();
    this.notify();
  }
  pointAtCup() {
    this.angle = Math.atan2(this.hole.cup.z - this.ball.z, this.hole.cup.x - this.ball.x);
    this.power = 0.45;
  }
  shoot() {
    if (this.phase !== 'ready' || this.paused || this.power < 0.025) return;
    this.persist(); // Reloading an interrupted shot restores its pre-shot state.
    this.previous = { x: this.ball.x, z: this.ball.z };
    this.strokes++;
    this.ball.vx = Math.cos(this.angle) * MAX_SPEED * this.power;
    this.ball.vz = Math.sin(this.angle) * MAX_SPEED * this.power;
    this.phase = 'rolling';
    this.aiming = false;
    this.notice = '';
    this.onSound('putt');
    this.notify();
  }
  pause() {
    if (this.phase === 'start' || this.phase === 'finished') return;
    this.paused = !this.paused;
    this.aiming = false;
    this.accumulator = 0;
    this.notify();
  }
  restart() {
    this.practice = true;
    this.ball = createBall(this.hole.tee);
    this.strokes = 0;
    this.phase = 'ready';
    this.paused = false;
    this.aiming = false;
    this.notice = 'Practice round — this round will not replace your best score.';
    this.pointAtCup();
    this.persist();
    this.notify();
  }
  next() {
    if (this.phase !== 'holed') return;
    this.scores.push(this.strokes);
    if (this.index === holes.length - 1) {
      const total = this.scores.reduce((a, b) => a + b, 0);
      if (!this.practice && (this.best === null || total < this.best)) {
        this.best = total;
        this.notice = 'A new personal best!';
        try {
          localStorage.setItem(BEST_KEY, String(total));
        } catch {
          /* optional persistence */
        }
      }
      this.phase = 'finished';
      this.saved = null;
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        /* optional persistence */
      }
    } else {
      this.index++;
      this.strokes = 0;
      this.ball = createBall(this.hole.tee);
      this.phase = 'ready';
      this.time = 0;
      this.notice = '';
      this.pointAtCup();
      this.persist();
    }
    this.aiming = false;
    this.notify();
  }
  tick(delta: number) {
    if (this.paused || this.phase === 'start' || this.phase === 'finished') return;
    if (this.phase === 'holed') {
      this.elapsed = Math.min(1, this.elapsed + delta);
      return;
    }
    if (this.phase === 'recovering') {
      this.elapsed += delta;
      if (this.elapsed > 0.9) {
        this.ball = createBall(this.previous);
        this.phase = 'ready';
        this.pointAtCup();
        this.persist();
        this.notify();
      }
      return;
    }
    this.accumulator += Math.min(delta, 0.06);
    while (this.accumulator >= STEP) {
      this.accumulator -= STEP;
      // Freeze the gate during aiming so a settled ball never moves under the pointer.
      if (this.phase === 'ready') {
        if (!this.aiming) {
          this.time += STEP;
          const gate = gateAt(this.hole, this.time);
          if (gate && contains(this.ball, gate, BALL_RADIUS)) {
            this.persist();
            this.previous = { x: this.ball.x, z: this.ball.z };
            this.phase = 'rolling';
            this.notify();
          }
        }
        if (this.phase === 'ready') continue;
      }
      this.time += STEP;
      const result = stepBall(this.ball, this.hole, this.time);
      if (result === 'rolling') continue;
      if (result === 'water') {
        this.strokes++;
        this.phase = 'recovering';
        this.elapsed = 0;
        this.notice = 'Water! +1 penalty. Returning to your last position.';
        this.onSound('water');
      }
      if (result === 'cup') {
        this.phase = 'holed';
        this.elapsed = 0;
        this.onSound('cup');
        this.persist();
      }
      if (result === 'rest') {
        this.phase = 'ready';
        this.pointAtCup();
        this.persist();
      }
      this.accumulator = 0;
      this.notify();
      break;
    }
  }
}
