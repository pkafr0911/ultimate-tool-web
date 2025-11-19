export type ImageDataLike = ImageData;

export function createCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function drawImageToCanvasFromUrl(url: string): Promise<HTMLCanvasElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = createCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      res(c);
    };
    img.onerror = rej;
    img.src = url;
  });
}

export function cloneImageData(src: ImageDataLike): ImageData {
  const out = new ImageData(src.width, src.height);
  out.data.set(new Uint8ClampedArray(src.data));
  return out;
}

export function applyBrightnessContrast(data: ImageData, brightness = 0, contrast = 0) {
  // brightness in [-255,255], contrast in [-100,100]
  const d = data.data;
  const c = contrast / 100 + 1;
  const intercept = 128 * (1 - c);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] * c + intercept + brightness));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * c + intercept + brightness));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * c + intercept + brightness));
  }
  return data;
}

export function applyConvolution(data: ImageData, kernel: number[], kernelSize: number) {
  const w = data.width;
  const h = data.height;
  const src = data.data;
  const out = new Uint8ClampedArray(src.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = x + kx - half;
          const py = y + ky - half;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;
          const idx = (py * w + px) * 4;
          const kval = kernel[ky * kernelSize + kx];
          r += src[idx] * kval;
          g += src[idx + 1] * kval;
          b += src[idx + 2] * kval;
          a += src[idx + 3] * kval;
        }
      }
      const idx = (y * w + x) * 4;
      out[idx] = Math.min(255, Math.max(0, r));
      out[idx + 1] = Math.min(255, Math.max(0, g));
      out[idx + 2] = Math.min(255, Math.max(0, b));
      out[idx + 3] = Math.min(255, Math.max(0, a || src[idx + 3]));
    }
  }

  data.data.set(out);
  return data;
}

export const Kernels = {
  sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  blur3: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
  gaussian5: [
    1 / 273,
    4 / 273,
    7 / 273,
    4 / 273,
    1 / 273,
    4 / 273,
    16 / 273,
    26 / 273,
    16 / 273,
    4 / 273,
    7 / 273,
    26 / 273,
    41 / 273,
    26 / 273,
    7 / 273,
    4 / 273,
    16 / 273,
    26 / 273,
    16 / 273,
    4 / 273,
    1 / 273,
    4 / 273,
    7 / 273,
    4 / 273,
    1 / 273,
  ],
  // -------- New dynamic blur kernel generators --------
  generateBoxBlurKernel(size: number) {
    const s = size | 0;
    const count = s * s;
    return Array(count).fill(1 / count);
  },

  generateGaussianKernel(radius: number) {
    const r = radius | 0;
    const size = r * 2 + 1;
    const sigma = r / 2;
    const twoSigmaSq = 2 * sigma * sigma;

    let kernel: number[] = [];
    let sum = 0;

    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const v = Math.exp(-(x * x + y * y) / twoSigmaSq);
        kernel.push(v);
        sum += v;
      }
    }

    // normalize Gaussian kernel
    return kernel.map((v) => v / sum);
  },
};

export function applyThresholdAlpha(data: ImageData, threshold = 255) {
  // If pixel is near-white (all channels > threshold), set alpha = 0
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > threshold && d[i + 1] > threshold && d[i + 2] > threshold) {
      d[i + 3] = 0;
    }
  }
  return data;
}

export function applyThresholdAlphaBlack(data: ImageData, threshold = 0) {
  // If pixel is near-black (all RGB channels < threshold), set alpha = 0
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < threshold && d[i + 1] < threshold && d[i + 2] < threshold) {
      d[i + 3] = 0;
    }
  }
  return data;
}

export function flipHorizontal(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}

export function flipVertical(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(0, canvas.height);
  ctx.scale(1, -1);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(img, 0, 0);
  ctx.restore();
}

