import React from 'react';
import { Modal, Space, Switch, Typography } from 'antd';
import { useSetting } from '../hooks/useSetting';
// Setting hook
type Props = {
  open: boolean;
  onClose: () => void;
};

const { Text } = Typography;

const SettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const { settings, setSettings } = useSetting();

  return (
    <Modal
      title="⚙️ SVG Viewer Settings"
      open={open}
      onCancel={onClose}
      onOk={onClose}
      footer={<></>}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text>Highlight Border</Text>
          <Switch
            checked={settings.highlightBorder}
            onChange={(val) => setSettings({ ...settings, highlightBorder: val })}
          />
        </Space>

        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text>Highlight Area</Text>
          <Switch
            checked={settings.highlightArea}
            onChange={(val) => setSettings({ ...settings, highlightArea: val })}
          />
        </Space>

        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text>Upload Stack (append new SVGs)</Text>
          <Switch
            checked={settings.uploadStack}
            onChange={(val) => setSettings({ ...settings, uploadStack: val })}
          />
        </Space>

        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text>Optimize Before Prettify</Text>
          <Switch
            checked={settings.optimizeBeforePrettify}
            onChange={(val) => setSettings({ ...settings, optimizeBeforePrettify: val })}
          />
        </Space>
      </Space>
    </Modal>
  );
};

export default SettingsModal;
