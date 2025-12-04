import React, { useEffect, useState, useRef } from 'react';
import { Modal, Slider, Radio, Space, Button } from 'antd';

type ColorRemovalModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (tolerance: number, invert: boolean, feather: number) => void;
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update preview when tolerance or mode changes
  useEffect(() => {
    if (!open || !canvasRef.current || !selectedColor || !previewCanvasRef.current) return;

    const sourceCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const ctx = previewCanvas.getContext('2d')!;

    // Set preview canvas size to match source
    previewCanvas.width = sourceCanvas.width;
    previewCanvas.height = sourceCanvas.height;

    // Get source image data
    const sourceCtx = sourceCanvas.getContext('2d')!;
    const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imageData.data;

    // Parse selected color
    const hex = selectedColor.replace('#', '');
    const targetR = parseInt(hex.substring(0, 2), 16);
    const targetG = parseInt(hex.substring(2, 4), 16);
    const targetB = parseInt(hex.substring(4, 6), 16);

    // First pass: calculate alpha values based on color distance
    const alphaMap = new Uint8Array(data.length / 4);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2),
      );

      const maxDistance = Math.sqrt(255 * 255 * 3);
      const normalizedDistance = distance / maxDistance;
      const threshold = tolerance / 100;

      // Calculate base alpha (0 = remove, 1 = keep)
      let baseAlpha;

      if (feather === 0) {
        // No feathering - hard edge
        baseAlpha = normalizedDistance <= threshold ? 0 : 1;
      } else {
        // Apply feathering - create gradient around the threshold boundary
        // Higher feather = wider gradient range around the edge
        const featherRange = feather / 100;
        const distanceFromThreshold = normalizedDistance - threshold;

        if (distanceFromThreshold < -featherRange) {
          // Far inside selection - fully removed (black in mask)
          baseAlpha = 0;
        } else if (distanceFromThreshold > featherRange) {
          // Far outside selection - fully kept (white in mask)
          baseAlpha = 1;
        } else {
          // In feather zone - smooth gradient from 0 to 1
          baseAlpha = (distanceFromThreshold + featherRange) / (featherRange * 2);
        }
      }

      // Apply invert
      if (invert) {
        baseAlpha = 1 - baseAlpha;
      }

      alphaMap[i / 4] = Math.round(baseAlpha * 255);
    }

    // Second pass: apply visual effects
    for (let i = 0; i < data.length; i += 4) {
      const pixelAlpha = alphaMap[i / 4];

      if (previewMode === 'mask') {
        // Black and white preview
        if (pixelAlpha === 0) {
          // Will be removed - show black
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        } else if (pixelAlpha === 255) {
          // Will be kept - show white
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        } else {
          // Feather zone - show gray
          data[i] = pixelAlpha;
          data[i + 1] = pixelAlpha;
          data[i + 2] = pixelAlpha;
          data[i + 3] = 255;
        }
      } else {
        // Normal preview: apply calculated alpha
        data[i + 3] = pixelAlpha;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [open, tolerance, previewMode, selectedColor, canvasRef, invert, feather]);

  const handleApply = () => {
    onApply(tolerance, invert, feather);
  };

  return (
    <Modal
      title="Remove Color"
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      width={Math.min(
        canvasRef.current?.width ? canvasRef.current.width + 100 : 800,
        window.innerWidth * 0.9,
      )}
      okText="Apply"
      cancelText="Cancel"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
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

        <div>
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
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Adjust how similar colors will be removed (0 = exact match, 100 = all colors)
          </div>
        </div>

        <div>
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
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Soften the edge transition (0 = hard edge, 50 = very soft)
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Invert Selection:</strong>
          </div>
          <Radio.Group value={invert} onChange={(e) => setInvert(e.target.value)}>
            <Radio.Button value={false}>Normal</Radio.Button>
            <Radio.Button value={true}>Inverted</Radio.Button>
          </Radio.Group>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {invert ? 'Remove everything EXCEPT the selected color' : 'Remove the selected color'}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Preview Mode:</strong>
          </div>
          <Radio.Group value={previewMode} onChange={(e) => setPreviewMode(e.target.value)}>
            <Radio.Button value="normal">Normal</Radio.Button>
            <Radio.Button value="mask">Black & White Mask</Radio.Button>
          </Radio.Group>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {previewMode === 'normal'
              ? 'Shows how the final image will look'
              : 'Black = removed area, White = kept area'}
          </div>
        </div>

        <div
          style={{
            maxHeight: '60vh',
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: 8,
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
            backgroundColor: previewMode === 'normal' ? '#fff' : '#fff',
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              imageRendering: 'pixelated',
            }}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default ColorRemovalModal;
