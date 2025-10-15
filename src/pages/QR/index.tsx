import React, { useState, useRef } from 'react';
import { Card, InputNumber, Button, Space, Input, Select, Slider, message } from 'antd';
import QRCode from 'qrcode.react';

const { Option } = Select;

const QRPage: React.FC = () => {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [format, setFormat] = useState<'png' | 'svg'>('svg');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSizeChange = (value: number | null) => {
    if (value) setSize(value);
  };

  const downloadQRCode = () => {
    try {
      if (format === 'png' && canvasRef.current) {
        const url = canvasRef.current.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.png';
        a.click();
      } else if (format === 'svg' && svgRef.current) {
        const svg = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.svg';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        message.error('QR code not available');
      }
    } catch (err) {
      message.error('Failed to download QR code');
    }
  };

  return (
    <Card title="QR Generator" style={{ width: '100%' }}>
      <Space
        direction="vertical"
        style={{ maxWidth: 400, textAlign: 'center', display: 'flex' }}
        size="middle"
      >
        {/* Text Input */}
        <Input placeholder="Text or URL" value={text} onChange={(e) => setText(e.target.value)} />

        {/* Size Control: Slider + InputNumber */}
        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>Size: {size}px</div>
          <Space.Compact style={{ width: '100%' }}>
            <Slider
              min={64}
              max={1024}
              value={size}
              onChange={handleSizeChange}
              style={{ flex: 1 }}
            />
            <InputNumber
              min={64}
              max={1024}
              value={size}
              onChange={handleSizeChange}
              style={{ width: 100 }}
            />
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
        <div style={{ marginTop: 12 }}>
          {format === 'png' ? (
            <QRCode ref={canvasRef} value={text} size={size} includeMargin renderAs="canvas" />
          ) : (
            <QRCode ref={svgRef} value={text} size={size} includeMargin renderAs="svg" />
          )}
        </div>
      </Space>
    </Card>
  );
};

export default QRPage;
