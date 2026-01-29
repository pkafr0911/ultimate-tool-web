import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Button, Tooltip, Radio, Slider, Space, Divider, message } from 'antd';
import {
  BorderOutlined,
  RadiusSettingOutlined,
  EditOutlined,
  ClearOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Canvas, FabricImage, FabricObject } from 'fabric';

export type SelectionMode = 'rectangle' | 'ellipse' | 'lasso' | 'polygon';

interface SelectionToolsProps {
  canvas: Canvas | null;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedObject: FabricObject | null;
  onSelectionComplete?: (maskCanvas: HTMLCanvasElement) => void;
}

interface Point {
  x: number;
  y: number;
}

const SelectionTools: React.FC<SelectionToolsProps> = ({
  canvas,
  activeTool,
  setActiveTool,
  selectedObject,
  onSelectionComplete,
}) => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('rectangle');
  const [feather, setFeather] = useState<number>(0);
  const [isSelecting, setIsSelecting] = useState(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionStartRef = useRef<Point | null>(null);
  const selectionEndRef = useRef<Point | null>(null);
  const lassoPointsRef = useRef<Point[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const isSelectionTool = activeTool.startsWith('selection-');

  // Create overlay canvas for selection visualization
  useEffect(() => {
    if (!canvas || !isSelectionTool) return;

    const container = canvas.lowerCanvasEl.parentElement;
    if (!container) return;

    // Create overlay canvas
    const overlay = document.createElement('canvas');
    overlay.width = canvas.width!;
    overlay.height = canvas.height!;
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '100';
    container.appendChild(overlay);
    overlayCanvasRef.current = overlay;

    return () => {
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
      overlayCanvasRef.current = null;
    };
  }, [canvas, isSelectionTool]);

  // Draw selection preview
  const drawSelectionPreview = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Set selection style
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.fillStyle = 'rgba(24, 144, 255, 0.1)';

    const mode = selectionMode;
    const start = selectionStartRef.current;
    const end = selectionEndRef.current;
    const lassoPoints = lassoPointsRef.current;

    if (mode === 'rectangle' && start && end) {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);

      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
    } else if (mode === 'ellipse' && start && end) {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if ((mode === 'lasso' || mode === 'polygon') && lassoPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
      }
      if (mode === 'lasso') {
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();

      // Draw points for polygon mode
      if (mode === 'polygon') {
        ctx.setLineDash([]);
        ctx.fillStyle = '#1890ff';
        lassoPoints.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, index === 0 ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  }, [selectionMode]);

  // Generate mask canvas from selection
  const generateMaskCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!canvas) return null;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width!;
    maskCanvas.height = canvas.height!;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return null;

    // Fill with black (unselected)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white selection
    ctx.fillStyle = '#fff';

    const mode = selectionMode;
    const start = selectionStartRef.current;
    const end = selectionEndRef.current;
    const lassoPoints = lassoPointsRef.current;

    if (mode === 'rectangle' && start && end) {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      ctx.fillRect(x, y, w, h);
    } else if (mode === 'ellipse' && start && end) {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if ((mode === 'lasso' || mode === 'polygon') && lassoPoints.length > 2) {
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      return null;
    }

    // Apply feather if needed
    if (feather > 0) {
      applyFeatherToMask(ctx, maskCanvas.width, maskCanvas.height, feather);
    }

    return maskCanvas;
  }, [canvas, selectionMode, feather]);

  // Apply gaussian blur for feathering
  const applyFeatherToMask = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    radius: number,
  ) => {
    // Use CSS filter for blur (simpler approach)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.filter = `blur(${radius}px)`;
    tempCtx.drawImage(ctx.canvas, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  };

  // Mouse event handlers
  useEffect(() => {
    if (!canvas || !isSelectionTool) return;

    const getCanvasPoint = (e: MouseEvent): Point => {
      const rect = canvas.lowerCanvasEl.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const point = getCanvasPoint(e);

      if (selectionMode === 'polygon') {
        // Check if clicking near first point to close
        if (lassoPointsRef.current.length > 2) {
          const firstPoint = lassoPointsRef.current[0];
          const dist = Math.hypot(point.x - firstPoint.x, point.y - firstPoint.y);
          if (dist < 10) {
            // Complete polygon
            completeSelection();
            return;
          }
        }
        lassoPointsRef.current.push(point);
        drawSelectionPreview();
      } else {
        setIsSelecting(true);
        selectionStartRef.current = point;
        selectionEndRef.current = point;

        if (selectionMode === 'lasso') {
          lassoPointsRef.current = [point];
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting && selectionMode !== 'polygon') return;

      const point = getCanvasPoint(e);

      if (selectionMode === 'lasso' && isSelecting) {
        lassoPointsRef.current.push(point);
      } else if (selectionMode !== 'polygon') {
        selectionEndRef.current = point;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(drawSelectionPreview);
    };

    const handleMouseUp = () => {
      if (selectionMode !== 'polygon' && isSelecting) {
        setIsSelecting(false);
        completeSelection();
      }
    };

    const completeSelection = () => {
      const maskCanvas = generateMaskCanvas();
      if (maskCanvas && onSelectionComplete) {
        onSelectionComplete(maskCanvas);
        message.success('Selection created');
      }

      // Clear selection state
      selectionStartRef.current = null;
      selectionEndRef.current = null;
      lassoPointsRef.current = [];

      // Clear overlay
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);
        }
      }
    };

    const container = canvas.lowerCanvasEl.parentElement;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    canvas,
    isSelectionTool,
    selectionMode,
    isSelecting,
    drawSelectionPreview,
    generateMaskCanvas,
    onSelectionComplete,
  ]);

  // Clear selection
  const clearSelection = useCallback(() => {
    selectionStartRef.current = null;
    selectionEndRef.current = null;
    lassoPointsRef.current = [];
    setIsSelecting(false);

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    clearSelection();
    setActiveTool('select');
  }, [clearSelection, setActiveTool]);

  const handleModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);
    clearSelection();
    setActiveTool(`selection-${mode}`);
  };

  const isImageSelected = selectedObject instanceof FabricImage;

  return (
    <div style={{ padding: '8px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Tooltip title="Rectangle Marquee">
            <Button
              type={selectionMode === 'rectangle' && isSelectionTool ? 'primary' : 'default'}
              icon={<BorderOutlined />}
              onClick={() => handleModeChange('rectangle')}
            />
          </Tooltip>
          <Tooltip title="Ellipse Marquee">
            <Button
              type={selectionMode === 'ellipse' && isSelectionTool ? 'primary' : 'default'}
              icon={<RadiusSettingOutlined />}
              onClick={() => handleModeChange('ellipse')}
            />
          </Tooltip>
          <Tooltip title="Lasso">
            <Button
              type={selectionMode === 'lasso' && isSelectionTool ? 'primary' : 'default'}
              icon={<EditOutlined />}
              onClick={() => handleModeChange('lasso')}
            />
          </Tooltip>
          <Tooltip title="Polygon">
            <Button
              type={selectionMode === 'polygon' && isSelectionTool ? 'primary' : 'default'}
              icon={<BorderOutlined style={{ transform: 'rotate(45deg)' }} />}
              onClick={() => handleModeChange('polygon')}
            />
          </Tooltip>
        </div>

        {isSelectionTool && (
          <>
            <Divider style={{ margin: '8px 0' }} />

            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                Feather: {feather}px
              </div>
              <Slider
                min={0}
                max={50}
                value={feather}
                onChange={setFeather}
                style={{ margin: '0 4px' }}
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <Space>
              <Tooltip title="Clear Selection">
                <Button icon={<ClearOutlined />} onClick={clearSelection} size="small">
                  Clear
                </Button>
              </Tooltip>
              <Tooltip title="Exit Selection Mode">
                <Button icon={<CloseOutlined />} onClick={exitSelectionMode} size="small">
                  Exit
                </Button>
              </Tooltip>
            </Space>

            <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
              {selectionMode === 'rectangle' && 'Click and drag to create rectangular selection'}
              {selectionMode === 'ellipse' && 'Click and drag to create elliptical selection'}
              {selectionMode === 'lasso' && 'Click and drag to draw freehand selection'}
              {selectionMode === 'polygon' && 'Click to add points, click first point to close'}
            </div>
          </>
        )}
      </Space>
    </div>
  );
};

export default SelectionTools;
