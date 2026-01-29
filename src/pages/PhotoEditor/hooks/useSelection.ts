import { useCallback, useRef, useState } from 'react';
import { Canvas, FabricImage } from 'fabric';

export type SelectionMode = 'rectangle' | 'ellipse' | 'lasso' | 'polygon' | 'magic-wand';

interface Point {
  x: number;
  y: number;
}

interface SelectionState {
  mode: SelectionMode;
  isActive: boolean;
  points: Point[];
  startPoint: Point | null;
  endPoint: Point | null;
  feather: number;
  tolerance: number; // For magic wand
}

interface UseSelectionOptions {
  defaultFeather?: number;
  defaultTolerance?: number;
}

export const useSelection = (canvas: Canvas | null, options: UseSelectionOptions = {}) => {
  const { defaultFeather = 0, defaultTolerance = 32 } = options;

  const [state, setState] = useState<SelectionState>({
    mode: 'rectangle',
    isActive: false,
    points: [],
    startPoint: null,
    endPoint: null,
    feather: defaultFeather,
    tolerance: defaultTolerance,
  });

  const [selectionMask, setSelectionMask] = useState<HTMLCanvasElement | null>(null);

  const setMode = useCallback((mode: SelectionMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      points: [],
      startPoint: null,
      endPoint: null,
    }));
  }, []);

  const setFeather = useCallback((feather: number) => {
    setState((prev) => ({ ...prev, feather }));
  }, []);

  const setTolerance = useCallback((tolerance: number) => {
    setState((prev) => ({ ...prev, tolerance }));
  }, []);

  const startSelection = useCallback((point: Point) => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      startPoint: point,
      endPoint: point,
      points: prev.mode === 'lasso' || prev.mode === 'polygon' ? [point] : [],
    }));
  }, []);

  const updateSelection = useCallback((point: Point) => {
    setState((prev) => {
      if (!prev.isActive) return prev;

      if (prev.mode === 'lasso') {
        return { ...prev, points: [...prev.points, point] };
      }

      if (prev.mode === 'polygon') {
        // Polygon doesn't update on move
        return prev;
      }

      return { ...prev, endPoint: point };
    });
  }, []);

  const addPolygonPoint = useCallback((point: Point) => {
    setState((prev) => {
      if (prev.mode !== 'polygon') return prev;
      return { ...prev, points: [...prev.points, point] };
    });
  }, []);

  const completeSelection = useCallback(() => {
    if (!canvas) return null;

    const mask = generateMask(canvas, state);
    setSelectionMask(mask);

    setState((prev) => ({
      ...prev,
      isActive: false,
    }));

    return mask;
  }, [canvas, state]);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      points: [],
      startPoint: null,
      endPoint: null,
    }));
    setSelectionMask(null);
  }, []);

  const invertSelection = useCallback(() => {
    if (!selectionMask) return;

    const ctx = selectionMask.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, selectionMask.width, selectionMask.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    ctx.putImageData(imageData, 0, 0);
    setSelectionMask(selectionMask);
  }, [selectionMask]);

  const expandSelection = useCallback(
    (pixels: number) => {
      if (!selectionMask) return;

      // Apply dilation using CSS filter blur and threshold
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = selectionMask.width;
      tempCanvas.height = selectionMask.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.filter = `blur(${pixels}px)`;
      tempCtx.drawImage(selectionMask, 0, 0);

      // Threshold to make it sharp again
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = data[i] > 128 ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }

      tempCtx.putImageData(imageData, 0, 0);

      const ctx = selectionMask.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, selectionMask.width, selectionMask.height);
        ctx.drawImage(tempCanvas, 0, 0);
      }

      setSelectionMask(selectionMask);
    },
    [selectionMask],
  );

  const contractSelection = useCallback(
    (pixels: number) => {
      if (!selectionMask) return;

      invertSelection();
      expandSelection(pixels);
      invertSelection();
    },
    [selectionMask, invertSelection, expandSelection],
  );

  // Magic wand selection
  const magicWandSelect = useCallback(
    (point: Point, tolerance: number = state.tolerance) => {
      if (!canvas) return;

      const selectedImage = canvas.getActiveObject();
      if (!(selectedImage instanceof FabricImage)) return;

      const imgElement = selectedImage.getElement() as HTMLImageElement | HTMLCanvasElement;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width!;
      tempCanvas.height = canvas.height!;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Render canvas to temp
      tempCtx.drawImage(canvas.lowerCanvasEl, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      const x = Math.round(point.x);
      const y = Math.round(point.y);
      const width = tempCanvas.width;

      const targetIdx = (y * width + x) * 4;
      const targetR = data[targetIdx];
      const targetG = data[targetIdx + 1];
      const targetB = data[targetIdx + 2];

      // Create mask
      const mask = document.createElement('canvas');
      mask.width = tempCanvas.width;
      mask.height = tempCanvas.height;
      const maskCtx = mask.getContext('2d');
      if (!maskCtx) return;

      const maskData = maskCtx.createImageData(width, tempCanvas.height);
      const maskPixels = maskData.data;

      // Flood fill algorithm
      const visited = new Set<number>();
      const stack: number[] = [y * width + x];

      while (stack.length > 0) {
        const idx = stack.pop()!;
        if (visited.has(idx)) continue;
        visited.add(idx);

        const i = idx * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const diff = Math.sqrt(
          Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2),
        );

        if (diff <= tolerance) {
          maskPixels[i] = 255;
          maskPixels[i + 1] = 255;
          maskPixels[i + 2] = 255;
          maskPixels[i + 3] = 255;

          const px = idx % width;
          const py = Math.floor(idx / width);

          if (px > 0) stack.push(idx - 1);
          if (px < width - 1) stack.push(idx + 1);
          if (py > 0) stack.push(idx - width);
          if (py < tempCanvas.height - 1) stack.push(idx + width);
        }
      }

      maskCtx.putImageData(maskData, 0, 0);

      // Apply feather
      if (state.feather > 0) {
        applyFeather(maskCtx, mask.width, mask.height, state.feather);
      }

      setSelectionMask(mask);
    },
    [canvas, state.tolerance, state.feather],
  );

  return {
    state,
    selectionMask,
    setMode,
    setFeather,
    setTolerance,
    startSelection,
    updateSelection,
    addPolygonPoint,
    completeSelection,
    clearSelection,
    invertSelection,
    expandSelection,
    contractSelection,
    magicWandSelect,
  };
};

