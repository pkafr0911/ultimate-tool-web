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

import { Canvas, FabricObject, Image as FabricImage } from 'fabric';

export const applyMaskToFabricObject = (
  canvas: Canvas,
  object: FabricObject,
  maskCanvas: HTMLCanvasElement,
) => {
  if (!(object instanceof FabricImage)) return;

  const imgElement = object.getElement() as HTMLImageElement | HTMLCanvasElement;
  const width = imgElement.width;
  const height = imgElement.height;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d')!;

  // Draw original image
  ctx.drawImage(imgElement, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const maskCtx = maskCanvas.getContext('2d')!;

  const tempMaskCanvas = document.createElement('canvas');
  tempMaskCanvas.width = width;
  tempMaskCanvas.height = height;
  const tempMaskCtx = tempMaskCanvas.getContext('2d')!;
  tempMaskCtx.drawImage(maskCanvas, 0, 0, width, height);
  const maskData = tempMaskCtx.getImageData(0, 0, width, height).data;

  for (let i = 0; i < data.length; i += 4) {
    const maskVal = maskData[i]; // Red channel
    data[i + 3] = maskVal;
  }

  ctx.putImageData(imageData, 0, 0);

  // Create new FabricImage
  const newImg = new FabricImage(tempCanvas);

  // Copy properties
  newImg.set({
    left: object.left,
    top: object.top,
    scaleX: object.scaleX,
    scaleY: object.scaleY,
    angle: object.angle,
    skewX: object.skewX,
    skewY: object.skewY,
    flipX: object.flipX,
    flipY: object.flipY,
    originX: object.originX,
    originY: object.originY,
    opacity: object.opacity,
  });

  // Replace in canvas
  const index = canvas.getObjects().indexOf(object);
  canvas.remove(object);
  canvas.add(newImg);
  canvas.moveObjectTo(newImg, index);
  canvas.setActiveObject(newImg);
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
    data[i + 3] = maskAlpha;
  }

  ctx.putImageData(imageData, 0, 0);
  // history.push(canvas.toDataURL(), label, false); // History handling might differ
};