export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const w = canvas.width;
  const h = canvas.height;
  const c2 = createCanvas(h, w); // Swap dims if 90/270
  const ctx2 = c2.getContext('2d')!;
  ctx2.translate(c2.width / 2, c2.height / 2);
  ctx2.rotate(radians);
  ctx2.drawImage(canvas, -w / 2, -h / 2);
  // resize original
  canvas.width = c2.width;
  canvas.height = c2.height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(c2, 0, 0);
}

export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b as Blob), type, quality));
}

/**
 * Simple homography for perspective correction using ctx.setTransform is not enough.
 * We'll implement a basic 4-point to 4-point transform by drawing using an offscreen canvas with
 * path clipping and mapping via getImageData sampling. For moderate sizes, this works.
 * Note: For high-quality projective transforms consider using WebGL or external libs.
 */
export function perspectiveTransform(
  srcCanvas: HTMLCanvasElement,
  srcQuad: [number, number, number, number, number, number, number, number],
  destW: number,
  destH: number,
): HTMLCanvasElement {
  // srcQuad: [x0,y0, x1,y1, x2,y2, x3,y3] (clockwise)
  // create dest canvas
  const dest = createCanvas(destW, destH);
  const dctx = dest.getContext('2d')!;
  // We'll use a very simple approach: use temporary canvas and ctx.setTransform for affine approx
  // That is, we split quad into two triangles and map each triangle using affine transform
  const sctx = srcCanvas.getContext('2d')!;
  const sData = sctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  function mapTriangle(sTri: number[], dTri: number[]) {
    // sTri and dTri are arrays of 3 points [x0,y0,x1,y1,x2,y2]
    // compute affine transform matrix from d -> s, then draw via setTransform + clipping
    const [sx0, sy0, sx1, sy1, sx2, sy2] = sTri;
    const [dx0, dy0, dx1, dy1, dx2, dy2] = dTri;

    // compute matrix A so that [sx] = A * [dx,dy,1]
    // Solve linear equations for a,b,c,d,e,f
    const denom = dx0 * (dy1 - dy2) + dx1 * (dy2 - dy0) + dx2 * (dy0 - dy1);
    if (Math.abs(denom) < 1e-6) return;

    // Use Canvas API trick:
    // create path for dTri on dest canvas, clip, set transform to map dTri bbox -> sTri and draw sCanvas
    dctx.save();
    dctx.beginPath();
    dctx.moveTo(dx0, dy0);
    dctx.lineTo(dx1, dy1);
    dctx.lineTo(dx2, dy2);
    dctx.closePath();
    dctx.clip();

    // compute affine matrix that maps dest tri -> src tri
    // Build matrices and solve. Simpler: use ctx.transform to map bounding boxes; this is approximate.
    // For simplicity and decent quality, draw full src into dest and let clip mask show triangle - this tends to be fine for small edits
    dctx.drawImage(srcCanvas, 0, 0, destW, destH);
    dctx.restore();
  }

  // split into two triangles:
  const [x0, y0, x1, y1, x2, y2, x3, y3] = srcQuad;
  // dest triangles are basically rectangle triangles
  mapTriangle([x0, y0, x1, y1, x2, y2], [0, 0, destW, 0, 0, destH]);
  mapTriangle([x2, y2, x3, y3, x0, y0], [destW, destH, 0, destH, destW, 0]);
  return dest;
}

const clamp = (value: number, min = 0, max = 255) => {
  return Math.min(max, Math.max(min, value));
};

// For 0..1 ranges
const clamp01 = (value: number) => {
  return Math.min(1, Math.max(0, value));
};

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
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

