import React, { useState } from 'react';
import { Card, InputNumber, Upload, Button, Space, Input } from 'antd';
import QRCode from 'qrcode.react';

const QRPage: React.FC = () => {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [logoUrl, setLogoUrl] = useState('');

  return (
    <Card title="QR Generator">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} />
        <InputNumber value={size} onChange={(v) => setSize(Number(v))} />
        <Input
          placeholder="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
        <div>
          <QRCode value={text} size={size} includeMargin={true} />
          {/* To render logo over QR, you'll need to draw on canvas — starter only shows plain QR */}
        </div>
      </Space>
    </Card>
  );
};

export default QRPage;
