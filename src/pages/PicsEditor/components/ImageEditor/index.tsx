//#region Imports
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, message, Button, Tour } from 'antd';
import type { TourProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

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
  addTextLayer as helperAddTextLayer,
  setLayerText as helperSetLayerText,
  setLayerFont as helperSetLayerFont,
  setLayerFontSize as helperSetLayerFontSize,
  setLayerFontWeight as helperSetLayerFontWeight,
  setLayerFontItalic as helperSetLayerFontItalic,
  setLayerTextDecoration as helperSetLayerTextDecoration,
  setLayerTextColor as helperSetLayerTextColor,
  setLayerTextAlign as helperSetLayerTextAlign,
  createTextEditorOverlay,
  applyUpscale,
  applyInvertColors,
  applyColorRemoval,
  applyMaskToCanvas,
} from '../../utils/helpers';
import { drawBrushStroke, BrushSettings } from '../../utils/brushHelpers';
import ImageCanvas from './ImageCanvas';
import ColorRemovalModal from './ColorRemovalModal';
import LayerMaskModal from './LayerMaskModal';
import LayerEffectModal from './LayerEffectModal';
import SideEditorToolbar from './SideEditorToolbar';
import TopEditorToolbar from './TopEditorToolbar';
//#endregion

//#region Types
export type Tool =
  | 'pan'
  | 'crop'
  | 'color'
  | 'ruler'
  | 'perspective'
  | 'select'
  | 'draw'
  | 'layer'
  | 'upscale'
  | 'text'
  | 'removeColor';

type Props = {
  imageUrl: string;
  addOnFile?: File | null;
  setAddOnFile: React.Dispatch<React.SetStateAction<File | null>>;
  onExport?: (blob: Blob) => void;
};
//#endregion

