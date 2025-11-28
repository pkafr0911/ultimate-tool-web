// #region Imports
import { message } from 'antd';
import {
  applyBrightnessContrast,
  applyConvolution,
  applyDehaze,
  applyHslAdjustments,
  applyThresholdAlpha,
  applyThresholdAlphaBlack,
  applyToneAdjustments,
  applyVibranceSaturation,
  cloneImageData,
  createCanvas,
  perspectiveTransform,
  exportCanvasToBlob,
  Kernels,
} from './ImageEditorEngine';
import { Tool } from '../components/ImageEditor';
// #endregion

// #region Rotate / Transform Helpers
// rotate
export const rotate = (deg: number, canvasRef, overlayRef, history) => {
  if (!canvasRef.current) return;
  // create temp canvas and rotate
  const src = canvasRef.current;
  const tmp = createCanvas(src.width, src.height);
  const tctx = tmp.getContext('2d')!;
  tctx.drawImage(src, 0, 0);
  const dest = createCanvas(src.height, src.width);
  const dctx = dest.getContext('2d')!;
  dctx.translate(dest.width / 2, dest.height / 2);
  dctx.rotate((deg * Math.PI) / 180);
  dctx.drawImage(tmp, -tmp.width / 2, -tmp.height / 2);
  // replace
  canvasRef.current.width = dest.width;
  canvasRef.current.height = dest.height;
  overlayRef.current!.width = dest.width;
  overlayRef.current!.height = dest.height;
  const wctx = canvasRef.current.getContext('2d')!;
  wctx.clearRect(0, 0, dest.width, dest.height);
  wctx.drawImage(dest, 0, 0);
  history.push(canvasRef.current.toDataURL(), `Rotate ${deg}`);
};
// #endregion

// #region Export / Clipboard
// exportImage
export const exportImage = async (asJpeg = false, canvasRef, onExport) => {
  if (!canvasRef.current) return;
  const blob = await exportCanvasToBlob(
    canvasRef.current,
    asJpeg ? 'image/jpeg' : 'image/png',
    0.92,
  );
  if (onExport) onExport(blob);
  // auto download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = asJpeg ? 'edited.jpg' : 'edited.png';
  a.click();
  URL.revokeObjectURL(url);
  message.success('Exported image');
};

// copy to clipboard (image)
// copy to clipboard (image)
export const copyToClipboard = async (canvasRef) => {
  if (!canvasRef.current) return;
  try {
    const blob = await exportCanvasToBlob(canvasRef.current, 'image/png');
    // @ts-ignore navigator.clipboard
    await (navigator.clipboard as any).write([new ClipboardItem({ 'image/png': blob })]);
    message.success('Image copied to clipboard');
  } catch (err) {
    console.warn('clipboard failed', err);
    message.error('Copy failed (browser may not support)');
  }
};
// #endregion

// #region Flip
// flip
export const flipH = (canvasRef, history) => {
  if (!canvasRef.current) return;
  const ctx = canvasRef.current.getContext('2d')!;
  const tmp = createCanvas(canvasRef.current.width, canvasRef.current.height);
  tmp.getContext('2d')!.drawImage(canvasRef.current, 0, 0);
  ctx.save();
  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  ctx.scale(-1, 1);
  ctx.drawImage(tmp, -canvasRef.current.width, 0);
  ctx.restore();
  history.push(canvasRef.current.toDataURL(), 'Flip horizontal');
};
export const flipV = (canvasRef, history) => {
  if (!canvasRef.current) return;
  const ctx = canvasRef.current.getContext('2d')!;
  const tmp = createCanvas(canvasRef.current.width, canvasRef.current.height);
  tmp.getContext('2d')!.drawImage(canvasRef.current, 0, 0);
  ctx.save();
  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  ctx.scale(1, -1);
  ctx.drawImage(tmp, 0, -canvasRef.current.height);
  ctx.restore();
  history.push(canvasRef.current.toDataURL(), 'Flip vertical');
};
// #endregion

// #region Crop
// Crop: apply cropRect to canvas
export const applyCrop = (canvasRef, overlayRef, cropRect, setCropRect, history) => {
  if (!canvasRef.current || !cropRect) return;
  const c = createCanvas(Math.max(1, Math.round(cropRect.w)), Math.max(1, Math.round(cropRect.h)));
  const ctx = c.getContext('2d')!;
  ctx.drawImage(
    canvasRef.current,
    cropRect.x,
    cropRect.y,
    cropRect.w,
    cropRect.h,
    0,
    0,
    cropRect.w,
    cropRect.h,
  );
  // replace current canvas
  canvasRef.current.width = c.width;
  canvasRef.current.height = c.height;
  overlayRef.current!.width = c.width;
  overlayRef.current!.height = c.height;
  const wctx = canvasRef.current.getContext('2d')!;
  wctx.clearRect(0, 0, c.width, c.height);
  wctx.drawImage(c, 0, 0);
  setCropRect(null);
  history.push(canvasRef.current.toDataURL(), 'Cropped');
};
// #endregion

