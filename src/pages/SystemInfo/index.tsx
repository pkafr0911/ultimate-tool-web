import {
  ApiOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleFilled,
  CloseCircleOutlined,
  CopyOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LaptopOutlined,
  MobileOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Descriptions,
  Empty,
  Input,
  Progress,
  Segmented,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import './styles.less';

const { Title, Text, Paragraph } = Typography;

// ─── Helpers ───────────────────────────────────────────────────────────────
const supported = (flag: boolean) =>
  flag ? (
    <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
      Supported
    </Tag>
  ) : (
    <Tag icon={<CloseCircleOutlined />} color="error" style={{ margin: 0 }}>
      Not Supported
    </Tag>
  );

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const detectDeviceKind = (ua: string, maxTouch: number) => {
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return { kind: 'Tablet', icon: <LaptopOutlined /> };
  if (/mobi|iphone|android.*mobile/.test(u)) return { kind: 'Mobile', icon: <MobileOutlined /> };
  if (maxTouch > 0 && /android/.test(u)) return { kind: 'Mobile', icon: <MobileOutlined /> };
  return { kind: 'Desktop', icon: <DesktopOutlined /> };
};

const detectBrowser = (ua: string) => {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/chrome/i.test(ua) && !/edg\//i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return 'Unknown';
};

const detectOS = (ua: string) => {
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
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
    return { quota: est.quota ?? 0, usage: est.usage ?? 0 };
  }
  return null;
};

const FEATURE_GROUPS: Record<string, string[]> = {
  'Workers & Communication': [
    'serviceWorker',
    'webWorker',
    'sharedWorker',
    'webSocket',
    'broadcastChannel',
  ],
  Graphics: ['webGL', 'webGL2', 'webGPU', 'offscreenCanvas'],
  Compute: ['webAssembly'],
  Storage: ['indexedDB', 'localStorage', 'sessionStorage'],
  'Notifications & Push': ['notifications', 'push'],
  'Hardware & Sensors': [
    'geolocation',
    'bluetooth',
    'usb',
    'serial',
    'hid',
    'nfc',
    'vibration',
    'gamepad',
    'midi',
  ],
  'Realtime & Media': ['webRTC'],
  'User Interaction': ['clipboard', 'share', 'wakeLock'],
  Payments: ['payment', 'credentials'],
  Observers: ['intersectionObserver', 'resizeObserver', 'mutationObserver', 'performanceObserver'],
};

