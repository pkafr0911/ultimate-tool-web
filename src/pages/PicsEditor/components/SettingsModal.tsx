import { Form, InputNumber, Modal, Switch } from 'antd';
import React, { useEffect } from 'react';
import { EditorSettings } from '../types';

interface SettingsModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (settings: EditorSettings) => void;
  initialSettings: EditorSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onCancel,
  onSave,
  initialSettings,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialSettings);
    }
  }, [open, initialSettings, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onSave(values);
      onCancel();
    });
  };

  return (
    <Modal title="Editor Settings" open={open} onOk={handleOk} onCancel={onCancel}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="autoSaveInterval"
          label="Auto Save Interval (minutes)"
          help="Set to 0 to disable auto-save"
          rules={[{ required: true, message: 'Please enter auto save interval' }]}
        >
          <InputNumber min={0} max={60} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="maxHistory"
          label="Max History Steps"
          help="Maximum number of undo steps to keep. The initial image is always preserved."
          rules={[{ required: true, message: 'Please enter max history steps' }]}
        >
          <InputNumber min={5} max={100} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
