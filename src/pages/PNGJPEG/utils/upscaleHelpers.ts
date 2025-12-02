import { message } from 'antd';
import { applyConvolution, Kernels, createCanvas } from './ImageEditorEngine';

export type UpscaleQualityOptions = {
  sharpen?: number; // 0-100
  edgeEnhancement?: number; // 0-100
  denoise?: number; // 0-100
};

/**
 * Upscale a canvas progressively and optionally apply quality enhancements.
 * - `scale` can be a number >= 1 (e.g. 2, 3, 4 or 1.5)
 * - `preset` controls imageSmoothingQuality ('low' | 'medium' | 'high')
 * - `qualityOptions` controls post-upscale enhancements (sharpen, edge, denoise)
 */
export const upscaleCanvas = async (
  srcCanvas: HTMLCanvasElement,
  scale: number,
  preset?: 'low' | 'medium' | 'high',
  qualityOptions?: UpscaleQualityOptions,
) => {
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
    dctx.imageSmoothingQuality = preset;
    dctx.clearRect(0, 0, nextW, nextH);
    dctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, nextW, nextH);
    tmp = dest;
    currentScale *= step;
    // yield to event loop to keep UI responsive for large upscales
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 0));
  }

  // Apply quality enhancements if specified
  if (
    qualityOptions &&
    (qualityOptions.sharpen || qualityOptions.edgeEnhancement || qualityOptions.denoise)
  ) {
    const ctx = tmp.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, tmp.width, tmp.height);

    // Apply denoise first (blur to reduce noise)
    if (qualityOptions.denoise && qualityOptions.denoise > 0) {
      const denoiseStrength = qualityOptions.denoise / 100;
      const blurKernel = Kernels.gaussian5;
      const iterations = Math.ceil(denoiseStrength * 2);
      for (let i = 0; i < iterations; i++) {
        applyConvolution(imageData, blurKernel, 5);
      }
    }

    // Apply edge enhancement (unsharp mask variation)
    if (qualityOptions.edgeEnhancement && qualityOptions.edgeEnhancement > 0) {
      const edgeStrength = qualityOptions.edgeEnhancement / 100;
      const edgeKernel = [
        0,
        -1 * edgeStrength,
        0,
        -1 * edgeStrength,
        1 + 4 * edgeStrength,
        -1 * edgeStrength,
        0,
        -1 * edgeStrength,
        0,
      ];
      applyConvolution(imageData, edgeKernel, 3);
    }

    // Apply sharpening
    if (qualityOptions.sharpen && qualityOptions.sharpen > 0) {
      const sharpenStrength = qualityOptions.sharpen / 100;
      const iterations = Math.ceil(sharpenStrength * 3);
      for (let i = 0; i < iterations; i++) {
        applyConvolution(imageData, Kernels.sharpen, 3);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

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
  preset?: 'low' | 'medium' | 'high',
  qualityOptions?: UpscaleQualityOptions,
) => {
  if (!canvasRef.current) return;
  try {
    const newCanvas = await upscaleCanvas(canvasRef.current, factor, preset, qualityOptions);
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
          // base.opacity = 1;
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
