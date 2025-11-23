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
  exportCanvasToBlob,
  Kernels,
} from './ImageEditorEngine';

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

export const applyEffects = (
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
    return;
  }

  // Apply convolution effects
  if (blur > 0) {
    const size = blur % 2 === 0 ? blur + 1 : blur;
    applyConvolution(cloned, Kernels.generateBoxBlurKernel(size), size);
  }
  if (gaussian > 0) {
    const r = gaussian;
    applyConvolution(cloned, Kernels.generateGaussianKernel(r), r * 2 + 1);
  }
  if (sharpen > 0) {
    const kernel = Kernels.sharpen.map((v) =>
      v === 5 ? 1 + sharpen * 4 : v === -1 ? -sharpen : v,
    );
    applyConvolution(cloned, kernel, 3);
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

  // Draw final image
  ctx.putImageData(cloned, 0, 0);

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
