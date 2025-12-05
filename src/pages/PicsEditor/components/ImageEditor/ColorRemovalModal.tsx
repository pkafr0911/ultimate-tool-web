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
  Tour,
  type TourProps,
} from 'antd';
import { UndoOutlined, RedoOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  BrushSettings,
  drawBrushStroke,
  drawBrushCursor,
  getCanvasCoords,
} from '../../utils/brushHelpers';
import { calculateColorRemovalAlphaMap } from '../../utils/helpers';

const { Option } = Select;

type ColorRemovalModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (maskCanvas: HTMLCanvasElement) => void;
  selectedColor: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const ColorRemovalModal: React.FC<ColorRemovalModalProps> = ({
  open,
  onCancel,
  onApply,
  selectedColor,
  canvasRef,
}) => {
  const [tolerance, setTolerance] = useState(30);
  const [previewMode, setPreviewMode] = useState<'normal' | 'mask'>('normal');
  const [invert, setInvert] = useState(false);
  const [feather, setFeather] = useState(0);

  // Brush state
  const [brushMode, setBrushMode] = useState<'remove' | 'keep'>('remove');
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushType, setBrushType] = useState<'hard' | 'soft'>('hard');
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);

  // Brush resize with mouse
  const resizingBrush = useRef(false);
  const resizeStartX = useRef<number | null>(null);
  const initialBrushSize = useRef(brushSize);

  // History state
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Tour state
  const [openTour, setOpenTour] = useState(false);
  const controlsRef = useRef(null);
  const brushRef = useRef(null);
  const historyRef = useRef(null);
  const tourCanvasRef = useRef(null);

  const tourSteps: TourProps['steps'] = [
    {
      title: 'Color Removal Settings',
      description: 'Adjust Tolerance and Feather to automatically remove the selected color.',
      target: () => controlsRef.current,
    },
    {
      title: 'History',
      description: 'Undo or Redo your changes.',
      target: () => historyRef.current,
    },
    {
      title: 'Manual Adjustments',
      description:
        'Use the brush to manually remove or keep areas. Note: Changing auto-settings resets manual edits.',
      target: () => brushRef.current,
    },
    {
      title: 'Canvas',
      description: 'Draw on the canvas to refine the mask. Use Alt + Drag to resize brush.',
      target: () => tourCanvasRef.current,
    },
  ];

  // #region 🖱️ Disable Right-Click Context Menu
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => canvas.removeEventListener('contextmenu', handleContextMenu);
  }, []);
  //#endregion

  // Initialize mask when params change
  useEffect(() => {
    if (!open || !canvasRef.current || !selectedColor || !maskCanvasRef.current) return;

    const sourceCanvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    // Ensure mask canvas size matches source
    if (maskCanvas.width !== sourceCanvas.width || maskCanvas.height !== sourceCanvas.height) {
      maskCanvas.width = sourceCanvas.width;
      maskCanvas.height = sourceCanvas.height;
    }

    const sourceCtx = sourceCanvas.getContext('2d')!;
    const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

    const alphaMap = calculateColorRemovalAlphaMap(
      imageData.data,
      selectedColor,
      tolerance,
      invert,
      feather,
    );

    const maskCtx = maskCanvas.getContext('2d')!;
    const maskData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);

    for (let i = 0; i < alphaMap.length; i++) {
      const alpha = alphaMap[i];
      // Store alpha in all channels for visualization/usage
      maskData.data[i * 4] = alpha; // R
      maskData.data[i * 4 + 1] = alpha; // G
      maskData.data[i * 4 + 2] = alpha; // B
      maskData.data[i * 4 + 3] = 255; // A (fully opaque mask pixel)
    }

    maskCtx.putImageData(maskData, 0, 0);

    // Initialize history
    const initialData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    setHistory([initialData]);
    setHistoryIndex(0);

    updatePreview();
  }, [open, tolerance, invert, feather, selectedColor, canvasRef]);

  const updatePreview = () => {
    if (!canvasRef.current || !previewCanvasRef.current || !maskCanvasRef.current) return;

    const sourceCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (
      previewCanvas.width !== sourceCanvas.width ||
      previewCanvas.height !== sourceCanvas.height
    ) {
      previewCanvas.width = sourceCanvas.width;
      previewCanvas.height = sourceCanvas.height;
    }

    const ctx = previewCanvas.getContext('2d')!;

    if (previewMode === 'mask') {
      ctx.drawImage(maskCanvas, 0, 0);
    } else {
      const sourceCtx = sourceCanvas.getContext('2d')!;
      const maskCtx = maskCanvas.getContext('2d')!;

      const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const previewData = ctx.createImageData(sourceCanvas.width, sourceCanvas.height);

      for (let i = 0; i < sourceData.data.length; i += 4) {
        previewData.data[i] = sourceData.data[i];
        previewData.data[i + 1] = sourceData.data[i + 1];
        previewData.data[i + 2] = sourceData.data[i + 2];
        // Use mask R channel as alpha (since we stored it in RGB)
        previewData.data[i + 3] = maskData.data[i];
      }

      ctx.putImageData(previewData, 0, 0);
    }

    updateOverlay();
  };

  const updateOverlay = () => {
    if (!overlayCanvasRef.current || !canvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    if (
      overlayCanvas.width !== canvasRef.current.width ||
      overlayCanvas.height !== canvasRef.current.height
    ) {
      overlayCanvas.width = canvasRef.current.width;
      overlayCanvas.height = canvasRef.current.height;
    }

    const ctx = overlayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (cursorPos) {
      const color = brushMode === 'remove' ? '#000000' : '#ffffff';
      drawBrushCursor(ctx, cursorPos.x, cursorPos.y, brushSize, color, 1);
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current) return;

    const coords = getCanvasCoords(e, previewCanvasRef, 1);
    if (!coords) return;

    // Check for brush resize (Alt + Click)
    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();
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

    setIsDrawing(true);
    drawPoints.current = [coords];

    // Draw initial point
    const maskCtx = maskCanvasRef.current.getContext('2d')!;
    // In our mask: White (255) = Keep, Black (0) = Remove
    // Brush 'remove' should paint Black (0), 'keep' should paint White (255)
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

  // Keyboard handlers for brush mode toggle
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Brush Size
      if (e.key === '[') {
        setBrushSize((prev) => Math.max(1, prev - 5));
        return;
      }
      if (e.key === ']') {
        setBrushSize((prev) => Math.min(500, prev + 5));
        return;
      }

      if (e.key === 'x' || e.key === 'X') {
        setBrushMode((prev) => (prev === 'remove' ? 'keep' : 'remove'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, historyIndex, history]);

  const handleApply = () => {
    if (maskCanvasRef.current) {
      onApply(maskCanvasRef.current);
    }
  };

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

  return (
    <Modal
      title={
        <Space>
          Remove Color
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            size="small"
            onClick={() => setOpenTour(true)}
          />
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      width={Math.min(
        canvasRef.current?.width ? canvasRef.current.width + 100 : 900,
        window.innerWidth * 0.95,
      )}
      okText="Apply"
      cancelText="Cancel"
      style={{ top: 20 }}
      maskClosable={false}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }} ref={controlsRef}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Selected Color:</strong>{' '}
                <span
                  style={{
                    display: 'inline-block',
                    width: 24,
                    height: 24,
                    background: selectedColor || '#000',
                    border: '1px solid #ccc',
                    verticalAlign: 'middle',
                    marginLeft: 8,
                  }}
                />
                <span style={{ marginLeft: 8 }}>{selectedColor}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Tolerance:</strong> {tolerance}%
              </div>
              <Slider
                min={0}
                max={100}
                value={tolerance}
                onChange={setTolerance}
                tooltip={{ formatter: (value) => `${value}%` }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Feather:</strong> {feather}%
              </div>
              <Slider
                min={0}
                max={50}
                value={feather}
                onChange={setFeather}
                tooltip={{ formatter: (value) => `${value}%` }}
              />
            </div>

            <Space size="large">
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Invert:</strong>
                </div>
                <Radio.Group value={invert} onChange={(e) => setInvert(e.target.value)}>
                  <Radio.Button value={false}>Normal</Radio.Button>
                  <Radio.Button value={true}>Inverted</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Preview:</strong>
                </div>
                <Radio.Group
                  value={previewMode}
                  onChange={(e) => {
                    setPreviewMode(e.target.value);
                    // Need to trigger update manually since state change is async but we want immediate feedback
                    setTimeout(updatePreview, 0);
                  }}
                >
                  <Radio.Button value="normal">Normal</Radio.Button>
                  <Radio.Button value="mask">Mask</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>History:</strong>
                </div>
                <Space ref={historyRef}>
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
              </div>
            </Space>
          </div>

          <div
            style={{ flex: 1, minWidth: 300, borderLeft: '1px solid #eee', paddingLeft: 24 }}
            ref={brushRef}
          >
            <div style={{ marginBottom: 16, fontWeight: 'bold' }}>Manual Adjustments (Brush)</div>

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
                <span>Type:</span>
                <Select
                  value={brushType}
                  onChange={(v) => setBrushType(v as 'hard' | 'soft')}
                  style={{ width: 80 }}
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
                  style={{ width: 70 }}
                />

                <span>Opacity:</span>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={brushOpacity}
                  onChange={setBrushOpacity}
                  style={{ width: 80 }}
                />
              </Space>

              <div style={{ fontSize: 12, color: '#666' }}>
                Note: Changing Tolerance/Feather will reset manual brush edits.
              </div>
            </Space>
          </div>
        </div>

        <div
          ref={tourCanvasRef}
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

            <canvas
              ref={previewCanvasRef}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                imageRendering: 'pixelated',
                cursor: 'none', // Hide default cursor
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />

            {/* Overlay canvas for cursor */}
            <canvas
              ref={overlayCanvasRef}
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

        <Tour open={openTour} onClose={() => setOpenTour(false)} steps={tourSteps} />
      </Space>
    </Modal>
  );
};

export default ColorRemovalModal;
