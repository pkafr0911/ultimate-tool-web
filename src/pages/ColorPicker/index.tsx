import {
  CopyOutlined,
  BgColorsOutlined,
  ExperimentOutlined,
  EyeOutlined,
  AppstoreOutlined,
  FileImageOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { TinyColor, readability } from '@ctrl/tinycolor';
import {
  Button,
  Card,
  ColorPicker,
  Divider,
  Input,
  Radio,
  Space,
  Typography,
  message,
  Tabs,
  Row,
  Col,
  Slider,
  Tooltip,
  Tag,
  Upload,
  Image,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import React, { useState, useEffect, useRef } from 'react';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import './styles.less';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

const ColorPickerPage: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState('picker');

  // Picker & Gradient State
  const [mode, setMode] = useState<'single' | 'gradient'>('single');
  const [color1, setColor1] = useState<Color | string>('#1677ff');
  const [color2, setColor2] = useState<Color | string>('#ff718b');
  const [gradientDeg, setGradientDeg] = useState(90);

  // Palette State
  const [baseColor, setBaseColor] = useState<Color | string>('#1890ff');
  const [palette, setPalette] = useState<string[]>([]);

  // Contrast State
  const [fgColor, setFgColor] = useState<Color | string>('#ffffff');
  const [bgColor, setBgColor] = useState<Color | string>('#1677ff');
  const [contrastRatio, setContrastRatio] = useState(0);

  // Image Picker State
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [pickedColor, setPickedColor] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Helpers ---
  const toTiny = (value: Color | string) =>
    new TinyColor(typeof value === 'string' ? value : value.toHexString());

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied!');
  };

  // --- Effects ---
  useEffect(() => {
    generatePalette();
  }, [baseColor]);

  useEffect(() => {
    calculateContrast();
  }, [fgColor, bgColor]);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
    }
  }, [imageUrl]);

  // --- Logic ---

  const generatePalette = () => {
    const tiny = toTiny(baseColor);
    const colors: string[] = [];
    // Monochromatic palette generation
    for (let i = 10; i <= 90; i += 10) {
      colors.push(tiny.lighten(i).toHexString());
    }
    colors.push(tiny.toHexString());
    for (let i = 10; i <= 90; i += 10) {
      colors.push(tiny.darken(i).toHexString());
    }
    // Remove duplicates and sort by lightness
    const unique = [...new Set(colors)].sort(
      (a, b) => toTiny(b).getBrightness() - toTiny(a).getBrightness(),
    );
    setPalette(unique.slice(0, 10)); // Keep top 10
  };

  const calculateContrast = () => {
    const c1 = toTiny(fgColor);
    const c2 = toTiny(bgColor);
    setContrastRatio(readability(c1, c2));
  };

  const getContrastRating = (ratio: number) => {
    if (ratio >= 7) return { label: 'AAA (Excellent)', color: 'success' };
    if (ratio >= 4.5) return { label: 'AA (Good)', color: 'processing' };
    if (ratio >= 3) return { label: 'AA Large (Fair)', color: 'warning' };
    return { label: 'Fail', color: 'error' };
  };

  const handleUpload = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPickedColor('');
    return false;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = new TinyColor({ r: pixel[0], g: pixel[1], b: pixel[2] }).toHexString();
      setPickedColor(hex);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImageUrl('');
    setPickedColor('');
  };

  // --- Renderers ---

  const renderPickerTab = () => {
    const tiny1 = toTiny(color1);
    const tiny2 = toTiny(color2);
    const hex1 = tiny1.toHexString();
    const hex2 = tiny2.toHexString();
    const gradient = `linear-gradient(${gradientDeg}deg, ${hex1}, ${hex2})`;

    return (
      <div className="tab-content">
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          options={[
            { label: 'Single Color', value: 'single' },
            { label: 'Gradient', value: 'gradient' },
          ]}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 24 }}
        />

        {mode === 'single' ? (
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Card title="Color Selector" bordered={false} className="inner-card">
                <div className="picker-wrapper">
                  <ColorPicker value={color1} onChange={setColor1} panelRender={(panel) => panel} />
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Color Values" bordered={false} className="inner-card">
                <div className="preview-box" style={{ background: hex1 }} />
                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                  <Input
                    addonBefore="HEX"
                    value={hex1}
                    suffix={<CopyOutlined onClick={() => handleCopy(hex1)} />}
                    readOnly
                  />
                  <Input
                    addonBefore="RGB"
                    value={tiny1.toRgbString()}
                    suffix={<CopyOutlined onClick={() => handleCopy(tiny1.toRgbString())} />}
                    readOnly
                  />
                  <Input
                    addonBefore="HSL"
                    value={tiny1.toHslString()}
                    suffix={<CopyOutlined onClick={() => handleCopy(tiny1.toHslString())} />}
                    readOnly
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Card title="Gradient Controls" bordered={false} className="inner-card">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div className="gradient-pickers">
                    <Space>
                      <ColorPicker value={color1} onChange={setColor1} showText />
                      <Text strong>→</Text>
                      <ColorPicker value={color2} onChange={setColor2} showText />
                    </Space>
                  </div>
                  <div>
                    <Text>Angle: {gradientDeg}°</Text>
                    <Slider min={0} max={360} value={gradientDeg} onChange={setGradientDeg} />
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Preview & Code" bordered={false} className="inner-card">
                <div className="preview-box" style={{ background: gradient }} />
                <Input.TextArea
                  value={`background: ${gradient};`}
                  autoSize={{ minRows: 2 }}
                  style={{ marginTop: 16, fontFamily: 'monospace' }}
                  readOnly
                />
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  block
                  style={{ marginTop: 8 }}
                  onClick={() => handleCopy(`background: ${gradient};`)}
                >
                  Copy CSS
                </Button>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  const renderPaletteTab = () => (
    <div className="tab-content">
      <Space align="center" style={{ marginBottom: 24 }}>
        <Text strong>Base Color:</Text>
        <ColorPicker value={baseColor} onChange={setBaseColor} showText />
      </Space>

      <div className="palette-grid">
        {palette.map((color, index) => (
          <div key={index} className="palette-item">
            <div
              className="color-swatch"
              style={{ background: color }}
              onClick={() => handleCopy(color)}
            >
              <span className="copy-hint">Copy</span>
            </div>
            <Text code>{color}</Text>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContrastTab = () => {
    const rating = getContrastRating(contrastRatio);
    return (
      <div className="tab-content">
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <Card title="Colors" bordered={false} className="inner-card">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text>Text Color</Text>
                  <div style={{ marginTop: 8 }}>
                    <ColorPicker value={fgColor} onChange={setFgColor} showText />
                  </div>
                </div>
                <div>
                  <Text>Background Color</Text>
                  <div style={{ marginTop: 8 }}>
                    <ColorPicker value={bgColor} onChange={setBgColor} showText />
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card title="Result" bordered={false} className="inner-card">
              <div
                className="contrast-preview"
                style={{
                  background: toTiny(bgColor).toHexString(),
                  color: toTiny(fgColor).toHexString(),
                }}
              >
                <Title level={3} style={{ color: 'inherit', margin: 0 }}>
                  Aa
                </Title>
                <Text style={{ color: 'inherit' }}>
                  The quick brown fox jumps over the lazy dog.
                </Text>
              </div>

              <div className="contrast-stats">
                <div className="stat-item">
                  <Text type="secondary">Contrast Ratio</Text>
                  <div className="ratio-value">{contrastRatio.toFixed(2)}</div>
                </div>
                <div className="stat-item">
                  <Text type="secondary">Rating</Text>
                  <Tag color={rating.color} style={{ fontSize: 16, padding: '4px 12px' }}>
                    {rating.label}
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderImagePickerTab = () => (
    <div className="tab-content">
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={16}>
          <Card title="Image Source" bordered={false} className="inner-card">
            {!imageUrl ? (
              <Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
                className="custom-dragger"
                style={{ padding: '40px 0' }}
              >
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag image to this area to upload</p>
                <p className="ant-upload-hint">Support for a single upload.</p>
              </Dragger>
            ) : (
              <div
                className="image-preview-wrapper"
                style={{ position: 'relative', overflow: 'hidden', textAlign: 'center' }}
              >
                <canvas
                  ref={canvasRef}
                  onClick={handleImageClick}
                  style={{
                    maxWidth: '100%',
                    cursor: 'crosshair',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <div style={{ marginTop: 16 }}>
                  <Button danger icon={<DeleteOutlined />} onClick={handleClearImage}>
                    Remove Image
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Picked Color" bordered={false} className="inner-card">
            {pickedColor ? (
              <>
                <div className="preview-box" style={{ background: pickedColor }} />
                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                  <Input
                    addonBefore="HEX"
                    value={pickedColor}
                    suffix={<CopyOutlined onClick={() => handleCopy(pickedColor)} />}
                    readOnly
                  />
                  <Input
                    addonBefore="RGB"
                    value={toTiny(pickedColor).toRgbString()}
                    suffix={
                      <CopyOutlined onClick={() => handleCopy(toTiny(pickedColor).toRgbString())} />
                    }
                    readOnly
                  />
                  <Input
                    addonBefore="HSL"
                    value={toTiny(pickedColor).toHslString()}
                    suffix={
                      <CopyOutlined onClick={() => handleCopy(toTiny(pickedColor).toHslString())} />
                    }
                    readOnly
                  />
                </Space>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <BgColorsOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <p>Click on the image to pick a color</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div className="color-tool-container">
        <Card
          bordered={false}
          className="color-main-card"
          title={
            <div className="header-container">
              <Title level={3} style={{ margin: 0 }}>
                🎨 Color Studio
              </Title>
              <Text type="secondary">All-in-one color tools for developers & designers</Text>
            </div>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'picker',
                label: (
                  <span>
                    <BgColorsOutlined /> Picker & Gradient
                  </span>
                ),
                children: renderPickerTab(),
              },
              {
                key: 'palette',
                label: (
                  <span>
                    <AppstoreOutlined /> Palette Generator
                  </span>
                ),
                children: renderPaletteTab(),
              },
              {
                key: 'contrast',
                label: (
                  <span>
                    <EyeOutlined /> Contrast Checker
                  </span>
                ),
                children: renderContrastTab(),
              },
              {
                key: 'image',
                label: (
                  <span>
                    <FileImageOutlined /> Extract from Image
                  </span>
                ),
                children: renderImagePickerTab(),
              },
            ]}
          />
        </Card>
      </div>
      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ColorPickerPage;
