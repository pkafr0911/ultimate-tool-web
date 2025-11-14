import React, { useState, useRef } from 'react';
import { Card, Button, Typography, Splitter, Space, message } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import Tesseract from 'tesseract.js';
import styles from './styles.less';

import OCRUploader from './components/OCRUploader';
import ImagePreview from './components/ImagePreview';
import TextOutput from './components/TextOutput';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';

const { Title, Paragraph, Text } = Typography;

const ImageToText: React.FC = () => {
  const isMobile = useIsMobile();

  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const [imageFile, setImageFile] = useState<File | null>(null); // Store uploaded file
  const [imageUrl, setImageUrl] = useState<string>(''); // For preview
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // --- Store uploaded file, do not extract yet ---
  const handleUpload = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setExtractedText('');
  };

  // --- Handle OCR extraction ---
  const handleOCR = async () => {
    if (!imageFile) return message.warning('Please upload an image first.');

    setLoading(true);

    try {
      const result = await Tesseract.recognize(imageFile, 'eng+vie', {
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
      <Card
        className={styles.container}
        variant="borderless"
        title={<Space>🖼️ Image → Text (OCR)</Space>}
      >
        {/* --- About Section --- */}
        <div>
          <Title level={4}>📘 About Image to Text Converter</Title>
          <Paragraph>
            Upload an image containing <Text strong>text</Text>, and this tool will use
            <Text strong> OCR (Optical Character Recognition)</Text> to extract the text.
          </Paragraph>
        </div>

        <Space>
          {/* --- Uploader --- */}
          <OCRUploader handleOCR={handleUpload} loading={false} />

          {/* --- Submit Button --- */}
          {imageFile && (
            <div style={{ margin: '10px 0' }}>
              <Button type="primary" onClick={handleOCR} loading={loading}>
                Extract Text
              </Button>
            </div>
          )}
        </Space>

        {/* --- Content Layout --- */}
        <div className={styles.content}>
          <Splitter
            layout={isMobile ? 'vertical' : 'horizontal'}
            style={isMobile ? { height: 1500 } : {}}
          >
            {/* Left Panel */}
            <Splitter.Panel min="30%" max="60%">
              <ImagePreview imageUrl={imageUrl} extractedText={extractedText} />
            </Splitter.Panel>

            {/* Right Panel */}
            <Splitter.Panel>
              <TextOutput text={extractedText} setText={setExtractedText} />
            </Splitter.Panel>
          </Splitter>
        </div>
      </Card>

      {/* Drag overlay */}
      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ImageToText;
