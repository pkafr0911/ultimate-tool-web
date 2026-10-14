import { Rect, Group, Canvas } from 'fabric';
import {
  cropDocument,
  documentSize,
  serializeDocument,
  setDocumentSize,
  renderDocument,
  loadDocument,
} from '../utils/document';
import { calculateSpline } from '../utils/cameraRawHelpers';
import { rgbToHsl, hslToRgb } from '../utils/hslHelpers';
const mockCanvas = (objects: any[] = []) =>
  ({
    width: 500,
    height: 400,
    viewportTransform: [2, 0, 0, 2, 35, 47],
    getObjects: () => objects,
    discardActiveObject: jest.fn(),
    requestRenderAll: jest.fn(),
    calcViewportBoundaries: jest.fn(),
    toObject: () => ({ objects: objects.map((o) => o.toObject()) }),
  }) as unknown as Canvas;

test('crop translates only top-level objects and preserves group-local coordinates', () => {
  const child = new Rect({ left: 70, top: 50, width: 20, height: 10 });
  const group = new Group([child]);
  const canvas = mockCanvas([group]);
  setDocumentSize(canvas, 320, 180);
  const before = { left: group.left, top: group.top, childLeft: child.left, childTop: child.top };
  cropDocument(canvas, { x: 10, y: 20, width: 100, height: 80 });
  expect(group.left).toBe(before.left - 10);
  expect(group.top).toBe(before.top - 20);
  expect(child.left).toBe(before.childLeft);
  expect(child.top).toBe(before.childTop);
  expect(documentSize(canvas)).toEqual({ width: 100, height: 80 });
});
test('invalid crop leaves objects and document untouched', () => {
  const rect = new Rect({ left: 30 });
  const canvas = mockCanvas([rect]);
  expect(() => cropDocument(canvas, { x: -1, y: 0, width: 20, height: 10 })).toThrow();
  expect(rect.left).toBe(30);
  expect(() => setDocumentSize(canvas, Infinity, 5)).toThrow();
});
test('serialization preserves layer IDs, locks, names and dimensions', () => {
  const rect = new Rect({ width: 5, height: 5, lockMovementX: true, selectable: false });
  rect.set({ uid: 'stable-id', name: 'Test' } as any);
  const canvas = mockCanvas([rect]);
  setDocumentSize(canvas, 320, 180);
  const json = serializeDocument(canvas);
  expect(json.documentWidth).toBe(320);
  expect(json.objects[0]).toMatchObject({
    uid: 'stable-id',
    name: 'Test',
    lockMovementX: true,
    selectable: false,
  });
});
test('export ignores viewport, restores it even on failure, and excludes hidden trim bounds', () => {
  const rect = new Rect({ left: 10, top: 20, width: 30, height: 40, strokeWidth: 0 });
  const hidden = new Rect({ left: 400, width: 100, visible: false });
  const canvas = mockCanvas([rect, hidden]);
  canvas.toCanvasElement = jest.fn(() => {
    expect(canvas.viewportTransform).toEqual([1, 0, 0, 1, 0, 0]);
    throw new Error('failed');
  });
  expect(() => renderDocument(canvas, 1, true)).toThrow('failed');
  expect(canvas.toCanvasElement).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ left: 10, top: 20, width: 30, height: 40 }),
  );
  expect(canvas.viewportTransform).toEqual([2, 0, 0, 2, 35, 47]);
});
test('invalid project does not start replacing live objects', async () => {
  const canvas = mockCanvas();
  canvas.loadFromJSON = jest.fn();
  await expect(loadDocument(canvas, { objects: [], documentWidth: 0 })).rejects.toThrow();
  await expect(loadDocument(canvas, { foo: 'bar' })).rejects.toThrow();
  expect(canvas.loadFromJSON).not.toHaveBeenCalled();
});
test('curves handle empty and duplicate control points without NaN', () => {
  expect(calculateSpline([])[127]).toBe(127);
  const lut = calculateSpline([
    { x: 0, y: 0 },
    { x: 128, y: 80 },
    { x: 128, y: 150 },
    { x: 255, y: 255 },
  ]);
  expect(lut).toHaveLength(256);
  expect(lut.every(Number.isFinite)).toBe(true);
  expect(lut[128]).toBe(150);
});
test.each([
  [255, 0, 0],
  [35, 128, 242],
  [128, 128, 128],
  [0, 0, 0],
])('RGB/HSL round trip %j', (...rgb) => {
  const result = hslToRgb(...rgbToHsl(rgb[0], rgb[1], rgb[2]));
  result.forEach((value, i) => expect(Math.abs(value - rgb[i])).toBeLessThanOrEqual(1));
});

