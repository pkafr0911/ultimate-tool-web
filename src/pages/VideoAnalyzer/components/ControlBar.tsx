import { Button, Card, Col, Input, Row, Select, Space, Switch, Typography } from 'antd';
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
  drmEnabled: boolean;
  setDrmEnabled: (enable: boolean) => void;
  drmSystem: string;
  setDrmSystem: (system: string) => void;
  licenseUrl: string;
  setLicenseUrl: (url: string) => void;
  drmHeaders: string;
  setDrmHeaders: (headers: string) => void;
  useProxy: boolean;
  setUseProxy: (use: boolean) => void;
  proxyUrl: string;
  setProxyUrl: (url: string) => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  url,
  setUrl,
  onLoad,
  onReset,
  enableCustomControls,
  setEnableCustomControls,
  drmEnabled,
  setDrmEnabled,
  drmSystem,
  setDrmSystem,
  licenseUrl,
  setLicenseUrl,
  drmHeaders,
  setDrmHeaders,
  useProxy,
  setUseProxy,
  proxyUrl,
  setProxyUrl,
}) => {
  return (
    <Card bordered={false} className="control-bar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          <VideoCameraOutlined /> Video Stream Analyzer
        </Title>
        <Space wrap>
          <Space>
            <Text>Custom Controls</Text>
            <Switch checked={enableCustomControls} onChange={setEnableCustomControls} />
          </Space>
          <Space style={{ marginLeft: 16 }}>
            <Text>DRM Decryption</Text>
            <Switch checked={drmEnabled} onChange={setDrmEnabled} />
          </Space>
          <Space style={{ marginLeft: 16 }}>
            <Text>CORS Proxy</Text>
            <Switch checked={useProxy} onChange={setUseProxy} />
          </Space>
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

      {useProxy && (
        <div style={{ marginTop: 12 }}>
          <Input
            placeholder="Proxy URL prefix (e.g. https://cors-anywhere.herokuapp.com/ or http://localhost:8010/)"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            addonBefore="Proxy URL"
          />
        </div>
      )}

      {drmEnabled && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #f0f0f0' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <Text strong>DRM System</Text>
              <Select
                value={drmSystem}
                onChange={setDrmSystem}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { label: 'Widevine', value: 'com.widevine.alpha' },
                  { label: 'PlayReady', value: 'com.microsoft.playready' },
                  { label: 'ClearKey', value: 'org.w3.clearkey' },
                ]}
              />
            </Col>
            <Col xs={24} sm={10}>
              <Text strong>License Server URL</Text>
              <Input
                placeholder="Enter license server URL"
                value={licenseUrl}
                onChange={(e) => setLicenseUrl(e.target.value)}
                style={{ width: '100%', marginTop: 8 }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Text strong>Custom Headers (JSON)</Text>
              <Input
                placeholder='e.g. {"Authorization": "Bearer Token"}'
                value={drmHeaders}
                onChange={(e) => setDrmHeaders(e.target.value)}
                style={{ width: '100%', marginTop: 8 }}
              />
            </Col>
          </Row>
        </div>
      )}
    </Card>
  );
};

export default ControlBar;
