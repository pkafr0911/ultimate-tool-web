import { Button, Card, Input, Space, Switch, Typography } from 'antd';
import { ReloadOutlined, VideoCameraOutlined, WifiOutlined } from '@ant-design/icons';
import React from 'react';

const { Title, Text } = Typography;

interface ControlBarProps {
  url: string;
  setUrl: (url: string) => void;
  onLoad: () => void;
  onReset: () => void;
  enableCustomControls: boolean;
  setEnableCustomControls: (enable: boolean) => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  url,
  setUrl,
  onLoad,
  onReset,
  enableCustomControls,
  setEnableCustomControls,
}) => {
  return (
    <Card bordered={false} className="control-bar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ marginTop: 0 }}>
          <VideoCameraOutlined /> Video Stream Analyzer
        </Title>
        <Space>
          <Text>Custom Controls</Text>
          <Switch checked={enableCustomControls} onChange={setEnableCustomControls} />
        </Space>
      </div>
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
