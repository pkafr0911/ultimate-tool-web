// Reusable brush utilities for drawing operations

//#region Types
export type BrushSettings = {
  color: string;
  lineWidth: number;
  opacity: number;
  flow: number;
  type: 'hard' | 'soft';
};
//#endregion

//#region Drawing Functions
/**
 * Draw a stroke on canvas with brush settings.
 * Handles both hard and soft brushes using shadowBlur for softness.
 *
 * @param ctx - The canvas 2D context to draw on
 * @param points - Array of points {x, y} representing the stroke path
 * @param settings - Brush configuration (color, size, opacity, etc.)
 */
export const drawBrushStroke = (
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  settings: BrushSettings,
) => {
  if (points.length < 2) return;

  ctx.save();
  // Combine opacity and flow for the stroke alpha
  ctx.globalAlpha = settings.opacity * settings.flow;

  // For soft brushes, use shadow blur to create the soft edge effect
  if (settings.type === 'soft') {
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = settings.lineWidth * 0.5;
    // Reduce actual line width when using shadow to avoid a hard core
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
 * Draw brush cursor overlay (circle outline).
 *
 * @param ctx - The overlay canvas context
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param size - Diameter of the brush
 * @param color - Color of the cursor outline
 * @param zoom - Current zoom level (to keep line width constant on screen)
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
  // Keep the cursor outline thin regardless of zoom
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};
//#endregion

//#region Coordinate Helpers
/**
 * Convert mouse event client coordinates to canvas-relative coordinates.
 * Accounts for zoom and pan offset.
 *
 * @param e - Mouse event
 * @param canvasRef - Reference to the canvas element
 * @param zoom - Current zoom level
 * @param offset - Current pan offset {x, y}
 * @returns {x, y} in canvas coordinates or null if canvas not found
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
//#endregion

//#region Color Helpers
/**
 * Sample pixel color from canvas at specific coordinates.
 *
 * @param canvas - The source canvas
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Hex color string (e.g. "#ff0000") or null
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
//#endregion
