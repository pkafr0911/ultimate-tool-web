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
  Kernels,
} from './ImageEditorEngine';

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
  history: { push: (img: string, label: string, isSetBase: boolean) => void },
  setHistogramData,
) => {
  if (!canvasRef.current || !baseCanvas) return;

  const ctx = canvasRef.current.getContext('2d')!;
  const baseCtx = baseCanvas.getContext('2d')!;

  const BaseImageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);

  // cache original image data once
  if (!cachedBaseImageData) cachedBaseImageData = BaseImageData;
  if (!cachedBaseImageData) return;

  let cloned = cloneImageData(BaseImageData);

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

    if (canvasRef.current) {
      const extracted = extractRGBHistogram(canvasRef.current);
      setHistogramData(extracted);
    }
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
    // Texture: -100 = extreme blur, 0 = no effect, +100 = extreme sharpening
    // At 0, no effect should be visible
    const strength = texture / 100; // -1 to +1
    const center = 1 + strength * 8; // -7 to 9
    const edge = -strength * 2; // 2 to -2
    const detailKernel = [0, edge, 0, edge, center, edge, 0, edge, 0];
    applyConvolution(cloned, detailKernel, 3);
  }
  if (clarity !== 0) {
    // Clarity: -100 = soft/blurry, 0 = no effect, +100 = clear/sharp
    const strength = clarity / 100; // -1 to +1
    const center = 1 + strength * 10; // -9 to 11
    const edge = -strength * 2.5; // 2.5 to -2.5
    const midtoneKernel = [0, edge, 0, edge, center, edge, 0, edge, 0];
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
    history.push(canvasRef.current.toDataURL(), `${historyLabel}`, false);
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

  if (canvasRef.current) {
    const extracted = extractRGBHistogram(canvasRef.current);
    setHistogramData(extracted);
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

  // Reset previous effects so history won't re-detect old ones
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

export const applyInvertColors = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  history: { push: (img: string, label: string, isSetBase: boolean) => void },
) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Invert each RGB channel (keep alpha unchanged)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
    // data[i + 3] stays the same (Alpha)
  }

  ctx.putImageData(imageData, 0, 0);
  history.push(canvas.toDataURL(), 'Invert colors', false);
};

export const applyColorRemoval = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  targetColor: string,
  tolerance: number,
  history: { push: (img: string, label: string, isSetBase: boolean) => void },
  invert: boolean = false,
  feather: number = 0,
) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Parse target color
  const hex = targetColor.replace('#', '');
  const targetR = parseInt(hex.substring(0, 2), 16);
  const targetG = parseInt(hex.substring(2, 4), 16);
  const targetB = parseInt(hex.substring(4, 6), 16);

  // First pass: calculate alpha values based on color distance
  const alphaMap = new Uint8Array(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate color distance
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2),
    );

    const maxDistance = Math.sqrt(255 * 255 * 3);
    const normalizedDistance = distance / maxDistance;
    const threshold = tolerance / 100;

    // Calculate base alpha (0 = remove, 1 = keep)
    let baseAlpha;

    if (feather === 0) {
      // No feathering - hard edge
      baseAlpha = normalizedDistance <= threshold ? 0 : 1;
    } else {
      // Apply feathering - create gradient around the threshold boundary
      // Higher feather = wider gradient range around the edge
      const featherRange = feather / 100;
      const distanceFromThreshold = normalizedDistance - threshold;

      if (distanceFromThreshold < -featherRange) {
        // Far inside selection - fully removed (black in mask)
        baseAlpha = 0;
      } else if (distanceFromThreshold > featherRange) {
        // Far outside selection - fully kept (white in mask)
        baseAlpha = 1;
      } else {
        // In feather zone - smooth gradient from 0 to 1
        baseAlpha = (distanceFromThreshold + featherRange) / (featherRange * 2);
      }
    }

    // Apply invert
    if (invert) {
      baseAlpha = 1 - baseAlpha;
    }

    alphaMap[i / 4] = Math.round(baseAlpha * 255);
  }

  // Second pass: apply alpha values
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = alphaMap[i / 4];
  }

  ctx.putImageData(imageData, 0, 0);
  const label = invert
    ? `Keep color ${targetColor} (tolerance: ${tolerance}%, feather: ${feather}%)`
    : `Remove color ${targetColor} (tolerance: ${tolerance}%, feather: ${feather}%)`;
  history.push(canvas.toDataURL(), label, false);
};
