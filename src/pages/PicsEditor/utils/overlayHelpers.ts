import { drawBrushCursor } from './brushHelpers';

export const drawOverlayHelper = (
  overlayRef: React.RefObject<HTMLCanvasElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  params: {
    zoom: number;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    rulerPoints: { x1: number; y1: number; x2: number; y2: number } | null;
    perspectivePoints: number[] | null;
    hoverColor: { x: number; y: number; color: string } | null;
    tool: any;
    drawColor: string;
    drawLineWidth: number;
    layers: any[];
    overlaySelected: boolean;
    activeLayerId?: string | null;
  },
) => {
  if (!overlayRef.current || !canvasRef.current) return;
  const {
    zoom,
    cropRect,
    rulerPoints,
    perspectivePoints,
    hoverColor,
    tool,
    drawColor,
    drawLineWidth,
    layers,
    overlaySelected,
    activeLayerId,
  } = params;

  const ctx = overlayRef.current.getContext('2d')!;
  ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);

  // Crop rectangle
  if (cropRect) {
    ctx.save();
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    ctx.restore();
  }

  // Ruler
  if (rulerPoints) {
    ctx.save();
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rulerPoints.x1, rulerPoints.y1);
    ctx.lineTo(rulerPoints.x2, rulerPoints.y2);
    ctx.stroke();
    ctx.restore();
  }

  // Perspective points
  if (perspectivePoints) {
    const p = perspectivePoints;
    ctx.save();
    const validPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i += 2) {
      const px = p[i];
      const py = p[i + 1];
      if (!isNaN(px) && !isNaN(py)) validPoints.push({ x: px, y: py });
    }

    if (validPoints.length >= 2) {
      ctx.strokeStyle = 'rgba(0,255,0,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(validPoints[0].x, validPoints[0].y);
      for (let i = 1; i < validPoints.length; i++) ctx.lineTo(validPoints[i].x, validPoints[i].y);
      if (validPoints.length === 4) ctx.closePath();
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,255,0,0.9)';
    for (let i = 0; i < 8; i += 2) {
      const x = p[i];
      const y = p[i + 1];
      if (!isNaN(x) && !isNaN(y)) ctx.fillRect(x - 5, y - 5, 10, 10);
    }
    ctx.restore();
  }

  // Color hover
  if (hoverColor && (tool === 'color' || tool === 'removeColor')) {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (hoverColor.x - rect.left) / zoom;
    const canvasY = (hoverColor.y - rect.top) / zoom;
    drawBrushCursor(ctx, canvasX, canvasY, 16 / zoom, hoverColor.color, zoom);
  }

  // draw layers
  for (const L of layers) {
    try {
      ctx.save();
      ctx.globalAlpha = L.opacity;
      ctx.globalCompositeOperation = L.blend || 'source-over';

      // Apply rotation if specified
      if (L.rotation && L.rotation !== 0) {
        const centerX = L.rect.x + L.rect.w / 2;
        const centerY = L.rect.y + L.rect.h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((L.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      if (L.type === 'image' && L.img) {
        if (L.mask) {
          // Apply mask for preview
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = L.rect.w;
          tempCanvas.height = L.rect.h;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(L.img, 0, 0, L.rect.w, L.rect.h);
          tempCtx.globalCompositeOperation = 'destination-in';
          tempCtx.drawImage(L.mask, 0, 0, L.rect.w, L.rect.h);
          ctx.drawImage(tempCanvas, L.rect.x, L.rect.y);
        } else {
          ctx.drawImage(L.img, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
        }
      } else if (L.type === 'text') {
        // Render text layer in overlay
        const fontStyle = L.fontItalic ? 'italic' : 'normal';
        const fontWeight = L.fontWeight || 'normal';
        const fontSize = L.fontSize || 16;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${L.font || 'Arial'}`;
        ctx.fillStyle = L.textColor || '#000000';
        ctx.textAlign = L.textAlign || 'left';
        ctx.textBaseline = 'top';

        const lines = (L.text || '').split('\n');
        const lineHeight = fontSize * 1.2;
        let currentY = L.rect.y;
        for (const line of lines) {
          let xPos = L.rect.x;
          if (L.textAlign === 'center') xPos += L.rect.w / 2;
          else if (L.textAlign === 'right') xPos += L.rect.w;

          ctx.fillText(line, xPos, currentY);

          // Draw decoration
          if (L.textDecoration === 'underline') {
            const metrics = ctx.measureText(line);
            ctx.strokeStyle = L.textColor || '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + fontSize);
            ctx.lineTo(xPos + metrics.width, currentY + fontSize);
            ctx.stroke();
          } else if (L.textDecoration === 'line-through') {
            const metrics = ctx.measureText(line);
            ctx.strokeStyle = L.textColor || '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos, currentY + fontSize / 2);
            ctx.lineTo(xPos + metrics.width, currentY + fontSize / 2);
            ctx.stroke();
          }
          currentY += lineHeight;
        }
      }
      ctx.restore();
    } catch (err) {
      // ignore draw errors per layer
    }
  }

  // draw selection for active layer on top
  if (overlaySelected && activeLayerId) {
    const L = layers.find((x: any) => x.id === activeLayerId);
    if (L) {
      const r = L.rect;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Apply rotation to selection outline if layer is rotated
      if (L.rotation && L.rotation !== 0) {
        const centerX = r.x + r.w / 2;
        const centerY = r.y + r.h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((L.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.strokeStyle = 'rgba(255,165,0,0.95)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,165,0,0.95)';
      const size = Math.max(6 / Math.max(1, zoom), 6);
      const half = size / 2;

      // Draw corner handles
      const corners = [
        [r.x, r.y],
        [r.x + r.w, r.y],
        [r.x, r.y + r.h],
        [r.x + r.w, r.y + r.h],
      ];
      corners.forEach(([cx, cy]) => ctx.fillRect(cx - half, cy - half, size, size));

      // Draw midpoint handles (new feature)
      ctx.fillStyle = 'rgba(0,180,255,0.95)'; // Different color for midpoints
      const midpoints = [
        [r.x + r.w / 2, r.y], // top
        [r.x + r.w / 2, r.y + r.h], // bottom
        [r.x, r.y + r.h / 2], // left
        [r.x + r.w, r.y + r.h / 2], // right
      ];
      midpoints.forEach(([mx, my]) => {
        ctx.fillRect(mx - half, my - half, size, size);
      });

      ctx.restore();
    }
  }

  // draw brush hover
  if (hoverColor && tool === 'draw') {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (hoverColor.x - rect.left) / zoom;
    const canvasY = (hoverColor.y - rect.top) / zoom;
    drawBrushCursor(ctx, canvasX, canvasY, drawLineWidth, drawColor, zoom);
  }
};

// Text editor overlay creation helper
type CreateTextEditorParams = {
  canvasX: number;
  canvasY: number;
  canvasRect: DOMRect;
  containerRef: React.RefObject<HTMLDivElement>;
  inlineEditorRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  zoom: number;
  initial?: string;
  layerId?: string;
  layer?: any;
  textColor?: string;
  textFont?: string;
  textFontSize?: number;
  textWeight?: any;
  textItalic?: boolean;
  onCommit: (value: string) => void;
  onCancel?: () => void;
};

export const createTextEditorOverlay = (params: CreateTextEditorParams) => {
  const {
    canvasX,
    canvasY,
    canvasRect,
    containerRef,
    inlineEditorRef,
    zoom,
    initial = '',
    layerId,
    layer,
    textColor = '#000',
    textFont = 'Arial',
    textFontSize = 16,
    textWeight = 'normal',
    textItalic = false,
    onCommit,
    onCancel,
  } = params;

  // remove any existing editor
  if (inlineEditorRef.current) {
    inlineEditorRef.current.remove();
    inlineEditorRef.current = null;
  }

  const cont = containerRef.current;
  const contRect = cont ? cont.getBoundingClientRect() : { left: 0, top: 0 };
  const clientLeft = canvasRect.left + canvasX * zoom;
  const clientTop = canvasRect.top + canvasY * zoom;
  const left = clientLeft - contRect.left;
  const top = clientTop - contRect.top;

  const ta = document.createElement('textarea');
  ta.value = initial;
  ta.style.position = 'absolute';
  ta.style.left = `${left}px`;
  ta.style.top = `${top}px`;
  ta.style.zIndex = '10000';
  ta.style.minWidth = '60px';
  ta.style.minHeight = '24px';
  ta.style.background = 'transparent';
  ta.style.border = '1px dashed rgba(0,0,0,0.4)';
  ta.style.color = (layer && layer.textColor) || textColor || '#000';
  ta.style.fontFamily = (layer && layer.font) || textFont || 'Arial';
  const fontSizeValue = (layer && layer.fontSize) || textFontSize || 16;
  ta.style.fontSize = `${fontSizeValue * zoom}px`;
  ta.style.fontWeight = String((layer && layer.fontWeight) || textWeight || 'normal');
  ta.style.fontStyle = (layer && layer.fontItalic) || textItalic ? 'italic' : 'normal';
  ta.style.resize = 'both';
  ta.style.outline = 'none';
  ta.style.padding = '4px';
  ta.placeholder = 'Type text and press Enter';

  let commited = false;
  const doCommit = () => {
    if (commited) return;
    commited = Boolean(ta.value) && !Boolean(initial);
    onCommit(ta.value || '');
    ta.remove();
    inlineEditorRef.current = null;
  };

  const doCancel = () => {
    ta.remove();
    inlineEditorRef.current = null;
    if (onCancel) onCancel();
  };

  ta.addEventListener('keydown', (ev) => {
    if (ev.shiftKey && ev.key === 'Enter') return;
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      doCommit();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      doCancel();
    }
  });

  ta.addEventListener('blur', () => {
    doCommit();
  });

  const appendToContainer = () => {
    try {
      if (cont) cont.appendChild(ta);
      else throw new Error('no container');
    } catch (err) {
      console.warn('[DEBUG] append to container failed, will fallback to body', err);
      appendToBody();
      return;
    }
    inlineEditorRef.current = ta;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    // quick sanity check: if element seems invisible, fallback
    requestAnimationFrame(() => {
      try {
        const r = ta.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) {
          console.warn('[DEBUG] appended editor has zero size; falling back to body');
          ta.remove();
          appendToBody();
        }
      } catch (e) {
        // ignore
      }
    });
  };

  const appendToBody = () => {
    const fixedLeft = clientLeft;
    const fixedTop = clientTop;
    ta.style.position = 'fixed';
    ta.style.left = `${fixedLeft}px`;
    ta.style.top = `${fixedTop}px`;
    ta.style.zIndex = '200000';
    document.body.appendChild(ta);
    inlineEditorRef.current = ta;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
    console.log('[DEBUG] appended editor to document.body at', { fixedLeft, fixedTop });
  };

  // Try append to container first; fallback to body when necessary
  if (cont) appendToContainer();
  else appendToBody();
};
