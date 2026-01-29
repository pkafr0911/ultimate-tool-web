// WebWorker for heavy image processing operations
// This worker handles OpenCV blur, Camera Raw filters, and large canvas operations
// to prevent blocking the main thread

import { CameraRawSettings, CurvePoint } from '../utils/cameraRawHelpers';

export type WorkerMessageType =
  | 'APPLY_BLUR'
  | 'APPLY_CAMERA_RAW'
  | 'APPLY_HSL'
  | 'APPLY_CURVES'
  | 'PROCESS_IMAGE';

export interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  payload: any;
}

export interface WorkerResponse {
  type: WorkerMessageType;
  id: string;
  success: boolean;
  data?: ImageData;
  error?: string;
}

// Helper functions for color conversion (duplicated for worker context)
const clamp = (value: number, min = 0, max = 255): number =>
  Math.max(min, Math.min(max, Math.round(value)));

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Color ranges for HSL adjustments
const colorRanges = [
  { name: 'red', range: [345, 15] as [number, number] },
  { name: 'orange', range: [15, 45] as [number, number] },
  { name: 'yellow', range: [45, 75] as [number, number] },
  { name: 'green', range: [75, 165] as [number, number] },
  { name: 'cyan', range: [165, 195] as [number, number] },
  { name: 'blue', range: [195, 255] as [number, number] },
  { name: 'purple', range: [255, 285] as [number, number] },
  { name: 'magenta', range: [285, 345] as [number, number] },
];

// Spline calculation for curves
const calculateSpline = (points: CurvePoint[]): number[] => {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  if (sorted[0].x > 0) sorted.unshift({ x: 0, y: sorted[0].y });
  if (sorted[sorted.length - 1].x < 255) sorted.push({ x: 255, y: sorted[sorted.length - 1].y });

  const xs = sorted.map((p) => p.x);
  const ys = sorted.map((p) => p.y);
  const n = xs.length;

  const dys: number[] = [];
  const dxs: number[] = [];
  const ms: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    const dy = ys[i + 1] - ys[i];
    dxs.push(dx);
    dys.push(dy);
    ms.push(dy / dx);
  }

  const c1s: number[] = [ms[0]];
  for (let i = 0; i < n - 2; i++) {
    const m = ms[i];
    const mNext = ms[i + 1];
    if (m * mNext <= 0) {
      c1s.push(0);
    } else {
      const dx = dxs[i];
      const dxNext = dxs[i + 1];
      const common = dx + dxNext;
      c1s.push((3 * common) / ((common + dxNext) / m + (common + dx) / mNext));
    }
  }
  c1s.push(ms[ms.length - 1]);

  const lut: number[] = new Array(256).fill(0);
  for (let i = 0; i < n - 1; i++) {
    const xStart = xs[i];
    const xEnd = xs[i + 1];
    const yStart = ys[i];
    const yEnd = ys[i + 1];
    const m1 = c1s[i];
    const m2 = c1s[i + 1];
    const dx = xEnd - xStart;

    for (let x = xStart; x <= xEnd; x++) {
      if (x >= 256) break;
      const t = (x - xStart) / dx;
      const t2 = t * t;
      const t3 = t2 * t;

      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      const y = h00 * yStart + h10 * dx * m1 + h01 * yEnd + h11 * dx * m2;
      lut[Math.round(x)] = clamp(Math.round(y));
    }
  }
  return lut;
};

// Apply Camera Raw pipeline
const applyCameraRawPipeline = (imageData: ImageData, settings: CameraRawSettings): ImageData => {
  const data = imageData.data;
  const { hsl, curves, colorGrading } = settings;

  const masterLut = calculateSpline(curves.master);
  const redLut = calculateSpline(curves.red);
  const greenLut = calculateSpline(curves.green);
  const blueLut = calculateSpline(curves.blue);

  const shadowRgb = hslToRgb(
    colorGrading.shadows.h / 360,
    colorGrading.shadows.s,
    colorGrading.shadows.l * 2,
  );
  const midtoneRgb = hslToRgb(
    colorGrading.midtones.h / 360,
    colorGrading.midtones.s,
    colorGrading.midtones.l * 2,
  );
  const highlightRgb = hslToRgb(
    colorGrading.highlights.h / 360,
    colorGrading.highlights.s,
    colorGrading.highlights.l * 2,
  );

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply curves
    r = redLut[r];
    g = greenLut[g];
    b = blueLut[b];
    r = masterLut[r];
    g = masterLut[g];
    b = masterLut[b];

    // Apply HSL adjustments
    let [h, s, l] = rgbToHsl(r, g, b);
    let deg = (h * 360 + 360) % 360;

    const entry = colorRanges.find(({ range }) => {
      const [start, end] = range;
      if (start <= end) return deg >= start && deg <= end;
      return deg >= start || deg <= end;
    });

    if (entry) {
      const adj = hsl[entry.name];
      if (adj) {
        const [startRaw, endRaw] = entry.range;
        let start = startRaw;
        let end = endRaw;
        if (start > end) end += 360;

        let degNorm = deg;
        if (degNorm < start) degNorm += 360;

        if (adj.h !== 0) {
          let newDeg = degNorm + adj.h;
          if (newDeg < start) newDeg = start;
          if (newDeg > end) newDeg = end;
          deg = ((newDeg % 360) + 360) % 360;
          h = deg / 360;
        }
        if (adj.s !== 0) {
          const satPercent = Math.abs(adj.s) <= 1 ? adj.s * 100 : adj.s;
          s = clamp01(s * (1 + satPercent / 100));
        }
        if (adj.l !== 0) {
          const lumPercent = Math.abs(adj.l) <= 1 ? adj.l * 100 : adj.l;
          l = clamp01(l * (1 + lumPercent / 100));
        }
        [r, g, b] = hslToRgb(h, s, l);
      } else {
        [r, g, b] = hslToRgb(h, s, l);
      }
    }

    // Apply color grading based on luminance
    const luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const blending = colorGrading.blending / 100;
    const balance = (colorGrading.balance + 100) / 200;

    // Shadows (low luma), Midtones (mid luma), Highlights (high luma)
    const shadowWeight = Math.max(0, 1 - luma * 2) * blending;
    const highlightWeight = Math.max(0, (luma - 0.5) * 2) * blending;
    const midtoneWeight = (1 - Math.abs(luma - 0.5) * 2) * blending;

    r = clamp(
      r +
        shadowRgb[0] * shadowWeight +
        midtoneRgb[0] * midtoneWeight +
        highlightRgb[0] * highlightWeight,
    );
    g = clamp(
      g +
        shadowRgb[1] * shadowWeight +
        midtoneRgb[1] * midtoneWeight +
        highlightRgb[1] * highlightWeight,
    );
    b = clamp(
      b +
        shadowRgb[2] * shadowWeight +
        midtoneRgb[2] * midtoneWeight +
        highlightRgb[2] * highlightWeight,
    );

    // Apply temperature and tint
    const temp = colorGrading.temperature / 100;
    const tint = colorGrading.tint / 100;

    r = clamp(r + temp * 30);
    b = clamp(b - temp * 30);
    g = clamp(g + tint * 20);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  return imageData;
};

