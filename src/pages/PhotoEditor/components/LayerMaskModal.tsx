import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  Slider,
  Radio,
  Space,
  Button,
  Select,
  InputNumber,
  Tooltip,
  ColorPicker,
} from 'antd';
import { UndoOutlined, RedoOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  BrushSettings,
  drawBrushStroke,
  drawBrushCursor,
  getCanvasCoords,
} from '../utils/brushHelpers';
import { calculateColorRemovalAlphaMap } from '../utils/effectsHelpers';

const { Option } = Select;

type ColorRemovalModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (maskCanvas: HTMLCanvasElement) => void;
  selectedColor: string | null;
  sourceCanvas: HTMLCanvasElement | null;
};

const ColorRemovalModal: React.FC<ColorRemovalModalProps> = ({
  open,
  onCancel,
  onApply,
  selectedColor,
  sourceCanvas,
}) => {
  const [tolerance, setTolerance] = useState(30);
  const [previewMode, setPreviewMode] = useState<'normal' | 'mask'>('normal');
  const [invert, setInvert] = useState(false);
  const [feather, setFeather] = useState(0);
  const [activeColor, setActiveColor] = useState(selectedColor || '#000000');
  const [isAltPressed, setIsAltPressed] = useState(false);

  useEffect(() => {
    if (selectedColor) setActiveColor(selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const [brushMode, setBrushMode] = useState<'remove' | 'keep'>('remove');
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushType, setBrushType] = useState<'hard' | 'soft'>('hard');
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [displayParams, setDisplayParams] = useState({ scale: 1, x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);
  const lastDrawPoint = useRef<{ x: number; y: number } | null>(null);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (
      open &&
      sourceCanvas &&
      previewCanvasRef.current &&
      maskCanvasRef.current &&
      overlayCanvasRef.current &&
      containerRef.current
    ) {
      const w = sourceCanvas.width;
      const h = sourceCanvas.height;
      const container = containerRef.current;
      const { clientWidth: cw, clientHeight: ch } = container;

      // Calculate scale to fit image in container
      const scale = Math.min(cw / w, ch / h);
      const displayW = w * scale;
      const displayH = h * scale;
      const displayX = (cw - displayW) / 2;
      const displayY = (ch - displayH) / 2;

      setDisplayParams({ scale, x: displayX, y: displayY });

      previewCanvasRef.current.width = w;
      previewCanvasRef.current.height = h;
      maskCanvasRef.current.width = w;
      maskCanvasRef.current.height = h;

      // Overlay canvas matches container size (screen pixels)
      overlayCanvasRef.current.width = cw;
      overlayCanvasRef.current.height = ch;

      const ctx = previewCanvasRef.current.getContext('2d')!;
      ctx.drawImage(sourceCanvas, 0, 0);

      const maskCtx = maskCanvasRef.current.getContext('2d')!;
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, w, h);

      saveHistory();
    }
  }, [open, sourceCanvas]);

  const saveHistory = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    const data = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const data = history[newIndex];
      const ctx = maskCanvasRef.current!.getContext('2d')!;
      ctx.putImageData(data, 0, 0);
      setHistoryIndex(newIndex);
      updatePreview();
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const data = history[newIndex];
      const ctx = maskCanvasRef.current!.getContext('2d')!;
      ctx.putImageData(data, 0, 0);
      setHistoryIndex(newIndex);
      updatePreview();
    }
  };

  const updatePreview = () => {
    if (!sourceCanvas || !previewCanvasRef.current || !maskCanvasRef.current) return;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const ctx = previewCanvasRef.current.getContext('2d')!;
    const maskCtx = maskCanvasRef.current.getContext('2d')!;

    // 1. Draw original image
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(sourceCanvas, 0, 0);

    // 2. Calculate auto-mask from color
    const imageData = ctx.getImageData(0, 0, w, h);
    const alphaMap = calculateColorRemovalAlphaMap(
      imageData.data,
      activeColor,
      tolerance,
      invert,
      feather,
    );

    // 3. Combine with manual mask
    const manualMaskData = maskCtx.getImageData(0, 0, w, h);
    const finalImageData = ctx.createImageData(w, h);

    for (let i = 0; i < w * h; i++) {
      const r = imageData.data[i * 4];
      const g = imageData.data[i * 4 + 1];
      const b = imageData.data[i * 4 + 2];
      const a = imageData.data[i * 4 + 3];

      const autoAlpha = alphaMap[i];
      const manualAlpha = manualMaskData.data[i * 4]; // Red channel of white mask

      // Combine alphas (multiply)
      const finalAlpha = a * (autoAlpha / 255) * (manualAlpha / 255);

      finalImageData.data[i * 4] = r;
      finalImageData.data[i * 4 + 1] = g;
      finalImageData.data[i * 4 + 2] = b;
      finalImageData.data[i * 4 + 3] = finalAlpha;
    }

    if (previewMode === 'mask') {
      // Draw mask only (black and white)
      for (let i = 0; i < w * h; i++) {
        const alpha = finalImageData.data[i * 4 + 3];
        finalImageData.data[i * 4] = alpha;
        finalImageData.data[i * 4 + 1] = alpha;
        finalImageData.data[i * 4 + 2] = alpha;
        finalImageData.data[i * 4 + 3] = 255;
      }
    }

    ctx.putImageData(finalImageData, 0, 0);
  };

  useEffect(() => {
    updatePreview();
  }, [tolerance, invert, feather, activeColor, previewMode, historyIndex]);

  const pickColor = (e: React.MouseEvent) => {
    if (!sourceCanvas || !overlayCanvasRef.current) return;
    const coords = getCanvasCoords(e, overlayCanvasRef, displayParams.scale, {
      x: displayParams.x,
      y: displayParams.y,
    });
    if (coords) {
      const ctx = sourceCanvas.getContext('2d');
      if (!ctx) return;
      const x = Math.max(0, Math.min(coords.x, sourceCanvas.width - 1));
      const y = Math.max(0, Math.min(coords.y, sourceCanvas.height - 1));
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex =
        '#' + [pixel[0], pixel[1], pixel[2]].map((x) => x.toString(16).padStart(2, '0')).join('');
      setActiveColor(hex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAltPressed) {
      pickColor(e);
      return;
    }
    setIsDrawing(true);
    const coords = getCanvasCoords(e, overlayCanvasRef, displayParams.scale, {
      x: displayParams.x,
      y: displayParams.y,
    });
    if (coords) {
      drawPoints.current = [coords];
      lastDrawPoint.current = coords;
      draw([coords]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e, overlayCanvasRef, displayParams.scale, {
      x: displayParams.x,
      y: displayParams.y,
    });
    setCursorPos(coords);

    // when alt is pressed, sample color under cursor and show preview
    if (isAltPressed && coords && sourceCanvas) {
      try {
        const ctx = sourceCanvas.getContext('2d');
        if (ctx) {
          const x = Math.max(0, Math.min(coords.x, sourceCanvas.width - 1));
          const y = Math.max(0, Math.min(coords.y, sourceCanvas.height - 1));
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex =
            '#' +
            [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
          setPreviewColor(hex);
        }
      } catch (err) {
        setPreviewColor(null);
      }
    } else {
      setPreviewColor(null);
    }

    if (isAltPressed) return;

    if (isDrawing && coords && lastDrawPoint.current) {
      drawPoints.current.push(coords);
      draw([lastDrawPoint.current, coords]);
      lastDrawPoint.current = coords;
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      drawPoints.current = [];
      lastDrawPoint.current = null;
      saveHistory();
      updatePreview();
    }
  };

  const draw = (points: { x: number; y: number }[]) => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;

    const settings: BrushSettings = {
      color: brushMode === 'remove' ? '#000000' : '#ffffff',
      lineWidth: brushSize,
      opacity: brushOpacity,
      flow: 1,
      type: brushType,
    };

    drawBrushStroke(ctx, points, settings);

    // Update preview immediately for better feedback
    updatePreview();
  };

  // Draw cursor
  useEffect(() => {
    if (!overlayCanvasRef.current || !cursorPos) return;
    const ctx = overlayCanvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    const screenX = cursorPos.x * displayParams.scale + displayParams.x;
    const screenY = cursorPos.y * displayParams.scale + displayParams.y;
    const screenSize = brushSize * displayParams.scale;

    // draw brush cursor
    drawBrushCursor(ctx, screenX, screenY, screenSize, '#fff');
    drawBrushCursor(ctx, screenX, screenY, screenSize, '#000'); // Double outline for visibility

    // draw live color preview when alt is pressed
    if (isAltPressed && previewColor) {
      const previewRadius = 9;
      const offset = 12; // offset so preview doesn't sit under cursor
      const px = Math.min(
        overlayCanvasRef.current.width - previewRadius - 4,
        Math.max(previewRadius + 4, screenX + offset),
      );
      const py = Math.min(
        overlayCanvasRef.current.height - previewRadius - 4,
        Math.max(previewRadius + 4, screenY + offset),
      );

      // outer border
      ctx.beginPath();
      ctx.arc(px, py, previewRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#00000088';
      ctx.fill();

      // color circle
      ctx.beginPath();
      ctx.arc(px, py, previewRadius, 0, Math.PI * 2);
      ctx.fillStyle = previewColor;
      ctx.fill();

      // hex label
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(previewColor.toUpperCase(), px, py + previewRadius + 14);
    }
  }, [cursorPos, brushSize, displayParams, isAltPressed, previewColor]);

  const handleApply = () => {
    if (!sourceCanvas || !previewCanvasRef.current || !maskCanvasRef.current) return;

    const w = sourceCanvas.width;
    const h = sourceCanvas.height;

    // Build the final composited image with current settings (independent of previewMode)
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = w;
    resultCanvas.height = h;
    const ctx = resultCanvas.getContext('2d')!;
    ctx.drawImage(sourceCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const alphaMap = calculateColorRemovalAlphaMap(
      imageData.data,
      activeColor,
      tolerance,
      invert,
      feather,
    );

    const maskCtx = maskCanvasRef.current.getContext('2d')!;
    const manualMaskData = maskCtx.getImageData(0, 0, w, h);
    const finalImageData = ctx.createImageData(w, h);

    for (let i = 0; i < w * h; i++) {
      const a = imageData.data[i * 4 + 3];
      const autoAlpha = alphaMap[i];
      const manualAlpha = manualMaskData.data[i * 4];
      const finalAlpha = Math.round(a * (autoAlpha / 255) * (manualAlpha / 255));

      // Store as both RGB and Alpha so consumers can read either channel
      finalImageData.data[i * 4] = finalAlpha;
      finalImageData.data[i * 4 + 1] = finalAlpha;
      finalImageData.data[i * 4 + 2] = finalAlpha;
      finalImageData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(finalImageData, 0, 0);
    onApply(resultCanvas);
  };

  return (
    <Modal
      title="Mask"
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      width={1000}
      style={{ top: 20 }}
      maskClosable={false}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 300 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span>Target Color:</span>
              <ColorPicker
                value={activeColor}
                onChange={(c) => setActiveColor(c.toHexString())}
                showText
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                Hold Alt + Click on image to pick color
              </div>
            </div>
            <div>
              <span>Tolerance: {tolerance}%</span>
              <Slider value={tolerance} onChange={setTolerance} />
            </div>
            <div>
              <span>Feather: {feather}%</span>
              <Slider value={feather} onChange={setFeather} />
            </div>
            <div>
              <Space>
                <span>Invert:</span>
                <Button onClick={() => setInvert(!invert)} type={invert ? 'primary' : 'default'}>
                  {invert ? 'Yes' : 'No'}
                </Button>
              </Space>
            </div>
            <div>
              <span>Preview Mode:</span>
              <Radio.Group value={previewMode} onChange={(e) => setPreviewMode(e.target.value)}>
                <Radio.Button value="normal">Normal</Radio.Button>
                <Radio.Button value="mask">Mask</Radio.Button>
              </Radio.Group>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16 }}>
              <h4>Manual Adjustments</h4>
              <Space>
                <Button
                  type={brushMode === 'remove' ? 'primary' : 'default'}
                  onClick={() => setBrushMode('remove')}
                >
                  Remove
                </Button>
                <Button
                  type={brushMode === 'keep' ? 'primary' : 'default'}
                  onClick={() => setBrushMode('keep')}
                >
                  Keep
                </Button>
              </Space>
              <div>
                <span>Size: {brushSize}</span>
                <Slider min={1} max={100} value={brushSize} onChange={setBrushSize} />
              </div>
              <div>
                <span>Opacity: {brushOpacity}</span>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={brushOpacity}
                  onChange={setBrushOpacity}
                />
              </div>
              <div>
                <span>Hardness:</span>
                <Radio.Group value={brushType} onChange={(e) => setBrushType(e.target.value)}>
                  <Radio.Button value="hard">Hard</Radio.Button>
                  <Radio.Button value="soft">Soft</Radio.Button>
                </Radio.Group>
              </div>
            </div>

            <Space>
              <Button icon={<UndoOutlined />} onClick={undo} disabled={historyIndex <= 0} />
              <Button
                icon={<RedoOutlined />}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              />
            </Space>
          </Space>
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            border: '1px solid #ccc',
            height: 500,
            overflow: 'hidden',
            background:
              'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==)',
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{
              position: 'absolute',
              top: displayParams.y,
              left: displayParams.x,
              width: displayParams.scale * (sourceCanvas?.width || 0),
              height: displayParams.scale * (sourceCanvas?.height || 0),
            }}
          />
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: isAltPressed ? 'crosshair' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {/* Hidden mask canvas */}
          <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </Modal>
  );
};

export default ColorRemovalModal;