test('pointer conversion accounts for CSS scaling, preview zoom and offset', () => {
  const { getCanvasCoords } = require('../utils/brushHelpers');
  const ref = {
    current: {
      width: 1000,
      height: 500,
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }),
    },
  };
  expect(getCanvasCoords({ clientX: 160, clientY: 120 }, ref, 2, { x: 100, y: 40 })).toEqual({
    x: 100,
    y: 80,
  });
});
test('neutral Camera Raw preserves pixels including fractional alpha', () => {
  const { applyCameraRawPipeline } = require('../utils/cameraRawHelpers');
  const curves = [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ];
  const data = {
    data: new Uint8ClampedArray([128, 64, 32, 128, 0, 0, 0, 0, 255, 255, 255, 255]),
    width: 3,
    height: 1,
  };
  const before = [...data.data];
  applyCameraRawPipeline(data, {
    hsl: {},
    curves: { master: curves, red: curves, green: curves, blue: curves },
    colorGrading: {
      shadows: { h: 0, s: 0, l: 0 },
      midtones: { h: 0, s: 0, l: 0 },
      highlights: { h: 0, s: 0, l: 0 },
      blending: 0.5,
      balance: 0,
      temperature: 0,
      tint: 0,
    },
  });
  expect([...data.data]).toEqual(before);
});

test('manual mask Keep overrides automatic removal; neutral does not alter alpha', () => {
  const { combineMaskAlpha } = require('../utils/effectsHelpers');
  expect(combineMaskAlpha(0, 255)).toBe(255);
  expect(combineMaskAlpha(100, 128)).toBe(100);
  expect(combineMaskAlpha(255, 0)).toBe(0);
  expect(combineMaskAlpha(0, 192)).toBe(129);
});

test('failed asset decoding restores automatic rendering and loading state', async () => {
  const { isDocumentLoading } = require('../utils/document');
  const canvas = mockCanvas();
  canvas.fire = jest.fn() as any;
  canvas.renderOnAddRemove = true;
  canvas.loadFromJSON = jest.fn(async () => {
    canvas.renderOnAddRemove = false;
    throw new Error('bad image');
  });
  await expect(loadDocument(canvas, { objects: [] })).rejects.toThrow('bad image');
  expect(canvas.renderOnAddRemove).toBe(true);
  expect(isDocumentLoading(canvas)).toBe(false);
  expect(canvas.fire).toHaveBeenLastCalledWith('document:loading', { loading: false });
});
test('project data cannot replace viewport or canvas configuration', async () => {
  const canvas = mockCanvas();
  canvas.fire = jest.fn() as any;
  canvas.loadFromJSON = jest.fn(async () => canvas);
  await loadDocument(canvas, {
    objects: [],
    documentWidth: 320,
    documentHeight: 180,
    width: 0,
    viewportTransform: [0, 0, 0, 0, 0, 0],
    renderOnAddRemove: false,
  });
  expect(canvas.loadFromJSON).toHaveBeenCalledWith({ objects: [] }, undefined, expect.anything());
  expect(canvas.viewportTransform).toEqual([2, 0, 0, 2, 35, 47]);
  expect(documentSize(canvas)).toEqual({ width: 320, height: 180 });
});
