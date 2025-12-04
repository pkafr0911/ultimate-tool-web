// Reusable brush utilities for drawing operations

export type BrushSettings = {
  color: string;
  lineWidth: number;
  opacity: number;
  flow: number;
  type: 'hard' | 'soft';
};

/**
 * Draw a stroke on canvas with brush settings
 */
export const drawBrushStroke = (
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  settings: BrushSettings,
) => {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = settings.opacity * settings.flow;

  // For soft brushes, use shadow blur
  if (settings.type === 'soft') {
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = settings.lineWidth * 0.5;
    ctx.lineWidth = settings.lineWidth * 0.5;
  } else {
    ctx.shadowBlur = 0;
    ctx.lineWidth = settings.lineWidth;
  }

  ctx.strokeStyle = settings.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
};

/**
 * Draw brush cursor overlay
 */
export const drawBrushCursor = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  zoom: number = 1,
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

/**
 * Convert mouse event to canvas coordinates
 */
export const getCanvasCoords = (
  e: MouseEvent | React.MouseEvent,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  zoom: number = 1,
  offset: { x: number; y: number } = { x: 0, y: 0 },
): { x: number; y: number } | null => {
  if (!canvasRef.current) return null;
  const rect = canvasRef.current.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoom - offset.x,
    y: (e.clientY - rect.top) / zoom - offset.y,
  };
};

/**
 * Sample pixel color from canvas
 */
export const samplePixelColor = (
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
): string | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(x, y, 1, 1);
  const [r, g, b] = imageData.data;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
