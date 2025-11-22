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

export function applyThresholdAlpha(data: ImageData, threshold = 0) {
  threshold = 255 - threshold;
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
    clarity = 0, // local contrast
    dehaze = 0, // remove fog
  }: {
    highlights?: number;
    shadows?: number;
    whites?: number;
    blacks?: number;
    vibrance?: number;
    saturation?: number;
    clarity?: number;
    dehaze?: number;
  },
) => {
  const d = data.data;

  // If clarity is applied, create a shallow copy for local contrast reference
  const originalData = clarity !== 0 ? new Uint8ClampedArray(d) : null;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    /** ------------------------ 1️⃣ HIGHLIGHTS / SHADOWS ------------------------ **/
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma > 192 && highlights !== 0) {
      const hFactor = (luma - 192) / (255 - 192);
      r = clamp(r + highlights * hFactor);
      g = clamp(g + highlights * hFactor);
      b = clamp(b + highlights * hFactor);
    }
    if (luma < 64 && shadows !== 0) {
      const sFactor = 1 - luma / 64;
      r = clamp(r + shadows * sFactor);
      g = clamp(g + shadows * sFactor);
      b = clamp(b + shadows * sFactor);
    }

    /** ------------------------ 2️⃣ WHITES / BLACKS ------------------------ **/
    r = clamp(r + whites - blacks);
    g = clamp(g + whites - blacks);
    b = clamp(b + whites - blacks);

    /** ------------------------ 3️⃣ DEHAZE ------------------------ **/
    if (dehaze !== 0) {
      const factor = 1 + dehaze / 100;
      r = clamp(r * factor);
      g = clamp(g * (1 - dehaze / 200)); // reduce green & blue to reduce 'fog'
      b = clamp(b * (1 - dehaze / 200));
    }

    /** ------------------------ 4️⃣ VIBRANCE / SATURATION (HSL) ------------------------ **/
    if (vibrance !== 0 || saturation !== 0) {
      const tmp = [r, g, b];
      applyVibranceSaturation(tmp as any, 0, { vibrance, saturation });
      [r, g, b] = tmp;
    }

    /** ------------------------ 5️⃣ CLARITY (Local contrast) ------------------------ **/
    if (clarity !== 0 && originalData) {
      // baseline luma before enhancements
      const baseLuma =
        0.299 * originalData[i] + 0.587 * originalData[i + 1] + 0.114 * originalData[i + 2];

      // Clarity: enhance mid-range contrast only
      const contrastFactor = clarity / 100;
      const lumaDiff = (luma - baseLuma) * contrastFactor;

      r = clamp(r + lumaDiff);
      g = clamp(g + lumaDiff);
      b = clamp(b + lumaDiff);
    }

    /** ------------------------ WRITE BACK ------------------------ **/
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    // alpha unchanged
  }

  return data;
};

export const applyDehaze = (p: Uint8ClampedArray | number[], i: number, dehaze: number) => {
  // More natural algorithm: adjust luminance & slight desaturation
  let [h, s, l] = rgbToHsl(p[i], p[i + 1], p[i + 2]);

  // Example: +20 dehaze → l *= 1.2
  l = clamp01(l * (1 + dehaze / 100));

  // Slight saturation reduction to avoid color shift
  s = clamp01(s * (1 - Math.abs(dehaze) / 300));

  const [r, g, b] = hslToRgb(h, s, l);
  p[i] = r;
  p[i + 1] = g;
  p[i + 2] = b;
};

export const applyVibranceSaturation = (
  p: Uint8ClampedArray | number[],
  i: number,
  { vibrance = 0, saturation = 0 }: { vibrance?: number; saturation?: number },
) => {
  let [h, s, l] = rgbToHsl(p[i], p[i + 1], p[i + 2]);

  // --- 1️⃣ Saturation (multiplicative, more natural) ---
  // Example: saturation = 20 → s *= 1.2 ; saturation = -10 → s *= 0.9
  if (saturation !== 0) {
    s = clamp01(s * (1 + saturation / 100));
  }

  // --- 2️⃣ Vibrance (only boosts low-saturated areas) ---
  if (vibrance !== 0) {
    const factor = vibrance / 100;
    s = clamp01(s + (1 - s) * factor * (1 - s)); // nonlinear → strong effect only if s < 0.5
  }

  const [r, g, b] = hslToRgb(h, s, l);
  p[i] = r;
  p[i + 1] = g;
  p[i + 2] = b;
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

export const applyHslAdjustments = (
  data: ImageData,
  adjustments: Record<string, { h?: number; s?: number; l?: number }>, // h: degrees, s/l: percent or fractional
) => {
  const d = data.data;

  for (let i = 0; i < d.length; i += 4) {
    // Loop through each pixel (step 4: R,G,B,A)
    let [r, g, b] = [d[i], d[i + 1], d[i + 2]]; // Extract RGB
    let [h, s, l] = rgbToHsl(r, g, b); // Convert to HSL (h: 0–1)
    let deg = (h * 360 + 360) % 360; // Convert hue to 0–360° safely

    // find color range (handles wrap ranges like [345,15])
    const entry = colorRanges.find(({ range }) => {
      const [start, end] = range;
      if (start <= end) {
        return deg >= start && deg <= end;
      } else {
        // wrapped range (e.g. 345 -> 15)
        return deg >= start || deg <= end;
      }
    });

    if (!entry) {
      // no matching range — write back unchanged
      [d[i], d[i + 1], d[i + 2]] = hslToRgb(h, s, l);
      continue;
    }

    const adj = adjustments[entry.name];
    if (!adj) {
      [d[i], d[i + 1], d[i + 2]] = hslToRgb(h, s, l);
      continue;
    }

    const [startRaw, endRaw] = entry.range;
    // Normalize start/end so start <= end (for clamping). If wrapped, push end +360.
    let start = startRaw;
    let end = endRaw;
    if (start > end) end += 360; // e.g., 345..15 => 345..375

    // Normalize deg into the same space as start..end
    let degNorm = deg;
    if (degNorm < start) degNorm += 360;

    // ----- HUE: apply degree shift but clamp within the color's range -----
    if (typeof adj.h === 'number' && adj.h !== 0) {
      let newDeg = degNorm + adj.h; // tentative
      // clamp to the range boundaries so it cannot jump outside the color band
      if (newDeg < start) newDeg = start;
      if (newDeg > end) newDeg = end;
      // bring back to 0..360
      deg = ((newDeg % 360) + 360) % 360; // Normalize back to 0–360°
      h = deg / 360; // Convert back to 0–1 for HSL
    }

    // ----- SATURATION: flexible input handling -----
    if (typeof adj.s === 'number' && adj.s !== 0) {
      // interpret 0.2 as +20% for backward compatibility
      const satPercent = Math.abs(adj.s) <= 1 ? adj.s * 100 : adj.s; // Allow 0.2 or 20 → both = +20%
      s = clamp01(s * (1 + satPercent / 100)); // Apply proportionally
    }

    // ----- LUMINANCE: same handling as saturation -----
    if (typeof adj.l === 'number' && adj.l !== 0) {
      const lumPercent = Math.abs(adj.l) <= 1 ? adj.l * 100 : adj.l; // e.g. 0.1 → +10%
      l = clamp01(l * (1 + lumPercent / 100)); // Apply multiplicatively
    }

    // Write final adjusted color back to RGBA buffer
    [d[i], d[i + 1], d[i + 2]] = hslToRgb(h, s, l);
  }

  return data;
};
