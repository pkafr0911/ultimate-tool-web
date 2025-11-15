export async function textEnhancement(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; contrastBoost?: number; threshold?: number },
): Promise<{ steps: string[]; finalBlob: Blob }> {
  const { maxWidth = 2000, maxHeight = 2000, contrastBoost = 1.2, threshold = 150 } = options || {};
  const steps: string[] = [];

  const img = new Image();
  img.src = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
  });

  let width = img.width;
  let height = img.height;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Step 1: Original image
  ctx.drawImage(img, 0, 0, width, height);
  steps.push(canvas.toDataURL('image/png'));

  // Step 2: Resize already applied, so we can directly store resized image
  steps.push(canvas.toDataURL('image/png'));

  // Step 3: Grayscale + contrast + threshold
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Each pixel consists of 4 values in the data array: [R, G, B, A]
    // i = red channel index, i+1 = green, i+2 = blue, i+3 = alpha (opacity)

    // Convert RGB to grayscale using the luminosity method:
    // Human eyes perceive green more strongly, blue less strongly
    let gray =
      0.299 * data[i] + // Red channel weight
      0.587 * data[i + 1] + // Green channel weight
      0.114 * data[i + 2]; // Blue channel weight

    // Boost contrast slightly; ensure it does not exceed 255 (max for a channel)
    gray = Math.min(255, gray * contrastBoost);

    // Convert grayscale to binary (black or white) using a threshold
    // If pixel brightness < threshold → black (0), else → white (255)
    const value = gray < threshold ? 0 : 255;

    // Apply the binary value to all RGB channels
    // This makes the pixel pure black or pure white
    data[i] = data[i + 1] = data[i + 2] = value;

    // Alpha channel (data[i + 3]) remains unchanged
  }
  ctx.putImageData(imgData, 0, 0);
  steps.push(canvas.toDataURL('image/png')); // Step after B&W conversion

  // Step 4: Sharpening (text enhancement)
  const imgData2 = ctx.getImageData(0, 0, width, height);
  const data2 = imgData2.data;

  // Simple sharpening kernel
  const w = width;
  const h = height;

  const copy = new Uint8ClampedArray(data2); // make a copy to read original

  for (let y = 1; y < h - 1; y++) {
    // loop over each row, skip first & last (edges)
    for (let x = 1; x < w - 1; x++) {
      // loop over each column, skip first & last (edges)
      for (let c = 0; c < 3; c++) {
        // loop over RGB channels (0=R,1=G,2=B)
        const idx = (y * w + x) * 4 + c; // calculate index in the 1D data array

        const val =
          5 * copy[idx] - // center pixel * 5
          copy[idx - 4] - // subtract left neighbor
          copy[idx + 4] - // subtract right neighbor
          copy[idx - w * 4] - // subtract top neighbor
          copy[idx + w * 4]; // subtract bottom neighbor
        // This applies a simple 3x3 sharpening kernel:
        // [ 0  -1  0 ]
        // [-1   5 -1]
        // [ 0  -1  0 ]
        // It enhances edges by boosting center pixel relative to neighbors

        data2[idx] = Math.min(255, Math.max(0, val)); // clamp result to [0,255] to avoid overflow
      }
    }
  }

  ctx.putImageData(imgData2, 0, 0);
  steps.push(canvas.toDataURL('image/png')); // after sharpening

  // Final blob
  const finalBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/png',
      1,
    );
  });

  return { steps, finalBlob };
}
