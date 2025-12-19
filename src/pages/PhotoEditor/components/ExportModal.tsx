import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, Button, message } from 'antd';
import { Canvas } from 'fabric';

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
  canvas: Canvas | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onCancel, canvas }) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'json'>('png');
  const [quality, setQuality] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<number>(1);

  const handleExport = () => {
    if (!canvas) return;

    if (format === 'json') {
      const json = canvas.toJSON();
      const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
      downloadBlob(blob, 'project.json');
    } else {
      const dataURL = canvas.toDataURL({
        format,
        quality,
        multiplier,
      });
      const link = document.createElement('a');
      link.download = `image.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    message.success('Export successful');
    onCancel();
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      title="Export Image"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="export" type="primary" onClick={handleExport}>
          Export
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label="Format">
          <Select value={format} onChange={(v) => setFormat(v)}>
            <Select.Option value="png">PNG</Select.Option>
            <Select.Option value="jpeg">JPEG</Select.Option>
            <Select.Option value="json">JSON (Project)</Select.Option>
          </Select>
        </Form.Item>
        {format !== 'json' && (
          <>
            <Form.Item label="Quality (0.1 - 1)">
              <InputNumber
                min={0.1}
                max={1}
                step={0.1}
                value={quality}
                onChange={(v) => setQuality(v || 1)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="Multiplier (Scale)">
              <InputNumber
                min={0.1}
                max={5}
                step={0.1}
                value={multiplier}
                onChange={(v) => setMultiplier(v || 1)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ExportModal;
