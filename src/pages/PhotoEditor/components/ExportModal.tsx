import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, Button, Checkbox } from 'antd';
import { Canvas } from 'fabric';
import { photoEditorMessages } from '../hooks/useNotification';

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
  canvas: Canvas | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onCancel, canvas }) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'json' | 'svg'>('png');
  const [quality, setQuality] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);

  const handleExport = () => {
    if (!canvas) return;

    if (format === 'json') {
      const json = canvas.toJSON();
      const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
      downloadBlob(blob, 'project.json');
    } else if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, 'image.svg');
    } else {
      let options: any = {
        format,
        quality,
        multiplier,
      };

      let savedBackgroundColor: any = null;
      let savedBackgroundImage: any = null;

      if (trimWhitespace) {
        const objects = canvas.getObjects();
        if (objects.length > 0) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          objects.forEach((obj) => {
            const bound = obj.getBoundingRect();
            if (bound.left < minX) minX = bound.left;
            if (bound.top < minY) minY = bound.top;
            if (bound.left + bound.width > maxX) maxX = bound.left + bound.width;
            if (bound.top + bound.height > maxY) maxY = bound.top + bound.height;
          });

          options = {
            ...options,
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
          };

          // Save and remove background
          savedBackgroundColor = canvas.backgroundColor;
          savedBackgroundImage = canvas.backgroundImage;
          canvas.backgroundColor = null as any;
          canvas.backgroundImage = null as any;
        }
      }

      const dataURL = canvas.toDataURL(options);

      // Restore background
      if (trimWhitespace) {
        canvas.backgroundColor = savedBackgroundColor;
        canvas.backgroundImage = savedBackgroundImage;
      }

      const link = document.createElement('a');
      link.download = `image.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    photoEditorMessages.projectExported(format);
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
            <Select.Option value="svg">SVG</Select.Option>
            <Select.Option value="json">JSON (Project)</Select.Option>
          </Select>
        </Form.Item>
        {format !== 'json' && format !== 'svg' && (
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
            <Form.Item>
              <Checkbox
                checked={trimWhitespace}
                onChange={(e) => setTrimWhitespace(e.target.checked)}
              >
                Trim Whitespace (Export content only)
              </Checkbox>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ExportModal;
