export const clamp = (value: number, min = 0, max = 255) => {
  return Math.min(max, Math.max(min, value));
};

// For 0..1 ranges
export const clamp01 = (value: number) => {
  return Math.min(1, Math.max(0, value));
};

export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
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

export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
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

/**
 * Applies HSL adjustments to specific color ranges.
 * @param data Image data to modify
 * @param adjustments Map of color names to HSL adjustments
 * @returns Modified image data
 */
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