// #region Color Picker
/** --- COLOR PICKER --- */
export const samplePixel = (e: MouseEvent, canvasRef, zoom) => {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / zoom);
  const y = Math.floor((e.clientY - rect.top) / zoom);
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const p = ctx.getImageData(x, y, 1, 1).data;
  return `#${[p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
// #endregion

// #region Effects / Tone Adjustments
// Store previous effects to detect changes
let previousEffects = {
  // Convolution / blur effects
  blur: 0,
  gaussian: 0,
  sharpen: 0,
  texture: 0,
  clarity: 0,

  // Threshold
  bgThreshold: 0,
  bgThresholdBlack: 0,

  // Brightness / contrast
  brightness: 0,
  contrast: 0,

  // Tone adjustments
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  vibrance: 0,
  saturation: 0,
  dehaze: 0,

  // HSL adjustments (per-color)
  hslAdjustments: {} as Record<string, { h?: number; s?: number; l?: number }>,
};

//cache the base image once
let cachedBaseImageData: ImageData | null = null;

export const applyEffects = async (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  baseCanvas: HTMLCanvasElement | null | undefined,
  {
    blur = 0,
    gaussian = 0,
    sharpen = 0,
    bgThreshold = 0,
    bgThresholdBlack = 0,
    brightness = 0,
    contrast = 0,
    texture = 0,
    clarity = 0,
    highlights = 0,
    shadows = 0,
    whites = 0,
    blacks = 0,
    vibrance = 0,
    saturation = 0,
    dehaze = 0,
    hslAdjustments = {} as Record<string, { h?: number; s?: number; l?: number }>,
  },
  history: { push: (img: string, label: string) => void },
  setHistogramData,
  workerProcessImage?: (imageData: ImageData, effects: any) => Promise<ImageData>,
) => {
  if (!canvasRef.current || !baseCanvas) return;

  const ctx = canvasRef.current.getContext('2d')!;
  const baseCtx = baseCanvas.getContext('2d')!;

  // cache original image data once
  if (!cachedBaseImageData)
    cachedBaseImageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
  if (!cachedBaseImageData) return;

  let cloned = cloneImageData(cachedBaseImageData);

  // Early exit if no effects
  if (
    blur === 0 &&
    gaussian === 0 &&
    sharpen === 0 &&
    texture === 0 &&
    clarity === 0 &&
    bgThreshold === 0 &&
    bgThresholdBlack === 0 &&
    brightness === 0 &&
    contrast === 0 &&
    highlights === 0 &&
    shadows === 0 &&
    whites === 0 &&
    blacks === 0 &&
    vibrance === 0 &&
    saturation === 0 &&
    dehaze === 0 &&
    Object.keys(hslAdjustments).length === 0
  ) {
    ctx.putImageData(cloned, 0, 0);

    //
    if (canvasRef.current) {
      const extracted = extractRGBHistogram(canvasRef.current);
      setHistogramData(extracted);
    }
    return;
  }

  // Use worker if available, otherwise process on main thread
  if (workerProcessImage) {
    try {
      const processedData = await workerProcessImage(cloned, {
        blur,
        gaussian,
        sharpen,
        texture,
        clarity,
        bgThreshold,
        bgThresholdBlack,
        brightness,
        contrast,
        highlights,
        shadows,
        whites,
        blacks,
        vibrance,
        saturation,
        dehaze,
        hslAdjustments,
      });

      ctx.putImageData(processedData, 0, 0);
    } catch (error) {
      console.error('Worker processing failed, falling back to main thread:', error);
      // Fall back to main thread processing with fresh data from base
      if (!cachedBaseImageData) return;
      const freshClone = cloneImageData(cachedBaseImageData);
      const processed = await processEffectsMainThread(freshClone, {
        blur,
        gaussian,
        sharpen,
        texture,
        clarity,
        bgThreshold,
        bgThresholdBlack,
        brightness,
        contrast,
        highlights,
        shadows,
        whites,
        blacks,
        vibrance,
        saturation,
        dehaze,
        hslAdjustments,
      });
      ctx.putImageData(processed, 0, 0);
    }
  } else {
    // Process on main thread (fallback)
    cloned = await processEffectsMainThread(cloned, {
      blur,
      gaussian,
      sharpen,
      texture,
      clarity,
      bgThreshold,
      bgThresholdBlack,
      brightness,
      contrast,
      highlights,
      shadows,
      whites,
      blacks,
      vibrance,
      saturation,
      dehaze,
      hslAdjustments,
    });
    ctx.putImageData(cloned, 0, 0);
  }

  // Detect changes for history
  const changedEffects = Object.entries({
    blur,
    gaussian,
    sharpen,
    texture,
    clarity,
    bgThreshold,
    bgThresholdBlack,
    brightness,
    contrast,
    highlights,
    shadows,
    whites,
    blacks,
    vibrance,
    saturation,
    dehaze,
    hslAdjustments,
  }).filter(([key, value]) => previousEffects[key] !== value);

  if (changedEffects.length > 0) {
    const historyLabel = changedEffects
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ');
    history.push(canvasRef.current.toDataURL(), `${historyLabel}`);
    previousEffects = {
      blur,
      gaussian,
      sharpen,
      texture,
      clarity,
      bgThreshold,
      bgThresholdBlack,
      brightness,
      contrast,
      highlights,
      shadows,
      whites,
      blacks,
      vibrance,
      saturation,
      dehaze,
      hslAdjustments,
    };
  }

  //
  if (canvasRef.current) {
    const extracted = extractRGBHistogram(canvasRef.current);
    setHistogramData(extracted);
  }
};

// Main thread processing fallback (optimized version)
const processEffectsMainThread = async (
  cloned: ImageData,
  {
    blur = 0,
    gaussian = 0,
    sharpen = 0,
    texture = 0,
    clarity = 0,
    bgThreshold = 0,
    bgThresholdBlack = 0,
    brightness = 0,
    contrast = 0,
    highlights = 0,
    shadows = 0,
    whites = 0,
    blacks = 0,
    vibrance = 0,
    saturation = 0,
    dehaze = 0,
    hslAdjustments = {} as Record<string, { h?: number; s?: number; l?: number }>,
  },
): Promise<ImageData> => {
  // Optimize blur with capped values
  if (blur > 0) {
    const size = Math.min(blur % 2 === 0 ? blur + 1 : blur, 15);
    applyConvolution(cloned, Kernels.generateBoxBlurKernel(size), size);
  }
  if (gaussian > 0) {
    const r = Math.min(gaussian, 10);
    applyConvolution(cloned, Kernels.generateGaussianKernel(r), r * 2 + 1);
  }
  // Optimize sharpen with limited passes
  if (sharpen > 0) {
    const passes = Math.min(Math.ceil(sharpen), 3);
    for (let i = 0; i < passes; i++) {
      applyConvolution(cloned, Kernels.sharpen, 3);
    }
  }
  if (texture !== 0) {
    const detailKernel = [0, -1, 0, -1, 5 + texture * 0.05, -1, 0, -1, 0];
    applyConvolution(cloned, detailKernel, 3);
  }
  if (clarity !== 0) {
    const midtoneKernel = [0, -1, 0, -1, 5 + clarity * 0.08, -1, 0, -1, 0];
    applyConvolution(cloned, midtoneKernel, 3);
  }

  // Threshold effects
  if (bgThreshold > 0) applyThresholdAlpha(cloned, bgThreshold);
  if (bgThresholdBlack > 0) applyThresholdAlphaBlack(cloned, bgThresholdBlack);

  // Brightness/Contrast
  if (brightness !== 0 || contrast !== 0) applyBrightnessContrast(cloned, brightness, contrast);

  // Tone adjustments (highlights, shadows, whites, blacks, vibrance, saturation, dehaze)
  if (
    highlights !== 0 ||
    shadows !== 0 ||
    whites !== 0 ||
    blacks !== 0 ||
    vibrance !== 0 ||
    saturation !== 0 ||
    dehaze !== 0
  ) {
    const d = cloned.data;
    for (let i = 0; i < d.length; i += 4) {
      if (dehaze) applyDehaze(d, i, dehaze);
      if (vibrance || saturation) applyVibranceSaturation(d, i, { vibrance, saturation });
    }
    applyToneAdjustments(cloned, {
      highlights,
      shadows,
      whites,
      blacks,
      vibrance,
      saturation,
      clarity,
      dehaze,
    });
  }

  // HSL / Color mixer
  if (Object.keys(hslAdjustments).length > 0) applyHslAdjustments(cloned, hslAdjustments);

  return cloned;
};

export const resetEffectsToBase = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  baseCanvas: HTMLCanvasElement | null | undefined,
  history: { push: (img: string, label: string) => void },
) => {
  if (!canvasRef.current || !baseCanvas || !cachedBaseImageData) return;

  const ctx = canvasRef.current.getContext('2d')!;
  ctx.putImageData(cachedBaseImageData, 0, 0);

  // Reset previous effects so history won’t re-detect old ones
  previousEffects = {
    blur: 0,
    gaussian: 0,
    sharpen: 0,
    texture: 0,
    clarity: 0,
    bgThreshold: 0,
    bgThresholdBlack: 0,
    brightness: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    vibrance: 0,
    saturation: 0,
    dehaze: 0,
    hslAdjustments: {},
  };

  // Add to history
  history.push(canvasRef.current.toDataURL(), 'Reset to base image');
};
// #endregion

// #region Utilities
export const extractRGBHistogram = (canvas: HTMLCanvasElement | null) => {
  if (!canvas)
    return { red: Array(256).fill(0), green: Array(256).fill(0), blue: Array(256).fill(0) };

  const ctx = canvas.getContext('2d');
  if (!ctx) return { red: Array(256).fill(0), green: Array(256).fill(0), blue: Array(256).fill(0) };

  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);

  const red = Array(256).fill(0);
  const green = Array(256).fill(0);
  const blue = Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    red[data[i]]++; // count R value
    green[data[i + 1]]++; // count G value
    blue[data[i + 2]]++; // count B value
  }

  return { red, green, blue };
};
// #endregion

// ---------------- Overlay / Layer Helpers ----------------
// #region Overlay / Layer Helpers
export const addOverlayImage = (
  file: File,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setLayers: React.Dispatch<any>,
  setActiveLayerId: (id: string | null) => void,
  setOverlaySelected: (v: boolean) => void,
  drawOverlay: () => void,
  setTool: React.Dispatch<React.SetStateAction<Tool>>,
) => {
  const img = new Image();
  img.onload = () => {
    const cw = canvasRef.current?.width || img.naturalWidth;
    const ch = canvasRef.current?.height || img.naturalHeight;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const scale = Math.min(1, Math.min(cw / (w * 1.2), ch / (h * 1.2)));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    const x = Math.round((cw - w) / 2);
    const y = Math.round((ch - h) / 2);
    const id = `${Date.now()}_${Math.round(Math.random() * 10000)}`;
    const newLayer = {
      id,
      type: 'image' as const,
      img,
      rect: { x, y, w, h },
      opacity: 1,
      blend: 'source-over' as const,
    } as any;
    setLayers((prev: any) => [...prev, newLayer]);
    setActiveLayerId(id);
    setOverlaySelected(true);
    drawOverlay();

    message.success('Overlay image added');
  };
  img.onerror = () => message.error('Failed to load overlay image');
  img.src = URL.createObjectURL(file);
  setTool('move');
};

export const exportWithOverlay = async (
  asJpeg: boolean,
  canvasRefArg: React.RefObject<HTMLCanvasElement>,
  layers: any[],
  callback?: (blob: Blob) => void,
) => {
  if (!canvasRefArg.current) return;
  const base = canvasRefArg.current;
  const tmp = createCanvas(base.width, base.height);
  const tctx = tmp.getContext('2d')!;
  tctx.clearRect(0, 0, tmp.width, tmp.height);
  tctx.drawImage(base, 0, 0);
  for (const L of layers) {
    try {
      tctx.globalAlpha = L.opacity;
      tctx.globalCompositeOperation = L.blend || 'source-over';
      if (L.type === 'image' && L.img) {
        tctx.drawImage(L.img, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
      } else if (L.type === 'text') {
        // Render text layer
        const fontStyle = L.fontItalic ? 'italic' : 'normal';
        const fontWeight = L.fontWeight || 'normal';
        const fontSize = L.fontSize || 16;
        tctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${L.font || 'Arial'}`;
        tctx.fillStyle = L.textColor || '#000000';
        tctx.textAlign = L.textAlign || 'left';
        tctx.textBaseline = 'top';

        // Draw text
        const lines = (L.text || '').split('\n');
        const lineHeight = fontSize * 1.2;
        let currentY = L.rect.y;
        for (const line of lines) {
          let xPos = L.rect.x;
          if (L.textAlign === 'center') xPos += L.rect.w / 2;
          else if (L.textAlign === 'right') xPos += L.rect.w;

          tctx.fillText(line, xPos, currentY);

          // Draw decoration
          if (L.textDecoration === 'underline') {
            const metrics = tctx.measureText(line);
            tctx.strokeStyle = L.textColor || '#000000';
            tctx.lineWidth = 1;
            tctx.beginPath();
            tctx.moveTo(xPos, currentY + fontSize);
            tctx.lineTo(xPos + metrics.width, currentY + fontSize);
            tctx.stroke();
          } else if (L.textDecoration === 'line-through') {
            const metrics = tctx.measureText(line);
            tctx.strokeStyle = L.textColor || '#000000';
            tctx.lineWidth = 1;
            tctx.beginPath();
            tctx.moveTo(xPos, currentY + fontSize / 2);
            tctx.lineTo(xPos + metrics.width, currentY + fontSize / 2);
            tctx.stroke();
          }
          currentY += lineHeight;
        }
      }
    } catch (err) {
      // ignore
    }
  }
  tctx.globalAlpha = 1;
  tctx.globalCompositeOperation = 'source-over';
  const blob = await new Promise<Blob | null>((res) =>
    tmp.toBlob((b) => res(b), asJpeg ? 'image/jpeg' : 'image/png', 0.92),
  );
  if (blob) {
    if (callback) callback(blob);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asJpeg ? 'edited.jpg' : 'edited.png';
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported image (with overlays)');
  }
};

