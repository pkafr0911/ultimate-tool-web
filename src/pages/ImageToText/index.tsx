import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Splitter,
  Space,
  message,
  Spin,
  Tooltip,
  Modal,
  Select,
} from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import Tesseract from 'tesseract.js';
import styles from './styles.less';

import OCRUploader from './components/OCRUploader';
import ImagePreview from './components/ImagePreview';
import TextOutput from './components/TextOutput';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';

import { preprocessImage } from './utils/preprocessImage';
import { SettingOutlined } from '@ant-design/icons';
import { languageOptions } from './constants';

const { Title, Paragraph, Text } = Typography;

const ImageToText: React.FC = () => {
  const isMobile = useIsMobile();

  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // --- Settings Modal State ---
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [language, setLanguage] = useState<string[]>(['eng']);
  const [upscaleMode, setUpscaleMode] = useState<'auto' | 'manual' | 'none'>('manual');

  // --- Revoke previous object URL to avoid memory leaks ---
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

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
  }, []);

  // --- Handle uploaded image ---
  const handleUpload = (file: File) => {
    setImageFile(file);
    setExtractedText('');

    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  // --- OCR extraction ---

  const handleOCR = async () => {
    if (!imageFile) return message.warning('Please upload an image first.');

    setLoading(true);

    try {
      const cleanedImage = await preprocessImage(imageFile);

      const result = await Tesseract.recognize(cleanedImage, language.join('+'), {
        logger: (m) => console.log(m),
      });

      setExtractedText(result.data.text);
      message.success('Text extracted successfully!');
    } catch (error) {
      console.error(error);
      message.error('Failed to extract text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <Card className={styles.container} title={<Space>🖼️ Image → Text (OCR)</Space>}>
        {/* About Section */}
        <div>
          <Title level={4}>📘 About Image to Text Converter</Title>
          <Paragraph>
            Upload an image containing <Text strong>text</Text>, and this tool will use
            <Text strong> OCR (Optical Character Recognition)</Text> to extract the text.
          </Paragraph>
        </div>

        {/* Upload & Extract */}
        <Space wrap>
          <OCRUploader handleOCR={handleUpload} loading={loading} />
          <Button type="primary" onClick={handleOCR} loading={loading} disabled={!imageFile}>
            Extract Text
          </Button>
          <Tooltip title="Settings">
            <Button icon={<SettingOutlined />} onClick={() => setSettingsVisible(true)} />
          </Tooltip>
        </Space>

        {/* Content Layout */}
        <div className={styles.content}>
          <Splitter
            layout={isMobile ? 'vertical' : 'horizontal'}
            style={isMobile ? { height: 'calc(100vh - 200px)' } : {}}
          >
            <Splitter.Panel min="30%" max="60%">
              <div style={{ position: 'relative' }}>
                <ImagePreview
                  imageUrl={imageUrl}
                  extractedText={extractedText}
                  upscaleMode={upscaleMode}
                />
                {loading && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.6)',
                      zIndex: 10,
                    }}
                  >
                    <Spin size="large" />
                  </div>
                )}
              </div>
            </Splitter.Panel>

            <Splitter.Panel>
              <TextOutput text={extractedText} setText={setExtractedText} />
            </Splitter.Panel>
          </Splitter>
        </div>
      </Card>
      {/* Settings Modal */}
      <Modal
        title="Settings"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onOk={() => setSettingsVisible(false)}
        footer={<></>}
      >
        <div style={{ marginBottom: 10 }}>
          <label>Language:</label>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 5 }}
            value={language}
            onChange={(val) => setLanguage(val)}
            options={languageOptions}
          />
        </div>

        <div>
          <label>Upscale Mode:</label>
          <Select
            style={{ width: '100%', marginTop: 5 }}
            value={upscaleMode}
            onChange={(val) => setUpscaleMode(val)}
            options={[
              { label: 'Auto', value: 'auto' },
              { label: 'Manual', value: 'manual' },
              { label: 'None', value: 'none' },
            ]}
          />
        </div>
      </Modal>

      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ImageToText;
