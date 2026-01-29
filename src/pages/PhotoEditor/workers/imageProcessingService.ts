import { CameraRawSettings } from '../utils/cameraRawHelpers';

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

type PendingTask = {
  resolve: (data: ImageData) => void;
  reject: (error: Error) => void;
};

class ImageProcessingService {
  private worker: Worker | null = null;
  private pendingTasks: Map<string, PendingTask> = new Map();
  private taskIdCounter = 0;

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./imageProcessing.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, success, data, error } = e.data;
        const task = this.pendingTasks.get(id);

        if (task) {
          this.pendingTasks.delete(id);
          if (success && data) {
            task.resolve(data);
          } else {
            task.reject(new Error(error || 'Worker processing failed'));
          }
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending tasks
        this.pendingTasks.forEach((task) => {
          task.reject(new Error('Worker error'));
        });
        this.pendingTasks.clear();
      };
    }

    return this.worker;
  }

  private generateTaskId(): string {
    return `task_${++this.taskIdCounter}_${Date.now()}`;
  }

  private sendMessage(type: WorkerMessageType, payload: any): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const id = this.generateTaskId();
      const worker = this.getWorker();

      this.pendingTasks.set(id, { resolve, reject });

      const message: WorkerMessage = { type, id, payload };

      // Transfer ImageData buffers for better performance
      const transferables: Transferable[] = [];
      if (payload.imageData?.data?.buffer) {
        transferables.push(payload.imageData.data.buffer);
      }
      if (payload.maskData?.data?.buffer) {
        transferables.push(payload.maskData.data.buffer);
      }

      if (transferables.length > 0) {
        worker.postMessage(message, transferables);
      } else {
        worker.postMessage(message);
      }
    });
  }

  /**
   * Apply blur with mask using WebWorker
   */
  async applyBlurWithMask(
    sourceCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement,
    blurAmount: number = 15,
    feather: number = 7,
  ): Promise<HTMLCanvasElement> {
    const ctx = sourceCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const resultData = await this.sendMessage('APPLY_BLUR', {
      imageData,
      maskData,
      blurAmount,
      feather,
    });

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = sourceCanvas.width;
    resultCanvas.height = sourceCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    if (resultCtx) {
      resultCtx.putImageData(resultData, 0, 0);
    }

    return resultCanvas;
  }

  /**
   * Apply Camera Raw filter using WebWorker
   */
  async applyCameraRaw(
    sourceCanvas: HTMLCanvasElement,
    settings: CameraRawSettings,
  ): Promise<HTMLCanvasElement> {
    const ctx = sourceCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

    const resultData = await this.sendMessage('APPLY_CAMERA_RAW', {
      imageData,
      settings,
    });

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = sourceCanvas.width;
    resultCanvas.height = sourceCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    if (resultCtx) {
      resultCtx.putImageData(resultData, 0, 0);
    }

    return resultCanvas;
  }

  /**
   * Apply curves adjustment using WebWorker
   */
  async applyCurves(
    sourceCanvas: HTMLCanvasElement,
    curves: {
      master: { x: number; y: number }[];
      red: { x: number; y: number }[];
      green: { x: number; y: number }[];
      blue: { x: number; y: number }[];
    },
  ): Promise<HTMLCanvasElement> {
    const ctx = sourceCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

    const resultData = await this.sendMessage('APPLY_CURVES', {
      imageData,
      curves,
    });

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = sourceCanvas.width;
    resultCanvas.height = sourceCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    if (resultCtx) {
      resultCtx.putImageData(resultData, 0, 0);
    }

    return resultCanvas;
  }

  /**
   * Terminate the worker when no longer needed
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingTasks.clear();
    }
  }

  /**
   * Check if WebWorkers are supported
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }
}

// Singleton instance
export const imageProcessingService = new ImageProcessingService();

// Export for direct access if needed
export default ImageProcessingService;