// Helper function to generate mask from selection state
function generateMask(canvas: Canvas, state: SelectionState): HTMLCanvasElement | null {
  const mask = document.createElement('canvas');
  mask.width = canvas.width!;
  mask.height = canvas.height!;
  const ctx = mask.getContext('2d');
  if (!ctx) return null;

  // Fill with black
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, mask.width, mask.height);

  // Draw white selection
  ctx.fillStyle = '#fff';

  const { mode, startPoint, endPoint, points } = state;

  if (mode === 'rectangle' && startPoint && endPoint) {
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const w = Math.abs(endPoint.x - startPoint.x);
    const h = Math.abs(endPoint.y - startPoint.y);
    ctx.fillRect(x, y, w, h);
  } else if (mode === 'ellipse' && startPoint && endPoint) {
    const cx = (startPoint.x + endPoint.x) / 2;
    const cy = (startPoint.y + endPoint.y) / 2;
    const rx = Math.abs(endPoint.x - startPoint.x) / 2;
    const ry = Math.abs(endPoint.y - startPoint.y) / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if ((mode === 'lasso' || mode === 'polygon') && points.length > 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    return null;
  }

  // Apply feather
  if (state.feather > 0) {
    applyFeather(ctx, mask.width, mask.height, state.feather);
  }

  return mask;
}

// Apply feather effect to mask
function applyFeather(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(ctx.canvas, 0, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
}

export default useSelection;
