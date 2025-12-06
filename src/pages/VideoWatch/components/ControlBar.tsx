import { Button, Card, Input, Space, Typography } from 'antd';
import { ReloadOutlined, VideoCameraOutlined, WifiOutlined } from '@ant-design/icons';
import React from 'react';

const { Title } = Typography;

interface ControlBarProps {
  url: string;
  setUrl: (url: string) => void;
  onLoad: () => void;
  onReset: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({ url, setUrl, onLoad, onReset }) => {
  return (
    <Card bordered={false} className="control-bar">
      <Title level={4} style={{ marginTop: 0 }}>
        <VideoCameraOutlined /> Video Stream Analyzer
      </Title>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          size="large"
          placeholder="Enter stream URL (.m3u8 or .mpd)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          prefix={<WifiOutlined />}
        />
        <Button size="large" type="primary" onClick={onLoad}>
          Load
        </Button>
        <Button size="large" danger onClick={onReset} icon={<ReloadOutlined />}>
          Reset
        </Button>
      </Space.Compact>
    </Card>
  );
};

export default ControlBar;
