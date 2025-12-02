import { message } from 'antd';
import { createCanvas } from './ImageEditorEngine';

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

// #region Export / Clipboard
// exportImage
export const exportImage = async (asJpeg = false, canvasRef, onExport) => {
  if (!canvasRef.current) return;
  const blob = await new Promise<Blob | null>((res) =>
    canvasRef.current!.toBlob((b) => res(b), asJpeg ? 'image/jpeg' : 'image/png', 0.92),
  );
  if (!blob) return;
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
    const blob = await new Promise<Blob | null>((res) =>
      canvasRef.current!.toBlob((b) => res(b), 'image/png'),
    );
    if (!blob) return;
    // @ts-ignore navigator.clipboard
    await (navigator.clipboard as any).write([new ClipboardItem({ 'image/png': blob })]);
    message.success('Image copied to clipboard');
  } catch (err) {
    console.warn('clipboard failed', err);
    message.error('Copy failed (browser may not support)');
  }
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
