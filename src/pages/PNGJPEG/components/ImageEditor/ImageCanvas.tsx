// src/components/ImageCanvas.tsx
import React from 'react';
import { Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

type HoverColor = {
  x: number;
  y: number;
  color: string;
};

type ImageCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  overlayRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  offset: { x: number; y: number };
  zoom: number;
  tool: string;
  currentCursor: string;
  hoverColor: HoverColor | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
};

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  canvasRef,
  overlayRef,
  containerRef,
  offset,
  zoom,
  tool,
  currentCursor,
  hoverColor,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
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
        ref={canvasRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
          display: 'block',
        }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      />
      {/* Drag & drop support: dropped images become overlay images (onAddImage) */}
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
  );
};

export default ImageCanvas;
