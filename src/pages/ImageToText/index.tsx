import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Typography, Splitter, Space, message, Spin, Tooltip, Image } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import styles from './styles.less';

import OCRUploader from './components/OCRUploader';
import ImagePreview from './components/ImagePreview';
import TextOutput from './components/TextOutput';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';

import { ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { handleOCR, loadSettings } from './utils/helpers';
import GuideSection from './components/GuideSection';
import SettingsModal from './components/SettingsModal';

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const settings = loadSettings();

  // step
  const [stepImages, setStepImages] = useState<string[]>([]);

  // --- Revoke previous object URL to avoid memory leaks ---
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

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
          <Button
            type="primary"
            onClick={() =>
              handleOCR(imageFile, setExtractedText, setLoading, settings.language, setStepImages)
            }
            loading={loading}
            disabled={!imageFile}
          >
            Extract Text
          </Button>
          <Tooltip title="Settings">
            <Button icon={<SettingOutlined />} onClick={() => setIsSettingsModalOpen(true)} />
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
                  upscaleMode={settings.upscaleMode}
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

      {settings.textEnhancement && (
        <Card
          size="small"
          title={
            <>
              Text Enhancement{' '}
              <Tooltip
                title={
                  <>
                    Recommended: Turn this on if the image has color. Turn it off if the image is
                    only black and white in{' '}
                    <a onClick={() => setIsSettingsModalOpen(true)}>Setting</a>
                  </>
                }
              >
                <ExclamationCircleOutlined />
              </Tooltip>
            </>
          }
          style={{ marginTop: 20 }}
        >
          <div className={styles.stepsPreview}>
            {stepImages.map((src, index) => (
              <div key={index} className={styles.stepImageWrapper}>
                <Image
                  src={src}
                  alt={`Step ${index + 1}`}
                  className={styles.stepImage}
                  preview={{ mask: <div>Preview Step {index + 1}</div> }} // optional hover preview
                />
                {index === 0 && <div>{'Original image'}</div>}
                {index === 1 && <div>{'Store resized image'}</div>}
                {index === 2 && <div>{'Grayscale + contrast + threshold'}</div>}
                {index === 3 && <div>{'Simple sharpening kernel'}</div>}
                {index > 3 && <div>Step {index + 1}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* --- Guide Section --- */}
      <GuideSection
        callback={(action) => {
          if (action === 'openSettings') setIsSettingsModalOpen(true);
        }}
      />

      {/* --- Settings Modal --- */}
      <SettingsModal open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Drag overlay */}
      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ImageToText;
