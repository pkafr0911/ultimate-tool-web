import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, Tabs, Row, Col, Typography, Button, Spin } from 'antd';
import { applyHslAdjustments, colorRanges } from '../utils/hslHelpers';
import { CustomSlider } from './CustomSlider';
import '../styles.less';

const { Text } = Typography;

interface HslAdjustmentModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (processedCanvas: HTMLCanvasElement) => void;
  sourceCanvas: HTMLCanvasElement | null;
}

const colorSwatches = [
  { name: 'red', color: '#ff4d4d' },
  { name: 'orange', color: '#ffa500' },
  { name: 'yellow', color: '#ffd700' },
  { name: 'green', color: '#00c853' },
  { name: 'aqua', color: '#00e5ff' },
  { name: 'blue', color: '#2979ff' },
  { name: 'purple', color: '#9c27b0' },
  { name: 'magenta', color: '#ff00aa' },
];

const getSliderGradient = (activeColor: string, type: 'h' | 's' | 'l') => {
  const base = colorSwatches.find((c) => c.name === activeColor)?.color || '#ffffff';

  const index = colorSwatches.findIndex((c) => c.name === activeColor);

  // If not found, default to grayscale
  if (index === -1) return '#555';

  const current = colorSwatches[index].color;
  const left = colorSwatches[index - 1]?.color || current; // If first, use itself
  const right = colorSwatches[index + 1]?.color || current; // If last, use itself

  switch (type) {
    case 'h':
      return `linear-gradient(90deg, ${left}, ${current}, ${right})`;
    case 's':
      return `linear-gradient(90deg, gray, ${base})`;
    case 'l':
      return `linear-gradient(90deg, black, ${base}, white)`;
    default:
      return '#555';
  }
};

const HslAdjustmentModal: React.FC<HslAdjustmentModalProps> = ({
  visible,
  onCancel,
  onApply,
  sourceCanvas,
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('red');
  const [adjustments, setAdjustments] = useState<
    Record<string, { h: number; s: number; l: number }>
  >({});
  const [loading, setLoading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize adjustments
  useEffect(() => {
    if (visible) {
      const initialAdjustments: any = {};
      colorRanges.forEach((c) => {
        initialAdjustments[c.name] = { h: 0, s: 0, l: 0 };
      });
      setAdjustments(initialAdjustments);
      setActiveChannel('red');
    }
  }, [visible]);

  // Handle live preview
  useEffect(() => {
    if (!visible || !sourceCanvas || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Use a timeout to debounce heavy processing
    const timer = setTimeout(() => {
      // Calculate scaled dimensions for preview
      const MAX_PREVIEW_SIZE = 600;
      let previewWidth = sourceCanvas.width;
      let previewHeight = sourceCanvas.height;

      if (sourceCanvas.width > MAX_PREVIEW_SIZE || sourceCanvas.height > MAX_PREVIEW_SIZE) {
        const ratio = Math.min(
          MAX_PREVIEW_SIZE / sourceCanvas.width,
          MAX_PREVIEW_SIZE / sourceCanvas.height,
        );
        previewWidth = Math.floor(sourceCanvas.width * ratio);
        previewHeight = Math.floor(sourceCanvas.height * ratio);
      }

      // Ensure canvas ref still exists, then update dimensions and re-acquire context
      const canvasEl = previewCanvasRef.current;
      if (!canvasEl) return;

      canvasEl.width = previewWidth;
      canvasEl.height = previewHeight;

      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      // Draw source to preview
      ctx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);

      // Get image data
      const imageData = ctx.getImageData(0, 0, previewWidth, previewHeight);

      // Apply HSL (this modifies imageData in place)
      applyHslAdjustments(imageData, adjustments);

      // Put back
      ctx.putImageData(imageData, 0, 0);
    }, 50);

    return () => clearTimeout(timer);
  }, [visible, sourceCanvas, adjustments]);

  const updateAdjustment = (field: 'h' | 's' | 'l', value: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        [field]: value,
      },
    }));
  };

  const handleApply = async () => {
    if (!sourceCanvas) return;
    setLoading(true);

    // Give UI a moment to update
    setTimeout(() => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceCanvas.width;
      tempCanvas.height = sourceCanvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        setLoading(false);
        return;
      }

      ctx.drawImage(sourceCanvas, 0, 0);
      const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

      applyHslAdjustments(imageData, adjustments);
      ctx.putImageData(imageData, 0, 0);

      onApply(tempCanvas);
      setLoading(false);
    }, 100);
  };

  const currentAdj = adjustments[activeChannel] || { h: 0, s: 0, l: 0 };

  return (
    <Modal
      title="HSL Adjustments"
      open={visible}
      onCancel={onCancel}
      width={1000}
      onOk={handleApply}
      confirmLoading={loading}
      okText="Apply"
      maskClosable={false}
    >
      <Row gutter={16}>
        <Col span={16} style={{ textAlign: 'center', background: '#f0f0f0', padding: 16 }}>
          <canvas
            ref={previewCanvasRef}
            style={{ maxWidth: '100%', maxHeight: '500px', border: '1px solid #ccc' }}
          />
        </Col>
        <Col span={8}>
          <Tabs
            activeKey={activeChannel}
            onChange={setActiveChannel}
            type="card"
            size="small"
            items={colorRanges.map((range) => ({
              label: (
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    background: getRangeColor(range.name),
                    borderRadius: '50%',
                    marginRight: 4,
                  }}
                  title={range.name}
                />
              ),
              key: range.name,
            }))}
            tabPosition="top"
            tabBarGutter={4}
          />
          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5} style={{ textTransform: 'capitalize' }}>
              {activeChannel}
            </Typography.Title>

            <div style={{ marginBottom: 16 }}>
              <CustomSlider
                label={`Hue (${currentAdj.h}°)`}
                min={-180}
                max={180}
                value={currentAdj.h}
                onChange={(v) => updateAdjustment('h', v)}
                gradient={getSliderGradient(activeChannel, 'h')}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <CustomSlider
                label={`Saturation (${Math.round(currentAdj.s * 100)}%)`}
                min={-1}
                max={1}
                value={currentAdj.s}
                onChange={(v) => updateAdjustment('s', v)}
                gradient={getSliderGradient(activeChannel, 's')}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <CustomSlider
                label={`Luminance (${Math.round(currentAdj.l * 100)}%)`}
                min={-1}
                max={1}
                value={currentAdj.l}
                onChange={(v) => updateAdjustment('l', v)}
                gradient={getSliderGradient(activeChannel, 'l')}
              />
            </div>

            <Button
              onClick={() => {
                setAdjustments((prev) => ({
                  ...prev,
                  [activeChannel]: { h: 0, s: 0, l: 0 },
                }));
              }}
              size="small"
            >
              Reset {activeChannel}
            </Button>
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

// Helper for UI colored dots
function getRangeColor(name: string) {
  switch (name) {
    case 'red':
      return '#ff4d4f';
    case 'orange':
      return '#fa8c16';
    case 'yellow':
      return '#fadb14';
    case 'green':
      return '#52c41a';
    case 'aqua':
      return '#13c2c2';
    case 'blue':
      return '#1890ff';
    case 'purple':
      return '#722ed1';
    case 'magenta':
      return '#eb2f96';
    default:
      return '#eee';
  }
}

export default HslAdjustmentModal;