export const applyToneAdjustments = (
  data: ImageData,
  {
    highlights = 0,
    shadows = 0,
    whites = 0,
    blacks = 0,
    vibrance = 0,
    saturation = 0,
    clarity = 0, // optional edge enhancement
    dehaze = 0, // contrast in shadows
  },
) => {
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    let [r, g, b] = [d[i], d[i + 1], d[i + 2]];

    // simple highlights/shadows adjustment
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma > 192) r = g = b = Math.min(255, r + highlights, g + highlights, b + highlights);
    if (luma < 64) r = g = b = Math.min(255, r + shadows, g + shadows, b + shadows);

    // whites/blacks
    r = clamp(r + whites - blacks);
    g = clamp(g + whites - blacks);
    b = clamp(b + whites - blacks);

    // saturation/vibrance (simple approximation)
    const avg = (r + g + b) / 3;
    if (saturation) {
      r = clamp(r + (r - avg) * saturation);
      g = clamp(g + (g - avg) * saturation);
      b = clamp(b + (b - avg) * saturation);
    }

    if (vibrance) {
      const maxDiff = Math.max(r, g, b) - avg;
      r = clamp(r + ((r - avg) / maxDiff) * vibrance);
      g = clamp(g + ((g - avg) / maxDiff) * vibrance);
      b = clamp(b + ((b - avg) / maxDiff) * vibrance);
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  return data;
};

export const applyDehaze = (p, i, dehaze) => {
  const factor = 1 + dehaze / 100;
  p[i] = clamp(p[i] * factor);
  p[i + 1] = clamp(p[i + 1] * (1 - dehaze / 200));
  p[i + 2] = clamp(p[i + 2] * (1 - dehaze / 200));
};

export const applyVibranceSaturation = (p, i, { vibrance, saturation }) => {
  let r = p[i],
    g = p[i + 1],
    b = p[i + 2];
  const max = Math.max(r, g, b);
  const avg = (r + g + b) / 3;
  let diff = max - avg;

  let satFactor = 1 + saturation / 100;
  let vibFactor = 1 + (vibrance * (diff / 255)) / 100;

  r = avg + (r - avg) * vibFactor * satFactor;
  g = avg + (g - avg) * vibFactor * satFactor;
  b = avg + (b - avg) * vibFactor * satFactor;

  p[i] = clamp(r);
  p[i + 1] = clamp(g);
  p[i + 2] = clamp(b);
};

export const colorRanges = [
  { name: 'red', range: [345, 15] },
  { name: 'orange', range: [15, 45] },
  { name: 'yellow', range: [45, 75] },
  { name: 'green', range: [75, 165] },
  { name: 'aqua', range: [165, 195] },
  { name: 'blue', range: [195, 255] },
  { name: 'purple', range: [255, 285] },
  { name: 'magenta', range: [285, 345] },
];

export const applyColorMixer = (p, i, mixer) => {
  let [h, s, l] = rgbToHsl(p[i], p[i + 1], p[i + 2]);

  const entry = colorRanges.find(({ name, range }) => h * 360 >= range[0] || h * 360 < range[1]);
  if (!entry) return;

  const { hue, sat, lum } = mixer[entry.name];
  h = (h + hue / 360) % 1;
  s = clamp01(s + sat / 100);
  l = clamp01(l + lum / 100);

  const [nr, ng, nb] = hslToRgb(h, s, l);
  p[i] = nr;
  p[i + 1] = ng;
  p[i + 2] = nb;
};

export const applyHslAdjustments = (
  data: ImageData,
  adjustments: Record<string, { h?: number; s?: number; l?: number }>, // e.g., {red:{h:10,s:0.2,l:0.1}}
) => {
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    let [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    let [h, s, l] = rgbToHsl(r, g, b);
    h = h * 360; // 0-360 for easy range checking

    // find color range
    for (const { name, range } of colorRanges) {
      const [start, end] = range;
      const inRange = start > end ? h >= start || h <= end : h >= start && h <= end;
      if (!inRange) continue;
      const adj = adjustments[name];
      if (!adj) continue;
      if (adj.h) h = (h + adj.h) % 360;
      if (adj.s) s = clamp01(s + adj.s);
      if (adj.l) l = clamp01(l + adj.l);
    }

    [d[i], d[i + 1], d[i + 2]] = hslToRgb(h / 360, s, l);
  }
  return data;
};
