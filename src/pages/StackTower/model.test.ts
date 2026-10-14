import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Block, placeBlock, RETAINED_LAYERS, SIZE, TowerGame } from './model';
const base: Block = { x: 0, z: 0, w: 4, d: 4, level: 0 };
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
});

test('both sides of both axes preserve overlap and conserve the sliced dimension', () => {
  for (const axis of ['x', 'z'] as const)
    for (const direction of [-1, 1]) {
      const dim = axis === 'x' ? 'w' : 'd';
      const result = placeBlock(base, { ...base, level: 1, [axis]: direction * 0.6 }, axis, 0);
      assert.ok(result.block && result.slice);
      assert.equal(result.perfect, false);
      assert.ok(Math.abs(result.block[dim] - 3.4) < 1e-9);
      assert.ok(Math.abs(result.block[dim] + result.slice[dim] - 4) < 1e-9);
      assert.equal(result.block[axis], direction * 0.3);
      assert.equal(result.slice[axis], direction * 2.3);
      assert.equal(result.block[axis === 'x' ? 'd' : 'w'], 4);
    }
});
test('touching exactly at an edge or missing entirely ends the run', () => {
  for (const axis of ['x', 'z'] as const)
    for (const offset of [-5, -4, 4, 5]) {
      assert.equal(placeBlock(base, { ...base, [axis]: offset, level: 1 }, axis, 0).block, null);
    }
});
test('near-perfect placement snaps without trimming, and recovery is capped', () => {
  const narrowed = { ...base, w: 3.9 };
  const result = placeBlock(narrowed, { ...narrowed, x: 0.04, level: 1 }, 'x', 2);
  assert.equal(result.perfect, true);
  assert.equal(result.block?.x, 0);
  assert.equal(result.block?.w, SIZE);
  assert.ok(Math.abs(result.recovered - 0.1) < 1e-8);
  assert.equal(result.slice, null);
  assert.equal(placeBlock(base, { ...base, level: 1 }, 'x', 2).recovered, 0);
});
test('perfect tolerance does not turn a narrow near-miss into a snap', () => {
  const narrow = { ...base, w: 0.02 };
  assert.equal(placeBlock(narrow, { ...narrow, x: 0.019, level: 1 }, 'x', 0).perfect, false);
});
test('duplicate placement during transition is ignored and axes alternate', () => {
  const game = new TowerGame();
  game.start();
  game.moving.x = 0;
  game.place();
  game.place();
  assert.equal(game.score, 1);
  assert.equal(game.phase, 'placing');
  for (let i = 0; i < 30; i++) game.tick(1 / 60);
  assert.equal(game.phase, 'playing');
  assert.equal(game.axis, 'z');
  assert.equal(game.moving.w, game.top.w);
  assert.equal(game.moving.d, game.top.d);
});
test('a non-perfect placement resets the streak while preserving the highest streak', () => {
  const game = new TowerGame();
  game.start();
  for (let i = 0; i < 3; i++) {
    game.moving[game.axis] = game.top[game.axis];
    game.place();
    for (let j = 0; j < 30; j++) game.tick(1 / 60);
  }
  assert.equal(game.streak, 3);
  game.moving[game.axis] = game.top[game.axis] + 0.5;
  game.place();
  assert.equal(game.streak, 0);
  assert.equal(game.highestStreak, 3);
});
test('movement matches across common display refresh rates and remains within its range', () => {
  const positions = [30, 60, 144].map((fps) => {
    const game = new TowerGame();
    game.start();
    for (let i = 0; i < fps * 12; i++) game.tick(1 / fps);
    assert.ok(Math.abs(game.moving.x) <= game.range);
    return game.moving.x;
  });
  assert.ok(Math.max(...positions) - Math.min(...positions) < 1e-8);
});
test('pause freezes motion and ignores placement; resume continues from the same point', () => {
  const game = new TowerGame();
  game.start();
  game.tick(0.1);
  game.pause();
  const x = game.moving.x;
  game.tick(2);
  game.place();
  assert.equal(game.moving.x, x);
  assert.equal(game.score, 0);
  game.pause();
  game.tick(0.1);
  assert.notEqual(game.moving.x, x);
});
test('long runs bound retained layers and falling debris and cap difficulty', () => {
  const game = new TowerGame();
  game.start();
  for (let i = 0; i < 400; i++) {
    game.moving[game.axis] = game.top[game.axis];
    game.place();
    for (let j = 0; j < 5; j++) game.tick(0.1);
  }
  assert.equal(game.score, 400);
  assert.equal(game.layers.length, RETAINED_LAYERS);
  assert.equal(game.top.level, 400);
  assert.equal(game.speed, 3.6);
  assert.ok(game.slices.length <= 8);
});
test('best score survives a new game; restarting resets run state', () => {
  storage.clear();
  const game = new TowerGame();
  game.start();
  game.moving.x = 0;
  game.place();
  for (let i = 0; i < 5; i++) game.tick(0.1);
  game.moving.z = 10;
  game.place();
  assert.equal(game.phase, 'gameOver');
  assert.equal(game.best, 1);
  assert.equal(game.newBest, true);
  assert.equal(new TowerGame().best, 1);
  game.start();
  assert.equal(game.score, 0);
  assert.equal(game.streak, 0);
  assert.equal(game.slices.length, 0);
  assert.equal(game.layers.length, 1);
  assert.equal(game.best, 1);
});
test('corrupt or denied storage does not block a run', () => {
  storage.set('stack-tower.best.v1', '-2');
  assert.equal(new TowerGame().best, 0);
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('denied');
    },
  });
  assert.doesNotThrow(() => {
    const game = new TowerGame();
    game.start();
    game.moving.x = 0;
    game.place();
    for (let i = 0; i < 5; i++) game.tick(0.1);
    game.moving.z = 10;
    game.place();
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
});
