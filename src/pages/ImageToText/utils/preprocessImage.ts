export async function preprocessImage(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; contrastBoost?: number; threshold?: number },
): Promise<Blob> {
  const { maxWidth = 2000, maxHeight = 2000, contrastBoost = 1.2, threshold = 150 } = options || {};

  // Load image
  const img = new Image();
  img.src = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (err) => reject(err);
  });

  // Resize if needed
  let width = img.width;
  let height = img.height;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  // Draw on canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  // Get image data
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Convert to high-contrast black-and-white
  for (let i = 0; i < data.length; i += 4) {
    // Luminosity grayscale
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = Math.min(255, gray * contrastBoost);

    // Threshold for binary image
    const value = gray < threshold ? 0 : 255;

    data[i] = data[i + 1] = data[i + 2] = value;
    // Keep alpha channel as is
  }

  ctx.putImageData(imgData, 0, 0);

  // Export to Blob
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/png',
      1,
    );
  });
}
