import React from 'react';
import { Modal, Form, ColorPicker, Switch, InputNumber } from 'antd';
import { useVectorEditor } from '../context';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { canvas, history } = useVectorEditor();
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (!canvas) return;

    if (changedValues.backgroundColor) {
      const color =
        typeof changedValues.backgroundColor === 'string'
          ? changedValues.backgroundColor
          : changedValues.backgroundColor.toHexString();
      canvas.backgroundColor = color;
      canvas.requestRenderAll();
      // We might not want to save history on every color drag, but for now it's okay or we can debounce
    }

    if (changedValues.width || changedValues.height) {
      canvas.setDimensions({
        width: allValues.width || canvas.width,
        height: allValues.height || canvas.height,
      });
      canvas.requestRenderAll();
    }
  };

  const initialValues = {
    backgroundColor: canvas?.backgroundColor || '#ffffff',
    width: canvas?.width,
    height: canvas?.height,
  };

  return (
    <Modal title="Canvas Settings" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Form.Item label="Background Color" name="backgroundColor">
          <ColorPicker showText />
        </Form.Item>
        <Form.Item label="Canvas Width" name="width">
          <InputNumber />
        </Form.Item>
        <Form.Item label="Canvas Height" name="height">
          <InputNumber />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
