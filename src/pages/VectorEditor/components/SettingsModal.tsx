import React from 'react';
import { Modal, Form, ColorPicker, InputNumber } from 'antd';
import { useVectorEditor } from '../context';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { canvas } = useVectorEditor();
  const [form] = Form.useForm();

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (!canvas) return;

    if ('backgroundColor' in changedValues) {
      const val = changedValues.backgroundColor;
      const color = typeof val === 'string' ? val : (val?.toHexString?.() ?? '#ffffff');
      canvas.backgroundColor = color;
      canvas.requestRenderAll();
    }

    if ('width' in changedValues || 'height' in changedValues) {
      const w = Math.max(50, allValues.width || canvas.width || 800);
      const h = Math.max(50, allValues.height || canvas.height || 600);
      canvas.setDimensions({ width: w, height: h });
      canvas.requestRenderAll();
    }
  };

  const initialValues = {
    backgroundColor: canvas?.backgroundColor || '#ffffff',
    width: canvas?.width,
    height: canvas?.height,
  };

  return (
    <Modal title="Canvas settings" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Form.Item label="Background colour" name="backgroundColor">
          <ColorPicker showText />
        </Form.Item>
        <Form.Item label="Canvas width" name="width">
          <InputNumber min={50} max={10000} />
        </Form.Item>
        <Form.Item label="Canvas height" name="height">
          <InputNumber min={50} max={10000} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
