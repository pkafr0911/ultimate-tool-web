import { message } from 'antd';
import { createCanvas } from './ImageEditorEngine';
import { Tool } from '../components/ImageEditor';

export const addOverlayImage = (
  file: File,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setLayers: React.Dispatch<any>,
  setActiveLayerId: (id: string | null) => void,
  setOverlaySelected: (v: boolean) => void,
  drawOverlay: () => void,
  setTool: React.Dispatch<React.SetStateAction<Tool>>,
) => {
  const img = new Image();
  img.onload = () => {
    const cw = canvasRef.current?.width || img.naturalWidth;
    const ch = canvasRef.current?.height || img.naturalHeight;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const scale = Math.min(1, Math.min(cw / (w * 1.2), ch / (h * 1.2)));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    const x = Math.round((cw - w) / 2);
    const y = Math.round((ch - h) / 2);
    const id = `${Date.now()}_${Math.round(Math.random() * 10000)}`;
    const newLayer = {
      id,
      type: 'image' as const,
      img,
      rect: { x, y, w, h },
      opacity: 1,
      blend: 'source-over' as const,
    } as any;
    setLayers((prev: any) => [...prev, newLayer]);
    setActiveLayerId(id);
    setOverlaySelected(true);
    drawOverlay();

    message.success('Overlay image added');
  };
  img.onerror = () => message.error('Failed to load overlay image');
  img.src = URL.createObjectURL(file);
  setTool('layer');
};

/**
 * Apply mask to a layer by creating a temporary canvas with the mask applied
 */
const applyMaskToLayer = (
  layer: any,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  if (!layer.mask) {
    // No mask, draw normally
    if (layer.type === 'image' && layer.img) {
      ctx.drawImage(layer.img, x, y, w, h);
    }
    return;
  }

  // Create temporary canvas for masked content
  const tempCanvas = createCanvas(w, h);
  const tempCtx = tempCanvas.getContext('2d')!;

  // Draw the layer content
  if (layer.type === 'image' && layer.img) {
    tempCtx.drawImage(layer.img, 0, 0, w, h);
  }

  // Apply mask using destination-in composite mode
  tempCtx.globalCompositeOperation = 'destination-in';
  tempCtx.drawImage(layer.mask, 0, 0, w, h);

  // Draw the masked result to main canvas
  ctx.drawImage(tempCanvas, x, y);
};

