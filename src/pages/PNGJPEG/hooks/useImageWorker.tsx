import { useEffect, useRef, useState } from 'react';
import type { WorkerRequest, WorkerResponse } from '../workers/imageProcessor.worker';

type UseImageWorkerReturn = {
  processImage: (imageData: ImageData, effects: WorkerRequest['effects']) => Promise<ImageData>;
  isProcessing: boolean;
  error: string | null;
  terminate: () => void;
};

/**
 * Custom hook to manage the image processing worker
 * Handles worker lifecycle, communication, and error handling
 */
export default function useImageWorker(): UseImageWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<
    Map<
      string,
      {
        resolve: (data: ImageData) => void;
        reject: (error: Error) => void;
      }
    >
  >(new Map());

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdCounter = useRef(0);
  const lastRequestTime = useRef<number>(0);
  const minRequestInterval = 100; // Minimum 100ms between requests

  // Initialize worker on mount
  useEffect(() => {
    try {
      // Create worker from the worker file
      workerRef.current = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' },
      );

      // Handle messages from worker
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, type, imageData, error: workerError } = e.data;

        const pending = pendingRequestsRef.current.get(id);
        if (!pending) return;

        if (type === 'success' && imageData) {
          pending.resolve(imageData);
          setError(null);
        } else if (type === 'error') {
          pending.reject(new Error(workerError || 'Worker processing failed'));
          setError(workerError || 'Worker processing failed');
        }

        pendingRequestsRef.current.delete(id);

        // Update processing state
        if (pendingRequestsRef.current.size === 0) {
          setIsProcessing(false);
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (e) => {
        console.error('Worker error:', e);
        setError(e.message);
        setIsProcessing(false);

        // Reject all pending requests
        pendingRequestsRef.current.forEach((pending) => {
          pending.reject(new Error('Worker error: ' + e.message));
        });
        pendingRequestsRef.current.clear();
      };
    } catch (err) {
      console.error('Failed to initialize worker:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize worker');
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequestsRef.current.clear();
    };
  }, []);

  /**
   * Process an image with the given effects using the worker
   */
  const processImage = async (
    imageData: ImageData,
    effects: WorkerRequest['effects'],
  ): Promise<ImageData> => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    // Throttle requests to prevent overwhelming the worker
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < minRequestInterval) {
      // Wait a bit before processing
      await new Promise((resolve) =>
        setTimeout(resolve, minRequestInterval - timeSinceLastRequest),
      );
    }
    lastRequestTime.current = Date.now();

    // Cancel any pending requests (only keep the latest)
    if (pendingRequestsRef.current.size > 0) {
      const oldRequests = Array.from(pendingRequestsRef.current.values());
      pendingRequestsRef.current.clear();
      oldRequests.forEach((req) => req.reject(new Error('Superseded by newer request')));
    }

    setIsProcessing(true);

    const id = `req_${++requestIdCounter.current}`;

    return new Promise<ImageData>((resolve, reject) => {
      // Store the promise callbacks
      pendingRequestsRef.current.set(id, { resolve, reject });

      // Send request to worker
      // Note: Not using Transferable objects to avoid buffer detachment issues
      const request: WorkerRequest = {
        id,
        type: 'applyEffects',
        imageData,
        effects,
      };

      workerRef.current!.postMessage(request);

      // Set a timeout to prevent hanging (5 seconds for better UX)
      const timeoutId = setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id);
          const errorMsg = `Worker timeout after 5s. Image may be too large or effects too heavy.`;
          reject(new Error(errorMsg));
          setError(errorMsg);
          setIsProcessing(false);
        }
      }, 5000); // 5 second timeout

      // Clear timeout when request completes
      const originalResolve = resolve;
      const originalReject = reject;

      pendingRequestsRef.current.set(id, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          originalResolve(data);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          originalReject(error);
        },
      });
    });
  };

  /**
   * Manually terminate the worker
   */
  const terminate = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingRequestsRef.current.clear();
    setIsProcessing(false);
  };

  return {
    processImage,
    isProcessing,
    error,
    terminate,
  };
}
