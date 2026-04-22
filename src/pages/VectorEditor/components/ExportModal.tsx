import React from 'react';
import { Modal, Form, Radio, InputNumber, Switch, Slider } from 'antd';
import { Canvas } from 'fabric';

export type ExportFormat = 'svg' | 'png' | 'jpeg';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  canvas: Canvas | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, canvas }) => {
  const [form] = Form.useForm();
  const [format, setFormat] = React.useState<ExportFormat>('svg');

  const handleExport = () => {
    if (!canvas) return;
    const values = form.getFieldsValue();
    const fmt: ExportFormat = values.format ?? 'svg';
    const transparent: boolean = values.transparent ?? true;
    const multiplier: number = values.multiplier ?? 2;
    const quality: number = (values.quality ?? 92) / 100;

    const originalBg = canvas.backgroundColor;
    if (transparent) canvas.backgroundColor = 'transparent';
    canvas.renderAll();

    try {
      if (fmt === 'svg') {
        // Tight viewBox from object bounds
        const objects = canvas.getObjects();
        let svg: string;
        if (objects.length > 0) {
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          objects.forEach((obj) => {
            const br = obj.getBoundingRect();
            minX = Math.min(minX, br.left);
            minY = Math.min(minY, br.top);
            maxX = Math.max(maxX, br.left + br.width);
            maxY = Math.max(maxY, br.top + br.height);
          });
          const pad = 10;
          minX -= pad;
          minY -= pad;
          maxX += pad;
          maxY += pad;
          const width = maxX - minX;
          const height = maxY - minY;
          svg = canvas.toSVG({
            viewBox: { x: minX, y: minY, width, height },
            width: String(width),
            height: String(height),
          });
        } else {
          svg = canvas.toSVG();
        }
        triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), 'design.svg');
      } else {
        const dataUrl = canvas.toDataURL({
          format: fmt,
          quality,
          multiplier,
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `design.${fmt}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      canvas.backgroundColor = originalBg;
      canvas.renderAll();
      onClose();
    }
  };

  return (
    <Modal
      title="Export"
      open={open}
      onCancel={onClose}
      onOk={handleExport}
      okText="Export"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ format: 'svg', transparent: true, multiplier: 2, quality: 92 }}
      >
        <Form.Item name="format" label="Format">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            onChange={(e) => setFormat(e.target.value)}
            options={[
              { label: 'SVG', value: 'svg' },
              { label: 'PNG', value: 'png' },
              { label: 'JPEG', value: 'jpeg' },
            ]}
          />
        </Form.Item>

        <Form.Item name="transparent" label="Transparent background" valuePropName="checked">
          <Switch disabled={format === 'jpeg'} />
        </Form.Item>

        {format !== 'svg' && (
          <Form.Item name="multiplier" label="Scale (×)">
            <InputNumber min={1} max={6} step={0.5} style={{ width: 120 }} />
          </Form.Item>
        )}

        {format === 'jpeg' && (
          <Form.Item name="quality" label="Quality">
            <Slider min={10} max={100} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Release the object URL after download kicks off
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default ExportModal;
