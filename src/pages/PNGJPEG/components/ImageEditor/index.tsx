//#region Imports
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, message } from 'antd';

import useCanvas from '../../hooks/useCanvas';
import useHistory from '../../hooks/useHistory';
import {
  applyCrop,
  rotate,
  samplePixel,
  addOverlayImage,
  drawOverlayHelper,
  exportWithOverlay as helperExportWithOverlay,
  mergeLayerIntoBase as helperMergeLayerIntoBase,
  setLayerOpacity as helperSetLayerOpacity,
  setLayerBlend as helperSetLayerBlend,
  moveLayerUp as helperMoveLayerUp,
  moveLayerDown as helperMoveLayerDown,
  deleteLayer as helperDeleteLayer,
  selectLayer as helperSelectLayer,
  perspectiveApplyHelper,
} from '../../utils/helpers';
import ImageCanvas from './ImageCanvas';
import ImageEditorToolbar from './SideEditorToolbar';
import TopEditorToolbar from './TopEditorToolbar';
//#endregion

//#region Types
export type Tool = 'pan' | 'crop' | 'color' | 'ruler' | 'perspective' | 'select' | 'draw' | 'move';

type Props = {
  imageUrl: string;
  onExport?: (blob: Blob) => void;
};
//#endregion

const ImageEditor: React.FC<Props> = ({ imageUrl, onExport }) => {
  //#region Canvas Setup
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onLoad = (dataUrl: string) => history.push(dataUrl, 'Initial load');
  const { canvasRef, overlayRef, baseCanvas } = useCanvas(imageUrl, onLoad);
  const history = useHistory(canvasRef, overlayRef);
  //#endregion

  //#region Viewer State (pan/zoom)
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  //#endregion

  //#region Active Tool
  const [tool, setTool] = useState<Tool>('pan');
  //#endregion

  //#region Image Adjustments
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);

  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);

  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);

  const [dehaze, setDehaze] = useState(0);
  //#endregion

  //#region Crop Tool
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const cropStart = useRef<{ x: number; y: number } | null>(null);
  //#endregion

  //#region Perspective Tool
  const [showPerspectiveModal, setShowPerspectiveModal] = useState(false);

  // initialize to NaN pairs so we can detect "empty" slots
  const perspectivePoints = useRef<
    [number, number, number, number, number, number, number, number] | null
  >(null);

  // helper: ensure we have an array of 8 numbers (NaNs if empty)
  const ensurePerspectiveInit = () => {
    if (!perspectivePoints.current) {
      perspectivePoints.current = [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
    }
  };

  // helper: find index of a "near" point (within tolerance), else -1
  const findNearPointIndex = (x: number, y: number, tol = 12) => {
    if (!perspectivePoints.current) return -1;
    const p = perspectivePoints.current;
    for (let i = 0; i < 8; i += 2) {
      const px = p[i];
      const py = p[i + 1];
      if (!isNaN(px) && !isNaN(py)) {
        const dx = px - x;
        const dy = py - y;
        if (Math.sqrt(dx * dx + dy * dy) <= tol) return i;
      }
    }
    return -1;
  };
  //#endregion

  //#region Hotkey States
  const [toolBefore, setToolBefore] = useState<Tool | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isAltDown, setIsAltDown] = useState(false);
  //#endregion

  //#region Color Picker
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  //#endregion

  //#region Ruler Tool
  const rulerPoints = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dpiMeasured, setDpiMeasured] = useState<number | null>(null);
  //#endregion

  //#region Overlay Image (added)
  type Layer = {
    id: string;
    img: HTMLImageElement;
    rect: { x: number; y: number; w: number; h: number };
    opacity: number;
    blend: GlobalCompositeOperation;
  };

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [overlaySelected, setOverlaySelected] = useState(false);
  const overlayDrag = useRef<null | {
    layerId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>(null);
  const overlayResize = useRef<null | {
    layerId: string;
    handle: 'tl' | 'tr' | 'bl' | 'br';
    startX: number;
    startY: number;
    orig: { x: number; y: number; w: number; h: number };
  }>(null);
  //#endregion
  //#endregion

  // --- overlay image handlers (delegated to helpers) ---
  const onAddImage = (file: File) =>
    addOverlayImage(file, canvasRef, setLayers, setActiveLayerId, setOverlaySelected, drawOverlay);

  const exportWithOverlay = async (
    asJpeg: boolean,
    canvasRefArg: React.RefObject<HTMLCanvasElement>,
    callback?: (blob: Blob) => void,
  ) => helperExportWithOverlay(asJpeg, canvasRefArg, layers, callback);

  // Merge active layer into base canvas and record history
  const mergeLayerIntoBase = (id?: string) =>
    helperMergeLayerIntoBase(canvasRef, layers, setLayers, history, id);

  // Layer controls
  const setLayerOpacity = (id: string, opacity: number) =>
    helperSetLayerOpacity(setLayers, id, opacity);
  const setLayerBlend = (id: string, blend: GlobalCompositeOperation) =>
    helperSetLayerBlend(setLayers, id, blend);
  const moveLayerUp = (id: string) => helperMoveLayerUp(setLayers, id);
  const moveLayerDown = (id: string) => helperMoveLayerDown(setLayers, id);
  const deleteLayer = (id: string) => helperDeleteLayer(setLayers, id, setActiveLayerId);
  const selectLayer = (id: string) => {
    helperSelectLayer(setActiveLayerId, id);
    setOverlaySelected(true);
  };

  //#region Drawing Tool
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawLineWidth, setDrawLineWidth] = useState(2);
  const [brushType, setBrushType] = useState<'hard' | 'soft'>('hard');
  const [brushOpacity, setBrushOpacity] = useState(1); // 0 - 1
  const [brushFlow, setBrushFlow] = useState(1); // 0 - 1
  const [isDrawing, setIsDrawing] = useState(false);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);
  const resizingBrush = useRef(false);
  const resizeStartX = useRef<number | null>(null);
  const initialLineWidth = useRef(drawLineWidth);

  //#endregion

  //#region Filters
  const [blur, setBlur] = useState(0);
  const [gaussian, setGaussian] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [texture, setTexture] = useState(0);
  const [clarity, setClarity] = useState(0);

  const [bgThreshold, setBgThreshold] = useState(0);
  const [bgThresholdBlack, setBgThresholdBlack] = useState(0);

  const [hslAdjustments, setHslAdjustmentsState] = useState<
    Record<string, { h?: number; s?: number; l?: number }>
  >({});
  const setHslAdjustments = (
    name: string,
    values: Partial<{ h: number; s: number; l: number }>,
  ) => {
    setHslAdjustmentsState((prev) => ({
      ...prev,
      [name]: { ...(prev[name] || {}), ...values },
    }));
  };

  //#endregion

  //#region Event Effects & Handlers
  // #region 🖱️ Disable Right-Click Context Menu
  useEffect(() => {
    const canvas = containerRef.current;
    if (!canvas) return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => canvas.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  //#endregion

  // #region 🔍 Ctrl + Wheel Zoom Handler
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prev) => {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(prev * zoomFactor, 0.1), 12);

        const scaleChange = newZoom / prev;
        setOffset((prevOffset) => ({
          x: mouseX - (mouseX - prevOffset.x) * scaleChange,
          y: mouseY - (mouseY - prevOffset.y) * scaleChange,
        }));

        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);
  //#endregion

  //#region 🖲️ Mouse Events (Down/Move/Up for Tools)
  const handleMouseDownViewer = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    // overlay hit-test (priority: if clicking overlay and not using pan tool)
    // overlay hit-test (topmost first)
    if (layers.length > 0) {
      for (let i = layers.length - 1; i >= 0; i--) {
        const L = layers[i];
        const r = L.rect;
        const inside = x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
        if (!inside) continue;
        // detect corner handles
        const tol = 8 / Math.max(1, zoom);
        const near = (xx: number, yy: number) => Math.abs(x - xx) <= tol && Math.abs(y - yy) <= tol;
        const tl = near(r.x, r.y);
        const tr = near(r.x + r.w, r.y);
        const bl = near(r.x, r.y + r.h);
        const br = near(r.x + r.w, r.y + r.h);

        if (tool === 'move') {
          setActiveLayerId(L.id);
          setOverlaySelected(true);
          if (tl || tr || bl || br) {
            const handle = tl ? 'tl' : tr ? 'tr' : bl ? 'bl' : 'br';
            overlayResize.current = {
              layerId: L.id,
              handle,
              startX: x,
              startY: y,
              orig: { ...r },
            } as any;
            return;
          }
          overlayDrag.current = {
            layerId: L.id,
            startX: x,
            startY: y,
            origX: r.x,
            origY: r.y,
          } as any;
          return;
        }
        // if pan tool, ignore overlay so pan will take effect
        break;
      }
      // if clicked outside any layer
      setOverlaySelected(false);
    }

    if (tool === 'color' && e.altKey && e.button === 2) setTool('draw');
    // ALT + right button for brush resize
    if ((tool === 'draw' || tool === 'color') && e.altKey && e.button === 2) {
      e.preventDefault();
      resizingBrush.current = true;
      resizeStartX.current = e.clientX;
      initialLineWidth.current = drawLineWidth;
      return;
    }

    if (tool === 'pan' || tool === 'select') {
      setIsPanning(true);
      panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    } else if (tool === 'crop') {
      cropStart.current = { x, y };
      setCropRect({ x, y, w: 1, h: 1 });
    } else if (tool === 'ruler') {
      if (!rulerPoints.current) {
        rulerPoints.current = { x1: x, y1: y, x2: x, y2: y };
      } else {
        rulerPoints.current.x2 = x;
        rulerPoints.current.y2 = y;
        const dx = x - rulerPoints.current.x1;
        const dy = y - rulerPoints.current.y1;
        const px = Math.sqrt(dx * dx + dy * dy);
        const dpi = Math.round(
          (px / (canvasRef.current!.width / (window.devicePixelRatio || 1))) * 96,
        );
        setDpiMeasured(dpi);
        message.info(`Distance: ${Math.round(px)} px, estimated DPI: ${dpi}`);
        rulerPoints.current = null;
      }
    } else if (tool === 'perspective') {
      // initialize if needed
      ensurePerspectiveInit();

      // if click near an existing point, replace/move it
      const nearIdx = findNearPointIndex(x, y);
      if (nearIdx >= 0) {
        // move existing point
        perspectivePoints.current![nearIdx] = x;
        perspectivePoints.current![nearIdx + 1] = y;
        drawOverlay();
        return;
      }

      // otherwise, fill first empty (NaN) slot
      const p = perspectivePoints.current!;
      let placed = false;
      for (let i = 0; i < 8; i += 2) {
        if (isNaN(p[i]) || isNaN(p[i + 1])) {
          p[i] = x;
          p[i + 1] = y;
          placed = true;
          break;
        }
      }
      // if all filled and user clicks again, cycle replace the nearest point
      if (!placed) {
        const nearest = findNearPointIndex(x, y, 200); // large tol to find nearest
        if (nearest >= 0) {
          perspectivePoints.current![nearest] = x;
          perspectivePoints.current![nearest + 1] = y;
        } else {
          // replace index 0 (wrap) if nothing better
          perspectivePoints.current![0] = x;
          perspectivePoints.current![1] = y;
        }
      }

      drawOverlay();
    } else if (tool === 'draw') {
      setIsDrawing(true);
      drawPoints.current = [{ x, y }];
    }
  };

  const handleMouseMoveViewer = (e: React.MouseEvent) => {
    if (resizingBrush.current && resizeStartX.current !== null) {
      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.max(
        1,
        Math.round(Math.min(500, initialLineWidth.current + deltaX / 2) * 10) / 10,
      );
      setDrawLineWidth(newWidth);
      drawOverlay();
      return;
    }

    if ((tool === 'pan' || tool === 'select') && isPanning && panStart.current) {
      setOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }

    // pointer / handle hover cursors
    try {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / zoom;
      const cy = (e.clientY - rect.top) / zoom;
      let foundHandle: 'tl' | 'tr' | 'bl' | 'br' | 'move' | null = null;
      for (let i = layers.length - 1; i >= 0; i--) {
        const L = layers[i];
        const r = L.rect;
        const inside = cx >= r.x && cy >= r.y && cx <= r.x + r.w && cy <= r.y + r.h;
        const tol = 8 / Math.max(1, zoom);
        const near = (xx: number, yy: number) =>
          Math.abs(cx - xx) <= tol && Math.abs(cy - yy) <= tol;
        if (near(r.x, r.y)) {
          foundHandle = 'tl';
          break;
        }
        if (near(r.x + r.w, r.y)) {
          foundHandle = 'tr';
          break;
        }
        if (near(r.x, r.y + r.h)) {
          foundHandle = 'bl';
          break;
        }
        if (near(r.x + r.w, r.y + r.h)) {
          foundHandle = 'br';
          break;
        }
        if (inside) {
          foundHandle = 'move';
          break;
        }
      }
      if (containerRef.current) {
        if (!foundHandle) containerRef.current.style.cursor = currentCursor;
        else if (foundHandle === 'move') containerRef.current.style.cursor = 'move';
        else if (foundHandle === 'tl' || foundHandle === 'br')
          containerRef.current.style.cursor = 'nwse-resize';
        else containerRef.current.style.cursor = 'nesw-resize';
      }
    } catch (err) {
      // ignore
    }

    // overlay dragging
    const od = overlayDrag.current;
    if (od) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / zoom;
      const cy = (e.clientY - rect.top) / zoom;
      const dx = cx - od.startX;
      const dy = cy - od.startY;
      setLayers((prev) =>
        prev.map((L) =>
          L.id === od.layerId
            ? { ...L, rect: { x: od.origX + dx, y: od.origY + dy, w: L.rect.w, h: L.rect.h } }
            : L,
        ),
      );
      drawOverlay();
      return;
    } else if (tool === 'crop' && cropStart.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const cur = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
      setCropRect({
        x: Math.min(cropStart.current.x, cur.x),
        y: Math.min(cropStart.current.y, cur.y),
        w: Math.abs(cur.x - cropStart.current.x),
        h: Math.abs(cur.y - cropStart.current.y),
      });
      drawOverlay();
    } else if (tool === 'draw' && isDrawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      drawPoints.current.push({ x, y });

      const ctx = canvasRef.current.getContext('2d')!;
      ctx.save();
      // Set stroke color with opacity & flow
      ctx.globalAlpha = brushOpacity * brushFlow;

      // For soft brushes, use shadow blur
      if (brushType === 'soft') {
        ctx.shadowColor = drawColor;
        ctx.shadowBlur = drawLineWidth * 0.5;
        ctx.lineWidth = drawLineWidth * 0.5;
      } else {
        ctx.shadowBlur = 0;
        ctx.lineWidth = drawLineWidth;
      }

      ctx.strokeStyle = drawColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const points = drawPoints.current;
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
      ctx.restore();
      drawOverlay();
    } else {
      // overlay resize handling (mouse move without active drag)
      const or = overlayResize.current;
      if (or) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / zoom;
        const cy = (e.clientY - rect.top) / zoom;
        const { layerId, handle, startX, startY, orig } = or;
        // compute new rect depending on handle
        let nx = orig.x;
        let ny = orig.y;
        let nw = orig.w;
        let nh = orig.h;
        if (handle === 'tl') {
          nx = cx;
          ny = cy;
          nw = orig.w + (orig.x - nx);
          nh = orig.h + (orig.y - ny);
        } else if (handle === 'tr') {
          ny = cy;
          nw = cx - orig.x;
          nh = orig.h + (orig.y - ny);
        } else if (handle === 'bl') {
          nx = cx;
          nw = orig.w + (orig.x - nx);
          nh = cy - orig.y;
        } else if (handle === 'br') {
          nw = cx - orig.x;
          nh = cy - orig.y;
        }
        // aspect ratio lock when Shift pressed
        if (e.shiftKey) {
          const aspect = orig.w / Math.max(1, orig.h);
          if (handle === 'tl' || handle === 'tr' || handle === 'bl' || handle === 'br') {
            // derive size by larger delta
            const signW = nw < 0 ? -1 : 1;
            const signH = nh < 0 ? -1 : 1;
            const absW = Math.abs(nw);
            const absH = Math.abs(nh);
            if (absW / Math.max(1, absH) > aspect) {
              // width changed more -> adjust height
              nh = (absW / aspect) * signH;
            } else {
              nw = absH * aspect * signW;
            }
            // when changing top handles, adjust nx/ny to keep corner anchored
            if (handle === 'tl') {
              nx = orig.x + (orig.w - nw);
              ny = orig.y + (orig.h - nh);
            } else if (handle === 'tr') {
              ny = orig.y + (orig.h - nh);
            } else if (handle === 'bl') {
              nx = orig.x + (orig.w - nw);
            }
          }
        }
        // enforce min size
        nw = Math.max(4 / zoom, nw);
        nh = Math.max(4 / zoom, nh);
        setLayers((prev) =>
          prev.map((L) => (L.id === layerId ? { ...L, rect: { x: nx, y: ny, w: nw, h: nh } } : L)),
        );
        drawOverlay();
        return;
      }

      drawOverlay();
    }
  };

  const handleMouseUpViewer = () => {
    if (resizingBrush.current) {
      resizingBrush.current = false;
      resizeStartX.current = null;
      initialLineWidth.current = drawLineWidth;
      return;
    }
    // finalize overlay drag/resize
    if (overlayDrag.current || overlayResize.current) {
      overlayDrag.current = null;
      overlayResize.current = null;
      // leave overlaySelected true
      // do not push to history for now (overlay is non-destructive until user exports)
      drawOverlay();
      return;
    }

    setIsPanning(false);
    panStart.current = null;
    if (tool === 'crop' && cropRect)
      applyCrop(canvasRef, overlayRef, cropRect, setCropRect, history);
    if (tool === 'draw' && isDrawing) {
      setIsDrawing(false);
      history.push(canvasRef.current!.toDataURL(), 'Draw');
    }
  };
  //#endregion

  //#region 🎨 Draw Overlay Layer (Crop / Ruler / Perspective / Hover Preview)
  const drawOverlay = () => {
    drawOverlayHelper(overlayRef, canvasRef, {
      zoom,
      cropRect,
      rulerPoints: rulerPoints.current,
      perspectivePoints: perspectivePoints.current,
      hoverColor,
      tool,
      drawColor,
      drawLineWidth,
      layers,
      overlaySelected,
      activeLayerId,
    });
  };
  //#region 🎯 Color Picker & Hover Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent) => {
      if (tool === 'color') {
        const color = samplePixel(e, canvasRef, zoom);
        setHoverColor(color ? { x: e.clientX, y: e.clientY, color } : null);
        drawOverlay();
      } else if (tool === 'draw') {
        setHoverColor(drawColor ? { x: e.clientX, y: e.clientY, color: drawColor } : null);
        drawOverlay();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (tool === 'color') {
        const color = samplePixel(e, canvasRef, zoom);
        if (color) {
          setPickedColor(color);
          setDrawColor(color);
          navigator.clipboard.writeText(color).catch(() => {});
          message.success(`Picked color ${color}`);
        }
      }
    };

    const handleLeave = () => {
      if (tool === 'color') setHoverColor(null);
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, [tool, zoom, offset]);
  //#endregion

  //#region ⌨ Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') history.undo();
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') history.redo();
      if (e.key === 'c') setTool('crop');
      if (e.key === 'h') setTool('pan');
      if (e.key === 't') setTool('move');
      if (e.key === 'r') rotate(90, canvasRef, overlayRef, history.history);
      if (e.key === 'p') setTool('color');
      if (e.key === 'b') setTool('draw');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.index, history.history]);
  //#endregion

  // Quick hand tool when holding Spaceb
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // stop page scroll

        setIsSpaceDown((prev) => {
          if (!prev) {
            // first press
            setToolBefore((t) => {
              // store previous tool safely
              if (t === null) return tool;
              return t;
            });
            setTool('pan');
          }
          return true;
        });
      } else if (e.code === 'AltLeft' && tool === 'draw') {
        e.preventDefault();

        setIsAltDown((prev) => {
          if (!prev) {
            // first press
            setToolBefore((t) => {
              // store previous tool safely
              if (t === null) return tool;
              return t;
            });
            setTool('color');
          }
          return true;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);

        setToolBefore((prev) => {
          if (prev) {
            setTool(prev); // restore tool
          }
          return null; // clear buffer
        });
      } else if (e.code === 'AltLeft' && toolBefore === 'draw') {
        setIsAltDown(false);
        setToolBefore((prev) => {
          if (prev) {
            setTool(prev); // restore tool
          }
          return null; // clear buffer
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool]);
  //#endregion

  // #region 📐 Perspective Transform Apply
  const perspectiveApply = async () => {
    await perspectiveApplyHelper(
      canvasRef,
      overlayRef,
      perspectivePoints,
      history,
      setShowPerspectiveModal,
      drawOverlay,
    );
  };

  //#endregion
  //#endregion

  //#region Cursor Style
  const currentCursor = useMemo(() => {
    if ((tool === 'pan' || tool === 'select') && isPanning) return 'grabbing';
    switch (tool) {
      case 'pan':
        return 'grab';
      case 'move':
        return 'move';
      case 'crop':
      case 'ruler':
      case 'perspective':
        return 'crosshair';
      case 'color':
        return 'copy';
      case 'draw':
        return 'pointer';
      default:
        return 'default';
    }
  }, [tool, isPanning]);
  //#endregion

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <ImageEditorToolbar
        canvasRef={canvasRef}
        overlayRef={overlayRef}
        baseCanvas={baseCanvas}
        history={history}
        setTool={setTool}
        // Exposure & Color
        brightness={brightness}
        setBrightness={setBrightness}
        contrast={contrast}
        setContrast={setContrast}
        highlights={highlights}
        setHighlights={setHighlights}
        shadows={shadows}
        setShadows={setShadows}
        whites={whites}
        setWhites={setWhites}
        blacks={blacks}
        setBlacks={setBlacks}
        vibrance={vibrance}
        setVibrance={setVibrance}
        saturation={saturation}
        setSaturation={setSaturation}
        dehaze={dehaze}
        setDehaze={setDehaze}
        // Blur / Convolution
        blur={blur}
        setBlur={setBlur}
        gaussian={gaussian}
        setGaussian={setGaussian}
        sharpen={sharpen}
        setSharpen={setSharpen}
        texture={texture}
        setTexture={setTexture}
        clarity={clarity}
        setClarity={setClarity}
        // Background removal
        bgThreshold={bgThreshold}
        setBgThreshold={setBgThreshold}
        bgThresholdBlack={bgThresholdBlack}
        setBgThresholdBlack={setBgThresholdBlack}
        // Color mix (HSL)
        hslAdjustments={hslAdjustments}
        setHslAdjustments={setHslAdjustments}
        setShowPerspectiveModal={setShowPerspectiveModal}
        dpiMeasured={dpiMeasured}
        setDpiMeasured={setDpiMeasured}
        exportImage={exportWithOverlay}
        onExport={onExport}
      />

      <div style={{ flex: 1 }}>
        <TopEditorToolbar
          history={history}
          setZoom={setZoom}
          tool={tool}
          setTool={setTool}
          brushType={brushType}
          setBrushType={setBrushType}
          drawColor={drawColor}
          setDrawColor={setDrawColor}
          drawLineWidth={drawLineWidth}
          setDrawLineWidth={setDrawLineWidth}
          brushOpacity={brushOpacity}
          setBrushOpacity={setBrushOpacity}
          brushFlow={brushFlow}
          setBrushFlow={setBrushFlow}
          layers={layers}
          activeLayerId={activeLayerId}
          setLayerOpacity={setLayerOpacity}
          setLayerBlend={setLayerBlend}
          moveLayerUp={moveLayerUp}
          moveLayerDown={moveLayerDown}
          deleteLayer={deleteLayer}
          selectLayer={selectLayer}
          mergeLayer={mergeLayerIntoBase}
        />

        <ImageCanvas
          canvasRef={canvasRef}
          overlayRef={overlayRef}
          containerRef={containerRef}
          offset={offset}
          zoom={zoom}
          tool={tool}
          currentCursor={currentCursor}
          hoverColor={hoverColor}
          onMouseDown={handleMouseDownViewer}
          onMouseMove={handleMouseMoveViewer}
          onMouseUp={handleMouseUpViewer}
          onAddImage={onAddImage}
        />
      </div>

      <Modal
        title="Perspective correction"
        open={showPerspectiveModal}
        onOk={() => perspectiveApply()}
        onCancel={() => setShowPerspectiveModal(false)}
        okText="Apply"
      >
        <p>Click four points on the image (clockwise) to define the corners, then Apply.</p>
        <p style={{ marginTop: 8 }}>
          Tip: click a corner again to move it (or click near a point to reposition).
        </p>
      </Modal>
    </div>
  );
};

export default ImageEditor;
