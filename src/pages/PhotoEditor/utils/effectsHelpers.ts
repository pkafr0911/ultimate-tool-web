export const calculateColorRemovalAlphaMap = (
  data: Uint8ClampedArray,
  targetColor: string,
  tolerance: number,
  invert: boolean = false,
  feather: number = 0,
): Uint8Array => {
  const hex = targetColor.replace('#', '');
  const targetR = parseInt(hex.substring(0, 2), 16);
  const targetG = parseInt(hex.substring(2, 4), 16);
  const targetB = parseInt(hex.substring(4, 6), 16);

  const alphaMap = new Uint8Array(data.length / 4);
  const maxDistance = Math.sqrt(255 * 255 * 3);
  const threshold = tolerance / 100;
  const featherRange = feather / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2),
    );

    const normalizedDistance = distance / maxDistance;

    let baseAlpha;

    if (feather === 0) {
      baseAlpha = normalizedDistance <= threshold ? 0 : 1;
    } else {
      const distanceFromThreshold = normalizedDistance - threshold;

      if (distanceFromThreshold < -featherRange) {
        baseAlpha = 0;
      } else if (distanceFromThreshold > featherRange) {
        baseAlpha = 1;
      } else {
        baseAlpha = (distanceFromThreshold + featherRange) / (featherRange * 2);
      }
    }

    if (invert) {
      baseAlpha = 1 - baseAlpha;
    }

    alphaMap[i / 4] = Math.round(baseAlpha * 255);
  }
  return alphaMap;
};

import { Canvas, FabricObject, FabricImage } from 'fabric';

export const applyMaskToFabricObject = (
  canvas: Canvas,
  object: FabricObject,
  maskCanvas: HTMLCanvasElement,
) => {
  if (!(object instanceof FabricImage)) return;

  // A clipPath multiplies the source alpha; original pixels and filters survive.
  const alpha = document.createElement('canvas');
  alpha.width = object.width;
  alpha.height = object.height;
  const ctx = alpha.getContext('2d')!;
  ctx.drawImage(maskCanvas, 0, 0, alpha.width, alpha.height);
  const pixels = ctx.getImageData(0, 0, alpha.width, alpha.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i + 3] = Math.round(pixels.data[i] * pixels.data[i + 3] / 255);
  }
  ctx.putImageData(pixels, 0, 0);
  object.clipPath = new FabricImage(alpha, { originX: 'center', originY: 'center' });
  object.set('maskSource' as any, maskCanvas.toDataURL());
  object.dirty = true;
  canvas.requestRenderAll();
};

export const applyMaskToCanvas = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  maskCanvas: HTMLCanvasElement,
  history: { push: (img: string, label: string, isSetBase: boolean) => void },
  label: string = 'Apply Mask',
) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  for (let i = 0; i < data.length; i += 4) {
    const maskAlpha = maskData.data[i];
    data[i + 3] = Math.round(data[i + 3] * maskAlpha / 255);
  }

  ctx.putImageData(imageData, 0, 0);
  // history.push(canvas.toDataURL(), label, false); // History handling might differ
};

export const applyBlurResultToCanvas = async (
  canvas: Canvas,
  resultCanvas: HTMLCanvasElement,
  mode: 'overlay' | 'flatten' = 'overlay',
) => {
  const resultImg = new FabricImage(resultCanvas);

  if (mode === 'flatten') {
    // Flatten: clear and replace with single image
    canvas.clear();
    // Assuming resultCanvas has same dimensions as canvas
    // canvas.setDimensions({ width: resultImg.width!, height: resultImg.height! });

    resultImg.set({
      left: 0,
      top: 0,
      originX: 'left',
      originY: 'top',
      selectable: true,
      evented: true,
    });
    canvas.add(resultImg);
  } else {
    // Overlay: add on top, locked
    resultImg.set({
      left: 0,
      top: 0,
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      // This is a complete composite snapshot; replace lower pixels including alpha.
      globalCompositeOperation: 'copy',
      opacity: 1,
    });
    canvas.add(resultImg);
  }

  canvas.requestRenderAll();
};

/** Neutral manual value 128 leaves automatic alpha unchanged; white restores it. */
export const combineMaskAlpha = (automatic: number, manual: number): number => Math.round(
  manual >= 128 ? automatic + (255 - automatic) * (manual - 128) / 127 : automatic * manual / 128,
);
