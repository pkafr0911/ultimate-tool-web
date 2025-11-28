// Image Processing Web Worker
// Handles heavy image processing operations off the main thread

import {
  cloneImageData,
  applyBrightnessContrast,
  applyConvolution,
  Kernels,
  applyThresholdAlpha,
  applyThresholdAlphaBlack,
  applyToneAdjustments,
  applyHslAdjustments,
} from '../utils/ImageEditorEngine';

export type WorkerRequest = {
  id: string;
  type: 'applyEffects';
  imageData: ImageData;
  effects: {
    blur?: number;
    gaussian?: number;
    sharpen?: number;
    texture?: number;
    clarity?: number;
    bgThreshold?: number;
    bgThresholdBlack?: number;
    brightness?: number;
    contrast?: number;
    highlights?: number;
    shadows?: number;
    whites?: number;
    blacks?: number;
    vibrance?: number;
    saturation?: number;
    dehaze?: number;
    hslAdjustments?: Record<string, { h?: number; s?: number; l?: number }>;
  };
};

export type WorkerResponse = {
  id: string;
  type: 'success' | 'error';
  imageData?: ImageData;
  error?: string;
};

// Listen for messages from the main thread
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type, imageData, effects } = e.data;

  try {
    if (type === 'applyEffects') {
      const startTime = performance.now();
      const result = processEffects(imageData, effects);
      const processingTime = performance.now() - startTime;

      // Log performance for debugging
      if (processingTime > 500) {
        console.warn(`Worker: Processing took ${processingTime.toFixed(0)}ms`);
      }

      const response: WorkerResponse = {
        id,
        type: 'success',
        imageData: result,
      };

      // Send response back to main thread
      // Note: Not using Transferable to avoid buffer detachment
      (self as any).postMessage(response);
    }
  } catch (error) {
    console.error('Worker processing error:', error);
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
};

function processEffects(
  imageData: ImageData,
  {
    blur = 0,
    gaussian = 0,
    sharpen = 0,
    bgThreshold = 0,
    bgThresholdBlack = 0,
    brightness = 0,
    contrast = 0,
    texture = 0,
    clarity = 0,
    highlights = 0,
    shadows = 0,
    whites = 0,
    blacks = 0,
    vibrance = 0,
    saturation = 0,
    dehaze = 0,
    hslAdjustments = {},
  }: WorkerRequest['effects'],
): ImageData {
  // Check if any effects are actually applied to skip unnecessary processing
  const hasEffects =
    blur !== 0 ||
    gaussian !== 0 ||
    sharpen !== 0 ||
    texture !== 0 ||
    clarity !== 0 ||
    bgThreshold !== 0 ||
    bgThresholdBlack !== 0 ||
    brightness !== 0 ||
    contrast !== 0 ||
    highlights !== 0 ||
    shadows !== 0 ||
    whites !== 0 ||
    blacks !== 0 ||
    vibrance !== 0 ||
    saturation !== 0 ||
    dehaze !== 0 ||
    Object.keys(hslAdjustments).length > 0;

  if (!hasEffects) {
    // Return the original data if no effects
    return imageData;
  }

  let data = cloneImageData(imageData);

  // 1. Box blur (optimized - limit kernel size)
  if (blur > 0) {
    const size = Math.min(Math.round(blur), 15); // Cap at 15 for performance
    if (size > 0) {
      const kernel = Kernels.generateBoxBlurKernel(size);
      data = applyConvolution(data, kernel, size);
    }
  }

  // 2. Gaussian blur (optimized - limit radius)
  if (gaussian > 0) {
    const rad = Math.min(Math.round(gaussian), 10); // Cap at 10 for performance
    if (rad > 0) {
      const kernel = Kernels.generateGaussianKernel(rad);
      const kernelSize = 2 * rad + 1;
      data = applyConvolution(data, kernel, kernelSize);
    }
  }

  // 3. Sharpen (limit iterations)
  if (sharpen > 0) {
    const iterations = Math.min(Math.ceil(sharpen), 3); // Max 3 passes
    for (let i = 0; i < iterations; i++) {
      data = applyConvolution(data, Kernels.sharpen, 3);
    }
  }

  // 4. Texture (optimized - fewer passes)
  if (texture !== 0) {
    const passes = Math.min(Math.abs(Math.round(texture / 10)), 3); // Max 3 passes
    if (passes > 0) {
      if (texture > 0) {
        for (let i = 0; i < passes; i++) {
          data = applyConvolution(data, Kernels.sharpen, 3);
        }
      } else {
        // negative texture = blur
        const blurKernel = Kernels.generateBoxBlurKernel(3);
        for (let i = 0; i < passes; i++) {
          data = applyConvolution(data, blurKernel, 3);
        }
      }
    }
  }

  // 5. Clarity (optimized - fewer passes)
  if (clarity !== 0) {
    const passes = Math.min(Math.abs(Math.round(clarity / 5)), 3); // Max 3 passes
    if (clarity > 0 && passes > 0) {
      for (let i = 0; i < passes; i++) {
        data = applyConvolution(data, Kernels.sharpen, 3);
      }
    }
  }

  // 6. Remove white background
  if (bgThreshold > 0) {
    data = applyThresholdAlpha(data, bgThreshold);
  }

  // 7. Remove black background
  if (bgThresholdBlack > 0) {
    data = applyThresholdAlphaBlack(data, bgThresholdBlack);
  }

  // 8. Brightness & Contrast
  if (brightness !== 0 || contrast !== 0) {
    data = applyBrightnessContrast(data, brightness, contrast);
  }

  // 9. Tone adjustments (highlights, shadows, whites, blacks, vibrance, saturation, dehaze)
  if (
    highlights !== 0 ||
    shadows !== 0 ||
    whites !== 0 ||
    blacks !== 0 ||
    vibrance !== 0 ||
    saturation !== 0 ||
    dehaze !== 0
  ) {
    data = applyToneAdjustments(data, {
      highlights,
      shadows,
      whites,
      blacks,
      vibrance,
      saturation,
      clarity,
      dehaze,
    });
  }

  // 10. HSL adjustments
  if (Object.keys(hslAdjustments).length > 0) {
    data = applyHslAdjustments(data, hslAdjustments);
  }

  return data;
}

export {};
