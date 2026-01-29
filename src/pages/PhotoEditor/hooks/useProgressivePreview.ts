import { useCallback, useRef } from 'react';

export interface ProgressivePreviewOptions {
  maxPreviewSize?: number; // Max dimension for preview (default: 1920)
  qualityThreshold?: number; // Pixel count threshold for preview mode (default: 2K = 2048x2048)
  debounceMs?: number; // Debounce time for preview updates
}

export interface ProgressivePreviewResult {
  /**
   * Create a downscaled canvas for preview operations
   */
  createPreviewCanvas: (source: HTMLCanvasElement) => HTMLCanvasElement;

  /**
   * Scale results back to original dimensions
   */
  scaleToOriginal: (
    previewCanvas: HTMLCanvasElement,
    originalWidth: number,
    originalHeight: number,
  ) => HTMLCanvasElement;

  /**
   * Check if progressive preview should be used based on image size
   */
  shouldUseProgressivePreview: (width: number, height: number) => boolean;

  /**
   * Get the preview scale factor for a given canvas
   */
  getPreviewScale: (width: number, height: number) => number;

  /**
   * Apply operation with progressive preview support
   */
  applyWithPreview: <T>(
    sourceCanvas: HTMLCanvasElement,
    operation: (canvas: HTMLCanvasElement) => Promise<T>,
    isPreview?: boolean,
  ) => Promise<{ result: T; canvas: HTMLCanvasElement }>;
}

const DEFAULT_MAX_PREVIEW_SIZE = 1920;
const DEFAULT_QUALITY_THRESHOLD = 2048 * 2048; // 4 megapixels

export const useProgressivePreview = (
  options: ProgressivePreviewOptions = {},
): ProgressivePreviewResult => {
  const {
    maxPreviewSize = DEFAULT_MAX_PREVIEW_SIZE,
    qualityThreshold = DEFAULT_QUALITY_THRESHOLD,
  } = options;

  const scaleCache = useRef<Map<string, number>>(new Map());

  const getPreviewScale = useCallback(
    (width: number, height: number): number => {
      const cacheKey = `${width}x${height}`;
      if (scaleCache.current.has(cacheKey)) {
        return scaleCache.current.get(cacheKey)!;
      }

      const pixelCount = width * height;
      if (pixelCount <= qualityThreshold) {
        scaleCache.current.set(cacheKey, 1);
        return 1;
      }

      const maxDimension = Math.max(width, height);
      const scale = Math.min(1, maxPreviewSize / maxDimension);
      scaleCache.current.set(cacheKey, scale);
      return scale;
    },
    [maxPreviewSize, qualityThreshold],
  );

  const shouldUseProgressivePreview = useCallback(
    (width: number, height: number): boolean => {
      return width * height > qualityThreshold;
    },
    [qualityThreshold],
  );

  const createPreviewCanvas = useCallback(
    (source: HTMLCanvasElement): HTMLCanvasElement => {
      const scale = getPreviewScale(source.width, source.height);

      if (scale >= 1) {
        // No downscaling needed, return a copy
        const copy = document.createElement('canvas');
        copy.width = source.width;
        copy.height = source.height;
        const ctx = copy.getContext('2d');
        if (ctx) {
          ctx.drawImage(source, 0, 0);
        }
        return copy;
      }

      const previewWidth = Math.round(source.width * scale);
      const previewHeight = Math.round(source.height * scale);

      const preview = document.createElement('canvas');
      preview.width = previewWidth;
      preview.height = previewHeight;

      const ctx = preview.getContext('2d');
      if (ctx) {
        // Use better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, previewWidth, previewHeight);
      }

      return preview;
    },
    [getPreviewScale],
  );

  const scaleToOriginal = useCallback(
    (
      previewCanvas: HTMLCanvasElement,
      originalWidth: number,
      originalHeight: number,
    ): HTMLCanvasElement => {
      if (previewCanvas.width === originalWidth && previewCanvas.height === originalHeight) {
        return previewCanvas;
      }

      const result = document.createElement('canvas');
      result.width = originalWidth;
      result.height = originalHeight;

      const ctx = result.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(previewCanvas, 0, 0, originalWidth, originalHeight);
      }

      return result;
    },
    [],
  );

  const applyWithPreview = useCallback(
    async <T>(
      sourceCanvas: HTMLCanvasElement,
      operation: (canvas: HTMLCanvasElement) => Promise<T>,
      isPreview = false,
    ): Promise<{ result: T; canvas: HTMLCanvasElement }> => {
      const originalWidth = sourceCanvas.width;
      const originalHeight = sourceCanvas.height;
      const usePreview = isPreview && shouldUseProgressivePreview(originalWidth, originalHeight);

      let workingCanvas: HTMLCanvasElement;

      if (usePreview) {
        workingCanvas = createPreviewCanvas(sourceCanvas);
      } else {
        // Create a copy to avoid modifying the original
        workingCanvas = document.createElement('canvas');
        workingCanvas.width = originalWidth;
        workingCanvas.height = originalHeight;
        const ctx = workingCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(sourceCanvas, 0, 0);
        }
      }

      const result = await operation(workingCanvas);

      // If we used preview mode, we might need to scale back for final apply
      // But for preview display, we keep the smaller size
      return {
        result,
        canvas:
          usePreview && !isPreview
            ? scaleToOriginal(workingCanvas, originalWidth, originalHeight)
            : workingCanvas,
      };
    },
    [shouldUseProgressivePreview, createPreviewCanvas, scaleToOriginal],
  );

  return {
    createPreviewCanvas,
    scaleToOriginal,
    shouldUseProgressivePreview,
    getPreviewScale,
    applyWithPreview,
  };
};

/**
 * Utility to get image dimensions info
 */
export const getImageSizeInfo = (
  width: number,
  height: number,
): {
  totalPixels: number;
  megaPixels: string;
  is4K: boolean;
  is2K: boolean;
  isHD: boolean;
  recommendation: string;
} => {
  const totalPixels = width * height;
  const megaPixels = (totalPixels / 1_000_000).toFixed(2);
  const is4K = width >= 3840 || height >= 2160;
  const is2K = width >= 2048 || height >= 1080;
  const isHD = width >= 1920 || height >= 1080;

  let recommendation = 'Full resolution editing';
  if (is4K) {
    recommendation = 'Progressive preview recommended for smoother editing';
  } else if (is2K) {
    recommendation = 'Some operations may benefit from preview mode';
  }

  return {
    totalPixels,
    megaPixels,
    is4K,
    is2K,
    isHD,
    recommendation,
  };
};

export default useProgressivePreview;
