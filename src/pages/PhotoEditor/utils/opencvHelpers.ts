// Helper to manage OpenCV.js loading and operations
import cv from '@techstark/opencv-js';
import { imageProcessingService } from '../workers/imageProcessingService';

// Ensure global cv is available for potential legacy or debug usage
// @ts-ignore
if (typeof window !== 'undefined' && !window.cv) {
  // @ts-ignore
  window.cv = cv;
}

let isOpenCvAvailable = false;

export const loadOpenCv = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (cv.getBuildInformation) {
      isOpenCvAvailable = true;
      resolve();
    } else {
      // @ts-ignore
      cv['onRuntimeInitialized'] = () => {
        isOpenCvAvailable = true;
        resolve();
      };
      // Timeout fallback
      setTimeout(() => {
        if (!isOpenCvAvailable) {
          console.warn('OpenCV initialization timed out, using WebWorker fallback');
          resolve(); // Still resolve, but OpenCV won't be available
        }
      }, 5000);
    }
  });
};

export const applyBlurWithMask = async (
  sourceCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  blurAmount: number = 15,
  maskFeather: number = 7,
): Promise<HTMLCanvasElement> => {
  // Try OpenCV first, fall back to WebWorker
  // @ts-ignore
  if (!isOpenCvAvailable || !cv || !cv.imread) {
    console.log('Using WebWorker for blur processing');
    return imageProcessingService.applyBlurWithMask(
      sourceCanvas,
      maskCanvas,
      blurAmount,
      maskFeather,
    );
  }

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

  const resources: { delete: () => void }[] = [];
  const track = <T extends { delete: () => void }>(resource: T): T => {
    resources.push(resource);
    return resource;
  };
  try {
    const src = track(cv.imread(sourceCanvas)); // CV_8UC4
    const maskColor = track(cv.imread(maskCanvas)); // CV_8UC4 (white painted areas)
    const mask = track(new cv.Mat());

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

    const blurred = track(new cv.Mat());
    cv.GaussianBlur(src, blurred, ksize, 0);

    // Composition
    const dst = track(src.clone());

    // Preserve source alpha and blend continuously across feathered boundaries.
    for (let i = 0; i < mask.data.length; i++) {
      const amount = mask.data[i] / 255;
      for (let channel = 0; channel < 3; channel++) {
        const index = i * 4 + channel;
        dst.data[index] = Math.round(src.data[index] * (1 - amount) + blurred.data[index] * amount);
      }
    }

    const out = document.createElement('canvas');
    out.width = dst.cols;
    out.height = dst.rows;
    cv.imshow(out, dst);

    return out;
  } finally {
    resources.reverse().forEach((resource) => resource.delete());
  }
};
