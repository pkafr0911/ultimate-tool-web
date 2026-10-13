// WebWorker for heavy image processing operations
// This worker handles OpenCV blur, Camera Raw filters, and large canvas operations
// to prevent blocking the main thread

import { applyCameraRawPipeline, calculateSpline } from '../utils/cameraRawHelpers';

export type WorkerMessageType =
  | 'APPLY_BLUR'
  | 'APPLY_CAMERA_RAW'
  | 'APPLY_HSL'
  | 'APPLY_CURVES'
  | 'PROCESS_IMAGE';

export interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  payload: any;
}

export interface WorkerResponse {
  type: WorkerMessageType;
  id: string;
  success: boolean;
  data?: ImageData;
  error?: string;
}

// Gaussian blur implementation (for when OpenCV is not available in worker)
const applyGaussianBlur = (imageData: ImageData, radius: number): ImageData => {
  const { data, width, height } = imageData;
  if (radius <= 0) return new ImageData(new Uint8ClampedArray(data), width, height);
  const result = new Uint8ClampedArray(data.length);

  // Create Gaussian kernel
  const kernelSize = Math.max(1, Math.floor(radius)) * 2 + 1;
  const sigma = radius / 3;
  const kernel: number[] = [];
  let kernelSum = 0;

  for (let i = 0; i < kernelSize; i++) {
    const x = i - Math.floor(kernelSize / 2);
    const g = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(g);
    kernelSum += g;
  }

  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }

  const halfKernel = Math.floor(kernelSize / 2);

  // Horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let k = -halfKernel; k <= halfKernel; k++) {
        const px = Math.min(Math.max(x + k, 0), width - 1);
        const idx = (y * width + px) * 4;
        const weight = kernel[k + halfKernel];
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
      }
      const idx = (y * width + x) * 4;
      temp[idx] = r;
      temp[idx + 1] = g;
      temp[idx + 2] = b;
      temp[idx + 3] = a;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let k = -halfKernel; k <= halfKernel; k++) {
        const py = Math.min(Math.max(y + k, 0), height - 1);
        const idx = (py * width + x) * 4;
        const weight = kernel[k + halfKernel];
        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
      }
      const idx = (y * width + x) * 4;
      result[idx] = r;
      result[idx + 1] = g;
      result[idx + 2] = b;
      result[idx + 3] = a;
    }
  }

  return new ImageData(result, width, height);
};

// Apply blur with mask
const applyBlurWithMask = (
  sourceData: ImageData,
  maskData: ImageData,
  blurAmount: number,
  feather: number,
): ImageData => {
  const blurred = applyGaussianBlur(sourceData, blurAmount);
  const { data: srcData, width, height } = sourceData;
  const { data: blurData } = blurred;
  const { data: maskDataArr } = maskData;

  // Optional: feather the mask
  let featheredMask = maskData;
  if (feather > 1) {
    featheredMask = applyGaussianBlur(maskData, feather);
  }
  const { data: featheredMaskData } = featheredMask;

  const result = new Uint8ClampedArray(srcData.length);

  for (let i = 0; i < srcData.length; i += 4) {
    // Use grayscale value of mask as blend factor
    const maskValue = featheredMaskData[i] / 255;

    result[i] = srcData[i] * (1 - maskValue) + blurData[i] * maskValue;
    result[i + 1] = srcData[i + 1] * (1 - maskValue) + blurData[i + 1] * maskValue;
    result[i + 2] = srcData[i + 2] * (1 - maskValue) + blurData[i + 2] * maskValue;
    result[i + 3] = srcData[i + 3];
  }

  return new ImageData(result, width, height);
};

// Message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = e.data;

  try {
    let result: ImageData;

    switch (type) {
      case 'APPLY_BLUR': {
        const { imageData, maskData, blurAmount, feather } = payload;
        result = applyBlurWithMask(imageData, maskData, blurAmount, feather);
        break;
      }

      case 'APPLY_CAMERA_RAW': {
        const { imageData, settings } = payload;
        result = applyCameraRawPipeline(imageData, settings);
        break;
      }

      case 'APPLY_CURVES': {
        const { imageData, curves } = payload;
        const masterLut = calculateSpline(curves.master);
        const redLut = calculateSpline(curves.red);
        const greenLut = calculateSpline(curves.green);
        const blueLut = calculateSpline(curves.blue);

        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = masterLut[redLut[data[i]]];
          data[i + 1] = masterLut[greenLut[data[i + 1]]];
          data[i + 2] = masterLut[blueLut[data[i + 2]]];
        }
        result = imageData;
        break;
      }

      case 'PROCESS_IMAGE': {
        // Generic image processing - can be extended
        result = payload.imageData;
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      id,
      success: true,
      data: result,
    };

    // Use postMessage with transfer list for better performance
    (self as unknown as Worker).postMessage(response, [result.data.buffer]);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    (self as unknown as Worker).postMessage(response);
  }
};

export {};
