import {
  AudioOutlined,
  CameraOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CustomerServiceOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useLocation } from 'umi';
import CameraTest from './CameraTest';
import GamepadTest from './GamepadTest';
import HeadphoneTest from './HeadphoneTest';
import KeyboardTest from './KeyboardTest';
import MicrophoneTest from './MicrophoneTest';
import MouseTest from './MouseTest';
import './styles.less';

const { Title, Text } = Typography;

const TABS = ['keyboard', 'camera', 'microphone', 'headphone', 'gamepad', 'mouse'] as const;
type TabKey = (typeof TABS)[number];

interface TabMeta {
  key: TabKey;
  emoji: string;
  label: string;
  desc: string;
  hint: string; // permission / capability hint
  // detector returning supported flag (sync)
  detect: () => boolean;
}

const TAB_META: TabMeta[] = [
  {
    key: 'keyboard',
    emoji: '⌨️',
    label: 'Keyboard',
    desc: 'Press any key to verify each switch and detect ghosting.',
    hint: 'Click the keyboard area to capture key events.',
    detect: () => true,
  },
  {
    key: 'camera',
    emoji: '📷',
    label: 'Camera',
    desc: 'Preview your webcams and check resolution / framerate.',
    hint: 'Requires camera permission (HTTPS).',
    detect: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  },
  {
    key: 'microphone',
    emoji: '🎤',
    label: 'Microphone',
    desc: 'Live waveform & input level meter for any connected mic.',
    hint: 'Requires microphone permission (HTTPS).',
    detect: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  },
  {
    key: 'headphone',
    emoji: '🎧',
    label: 'Headphone',
    desc: 'Stereo / channel test tones to verify L / R output.',
    hint: 'Uses Web Audio — no permission required.',
    detect: () =>
      typeof (window as any).AudioContext !== 'undefined' ||
      typeof (window as any).webkitAudioContext !== 'undefined',
  },
  {
    key: 'gamepad',
    emoji: '🎮',
    label: 'Gamepad',
    desc: 'Detect connected controllers and visualize buttons & axes.',
    hint: 'Connect a gamepad and press any button to activate.',
    detect: () => 'getGamepads' in navigator,
  },
  {
    key: 'mouse',
    emoji: '🖱️',
    label: 'Mouse',
    desc: 'Buttons, wheel, movement and pointer event tracker.',
    hint: 'Move/click anywhere in the test area.',
    detect: () => true,
  },
];

function getTabFromPath(pathname: string): TabKey {
  const last = pathname.split('/').pop() as TabKey;
  return TABS.includes(last) ? last : 'keyboard';
}

const DeviceTest: React.FC = () => {
  const location = useLocation();
  const activeTab = getTabFromPath(location.pathname);
  const meta = TAB_META.find((t) => t.key === activeTab) ?? TAB_META[0];

  const [supportMap, setSupportMap] = useState<Record<TabKey, boolean>>(() => {
    const init = {} as Record<TabKey, boolean>;
    TAB_META.forEach((t) => {
      init[t.key] = t.detect();
    });
    return init;
  });

  // Re-check on tab change (e.g. if a permission-bound API became available)
  useEffect(() => {
    setSupportMap((prev) => {
      const next = { ...prev };
      TAB_META.forEach((t) => {
        next[t.key] = t.detect();
      });
      return next;
    });
  }, [activeTab]);

  const handleTabChange = (key: string) => {
    history.push(`/utility/device-test/${key}`);
  };

  const supportedCount = Object.values(supportMap).filter(Boolean).length;

  const renderChild = (key: TabKey) => {
    switch (key) {
      case 'keyboard':
        return <KeyboardTest />;
      case 'camera':
        return <CameraTest />;
      case 'microphone':
        return <MicrophoneTest />;
      case 'headphone':
        return <HeadphoneTest />;
      case 'gamepad':
        return <GamepadTest />;
      case 'mouse':
        return <MouseTest />;
      default:
        return null;
    }
  };

  return (
    <div className="container deviceTestPage">
      <div className="shell">
        {/* === Hero === */}
        <div className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <ExperimentOutlined />
              </span>
              <div>
                <span className="heroEyebrow">Device Test</span>
                <Title level={4} style={{ color: '#fff', margin: '4px 0 0', lineHeight: 1.25 }}>
                  Verify every input & output device — keyboard, camera, mic, audio, gamepad, mouse
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  Six interactive testers running entirely in your browser. No data leaves your
                  device.
                </Text>
              </div>
              <span className="heroStatus heroStatus-info">
                <span className="heroStatusDot" />
                {supportedCount}/{TAB_META.length} available
              </span>
            </div>
            <Space className="heroActions" wrap>
              <Tooltip title="Each tab is permissionless except Camera & Microphone, which prompt the OS.">
                <span className="heroHint">
                  <SafetyCertificateOutlined /> Local-only · no upload
                </span>
              </Tooltip>
            </Space>
          </div>
        </div>

        {/* === Quick chip strip === */}
        <div className="statStrip">
          {TAB_META.map((t) => {
            const active = t.key === activeTab;
            const ok = supportMap[t.key];
            return (
              <button
                key={t.key}
                type="button"
                className={`statChip deviceChip ${active ? 'active' : ''} ${ok ? 'ok' : 'no'}`}
                onClick={() => handleTabChange(t.key)}
              >
                <span className="statIcon" aria-hidden>
                  {t.emoji}
                </span>
                <div className="statBody">
                  <span className="statLabel">
                    {t.label}
                    {!ok && (
                      <Tag color="warning" style={{ marginLeft: 6 }}>
                        N/A
                      </Tag>
                    )}
                  </span>
                  <span className="statSub">
                    {ok ? (
                      <>
                        <CheckCircleFilled style={{ color: '#52c41a', marginRight: 4 }} />
                        Available
                      </>
                    ) : (
                      <>
                        <CloseCircleFilled style={{ color: '#ff4d4f', marginRight: 4 }} />
                        Not supported
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* === Active tester context bar === */}
        <div className="contextBar">
          <span className="contextEmoji" aria-hidden>
            {meta.emoji}
          </span>
          <div className="contextText">
            <strong>{meta.label} test</strong>
            <span>{meta.desc}</span>
          </div>
          <Tooltip title={meta.hint}>
            <span className="contextHint">
              <QuestionCircleOutlined /> {meta.hint}
            </span>
          </Tooltip>
        </div>

        {/* === Tabs (URL-driven) === */}
        <div className="panel testerPanel">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            type="line"
            size="middle"
            destroyInactiveTabPane
            items={TAB_META.map((t) => ({
              key: t.key,
              label: (
                <span className={`testerTabLabel ${supportMap[t.key] ? '' : 'unavailable'}`}>
                  <span className="testerTabEmoji">{t.emoji}</span>
                  {t.label}
                </span>
              ),
              children: renderChild(t.key),
            }))}
          />
        </div>

        {/* === Footer hint === */}
        <div className="footerHint">
          <InfoCircleOutlined />
          <span>
            Camera & microphone tests use <strong>getUserMedia</strong> and require HTTPS or
            localhost. Gamepad needs a controller plugged in and a button press to wake the API.
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeviceTest;
