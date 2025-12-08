import {
  BgColorsOutlined,
  DownloadOutlined,
  LinkOutlined,
  QrcodeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Divider,
  Input,
  InputNumber,
  QRCode,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import React, { useRef, useState } from 'react';
import './styles.less';

const { Title, Text } = Typography;
const { TextArea } = Input;

const QRPage: React.FC = () => {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(300);
  const [iconSize, setIconSize] = useState(40);
  const [color, setColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [icon, setIcon] = useState<string>('');
  const [format, setFormat] = useState<'canvas' | 'svg'>('canvas');

  const qrContainerRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    try {
      const qrElement = qrContainerRef.current?.querySelector('canvas, svg');
      if (!qrElement) {
        message.error('QR code not found');
        return;
      }

      if (format === 'canvas' && qrElement instanceof HTMLCanvasElement) {
        const url = qrElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.png';
        a.click();
      } else if (format === 'svg' && qrElement instanceof SVGElement) {
        const svgData = new XMLSerializer().serializeToString(qrElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.svg';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback for when canvas is selected but rendered as svg or vice versa by antd
        // Antd QRCode component renders canvas by default unless type='svg' is passed
        message.warning('Please ensure the preview matches the download format.');
      }
      message.success('QR Code downloaded successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to download QR code');
    }
  };

  const handleColorChange = (value: Color, type: 'fg' | 'bg') => {
    const hex = value.toHexString();
    if (type === 'fg') setColor(hex);
    else setBgColor(hex);
  };

  return (
    <div className="qr-page-container">
      <Card className="qr-main-card" bordered={false}>
        <Row gutter={[48, 32]}>
          {/* Left Column: Controls */}
          <Col xs={24} lg={14} className="controls-column">
            <div className="header-section">
              <Title level={2} style={{ margin: 0 }}>
                <QrcodeOutlined /> QR Code Generator
              </Title>
              <Text type="secondary">
                Create custom QR codes with colors, logos, and high-resolution downloads.
              </Text>
            </div>

            <Tabs
              defaultActiveKey="content"
              items={[
                {
                  key: 'content',
                  label: 'Content',
                  children: (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Data / URL</Text>
                        <TextArea
                          rows={4}
                          placeholder="Enter text or URL to encode..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="custom-textarea"
                          maxLength={500}
                          showCount
                        />
                      </div>

                      <div>
                        <Text strong>Logo URL (Optional)</Text>
                        <Input
                          prefix={<LinkOutlined />}
                          placeholder="https://example.com/logo.png"
                          value={icon}
                          onChange={(e) => setIcon(e.target.value)}
                          allowClear
                        />
                      </div>
                    </Space>
                  ),
                },
                {
                  key: 'style',
                  label: 'Style & Settings',
                  children: (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Row gutter={[24, 24]}>
                        <Col span={12}>
                          <Text strong>Foreground Color</Text>
                          <div className="color-picker-wrapper">
                            <ColorPicker
                              value={color}
                              onChange={(v) => handleColorChange(v, 'fg')}
                              showText
                            />
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text strong>Background Color</Text>
                          <div className="color-picker-wrapper">
                            <ColorPicker
                              value={bgColor}
                              onChange={(v) => handleColorChange(v, 'bg')}
                              showText
                            />
                          </div>
                        </Col>
                      </Row>

                      <div>
                        <Text strong>Error Correction Level</Text>
                        <Segmented
                          block
                          options={[
                            { label: 'Low (7%)', value: 'L' },
                            { label: 'Medium (15%)', value: 'M' },
                            { label: 'Quartile (25%)', value: 'Q' },
                            { label: 'High (30%)', value: 'H' },
                          ]}
                          value={errorLevel}
                          onChange={(val) => setErrorLevel(val as any)}
                        />
                      </div>

                      <div>
                        <Row justify="space-between">
                          <Text strong>Size (px)</Text>
                          <Text type="secondary">{size}px</Text>
                        </Row>
                        <Slider min={128} max={1024} step={16} value={size} onChange={setSize} />
                      </div>

                      {icon && (
                        <div>
                          <Row justify="space-between">
                            <Text strong>Icon Size</Text>
                            <Text type="secondary">{iconSize}px</Text>
                          </Row>
                          <Slider min={20} max={size / 3} value={iconSize} onChange={setIconSize} />
                        </div>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          </Col>

          {/* Right Column: Preview */}
          <Col xs={24} lg={10} className="preview-column">
            <div className="preview-card">
              <div className="preview-header">
                <Text strong>
                  <SettingOutlined /> Live Preview
                </Text>
              </div>

              <div className="qr-wrapper" ref={qrContainerRef}>
                <QRCode
                  value={text || 'https://example.com'}
                  size={size} // Display size is controlled by CSS max-width, but actual render size is this
                  icon={icon}
                  iconSize={iconSize}
                  color={color}
                  bgColor={bgColor}
                  errorLevel={errorLevel}
                  type={format}
                  bordered={false}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="format-selector">
                  <Text strong style={{ marginRight: 12 }}>
                    Format:
                  </Text>
                  <Segmented
                    options={[
                      { label: 'PNG (Image)', value: 'canvas' },
                      { label: 'SVG (Vector)', value: 'svg' },
                    ]}
                    value={format}
                    onChange={(val) => setFormat(val as any)}
                  />
                </div>

                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={downloadQRCode}
                  block
                  className="download-btn"
                >
                  Download QR Code
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default QRPage;
