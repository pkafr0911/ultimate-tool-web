//#region Imports
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Tooltip, Modal, Select, message, InputNumber, ColorPicker } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';

import { perspectiveTransform } from '@/pages/PNGJPEG/utils/ImageEditorEngine';

import useCanvas from '../../hooks/useCanvas';
import useHistory from '../../hooks/useHistory';
import { applyCrop, exportImage, rotate, samplePixel } from '../../utils/helpers';
import ImageCanvas from './ImageCanvas';
import ImageEditorToolbar from './SideEditorToolbar';
import TopEditorToolbar from './TopEditorToolbar';
//#endregion

//#region Types
export type Tool = 'pan' | 'crop' | 'color' | 'ruler' | 'perspective' | 'select' | 'draw';

type Props = {
  imageUrl: string;
  onExport?: (blob: Blob) => void;
};

const { Option } = Select;
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
  const perspectivePoints = useRef<
    [number, number, number, number, number, number, number, number] | null
  >(null);
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
  const [rulerActive] = useState(false);
  const rulerPoints = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dpiMeasured, setDpiMeasured] = useState<number | null>(null);
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
      if (!perspectivePoints.current) perspectivePoints.current = [x, y, x, y, x, y, x, y];
      const p = perspectivePoints.current!;
      for (let i = 0; i < 8; i += 2) {
        if (isNaN(p[i]) || isNaN(p[i + 1]) || (p[i] === 0 && p[i + 1] === 0)) {
          p[i] = x;
          p[i + 1] = y;
          break;
        }
      }
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
    if (!overlayRef.current || !canvasRef.current) return;
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
    if (rulerPoints.current) {
      ctx.save();
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rulerPoints.current.x1, rulerPoints.current.y1);
      ctx.lineTo(rulerPoints.current.x2, rulerPoints.current.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Perspective points
    if (perspectivePoints.current) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,255,0,0.8)';
      for (let i = 0; i < 8; i += 2) {
        const x = perspectivePoints.current[i];
        const y = perspectivePoints.current[i + 1];
        if (!isNaN(x) && !isNaN(y)) ctx.fillRect(x - 4, y - 4, 8, 8);
      }
      ctx.restore();
    }

    // Color hover
    if (hoverColor && tool === 'color') {
      const rect = canvasRef.current.getBoundingClientRect();

      const canvasX = (hoverColor.x - rect.left) / zoom;
      const canvasY = (hoverColor.y - rect.top) / zoom;
      ctx.save();
      ctx.strokeStyle = hoverColor.color;
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 8 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // draw
    if (hoverColor && tool === 'draw') {
      const rect = canvasRef.current.getBoundingClientRect();

      const canvasX = (hoverColor.x - rect.left) / zoom;
      const canvasY = (hoverColor.y - rect.top) / zoom;
      ctx.save();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, drawLineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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
    if (!canvasRef.current || !perspectivePoints.current) return;
    const src = canvasRef.current;
    // dest dims: bounding rect
    const destW = src.width;
    const destH = src.height;
    const dest = perspectiveTransform(src, perspectivePoints.current, destW, destH);
    canvasRef.current.width = dest.width;
    canvasRef.current.height = dest.height;
    overlayRef.current!.width = dest.width;
    overlayRef.current!.height = dest.height;
    canvasRef.current.getContext('2d')!.clearRect(0, 0, dest.width, dest.height);
    canvasRef.current.getContext('2d')!.drawImage(dest, 0, 0);
    history.push(canvasRef.current.toDataURL(), 'Perspective corrected');
    setShowPerspectiveModal(false);
  };
  //#endregion
  //#endregion

  //#region Cursor Style
  const currentCursor = useMemo(() => {
    if ((tool === 'pan' || tool === 'select') && isPanning) return 'grabbing';
    switch (tool) {
      case 'pan':
        return 'grab';
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
        exportImage={exportImage}
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
      </Modal>
    </div>
  );
};

export default ImageEditor;
