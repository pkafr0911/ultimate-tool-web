import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Slider, Space, Tooltip, Modal, Select, message, Divider, ColorPicker } from 'antd';
import {
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
  perspectiveTransform,
  createCanvas,
} from '@/pages/PNGJPEG/utils/ImageEditorEngine';

import useCanvas from './useCanvas';
import useHistory from './useHistory';
import {
  applyBGThreshold,
  applyBlur,
  applyCrop,
  applyGaussian,
  applySharpen,
  copyToClipboard,
  exportImage,
  flipH,
  flipV,
  rotate,
  samplePixel,
} from '../../utils/helpers';

type Tool = 'pan' | 'crop' | 'color' | 'ruler' | 'perspective' | 'select' | 'draw';

type Props = {
  imageUrl: string;
  onExport?: (blob: Blob) => void;
};

const { Option } = Select;

const ImageEditor: React.FC<Props> = ({ imageUrl, onExport }) => {
  /** --------------------------------------
   * Canvas Setup
   -------------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onLoad = (dataUrl: string) => {
    history.push(dataUrl, 'Initial load');
  };

  const { canvasRef, overlayRef, baseCanvas } = useCanvas(imageUrl, onLoad);
  const history = useHistory(canvasRef, overlayRef);

  /** --------------------------------------
   * Viewer State (pan, zoom)
   -------------------------------------- */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);

  /** --------------------------------------
   * Tools + Editing State
   -------------------------------------- */
  const [tool, setTool] = useState<Tool>('pan');

  // brightness / contrast
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);

  // crop
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const cropStart = useRef<{ x: number; y: number } | null>(null);

  // perspective
  const [showPerspectiveModal, setShowPerspectiveModal] = useState(false);
  const perspectivePoints = useRef<
    [number, number, number, number, number, number, number, number] | null
  >(null);

  // transient tool swaps (Space, Alt)
  const [toolBefore, setToolBefore] = useState<Tool | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isAltDown, setIsAltDown] = useState(false);

  /** --------------------------------------
   * Color Picker
   -------------------------------------- */
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  /** --------------------------------------
   * Ruler
   -------------------------------------- */
  const [rulerActive] = useState(false);
  const rulerPoints = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dpiMeasured, setDpiMeasured] = useState<number | null>(null);

  /** --------------------------------------
   * Freehand Drawing
   -------------------------------------- */
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawLineWidth, setDrawLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);

  /** --------------------------------------
   * Filter
   -------------------------------------- */
  const [blur, setBlur] = useState(0); // box blur level
  const [gaussian, setGaussian] = useState(0); // gaussian radius
  const [sharpen, setSharpen] = useState(0);
  const [bgThreshold, setBgThreshold] = useState(240);

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
    } else if (tool === 'draw') {
      setIsDrawing(true);
      drawPoints.current = [{ x, y }];
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
    } else if (tool === 'draw' && isDrawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      drawPoints.current.push({ x, y });

      const ctx = canvasRef.current.getContext('2d')!;
      ctx.save();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawLineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const points = drawPoints.current;
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
      ctx.restore();
    } else {
      drawOverlay();
    }
  };

  const handleMouseUpViewer = () => {
    setIsPanning(false);
    panStart.current = null;
    if (tool === 'crop' && cropRect)
      applyCrop(canvasRef, overlayRef, cropRect, setCropRect, history);
    if (tool === 'draw' && isDrawing) {
      setIsDrawing(false);
      history.push(canvasRef.current!.toDataURL(), 'Draw');
    }
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

    // draw
    if (hoverColor && tool === 'draw') {
      const rect = canvasRef.current.getBoundingClientRect();

      const canvasX = (hoverColor.x - rect.left) / zoom;
      const canvasY = (hoverColor.y - rect.top) / zoom;
      ctx.save();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawLineWidth;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, drawLineWidth, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

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

  // Apply brightness/contrast to current canvas (mutates)
  const applyBrightnessContrastToCanvas = () => {
    if (!canvasRef.current || !baseCanvas) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const baseCtx = baseCanvas.getContext('2d')!;
    const baseImgData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    const cloned = cloneImageData(baseImgData);
    applyBrightnessContrast(cloned, brightness, contrast);
    ctx.putImageData(cloned, 0, 0);
    history.push(canvasRef.current.toDataURL(), 'Brightness/Contrast');
  };

  // Apply kernel (blur/sharpen)
  const applyKernel = async (kernel: number[], size = Math.sqrt(kernel.length)) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const id = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    applyConvolution(id, kernel, size);
    ctx.putImageData(id, 0, 0);
    history.push(canvasRef.current.toDataURL(), 'Convolution');
  };

  const applyThresholdBackground = (threshold = 240) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const id = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    applyThresholdAlpha(id, threshold);
    ctx.putImageData(id, 0, 0);
    history.push(canvasRef.current.toDataURL(), 'Background removed (threshold)');
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
    history.push(canvasRef.current.toDataURL(), 'Perspective corrected');
    setShowPerspectiveModal(false);
  };

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') history.undo();
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') history.redo();
      if (e.key === 'c') setTool('crop');
      if (e.key === 'v') setTool('pan');
      if (e.key === 'r') rotate(90, canvasRef, overlayRef, history.history);
      if (e.key === 'p') setTool('color');
      if (e.key === 'b') setTool('draw');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.index, history.history]);

  // Quick hand tool when holding Space
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

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 260 }}>
        {/* Toolbar */}
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Tooltip title="Undo (Ctrl+Z)">
              <Button icon={<UndoOutlined />} onClick={history.undo} />
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <Button icon={<RedoOutlined />} onClick={history.redo} />
            </Tooltip>
            <Tooltip title="Rotate left">
              <Button
                icon={<RotateLeftOutlined />}
                onClick={() => rotate(-90, canvasRef, overlayRef, history)}
              />
            </Tooltip>
            <Tooltip title="Rotate right">
              <Button
                icon={<RotateRightOutlined />}
                onClick={() => rotate(90, canvasRef, overlayRef, history)}
              />
            </Tooltip>
            <Tooltip title="Flip horizontal">
              <Button icon={<SwapOutlined />} onClick={() => flipH(canvasRef, history)} />
            </Tooltip>
            <Tooltip title="Flip vertical">
              <Button
                icon={<SwapOutlined rotate={90} />}
                onClick={() => flipV(canvasRef, history)}
              />
            </Tooltip>
          </Space>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Brush Tool</div>
            <Space>
              <ColorPicker
                value={drawColor}
                onChange={(color) => setDrawColor(color.toHexString())}
                allowClear={false}
                showText
              />
              <input
                type="number"
                min={1}
                max={50}
                value={drawLineWidth}
                onChange={(e) => setDrawLineWidth(Number(e.target.value))}
                style={{ width: 60 }}
              />
              <Button onClick={() => setTool('draw')}>Draw</Button>
            </Space>
          </div>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Brightness</div>
            <Slider
              min={-150}
              max={150}
              value={brightness}
              onChange={(v) => setBrightness(v)}
              onChangeComplete={() => applyBrightnessContrastToCanvas()}
            />
            <div style={{ marginBottom: 8 }}>Contrast</div>
            <Slider
              min={-100}
              max={100}
              value={contrast}
              onChange={(v) => setContrast(v)}
              onChangeComplete={() => applyBrightnessContrastToCanvas()}
            />
          </div>

          <Divider />

          <div>
            <div style={{ marginBottom: 8 }}>Box Blur</div>
            <Slider
              min={0}
              max={25}
              value={blur}
              onChange={setBlur}
              onChangeComplete={(v) => applyBlur(canvasRef, baseCanvas, v, history)}
            />

            <div style={{ marginBottom: 8 }}>Gaussian Blur</div>
            <Slider
              min={0}
              max={20}
              value={gaussian}
              onChange={setGaussian}
              onChangeComplete={(v) => applyGaussian(canvasRef, baseCanvas, v, history)}
            />

            <div style={{ marginBottom: 8 }}>Sharpen</div>
            <Slider
              min={0}
              max={5}
              value={sharpen}
              onChange={setSharpen}
              onChangeComplete={(v) => applySharpen(canvasRef, baseCanvas, v, history)}
            />

            <div style={{ marginBottom: 8 }}>Background Threshold</div>
            <Slider
              min={0}
              max={255}
              value={bgThreshold}
              onChange={setBgThreshold}
              onChangeComplete={(v) => applyBGThreshold(canvasRef, baseCanvas, v, history)}
            />
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
              <Button
                icon={<ExportOutlined />}
                onClick={() => exportImage(false, canvasRef, onExport)}
              >
                PNG
              </Button>
              <Button onClick={() => exportImage(true, canvasRef, onExport)}>JPG</Button>
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(canvasRef)}>
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
              <Option value="draw">Brush</Option>
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
          {hoverColor && tool === 'color' && (
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
