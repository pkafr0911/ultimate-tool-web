import { Canvas, FabricObject, Rect } from 'fabric';

// Fabric owns editable objects. React holds UI state, never a second copy of layers.
export const CUSTOM_PROPERTIES = [
  'uid',
  'name',
  'lockMovementX',
  'lockMovementY',
  'lockRotation',
  'lockScalingX',
  'lockScalingY',
  'selectable',
  'evented',
  'originalSource',
  'maskSource',
];
FabricObject.customProperties = Array.from(
  new Set([...FabricObject.customProperties, ...CUSTOM_PROPERTIES]),
);
const sizes = new WeakMap<Canvas, { width: number; height: number }>();
const exporting = new WeakSet<Canvas>();
export const isRenderingDocument = (canvas: Canvas) => exporting.has(canvas);
const loading = new WeakSet<Canvas>();
const loadControllers = new WeakMap<Canvas, AbortController>();
export const cancelDocumentLoad = (canvas: Canvas) => loadControllers.get(canvas)?.abort();
export const isDocumentLoading = (canvas: Canvas) => loading.has(canvas);
export const isEditable = (object: FabricObject | null | undefined) =>
  !!object && object.visible && !object.lockMovementX && !object.lockMovementY;
export const documentSize = (canvas: Canvas) =>
  sizes.get(canvas) || { width: canvas.width, height: canvas.height };
export const setDocumentSize = (canvas: Canvas, width: number, height: number) => {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width * height > 64_000_000
  ) {
    throw new Error('Document must contain 1 to 64 million pixels.');
  }
  sizes.set(canvas, { width: Math.round(width), height: Math.round(height) });
  canvas.clipPath = new Rect({
    left: 0,
    top: 0,
    width: Math.round(width),
    height: Math.round(height),
    strokeWidth: 0,
  });
};
export const serializeDocument = (canvas: Canvas) => ({
  ...canvas.toObject(CUSTOM_PROPERTIES),
  photoEditorVersion: 1,
  documentWidth: documentSize(canvas).width,
  documentHeight: documentSize(canvas).height,
});

// Enliven before replacing the live scene: decoding failures leave it intact.
// Fabric loadFromJSON itself enlivens all objects before clearing the scene.
export const loadDocument = async (canvas: Canvas, input: any, signal?: AbortSignal) => {
  if (loading.has(canvas)) throw new Error('A document is already loading.');
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  if (!data || !Array.isArray(data.objects)) throw new Error('Invalid photo editor project.');
  if (data.photoEditorVersion && data.photoEditorVersion !== 1)
    throw new Error('Unsupported project version.');
  const width = data.documentWidth ?? canvas.width;
  const height = data.documentHeight ?? canvas.height;
  if (![width, height].every((v) => Number.isFinite(v) && v >= 1) || width * height > 64_000_000)
    throw new Error('Invalid document dimensions.');
  if (canvas.disposed) throw new Error('The editor has been closed.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  loadControllers.set(canvas, controller);
  // A project contains scene data, not arbitrary mutable Canvas configuration.
  const scene = Object.fromEntries(
    ['version', 'objects', 'background', 'backgroundImage', 'overlay', 'overlayImage', 'clipPath']
      .filter((key) => Object.prototype.hasOwnProperty.call(data, key))
      .map((key) => [key, data[key]]),
  );
  const renderOnAddRemove = canvas.renderOnAddRemove;
  loading.add(canvas);
  (canvas as any).fire('document:loading', { loading: true });
  try {
    await canvas.loadFromJSON(scene, undefined, { signal: controller.signal });
    canvas.discardActiveObject();
    setDocumentSize(canvas, width, height);
    canvas.requestRenderAll();
  } finally {
    // Fabric 6 restores this flag only on successful decoding.
    canvas.renderOnAddRemove = renderOnAddRemove;
    signal?.removeEventListener('abort', abort);
    loadControllers.delete(canvas);
    loading.delete(canvas);
    if (!canvas.disposed) (canvas as any).fire('document:loading', { loading: false });
  }
};

export const renderDocument = (canvas: Canvas, multiplier = 1, trim = false) => {
  const viewport = [...canvas.viewportTransform] as typeof canvas.viewportTransform;
  const size = documentSize(canvas);
  let bounds = { left: 0, top: 0, ...size };
  if (trim) {
    const boxes = canvas
      .getObjects()
      .filter((o) => o.visible && !o.excludeFromExport)
      .map((o) => o.getBoundingRect());
    if (boxes.length) {
      const left = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.left))));
      const top = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.top))));
      const right = Math.min(
        size.width,
        Math.ceil(Math.max(...boxes.map((b) => b.left + b.width))),
      );
      const bottom = Math.min(
        size.height,
        Math.ceil(Math.max(...boxes.map((b) => b.top + b.height))),
      );
      if (right > left && bottom > top)
        bounds = { left, top, width: right - left, height: bottom - top };
    }
  }
  if (
    !Number.isFinite(multiplier) ||
    multiplier <= 0 ||
    bounds.width * bounds.height * multiplier ** 2 > 64_000_000
  )
    throw new Error('Export exceeds the 64 megapixel limit.');
  try {
    exporting.add(canvas);
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    return canvas.toCanvasElement(multiplier, {
      ...bounds,
      filter: (object) => !object.excludeFromExport,
    });
  } finally {
    exporting.delete(canvas);
    canvas.viewportTransform = viewport;
    canvas.calcViewportBoundaries();
  }
};
export const cropDocument = (
  canvas: Canvas,
  area: { x: number; y: number; width: number; height: number },
) => {
  const size = documentSize(canvas);
  const x = Math.round(area.x),
    y = Math.round(area.y),
    width = Math.round(area.width),
    height = Math.round(area.height);
  if (
    ![x, y, width, height].every(Number.isFinite) ||
    x < 0 ||
    y < 0 ||
    width < 1 ||
    height < 1 ||
    x + width > size.width ||
    y + height > size.height
  )
    throw new Error('Crop must be inside the document.');
  canvas.discardActiveObject();
  canvas.getObjects().forEach((object) => {
    object.set({ left: object.left - x, top: object.top - y });
    object.setCoords();
  });
  setDocumentSize(canvas, width, height);
  canvas.requestRenderAll();
};

export const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  !!target.closest(
    'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="slider"], [role="spinbutton"]',
  );
