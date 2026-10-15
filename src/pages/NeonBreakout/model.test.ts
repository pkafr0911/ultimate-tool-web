import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BreakoutGame, makeLevel, readCheckpoint, sweep } from './model';
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  },
});
test('swept collisions catch fast shots crossing a brick', () => {
  const hit = sweep(0, 0, 0, 20, { x: 0, y: 10, w: 2, h: 0.7 });
  assert.ok(hit && hit.t < 0.5 && hit.ny === -1);
});
test('all six layouts contain destructible bricks with gaps around barriers', () => {
  for (let i = 0; i < 6; i++) {
    const bricks = makeLevel(i);
    assert.ok(bricks.some((b) => b.kind !== 'barrier'));
    assert.equal(new Set(bricks.map((b) => b.id)).size, bricks.length);
    for (const b of bricks.filter((b) => b.kind === 'barrier'))
      assert.ok(
        bricks.every((other) => other === b || Math.hypot(other.x - b.x, other.y - b.y) > 1),
      );
  }
});
test('armored bricks need two hits and barriers cannot be destroyed', () => {
  const game = new BreakoutGame();
  game.start();
  const ball = game.balls[0];
  const armor = { ...game.bricks[0], kind: 'armored' as const, hp: 2 };
  game.damage(armor, ball);
  assert.equal(armor.hp, 1);
  game.damage(armor, ball);
  assert.equal(armor.hp, 0);
  const barrier = { ...armor, kind: 'barrier' as const, hp: 1 };
  game.damage(barrier, ball);
  assert.equal(barrier.hp, 1);
});
test('explosions damage neighbors once and cannot recurse forever', () => {
  const game = new BreakoutGame();
  game.start();
  game.bricks = [
    { id: 1, x: 0, y: 15, w: 1, h: 1, kind: 'explosive', hp: 1 },
    { id: 2, x: 1.5, y: 15, w: 1, h: 1, kind: 'explosive', hp: 1 },
  ];
  game.damage(game.bricks[0], game.balls[0]);
  assert.ok(game.bricks.every((b) => b.hp === 0));
  assert.equal(game.score, 320);
});
test('paddle center and edge produce controlled upward bounces', () => {
  const game = new BreakoutGame();
  game.start();
  for (const x of [0, 1]) {
    const ball = { x, y: 1.9, vx: 0, vy: -10, combo: 4 };
    game.advanceBall(ball, 0.05, 0, 0);
    assert.ok(ball.vy > 0);
    assert.equal(ball.combo, 0);
    if (x === 1) assert.ok(ball.vx > 0);
  }
});
test('multiball is capped and a life is lost only after all balls disappear', () => {
  const game = new BreakoutGame();
  game.start();
  game.launch();
  game.power('multi');
  game.power('multi');
  assert.equal(game.balls.length, 3);
  game.balls[0].y = -2;
  game.tick(1 / 120);
  assert.equal(game.lives, 3);
  game.balls.forEach((b) => {
    b.y = -2;
  });
  game.tick(1 / 120);
  assert.equal(game.lives, 2);
  assert.equal(game.phase, 'serve');
});
test('timed powerups refresh rather than compound and pause freezes them', () => {
  const game = new BreakoutGame();
  game.start();
  game.launch();
  game.power('wide');
  game.power('wide');
  assert.equal(game.paddleWidth, 4.2);
  game.power('slow');
  game.pause();
  game.tick(1);
  assert.equal(game.wide, 12);
  assert.equal(game.slow, 10);
});
test('clearing a level saves the next checkpoint with scores and lives', () => {
  store.clear();
  const game = new BreakoutGame();
  game.start();
  game.launch();
  game.score = 400;
  game.lives = 2;
  game.bricks.forEach((b) => {
    b.hp = 0;
  });
  game.tick(1 / 120);
  assert.equal(game.phase, 'cleared');
  game.next();
  assert.equal(game.level, 1);
  const resumed = new BreakoutGame();
  resumed.start(true);
  assert.equal(resumed.level, 1);
  assert.equal(resumed.score, 400);
  assert.equal(resumed.lives, 2);
});
test('game over clears campaign progress and saves best score', () => {
  store.clear();
  const game = new BreakoutGame();
  game.start();
  game.launch();
  game.score = 100;
  game.lives = 1;
  game.balls[0].y = -2;
  game.tick(1 / 120);
  assert.equal(game.phase, 'over');
  assert.equal(readCheckpoint(), null);
  assert.equal(new BreakoutGame().best, 100);
});
test('movement is consistent across refresh rates', () => {
  const positions = [30, 60, 144].map((fps) => {
    const game = new BreakoutGame();
    game.start();
    game.launch();
    for (let i = 0; i < fps; i++) game.tick(1 / fps);
    return game.balls[0].y;
  });
  assert.ok(Math.max(...positions) - Math.min(...positions) < 1e-8);
});
test('invalid saves and storage denial do not prevent play', () => {
  store.set('neon-breakout.save.v1', '{');
  assert.equal(readCheckpoint(), null);
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw Error('denied');
    },
  });
  assert.doesNotThrow(() => {
    const game = new BreakoutGame();
    game.start();
    game.launch();
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
});

test('moving-paddle collisions use contact time, not its final position', () => {
  const game = new BreakoutGame();
  game.start();
  const miss = { x: 0, y: 1.9, vx: 0, vy: -9, combo: 0 };
  game.advanceBall(miss, 0.05, -4, 80);
  assert.ok(miss.vy < 0, 'paddle reaches this x only after the ball has passed it');
  const catchBall = { x: 0, y: 1.9, vx: 0, vy: -9, combo: 0 };
  game.advanceBall(catchBall, 0.05, 0, 2);
  assert.ok(catchBall.vy > 0);
});
test('launch uses the latest input without waiting for a simulation frame', () => {
  const game = new BreakoutGame();
  game.start();
  game.move(5);
  game.launch();
  assert.equal(game.paddle, 5);
  assert.equal(game.balls[0].x, 5);
});
test('the last arena completes the campaign and removes its checkpoint', () => {
  const game = new BreakoutGame();
  game.start();
  game.level = 5;
  game.phase = 'cleared';
  game.score = 999;
  game.next();
  assert.equal(game.phase, 'won');
  assert.equal(readCheckpoint(), null);
  assert.equal(game.best, 999);
});
