import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearLayers,
  fits,
  index,
  landing,
  rotated,
  shapes,
  StackGame,
  viewMove,
  worldCells,
} from './model';
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
  },
});
test('four quarter turns restore every shape on all three axes', () => {
  for (const shape of shapes)
    for (const axis of ['x', 'y', 'z'] as const) {
      const start = shape.cells.map(([x, y, z]) => ({ x, y, z }));
      let cells = start;
      for (let i = 0; i < 4; i++) cells = rotated(cells, axis, 1);
      assert.deepEqual(
        cells.map((c) => [c.x || 0, c.y || 0, c.z || 0]),
        start.map((c) => [c.x, c.y, c.z]),
      );
    }
});
test('collision checks reject floor, walls, ceiling and occupied cells', () => {
  const game = new StackGame();
  const p = game.make(0);
  assert.ok(fits(game.board, p));
  for (const position of [
    { x: 0, y: 5, z: 2 },
    { x: 2, y: -1, z: 2 },
    { x: 2, y: 12, z: 2 },
    { x: 2, y: 5, z: 5 },
  ])
    assert.equal(fits(game.board, { ...p, position }), false);
  game.board[index(2, 10, 2)] = 1;
  assert.equal(fits(game.board, p), false);
});
test('ghost stops above an obstruction and cannot descend one more cell', () => {
  const game = new StackGame();
  game.start('practice');
  game.board[index(2, 3, 2)] = 1;
  const ghost = landing(game.board, game.active!);
  assert.ok(fits(game.board, ghost));
  assert.equal(
    fits(game.board, { ...ghost, position: { ...ghost.position, y: ghost.position.y - 1 } }),
    false,
  );
});
test('simultaneous layer clearing compacts every higher layer without losing colors', () => {
  const board = Array(300).fill(0);
  for (const y of [0, 2])
    for (let z = 0; z < 5; z++) for (let x = 0; x < 5; x++) board[index(x, y, z)] = 1;
  board[index(1, 1, 1)] = 2;
  board[index(3, 3, 3)] = 4;
  const result = clearLayers(board);
  assert.deepEqual(result.cleared, [0, 2]);
  assert.equal(result.board[index(1, 0, 1)], 2);
  assert.equal(result.board[index(3, 1, 3)], 4);
  assert.equal(result.board.length, 300);
});
test('each shuffled bag contains each shape exactly once', () => {
  const game = new StackGame(() => 0.42);
  for (let round = 0; round < 5; round++)
    assert.equal(new Set(Array.from({ length: 5 }, () => game.draw())).size, 5);
});
test('hold is limited to once per piece, then resets after placement', () => {
  const game = new StackGame();
  game.start('practice');
  const first = game.active!.id;
  game.hold();
  assert.equal(game.held, first);
  const next = game.active!.id;
  game.hold();
  assert.equal(game.active!.id, next);
  game.hardDrop();
  assert.equal(game.holdUsed, false);
  game.hold();
  assert.equal(game.active!.id, first);
});
test('wall kicks allow a valid rotation and a blocked rotation leaves the piece intact', () => {
  const game = new StackGame();
  game.start('practice');
  game.active = {
    id: 0,
    cells: [
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
    ],
    position: { x: 0, y: 3, z: 2 },
  };
  game.rotate('y', 1);
  assert.ok(fits(game.board, game.active!));
  assert.equal(game.active!.position.x, 1);
  const original = JSON.stringify(game.active);
  game.board.fill(1);
  worldCells(game.active!).forEach((c) => (game.board[index(c.x, c.y, c.z)] = 0));
  game.rotate('x', 1); // Rotation about its own line can be unchanged; use vertical axis to test rejection.
  game.rotate('y', 1);
  assert.equal(JSON.stringify(game.active), original);
  assert.ok(game.rejection > 0);
});
test('practice never falls or locks automatically; pause freezes endless gravity', () => {
  const game = new StackGame();
  game.start('practice');
  const y = game.active!.position.y;
  for (let i = 0; i < 1000; i++) game.tick(0.05);
  assert.equal(game.active!.position.y, y);
  game.start('endless');
  game.pause();
  for (let i = 0; i < 100; i++) game.tick(0.05);
  assert.equal(game.active!.position.y, 10);
});
test('grounded adjustments stop resetting the lock delay after ten resets', () => {
  const game = new StackGame();
  game.start('endless');
  game.active = game.make(2);
  game.active.position = { x: 1, y: 0, z: 1 };
  for (let i = 0; i < 10; i++) game.move(i % 2 === 0 ? 1 : -1, 0);
  assert.equal(game.resets, 10);
  game.lockTime = 0.4;
  game.move(1, 0);
  assert.equal(game.lockTime, 0.4);
  game.tick(0.05);
  game.tick(0.05);
  game.tick(0.05);
  assert.ok(game.board.some(Boolean));
});
test('spawn collision ends the game without overwriting occupied cells', () => {
  const game = new StackGame();
  game.start('endless');
  game.board.fill(2);
  game.spawn(0);
  assert.equal(game.phase, 'over');
  assert.equal(game.active, null);
  assert.ok(game.board.every((n) => n === 2));
});
test('camera-relative movement completes a consistent four-view cycle', () => {
  assert.deepEqual(viewMove(1, 0, 0), { x: 1, z: 0 });
  assert.deepEqual(viewMove(1, 0, 1), { x: 0, z: -1 });
  assert.deepEqual(viewMove(1, 0, 4), { x: 1, z: 0 });
});
test('practice scores do not overwrite an endless best and storage denial is safe', () => {
  store.clear();
  const game = new StackGame();
  game.start('practice');
  game.score = 900;
  game.record();
  assert.equal(game.best, 0);
  game.start('endless');
  game.score = 200;
  game.record();
  assert.equal(new StackGame().best, 200);
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw Error('denied');
    },
  });
  assert.doesNotThrow(() => {
    const g = new StackGame();
    g.start('endless');
    g.score = 300;
    g.record();
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
});

test('free orbit retains arbitrary angles while mapping input to the nearest grid view', () => {
  const game = new StackGame();
  game.start('practice');
  const board = [...game.board],
    piece = JSON.stringify(game.active);
  game.orbit(2.2, 0.8);
  assert.ok(Math.abs(game.cameraYaw - 2.2) < 1e-10);
  assert.equal(game.view, 1);
  assert.equal(game.cameraPitch, 0.8);
  assert.deepEqual(game.board, board);
  assert.equal(JSON.stringify(game.active), piece);
  game.orbit(-Math.PI / 4, 0.8);
  assert.equal(game.view, 3);
});
test('camera tilt is bounded and quick turns and reset remain predictable', () => {
  const game = new StackGame();
  game.orbit(0, 100);
  assert.equal(game.cameraPitch, (Math.PI * 75) / 180);
  game.orbit(0, -100);
  assert.equal(game.cameraPitch, (Math.PI * 25) / 180);
  game.turn(1);
  assert.equal(game.view, 1);
  game.resetCamera();
  assert.equal(game.view, 0);
  assert.ok(Math.abs(game.cameraYaw - Math.PI / 4) < 1e-10);
  assert.equal(game.cameraPitch, Math.atan2(13, 16));
});
