import { act, renderHook } from '@testing-library/react';
jest.mock('antd', () => ({ message: { error: jest.fn() } }));
jest.mock('../utils/document', () => ({
  isDocumentLoading: () => false,
  serializeDocument: (c: any) => ({ value: c.value, objects: [] }),
  loadDocument: async (c: any, json: string) => {
    c.value = JSON.parse(json).value;
    c.emit('object:added');
    await Promise.resolve();
  },
}));
const { useHistoryOptimized } = require('../hooks/useHistoryOptimized');
function fakeCanvas() {
  const handlers: Record<string, Set<() => void>> = {};
  return {
    value: 0,
    disposed: false,
    on: (name: string, f: () => void) => {
      (handlers[name] ||= new Set()).add(f);
      return () => handlers[name].delete(f);
    },
    emit: (name: string) => handlers[name]?.forEach((f) => f()),
  };
}
test('initial state, coalesced command, restore guard and redo branch', async () => {
  const c = fakeCanvas();
  const { result } = renderHook(() => useHistoryOptimized(c as any));
  expect(result.current.entries).toHaveLength(1);
  await act(async () => {
    c.value = 1;
    c.emit('object:added');
    c.value = 2;
    c.emit('object:added');
  });
  expect(result.current.entries).toHaveLength(2);
  await act(async () => result.current.undo());
  expect(c.value).toBe(0);
  expect(result.current.entries).toHaveLength(2);
  await act(async () => result.current.redo());
  expect(c.value).toBe(2);
  await act(async () => result.current.undo());
  act(() => {
    c.value = 3;
    result.current.saveState();
  });
  expect(result.current.canRedo).toBe(false);
});
test('history rollover retains independently restorable snapshots', async () => {
  const c = fakeCanvas();
  const { result } = renderHook(() => useHistoryOptimized(c as any, { maxEntries: 5 }));
  for (let i = 1; i <= 60; i++)
    act(() => {
      c.value = i;
      result.current.saveState();
    });
  expect(result.current.entries).toHaveLength(5);
  for (let i = 59; i >= 56; i--) {
    await act(async () => result.current.undo());
    expect(c.value).toBe(i);
  }
  for (let i = 57; i <= 60; i++) {
    await act(async () => result.current.redo());
    expect(c.value).toBe(i);
  }
});
test('same-tick repeated save does not lose prior commands', () => {
  const c = fakeCanvas();
  const { result } = renderHook(() => useHistoryOptimized(c as any));
  act(() => {
    c.value = 1;
    result.current.saveState();
    c.value = 2;
    result.current.saveState();
  });
  expect(result.current.entries.map((e) => JSON.parse(e.snapshot).value)).toEqual([0, 1, 2]);
});
