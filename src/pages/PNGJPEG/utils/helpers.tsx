import { message } from 'antd';
import {
  applyConvolution,
  applyThresholdAlpha,
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

export const applyBlur = (canvasRef, baseCanvas, blur, history) => {
  if (!canvasRef.current || !baseCanvas) return;

  const ctx = canvasRef.current.getContext('2d')!;
  const baseCtx = baseCanvas.getContext('2d')!;

  const baseData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
  const cloned = cloneImageData(baseData);

  if (blur > 0) {
    const size = blur % 2 === 0 ? blur + 1 : blur;
    const kernel = Kernels.generateBoxBlurKernel(size);
    applyConvolution(cloned, kernel, size);
  }

  ctx.putImageData(cloned, 0, 0);
  history.push(canvasRef.current.toDataURL(), `Blur (size=${blur})`);
};

export const applyGaussian = (canvasRef, baseCanvas, gaussian, history) => {
  if (!canvasRef.current || !baseCanvas) return;

  const ctx = canvasRef.current.getContext('2d')!;
  const baseCtx = baseCanvas.getContext('2d')!;

  const baseData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
  const cloned = cloneImageData(baseData);

  if (gaussian > 0) {
    const radius = gaussian;
    const kernel = Kernels.generateGaussianKernel(radius);
    const size = radius * 2 + 1;
    applyConvolution(cloned, kernel, size);
  }

  ctx.putImageData(cloned, 0, 0);
  history.push(canvasRef.current.toDataURL(), 'Gaussian Blur');
};

export const applySharpen = (canvasRef, baseCanvas, sharpen, history) => {
  if (!canvasRef.current || !baseCanvas) return;

  const ctx = canvasRef.current.getContext('2d')!;
  const baseCtx = baseCanvas.getContext('2d')!;

  const baseData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
  const cloned = cloneImageData(baseData);

  if (sharpen > 0) {
    // sharpen intensity (1–5)
    const amount = sharpen;

    // base sharpen kernel
    //  [  0, -1,  0 ]
    //  [ -1,  5, -1 ]
    //  [  0, -1,  0 ]
    const baseKernel = Kernels.sharpen;

    // dynamic kernel scaling
    const kernel = baseKernel.map((value) => {
      if (value === 5) return 1 + amount * 4; // center
      if (value === -1) return -amount; // neighbors
      return value;
    });

    applyConvolution(cloned, kernel, 3);
  }

  ctx.putImageData(cloned, 0, 0);
  history.push(canvasRef.current.toDataURL(), 'Sharpen');
};

export const applyBGThreshold = (canvasRef, baseCanvas, bgThreshold, history) => {
  if (!canvasRef.current || !baseCanvas) return;

  const ctx = canvasRef.current.getContext('2d')!;
  const baseCtx = baseCanvas.getContext('2d')!;

  const baseData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
  const cloned = cloneImageData(baseData);

  applyThresholdAlpha(cloned, bgThreshold);

  ctx.putImageData(cloned, 0, 0);
  history.push(canvasRef.current.toDataURL(), 'BG Threshold');
};
