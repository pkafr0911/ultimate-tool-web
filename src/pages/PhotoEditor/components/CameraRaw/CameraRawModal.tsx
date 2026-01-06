import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, Tabs, Row, Col, Typography, Button, Spin } from 'antd';
import { CameraRawSettings, applyCameraRawPipeline } from '../../utils/cameraRawHelpers';
import HslPanel from './HslPanel';
import CurvesPanel from './CurvesPanel';
import ColorGradingPanel from './ColorGradingPanel';
import { colorRanges } from '../../utils/hslHelpers';

const { Text } = Typography;

interface CameraRawModalProps {
  visible: boolean;
  onCancel: () => void;
  onApply: (processedCanvas: HTMLCanvasElement) => void;
  sourceCanvas: HTMLCanvasElement | null;
}

const CameraRawModal: React.FC<CameraRawModalProps> = ({
  visible,
  onCancel,
  onApply,
  sourceCanvas,
}) => {
  const [loading, setLoading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const initialSettings: CameraRawSettings = useMemo(() => {
    const hsl: any = {};
    colorRanges.forEach((c) => (hsl[c.name] = { h: 0, s: 0, l: 0 }));

    return {
      hsl,
      curves: {
        master: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
        red: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
        green: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
        blue: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
      },
      colorGrading: {
        shadows: { h: 0, s: 0, l: 0 },
        midtones: { h: 0, s: 0, l: 0 },
        highlights: { h: 0, s: 0, l: 0 },
        blending: 0.5,
        balance: 0,
      },
    };
  }, []);

  const [settings, setSettings] = useState<CameraRawSettings>(initialSettings);

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setSettings(initialSettings);
    }
  }, [visible, initialSettings]);

  // Preview Logic
  useEffect(() => {
    if (!visible || !sourceCanvas || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;

    // Use a timeout to debounce heavy processing
    const timer = setTimeout(() => {
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

      canvas.width = previewWidth;
      canvas.height = previewHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw source to preview
      ctx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);

      // Get image data
      const imageData = ctx.getImageData(0, 0, previewWidth, previewHeight);

      // Apply Pipeline
      applyCameraRawPipeline(imageData, settings);

      // Put back
      ctx.putImageData(imageData, 0, 0);
    }, 50);

    return () => clearTimeout(timer);
  }, [visible, sourceCanvas, settings]);

  const handleApply = async () => {
    if (!sourceCanvas) return;
    setLoading(true);

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

      applyCameraRawPipeline(imageData, settings);
      ctx.putImageData(imageData, 0, 0);

      onApply(tempCanvas);
      setLoading(false);
    }, 100);
  };

  const tabsItems = [
    {
      key: 'hsl',
      label: 'HSL Mixer',
      children: (
        <HslPanel
          adjustments={settings.hsl}
          onChange={(hsl) => setSettings({ ...settings, hsl })}
        />
      ),
    },
    {
      key: 'curves',
      label: 'Curves',
      children: (
        <CurvesPanel
          curves={settings.curves}
          onChange={(curves) => setSettings({ ...settings, curves })}
        />
      ),
    },
    {
      key: 'grading',
      label: 'Color Grading',
      children: (
        <ColorGradingPanel
          settings={settings.colorGrading}
          onChange={(colorGrading) => setSettings({ ...settings, colorGrading })}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Camera Raw Filter"
      open={visible}
      onCancel={onCancel}
      width={1000}
      onOk={handleApply}
      confirmLoading={loading}
      okText="Apply"
      style={{ top: 20 }}
    >
      <Row gutter={24}>
        <Col
          span={14}
          style={{
            textAlign: 'center',
            background: '#f0f0f0',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '550px',
              border: '1px solid #ccc',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        </Col>
        <Col span={10}>
          <Tabs defaultActiveKey="hsl" items={tabsItems} />
        </Col>
      </Row>
    </Modal>
  );
};

export default CameraRawModal;