export const mergeLayerIntoBase = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  layers: any[],
  setLayers: React.Dispatch<any>,
  history: { push: (s: string, label: string) => void },
  id?: string,
) => {
  if (!canvasRef.current) return;
  const toMerge = id ? layers.filter((l) => l.id === id) : layers.slice();
  if (toMerge.length === 0) return;

  const ctx = canvasRef.current.getContext('2d')!;
  for (const L of toMerge) {
    try {
      ctx.save();
      ctx.globalAlpha = L.opacity;
      ctx.globalCompositeOperation = L.blend || 'source-over';

      if (L.type === 'image' && L.img) {
        ctx.drawImage(L.img, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
      } else if (L.type === 'text') {
        // Render text layer
        const fontStyle = L.fontItalic ? 'italic' : 'normal';
        const fontWeight = L.fontWeight || 'normal';
        const fontSize = L.fontSize || 16;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${L.font || 'Arial'}`;
        ctx.fillStyle = L.textColor || '#000000';
        ctx.textAlign = L.textAlign || 'left';
        ctx.textBaseline = 'top';

        const lines = (L.text || '').split('\n');
        const lineHeight = fontSize * 1.2;
        let currentY = L.rect.y;
        for (const line of lines) {
          let xPos = L.rect.x;
          if (L.textAlign === 'center') xPos += L.rect.w / 2;
          else if (L.textAlign === 'right') xPos += L.rect.w;

          ctx.fillText(line, xPos, currentY);

          // Draw decoration
          if (L.textDecoration === 'underline') {
            const metrics = ctx.measureText(line);
            ctx.strokeStyle = L.textColor || '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + fontSize);
            ctx.lineTo(xPos + metrics.width, currentY + fontSize);
            ctx.stroke();
          } else if (L.textDecoration === 'line-through') {
            const metrics = ctx.measureText(line);
            ctx.strokeStyle = L.textColor || '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + fontSize / 2);
            ctx.lineTo(xPos + metrics.width, currentY + fontSize / 2);
            ctx.stroke();
          }
          currentY += lineHeight;
        }
      }
      ctx.restore();
    } catch (err) {
      // ignore
    }
  }
  setLayers((prev) => prev.filter((l: any) => !toMerge.find((m: any) => m.id === l.id)));
  history.push(canvasRef.current.toDataURL(), id ? 'Merge layer' : 'Merge layers');
  message.success('Layer(s) merged into base');
};

export const setLayerOpacity = (setLayers: React.Dispatch<any>, id: string, opacity: number) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, opacity } : L)));

export const setLayerBlend = (
  setLayers: React.Dispatch<any>,
  id: string,
  blend: GlobalCompositeOperation,
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, blend } : L)));

export const moveLayerUp = (setLayers: React.Dispatch<any>, id: string) =>
  setLayers((prev: any) => {
    const idx = prev.findIndex((p: any) => p.id === id);
    if (idx === -1 || idx === prev.length - 1) return prev;
    const copy = prev.slice();
    const tmp = copy[idx + 1];
    copy[idx + 1] = copy[idx];
    copy[idx] = tmp;
    return copy;
  });

export const moveLayerDown = (setLayers: React.Dispatch<any>, id: string) =>
  setLayers((prev: any) => {
    const idx = prev.findIndex((p: any) => p.id === id);
    if (idx <= 0) return prev;
    const copy = prev.slice();
    const tmp = copy[idx - 1];
    copy[idx - 1] = copy[idx];
    copy[idx] = tmp;
    return copy;
  });

export const deleteLayer = (
  setLayers: React.Dispatch<any>,
  id: string,
  setActiveLayerId?: (id: string | null) => void,
) =>
  setLayers((prev: any) => {
    const copy = prev.filter((p: any) => p.id !== id);
    if (setActiveLayerId) setActiveLayerId(copy.length ? copy[copy.length - 1].id : null);
    return copy;
  });

export const selectLayer = (setActiveLayerId: (id: string | null) => void, id: string) => {
  setActiveLayerId(id);
};

//#region Upscale
/**
 * Upscale a canvas progressively and optionally apply a sharpening pass to improve perceived clarity.
 * - `scale` can be a number >= 1 (e.g. 2, 3, 4 or 1.5)
 * - Note: enhancement option removed; upscaling only performs progressive resampling
 */
export const upscaleCanvas = async (srcCanvas: HTMLCanvasElement, scale: number) => {
  if (!srcCanvas || scale <= 1) return srcCanvas;

  // progressive upscaling in steps (max 2x per step) to reduce artifacts
  let tmp: HTMLCanvasElement = srcCanvas;
  const targetScale = scale;
  let currentScale = 1;

  while (currentScale < targetScale) {
    const step = Math.min(2, targetScale / currentScale);
    const nextW = Math.max(1, Math.round(tmp.width * step));
    const nextH = Math.max(1, Math.round(tmp.height * step));
    const dest = createCanvas(nextW, nextH);
    const dctx = dest.getContext('2d')!;
    dctx.imageSmoothingEnabled = true;
    // @ts-ignore - lib.dom types allow 'low'|'medium'|'high' but be defensive
    dctx.imageSmoothingQuality = 'high';
    dctx.clearRect(0, 0, nextW, nextH);
    dctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, nextW, nextH);
    tmp = dest;
    currentScale *= step;
    // yield to event loop to keep UI responsive for large upscales
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 0));
  }

  // Enhancement removed: return the upscaled canvas as-is

  return tmp;
};

/**
 * High-level helper: upscale the visible canvas, replace working canvas and baseCanvas,
 * update base overlay layer, and enable upscaledMode.
 * This encapsulates the safe Image.onload swap used by the editor.
 */
export const applyUpscale = async (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  overlayRef: React.RefObject<HTMLCanvasElement>,
  history: any,
  setBaseCanvas: (c: HTMLCanvasElement) => void,
  setLayers: React.Dispatch<any>,
  drawOverlay: () => void,
  factor: number,
) => {
  if (!canvasRef.current) return;
  try {
    const newCanvas = await upscaleCanvas(canvasRef.current, factor);
    if (!newCanvas) return;

    const dataUrl = newCanvas.toDataURL();
    const img = new Image();
    // temporarily hide overlay while swapping to avoid covering canvas with an unloaded image
    const prevDisplay = overlayRef.current ? overlayRef.current.style.display : '';
    if (overlayRef.current) overlayRef.current.style.display = 'none';

    img.onload = () => {
      try {
        const c2 = document.createElement('canvas');
        c2.width = img.naturalWidth;
        c2.height = img.naturalHeight;
        const c2ctx = c2.getContext('2d')!;
        c2ctx.drawImage(img, 0, 0);
        try {
          setBaseCanvas(c2);
        } catch (_e) {}

        // replace working canvas
        canvasRef.current!.width = c2.width;
        canvasRef.current!.height = c2.height;
        if (overlayRef.current) {
          overlayRef.current.width = c2.width;
          overlayRef.current.height = c2.height;
        }
        const ctx = canvasRef.current!.getContext('2d')!;
        ctx.clearRect(0, 0, c2.width, c2.height);
        ctx.drawImage(img, 0, 0);

        // push history after successful draw
        history.push(canvasRef.current!.toDataURL(), `Upscaled ${factor}x`);

        // set base overlay opacity to 1 and enable syncing mode, and update base overlay image src
        setLayers((prev) => {
          if (!prev[0]) return prev;
          const copy = prev.slice();
          const base = { ...(copy[0] as any) } as any;
          base.opacity = 1;
          if (base.img) base.img.src = dataUrl;
          base.rect = { x: 0, y: 0, w: c2.width, h: c2.height };
          copy[0] = base;
          return copy;
        });

        // restore overlay display and redraw
        if (overlayRef.current) overlayRef.current.style.display = prevDisplay || '';
        drawOverlay();
        message.success(`Upscaled ${factor}x`);
      } catch (err) {
        console.error('Failed to finalize upscale draw', err);
        if (overlayRef.current) overlayRef.current.style.display = prevDisplay || '';
        message.error('Upscale failed to render');
      }
    };
    img.onerror = (e) => {
      if (overlayRef.current) overlayRef.current.style.display = prevDisplay || '';
      console.error('Upscaled image failed to load', e);
      message.error('Upscaled image failed to load');
    };
    img.src = dataUrl;
  } catch (err) {
    console.error('Upscale failed', err);
    message.error('Upscale failed');
  }
};
//#endregion

// #region Text Layer Helpers
/**
 * Add a new text layer to the canvas.
 */
export const addTextLayer = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setLayers: React.Dispatch<any>,
  setActiveLayerId: (id: string | null) => void,
  setOverlaySelected: (v: boolean) => void,
  drawOverlay: () => void,
  textProps: {
    text: string;
    font: string;
    fontSize: number;
    fontWeight: any;
    fontItalic: boolean;
    textDecoration: 'none' | 'underline' | 'line-through';
    textColor: string;
    textAlign: 'left' | 'center' | 'right';
  },
  // optional position to place the text (canvas coordinates)
  pos?: { x: number; y: number },
) => {
  if (!textProps.text.trim()) {
    message.warning('Please enter text first');
    return;
  }

  const cw = canvasRef.current?.width || 400;
  const ch = canvasRef.current?.height || 300;
  const x = pos ? Math.round(pos.x) : Math.round(cw / 4);
  const y = pos ? Math.round(pos.y) : Math.round(ch / 4);
  const id = `text_${Date.now()}_${Math.round(Math.random() * 10000)}`;

  const newLayer = {
    id,
    type: 'text' as const,
    rect: { x, y, w: Math.min(300, cw / 2), h: textProps.fontSize + 20 },
    opacity: 1,
    blend: 'source-over' as const,
    text: textProps.text,
    font: textProps.font,
    fontSize: textProps.fontSize,
    fontWeight: textProps.fontWeight,
    fontItalic: textProps.fontItalic,
    textDecoration: textProps.textDecoration,
    textColor: textProps.textColor,
    textAlign: textProps.textAlign,
  } as any;

  setLayers((prev: any) => [...prev, newLayer]);
  setActiveLayerId(id);
  setOverlaySelected(true);
  drawOverlay();
  message.success('Text layer added');
};

/**
 * Update text content of a layer.
 */
export const setLayerText = (setLayers: React.Dispatch<any>, id: string, text: string) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, text } : L)));

/**
 * Update font of a text layer.
 */
export const setLayerFont = (setLayers: React.Dispatch<any>, id: string, font: string) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, font } : L)));

/**
 * Update font size of a text layer.
 */
export const setLayerFontSize = (setLayers: React.Dispatch<any>, id: string, fontSize: number) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, fontSize } : L)));

/**
 * Update font weight of a text layer.
 */
export const setLayerFontWeight = (setLayers: React.Dispatch<any>, id: string, fontWeight: any) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, fontWeight } : L)));

/**
 * Toggle italic of a text layer.
 */
export const setLayerFontItalic = (
  setLayers: React.Dispatch<any>,
  id: string,
  fontItalic: boolean,
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, fontItalic } : L)));

/**
 * Update text decoration of a text layer.
 */
export const setLayerTextDecoration = (
  setLayers: React.Dispatch<any>,
  id: string,
  textDecoration: 'none' | 'underline' | 'line-through',
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, textDecoration } : L)));

/**
 * Update text color of a text layer.
 */
export const setLayerTextColor = (setLayers: React.Dispatch<any>, id: string, textColor: string) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, textColor } : L)));

/**
 * Update text align of a text layer.
 */
export const setLayerTextAlign = (
  setLayers: React.Dispatch<any>,
  id: string,
  textAlign: 'left' | 'center' | 'right',
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, textAlign } : L)));
// #endregion
export const drawOverlayHelper = (
  overlayRef: React.RefObject<HTMLCanvasElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  params: {
    zoom: number;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    rulerPoints: { x1: number; y1: number; x2: number; y2: number } | null;
    perspectivePoints: number[] | null;
    hoverColor: { x: number; y: number; color: string } | null;
    tool: any;
    drawColor: string;
    drawLineWidth: number;
    layers: any[];
    overlaySelected: boolean;
    activeLayerId?: string | null;
  },
) => {
  if (!overlayRef.current || !canvasRef.current) return;
  const {
    zoom,
    cropRect,
    rulerPoints,
    perspectivePoints,
    hoverColor,
    tool,
    drawColor,
    drawLineWidth,
    layers,
    overlaySelected,
    activeLayerId,
  } = params;

  const ctx = overlayRef.current.getContext('2d')!;
  ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

  // Crop rectangle
  if (cropRect) {
    ctx.save();
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    ctx.restore();
  }

  // Ruler
  if (rulerPoints) {
    ctx.save();
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rulerPoints.x1, rulerPoints.y1);
    ctx.lineTo(rulerPoints.x2, rulerPoints.y2);
    ctx.stroke();
    ctx.restore();
  }

  // Perspective points
  if (perspectivePoints) {
    const p = perspectivePoints;
    ctx.save();
    const validPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i += 2) {
      const px = p[i];
      const py = p[i + 1];
      if (!isNaN(px) && !isNaN(py)) validPoints.push({ x: px, y: py });
    }

    if (validPoints.length >= 2) {
      ctx.strokeStyle = 'rgba(0,255,0,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(validPoints[0].x, validPoints[0].y);
      for (let i = 1; i < validPoints.length; i++) ctx.lineTo(validPoints[i].x, validPoints[i].y);
      if (validPoints.length === 4) ctx.closePath();
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,255,0,0.9)';
    for (let i = 0; i < 8; i += 2) {
      const x = p[i];
      const y = p[i + 1];
      if (!isNaN(x) && !isNaN(y)) ctx.fillRect(x - 5, y - 5, 10, 10);
    }
    ctx.restore();
  }

  // Color hover
  if (hoverColor && tool === 'color') {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (hoverColor.x - rect.left) / zoom;
    const canvasY = (hoverColor.y - rect.top) / zoom;
    ctx.save();
    ctx.strokeStyle = hoverColor.color;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 8 / zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // draw layers
  for (const L of layers) {
    try {
      ctx.save();
      ctx.globalAlpha = L.opacity;
      ctx.globalCompositeOperation = L.blend || 'source-over';

      if (L.type === 'image' && L.img) {
        ctx.drawImage(L.img, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
      } else if (L.type === 'text') {
        // Render text layer in overlay
        const fontStyle = L.fontItalic ? 'italic' : 'normal';
        const fontWeight = L.fontWeight || 'normal';
        const fontSize = L.fontSize || 16;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${L.font || 'Arial'}`;
        ctx.fillStyle = L.textColor || '#000000';
        ctx.textAlign = L.textAlign || 'left';
        ctx.textBaseline = 'top';

        const lines = (L.text || '').split('\n');
        const lineHeight = fontSize * 1.2;
        let currentY = L.rect.y;
        for (const line of lines) {
          let xPos = L.rect.x;
          if (L.textAlign === 'center') xPos += L.rect.w / 2;
          else if (L.textAlign === 'right') xPos += L.rect.w;

          ctx.fillText(line, xPos, currentY);

          // Draw decoration
          if (L.textDecoration === 'underline') {
            const metrics = ctx.measureText(line);
            ctx.strokeStyle = L.textColor || '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + fontSize);
            ctx.lineTo(xPos + metrics.width, currentY + fontSize);
            ctx.stroke();
          } else if (L.textDecoration === 'line-through') {
            const metrics = ctx.measureText(line);
            ctx.strokeStyle = L.textColor || '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + fontSize / 2);
            ctx.lineTo(xPos + metrics.width, currentY + fontSize / 2);
            ctx.stroke();
          }
          currentY += lineHeight;
        }
      }
      ctx.restore();
    } catch (err) {
      // ignore draw errors per layer
    }
  }

  // draw selection for active layer on top
  if (overlaySelected && activeLayerId) {
    const L = layers.find((x: any) => x.id === activeLayerId);
    if (L) {
      const r = L.rect;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,165,0,0.95)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,165,0,0.95)';
      const size = Math.max(6 / Math.max(1, zoom), 6);
      const half = size / 2;
      const corners = [
        [r.x, r.y],
        [r.x + r.w, r.y],
        [r.x, r.y + r.h],
        [r.x + r.w, r.y + r.h],
      ];
      corners.forEach(([cx, cy]) => ctx.fillRect(cx - half, cy - half, size, size));
      ctx.restore();
    }
  }

  // draw brush hover
  if (hoverColor && tool === 'draw') {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (hoverColor.x - rect.left) / zoom;
    const canvasY = (hoverColor.y - rect.top) / zoom;
    ctx.save();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, drawLineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

// #endregion

// #region Perspective Helper
export const perspectiveApplyHelper = async (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  overlayRef: React.RefObject<HTMLCanvasElement>,
  perspectivePointsRef: React.MutableRefObject<number[] | null>,
  history: { push: (img: string, label: string) => void },
  setShowPerspectiveModal: (v: boolean) => void,
  drawOverlay: () => void,
) => {
  if (!canvasRef.current || !perspectivePointsRef.current) {
    message.warning('No perspective points defined.');
    return;
  }

  const p = perspectivePointsRef.current;
  const srcPoints: [number, number][] = [];
  for (let i = 0; i < 8; i += 2) {
    const x = p[i];
    const y = p[i + 1];
    if (!isNaN(x) && !isNaN(y)) srcPoints.push([x, y]);
  }

  if (srcPoints.length !== 4) {
    message.error('Please select 4 corner points before applying perspective correction.');
    return;
  }

  const orderPointsClockwise = (pts: [number, number][]) => {
    const cx = pts.reduce((s, r) => s + r[0], 0) / pts.length;
    const cy = pts.reduce((s, r) => s + r[1], 0) / pts.length;

    const sorted = pts
      .map((pt) => ({ pt, angle: Math.atan2(pt[1] - cy, pt[0] - cx) }))
      .sort((a, b) => a.angle - b.angle)
      .map((o) => o.pt as [number, number]);

    let area = 0;
    for (let i = 0; i < sorted.length; i++) {
      const [x1, y1] = sorted[i];
      const [x2, y2] = sorted[(i + 1) % sorted.length];
      area += x1 * y2 - x2 * y1;
    }
    if (area > 0) sorted.reverse();

    let tlIndex = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (
        sorted[i][1] < sorted[tlIndex][1] ||
        (sorted[i][1] === sorted[tlIndex][1] && sorted[i][0] < sorted[tlIndex][0])
      ) {
        tlIndex = i;
      }
    }
    return Array.from(
      { length: sorted.length },
      (_, i) => sorted[(tlIndex + i) % sorted.length],
    ) as any;
  };

  try {
    const ordered = orderPointsClockwise(srcPoints);
    const srcFlat: [number, number, number, number, number, number, number, number] = [
      Math.round(ordered[0][0]),
      Math.round(ordered[0][1]),
      Math.round(ordered[1][0]),
      Math.round(ordered[1][1]),
      Math.round(ordered[2][0]),
      Math.round(ordered[2][1]),
      Math.round(ordered[3][0]),
      Math.round(ordered[3][1]),
    ];

    const destCanvas = perspectiveTransform(
      canvasRef.current!,
      srcFlat,
      canvasRef.current!.width,
      canvasRef.current!.height,
    );

    canvasRef.current.width = destCanvas.width;
    canvasRef.current.height = destCanvas.height;
    overlayRef.current!.width = destCanvas.width;
    overlayRef.current!.height = destCanvas.height;

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
    ctx.drawImage(destCanvas, 0, 0);

    history.push(canvasRef.current.toDataURL(), 'Perspective corrected');

    perspectivePointsRef.current = null;
    setShowPerspectiveModal(false);
    drawOverlay();
    message.success('Perspective correction applied.');
  } catch (err) {
    console.error('Perspective transform failed', err);
    message.error('Failed to apply perspective correction.');
  }
};
//#endregion

