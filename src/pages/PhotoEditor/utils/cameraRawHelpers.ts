import { clamp, clamp01, rgbToHsl, hslToRgb, colorRanges } from './hslHelpers';

export type CurvePoint = { x: number; y: number };

export interface CameraRawSettings {
  hsl: Record<string, { h: number; s: number; l: number }>;
  curves: {
    master: CurvePoint[];
    red: CurvePoint[];
    green: CurvePoint[];
    blue: CurvePoint[];
  };
  colorGrading: {
    shadows: { h: number; s: number; l: number };
    midtones: { h: number; s: number; l: number };
    highlights: { h: number; s: number; l: number };
    blending: number;
    balance: number;
  };
}

// --- Spline Interpolation for Curves ---
// Monotone Cubic Spline interpolation helps avoid overshooting
export const calculateSpline = (points: CurvePoint[]): number[] => {
  // Sort points by X
  const sorted = [...points].sort((a, b) => a.x - b.x);
  // Ensure 0 and 255 exist
  if (sorted[0].x > 0) sorted.unshift({ x: 0, y: sorted[0].y });
  if (sorted[sorted.length - 1].x < 255) sorted.push({ x: 255, y: sorted[sorted.length - 1].y });

  const xs = sorted.map((p) => p.x);
  const ys = sorted.map((p) => p.y);
  const n = xs.length;

  // Calculate secants and tangents
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

  // Generate LUT
  const lut: number[] = new Array(256).fill(0);
  // Loop through segments
  for (let i = 0; i < n - 1; i++) {
    const xStart = xs[i];
    const xEnd = xs[i + 1];
    const yStart = ys[i];
    const yEnd = ys[i + 1];
    const m1 = c1s[i];
    const m2 = c1s[i + 1];
    const dx = xEnd - xStart;

    /*
         Hermite basis:
         h00 = 2t^3 - 3t^2 + 1
         h10 = t^3 - 2t^2 + t
         h01 = -2t^3 + 3t^2
         h11 = t^3 - t^2
        */

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

// --- Pipeline ---

export const applyCameraRawPipeline = (imageData: ImageData, settings: CameraRawSettings) => {
  const data = imageData.data;
  const { hsl, curves, colorGrading } = settings;

  // 1. Prepare Curve LUTs
  // Optimize: only recalc if specific curve changed? For now, recalculate on apply (preview might need optimization)
  const masterLut = calculateSpline(curves.master);
  const redLut = calculateSpline(curves.red);
  const greenLut = calculateSpline(curves.green);
  const blueLut = calculateSpline(curves.blue);

  // Color Grading adjustments preparation
  // Convert grading HSL to RGB offsets or factors?
  // A common way for color grading is to add color to shadows/highlights.
  // Shadows: add color to low luma. Highlights: to high luma. Midtones: to mid pixels.
  const shadowRgb = hslToRgb(
    colorGrading.shadows.h / 360,
    colorGrading.shadows.s,
    colorGrading.shadows.l * 2,
  ); // l*2 rough scaling
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

  // Pre-calculate grading factors to avoid per-pixel expensive math if possible,
  // but Grading is dependent on pixel luma, so we do it per pixel.

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // --- 1. Curves ---
    // Apply channel curves then master curve
    r = redLut[r];
    g = greenLut[g];
    b = blueLut[b];

    // Master affects all
    r = masterLut[r];
    g = masterLut[g];
    b = masterLut[b];

    // --- 2. HSL Adjustments (Selective Color) ---
    // We reuse logic from ApplyHslAdjustments but localized variables to avoid function call overhead if possible
    // But for maintainability, let's copy the inner logic structure or just call the logic inline.
    // Inline is faster for loops.

    let [h, s, l] = rgbToHsl(r, g, b);
    let deg = (h * 360 + 360) % 360;

    // Find color range
    // Optimization: Pre-map ranges? ColorRanges is small array (8), linear scan is acceptable.
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
        // Convert back to RGB for next stage if needed, or keep in HSL?
        // Grading is usually done on RGB or Luma, easier on RGB here.
        [r, g, b] = hslToRgb(h, s, l);
      } else {
        [r, g, b] = hslToRgb(h, s, l); // Just convert back if no adjustment found? Or just skip?
        // If no adjustment, [r,g,b] are consistent with h,s,l. If we adjusted h,s,l we updated r,g,b.
        // Actually if we only calculated h,s,l and didn't change them, r,g,b are original.
        // So we need to ensure r,g,b are updated if HSL changed.
      }
    }

    // --- 3. Color Grading ---
    // Calculate Luma (0..1)
    const luma = 0.299 * (r / 255) + 0.587 * (g / 255) + 0.114 * (b / 255);

    // Define weights
    // Shadows: 1 at 0, 0 at 0.5
    // Highlights: 0 at 0.5, 1 at 1
    // Midtones: Parabola peaking at 0.5

    let shadowFactor = Math.max(0, 1 - luma * 2); // 0..0.5 maps to 1..0
    let highlightFactor = Math.max(0, (luma - 0.5) * 2); // 0.5..1 maps to 0..1
    let midtoneFactor = 1 - Math.abs(luma - 0.5) * 2; // 0..1 maps to 0..1..0 peak 0.5

    // Simple additive color grading
    const gradingIntensity = 2.0;

    if (colorGrading.shadows.s > 0) {
      // Mix shadow color
      const [sr, sg, sb] = hslToRgb(colorGrading.shadows.h / 360, colorGrading.shadows.s, 0.5); // Use 0.5 L for pure color
      r += (sr - 128) * shadowFactor * gradingIntensity;
      g += (sg - 128) * shadowFactor * gradingIntensity;
      b += (sb - 128) * shadowFactor * gradingIntensity;
    }

    if (colorGrading.highlights.s > 0) {
      const [hr, hg, hb] = hslToRgb(
        colorGrading.highlights.h / 360,
        colorGrading.highlights.s,
        0.5,
      );
      r += (hr - 128) * highlightFactor * gradingIntensity;
      g += (hg - 128) * highlightFactor * gradingIntensity;
      b += (hb - 128) * highlightFactor * gradingIntensity;
    }

    if (colorGrading.midtones.s > 0) {
      const [mr, mg, mb] = hslToRgb(colorGrading.midtones.h / 360, colorGrading.midtones.s, 0.5);
      r += (mr - 128) * midtoneFactor * gradingIntensity;
      g += (mg - 128) * midtoneFactor * gradingIntensity;
      b += (mb - 128) * midtoneFactor * gradingIntensity;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  return imageData;
};
