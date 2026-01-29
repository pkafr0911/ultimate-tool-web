import React, { useEffect, useRef, useState } from 'react';
import { Modal, InputNumber, Button, Space, message, Select, Checkbox } from 'antd';
import { Canvas as FabricCanvas } from 'fabric';

const { Option } = Select;

interface CropModalProps {
  visible: boolean;
  onCancel: () => void;
  canvas: FabricCanvas | null;
  history: any;
}

const CropModal: React.FC<CropModalProps> = ({ visible, onCancel, canvas, history }) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [lockRatio, setLockRatio] = useState(false);

  useEffect(() => {
    if (visible && canvas) {
      // Initialize crop area to full canvas
      const width = canvas.getWidth();
      const height = canvas.getHeight();
      setCropArea({ x: 0, y: 0, width, height });
      setAspectRatio(null);
      setLockRatio(false);
    }
  }, [visible, canvas]);

  useEffect(() => {
    if (!visible || !canvas || !previewCanvasRef.current) return;

    const previewCanvas = previewCanvasRef.current;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    // Set preview canvas size
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;

    // Draw the current canvas state - use lowerCanvasEl for Fabric.js 6
    const canvasElement = canvas.lowerCanvasEl as HTMLCanvasElement;
    ctx.drawImage(canvasElement, 0, 0);

    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Clear crop area to show it
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(
      canvasElement,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
    );

    // Draw crop rectangle border
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = '#1890ff';
    const handles = [
      { x: cropArea.x, y: cropArea.y }, // top-left
      { x: cropArea.x + cropArea.width, y: cropArea.y }, // top-right
      { x: cropArea.x, y: cropArea.y + cropArea.height }, // bottom-left
      { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height }, // bottom-right
      { x: cropArea.x + cropArea.width / 2, y: cropArea.y }, // top-middle
      { x: cropArea.x + cropArea.width / 2, y: cropArea.y + cropArea.height }, // bottom-middle
      { x: cropArea.x, y: cropArea.y + cropArea.height / 2 }, // left-middle
      { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height / 2 }, // right-middle
    ];

    handles.forEach((handle) => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  }, [visible, canvas, cropArea]);

  const getHandleAtPosition = (x: number, y: number): string | null => {
    const threshold = 10;
    const { x: cx, y: cy, width, height } = cropArea;

    if (Math.abs(x - cx) < threshold && Math.abs(y - cy) < threshold) return 'tl';
    if (Math.abs(x - (cx + width)) < threshold && Math.abs(y - cy) < threshold) return 'tr';
    if (Math.abs(x - cx) < threshold && Math.abs(y - (cy + height)) < threshold) return 'bl';
    if (Math.abs(x - (cx + width)) < threshold && Math.abs(y - (cy + height)) < threshold)
      return 'br';
    if (Math.abs(x - (cx + width / 2)) < threshold && Math.abs(y - cy) < threshold) return 't';
    if (Math.abs(x - (cx + width / 2)) < threshold && Math.abs(y - (cy + height)) < threshold)
      return 'b';
    if (Math.abs(x - cx) < threshold && Math.abs(y - (cy + height / 2)) < threshold) return 'l';
    if (Math.abs(x - (cx + width)) < threshold && Math.abs(y - (cy + height / 2)) < threshold)
      return 'r';

    return null;
  };

  const isInsideCropArea = (x: number, y: number): boolean => {
    return (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = previewCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const handle = getHandleAtPosition(x, y);
    if (handle) {
      setResizeHandle(handle);
      setDragStart({ x, y });
    } else if (isInsideCropArea(x, y)) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) return;
    const rect = previewCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (resizeHandle) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      let newCrop = { ...cropArea };

      switch (resizeHandle) {
        case 'tl':
          newCrop.x += dx;
          newCrop.y += dy;
          newCrop.width -= dx;
          newCrop.height -= dy;
          break;
        case 'tr':
          newCrop.y += dy;
          newCrop.width += dx;
          newCrop.height -= dy;
          break;
        case 'bl':
          newCrop.x += dx;
          newCrop.width -= dx;
          newCrop.height += dy;
          break;
        case 'br':
          newCrop.width += dx;
          newCrop.height += dy;
          break;
        case 't':
          newCrop.y += dy;
          newCrop.height -= dy;
          break;
        case 'b':
          newCrop.height += dy;
          break;
        case 'l':
          newCrop.x += dx;
          newCrop.width -= dx;
          break;
        case 'r':
          newCrop.width += dx;
          break;
      }

      // Apply aspect ratio lock if enabled
      if (lockRatio && aspectRatio) {
        if (resizeHandle.includes('r') || resizeHandle.includes('l')) {
          newCrop.height = newCrop.width / aspectRatio;
        } else if (resizeHandle.includes('t') || resizeHandle.includes('b')) {
          newCrop.width = newCrop.height * aspectRatio;
        } else {
          // Corner handles - maintain ratio based on which dimension changed more
          newCrop.height = newCrop.width / aspectRatio;
        }
      }

      // Ensure minimum size and bounds
      if (newCrop.width > 10 && newCrop.height > 10) {
        newCrop.x = Math.max(0, Math.min(newCrop.x, canvas.getWidth() - newCrop.width));
        newCrop.y = Math.max(0, Math.min(newCrop.y, canvas.getHeight() - newCrop.height));

        // Ensure width and height don't exceed canvas bounds
        if (newCrop.x + newCrop.width > canvas.getWidth()) {
          newCrop.width = canvas.getWidth() - newCrop.x;
          if (lockRatio && aspectRatio) {
            newCrop.height = newCrop.width / aspectRatio;
          }
        }
        if (newCrop.y + newCrop.height > canvas.getHeight()) {
          newCrop.height = canvas.getHeight() - newCrop.y;
          if (lockRatio && aspectRatio) {
            newCrop.width = newCrop.height * aspectRatio;
          }
        }

        setCropArea(newCrop);
        setDragStart({ x, y });
      }
    } else if (isDragging) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      let newX = cropArea.x + dx;
      let newY = cropArea.y + dy;

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, canvas.getWidth() - cropArea.width));
      newY = Math.max(0, Math.min(newY, canvas.getHeight() - cropArea.height));

      setCropArea({ ...cropArea, x: newX, y: newY });
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeHandle(null);
  };

  const handleConfirm = () => {
    if (!canvas) {
      message.error('Canvas not available');
      return;
    }

    if (cropArea.width < 1 || cropArea.height < 1) {
      message.error('Crop area is too small');
      return;
    }

    // Save state before cropping for undo
    history.saveState();

    try {
      // Get all objects with their full data including custom properties
      const canvasJSON = canvas.toJSON();
      const objects = canvasJSON.objects || [];

      // Get canvas background color
      const bgColor = canvas.backgroundColor || '#ffffff';

      // Clear the canvas
      canvas.clear();
      canvas.setDimensions({ width: cropArea.width, height: cropArea.height });
      canvas.set('backgroundColor', bgColor);

      // Adjust all objects' positions relative to the crop
      objects.forEach((objData: any) => {
        // Offset positions
        if (objData.left !== undefined) objData.left -= cropArea.x;
        if (objData.top !== undefined) objData.top -= cropArea.y;

        // For groups and active selections, offset the objects inside
        if (objData.objects && Array.isArray(objData.objects)) {
          objData.objects.forEach((innerObj: any) => {
            if (innerObj.left !== undefined) innerObj.left -= cropArea.x;
            if (innerObj.top !== undefined) innerObj.top -= cropArea.y;
          });
        }
      });

      // Reload objects into canvas with proper custom properties
      canvas.loadFromJSON(
        {
          version: canvasJSON.version || '5.3.0',
          objects,
        },
        () => {
          canvas.renderAll();
          // Save state after cropping
          history.saveState();
          message.success('Canvas cropped successfully');
          onCancel();
        },
      );
    } catch (error) {
      console.error('Crop error:', error);
      message.error('Failed to crop canvas');
    }
  };

  const handleAspectRatioChange = (value: string) => {
    if (value === 'free') {
      setAspectRatio(null);
      setLockRatio(false);
    } else {
      let ratio: number;
      switch (value) {
        case '16:9':
          ratio = 16 / 9;
          break;
        case '4:3':
          ratio = 4 / 3;
          break;
        case '3:2':
          ratio = 3 / 2;
          break;
        case '1:1':
          ratio = 1;
          break;
        case '9:16':
          ratio = 9 / 16;
          break;
        case '3:4':
          ratio = 3 / 4;
          break;
        case '2:3':
          ratio = 2 / 3;
          break;
        default:
          ratio = 1;
      }
      setAspectRatio(ratio);
      setLockRatio(true);

      // Adjust current crop area to match ratio
      const newHeight = cropArea.width / ratio;
      if (newHeight <= (canvas?.getHeight() || 0)) {
        setCropArea({ ...cropArea, height: newHeight });
      } else {
        const newWidth = cropArea.height * ratio;
        setCropArea({ ...cropArea, width: newWidth });
      }
    }
  };

  return (
    <Modal
      title="Crop Canvas"
      open={visible}
      onCancel={onCancel}
      width={Math.min(canvas?.getWidth() || 800, 1200) + 100}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          Confirm Crop
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <span>Aspect Ratio:</span>
            <Select
              style={{ width: 120 }}
              value={
                !lockRatio
                  ? 'free'
                  : aspectRatio === 16 / 9
                    ? '16:9'
                    : aspectRatio === 4 / 3
                      ? '4:3'
                      : aspectRatio === 3 / 2
                        ? '3:2'
                        : aspectRatio === 1
                          ? '1:1'
                          : aspectRatio === 9 / 16
                            ? '9:16'
                            : aspectRatio === 3 / 4
                              ? '3:4'
                              : aspectRatio === 2 / 3
                                ? '2:3'
                                : 'free'
              }
              onChange={handleAspectRatioChange}
            >
              <Option value="free">Free</Option>
              <Option value="16:9">16:9 (Landscape)</Option>
              <Option value="4:3">4:3 (Landscape)</Option>
              <Option value="3:2">3:2 (Landscape)</Option>
              <Option value="1:1">1:1 (Square)</Option>
              <Option value="9:16">9:16 (Portrait)</Option>
              <Option value="3:4">3:4 (Portrait)</Option>
              <Option value="2:3">2:3 (Portrait)</Option>
            </Select>
            <Checkbox checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)}>
              Lock
            </Checkbox>
          </Space>
          <Space>
            <span>X:</span>
            <InputNumber
              min={0}
              max={canvas?.getWidth() || 0}
              value={Math.round(cropArea.x)}
              onChange={(val) => setCropArea({ ...cropArea, x: val || 0 })}
            />
            <span>Y:</span>
            <InputNumber
              min={0}
              max={canvas?.getHeight() || 0}
              value={Math.round(cropArea.y)}
              onChange={(val) => setCropArea({ ...cropArea, y: val || 0 })}
            />
            <span>Width:</span>
            <InputNumber
              min={1}
              max={canvas?.getWidth() || 0}
              value={Math.round(cropArea.width)}
              onChange={(val) => {
                const newWidth = val || 1;
                if (lockRatio && aspectRatio) {
                  setCropArea({ ...cropArea, width: newWidth, height: newWidth / aspectRatio });
                } else {
                  setCropArea({ ...cropArea, width: newWidth });
                }
              }}
            />
            <span>Height:</span>
            <InputNumber
              min={1}
              max={canvas?.getHeight() || 0}
              value={Math.round(cropArea.height)}
              onChange={(val) => {
                const newHeight = val || 1;
                if (lockRatio && aspectRatio) {
                  setCropArea({ ...cropArea, width: newHeight * aspectRatio, height: newHeight });
                } else {
                  setCropArea({ ...cropArea, height: newHeight });
                }
              }}
            />
          </Space>
        </Space>
      </div>
      <div
        style={{
          overflow: 'auto',
          maxHeight: '600px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
        }}
      >
        <canvas
          ref={previewCanvasRef}
          style={{ display: 'block', cursor: isDragging ? 'move' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        💡 Drag to move crop area, drag handles to resize, or use inputs above. Select an aspect
        ratio preset or lock custom ratio. Click "Confirm Crop" to apply changes to all layers.
      </div>
    </Modal>
  );
};

export default CropModal;