const ImageEditor: React.FC<Props> = ({ imageUrl, addOnFile, setAddOnFile, onExport }) => {
  //#region Canvas Setup
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onLoad = (dataUrl: string) => history.push(dataUrl, 'Initial load');
  const { canvasRef, overlayRef, baseCanvas, setBaseCanvas, syncCanvasSize } = useCanvas(
    imageUrl,
    onLoad,
  );
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
  const [showCropModal, setShowCropModal] = useState(false);

  const handleConfirmCrop = () => {
    if (cropRect) {
      cropStart.current = null;
      applyCrop(canvasRef, overlayRef, cropRect, setCropRect, history);
      setShowCropModal(false);
    }
  };

  const handleCancelCrop = () => {
    setCropRect(null);
    setShowCropModal(false);
  };
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
  const [isShiftDown, setIsShiftDown] = useState(false);
  //#endregion

  //#region Color Picker
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  //#endregion

  //#region Color Removal Tool
  const [showColorRemovalModal, setShowColorRemovalModal] = useState(false);
  const [selectedColorForRemoval, setSelectedColorForRemoval] = useState<string | null>(null);
  //#endregion

  //#region Layer Mask Tool
  const [showLayerMaskModal, setShowLayerMaskModal] = useState(false);
  const [maskEditingLayerId, setMaskEditingLayerId] = useState<string | null>(null);
  //#endregion

  //#region Layer Effects Tool
  const [showLayerEffectModal, setShowLayerEffectModal] = useState(false);
  const [effectEditingLayerId, setEffectEditingLayerId] = useState<string | null>(null);
  //#endregion

  //#region Ruler Tool
  const rulerPoints = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dpiMeasured, setDpiMeasured] = useState<number | null>(null);
  //#endregion

  //#region Overlay Image & Text (added)
  type Layer = {
    id: string;
    type: 'image' | 'text'; // distinguish between image and text layers
    img?: HTMLImageElement; // for image layers
    rect: { x: number; y: number; w: number; h: number };
    opacity: number;
    blend: GlobalCompositeOperation;
    rotation?: number; // rotation angle in degrees
    // Text layer properties
    text?: string;
    font?: string; // e.g., 'Arial', 'Helvetica'
    fontSize?: number; // in pixels
    fontWeight?:
      | 'normal'
      | 'bold'
      | 'lighter'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900';
    fontItalic?: boolean;
    textDecoration?: 'none' | 'underline' | 'line-through';
    textColor?: string; // hex or rgb color
    textAlign?: 'left' | 'center' | 'right';
    locked?: boolean;
    mask?: HTMLCanvasElement; // layer mask (grayscale canvas where white=keep, black=remove)
  };

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [overlaySelected, setOverlaySelected] = useState(false);

  // Text tool controls
  const [textContent, setTextContent] = useState('');
  const [textFont, setTextFont] = useState('Arial');
  const [textFontSize, setTextFontSize] = useState(32);
  const [textColor, setTextColor] = useState('#000000');
  const [textWeight, setTextWeight] = useState<Layer['fontWeight']>('normal');
  const [textItalic, setTextItalic] = useState(false);
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>(
    'none',
  );
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isAddingText, setIsAddingText] = useState(false); // track if user clicked to place text
  const overlayDrag = useRef<null | {
    layerId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>(null);
  const inlineEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayResize = useRef<null | {
    layerId: string;
    handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';
    startX: number;
    startY: number;
    orig: { x: number; y: number; w: number; h: number };
  }>(null);
  const overlayRotate = useRef<null | {
    layerId: string;
    startX: number;
    startY: number;
    centerX: number;
    centerY: number;
    startAngle: number;
    originalRotation: number;
  }>(null);
  //#endregion

  //#region Export State
  const [showExportModal, setShowExportModal] = useState(false);
  //#endregion

  //#region Tour (Help) State
  const [openTour, setOpenTour] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  //#endregion
  //#endregion

  // --- overlay image handlers (delegated to helpers) ---
  useEffect(() => {
    if (addOnFile) {
      onAddImage(addOnFile);
      setAddOnFile(null);
    }
  }, [addOnFile]);

  // Ensure base overlay layer exists (locked, opacity 0) so overlay tools can reference it
  useEffect(() => {
    if (!baseCanvas) return;
    setLayers((prev) => {
      if (prev[0] && prev[0].locked) return prev;
      const img = new Image();
      img.src = baseCanvas.toDataURL();
      const id = `base_overlay_${Date.now()}`;
      const baseLayer = {
        id,
        type: 'image' as const,
        img,
        rect: { x: 0, y: 0, w: baseCanvas.width, h: baseCanvas.height },
        opacity: 0,
        blend: 'source-over' as const,
        locked: true,
      } as any;
      return [baseLayer, ...prev];
    });
    // redraw overlay and sync sizes
    setTimeout(() => {
      try {
        syncCanvasSize();
        drawOverlay();
      } catch (_) {}
    }, 50);
  }, [baseCanvas]);

  const onAddImage = (file: File) =>
    addOverlayImage(
      file,
      canvasRef,
      setLayers,
      setActiveLayerId,
      setOverlaySelected,
      drawOverlay,
      setTool,
    );

  const exportWithOverlay = async (
    asJpeg: boolean,
    canvasRefArg: React.RefObject<HTMLCanvasElement>,
    callback?: (blob: Blob) => void,
    includeOverlays: boolean = true,
  ) => helperExportWithOverlay(asJpeg, canvasRefArg, includeOverlays ? layers : [], callback);

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
    // when selecting a text layer, populate toolbar globals so controls reflect the layer
    const layer = layers.find((l) => l.id === id);
    if (layer && layer.type === 'text') {
      setTextContent(layer.text || '');
      setTextFont(layer.font || 'Arial');
      setTextFontSize(layer.fontSize || 32);
      setTextColor(layer.textColor || '#000000');
      setTextWeight(layer.fontWeight || 'normal');
      setTextItalic(Boolean(layer.fontItalic));
      setTextDecoration((layer.textDecoration as any) || 'none');
      setTextAlign((layer.textAlign as any) || 'left');
    }
  };

  // Text tool callbacks
  // Start placement mode; actual layer will be created when user clicks canvas
  const onAddTextLayer = () => {
    setIsAddingText(true);
    message.info('Click on the image to place the text');
  };

  const updateTextContent = (id: string, text: string) => helperSetLayerText(setLayers, id, text);
  const updateTextFont = (id: string, font: string) => helperSetLayerFont(setLayers, id, font);
  const updateTextFontSize = (id: string, size: number) =>
    helperSetLayerFontSize(setLayers, id, size);
  const updateTextWeight = (id: string, weight: any) =>
    helperSetLayerFontWeight(setLayers, id, weight);
  const updateTextItalic = (id: string, italic: boolean) =>
    helperSetLayerFontItalic(setLayers, id, italic);
  const updateTextDecoration = (id: string, decoration: 'none' | 'underline' | 'line-through') =>
    helperSetLayerTextDecoration(setLayers, id, decoration);
  const updateTextColor = (id: string, color: string) =>
    helperSetLayerTextColor(setLayers, id, color);
  const updateTextAlign = (id: string, align: 'left' | 'center' | 'right') =>
    helperSetLayerTextAlign(setLayers, id, align);

  // wrapper setters: if an active layer (text) exists, update that layer; otherwise modify global defaults
  const handleSetTextContent = (v: string) => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextContent(active.id, v);
    else setTextContent(v);
  };
  const handleSetTextFont = (v: string) => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextFont(active.id, v);
    else setTextFont(v);
  };
  const handleSetTextFontSize = (v: number) => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextFontSize(active.id, v);
    else setTextFontSize(v);
  };
  const handleSetTextWeight = (v: any) => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextWeight(active.id, v);
    else setTextWeight(v);
  };
  const handleSetTextItalic = (v: boolean) => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextItalic(active.id, v);
    else setTextItalic(v);
  };
  const handleSetTextDecoration = (v: 'none' | 'underline' | 'line-through') => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextDecoration(active.id, v);
    else setTextDecoration(v);
  };
  const handleSetTextColor = (v: string) => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextColor(active.id, v);
    else setTextColor(v);
  };
  const handleSetTextAlign = (v: 'left' | 'center' | 'right') => {
    const active = layers.find((l) => l.id === activeLayerId);
    if (active && active.type === 'text') updateTextAlign(active.id, v);
    else setTextAlign(v);
  };

  //#region Layer Mask Handlers
  const handleOpenMaskTool = (layerId: string) => {
    setMaskEditingLayerId(layerId);
    setShowLayerMaskModal(true);
  };

  const handleOpenLayerEffects = () => {
    if (!activeLayerId) {
      message.warning('Please select a layer first');
      return;
    }
    const layer = layers.find((l) => l.id === activeLayerId);
    if (!layer || layer.type !== 'image') {
      message.warning('Effects can only be applied to image layers');
      return;
    }
    setEffectEditingLayerId(activeLayerId);
    setShowLayerEffectModal(true);
  };

  const handleApplyLayerEffects = (newImage: HTMLImageElement) => {
    if (!effectEditingLayerId) return;

    setLayers((prev) => {
      return prev.map((l) => {
        if (l.id === effectEditingLayerId) {
          return {
            ...l,
            img: newImage,
          };
        }
        return l;
      });
    });

    // Update overlay immediately
    setTimeout(() => {
      drawOverlay();
    }, 0);

    setShowLayerEffectModal(false);
    setEffectEditingLayerId(null);
  };

  const handleApplyMask = (maskCanvas: HTMLCanvasElement) => {
    if (!maskEditingLayerId) return;

    const layer = layers.find((l) => l.id === maskEditingLayerId);
    if (!layer || layer.type !== 'image' || !layer.img) {
      message.error('Can only apply mask to image layers');
      return;
    }

    // Convert the black/white mask to an alpha mask
    const alphaMaskCanvas = document.createElement('canvas');
    alphaMaskCanvas.width = maskCanvas.width;
    alphaMaskCanvas.height = maskCanvas.height;
    const amCtx = alphaMaskCanvas.getContext('2d')!;
    amCtx.drawImage(maskCanvas, 0, 0);

    const maskImageData = amCtx.getImageData(0, 0, alphaMaskCanvas.width, alphaMaskCanvas.height);
    const data = maskImageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Use Red channel as Alpha (White=255=Opaque, Black=0=Transparent)
      const brightness = data[i];
      data[i + 3] = brightness;
    }
    amCtx.putImageData(maskImageData, 0, 0);

    setLayers((prev) => {
      const newLayers = prev.map((l) => {
        if (l.id === maskEditingLayerId) {
          return {
            ...l,
            mask: alphaMaskCanvas,
          };
        }
        return l;
      });

      // Update overlay immediately with new layers
      drawOverlayHelper(overlayRef, canvasRef, {
        zoom,
        cropRect,
        rulerPoints: rulerPoints.current,
        perspectivePoints: perspectivePoints.current,
        hoverColor,
        tool,
        drawColor,
        drawLineWidth,
        layers: newLayers,
        overlaySelected,
        activeLayerId,
      });

      return newLayers;
    });

    setShowLayerMaskModal(false);
    setMaskEditingLayerId(null);
    message.success('Mask applied to layer');
  };

  const getMaskEditingLayer = (): Layer | undefined => {
    return layers.find((l) => l.id === maskEditingLayerId);
  };

  const getMaskSourceCanvas = (): HTMLCanvasElement | null => {
    const layer = getMaskEditingLayer();
    if (!layer) return null;

    // Create a temporary canvas with the layer content
    const tempCanvas = document.createElement('canvas');
    if (layer.type === 'image' && layer.img) {
      tempCanvas.width = layer.img.width;
      tempCanvas.height = layer.img.height;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.drawImage(layer.img, 0, 0);
    } else if (layer.type === 'text') {
      // For text layers, render the text to a canvas
      tempCanvas.width = layer.rect.w;
      tempCanvas.height = layer.rect.h;
      const ctx = tempCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      const fontStyle = layer.fontItalic ? 'italic' : 'normal';
      const fontWeight = layer.fontWeight || 'normal';
      const fontSize = layer.fontSize || 16;
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${layer.font || 'Arial'}`;
      ctx.fillStyle = layer.textColor || '#000000';
      ctx.textAlign = layer.textAlign || 'left';
      ctx.textBaseline = 'top';
      const lines = (layer.text || '').split('\n');
      const lineHeight = fontSize * 1.2;
      let currentY = 0;
      for (const line of lines) {
        ctx.fillText(line, 0, currentY);
        currentY += lineHeight;
      }
    }
    return tempCanvas;
  };
  //#endregion

  //#region Upscale
  // Upscale whole image: delegated to helpers.applyUpscale
  const upscaleImage = (
    factor: number,
    preset?: 'low' | 'medium' | 'high',
    qualityOptions?: { sharpen?: number; edgeEnhancement?: number; denoise?: number },
  ) =>
    applyUpscale(
      canvasRef,
      overlayRef,
      history,
      setBaseCanvas,
      setLayers,
      drawOverlay,
      factor,
      preset,
      qualityOptions,
    );
  //#endregion

  //#region Sync base canvas when in upscaled mode
  useEffect(() => {
    if (!canvasRef.current) return;

    if (!history.history[history.index]?.isSetBase) return;

    const src = canvasRef.current;
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')!.drawImage(src, 0, 0);

    setBaseCanvas(c);
    setLayers((prev) => {
      if (!prev[0]) return prev;
      const base = { ...prev[0] };
      if (base.img) base.img.src = c.toDataURL();
      base.rect = { x: 0, y: 0, w: c.width, h: c.height };
      // base.opacity = 1;
      return [base, ...prev.slice(1)];
    });

    if (overlayRef.current) {
      overlayRef.current.width = c.width;
      overlayRef.current.height = c.height;
    }

    drawOverlay();
  }, [history.index]);
  //#endregion

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
    const canvasRect = rect;
    // helper: create inline textarea overlay at canvas coords
    const createEditorAt = (
      canvasX: number,
      canvasY: number,
      initial = '',
      opts?: { layerId?: string; layer?: any },
    ) => {
      createTextEditorOverlay({
        canvasX,
        canvasY,
        canvasRect,
        containerRef,
        inlineEditorRef,
        zoom,
        initial,
        layerId: opts?.layerId,
        layer: opts?.layer,
        textColor,
        textFont,
        textFontSize,
        textWeight,
        textItalic,
        onCommit: (val) => {
          if (opts && opts.layerId) {
            // editing existing layer
            helperSetLayerText(setLayers, opts.layerId, val);
            drawOverlay();
          } else {
            // add layer with position in canvas coords
            helperAddTextLayer(
              canvasRef,
              setLayers,
              setActiveLayerId,
              setOverlaySelected,
              drawOverlay,
              {
                text: val,
                font: textFont,
                fontSize: textFontSize,
                fontWeight: textWeight,
                fontItalic: textItalic,
                textDecoration: textDecoration,
                textColor: textColor,
                textAlign: textAlign,
              },
              { x: canvasX, y: canvasY },
            );
          }
          setIsAddingText(false);
        },
        onCancel: () => {
          setIsAddingText(false);
        },
      });
    };

    // Helper to transform point by rotation around center
    const rotatePoint = (px: number, py: number, cx: number, cy: number, angle: number) => {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = px - cx;
      const dy = py - cy;
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    };

    // overlay hit-test (priority: if clicking overlay and not using pan tool)
    // overlay hit-test (topmost first)
    if (layers.length > 0) {
      for (let i = layers.length - 1; i >= 0; i--) {
        const L = layers[i];
        const r = L.rect;
        const rotation = L.rotation || 0;
        const centerX = r.x + r.w / 2;
        const centerY = r.y + r.h / 2;

        // Transform mouse position by inverse rotation to check against unrotated rect
        const inverseMouse = rotatePoint(x, y, centerX, centerY, -rotation);

        // detect inside area with tolerance
        const hitTol = 6 / Math.max(1, zoom);
        const inside =
          inverseMouse.x >= r.x - hitTol &&
          inverseMouse.y >= r.y - hitTol &&
          inverseMouse.x <= r.x + r.w + hitTol &&
          inverseMouse.y <= r.y + r.h + hitTol;
        if (!inside) continue;

        // detect corner handles - transform corners to rotated positions
        const tol = 8 / Math.max(1, zoom);
        const corners = {
          tl: rotatePoint(r.x, r.y, centerX, centerY, rotation),
          tr: rotatePoint(r.x + r.w, r.y, centerX, centerY, rotation),
          bl: rotatePoint(r.x, r.y + r.h, centerX, centerY, rotation),
          br: rotatePoint(r.x + r.w, r.y + r.h, centerX, centerY, rotation),
        };
        const midpoints = {
          t: rotatePoint(r.x + r.w / 2, r.y, centerX, centerY, rotation),
          b: rotatePoint(r.x + r.w / 2, r.y + r.h, centerX, centerY, rotation),
          l: rotatePoint(r.x, r.y + r.h / 2, centerX, centerY, rotation),
          r: rotatePoint(r.x + r.w, r.y + r.h / 2, centerX, centerY, rotation),
        };

        const near = (px: number, py: number) => Math.abs(x - px) <= tol && Math.abs(y - py) <= tol;
        const tl = near(corners.tl.x, corners.tl.y);
        const tr = near(corners.tr.x, corners.tr.y);
        const bl = near(corners.bl.x, corners.bl.y);
        const br = near(corners.br.x, corners.br.y);

        // If double-clicking a text layer while in text tool, open inline editor for editing
        if (tool === 'text' && L.type === 'text' && e.detail === 2) {
          setActiveLayerId(L.id);
          setOverlaySelected(true);
          // open editor via helper (edit existing layer)
          createEditorAt(x, y, L.text || '', { layerId: L.id, layer: L });
          return;
        }

        // Allow moving/resizing for layers when tool is 'move', or when tool is 'text' and the layer is a text layer
        if (tool === 'layer' || (tool === 'text' && L.type === 'text')) {
          setActiveLayerId(L.id);
          setOverlaySelected(true);

          // Check for midpoint handles (using rotated positions)
          const midT = near(midpoints.t.x, midpoints.t.y);
          const midB = near(midpoints.b.x, midpoints.b.y);
          const midL = near(midpoints.l.x, midpoints.l.y);
          const midR = near(midpoints.r.x, midpoints.r.y);

          if (midT || midB || midL || midR) {
            const handle = midT ? 't' : midB ? 'b' : midL ? 'l' : 'r';
            overlayResize.current = {
              layerId: L.id,
              handle,
              startX: x,
              startY: y,
              orig: { ...r },
            } as any;
            return;
          }

          if (tl || tr || bl || br) {
            // Check if holding Shift for rotation in corners
            if (e.shiftKey) {
              const startAngle = Math.atan2(y - centerY, x - centerX);
              overlayRotate.current = {
                layerId: L.id,
                startX: x,
                startY: y,
                centerX,
                centerY,
                startAngle,
                originalRotation: L.rotation || 0,
              };
              return;
            }

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

      // Draw initial dot
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        const settings: BrushSettings = {
          color: drawColor,
          lineWidth: drawLineWidth,
          opacity: brushOpacity,
          flow: brushFlow,
          type: brushType,
        };
        drawBrushStroke(
          ctx,
          [
            { x, y },
            { x, y },
          ],
          settings,
        );
        drawOverlay();
      }
    } else if (tool === 'text') {
      // If text tool is active and user clicked empty canvas, open inline editor to place new text
      createEditorAt(x, y, textContent || '');
      return;
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
      let foundHandle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move' | null = null;

      // Helper to transform point by rotation
      const rotatePoint = (
        px: number,
        py: number,
        centerX: number,
        centerY: number,
        angle: number,
      ) => {
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = px - centerX;
        const dy = py - centerY;
        return {
          x: centerX + dx * cos - dy * sin,
          y: centerY + dx * sin + dy * cos,
        };
      };

      for (let i = layers.length - 1; i >= 0; i--) {
        const L = layers[i];
        const r = L.rect;
        const rotation = L.rotation || 0;
        const centerX = r.x + r.w / 2;
        const centerY = r.y + r.h / 2;

        if (L.locked || (tool !== 'layer' && tool !== 'text')) {
          foundHandle = null;
          break;
        }

        // Transform mouse position by inverse rotation
        const inverseMouse = rotatePoint(cx, cy, centerX, centerY, -rotation);
        const inside =
          inverseMouse.x >= r.x &&
          inverseMouse.y >= r.y &&
          inverseMouse.x <= r.x + r.w &&
          inverseMouse.y <= r.y + r.h;

        const tol = 8 / Math.max(1, zoom);

        // Transform corners and midpoints to rotated positions
        const corners = {
          tl: rotatePoint(r.x, r.y, centerX, centerY, rotation),
          tr: rotatePoint(r.x + r.w, r.y, centerX, centerY, rotation),
          bl: rotatePoint(r.x, r.y + r.h, centerX, centerY, rotation),
          br: rotatePoint(r.x + r.w, r.y + r.h, centerX, centerY, rotation),
        };
        const midpoints = {
          t: rotatePoint(r.x + r.w / 2, r.y, centerX, centerY, rotation),
          b: rotatePoint(r.x + r.w / 2, r.y + r.h, centerX, centerY, rotation),
          l: rotatePoint(r.x, r.y + r.h / 2, centerX, centerY, rotation),
          r: rotatePoint(r.x + r.w, r.y + r.h / 2, centerX, centerY, rotation),
        };

        const near = (px: number, py: number) =>
          Math.abs(cx - px) <= tol && Math.abs(cy - py) <= tol;

        // Check corners
        if (near(corners.tl.x, corners.tl.y)) {
          foundHandle = 'tl';
          break;
        }
        if (near(corners.tr.x, corners.tr.y)) {
          foundHandle = 'tr';
          break;
        }
        if (near(corners.bl.x, corners.bl.y)) {
          foundHandle = 'bl';
          break;
        }
        if (near(corners.br.x, corners.br.y)) {
          foundHandle = 'br';
          break;
        }

        // Check midpoints
        if (near(midpoints.t.x, midpoints.t.y)) {
          foundHandle = 't';
          break;
        }
        if (near(midpoints.b.x, midpoints.b.y)) {
          foundHandle = 'b';
          break;
        }
        if (near(midpoints.l.x, midpoints.l.y)) {
          foundHandle = 'l';
          break;
        }
        if (near(midpoints.r.x, midpoints.r.y)) {
          foundHandle = 'r';
          break;
        }

        if (inside) {
          foundHandle = 'move';
          break;
        }
      }

      if (containerRef.current) {
        if (!foundHandle) {
          containerRef.current.style.cursor = currentCursor;
        } else if (foundHandle === 'move') {
          containerRef.current.style.cursor = 'move';
        } else if (foundHandle === 't' || foundHandle === 'b') {
          containerRef.current.style.cursor = 'ns-resize';
        } else if (foundHandle === 'l' || foundHandle === 'r') {
          containerRef.current.style.cursor = 'ew-resize';
        } else if (
          e.shiftKey &&
          (foundHandle === 'tl' ||
            foundHandle === 'tr' ||
            foundHandle === 'bl' ||
            foundHandle === 'br')
        ) {
          // Show rotation cursor when shift is held over corners
          containerRef.current.style.cursor = 'crosshair';
        } else if (foundHandle === 'tl' || foundHandle === 'br') {
          containerRef.current.style.cursor = 'nwse-resize';
        } else {
          containerRef.current.style.cursor = 'nesw-resize';
        }
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
          L.id === od.layerId && !L.locked
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
      const settings: BrushSettings = {
        color: drawColor,
        lineWidth: drawLineWidth,
        opacity: brushOpacity,
        flow: brushFlow,
        type: brushType,
      };

      const points = drawPoints.current;
      drawBrushStroke(ctx, points.slice(-2), settings);
      drawOverlay();
    } else {
      // overlay rotation handling
      const orot = overlayRotate.current;
      if (orot) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / zoom;
        const cy = (e.clientY - rect.top) / zoom;
        const { layerId, centerX, centerY, startAngle, originalRotation } = orot;
        const currentAngle = Math.atan2(cy - centerY, cx - centerX);
        const angleDelta = (currentAngle - startAngle) * (180 / Math.PI);

        setLayers((prev) =>
          prev.map((L) => {
            if (L.id !== layerId || L.locked) return L;
            return { ...L, rotation: originalRotation + angleDelta };
          }),
        );
        drawOverlay();
        return;
      }

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

        // Handle midpoint resizing (new feature)
        if (handle === 't') {
          // Top midpoint - only move top edge
          ny = cy;
          nh = orig.h + (orig.y - ny);
        } else if (handle === 'b') {
          // Bottom midpoint - only move bottom edge
          nh = cy - orig.y;
        } else if (handle === 'l') {
          // Left midpoint - only move left edge
          nx = cx;
          nw = orig.w + (orig.x - nx);
        } else if (handle === 'r') {
          // Right midpoint - only move right edge
          nw = cx - orig.x;
        } else if (handle === 'tl') {
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
        // aspect ratio lock when Shift pressed (only for corner handles)
        if (
          e.shiftKey &&
          (handle === 'tl' || handle === 'tr' || handle === 'bl' || handle === 'br')
        ) {
          const aspect = orig.w / Math.max(1, orig.h);
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
        // enforce min size
        nw = Math.max(4 / zoom, nw);
        nh = Math.max(4 / zoom, nh);
        setLayers((prev) =>
          prev.map((L) => {
            if (L.id !== layerId) return L;
            if (L.locked) return L;
            // if text layer, also adjust fontSize to roughly match new height
            if (L.type === 'text') {
              const padding = 10; // small padding inside rect
              const newFontSize = Math.max(8, Math.round(Math.max(1, nh) - padding));
              return { ...L, rect: { x: nx, y: ny, w: nw, h: nh }, fontSize: newFontSize };
            }
            return { ...L, rect: { x: nx, y: ny, w: nw, h: nh } };
          }),
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
    // finalize overlay drag/resize/rotate
    if (overlayDrag.current || overlayResize.current || overlayRotate.current) {
      overlayDrag.current = null;
      overlayResize.current = null;
      overlayRotate.current = null;
      // leave overlaySelected true
      // do not push to history for now (overlay is non-destructive until user exports)
      drawOverlay();
      return;
    }

    setIsPanning(false);
    panStart.current = null;
    if (tool === 'crop' && cropRect) {
      if (cropRect.w > 5 && cropRect.h > 5) {
        setShowCropModal(true);
      } else {
        setCropRect(null);
      }
    }
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

  useEffect(() => {
    drawOverlay();
  }, [cropRect]);

  //#region 🎯 Color Picker & Hover Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent) => {
      if (tool === 'color' || tool === 'removeColor') {
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
      } else if (tool === 'removeColor') {
        const color = samplePixel(e, canvasRef, zoom);
        if (color) {
          setSelectedColorForRemoval(color);
          setShowColorRemovalModal(true);
          setTool('pan'); // Switch back to pan after picking color
        }
      }
    };

    const handleLeave = () => {
      if (tool === 'color' || tool === 'removeColor') setHoverColor(null);
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

  //#region ⌨ Keyboard Shortcuts (key down)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // disable global shortcuts while inline editor is focused
      if (inlineEditorRef.current && document.activeElement === inlineEditorRef.current) return;

      if (e.key === 'Escape') {
        if (tool === 'crop') {
          handleCancelCrop();
        }
      }

      if (e.ctrlKey && e.key === 'z') history.undo();
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') history.redo();
      if (e.key === 'c') setTool('crop');
      if (e.key === 'h') setTool('pan');
      if (e.key === 'v') setTool('layer');
      if (e.key === 't') setTool('text');
      if (e.key === 'r') rotate(90, canvasRef, overlayRef, history.history);
      if (e.key === 'i') setTool('color');
      if (e.key === 'p') setTool('perspective');
      if (e.key === 'b') setTool('draw');

      // action
      if (e.key === 'Delete' && (tool === 'layer' || tool === 'text') && activeLayerId)
        deleteLayer(activeLayerId);
      if (e.ctrlKey && e.key === 's' && (tool === 'layer' || tool === 'text')) {
        e.preventDefault();
        mergeLayerIntoBase(activeLayerId as string | undefined);
      }
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        applyInvertColors(canvasRef, history);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowExportModal(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.index, history.history, tool, activeLayerId, layers]);
  //#endregion

  // Quick hand tool when holding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const triggerTool = (key: 'Space' | 'AltLeft', newTool: Tool, condition = true) => {
        if (e.code === key && condition) {
          e.preventDefault();
          setToolBefore((prev) => prev ?? tool);
          setTool(newTool);
          return true;
        }
        return false;
      };

      if (e.key === 'Shift') {
        setIsShiftDown(true);
      } else if (triggerTool('Space', 'pan')) {
        setIsSpaceDown(true);
      } else if (triggerTool('AltLeft', 'color', tool === 'draw')) {
        setIsAltDown(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const resetTool = (
        key: 'Space' | 'AltLeft',
        setter: React.Dispatch<React.SetStateAction<boolean>>,
      ) => {
        if (e.code === key) {
          setter(false);
          setToolBefore((prev) => {
            if (prev) setTool(prev);
            return null;
          });
        }
      };

      if (e.key === 'Shift') {
        setIsShiftDown(false);
      }
      resetTool('Space', setIsSpaceDown);
      resetTool('AltLeft', setIsAltDown);
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
  const perspectiveApply = async () =>
    await perspectiveApplyHelper(
      canvasRef,
      overlayRef,
      perspectivePoints,
      history,
      setShowPerspectiveModal,
      drawOverlay,
    );

  //#endregion
  //#endregion

  //#region Cursor Style
  const currentCursor = useMemo(() => {
    if ((tool === 'pan' || tool === 'select') && isPanning) return 'grabbing';
    switch (tool) {
      case 'pan':
        return 'grab';
      // case 'move':
      //   return 'move';
      case 'crop':
      case 'ruler':
      case 'perspective':
        return 'crosshair';
      case 'color':
        return 'copy';
      case 'removeColor':
        return 'crosshair';
      case 'draw':
        return 'pointer';
      case 'text':
        return 'text';
      default:
        return 'default';
    }
  }, [tool, isPanning]);
  //#endregion

  const resolution = useMemo(() => {
    const c = canvasRef.current;
    if (c) return `${c.width} × ${c.height}`;
    if (baseCanvas) return `${baseCanvas.width} × ${baseCanvas.height}`;
    return null;
  }, [canvasRef.current, baseCanvas]);

  //#region Tour steps
  const tourSteps: TourProps['steps'] = [
    {
      title: '🎨 Welcome to Pics Editor',
      description:
        'This is a powerful image editing tool with many features. Let me show you around!',
      target: null,
    },
    {
      title: '🛠️ Side Panel',
      description:
        'Access all editing tools here: adjustments, effects, color grading, and export options. Apply changes to see them on the canvas.',
      target: () => sidebarRef.current!,
    },
    {
      title: '🖼️ Canvas Area',
      description:
        'Your main workspace. Use Space + drag to pan, scroll to zoom, or Alt + scroll for fine zoom control. The resolution is shown in the top right.',
      target: () => canvasContainerRef.current!,
    },
    {
      title: '⌨️ Top Toolbar',
      description:
        'Quick access to undo/redo, zoom controls, and tool-specific options. Draw settings, layer management, and text formatting appear when those tools are active.',
      target: () => toolbarRef.current!,
    },
    {
      title: '🎭 Hand Tool (Hold "Space" or press "H")',
      description:
        'Navigate around your canvas. Hold Space key anywhere to temporarily activate pan mode, making it easy to move around large images.',
    },
    {
      title: '✂️ Crop Tool (C)',
      description:
        'Click and drag to select a crop area. Press Enter to apply the crop or Escape to cancel. Perfect for trimming images to the exact size you need.',
    },
    {
      title: '🎨 Color Picker (I)',
      description:
        'Click on any pixel to pick its color. Hold Shift while clicking to pick from the original unedited image instead of the current edited version.',
    },
    {
      title: '🗑️ Color Removal (K)',
      description:
        'Remove specific colors from your image. First use the Color Picker (I) to select a color, then activate this tool to remove it with adjustable tolerance and feathering for smooth edges.',
    },
    {
      title: '📏 Ruler Tool (R)',
      description:
        'Measure distances on your image. Click two points to measure in pixels, then optionally enter a real-world measurement to calculate and display the image DPI.',
    },
    {
      title: '🔲 Perspective Tool (P)',
      description:
        "Correct perspective distortion in photos. Click to place 4 corner points clockwise, adjust them to match the object's corners, then apply to straighten the perspective.",
    },
    {
      title: '✏️ Brush Tool (B)',
      description:
        'Freehand drawing with customizable options: brush size, color, opacity, flow rate, and choose between hard-edge and soft-edge brushes for different effects.',
    },
    {
      title: '🖼️ Layer Tool (V)',
      description:
        'Add and manage image layers. Drag and drop images onto the canvas, adjust opacity and blend modes, resize, rotate, and position layers with full control.',
    },
    {
      title: '🔤 Text Tool (T)',
      description:
        'Add text overlays with complete formatting control: font family, size, weight (bold/normal), color, alignment (left/center/right), italic, and text decorations (underline/strikethrough).',
    },
    {
      title: '🔍 Upscale',
      description:
        'Enlarge your image intelligently. Choose from quality presets (low/medium/high) and apply enhancement options like sharpen, edge enhancement, and noise reduction for best results.',
    },
    {
      title: '💾 Export (Ctrl + Shift + S)',
      description:
        'Export your edited image as PNG or JPG with optional overlay layers, or convert to scalable SVG format with customizable tracing parameters for vector graphics.',
    },
    {
      title: '⌨️ Keyboard Shortcuts',
      description: (
        <div style={{ lineHeight: 1.8 }}>
          <div>
            <strong>Space</strong>: Pan tool (hold anywhere)
          </div>
          <div>
            <strong>C</strong>: Crop tool
          </div>
          <div>
            <strong>I</strong>: Color picker
          </div>
          <div>
            <strong>K</strong>: Color removal
          </div>
          <div>
            <strong>R</strong>: Ruler tool
          </div>
          <div>
            <strong>P</strong>: Perspective tool
          </div>
          <div>
            <strong>D</strong>: Draw tool
          </div>
          <div>
            <strong>L</strong>: Layer tool
          </div>
          <div>
            <strong>T</strong>: Text tool
          </div>
          <div>
            <strong>Ctrl+Z</strong>: Undo
          </div>
          <div>
            <strong>Ctrl+Y</strong>: Redo
          </div>
          <div>
            <strong>Scroll</strong>: Zoom in/out
          </div>
          <div>
            <strong>Alt+Scroll</strong>: Fine zoom control
          </div>
          <div>
            <strong>Shift+Click</strong>: Pick from original image
          </div>
        </div>
      ),
    },
  ];
  //#endregion

  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Tour Component */}
      <Tour open={openTour} onClose={() => setOpenTour(false)} steps={tourSteps} />

      <div ref={sidebarRef}>
        <SideEditorToolbar
          canvasRef={canvasRef}
          overlayRef={overlayRef}
          baseCanvas={baseCanvas}
          upscaleImage={upscaleImage}
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
          showExportModal={showExportModal}
          setShowExportModal={setShowExportModal}
          onColorRemovalToolClick={() => setTool('removeColor')}
        />
        {/* Help Button */}
        <Button
          type="text"
          icon={<QuestionCircleOutlined />}
          onClick={() => setOpenTour(true)}
          style={{ width: '100%' }}
        >
          Help
        </Button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div ref={toolbarRef}>
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
            textContent={textContent}
            setTextContent={handleSetTextContent}
            textFont={textFont}
            setTextFont={handleSetTextFont}
            textFontSize={textFontSize}
            setTextFontSize={handleSetTextFontSize}
            textColor={textColor}
            setTextColor={handleSetTextColor}
            textWeight={textWeight}
            setTextWeight={handleSetTextWeight}
            textItalic={textItalic}
            setTextItalic={handleSetTextItalic}
            textDecoration={textDecoration}
            setTextDecoration={handleSetTextDecoration}
            textAlign={textAlign}
            setTextAlign={handleSetTextAlign}
            onAddTextLayer={onAddTextLayer}
            isAddingText={isAddingText}
            setIsAddingText={setIsAddingText}
            onOpenMaskTool={handleOpenMaskTool}
            onOpenLayerEffects={handleOpenLayerEffects}
          />
        </div>

        <div ref={canvasContainerRef} style={{ flex: 1 }}>
          <ImageCanvas
            canvasRef={canvasRef}
            overlayRef={overlayRef}
            containerRef={containerRef}
            offset={offset}
            zoom={zoom}
            tool={tool}
            currentCursor={currentCursor}
            resolution={resolution}
            hoverColor={hoverColor}
            onMouseDown={handleMouseDownViewer}
            onMouseMove={handleMouseMoveViewer}
            onMouseUp={handleMouseUpViewer}
          />
        </div>
      </div>

      <Modal
        title="Confirm Crop"
        open={showCropModal}
        onOk={handleConfirmCrop}
        onCancel={handleCancelCrop}
        okText="Crop"
        cancelText="Cancel"
      >
        <p>Are you sure you want to crop the image?</p>
      </Modal>

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

      <ColorRemovalModal
        open={showColorRemovalModal}
        onCancel={() => {
          setShowColorRemovalModal(false);
          setSelectedColorForRemoval(null);
        }}
        onApply={(maskCanvas) => {
          applyMaskToCanvas(canvasRef, maskCanvas, history, 'Color Removal');
          setShowColorRemovalModal(false);
          setSelectedColorForRemoval(null);
        }}
        selectedColor={selectedColorForRemoval}
        canvasRef={canvasRef}
      />

      <LayerMaskModal
        open={showLayerMaskModal}
        onCancel={() => {
          setShowLayerMaskModal(false);
          setMaskEditingLayerId(null);
        }}
        onApply={handleApplyMask}
        sourceCanvas={getMaskSourceCanvas()}
        existingMask={getMaskEditingLayer()?.mask}
      />

      <LayerEffectModal
        open={showLayerEffectModal}
        onCancel={() => {
          setShowLayerEffectModal(false);
          setEffectEditingLayerId(null);
        }}
        onApply={handleApplyLayerEffects}
        layer={layers.find((l) => l.id === effectEditingLayerId)}
      />
    </div>
  );
};

export default ImageEditor;
