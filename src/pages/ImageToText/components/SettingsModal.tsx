import React from 'react';
import { Modal, Select, Space, Typography } from 'antd';
import { languageOptions } from '../constants';
import { useSetting } from '../hooks/useSetting';

const { Text } = Typography;

type Props = {
  open: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const { settings, setSettings } = useSetting();
  return (
    <Modal title="⚙️ Settings" open={open} onCancel={onClose} onOk={onClose} footer={<></>}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text>Language:</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 5 }}
            value={settings.language}
            onChange={(val) => setSettings({ ...settings, language: val })}
            options={languageOptions}
          />
        </div>

        <div>
          <Text>Upscale Mode:</Text>
          <Select
            style={{ width: '100%', marginTop: 5 }}
            value={settings.upscaleMode}
            onChange={(val) => setSettings({ ...settings, upscaleMode: val })}
            options={[
              { label: 'Auto', value: 'auto' },
              { label: 'Manual', value: 'manual' },
              { label: 'None', value: 'none' },
            ]}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default SettingsModal;
