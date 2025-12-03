import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { handleCopy } from '@/helpers';
import {
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  InputNumber,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import ImageTracer from 'imagetracerjs';
import React, { useEffect, useRef, useState } from 'react';
import ImageEditor from './components/ImageEditor';
import './styles.less';

const { Title } = Typography;
const { TabPane } = Tabs;

const PNGJPEG: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [addOnFile, setAddOnFile] = useState<File | null>(null);

  const dragCounter = useRef(0);

  // --- Clipboard paste support ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) => item.type.includes('image'));
      if (imageItem) {
        const blob = imageItem.getAsFile();
        if (blob) {
          handleUpload(blob);
          message.success('Image pasted from clipboard!');
          e.preventDefault();
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [preview]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => (preview ? setAddOnFile(file) : setPreview(e.target?.result as string));
    reader.readAsDataURL(file);
    setDragging(false);
    dragCounter.current = 0;
    return false;
  };

  const handleClear = () => {
    setPreview(null);
    setSvgContent(null);
    setAddOnFile(null);
    message.info('Image and SVG cleared.');
  };

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <Card
        title={
          <>
            🖼️ PNG / JPEG Viewer <Tag color="cyan">Beta</Tag>
          </>
        }
        variant={'borderless'}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {!dragging && (
            <Upload beforeUpload={handleUpload} showUploadList={false} accept=".png,.jpg,.jpeg">
              <Button icon={<UploadOutlined />}>Upload Image (PNG/JPG)</Button>
            </Upload>
          )}

          {dragging && <DragOverlay />}

          {/* Preview */}
          {preview && (
            <div>
              <Title level={5}>Preview & Editor:</Title>
              <ImageEditor
                addOnFile={addOnFile}
                setAddOnFile={setAddOnFile}
                imageUrl={preview}
                onExport={(blob) => {
                  // optional: show download link or handle upload
                  console.log('exported blob', blob);
                }}
              />
            </div>
          )}
          <Button onClick={handleClear} danger disabled={!preview}>
            Clear Image
          </Button>
        </Space>
      </Card>
    </DragDropWrapper>
  );
};

export default PNGJPEG;
