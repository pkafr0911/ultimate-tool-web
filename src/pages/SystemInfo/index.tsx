import { PageContainer } from '@ant-design/pro-components';
import {
  Badge,
  Card,
  Col,
  Collapse,
  Descriptions,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DesktopOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LaptopOutlined,
  MobileOutlined,
  ReloadOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import './styles.less';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// ─── Helper ────────────────────────────────────────────────────────────────
const supported = (flag: boolean) =>
  flag ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      Supported
    </Tag>
  ) : (
    <Tag icon={<CloseCircleOutlined />} color="error">
      Not Supported
    </Tag>
  );

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

// ─── Data Collectors ───────────────────────────────────────────────────────
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  return {
    userAgent: ua,
    language: navigator.language,
    languages: navigator.languages?.join(', ') ?? navigator.language,
    platform: (navigator as any).userAgentData?.platform ?? navigator.platform,
    vendor: navigator.vendor || 'N/A',
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack ?? 'N/A',
    onLine: navigator.onLine,
    maxTouchPoints: navigator.maxTouchPoints,
    pdfViewerEnabled: (navigator as any).pdfViewerEnabled ?? 'N/A',
    hardwareConcurrency: navigator.hardwareConcurrency ?? 'N/A',
    deviceMemory: (navigator as any).deviceMemory ?? 'N/A',
  };
};

const getScreenInfo = () => {
  const s = window.screen;
  return {
    screenResolution: `${s.width} × ${s.height}`,
    availableResolution: `${s.availWidth} × ${s.availHeight}`,
    colorDepth: `${s.colorDepth}-bit`,
    pixelDepth: `${s.pixelDepth}-bit`,
    devicePixelRatio: window.devicePixelRatio,
    viewportSize: `${window.innerWidth} × ${window.innerHeight}`,
    orientation: screen.orientation?.type ?? 'N/A',
  };
};

const getConnectionInfo = () => {
  const conn = (navigator as any).connection;
  if (!conn) return null;
  return {
    effectiveType: conn.effectiveType ?? 'N/A',
    downlink: conn.downlink != null ? `${conn.downlink} Mbps` : 'N/A',
    rtt: conn.rtt != null ? `${conn.rtt} ms` : 'N/A',
    saveData: conn.saveData ? 'Yes' : 'No',
    type: conn.type ?? 'N/A',
  };
};

const getMediaCapabilities = () => ({
  getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices),
  mediaRecorder: typeof (window as any).MediaRecorder !== 'undefined',
  webAudio:
    typeof (window as any).AudioContext !== 'undefined' ||
    typeof (window as any).webkitAudioContext !== 'undefined',
  speechSynthesis: typeof window.speechSynthesis !== 'undefined',
  speechRecognition:
    typeof (window as any).SpeechRecognition !== 'undefined' ||
    typeof (window as any).webkitSpeechRecognition !== 'undefined',
});

const getStorageEstimate = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return {
      quota: est.quota ?? 0,
      usage: est.usage ?? 0,
    };
  }
  return null;
};

const getFeatureSupport = () => ({
  serviceWorker: 'serviceWorker' in navigator,
  webWorker: typeof Worker !== 'undefined',
  sharedWorker: typeof SharedWorker !== 'undefined',
  webSocket: typeof WebSocket !== 'undefined',
  webGL: (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  })(),
  webGL2: (() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2');
    } catch {
      return false;
    }
  })(),
  webGPU: 'gpu' in navigator,
  webRTC: !!(window as any).RTCPeerConnection,
  webAssembly: typeof WebAssembly !== 'undefined',
  indexedDB: typeof indexedDB !== 'undefined',
  localStorage: (() => {
    try {
      localStorage.setItem('_test', '1');
      localStorage.removeItem('_test');
      return true;
    } catch {
      return false;
    }
  })(),
  sessionStorage: (() => {
    try {
      sessionStorage.setItem('_test', '1');
      sessionStorage.removeItem('_test');
      return true;
    } catch {
      return false;
    }
  })(),
  notifications: 'Notification' in window,
  push: 'PushManager' in window,
  geolocation: 'geolocation' in navigator,
  bluetooth: 'bluetooth' in navigator,
  usb: 'usb' in navigator,
  serial: 'serial' in navigator,
  hid: 'hid' in navigator,
  nfc: 'NDEFReader' in window,
  vibration: 'vibrate' in navigator,
  clipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
  share: 'share' in navigator,
  wakeLock: 'wakeLock' in navigator,
  gamepad: 'getGamepads' in navigator,
  midi: 'requestMIDIAccess' in navigator,
  payment: 'PaymentRequest' in window,
  credentials: 'credentials' in navigator,
  intersectionObserver: 'IntersectionObserver' in window,
  resizeObserver: 'ResizeObserver' in window,
  mutationObserver: 'MutationObserver' in window,
  performanceObserver: 'PerformanceObserver' in window,
  broadcastChannel: 'BroadcastChannel' in window,
  offscreenCanvas: 'OffscreenCanvas' in window,
});

