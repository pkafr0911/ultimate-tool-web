import React, { useEffect, useRef, useState } from 'react';
import { Button, Space, Tooltip, Modal, Select, message } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RedoOutlined,
  FullscreenOutlined,
  SwapOutlined,
  SettingOutlined,
} from '@ant-design/icons';

type Props = {
  imageUrl: string;
  extractedText?: string; // Optional: text extracted from the image
  upscaleMode;
};

const ImagePreview: React.FC<Props> = ({ imageUrl, extractedText = '', upscaleMode }) => {
  const [processedImageUrl, setProcessedImageUrl] = useState<string>(imageUrl);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // ------------ DPI Detection + Upscale ------------------
  const detectAndUpscale = async () => {
    if (!imageUrl) return;
    const img = new Image();
    img.src = imageUrl;
    try {
      await img.decode();
    } catch {
      message.error('Failed to load image for DPI detection.');
      return;
    }

    const dpi = Math.round((img.naturalWidth / img.width) * 96);
    console.log('Detected DPI:', dpi);

    if (dpi < 150 && upscaleMode !== 'none') {
      const scale = 300 / dpi;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const upscaledUrl = canvas.toDataURL('image/png');
        setProcessedImageUrl(upscaledUrl);
        message.success('Image upscaled to ~300 DPI');
      }
    } else {
      setProcessedImageUrl(imageUrl);
      if (upscaleMode === 'auto') {
        message.info('Image DPI is sufficient; no upscaling needed');
      }
    }
  };

  // ------------------- PAN -------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !start) return;
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setStart(null);
  };

  // ------------------- CTRL+Wheel Zoom -------------------
  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const rect = img.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.2), 8);

        const scaleChange = newZoom / prevZoom;

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

  // ------------------- Zoom Buttons -------------------
  const zoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const zoomOut = () => setZoom((z) => Math.max(z * 0.67, 0.2));
  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const fitScreen = () => setZoom(0.8);

  // ------------------- Double Click Zoom -------------------
  const handleDoubleClick = () => {
    setZoom((z) => Math.min(z * 1.5, 8));
  };

  // ------------------- Sync processedImageUrl when imageUrl changes -------------------
  useEffect(() => {
    setProcessedImageUrl(imageUrl);

    // Auto upscale if mode is 'auto'
    if (upscaleMode === 'auto') {
      detectAndUpscale();
    }
  }, [imageUrl, upscaleMode]);

  // ------------------- Reset zoom/offset when processed image changes -------------------
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [processedImageUrl]);

  return (
    <div>
      {/* Toolbar */}
      <Space style={{ marginBottom: 10 }}>
        <Tooltip title="Zoom In (CTRL+Wheel)">
          <Button size="small" icon={<ZoomInOutlined />} onClick={zoomIn} />
        </Tooltip>
        <Tooltip title="Zoom Out (CTRL+Wheel)">
          <Button size="small" icon={<ZoomOutOutlined />} onClick={zoomOut} />
        </Tooltip>
        <Tooltip title="Reset Zoom">
          <Button size="small" icon={<RedoOutlined />} onClick={resetZoom} />
        </Tooltip>
        <Tooltip title="Fit Screen">
          <Button size="small" icon={<FullscreenOutlined />} onClick={fitScreen} />
        </Tooltip>
        {upscaleMode === 'manual' && (
          <Tooltip title="Detect & Upscale DPI">
            <Button size="small" icon={<SwapOutlined />} onClick={detectAndUpscale}>
              Upscale
            </Button>
          </Tooltip>
        )}

        <span>{Math.round(zoom * 100)}%</span>
      </Space>

      {/* Image Viewer */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 500,
          border: '1px solid #eee',
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: '#fafafa',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <img
          ref={imgRef}
          src={processedImageUrl}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'auto',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImagePreview;
