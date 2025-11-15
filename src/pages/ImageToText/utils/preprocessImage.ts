export async function preprocessImage(file: File): Promise<Blob> {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);

  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Convert to grayscale + slight contrast boost
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const boost = Math.min(255, avg * 1.2); // boost contrast
    data[i] = boost;
    data[i + 1] = boost;
    data[i + 2] = boost;
  }

  ctx.putImageData(imgData, 0, 0);

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1);
  });
}
