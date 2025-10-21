import { Button, Card, Input, InputNumber, message, QRCode, Select, Slider, Space } from 'antd';
import React, { useRef, useState } from 'react';
import './styles.less';

const { Option } = Select;

const QRPage: React.FC = () => {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [format, setFormat] = useState<'canvas' | 'svg'>('svg');
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleSizeChange = (value: number | null) => {
    if (value) setSize(value);
  };

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
        message.error('Invalid format or QR not ready');
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to download QR code');
    }
  };

  return (
    <Card title="QR Generator" className="qr-card">
      <Space direction="vertical" className="qr-container" size="middle">
        {/* Text Input */}
        <Input placeholder="Text or URL" value={text} onChange={(e) => setText(e.target.value)} />

        {/* Size Control */}
        <div className="qr-size-control">
          <div className="qr-size-label">Size: {size}px</div>
          <Space.Compact className="qr-size-slider">
            <Slider
              style={{ width: 100 }}
              min={64}
              max={1024}
              value={size}
              onChange={handleSizeChange}
            />
            <InputNumber min={64} max={1024} value={size} onChange={handleSizeChange} />
          </Space.Compact>
        </div>

        {/* Format Selector */}
        <Select value={format} onChange={setFormat} style={{ width: '100%' }}>
          <Option value="png">PNG</Option>
          <Option value="svg">SVG</Option>
        </Select>

        {/* Download Button */}
        <Button type="primary" onClick={downloadQRCode} block>
          Download {format.toUpperCase()}
        </Button>

        {/* QR Code Display */}
        <div ref={qrContainerRef} className="qr-display">
          <QRCode value={text || '-'} size={size} errorLevel="H" type={format} bordered={false} />
        </div>
      </Space>
    </Card>
  );
};

export default QRPage;