const FEATURE_LABELS: Record<string, string> = {
  serviceWorker: 'Service Worker',
  webWorker: 'Web Worker',
  sharedWorker: 'Shared Worker',
  webSocket: 'WebSocket',
  broadcastChannel: 'Broadcast Channel',
  webGL: 'WebGL',
  webGL2: 'WebGL 2',
  webGPU: 'WebGPU',
  offscreenCanvas: 'OffscreenCanvas',
  webAssembly: 'WebAssembly',
  indexedDB: 'IndexedDB',
  localStorage: 'localStorage',
  sessionStorage: 'sessionStorage',
  notifications: 'Notifications',
  push: 'Push Manager',
  geolocation: 'Geolocation',
  bluetooth: 'Web Bluetooth',
  usb: 'WebUSB',
  serial: 'Web Serial',
  hid: 'WebHID',
  nfc: 'Web NFC',
  vibration: 'Vibration',
  gamepad: 'Gamepad',
  midi: 'Web MIDI',
  webRTC: 'WebRTC',
  clipboard: 'Clipboard API',
  share: 'Web Share',
  wakeLock: 'Wake Lock',
  payment: 'Payment Request',
  credentials: 'Credential Mgmt',
  intersectionObserver: 'IntersectionObserver',
  resizeObserver: 'ResizeObserver',
  mutationObserver: 'MutationObserver',
  performanceObserver: 'PerformanceObserver',
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
  const [browserInfo, setBrowserInfo] = useState(getBrowserInfo);
  const [screenInfo, setScreenInfo] = useState(getScreenInfo);
  const [connectionInfo, setConnectionInfo] = useState(getConnectionInfo);
  const [mediaInfo] = useState(getMediaCapabilities);
  const [features] = useState(getFeatureSupport);
  const [gpuInfo] = useState(getGPUInfo);
  const [storageInfo, setStorageInfo] = useState<{ quota: number; usage: number } | null>(null);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [permissionStatuses, setPermissionStatuses] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'supported' | 'missing'>('all');

  const loadAll = () => {
    setBrowserInfo(getBrowserInfo());
    setScreenInfo(getScreenInfo());
    setConnectionInfo(getConnectionInfo());
    getStorageEstimate().then((info) => info && setStorageInfo(info));
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
        if (r.status === 'fulfilled') statuses[r.value.name] = r.value.state;
      });
      setPermissionStatuses(statuses);
    });
  };

  useEffect(() => {
    loadAll();
    const onResize = () => setScreenInfo(getScreenInfo());
    const onOnline = () => setBrowserInfo(getBrowserInfo());
    window.addEventListener('resize', onResize);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featureEntries = Object.entries(features);
  const supportedCount = featureEntries.filter(([, v]) => v).length;
  const totalFeatures = featureEntries.length;
  const supportRatio = Math.round((supportedCount / totalFeatures) * 100);

  const device = detectDeviceKind(browserInfo.userAgent, browserInfo.maxTouchPoints);
  const browserName = detectBrowser(browserInfo.userAgent);
  const osName = detectOS(browserInfo.userAgent);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(FEATURE_GROUPS)
      .map(([group, keys]) => {
        const items = keys
          .filter((k) => k in features)
          .filter((k) => {
            const ok = (features as any)[k];
            if (filter === 'supported' && !ok) return false;
            if (filter === 'missing' && ok) return false;
            if (!q) return true;
            return FEATURE_LABELS[k]?.toLowerCase().includes(q) || k.toLowerCase().includes(q);
          });
        return { group, items };
      })
      .filter((g) => g.items.length > 0);
  }, [features, search, filter]);

  const featureRows = featureEntries.map(([key, val]) => ({
    key,
    feature:
      FEATURE_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
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

  const copyReport = async () => {
    const lines: string[] = [];
    lines.push('# System Info Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Device');
    lines.push(`- Device: ${device.kind}`);
    lines.push(`- Browser: ${browserName}`);
    lines.push(`- OS: ${osName}`);
    lines.push(`- User Agent: ${browserInfo.userAgent}`);
    lines.push('');
    lines.push('## Screen');
    Object.entries(screenInfo).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
    lines.push('');
    if (gpuInfo) {
      lines.push('## GPU');
      lines.push(`- Vendor: ${gpuInfo.vendor}`);
      lines.push(`- Renderer: ${gpuInfo.renderer}`);
      lines.push('');
    }
    if (connectionInfo) {
      lines.push('## Network');
      Object.entries(connectionInfo).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
      lines.push('');
    }
    lines.push('## API Support');
    featureEntries.forEach(([k, v]) => {
      lines.push(`- ${FEATURE_LABELS[k] || k}: ${v ? '✓' : '✗'}`);
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('Report copied to clipboard');
    } catch {
      message.error('Clipboard not available');
    }
  };

  const ghostButtonStyle = {
    background: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
  };

  const storagePct = storageInfo?.quota
    ? Math.min(100, Math.round((storageInfo.usage / storageInfo.quota) * 100 * 100) / 100)
    : 0;

  return (
    <div className="container systemInfoPage">
      <div className="shell">
        {/* === Hero === */}
        <div className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <DashboardOutlined />
              </span>
              <div>
                <span className="heroEyebrow">System Info</span>
                <Title level={4} style={{ color: '#fff', margin: '4px 0 0', lineHeight: 1.25 }}>
                  Inspect your device, browser & web platform capabilities
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Everything browser APIs reveal — collected locally, never sent anywhere.
                </Text>
              </div>
              <span
                className={`heroStatus heroStatus-${browserInfo.onLine ? 'online' : 'offline'}`}
              >
                <span className="heroStatusDot" />
                {browserInfo.onLine ? 'Online' : 'Offline'}
              </span>
            </div>
            <Space className="heroActions" wrap>
              <Button
                className="primaryAction"
                size="large"
                icon={<CopyOutlined />}
                onClick={copyReport}
              >
                Copy Report
              </Button>
              <Tooltip title="Refresh values">
                <Button icon={<ReloadOutlined />} onClick={loadAll} style={ghostButtonStyle}>
                  Refresh
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>

        {/* === Stat strip === */}
        <div className="statStrip">
          <div className="statChip">
            <span className="statIcon">{device.icon}</span>
            <div className="statBody">
              <span className="statLabel">Device</span>
              <span className="statValue">
                {device.kind}
                <span className="statSub">
                  {' '}
                  · {browserName} on {osName}
                </span>
              </span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <DesktopOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Viewport</span>
              <span className="statValue">
                {screenInfo.viewportSize}
                <span className="statSub"> · {screenInfo.devicePixelRatio}× DPR</span>
              </span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <ThunderboltOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">CPU / RAM</span>
              <span className="statValue">
                {String(browserInfo.hardwareConcurrency)} cores
                {browserInfo.deviceMemory !== 'N/A' && (
                  <span className="statSub"> · ~{String(browserInfo.deviceMemory)} GB</span>
                )}
              </span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <WifiOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Network</span>
              <span className="statValue">
                {connectionInfo?.effectiveType ?? 'N/A'}
                {connectionInfo?.downlink && (
                  <span className="statSub"> · {connectionInfo.downlink}</span>
                )}
              </span>
            </div>
          </div>
          {batteryInfo && (
            <div
              className={`statChip ${
                batteryInfo.level <= 20 ? 'danger' : batteryInfo.level > 50 ? 'success' : ''
              }`}
            >
              <span className="statIcon">🔋</span>
              <div className="statBody">
                <span className="statLabel">Battery</span>
                <span className="statValue">
                  {batteryInfo.level}%
                  <span className="statSub">
                    {' '}
                    · {batteryInfo.charging ? 'charging' : 'on battery'}
                  </span>
                </span>
              </div>
            </div>
          )}
          <div
            className={`statChip ${
              supportRatio >= 80 ? 'success' : supportRatio < 50 ? 'danger' : ''
            }`}
          >
            <span className="statIcon">
              <ApiOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">API Support</span>
              <span className="statValue">
                {supportedCount}/{totalFeatures}
                <span className="statSub"> · {supportRatio}%</span>
              </span>
            </div>
          </div>
        </div>

        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <InfoCircleOutlined /> Overview
                </span>
              ),
              children: (
                <div className="tabBody">
                  <div className="overviewGrid">
                    <div className="panel">
                      <div className="panelHeader">
                        <span className="panelTitle">
                          <GlobalOutlined /> Browser & Navigator
                        </span>
                      </div>
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="User Agent">
                          <Text copyable style={{ fontSize: 12, wordBreak: 'break-all' }}>
                            {browserInfo.userAgent}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Language">
                          {browserInfo.language}
                        </Descriptions.Item>
                        <Descriptions.Item label="All Languages">
                          {browserInfo.languages}
                        </Descriptions.Item>
                        <Descriptions.Item label="Platform">
                          {browserInfo.platform}
                        </Descriptions.Item>
                        <Descriptions.Item label="Vendor">{browserInfo.vendor}</Descriptions.Item>
                        <Descriptions.Item label="Cookies Enabled">
                          {supported(browserInfo.cookiesEnabled)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Do Not Track">
                          {String(browserInfo.doNotTrack)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Online">
                          {browserInfo.onLine ? (
                            <Badge status="success" text="Online" />
                          ) : (
                            <Badge status="error" text="Offline" />
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Touch Points">
                          {browserInfo.maxTouchPoints}
                        </Descriptions.Item>
                        <Descriptions.Item label="CPU Cores">
                          {String(browserInfo.hardwareConcurrency)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Device Memory">
                          {browserInfo.deviceMemory !== 'N/A'
                            ? `~${browserInfo.deviceMemory} GB`
                            : 'N/A'}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div className="panel">
                      <div className="panelHeader">
                        <span className="panelTitle">
                          <DesktopOutlined /> Screen & Display
                        </span>
                      </div>
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Screen Resolution">
                          {screenInfo.screenResolution}
                        </Descriptions.Item>
                        <Descriptions.Item label="Available Resolution">
                          {screenInfo.availableResolution}
                        </Descriptions.Item>
                        <Descriptions.Item label="Viewport">
                          {screenInfo.viewportSize}
                        </Descriptions.Item>
                        <Descriptions.Item label="Device Pixel Ratio">
                          {screenInfo.devicePixelRatio}x
                        </Descriptions.Item>
                        <Descriptions.Item label="Color Depth">
                          {screenInfo.colorDepth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pixel Depth">
                          {screenInfo.pixelDepth}
                        </Descriptions.Item>
                        <Descriptions.Item label="Orientation">
                          {screenInfo.orientation}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {gpuInfo && (
                      <div className="panel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <LaptopOutlined /> GPU (WebGL)
                          </span>
                        </div>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Vendor">{gpuInfo.vendor}</Descriptions.Item>
                          <Descriptions.Item label="Renderer">
                            <Text style={{ wordBreak: 'break-all' }}>{gpuInfo.renderer}</Text>
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    )}

                    <div className="panel">
                      <div className="panelHeader">
                        <span className="panelTitle">
                          <WifiOutlined /> Network Connection
                        </span>
                      </div>
                      {connectionInfo ? (
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Effective Type">
                            <Tag color="blue">{connectionInfo.effectiveType}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Downlink">
                            {connectionInfo.downlink}
                          </Descriptions.Item>
                          <Descriptions.Item label="RTT">{connectionInfo.rtt}</Descriptions.Item>
                          <Descriptions.Item label="Data Saver">
                            {connectionInfo.saveData}
                          </Descriptions.Item>
                          <Descriptions.Item label="Connection Type">
                            {connectionInfo.type}
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Empty description="Network Information API not available" />
                      )}
                    </div>

                    {batteryInfo && (
                      <div className="panel">
                        <div className="panelHeader">
                          <span className="panelTitle">🔋 Battery</span>
                        </div>
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
                      </div>
                    )}

                    {storageInfo && (
                      <div className="panel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <DatabaseOutlined /> Storage Estimate
                          </span>
                        </div>
                        <Progress percent={storagePct} status="active" />
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Usage">
                            {formatBytes(storageInfo.usage)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Quota">
                            {formatBytes(storageInfo.quota)}
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    )}

                    <div className="panel">
                      <div className="panelHeader">
                        <span className="panelTitle">
                          <SoundOutlined /> Media Capabilities
                        </span>
                      </div>
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="getUserMedia">
                          {supported(mediaInfo.getUserMedia)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Enumerate Devices">
                          {supported(mediaInfo.enumerateDevices)}
                        </Descriptions.Item>
                        <Descriptions.Item label="MediaRecorder">
                          {supported(mediaInfo.mediaRecorder)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Web Audio">
                          {supported(mediaInfo.webAudio)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Speech Synthesis">
                          {supported(mediaInfo.speechSynthesis)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Speech Recognition">
                          {supported(mediaInfo.speechRecognition)}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {Object.keys(permissionStatuses).length > 0 && (
                      <div className="panel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <SafetyCertificateOutlined /> Permission Statuses
                          </span>
                        </div>
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
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'apis',
              label: (
                <span>
                  <ExperimentOutlined /> API Explorer
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {supportedCount}/{totalFeatures}
                  </Tag>
                </span>
              ),
              children: (
                <div className="tabBody">
                  <div className="panel">
                    <div className="panelHeader apiToolbar">
                      <span className="panelTitle">
                        <ApiOutlined /> Browser API support
                      </span>
                      <Space wrap>
                        <Input.Search
                          allowClear
                          size="middle"
                          placeholder="Search APIs…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={{ width: 220 }}
                        />
                        <Segmented
                          value={filter}
                          onChange={(v) => setFilter(v as any)}
                          options={[
                            { label: 'All', value: 'all' },
                            { label: `Supported (${supportedCount})`, value: 'supported' },
                            {
                              label: `Missing (${totalFeatures - supportedCount})`,
                              value: 'missing',
                            },
                          ]}
                        />
                      </Space>
                    </div>

                    <Progress
                      percent={supportRatio}
                      strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }}
                      format={(p) => `${supportedCount} of ${totalFeatures} (${p}%)`}
                    />

                    <div className="apiGroups">
                      {filteredGroups.length === 0 && (
                        <Empty description="No APIs match your filter" />
                      )}
                      {filteredGroups.map(({ group, items }) => (
                        <div key={group} className="apiGroup">
                          <div className="apiGroupTitle">{group}</div>
                          <div className="apiTiles">
                            {items.map((k) => {
                              const ok = (features as any)[k];
                              return (
                                <div key={k} className={`apiTile ${ok ? 'ok' : 'no'}`}>
                                  <span className="apiTileIcon">
                                    {ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
                                  </span>
                                  <span className="apiTileName">{FEATURE_LABELS[k] || k}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panelHeader">
                      <span className="panelTitle">Full table</span>
                    </div>
                    <Table
                      dataSource={featureRows}
                      columns={featureColumns}
                      pagination={false}
                      size="small"
                      scroll={{ y: 420 }}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'guide',
              label: (
                <span>
                  <BulbOutlined /> Guide
                </span>
              ),
              children: (
                <div className="tabBody">
                  <div className="guideGrid">
                    <div className="panel guideItem">
                      <div className="guideTitle">Privacy</div>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Every value on this page is read with standard browser APIs from{' '}
                        <Text code>navigator</Text>, <Text code>screen</Text>,{' '}
                        <Text code>window</Text>, and friends. Nothing is uploaded — all detection
                        runs in your browser.
                      </Paragraph>
                    </div>
                    <div className="panel guideItem">
                      <div className="guideTitle">Why some values say "N/A"</div>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Several APIs (Network Information, Battery, Device Memory) are{' '}
                        <Text strong>not implemented</Text> in every browser, especially Firefox and
                        Safari. The page gracefully hides the missing parts.
                      </Paragraph>
                    </div>
                    <div className="panel guideItem">
                      <div className="guideTitle">Hardware features</div>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Web Bluetooth, WebUSB, WebHID, Web Serial, and Web NFC are typically
                        Chromium-only and require <Text strong>HTTPS</Text> or localhost plus a user
                        gesture to actually connect.
                      </Paragraph>
                    </div>
                    <div className="panel guideItem">
                      <div className="guideTitle">Permissions vs availability</div>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        An API showing <Tag color="success">Supported</Tag> means the constructor
                        exists. The <Text strong>permission status</Text> (granted / denied /
                        prompt) tells you whether the user has actually allowed access.
                      </Paragraph>
                    </div>
                    <div className="panel guideItem">
                      <div className="guideTitle">Use the report</div>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Click <Text code>Copy Report</Text> in the hero to get a Markdown snapshot
                        you can paste into a bug report or compatibility matrix.
                      </Paragraph>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default SystemInfoPage;