const getGPUInfo = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'N/A', renderer: 'N/A' };
    return {
      vendor: (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  } catch {
    return null;
  }
};

// ─── Component ─────────────────────────────────────────────────────────────
const SystemInfoPage: React.FC = () => {
  const [browserInfo] = useState(getBrowserInfo);
  const [screenInfo] = useState(getScreenInfo);
  const [connectionInfo] = useState(getConnectionInfo);
  const [mediaInfo] = useState(getMediaCapabilities);
  const [features] = useState(getFeatureSupport);
  const [gpuInfo] = useState(getGPUInfo);
  const [storageInfo, setStorageInfo] = useState<{ quota: number; usage: number } | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [permissionStatuses, setPermissionStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    // Storage estimate
    getStorageEstimate().then((info) => {
      if (info) setStorageInfo(info);
    });

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBatteryInfo({
          charging: bat.charging,
          level: Math.round(bat.level * 100),
          chargingTime: bat.chargingTime === Infinity ? '∞' : `${bat.chargingTime}s`,
          dischargingTime: bat.dischargingTime === Infinity ? '∞' : `${bat.dischargingTime}s`,
        });
      });
    }

    // Permission statuses
    const permNames = [
      'geolocation',
      'notifications',
      'camera',
      'microphone',
      'clipboard-read',
      'clipboard-write',
    ];
    Promise.allSettled(
      permNames.map((name) =>
        navigator.permissions
          .query({ name: name as PermissionName })
          .then((result) => ({ name, state: result.state })),
      ),
    ).then((results) => {
      const statuses: Record<string, string> = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          statuses[r.value.name] = r.value.state;
        }
      });
      setPermissionStatuses(statuses);
    });
  }, []);

  // Feature support table data
  const featureRows = Object.entries(features).map(([key, val]) => ({
    key,
    feature: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    supported: val,
  }));

  const featureColumns = [
    {
      title: 'Feature / API',
      dataIndex: 'feature',
      key: 'feature',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'supported',
      key: 'supported',
      width: 160,
      render: (val: boolean) => supported(val),
    },
  ];

  const permissionColor = (state: string) => {
    if (state === 'granted') return 'success';
    if (state === 'denied') return 'error';
    return 'warning';
  };

  return (
    <PageContainer>
      <div className="system-info-page">
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          <InfoCircleOutlined /> This page displays what the browser APIs expose about your device,
          network, and capabilities. <Text strong>No data is collected or sent anywhere.</Text>
        </Paragraph>

        <Row gutter={[16, 16]}>
          {/* ── Browser Info ───────────────────────────────── */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <GlobalOutlined /> Browser &amp; Navigator
                </Space>
              }
              className="info-card"
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="User Agent">
                  <Text copyable style={{ fontSize: 12, wordBreak: 'break-all' }}>
                    {browserInfo.userAgent}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Language">{browserInfo.language}</Descriptions.Item>
                <Descriptions.Item label="All Languages">{browserInfo.languages}</Descriptions.Item>
                <Descriptions.Item label="Platform">{browserInfo.platform}</Descriptions.Item>
                <Descriptions.Item label="Vendor">{browserInfo.vendor}</Descriptions.Item>
                <Descriptions.Item label="Cookies Enabled">
                  {supported(browserInfo.cookiesEnabled)}
                </Descriptions.Item>
                <Descriptions.Item label="Do Not Track">
                  {String(browserInfo.doNotTrack)}
                </Descriptions.Item>
                <Descriptions.Item label="Online Status">
                  {browserInfo.onLine ? (
                    <Badge status="success" text="Online" />
                  ) : (
                    <Badge status="error" text="Offline" />
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Max Touch Points">
                  {browserInfo.maxTouchPoints}
                </Descriptions.Item>
                <Descriptions.Item label="CPU Cores (logical)">
                  {String(browserInfo.hardwareConcurrency)}
                </Descriptions.Item>
                <Descriptions.Item label="Device Memory">
                  {browserInfo.deviceMemory !== 'N/A' ? `~${browserInfo.deviceMemory} GB` : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* ── Screen & Display ──────────────────────────── */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DesktopOutlined /> Screen &amp; Display
                </Space>
              }
              className="info-card"
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Screen Resolution">
                  {screenInfo.screenResolution}
                </Descriptions.Item>
                <Descriptions.Item label="Available Resolution">
                  {screenInfo.availableResolution}
                </Descriptions.Item>
                <Descriptions.Item label="Viewport Size">
                  {screenInfo.viewportSize}
                </Descriptions.Item>
                <Descriptions.Item label="Device Pixel Ratio">
                  {screenInfo.devicePixelRatio}x
                </Descriptions.Item>
                <Descriptions.Item label="Color Depth">{screenInfo.colorDepth}</Descriptions.Item>
                <Descriptions.Item label="Pixel Depth">{screenInfo.pixelDepth}</Descriptions.Item>
                <Descriptions.Item label="Orientation">{screenInfo.orientation}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* ── GPU Info ──────────────────────────────────── */}
          {gpuInfo && (
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <LaptopOutlined /> GPU (WebGL)
                  </Space>
                }
                className="info-card"
              >
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Vendor">{gpuInfo.vendor}</Descriptions.Item>
                  <Descriptions.Item label="Renderer">
                    <Text style={{ wordBreak: 'break-all' }}>{gpuInfo.renderer}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          )}

          {/* ── Network ──────────────────────────────────── */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <WifiOutlined /> Network Connection
                </Space>
              }
              className="info-card"
            >
              {connectionInfo ? (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Effective Type">
                    <Tag color="blue">{connectionInfo.effectiveType}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Downlink">{connectionInfo.downlink}</Descriptions.Item>
                  <Descriptions.Item label="RTT (Round-Trip Time)">
                    {connectionInfo.rtt}
                  </Descriptions.Item>
                  <Descriptions.Item label="Data Saver">
                    {connectionInfo.saveData}
                  </Descriptions.Item>
                  <Descriptions.Item label="Connection Type">
                    {connectionInfo.type}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">Network Information API not available in this browser.</Text>
              )}
            </Card>
          </Col>

          {/* ── Battery ──────────────────────────────────── */}
          {batteryInfo && (
            <Col xs={24} lg={12}>
              <Card title="🔋 Battery" className="info-card">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Progress
                    percent={batteryInfo.level}
                    status={batteryInfo.level <= 20 ? 'exception' : 'active'}
                    strokeColor={
                      batteryInfo.level > 50
                        ? '#52c41a'
                        : batteryInfo.level > 20
                          ? '#faad14'
                          : '#ff4d4f'
                    }
                  />
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Charging">
                      {batteryInfo.charging ? (
                        <Tag color="green">Yes</Tag>
                      ) : (
                        <Tag color="orange">No</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Charging Time">
                      {batteryInfo.chargingTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="Discharging Time">
                      {batteryInfo.dischargingTime}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>
            </Col>
          )}

          {/* ── Storage ──────────────────────────────────── */}
          {storageInfo && (
            <Col xs={24} lg={12}>
              <Card title="💾 Storage Estimate" className="info-card">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Progress
                    percent={
                      storageInfo.quota
                        ? Math.round((storageInfo.usage / storageInfo.quota) * 100 * 100) / 100
                        : 0
                    }
                    status="active"
                  />
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Usage">
                      {formatBytes(storageInfo.usage)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quota">
                      {formatBytes(storageInfo.quota)}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>
            </Col>
          )}

          {/* ── Media Capabilities ────────────────────────── */}
          <Col xs={24} lg={12}>
            <Card title="🎤 Media Capabilities" className="info-card">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="getUserMedia (Camera/Mic)">
                  {supported(mediaInfo.getUserMedia)}
                </Descriptions.Item>
                <Descriptions.Item label="Enumerate Devices">
                  {supported(mediaInfo.enumerateDevices)}
                </Descriptions.Item>
                <Descriptions.Item label="MediaRecorder">
                  {supported(mediaInfo.mediaRecorder)}
                </Descriptions.Item>
                <Descriptions.Item label="Web Audio API">
                  {supported(mediaInfo.webAudio)}
                </Descriptions.Item>
                <Descriptions.Item label="Speech Synthesis">
                  {supported(mediaInfo.speechSynthesis)}
                </Descriptions.Item>
                <Descriptions.Item label="Speech Recognition">
                  {supported(mediaInfo.speechRecognition)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* ── Permissions ───────────────────────────────── */}
          {Object.keys(permissionStatuses).length > 0 && (
            <Col xs={24} lg={12}>
              <Card title="🔐 Permission Statuses" className="info-card">
                <Descriptions column={1} size="small" bordered>
                  {Object.entries(permissionStatuses).map(([name, state]) => (
                    <Descriptions.Item
                      key={name}
                      label={name.replace(/-/g, ' ').replace(/^./, (s) => s.toUpperCase())}
                    >
                      <Tag color={permissionColor(state)}>{state}</Tag>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            </Col>
          )}

          {/* ── Full Feature / API Support Table ──────────── */}
          <Col xs={24}>
            <Card title="🧩 Browser API Support" className="info-card">
              <Table
                dataSource={featureRows}
                columns={featureColumns}
                pagination={false}
                size="small"
                scroll={{ y: 500 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default SystemInfoPage;
