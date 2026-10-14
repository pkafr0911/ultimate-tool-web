export type Axis = 'x' | 'z';
export type Block = { x: number; z: number; w: number; d: number; level: number };
export type Slice = Block & { axis: Axis; direction: number; age: number };
export const SIZE = 4;
export const HEIGHT = 0.55;
export const RETAINED_LAYERS = 128;
export const STEP = 1 / 120;
export type Placement = {
  block: Block | null;
  slice: Block | null;
  perfect: boolean;
  recovered: number;
};
export function placeBlock(top: Block, moving: Block, axis: Axis, streak: number): Placement {
  const dimension = axis === 'x' ? 'w' : 'd';
  const offset = moving[axis] - top[axis];
  const width = top[dimension];
  const overlap = width - Math.abs(offset);
  if (overlap <= 1e-8) return { block: null, slice: { ...moving }, perfect: false, recovered: 0 };
  const tolerance = Math.min(width * 0.18, Math.max(0.035, width * 0.03));
  if (Math.abs(offset) <= tolerance) {
    const recovered = (streak + 1) % 3 === 0 ? Math.min(0.22, SIZE - width) : 0;
    return {
      block: { ...moving, [axis]: top[axis], [dimension]: width + recovered },
      slice: null,
      perfect: true,
      recovered,
    };
  }
  const block = { ...moving, [axis]: top[axis] + offset / 2, [dimension]: overlap };
  const slice = {
    ...moving,
    [axis]: moving[axis] + (Math.sign(offset) * overlap) / 2,
    [dimension]: Math.abs(offset),
  };
  return { block, slice, perfect: false, recovered: 0 };
}
export function readBest() {
  try {
    const n = Number(localStorage.getItem('stack-tower.best.v1'));
    return Number.isSafeInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
export class TowerGame {
  phase: 'ready' | 'playing' | 'placing' | 'gameOver' = 'ready';
  paused = false;
  score = 0;
  streak = 0;
  highestStreak = 0;
  best = readBest();
  newBest = false;
  layers: Block[] = [{ x: 0, z: 0, w: SIZE, d: SIZE, level: 0 }];
  moving: Block = { x: -6, z: 0, w: SIZE, d: SIZE, level: 1 };
  slices: Slice[] = [];
  axis: Axis = 'x';
  time = 0;
  cooldown = 0;
  accumulator = 0;
  revision = 0;
  feedback = '';
  feedbackTime = 0;
  onChange = () => {};
  onSound: (event: 'place' | 'perfect' | 'miss') => void = () => {};
  get top() {
    return this.layers[this.layers.length - 1];
  }
  get speed() {
    return Math.min(3.6, 1.8 + this.score * 0.055);
  }
  get range() {
    return Math.max(this.top[this.axis === 'x' ? 'w' : 'd'] + 1.3, 3);
  }
  notify() {
    this.onChange();
  }
  spawn() {
    this.axis = this.score % 2 === 0 ? 'x' : 'z';
    this.time = 0;
    this.moving = {
      ...this.top,
      level: this.score + 1,
      [this.axis]: this.top[this.axis] - this.range,
    };
  }
  start() {
    this.score = 0;
    this.streak = 0;
    this.highestStreak = 0;
    this.newBest = false;
    this.paused = false;
    this.layers = [{ x: 0, z: 0, w: SIZE, d: SIZE, level: 0 }];
    this.slices = [];
    this.feedback = '';
    this.feedbackTime = 0;
    this.accumulator = 0;
    this.cooldown = 0;
    this.phase = 'playing';
    this.spawn();
    this.revision++;
    this.notify();
  }
  pause() {
    if (this.phase !== 'playing' && this.phase !== 'placing') return;
    this.paused = !this.paused;
    this.accumulator = 0;
    this.notify();
  }
  place() {
    if (this.phase !== 'playing' || this.paused) return;
    const result = placeBlock(this.top, this.moving, this.axis, this.streak);
    const direction = Math.sign(this.moving[this.axis] - this.top[this.axis]) || 1;
    if (result.slice)
      this.slices = [
        ...this.slices.slice(-7),
        { ...result.slice, axis: this.axis, direction, age: 0 },
      ];
    if (!result.block) {
      this.phase = 'gameOver';
      this.feedback = '';
      this.feedbackTime = 0;
      this.newBest = this.score > this.best;
      if (this.newBest) {
        this.best = this.score;
        try {
          localStorage.setItem('stack-tower.best.v1', String(this.best));
        } catch {
          /* Optional storage. */
        }
      }
      this.onSound('miss');
    } else {
      this.score++;
      this.streak = result.perfect ? this.streak + 1 : 0;
      this.highestStreak = Math.max(this.highestStreak, this.streak);
      this.layers.push(result.block);
      if (this.layers.length > RETAINED_LAYERS) this.layers.shift();
      this.feedback =
        result.recovered > 0 ? 'Perfect · width restored' : result.perfect ? 'Perfect' : '';
      this.feedbackTime = 1.2;
      this.cooldown = 0.34;
      this.phase = 'placing';
      this.onSound(result.perfect ? 'perfect' : 'place');
    }
    this.revision++;
    this.notify();
  }
  tick(delta: number) {
    if (this.paused || this.phase === 'ready') return;
    this.accumulator += Math.min(Math.max(delta, 0), 0.1);
    while (this.accumulator + 1e-10 >= STEP) {
      this.accumulator -= STEP;
      this.slices.forEach((slice) => {
        slice.age += STEP;
      });
      this.slices = this.slices.filter((slice) => slice.age < 2.2);
      if (this.feedbackTime > 0) {
        this.feedbackTime -= STEP;
        if (this.feedbackTime <= 0) {
          this.feedback = '';
          this.notify();
        }
      }
      if (this.phase === 'placing') {
        this.cooldown -= STEP;
        if (this.cooldown <= 0) {
          this.spawn();
          this.phase = 'playing';
          this.notify();
        }
      } else if (this.phase === 'playing') {
        this.time += STEP;
        const distance = (this.time * this.speed) % (this.range * 4);
        this.moving[this.axis] =
          this.top[this.axis] +
          (distance <= this.range * 2 ? -this.range + distance : this.range * 3 - distance);
      }
    }
  }
}
