// src/components/ImageCanvas.tsx
import React from 'react';

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
  onAddImage?: (file: File) => void;
  layers?: Array<any>;
  activeLayerId?: string | null;
  setLayerOpacity?: (id: string, v: number) => void;
  setLayerBlend?: (id: string, v: GlobalCompositeOperation) => void;
  moveLayerUp?: (id: string) => void;
  moveLayerDown?: (id: string) => void;
  deleteLayer?: (id: string) => void;
  selectLayer?: (id: string) => void;
  mergeLayer?: (id?: string) => void;
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
  onAddImage,
  layers,
  activeLayerId,
  setLayerOpacity,
  setLayerBlend,
  moveLayerUp,
  moveLayerDown,
  deleteLayer,
  selectLayer,
  mergeLayer,
}) => {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const triggerFile = () => fileRef.current && fileRef.current.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f && onAddImage) onAddImage(f);
    // clear selection so same file can be re-picked
    if (fileRef.current) fileRef.current.value = '';
  };
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
      {/* Add overlay image button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <button
        onClick={triggerFile}
        title="Add overlay image"
        style={{
          position: 'absolute',
          left: 8,
          top: 8,
          zIndex: 9999,
          padding: '6px 8px',
          fontSize: 12,
          borderRadius: 4,
          border: '1px solid rgba(0,0,0,0.08)',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        + Image
      </button>
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
      {/* Layer panel removed from here — all layer actions moved to TopEditorToolbar */}
    </div>
  );
};

export default ImageCanvas;
