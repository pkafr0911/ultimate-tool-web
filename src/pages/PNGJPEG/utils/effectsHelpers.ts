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
