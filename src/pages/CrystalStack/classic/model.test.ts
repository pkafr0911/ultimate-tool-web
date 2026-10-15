import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cells,
  ClassicGame,
  ClassicInput,
  clearRows,
  fits,
  ghost,
  pieces,
  presets,
  rotateMatrix,
} from './model';
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  },
});
test('all seven pieces have four cells and bags contain every piece once', () => {
  const g = new ClassicGame(() => 0.42);
  for (let id = 0; id < 7; id++) assert.equal(cells(g.make(id)).length, 4);
  for (let round = 0; round < 4; round++)
    assert.equal(new Set(Array.from({ length: 7 }, () => g.draw())).size, 7);
});
test('four rotations restore every piece and inverse rotations cancel', () => {
  for (const p of pieces) {
    let matrix = p.matrix;
    for (let n = 0; n < 4; n++) matrix = rotateMatrix(matrix, 1);
    assert.deepEqual(matrix, p.matrix);
    assert.deepEqual(rotateMatrix(rotateMatrix(matrix, 1), -1), p.matrix);
  }
});
test('walls, floor and settled blocks reject overlap; ghost is grounded', () => {
  const g = new ClassicGame();
  g.start('normal');
  const p = g.make(1);
  assert.equal(fits(g.board, { ...p, x: -1 }), false);
  assert.equal(fits(g.board, { ...p, y: 22 }), false);
  g.board[20 * 10 + 4] = 3;
  const land = ghost(g.board, p);
  assert.ok(fits(g.board, land));
  assert.equal(fits(g.board, { ...land, y: land.y + 1 }), false);
});
test('four simultaneous row clears shift higher cells down exactly four rows', () => {
  const board = Array(220).fill(0);
  for (let y = 18; y < 22; y++) for (let x = 0; x < 10; x++) board[y * 10 + x] = 1;
  board[17 * 10 + 3] = 5;
  const result = clearRows(board);
  assert.equal(result.count, 4);
  assert.equal(result.board[21 * 10 + 3], 5);
  assert.equal(result.board.filter(Boolean).length, 1);
});
test('keyboard press changes position and requests rendering immediately without a frame tick', () => {
  const g = new ClassicGame();
  g.start('normal');
  const input = new ClassicInput(g);
  let renders = 0;
  g.renderInput = () => renders++;
  const x = g.active!.x;
  input.press('left');
  assert.equal(g.active!.x, x - 1);
  assert.equal(renders, 1);
  input.press('left');
  assert.equal(g.active!.x, x - 1);
});
test('repeat timing uses 130ms DAS and 35ms ARR independently of native key repeat', () => {
  const g = new ClassicGame();
  g.start('normal');
  g.active = g.make(1);
  g.active.x = 7;
  const input = new ClassicInput(g);
  input.press('left');
  input.tick(0.1);
  input.tick(0.029);
  assert.equal(g.active.x, 6);
  input.tick(0.001);
  assert.equal(g.active.x, 5);
  input.tick(0.035);
  assert.equal(g.active.x, 4);
  input.release('left');
  input.tick(0.1);
  assert.equal(g.active.x, 4);
});
test('hard drop locks and spawns immediately, while held drop cannot place twice', () => {
  const g = new ClassicGame();
  g.start('normal');
  const input = new ClassicInput(g);
  input.press('drop');
  assert.equal(g.board.filter(Boolean).length, 4);
  assert.ok(g.active);
  input.press('drop');
  assert.equal(g.board.filter(Boolean).length, 4);
  input.release('drop');
  input.press('drop');
  assert.equal(g.board.filter(Boolean).length, 8);
});
test('latest direction wins, releasing it resumes the other held direction', () => {
  const g = new ClassicGame();
  g.start('normal');
  const input = new ClassicInput(g);
  const x = g.active!.x;
  input.press('left');
  input.press('right');
  assert.equal(g.active!.x, x);
  input.release('right');
  assert.equal(g.active!.x, x - 1);
  input.clear();
  assert.equal(input.direction, null);
});
test('hold is once per placement and restores the original piece orientation', () => {
  const g = new ClassicGame();
  g.start('normal');
  const id = g.active!.id;
  g.rotate(1);
  g.hold();
  const next = g.active!.id;
  g.hold();
  assert.equal(g.active!.id, next);
  g.hardDrop();
  g.hold();
  assert.equal(g.active!.id, id);
  assert.deepEqual(g.active!.matrix, pieces[id].matrix);
});
test('difficulty presets order gravity and lock delays; every ten lines levels up', () => {
  const g = new ClassicGame();
  const values = Object.keys(presets).map((key) => {
    g.start(key as keyof typeof presets);
    return g.gravity;
  });
  assert.ok(values.every((value, i) => i === 0 || value < values[i - 1]));
  g.start('hard');
  g.lines = 10;
  assert.equal(g.level, 11);
  assert.equal(presets.expert.lock, 0.3);
});
test('grounded adjustments have a capped lock reset count', () => {
  const g = new ClassicGame();
  g.start('easy');
  g.active = { ...g.make(1), x: 4, y: 20 };
  for (let i = 0; i < 10; i++) g.move(i % 2 === 0 ? 1 : -1);
  assert.equal(g.resets, 10);
  g.lock = 0.5;
  g.move(1);
  assert.equal(g.lock, 0.5);
  g.tick(0.06);
  assert.ok(g.board.some(Boolean));
});
test('pause and input clear freeze falling and stop held movement', () => {
  const g = new ClassicGame();
  g.start('expert');
  const input = new ClassicInput(g);
  input.press('down');
  input.press('left');
  input.clear();
  g.pause();
  const before = JSON.stringify(g.active);
  for (let i = 0; i < 10; i++) {
    input.tick(0.1);
    g.tick(0.1);
  }
  assert.equal(JSON.stringify(g.active), before);
  assert.equal(g.soft, false);
});
test('gravity matches at 30, 60 and 144 Hz', () => {
  const results = [30, 60, 144].map((fps) => {
    const g = new ClassicGame();
    g.start('easy');
    g.active = g.make(1);
    for (let i = 0; i < fps * 2; i++) g.tick(1 / fps);
    return g.active!.y;
  });
  assert.equal(new Set(results).size, 1);
});
test('top out and per-difficulty best scores are isolated', () => {
  store.clear();
  const g = new ClassicGame();
  g.start('easy');
  g.score = 123;
  g.board.fill(1);
  g.spawn(1);
  assert.equal(g.phase, 'over');
  assert.equal(g.best, 123);
  g.start('expert');
  assert.equal(g.best, 0);
  g.start('easy');
  assert.equal(g.best, 123);
});
test('storage denial still allows starting and finishing', () => {
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw Error('denied');
    },
  });
  assert.doesNotThrow(() => {
    const g = new ClassicGame();
    g.start('normal');
    g.score = 20;
    g.record();
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
});

test('every new piece is fully visible immediately on spawn', () => {
  const game = new ClassicGame();
  for (let id = 0; id < pieces.length; id++) {
    const occupied = cells(game.make(id));
    assert.equal(Math.min(...occupied.map((c) => c.y)), 2);
    assert.ok(occupied.every((c) => c.y >= 2));
  }
});
