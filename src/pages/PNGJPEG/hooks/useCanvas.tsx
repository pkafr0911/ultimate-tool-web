import { useEffect, useRef, useState } from 'react';
import { createCanvas, drawImageToCanvasFromUrl } from '../utils/ImageEditorEngine';
import { message } from 'antd';

export default function useCanvas(imageUrl: string, onLoad?: (dataUrl: string) => void) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);

  // Load image once
  useEffect(() => {
    (async () => {
      try {
        const c = await drawImageToCanvasFromUrl(imageUrl);
        setBaseCanvas(c);

        const working = createCanvas(c.width, c.height);
        working.getContext('2d')!.drawImage(c, 0, 0);

        if (canvasRef.current) {
          canvasRef.current.width = working.width;
          canvasRef.current.height = working.height;
          const ctx = canvasRef.current.getContext('2d')!;
          ctx.clearRect(0, 0, working.width, working.height);
          ctx.drawImage(working, 0, 0);
        }

        if (onLoad) onLoad(canvasToDataUrl(working));
      } catch (err) {
        console.error('Failed to load image', err);
        message.error('Failed to load image');
      }
    })();
  }, [imageUrl]);

  // Resize overlay when baseCanvas is ready
  useEffect(() => {
    syncCanvasSize();
  }, [baseCanvas]);

  /** Convert canvas → dataURL */
  const canvasToDataUrl = (c: HTMLCanvasElement) => c.toDataURL('image/png');

  /** Sync canvas & overlay sizes */
  const syncCanvasSize = () => {
    if (!canvasRef.current || !baseCanvas) return;

    canvasRef.current.width = baseCanvas.width;
    canvasRef.current.height = baseCanvas.height;
    overlayRef.current!.width = baseCanvas.width;
    overlayRef.current!.height = baseCanvas.height;

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(baseCanvas, 0, 0);
  };

  return { canvasRef, overlayRef, baseCanvas, setBaseCanvas, syncCanvasSize };
}
