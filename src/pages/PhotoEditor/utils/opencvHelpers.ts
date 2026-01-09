// Helper to manage OpenCV.js loading and operations
import cv from '@techstark/opencv-js';

// Ensure global cv is available for potential legacy or debug usage
// @ts-ignore
if (typeof window !== 'undefined' && !window.cv) {
  // @ts-ignore
  window.cv = cv;
}

export const loadOpenCv = (): Promise<void> => {
  return new Promise((resolve) => {
    // @ts-ignore
    if (cv.getBuildInformation) {
      resolve();
    } else {
      // @ts-ignore
      cv['onRuntimeInitialized'] = () => {
        resolve();
      };
    }
  });
};

export const applyBlurWithMask = async (
  sourceCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  blurAmount: number = 15,
  maskFeather: number = 7,
): Promise<HTMLCanvasElement> => {
  // Using imported cv module
  // @ts-ignore
  if (!cv || !cv.imread) throw new Error('OpenCV.js not loaded');

  // Ensure mask and source dimensions match
  if (sourceCanvas.width !== maskCanvas.width || sourceCanvas.height !== maskCanvas.height) {
    const tempMask = document.createElement('canvas');
    tempMask.width = sourceCanvas.width;
    tempMask.height = sourceCanvas.height;
    const ctx = tempMask.getContext('2d');
    if (ctx) {
      ctx.drawImage(maskCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);
    }
    maskCanvas = tempMask;
  }

  const src = cv.imread(sourceCanvas); // CV_8UC4
  const maskColor = cv.imread(maskCanvas); // CV_8UC4 (white painted areas)
  const mask = new cv.Mat();

  // grayscale and threshold mask
  cv.cvtColor(maskColor, mask, cv.COLOR_RGBA2GRAY);
  cv.threshold(mask, mask, 10, 255, cv.THRESH_BINARY);

  // optional feather mask for smooth edges
  if (maskFeather && maskFeather > 1) {
    let f = Math.round(maskFeather);
    if (f % 2 === 0) f += 1;
    const kf = new cv.Size(f, f);
    cv.GaussianBlur(mask, mask, kf, 0);
  }

  // ensure odd kernel for image blur
  let k = Math.max(1, Math.floor(blurAmount));
  if (k % 2 === 0) k += 1;
  const ksize = new cv.Size(k, k);

  const blurred = new cv.Mat();
  cv.GaussianBlur(src, blurred, ksize, 0);

  // Composition
  const dst = src.clone();

  // Use mask to copy blurred to dst
  blurred.copyTo(dst, mask);

  const out = document.createElement('canvas');
  out.width = dst.cols;
  out.height = dst.rows;
  cv.imshow(out, dst);

  // cleanup
  src.delete();
  maskColor.delete();
  mask.delete();
  blurred.delete();
  dst.delete();

  return out;
};
