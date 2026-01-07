import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, Tabs, Row, Col, Typography, Button, Spin, Tooltip } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, AimOutlined } from '@ant-design/icons';
import { CameraRawSettings, applyCameraRawPipeline } from '../../utils/cameraRawHelpers';
import HslPanel from './HslPanel';
import CurvesPanel from './CurvesPanel';
import ColorGradingPanel from './ColorGradingPanel';
import { colorRanges, rgbToHsl, getColorNameFromHue } from '../../utils/hslHelpers';
import RGBHistogram from './RGBHistogram';

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
  const [showBefore, setShowBefore] = useState(false);
  const [redData, setRedData] = useState<number[]>(new Array(256).fill(0));
  const [greenData, setGreenData] = useState<number[]>(new Array(256).fill(0));
  const [blueData, setBlueData] = useState<number[]>(new Array(256).fill(0));

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
        temperature: 0,
        tint: 0,
      },
    };
  }, []);

  const [settings, setSettings] = useState<CameraRawSettings>(initialSettings);

  // Color Picker State
  const [isPicking, setIsPicking] = useState(false);
  const [activeHslChannel, setActiveHslChannel] = useState<string>('red');
  const [activeTab, setActiveTab] = useState('hsl');
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [sampledColor, setSampledColor] = useState<{ h: number; s: number; l: number } | null>(
    null,
  );

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

      // If showing 'before', skip processing and show original
      if (showBefore) {
        // Compute hist from original
        const rHist = new Array(256).fill(0);
        const gHist = new Array(256).fill(0);
        const bHist = new Array(256).fill(0);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          rHist[d[i]] += 1;
          gHist[d[i + 1]] += 1;
          bHist[d[i + 2]] += 1;
        }
        setRedData(rHist);
        setGreenData(gHist);
        setBlueData(bHist);

        // original already on canvas; nothing else to do
      } else {
        // Apply Pipeline
        applyCameraRawPipeline(imageData, settings);

        // Compute simple 256-bin RGB histograms from processed image
        const rHist = new Array(256).fill(0);
        const gHist = new Array(256).fill(0);
        const bHist = new Array(256).fill(0);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          rHist[d[i]] += 1;
          gHist[d[i + 1]] += 1;
          bHist[d[i + 2]] += 1;
        }
        setRedData(rHist);
        setGreenData(gHist);
        setBlueData(bHist);

        // Put processed data back
        ctx.putImageData(imageData, 0, 0);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [visible, sourceCanvas, settings, showBefore]);

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

  const handleCanvasClick = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    // Enable picking if isPicking mode is on OR Alt key is pressed
    const isAlt = (e as React.MouseEvent).altKey;
    if ((!isPicking && !isAlt) || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor(x * scaleX);
    const canvasY = Math.floor(y * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 3;
    const imageData = ctx.getImageData(
      Math.max(0, canvasX - 1),
      Math.max(0, canvasY - 1),
      size,
      size,
    );
    const data = imageData.data;
    if (data.length === 0) return;

    let r = 0,
      g = 0,
      b = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    const [h, s, l] = rgbToHsl(r, g, b);
    const hueDeg = h * 360;

    const channel = getColorNameFromHue(hueDeg);

    setActiveHslChannel(channel);
    setActiveTab('hsl');
    setSampledColor({ h: hueDeg, s, l });
    setPickerPos({ x, y });
  };

  const tabsItems = [
    {
      key: 'hsl',
      label: 'HSL Mixer',
      children: (
        <HslPanel
          adjustments={settings.hsl}
          onChange={(hsl) => setSettings({ ...settings, hsl })}
          activeChannel={activeHslChannel}
          onActiveChannelChange={setActiveHslChannel}
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
      width={1200}
      onOk={handleApply}
      confirmLoading={loading}
      okText="Apply"
      style={{ top: 20 }}
    >
      <Row gutter={24}>
        <Col
          span={16}
          style={{
            textAlign: 'center',
            background: '#f0f0f0',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                zIndex: 3,
                display: 'flex',
                gap: 8,
              }}
            >
              <Tooltip title="Pick color to select HSL channel">
                <Button
                  size="small"
                  type={isPicking ? 'primary' : 'default'}
                  icon={<AimOutlined />}
                  onClick={() => {
                    setIsPicking(!isPicking);
                    setPickerPos(null);
                  }}
                />
              </Tooltip>
              <Button
                size="small"
                icon={showBefore ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowBefore((s) => !s)}
              />
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <canvas
                ref={previewCanvasRef}
                onClick={handleCanvasClick}
                onTouchStart={handleCanvasClick}
                style={{
                  maxWidth: '100%',
                  maxHeight: '550px',
                  border: '1px solid #ccc',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: isPicking ? 'crosshair' : 'default',
                  display: 'block',
                }}
              />
              {isPicking && pickerPos && sampledColor && (
                <div
                  style={{
                    position: 'absolute',
                    left: pickerPos.x,
                    top: pickerPos.y,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: '2px solid white',
                      borderRadius: '50%',
                      boxShadow: '0 0 2px black',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 24,
                      left: 0,
                      background: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    H:{Math.round(sampledColor.h)} S:{Math.round(sampledColor.s * 100)} L:
                    {Math.round(sampledColor.l * 100)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ width: '100%' }}>
            <RGBHistogram
              canvasRef={previewCanvasRef}
              redData={redData}
              greenData={greenData}
              blueData={blueData}
            />
          </div>

          <div style={{ marginTop: 12, marginBottom: 16, padding: '0 8px' }}>
            <Row gutter={[12, 8]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Resolution
                </Text>
                <Text style={{ fontSize: 13 }}>
                  {sourceCanvas ? `${sourceCanvas.width} × ${sourceCanvas.height}` : 'N/A'}
                </Text>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  ISO
                </Text>
                <Text style={{ fontSize: 13 }}>--</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Exp
                </Text>
                <Text style={{ fontSize: 13 }}>--</Text>
              </Col>
            </Row>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabsItems} />
        </Col>
      </Row>
    </Modal>
  );
};

export default CameraRawModal;