export const exportWithOverlay = async (
  asJpeg: boolean,
  canvasRefArg: React.RefObject<HTMLCanvasElement>,
  layers: any[],
  callback?: (blob: Blob) => void,
) => {
  if (!canvasRefArg.current) return;
  const base = canvasRefArg.current;
  const tmp = createCanvas(base.width, base.height);
  const tctx = tmp.getContext('2d')!;
  tctx.clearRect(0, 0, tmp.width, tmp.height);
  tctx.drawImage(base, 0, 0);
  for (const L of layers) {
    try {
      tctx.save();
      tctx.globalAlpha = L.opacity;
      tctx.globalCompositeOperation = L.blend || 'source-over';

      // Apply rotation if layer is rotated
      if (L.rotation && L.rotation !== 0) {
        const centerX = L.rect.x + L.rect.w / 2;
        const centerY = L.rect.y + L.rect.h / 2;
        tctx.translate(centerX, centerY);
        tctx.rotate((L.rotation * Math.PI) / 180);
        tctx.translate(-centerX, -centerY);
      }

      if (L.type === 'image' && L.img) {
        // Apply mask if present
        applyMaskToLayer(L, tctx, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
      } else if (L.type === 'text') {
        // Render text layer
        const fontStyle = L.fontItalic ? 'italic' : 'normal';
        const fontWeight = L.fontWeight || 'normal';
        const fontSize = L.fontSize || 16;
        tctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${L.font || 'Arial'}`;
        tctx.fillStyle = L.textColor || '#000000';
        tctx.textAlign = L.textAlign || 'left';
        tctx.textBaseline = 'top';

        // Draw text
        const lines = (L.text || '').split('\n');
        const lineHeight = fontSize * 1.2;
        let currentY = L.rect.y;
        for (const line of lines) {
          let xPos = L.rect.x;
          if (L.textAlign === 'center') xPos += L.rect.w / 2;
          else if (L.textAlign === 'right') xPos += L.rect.w;

          tctx.fillText(line, xPos, currentY);

          // Draw decoration
          if (L.textDecoration === 'underline') {
            const metrics = tctx.measureText(line);
            tctx.strokeStyle = L.textColor || '#000000';
            tctx.lineWidth = 1;
            tctx.beginPath();
            tctx.moveTo(xPos, currentY + fontSize);
            tctx.lineTo(xPos + metrics.width, currentY + fontSize);
            tctx.stroke();
          } else if (L.textDecoration === 'line-through') {
            const metrics = tctx.measureText(line);
            tctx.strokeStyle = L.textColor || '#000000';
            tctx.lineWidth = 1;
            tctx.beginPath();
            tctx.moveTo(xPos, currentY + fontSize / 2);
            tctx.lineTo(xPos + metrics.width, currentY + fontSize / 2);
            tctx.stroke();
          }
          currentY += lineHeight;
        }
      }

      tctx.restore();
    } catch (err) {
      // ignore
    }
  }
  tctx.globalAlpha = 1;
  tctx.globalCompositeOperation = 'source-over';
  const blob = await new Promise<Blob | null>((res) =>
    tmp.toBlob((b) => res(b), asJpeg ? 'image/jpeg' : 'image/png', 0.92),
  );
  if (blob) {
    if (callback) callback(blob);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asJpeg ? 'edited.jpg' : 'edited.png';
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported image (with overlays)');
  }
};

export const mergeLayerIntoBase = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  layers: any[],
  setLayers: React.Dispatch<any>,
  history: { push: (s: string, label: string) => void },
  id?: string,
) => {
  if (!canvasRef.current) return;
  const toMerge = id ? layers.filter((l) => l.id === id && !l.locked) : layers.slice();
  if (toMerge.length === 0) return;

  const ctx = canvasRef.current.getContext('2d')!;
  for (const L of toMerge) {
    try {
      ctx.save();
      ctx.globalAlpha = L.opacity;
      ctx.globalCompositeOperation = L.blend || 'source-over';

      // Apply rotation if layer is rotated
      if (L.rotation && L.rotation !== 0) {
        const centerX = L.rect.x + L.rect.w / 2;
        const centerY = L.rect.y + L.rect.h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((L.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      if (L.type === 'image' && L.img) {
        // Apply mask if present
        applyMaskToLayer(L, ctx, L.rect.x, L.rect.y, L.rect.w, L.rect.h);
      } else if (L.type === 'text') {
        // Render text layer
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
      // ignore
    }
  }
  setLayers((prev) => prev.filter((l: any) => !toMerge.find((m: any) => m.id === l.id)));
  history.push(canvasRef.current.toDataURL(), id ? 'Merge layer' : 'Merge layers');
  message.success('Layer(s) merged into base');
};

export const setLayerOpacity = (setLayers: React.Dispatch<any>, id: string, opacity: number) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, opacity } : L)));

export const setLayerBlend = (
  setLayers: React.Dispatch<any>,
  id: string,
  blend: GlobalCompositeOperation,
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, blend } : L)));

export const moveLayerUp = (setLayers: React.Dispatch<any>, id: string) =>
  setLayers((prev: any) => {
    const idx = prev.findIndex((p: any) => p.id === id);
    if (idx === -1 || idx === prev.length - 1) return prev;
    const copy = prev.slice();
    const tmp = copy[idx + 1];
    copy[idx + 1] = copy[idx];
    copy[idx] = tmp;
    return copy;
  });

export const moveLayerDown = (setLayers: React.Dispatch<any>, id: string) =>
  setLayers((prev: any) => {
    const idx = prev.findIndex((p: any) => p.id === id);
    if (idx <= 0) return prev;
    const copy = prev.slice();
    const tmp = copy[idx - 1];
    copy[idx - 1] = copy[idx];
    copy[idx] = tmp;
    return copy;
  });

export const deleteLayer = (
  setLayers: React.Dispatch<any>,
  id: string,
  setActiveLayerId?: (id: string | null) => void,
) =>
  setLayers((prev: any) => {
    const copy = prev.filter((p: any) => p.id !== id || p.locked);
    if (setActiveLayerId) setActiveLayerId(copy.length ? copy[copy.length - 1].id : null);
    return copy;
  });

export const selectLayer = (setActiveLayerId: (id: string | null) => void, id: string) => {
  setActiveLayerId(id);
};

// Text layer helpers
export const addTextLayer = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setLayers: React.Dispatch<any>,
  setActiveLayerId: (id: string | null) => void,
  setOverlaySelected: (v: boolean) => void,
  drawOverlay: () => void,
  textProps: {
    text: string;
    font: string;
    fontSize: number;
    fontWeight: any;
    fontItalic: boolean;
    textDecoration: 'none' | 'underline' | 'line-through';
    textColor: string;
    textAlign: 'left' | 'center' | 'right';
  },
  pos?: { x: number; y: number },
) => {
  if (!textProps.text.trim()) {
    message.warning('Please enter text first');
    return;
  }

  const cw = canvasRef.current?.width || 400;
  const ch = canvasRef.current?.height || 300;
  const x = pos ? Math.round(pos.x) : Math.round(cw / 4);
  const y = pos ? Math.round(pos.y) : Math.round(ch / 4);
  const id = `text_${Date.now()}_${Math.round(Math.random() * 10000)}`;

  const newLayer = {
    id,
    type: 'text' as const,
    rect: { x, y, w: Math.min(300, cw / 2), h: textProps.fontSize + 20 },
    opacity: 1,
    blend: 'source-over' as const,
    text: textProps.text,
    font: textProps.font,
    fontSize: textProps.fontSize,
    fontWeight: textProps.fontWeight,
    fontItalic: textProps.fontItalic,
    textDecoration: textProps.textDecoration,
    textColor: textProps.textColor,
    textAlign: textProps.textAlign,
  } as any;

  setLayers((prev: any) => [...prev, newLayer]);
  setActiveLayerId(id);
  setOverlaySelected(true);
  drawOverlay();
  message.success('Text layer added');
};

export const setLayerText = (setLayers: React.Dispatch<any>, id: string, text: string) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, text } : L)));

export const setLayerFont = (setLayers: React.Dispatch<any>, id: string, font: string) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, font } : L)));

export const setLayerFontSize = (setLayers: React.Dispatch<any>, id: string, fontSize: number) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, fontSize } : L)));

export const setLayerFontWeight = (setLayers: React.Dispatch<any>, id: string, fontWeight: any) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, fontWeight } : L)));

export const setLayerFontItalic = (
  setLayers: React.Dispatch<any>,
  id: string,
  fontItalic: boolean,
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, fontItalic } : L)));

export const setLayerTextDecoration = (
  setLayers: React.Dispatch<any>,
  id: string,
  textDecoration: 'none' | 'underline' | 'line-through',
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, textDecoration } : L)));

export const setLayerTextColor = (setLayers: React.Dispatch<any>, id: string, textColor: string) =>
  setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, textColor } : L)));

export const setLayerTextAlign = (
  setLayers: React.Dispatch<any>,
  id: string,
  textAlign: 'left' | 'center' | 'right',
) => setLayers((prev: any) => prev.map((L: any) => (L.id === id ? { ...L, textAlign } : L)));
