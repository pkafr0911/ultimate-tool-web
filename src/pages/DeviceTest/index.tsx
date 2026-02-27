import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React from 'react';
import { history, useLocation } from 'umi';
import KeyboardTest from './KeyboardTest';
import CameraTest from './CameraTest';
import MicrophoneTest from './MicrophoneTest';
import HeadphoneTest from './HeadphoneTest';
import GamepadTest from './GamepadTest';
import MouseTest from './MouseTest';
import './styles.less';

const TABS = ['keyboard', 'camera', 'microphone', 'headphone', 'gamepad', 'mouse'] as const;
type TabKey = (typeof TABS)[number];

function getTabFromPath(pathname: string): TabKey {
  const last = pathname.split('/').pop() as TabKey;
  return TABS.includes(last) ? last : 'keyboard';
}

const DeviceTest: React.FC = () => {
  const location = useLocation();
  const activeTab = getTabFromPath(location.pathname);

  const handleTabChange = (key: string) => {
    history.push(`/utility/device-test/${key}`);
  };

  return (
    <PageContainer
      title="Device Test"
      subTitle="Test your keyboard, camera, microphone, headphone, gamepad & mouse"
    >
      <div className="device-test-page">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          items={[
            {
              key: 'keyboard',
              label: '⌨️ Keyboard',
              children: <KeyboardTest />,
            },
            {
              key: 'camera',
              label: '📷 Camera',
              children: <CameraTest />,
            },
            {
              key: 'microphone',
              label: '🎤 Microphone',
              children: <MicrophoneTest />,
            },
            {
              key: 'headphone',
              label: '🎧 Headphone',
              children: <HeadphoneTest />,
            },
            {
              key: 'gamepad',
              label: '🎮 Gamepad',
              children: <GamepadTest />,
            },
            {
              key: 'mouse',
              label: '🖱️ Mouse',
              children: <MouseTest />,
            },
          ]}
        />
      </div>
    </PageContainer>
  );
};

export default DeviceTest;