//#region Text Editor Overlay
// Create inline textarea editor for text placement and editing
type CreateTextEditorParams = {
  canvasX: number;
  canvasY: number;
  canvasRect: DOMRect;
  containerRef: React.RefObject<HTMLDivElement>;
  inlineEditorRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  zoom: number;
  initial?: string;
  layerId?: string;
  layer?: any;
  textColor?: string;
  textFont?: string;
  textFontSize?: number;
  textWeight?: any;
  textItalic?: boolean;
  onCommit: (value: string) => void;
  onCancel?: () => void;
};

export const createTextEditorOverlay = (params: CreateTextEditorParams) => {
  const {
    canvasX,
    canvasY,
    canvasRect,
    containerRef,
    inlineEditorRef,
    zoom,
    initial = '',
    layerId,
    layer,
    textColor = '#000',
    textFont = 'Arial',
    textFontSize = 16,
    textWeight = 'normal',
    textItalic = false,
    onCommit,
    onCancel,
  } = params;

  // remove any existing editor
  if (inlineEditorRef.current) {
    inlineEditorRef.current.remove();
    inlineEditorRef.current = null;
  }

  const cont = containerRef.current;
  const contRect = cont ? cont.getBoundingClientRect() : { left: 0, top: 0 };
  const clientLeft = canvasRect.left + canvasX * zoom;
  const clientTop = canvasRect.top + canvasY * zoom;
  const left = clientLeft - contRect.left;
  const top = clientTop - contRect.top;

  const ta = document.createElement('textarea');
  ta.value = initial;
  ta.style.position = 'absolute';
  ta.style.left = `${left}px`;
  ta.style.top = `${top}px`;
  ta.style.zIndex = '10000';
  ta.style.minWidth = '60px';
  ta.style.minHeight = '24px';
  ta.style.background = 'transparent';
  ta.style.border = '1px dashed rgba(0,0,0,0.4)';
  ta.style.color = (layer && layer.textColor) || textColor || '#000';
  ta.style.fontFamily = (layer && layer.font) || textFont || 'Arial';
  const fontSizeValue = (layer && layer.fontSize) || textFontSize || 16;
  ta.style.fontSize = `${fontSizeValue * zoom}px`;
  ta.style.fontWeight = String((layer && layer.fontWeight) || textWeight || 'normal');
  ta.style.fontStyle = (layer && layer.fontItalic) || textItalic ? 'italic' : 'normal';
  ta.style.resize = 'both';
  ta.style.outline = 'none';
  ta.style.padding = '4px';
  ta.placeholder = 'Type text and press Enter';

  const doCommit = () => {
    onCommit(ta.value || '');
    ta.remove();
    inlineEditorRef.current = null;
  };

  const doCancel = () => {
    ta.remove();
    inlineEditorRef.current = null;
    if (onCancel) onCancel();
  };

  ta.addEventListener('keydown', (ev) => {
    if (ev.shiftKey && ev.key === 'Enter') return;
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      doCommit();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      doCancel();
    }
  });

  ta.addEventListener('blur', () => {
    doCommit();
  });

  const appendToContainer = () => {
    try {
      if (cont) cont.appendChild(ta);
      else throw new Error('no container');
    } catch (err) {
      console.warn('[DEBUG] append to container failed, will fallback to body', err);
      appendToBody();
      return;
    }
    inlineEditorRef.current = ta;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    // quick sanity check: if element seems invisible, fallback
    requestAnimationFrame(() => {
      try {
        const r = ta.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) {
          console.warn('[DEBUG] appended editor has zero size; falling back to body');
          ta.remove();
          appendToBody();
        }
      } catch (e) {
        // ignore
      }
    });
  };

  const appendToBody = () => {
    const fixedLeft = clientLeft;
    const fixedTop = clientTop;
    ta.style.position = 'fixed';
    ta.style.left = `${fixedLeft}px`;
    ta.style.top = `${fixedTop}px`;
    ta.style.zIndex = '200000';
    document.body.appendChild(ta);
    inlineEditorRef.current = ta;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    console.log('[DEBUG] appended editor to document.body at', { fixedLeft, fixedTop });
  };

  // Try append to container first; fallback to body when necessary
  if (cont) appendToContainer();
  else appendToBody();
};
//#endregion
