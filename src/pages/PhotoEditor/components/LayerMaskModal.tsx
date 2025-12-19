import React, { useEffect, useState, useRef } from 'react';
import { Modal, Slider, Radio, Space, Button } from 'antd';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';
import {
  BrushSettings,
  drawBrushStroke,
  drawBrushCursor,
  getCanvasCoords,
} from '../utils/brushHelpers';

type LayerMaskModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (maskCanvas: HTMLCanvasElement) => void;
  sourceCanvas: HTMLCanvasElement | null;
};

const LayerMaskModal: React.FC<LayerMaskModalProps> = ({
  open,
  onCancel,
  onApply,
  sourceCanvas,
}) => {
  const [brushMode, setBrushMode] = useState<'remove' | 'keep'>('remove');
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushType, setBrushType] = useState<'hard' | 'soft'>('hard');
  const [previewMode, setPreviewMode] = useState<'normal' | 'mask'>('normal');

  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (
      open &&
      sourceCanvas &&
      previewCanvasRef.current &&
      maskCanvasRef.current &&
      overlayCanvasRef.current
    ) {
      const w = sourceCanvas.width;
      const h = sourceCanvas.height;

      previewCanvasRef.current.width = w;
      previewCanvasRef.current.height = h;
      maskCanvasRef.current.width = w;
      maskCanvasRef.current.height = h;
      overlayCanvasRef.current.width = w;
      overlayCanvasRef.current.height = h;

      const maskCtx = maskCanvasRef.current.getContext('2d')!;
      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, w, h);

      saveHistory();
      updatePreview();
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

    ctx.clearRect(0, 0, w, h);

    if (previewMode === 'mask') {
      ctx.drawImage(maskCanvasRef.current, 0, 0);
    } else {
      // Draw masked image
      // 1. Draw image
      ctx.drawImage(sourceCanvas, 0, 0);
      // 2. Apply mask (destination-in)
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvasRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  useEffect(() => {
    updatePreview();
  }, [previewMode, historyIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e, overlayCanvasRef);
    if (coords) {
      drawPoints.current = [coords];
      draw(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e, overlayCanvasRef);
    setCursorPos(coords);
    if (isDrawing && coords) {
      drawPoints.current.push(coords);
      draw(coords);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      drawPoints.current = [];
      saveHistory();
      updatePreview();
    }
  };

  const draw = (coords: { x: number; y: number }) => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d')!;

    const settings: BrushSettings = {
      color: brushMode === 'remove' ? '#000000' : '#ffffff',
      lineWidth: brushSize,
      opacity: brushOpacity,
      flow: 1,
      type: brushType,
    };

    drawBrushStroke(ctx, drawPoints.current, settings);
  };

  // Draw cursor
  useEffect(() => {
    if (!overlayCanvasRef.current || !cursorPos) return;
    const ctx = overlayCanvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    drawBrushCursor(ctx, cursorPos.x, cursorPos.y, brushSize, '#fff');
    drawBrushCursor(ctx, cursorPos.x, cursorPos.y, brushSize, '#000');
  }, [cursorPos, brushSize]);

  const handleApply = () => {
    if (maskCanvasRef.current) {
      onApply(maskCanvasRef.current);
    }
  };

  return (
    <Modal
      title="Layer Mask"
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      width={1000}
      style={{ top: 20 }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 300 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span>Preview Mode:</span>
              <Radio.Group value={previewMode} onChange={(e) => setPreviewMode(e.target.value)}>
                <Radio.Button value="normal">Normal</Radio.Button>
                <Radio.Button value="mask">Mask</Radio.Button>
              </Radio.Group>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16 }}>
              <h4>Brush Settings</h4>
              <Space>
                <Button
                  type={brushMode === 'remove' ? 'primary' : 'default'}
                  onClick={() => setBrushMode('remove')}
                >
                  Hide (Black)
                </Button>
                <Button
                  type={brushMode === 'keep' ? 'primary' : 'default'}
                  onClick={() => setBrushMode('keep')}
                >
                  Show (White)
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
              top: 0,
              left: 0,
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
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
              cursor: 'none',
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

export default LayerMaskModal;
