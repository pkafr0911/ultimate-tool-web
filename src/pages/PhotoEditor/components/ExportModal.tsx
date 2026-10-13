import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, Button, Checkbox, message } from 'antd';
import { renderDocument, serializeDocument, documentSize, isDocumentLoading } from '../utils/document';
import { Canvas } from 'fabric';
import { photoEditorMessages } from '../hooks/useNotification';

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
  canvas: Canvas | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onCancel, canvas }) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'json' | 'svg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(false);

  const handleExport = async () => {
    if (!canvas || isDocumentLoading(canvas)) return;
    try {
    await document.fonts.ready;

    if (format === 'json') {
      const json = serializeDocument(canvas);
      const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
      downloadBlob(blob, 'project.json');
    } else if (format === 'svg') {
      const { width, height } = documentSize(canvas);
      const svg = canvas.toSVG({ width: String(width), height: String(height), viewBox: { x: 0, y: 0, width, height } });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, 'image.svg');
    } else {
      const output = renderDocument(canvas, multiplier, trimWhitespace);
      if (format === 'jpeg') {
        const ctx = output.getContext('2d')!;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, output.width, output.height);
      }
      const dataURL = output.toDataURL(`image/${format}`, quality);
      const link = document.createElement('a');
      link.download = `image.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    photoEditorMessages.projectExported(format);
    onCancel();
    } catch (error) { message.error(error instanceof Error ? error.message : 'Export failed'); }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke on next tick so the browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal
      title="Export Image"
      open={visible}
      onCancel={onCancel}
      getContainer={() => (typeof document !== 'undefined' && document.fullscreenElement as HTMLElement) || document.body}
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
            <Select.Option value="webp">WebP</Select.Option>
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
