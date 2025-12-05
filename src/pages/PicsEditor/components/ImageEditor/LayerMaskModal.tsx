import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  Slider,
  Radio,
  Space,
  Button,
  Select,
  InputNumber,
  ColorPicker,
  Tooltip,
} from 'antd';
import { BgColorsOutlined, HighlightOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import {
  BrushSettings,
  drawBrushStroke,
  drawBrushCursor,
  getCanvasCoords,
  samplePixelColor,
} from '../../utils/brushHelpers';
import { calculateColorRemovalAlphaMap } from '../../utils/helpers';

const { Option } = Select;

type LayerMaskModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (maskCanvas: HTMLCanvasElement) => void;
  sourceCanvas: HTMLCanvasElement | null;
  existingMask?: HTMLCanvasElement | null;
};

const LayerMaskModal: React.FC<LayerMaskModalProps> = ({
  open,
  onCancel,
  onApply,
  sourceCanvas,
  existingMask,
}) => {
  // Canvas refs
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // History state
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Brush mode: 'remove' (paint black/0 alpha) or 'keep' (paint white/255 alpha)
  const [brushMode, setBrushMode] = useState<'remove' | 'keep'>('remove');

  // Brush settings
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushType, setBrushType] = useState<'hard' | 'soft'>('hard');

  // Preview mode
  const [previewMode, setPreviewMode] = useState<'normal' | 'mask'>('normal');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);

  // Cursor position
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Color removal tool state
  const [showColorTool, setShowColorTool] = useState(false);
  const [tolerance, setTolerance] = useState(30);
  const [feather, setFeather] = useState(5);
  const [invert, setInvert] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Brush resize with mouse
  const resizingBrush = useRef(false);
  const resizeStartX = useRef<number | null>(null);
  const initialBrushSize = useRef(brushSize);

  // Ctrl key state for color picker mode
  const [isCtrlDown, setIsCtrlDown] = useState(false);

  // #region 🖱️ Disable Right-Click Context Menu
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => canvas.removeEventListener('contextmenu', handleContextMenu);
  }, []);
  //#endregion

  // History helpers
  const saveHistory = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    const imageData = ctx.getImageData(
      0,
      0,
      maskCanvasRef.current.width,
      maskCanvasRef.current.height,
    );

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      if (newHistory.length >= 20) newHistory.shift(); // Limit history size
      return [...newHistory, imageData];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 19));
  };

  const undo = () => {
    if (historyIndex <= 0 || !maskCanvasRef.current) return;
    const newIndex = historyIndex - 1;
    const imageData = history[newIndex];
    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
    updatePreview();
  };

  const redo = () => {
    if (historyIndex >= history.length - 1 || !maskCanvasRef.current) return;
    const newIndex = historyIndex + 1;
    const imageData = history[newIndex];
    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
    updatePreview();
  };

  // Initialize mask when modal opens
  useEffect(() => {
    if (!open || !sourceCanvas || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = sourceCanvas.width;
    maskCanvas.height = sourceCanvas.height;

    const ctx = maskCanvas.getContext('2d')!;

    if (existingMask) {
      // Load existing mask
      ctx.drawImage(existingMask, 0, 0);
    } else {
      // Initialize with white (keep everything)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    // Initialize history
    const initialData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    setHistory([initialData]);
    setHistoryIndex(0);

    updatePreview();
  }, [open, sourceCanvas, existingMask]);

  // Update preview when mask or mode changes
  const updatePreview = () => {
    if (!maskCanvasRef.current || !previewCanvasRef.current || !sourceCanvas) return;

    const maskCanvas = maskCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    previewCanvas.width = sourceCanvas.width;
    previewCanvas.height = sourceCanvas.height;

    const ctx = previewCanvas.getContext('2d')!;

    if (previewMode === 'mask') {
      // Show black and white mask
      ctx.drawImage(maskCanvas, 0, 0);
    } else {
      // Show normal preview with alpha applied
      const sourceCtx = sourceCanvas.getContext('2d')!;
      const maskCtx = maskCanvas.getContext('2d')!;

      const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const previewData = ctx.createImageData(sourceCanvas.width, sourceCanvas.height);

      for (let i = 0; i < sourceData.data.length; i += 4) {
        previewData.data[i] = sourceData.data[i]; // R
        previewData.data[i + 1] = sourceData.data[i + 1]; // G
        previewData.data[i + 2] = sourceData.data[i + 2]; // B
        // Use mask grayscale value as alpha
        previewData.data[i + 3] = maskData.data[i];
      }

      ctx.putImageData(previewData, 0, 0);
    }

    updateOverlay();
  };

  // Update overlay (cursor)
  const updateOverlay = () => {
    if (!overlayCanvasRef.current || !maskCanvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const ctx = overlayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (cursorPos) {
      if (isCtrlDown) {
        // Show color picker cursor (small circle)
        ctx.save();
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Show brush cursor
        const color = brushMode === 'remove' ? '#000000' : '#ffffff';
        drawBrushCursor(ctx, cursorPos.x, cursorPos.y, brushSize, color, 1);
      }
    }
  };

  // Apply color removal to mask
  const applyColorRemoval = () => {
    if (!selectedColor || !sourceCanvas || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const ctx = maskCanvas.getContext('2d')!;
    const sourceCtx = sourceCanvas.getContext('2d')!;

    const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const maskData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const alphaMap = calculateColorRemovalAlphaMap(
      sourceData.data,
      selectedColor,
      tolerance,
      invert,
      feather,
    );

    for (let i = 0; i < sourceData.data.length; i += 4) {
      const alpha = alphaMap[i / 4];

      // Combine with existing mask (multiply operation)
      const existingAlpha = maskData.data[i];
      const newAlpha = Math.round((existingAlpha / 255) * (alpha / 255) * 255);

      maskData.data[i] = newAlpha; // R
      maskData.data[i + 1] = newAlpha; // G
      maskData.data[i + 2] = newAlpha; // B
      maskData.data[i + 3] = 255; // A
    }

    ctx.putImageData(maskData, 0, 0);
    updatePreview();
    setShowColorTool(false);
    saveHistory();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current) return;

    const coords = getCanvasCoords(e, previewCanvasRef, 1);
    if (!coords) return;

    // Check for brush resize (Alt + Click)
    if (e.altKey) {
      e.preventDefault();
      resizingBrush.current = true;
      resizeStartX.current = e.clientX;
      initialBrushSize.current = brushSize;

      const onWindowMouseMove = (ev: MouseEvent) => {
        if (!resizingBrush.current || resizeStartX.current === null) return;
        const delta = ev.clientX - resizeStartX.current;
        const newSize = Math.max(1, Math.min(500, initialBrushSize.current + delta * 0.5));
        setBrushSize(Math.round(newSize));
      };

      const onWindowMouseUp = () => {
        resizingBrush.current = false;
        resizeStartX.current = null;
        window.removeEventListener('mousemove', onWindowMouseMove);
        window.removeEventListener('mouseup', onWindowMouseUp);
      };

      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
      return;
    }

    // Check for color picker (Ctrl/Cmd + Click)
    if (e.ctrlKey || e.metaKey) {
      const color = samplePixelColor(sourceCanvas!, coords.x, coords.y);
      if (color) {
        setSelectedColor(color);
        if (!showColorTool) {
          setShowColorTool(true);
        }
      }
      return;
    }

    setIsDrawing(true);
    drawPoints.current = [coords];

    // Draw initial point
    const maskCtx = maskCanvasRef.current.getContext('2d')!;
    const brushColor = brushMode === 'remove' ? '#000000' : '#ffffff';

    const settings: BrushSettings = {
      color: brushColor,
      lineWidth: brushSize,
      opacity: brushOpacity,
      flow: 1,
      type: brushType,
    };

    drawBrushStroke(maskCtx, [coords, coords], settings);
    updatePreview();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current) return;

    const coords = getCanvasCoords(e, previewCanvasRef, 1);
    if (!coords) return;

    setCursorPos(coords);

    if (!isDrawing) {
      updateOverlay();
      return;
    }

    drawPoints.current.push(coords);

    const maskCtx = maskCanvasRef.current.getContext('2d')!;
    const brushColor = brushMode === 'remove' ? '#000000' : '#ffffff';

    const settings: BrushSettings = {
      color: brushColor,
      lineWidth: brushSize,
      opacity: brushOpacity,
      flow: 1,
      type: brushType,
    };

    const points = drawPoints.current;
    if (points.length >= 2) {
      drawBrushStroke(maskCtx, points.slice(-2), settings);
      updatePreview();
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      saveHistory();
    }
    setIsDrawing(false);
    drawPoints.current = [];
  };

  const handleMouseLeave = () => {
    if (resizingBrush.current) return;
    setCursorPos(null);
    setIsDrawing(false);
    updateOverlay();
  };

  // Keyboard handlers
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'x' || e.key === 'X') {
        setBrushMode((prev) => (prev === 'remove' ? 'keep' : 'remove'));
      }
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlDown(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlDown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [open]);

  // Update overlay when cursor or brush settings change
  useEffect(() => {
    updateOverlay();
  }, [cursorPos, brushSize, brushMode, isCtrlDown, showColorTool]);

  const handleApply = () => {
    if (maskCanvasRef.current) {
      onApply(maskCanvasRef.current);
    }
  };

  const handleClearMask = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    updatePreview();
    saveHistory();
  };

  const handleInvertMask = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;
    const imageData = ctx.getImageData(
      0,
      0,
      maskCanvasRef.current.width,
      maskCanvasRef.current.height,
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    ctx.putImageData(imageData, 0, 0);
    updatePreview();
    saveHistory();
  };

  return (
    <Modal
      title="Layer Mask Editor"
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      width={Math.min(
        sourceCanvas?.width ? sourceCanvas.width + 400 : 900,
        window.innerWidth * 0.95,
      )}
      style={{ top: 20 }}
      okText="Apply Mask"
      cancelText="Cancel"
      maskClosable={false}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Tool Selection */}
        <Space wrap>
          <Select
            value={showColorTool ? 'color' : 'brush'}
            onChange={(v) => setShowColorTool(v === 'color')}
            style={{ width: 140 }}
          >
            <Option value="brush">
              <HighlightOutlined /> Brush Tool
            </Option>
            <Option value="color">
              <BgColorsOutlined /> Color Removal
            </Option>
          </Select>

          <Radio.Group
            value={previewMode}
            onChange={(e) => {
              setPreviewMode(e.target.value);
              updatePreview();
            }}
          >
            <Radio.Button value="normal">Normal</Radio.Button>
            <Radio.Button value="mask">Mask View</Radio.Button>
          </Radio.Group>

          <Button onClick={handleClearMask}>Clear Mask</Button>
          <Button onClick={handleInvertMask}>Invert Mask</Button>
          <Tooltip title="Undo">
            <Button icon={<UndoOutlined />} onClick={undo} disabled={historyIndex <= 0} />
          </Tooltip>
          <Tooltip title="Redo">
            <Button
              icon={<RedoOutlined />}
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            />
          </Tooltip>
        </Space>

        {/* Brush Tool Controls */}
        {!showColorTool && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <Radio.Group
                value={brushMode}
                onChange={(e) => setBrushMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="remove">Remove (Black)</Radio.Button>
                <Radio.Button value="keep">Keep (White)</Radio.Button>
              </Radio.Group>
              <span style={{ fontSize: 12, color: '#666' }}>Press 'X' to toggle</span>
            </Space>

            <Space wrap align="center">
              <span>Brush Type:</span>
              <Select
                value={brushType}
                onChange={(v) => setBrushType(v as 'hard' | 'soft')}
                style={{ width: 100 }}
              >
                <Option value="hard">Hard</Option>
                <Option value="soft">Soft</Option>
              </Select>

              <span>Size:</span>
              <InputNumber
                min={1}
                max={500}
                value={brushSize}
                onChange={(v) => setBrushSize(v || 1)}
                style={{ width: 80 }}
              />
              <Tooltip title="Alt + Drag to resize">
                <span style={{ fontSize: 12, color: '#666' }}>Alt+Drag</span>
              </Tooltip>

              <span>Opacity:</span>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={brushOpacity}
                onChange={setBrushOpacity}
                style={{ width: 100 }}
              />
              <span>{Math.round(brushOpacity * 100)}%</span>
            </Space>
          </Space>
        )}

        {/* Color Removal Controls */}
        {showColorTool && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>Selected Color:</strong>
              {selectedColor ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 24,
                      height: 24,
                      background: selectedColor,
                      border: '1px solid #ccc',
                      verticalAlign: 'middle',
                      marginLeft: 8,
                      marginRight: 8,
                    }}
                  />
                  <span>{selectedColor}</span>
                  <Button
                    size="small"
                    style={{ marginLeft: 8 }}
                    onClick={applyColorRemoval}
                    type="primary"
                  >
                    Apply Color Removal
                  </Button>
                </>
              ) : (
                <span style={{ marginLeft: 8, color: '#999' }}>
                  Click on image to pick color (or Ctrl+Click)
                </span>
              )}
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Tolerance:</strong> {tolerance}%
                <Slider
                  min={0}
                  max={100}
                  value={tolerance}
                  onChange={setTolerance}
                  style={{ marginTop: 4 }}
                />
              </div>

              <div>
                <strong>Feather:</strong> {feather}%
                <Slider min={0} max={50} value={feather} onChange={setFeather} />
              </div>

              <Radio.Group value={invert} onChange={(e) => setInvert(e.target.value)}>
                <Radio.Button value={false}>Remove Color</Radio.Button>
                <Radio.Button value={true}>Keep Only Color</Radio.Button>
              </Radio.Group>
            </Space>
          </Space>
        )}

        {/* Canvas Container */}
        <div
          style={{
            maxHeight: '60vh',
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: 8,
            position: 'relative',
            backgroundImage:
              previewMode === 'normal'
                ? `linear-gradient(45deg, #ccc 25%, transparent 25%),
                   linear-gradient(-45deg, #ccc 25%, transparent 25%),
                   linear-gradient(45deg, transparent 75%, #ccc 75%),
                   linear-gradient(-45deg, transparent 75%, #ccc 75%)`
                : 'none',
            backgroundSize: previewMode === 'normal' ? '20px 20px' : 'auto',
            backgroundPosition:
              previewMode === 'normal' ? '0 0, 0 10px, 10px -10px, -10px 0px' : 'auto',
            backgroundColor: previewMode === 'mask' ? '#808080' : '#fff',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Hidden mask canvas */}
            <canvas ref={maskCanvasRef} style={{ display: 'none' }} />

            {/* Preview canvas */}
            <canvas
              ref={previewCanvasRef}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                imageRendering: 'pixelated',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />

            {/* Overlay canvas for cursor */}
            <canvas
              ref={overlayCanvasRef}
              width={sourceCanvas?.width || 0}
              height={sourceCanvas?.height || 0}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          <strong>Instructions:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
            <li>Paint to remove or keep areas (toggle with 'X' key)</li>
            <li>Black areas = removed, White areas = kept</li>
            <li>Alt + Drag to resize brush</li>
            {showColorTool && <li>Ctrl/Cmd + Click to pick color from image</li>}
            <li>Color removal combines with existing mask</li>
          </ul>
        </div>
      </Space>
    </Modal>
  );
};

export default LayerMaskModal;
