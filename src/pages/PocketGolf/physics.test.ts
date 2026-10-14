import assert from 'node:assert/strict';
import { test } from 'node:test';
import { holes, Hole } from './course';
import { GolfGame, readSave } from './game';
import {
  aimPath,
  BALL_RADIUS,
  contains,
  createBall,
  MAX_SPEED,
  STEP,
  stepBall,
  sweep,
} from './physics';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  },
});

test('swept collision catches a thin wall even when a shot crosses it in one step', () => {
  const hit = sweep({ x: -4, z: 0 }, 8, 0, { x: 0, z: 0, w: 0.1, d: 3 });
  assert.ok(hit && hit.t > 0 && hit.t < 0.5 && hit.nx === -1);
  const h: Hole = { ...holes[0], blocks: [{ x: 0, z: 0, w: 0.1, d: 3 }] };
  const ball = { x: -1, z: 0, vx: 120, vz: 0 };
  stepBall(ball, h, 0, 1 / 30);
  assert.ok(ball.x < -BALL_RADIUS);
  assert.ok(ball.vx < 0);
});
test('maximum-strength shots remain inside borders and eventually settle', () => {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
    const ball = {
      ...createBall(holes[0].tee),
      vx: Math.cos(angle) * MAX_SPEED,
      vz: Math.sin(angle) * MAX_SPEED,
    };
    let result = 'rolling';
    for (let i = 0; i < 6000 && result === 'rolling'; i++) {
      result = stepBall(ball, holes[0], i * STEP);
      assert.ok(Math.abs(ball.x) <= holes[0].width / 2 - BALL_RADIUS + 0.001);
      assert.ok(Math.abs(ball.z) <= holes[0].depth / 2 - BALL_RADIUS + 0.001);
    }
    assert.notEqual(result, 'rolling');
  }
});
test('the cup captures a gentle approach but lets a fast ball roll past', () => {
  const h = holes[0];
  const slow = { x: h.cup.x, z: h.cup.z + 0.2, vx: 0, vz: -1 };
  assert.equal(stepBall(slow, h, 0), 'cup');
  const fast = { x: h.cup.x, z: h.cup.z + 0.2, vx: 0, vz: -8 };
  assert.equal(stepBall(fast, h, 0), 'rolling');
});
test('the first hole can be completed with a direct putt', () => {
  const h = holes[0];
  const angle = Math.atan2(h.cup.z - h.tee.z, h.cup.x - h.tee.x);
  let holed = false;
  for (let power = 0.1; power <= 1; power += 0.005) {
    const ball = {
      ...createBall(h.tee),
      vx: Math.cos(angle) * MAX_SPEED * power,
      vz: Math.sin(angle) * MAX_SPEED * power,
    };
    for (let i = 0; i < 4000; i++) {
      const result = stepBall(ball, h, i * STEP);
      if (result === 'cup') holed = true;
      if (result !== 'rolling') break;
    }
  }
  assert.ok(holed);
});
test('aim preview terminates at the first wall', () => {
  const path = aimPath({ x: 3, z: 0 }, holes[0], 0, 1, 0);
  assert.ok(path[path.length - 1].x <= 4 - BALL_RADIUS + 1e-6);
});
test('every course has a ball-width path from tee to cup, even with the gate closed centrally', () => {
  for (const h of holes) {
    const resolution = 0.2;
    const nx = Math.round(h.width / resolution);
    const nz = Math.round(h.depth / resolution);
    const point = (x: number, z: number) => ({
      x: -h.width / 2 + (x + 0.5) * resolution,
      z: -h.depth / 2 + (z + 0.5) * resolution,
    });
    const free = (x: number, z: number) => {
      const p = point(x, z);
      return (
        Math.abs(p.x) < h.width / 2 - BALL_RADIUS &&
        Math.abs(p.z) < h.depth / 2 - BALL_RADIUS &&
        ![...h.blocks, ...h.water, ...(h.gate ? [h.gate] : [])].some((r) =>
          contains(p, r, BALL_RADIUS),
        )
      );
    };
    const start = [
      Math.floor((h.tee.x + h.width / 2) / resolution),
      Math.floor((h.tee.z + h.depth / 2) / resolution),
    ];
    const queue = [start];
    const visited = new Set<string>();
    let reachable = false;
    for (let i = 0; i < queue.length; i++) {
      const [x, z] = queue[i];
      const key = `${x},${z}`;
      if (visited.has(key) || x < 0 || z < 0 || x >= nx || z >= nz || !free(x, z)) continue;
      visited.add(key);
      const p = point(x, z);
      if (Math.hypot(p.x - h.cup.x, p.z - h.cup.z) < 0.3) {
        reachable = true;
        break;
      }
      queue.push([x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]);
    }
    assert.ok(reachable, h.name);
  }
});
test('water counts the shot plus one penalty and restores the previous position', () => {
  store.clear();
  const game = new GolfGame();
  game.start();
  game.index = 3;
  game.ball = createBall({ x: -2, z: 2 });
  game.angle = -Math.PI / 2;
  game.power = 0.8;
  game.shoot();
  for (let i = 0; i < 3000 && game.phase !== 'ready'; i++) game.tick(STEP);
  assert.equal(game.strokes, 2);
  assert.deepEqual(game.ball, createBall({ x: -2, z: 2 }));
});
test('pause freezes simulation; reload restores the shot before it was released', () => {
  store.clear();
  const game = new GolfGame();
  game.start();
  const start = { ...game.ball };
  game.shoot();
  game.pause();
  game.tick(1);
  assert.equal(game.ball.x, start.x);
  assert.equal(game.ball.z, start.z);
  const resumed = new GolfGame();
  resumed.start(true);
  assert.equal(resumed.strokes, 0);
  assert.deepEqual(resumed.ball, start);
});
test('practice rounds never overwrite a personal best, normal completed rounds do', () => {
  store.clear();
  const game = new GolfGame();
  game.start();
  game.restart();
  game.index = 5;
  game.scores = [2, 3, 3, 3, 4];
  game.strokes = 4;
  game.phase = 'holed';
  game.next();
  assert.equal(game.best, null);
  assert.equal(game.phase, 'finished');
  game.start();
  game.index = 5;
  game.scores = [2, 3, 3, 3, 4];
  game.strokes = 4;
  game.phase = 'holed';
  game.next();
  assert.equal(game.best, 19);
  assert.equal(new GolfGame().best, 19);
  assert.equal(readSave(), null);
});
test('malformed saved games are ignored and unavailable storage does not block play', () => {
  store.set('pocket-golf.round.v1', '{broken');
  assert.equal(readSave(), null);
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('denied');
    },
  });
  const game = new GolfGame();
  assert.doesNotThrow(() => {
    game.start();
    game.shoot();
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
});
