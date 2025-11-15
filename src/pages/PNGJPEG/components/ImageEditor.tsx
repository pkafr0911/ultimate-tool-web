// src/components/ImageEditor.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Slider, Space, Tooltip, Modal, Row, Col, Select, message, Divider } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExportOutlined,
  CopyOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  drawImageToCanvasFromUrl,
  applyBrightnessContrast,
  cloneImageData,
  Kernels,
  applyConvolution,
  applyThresholdAlpha,
  exportCanvasToBlob,
  perspectiveTransform,
  createCanvas,
} from '../utils/ImageEditorEngine';

type Tool = 'pan' | 'crop' | 'color' | 'ruler' | 'perspective' | 'select';

type HistoryItem = {
  canvasDataUrl: string;
  description?: string;
};

type Props = {
  imageUrl: string;
  onExport?: (blob: Blob) => void;
};

const { Option } = Select;

const ImageEditor: React.FC<Props> = ({ imageUrl, onExport }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);

  // Editing state
  const [tool, setTool] = useState<Tool>('pan');
  const [brightness, setBrightness] = useState(0); // -255..255
  const [contrast, setContrast] = useState(0); // -100..100
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const cropStart = useRef<{ x: number; y: number } | null>(null);

  const [showPerspectiveModal, setShowPerspectiveModal] = useState(false);
  const perspectivePoints = useRef<
    [number, number, number, number, number, number, number, number] | null
  >(null);
  const [toolBeforeHand, setToolBeforeHand] = useState<Tool | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // Color picker state
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  // Ruler state
  const [rulerActive, setRulerActive] = useState(false);
  const rulerPoints = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dpiMeasured, setDpiMeasured] = useState<number | null>(null);

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

        pushHistory(canvasToDataUrl(working), 'Initial load');
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

  // Ctrl+Wheel zoom
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

  /** History management */
  const pushHistory = (dataUrl: string, description = '') => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ canvasDataUrl: dataUrl, description });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  const doUndo = () => {
    if (historyIndex <= 0) return;
    applyHistory(historyIndex - 1);
  };
  const doRedo = () => {
    if (historyIndex >= history.length - 1) return;
    applyHistory(historyIndex + 1);
  };
  const applyHistory = (idx: number) => {
    const item = history[idx];
    if (!item) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      canvasRef.current!.width = img.naturalWidth;
      canvasRef.current!.height = img.naturalHeight;
      overlayRef.current!.width = img.naturalWidth;
      overlayRef.current!.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
      setHistoryIndex(idx);
    };
    img.src = item.canvasDataUrl;
  };

  /** --- PAN / ZOOM / TOOL HANDLERS --- */
  const handleMouseDownViewer = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

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
    }
  };

  const handleMouseMoveViewer = (e: React.MouseEvent) => {
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
    } else {
      drawOverlay();
    }
  };

  const handleMouseUpViewer = () => {
    setIsPanning(false);
    panStart.current = null;
    if (tool === 'crop' && cropRect) applyCrop();
  };

  /** Draw overlay: crop, ruler, perspective, color hover */
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
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 8 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  /** --- COLOR PICKER --- */
  const samplePixel = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const p = ctx.getImageData(x, y, 1, 1).data;
    return `#${[p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent) => {
      if (tool === 'color') {
        const color = samplePixel(e);
        setHoverColor(color ? { x: e.clientX, y: e.clientY, color } : null);
        drawOverlay();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (tool === 'color') {
        const color = samplePixel(e);
        if (color) {
          setPickedColor(color);
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

  // Apply brightness/contrast to current canvas (mutates)
  const applyBrightnessContrastToCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const cloned = cloneImageData(imgData);
    applyBrightnessContrast(cloned, brightness, contrast);
    ctx.putImageData(cloned, 0, 0);
    pushHistory(canvasRef.current.toDataURL(), 'Brightness/Contrast');
  };

  // Apply kernel (blur/sharpen)
  const applyKernel = async (kernel: number[], size = Math.sqrt(kernel.length)) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const id = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    applyConvolution(id, kernel, size);
    ctx.putImageData(id, 0, 0);
    pushHistory(canvasRef.current.toDataURL(), 'Convolution');
  };

  const applyThresholdBackground = (threshold = 240) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const id = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    applyThresholdAlpha(id, threshold);
    ctx.putImageData(id, 0, 0);
    pushHistory(canvasRef.current.toDataURL(), 'Background removed (threshold)');
  };

  // Crop: apply cropRect to canvas
  const applyCrop = () => {
    if (!canvasRef.current || !cropRect) return;
    const c = createCanvas(
      Math.max(1, Math.round(cropRect.w)),
      Math.max(1, Math.round(cropRect.h)),
    );
    const ctx = c.getContext('2d')!;
    ctx.drawImage(
      canvasRef.current,
      cropRect.x,
      cropRect.y,
      cropRect.w,
      cropRect.h,
      0,
      0,
      cropRect.w,
      cropRect.h,
    );
    // replace current canvas
    canvasRef.current.width = c.width;
    canvasRef.current.height = c.height;
    overlayRef.current!.width = c.width;
    overlayRef.current!.height = c.height;
    const wctx = canvasRef.current.getContext('2d')!;
    wctx.clearRect(0, 0, c.width, c.height);
    wctx.drawImage(c, 0, 0);
    setCropRect(null);
    pushHistory(canvasRef.current.toDataURL(), 'Cropped');
  };

  const rotate = (deg: number) => {
    if (!canvasRef.current) return;
    // create temp canvas and rotate
    const src = canvasRef.current;
    const tmp = createCanvas(src.width, src.height);
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(src, 0, 0);
    const dest = createCanvas(src.height, src.width);
    const dctx = dest.getContext('2d')!;
    dctx.translate(dest.width / 2, dest.height / 2);
    dctx.rotate((deg * Math.PI) / 180);
    dctx.drawImage(tmp, -tmp.width / 2, -tmp.height / 2);
    // replace
    canvasRef.current.width = dest.width;
    canvasRef.current.height = dest.height;
    overlayRef.current!.width = dest.width;
    overlayRef.current!.height = dest.height;
    const wctx = canvasRef.current.getContext('2d')!;
    wctx.clearRect(0, 0, dest.width, dest.height);
    wctx.drawImage(dest, 0, 0);
    pushHistory(canvasRef.current.toDataURL(), `Rotate ${deg}`);
  };

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
    pushHistory(canvasRef.current.toDataURL(), 'Perspective corrected');
    setShowPerspectiveModal(false);
  };

  // flip
  const flipH = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const tmp = createCanvas(canvasRef.current.width, canvasRef.current.height);
    tmp.getContext('2d')!.drawImage(canvasRef.current, 0, 0);
    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.scale(-1, 1);
    ctx.drawImage(tmp, -canvasRef.current.width, 0);
    ctx.restore();
    pushHistory(canvasRef.current.toDataURL(), 'Flip horizontal');
  };
  const flipV = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const tmp = createCanvas(canvasRef.current.width, canvasRef.current.height);
    tmp.getContext('2d')!.drawImage(canvasRef.current, 0, 0);
    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.scale(1, -1);
    ctx.drawImage(tmp, 0, -canvasRef.current.height);
    ctx.restore();
    pushHistory(canvasRef.current.toDataURL(), 'Flip vertical');
  };

  const exportImage = async (asJpeg = false) => {
    if (!canvasRef.current) return;
    const blob = await exportCanvasToBlob(
      canvasRef.current,
      asJpeg ? 'image/jpeg' : 'image/png',
      0.92,
    );
    if (onExport) onExport(blob);
    // auto download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asJpeg ? 'edited.jpg' : 'edited.png';
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported image');
  };

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') doUndo();
      if (e.ctrlKey && e.key === 'y') doRedo();
      if (e.key === 'c') setTool('crop');
      if (e.key === 'v') setTool('pan');
      if (e.key === 'r') rotate(90);
      if (e.key === 'p') setTool('color');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history]);

  // Quick hand tool when holding Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // stop page scroll

        setIsSpaceDown((prev) => {
          if (!prev) {
            // first press
            setToolBeforeHand((t) => {
              // store previous tool safely
              if (t === null) return tool;
              return t;
            });
            setTool('pan');
          }
          return true;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);

        setToolBeforeHand((prev) => {
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

  // copy to clipboard (image)
  const copyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await exportCanvasToBlob(canvasRef.current, 'image/png');
      // @ts-ignore navigator.clipboard
      await (navigator.clipboard as any).write([new ClipboardItem({ 'image/png': blob })]);
      message.success('Image copied to clipboard');
    } catch (err) {
      console.warn('clipboard failed', err);
      message.error('Copy failed (browser may not support)');
    }
  };

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
      default:
        return 'default';
    }
  }, [tool, isPanning]);

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 260 }}>
        {/* Toolbar */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Tooltip title="Undo (Ctrl+Z)">
              <Button icon={<UndoOutlined />} onClick={doUndo} />
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <Button icon={<RedoOutlined />} onClick={doRedo} />
            </Tooltip>
            <Tooltip title="Rotate left">
              <Button icon={<RotateLeftOutlined />} onClick={() => rotate(-90)} />
            </Tooltip>
            <Tooltip title="Rotate right">
              <Button icon={<RotateRightOutlined />} onClick={() => rotate(90)} />
            </Tooltip>
            <Tooltip title="Flip horizontal">
              <Button icon={<SwapOutlined />} onClick={flipH} />
            </Tooltip>
            <Tooltip title="Flip vertical">
              <Button icon={<SwapOutlined rotate={90} />} onClick={flipV} />
            </Tooltip>
          </Space>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Brightness</div>
            <Slider
              min={-150}
              max={150}
              value={brightness}
              onChange={(v) => setBrightness(v)}
              onAfterChange={() => applyBrightnessContrastToCanvas()}
            />
            <div style={{ marginBottom: 8 }}>Contrast</div>
            <Slider
              min={-100}
              max={100}
              value={contrast}
              onChange={(v) => setContrast(v)}
              onAfterChange={() => applyBrightnessContrastToCanvas()}
            />
          </div>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Filters</div>
            <Space>
              <Button onClick={() => applyKernel(Kernels.sharpen, 3)}>Sharpen</Button>
              <Button onClick={() => applyKernel(Kernels.blur3, 3)}>Blur</Button>
              <Button onClick={() => applyKernel(Kernels.gaussian5, 5)}>Gaussian</Button>
            </Space>
          </div>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Background</div>
            <Space>
              <Button onClick={() => applyThresholdBackground(235)} icon={<BgColorsOutlined />}>
                Remove white
              </Button>
            </Space>
          </div>

          <Divider />
          <Space>
            <Button icon={<BgColorsOutlined />} onClick={() => setTool('color')}>
              Color picker
            </Button>
            {pickedColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    border: '1px solid #999',
                    background: pickedColor,
                  }}
                />
                <span>{pickedColor}</span>
              </div>
            )}
          </Space>
          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Crop & Perspective</div>
            <Space>
              <Button icon={<ScissorOutlined />} onClick={() => setTool('crop')}>
                Crop (C)
              </Button>
              <Button
                onClick={() => {
                  setShowPerspectiveModal(true);
                  setTool('perspective');
                }}
              >
                Perspective
              </Button>
            </Space>
          </div>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Ruler / DPI</div>
            <Space>
              <Button icon={'📏'} onClick={() => setTool('ruler')}>
                Ruler
              </Button>
              <Button
                onClick={() => {
                  setDpiMeasured(null);
                  message.info('Ruler cleared');
                }}
              >
                Clear
              </Button>
            </Space>
            {dpiMeasured && <div>Estimated DPI: {dpiMeasured}</div>}
          </div>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Export</div>
            <Space>
              <Button icon={<ExportOutlined />} onClick={() => exportImage(false)}>
                PNG
              </Button>
              <Button onClick={() => exportImage(true)}>JPG</Button>
              <Button icon={<CopyOutlined />} onClick={copyToClipboard}>
                Copy
              </Button>
            </Space>
          </div>
        </Space>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Tooltip title="Zoom In">
              <Button
                icon={<ZoomInOutlined />}
                onClick={() => setZoom((z) => Math.min(z * 1.2, 8))}
              />
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button
                icon={<ZoomOutOutlined />}
                onClick={() => setZoom((z) => Math.max(z / 1.2, 0.1))}
              />
            </Tooltip>
            <Select value={tool} onChange={(v) => setTool(v as Tool)} style={{ width: 140 }}>
              <Option value="pan">Pan</Option>
              <Option value="color">Color Picker</Option>
              <Option value="crop">Crop</Option>
              <Option value="ruler">Ruler</Option>
              <Option value="perspective">Perspective</Option>
            </Select>
          </Space>
        </div>

        <div
          ref={containerRef}
          onMouseDown={handleMouseDownViewer}
          onMouseMove={handleMouseMoveViewer}
          onMouseUp={handleMouseUpViewer}
          style={{
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            border: '1px solid #eee',
            position: 'relative',
            background: '#fafafa',
            cursor: currentCursor,
          }}
        >
          <canvas
            ref={(el) => {
              canvasRef.current = el;
            }}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              display: 'block',
            }}
          />
          <canvas
            ref={(el) => {
              overlayRef.current = el;
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          />
          {hoverColor && (
            <div
              style={{
                position: 'fixed', // use fixed to position relative to viewport
                left: hoverColor.x + 12,
                top: hoverColor.y + 12,
                background: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                boxShadow: '0 0 6px rgba(0,0,0,0.2)',
                fontSize: 12,
                zIndex: 999999,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  background: hoverColor.color,
                  border: '1px solid #ccc',
                }}
              />
              {hoverColor.color}
            </div>
          )}
        </div>
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