// Gaussian blur implementation (for when OpenCV is not available in worker)
const applyGaussianBlur = (imageData: ImageData, radius: number): ImageData => {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);

  // Create Gaussian kernel
  const kernelSize = Math.max(1, Math.floor(radius)) * 2 + 1;
  const sigma = radius / 3;
  const kernel: number[] = [];
  let kernelSum = 0;

  for (let i = 0; i < kernelSize; i++) {
    const x = i - Math.floor(kernelSize / 2);
    const g = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(g);
    kernelSum += g;
  }

  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }

  const halfKernel = Math.floor(kernelSize / 2);

  // Horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let k = -halfKernel; k <= halfKernel; k++) {
        const px = Math.min(Math.max(x + k, 0), width - 1);
        const idx = (y * width + px) * 4;
        const weight = kernel[k + halfKernel];
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
      }
      const idx = (y * width + x) * 4;
      temp[idx] = r;
      temp[idx + 1] = g;
      temp[idx + 2] = b;
      temp[idx + 3] = a;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let k = -halfKernel; k <= halfKernel; k++) {
        const py = Math.min(Math.max(y + k, 0), height - 1);
        const idx = (py * width + x) * 4;
        const weight = kernel[k + halfKernel];
        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
      }
      const idx = (y * width + x) * 4;
      result[idx] = r;
      result[idx + 1] = g;
      result[idx + 2] = b;
      result[idx + 3] = a;
    }
  }

  return new ImageData(result, width, height);
};

// Apply blur with mask
const applyBlurWithMask = (
  sourceData: ImageData,
  maskData: ImageData,
  blurAmount: number,
  feather: number,
): ImageData => {
  const blurred = applyGaussianBlur(sourceData, blurAmount);
  const { data: srcData, width, height } = sourceData;
  const { data: blurData } = blurred;
  const { data: maskDataArr } = maskData;

  // Optional: feather the mask
  let featheredMask = maskData;
  if (feather > 1) {
    featheredMask = applyGaussianBlur(maskData, feather);
  }
  const { data: featheredMaskData } = featheredMask;

  const result = new Uint8ClampedArray(srcData.length);

  for (let i = 0; i < srcData.length; i += 4) {
    // Use grayscale value of mask as blend factor
    const maskValue = featheredMaskData[i] / 255;

    result[i] = srcData[i] * (1 - maskValue) + blurData[i] * maskValue;
    result[i + 1] = srcData[i + 1] * (1 - maskValue) + blurData[i + 1] * maskValue;
    result[i + 2] = srcData[i + 2] * (1 - maskValue) + blurData[i + 2] * maskValue;
    result[i + 3] = srcData[i + 3];
  }

  return new ImageData(result, width, height);
};

// Message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = e.data;

  try {
    let result: ImageData;

    switch (type) {
      case 'APPLY_BLUR': {
        const { imageData, maskData, blurAmount, feather } = payload;
        result = applyBlurWithMask(imageData, maskData, blurAmount, feather);
        break;
      }

      case 'APPLY_CAMERA_RAW': {
        const { imageData, settings } = payload;
        result = applyCameraRawPipeline(imageData, settings);
        break;
      }

      case 'APPLY_CURVES': {
        const { imageData, curves } = payload;
        const masterLut = calculateSpline(curves.master);
        const redLut = calculateSpline(curves.red);
        const greenLut = calculateSpline(curves.green);
        const blueLut = calculateSpline(curves.blue);

        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = masterLut[redLut[data[i]]];
          data[i + 1] = masterLut[greenLut[data[i + 1]]];
          data[i + 2] = masterLut[blueLut[data[i + 2]]];
        }
        result = imageData;
        break;
      }

      case 'PROCESS_IMAGE': {
        // Generic image processing - can be extended
        result = payload.imageData;
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      id,
      success: true,
      data: result,
    };

    // Use postMessage with transfer list for better performance
    (self as unknown as Worker).postMessage(response, [result.data.buffer]);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    (self as unknown as Worker).postMessage(response);
  }
};

export {};
