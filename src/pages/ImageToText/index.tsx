import {
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ScanOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Image,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { downloadText, handleOCR, loadSettings, saveSettings } from './utils/helpers';
import './styles.less';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const ImageToText: React.FC = () => {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [stepImages, setStepImages] = useState<string[]>([]);

  // Settings
  const [language, setLanguage] = useState<string[]>(['eng']);
  const [enhance, setEnhance] = useState(true);

  useEffect(() => {
    const settings = loadSettings();
    setLanguage(settings.language || ['eng']);
    setEnhance(settings.textEnhancement ?? true);
  }, []);

  useEffect(() => {
    // Save settings when changed
    const currentSettings = loadSettings();
    saveSettings({
      ...currentSettings,
      language,
      textEnhancement: enhance,
    });
  }, [language, enhance]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      stepImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrl, stepImages]);

  const handleUpload = (file: File) => {
    setImageFile(file);
    setExtractedText('');
    setConfidence(null);
    setStepImages([]);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return false; // Prevent auto upload
  };

  const onProcess = async () => {
    if (!imageFile) return;

    setLoading(true);
    setConfidence(null);

    try {
      // We need to temporarily save settings to ensure helper uses current state
      const currentSettings = loadSettings();
      saveSettings({
        ...currentSettings,
        language,
        textEnhancement: enhance,
      });

      const result = await handleOCR(
        imageFile,
        setExtractedText,
        setLoading,
        language,
        setStepImages,
      );

      if (result && result.confidence) {
        setConfidence(result.confidence);
        message.success(`Text extracted with ${Math.round(result.confidence)}% confidence!`);
      }
    } catch (error) {
      // Error handled in helper
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    message.success('Copied to clipboard!');
  };

  const handleClear = () => {
    setImageFile(null);
    setImageUrl('');
    setExtractedText('');
    setConfidence(null);
    setStepImages([]);
  };

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div className="ocr-container">
        <Card className="ocr-card" bordered={false}>
          <div className="header-section">
            <Title level={2} style={{ margin: 0 }}>
              <ScanOutlined /> Image to Text (OCR)
            </Title>
            <Text type="secondary">
              Extract text from images with high accuracy using advanced OCR.
            </Text>
          </div>

          <Row gutter={[32, 32]} className="main-content">
            {/* Left Column: Input */}
            <Col xs={24} lg={12} className="input-column">
              <Card
                title={
                  <Space>
                    <FileImageOutlined /> Source Image
                  </Space>
                }
                bordered={false}
                className="inner-card"
              >
                {!imageUrl ? (
                  <Dragger
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleUpload}
                    className="custom-dragger"
                  >
                    <p className="ant-upload-drag-icon">
                      <CloudUploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag image to this area to upload</p>
                    <p className="ant-upload-hint">
                      Support for a single upload. Strictly prohibit from uploading company data or
                      other band files
                    </p>
                  </Dragger>
                ) : (
                  <div className="image-preview-wrapper">
                    <Image src={imageUrl} alt="preview" className="preview-image" />
                    <div className="image-actions">
                      <Button danger icon={<DeleteOutlined />} onClick={handleClear} size="small">
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <Divider orientation="left">Settings</Divider>

                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div className="setting-row">
                    <Space>
                      <GlobalOutlined />
                      <Text>Language</Text>
                    </Space>
                    <Select
                      mode="multiple"
                      value={language}
                      onChange={setLanguage}
                      style={{ width: 200 }}
                      options={[
                        { label: 'English', value: 'eng' },
                        { label: 'Vietnamese', value: 'vie' },
                        { label: 'Spanish', value: 'spa' },
                        { label: 'French', value: 'fra' },
                        { label: 'German', value: 'deu' },
                        { label: 'Chinese (Simplified)', value: 'chi_sim' },
                        { label: 'Japanese', value: 'jpn' },
                      ]}
                    />
                  </div>

                  <div className="setting-row">
                    <Space>
                      <SettingOutlined />
                      <Text>Auto Enhancement</Text>
                      <Tooltip title="Automatically improves contrast and sharpness for better accuracy">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          (?)
                        </Text>
                      </Tooltip>
                    </Space>
                    <Switch checked={enhance} onChange={setEnhance} />
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    icon={<ScanOutlined />}
                    block
                    onClick={onProcess}
                    loading={loading}
                    disabled={!imageFile}
                    className="process-btn"
                  >
                    {loading ? 'Processing...' : 'Extract Text'}
                  </Button>
                </Space>
              </Card>
            </Col>

            {/* Right Column: Output */}
            <Col xs={24} lg={12} className="output-column">
              <Card
                title={
                  <Space>
                    <FileTextOutlined /> Extracted Text
                  </Space>
                }
                bordered={false}
                className="inner-card"
                extra={
                  extractedText && (
                    <Space>
                      <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                        Copy
                      </Button>
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadText(extractedText)}
                      >
                        Download
                      </Button>
                    </Space>
                  )
                }
              >
                {loading ? (
                  <div className="loading-state">
                    <Spin size="large" tip="Analyzing image..." />
                    <Text type="secondary" style={{ marginTop: 16 }}>
                      This might take a few seconds depending on image complexity...
                    </Text>
                  </div>
                ) : extractedText ? (
                  <div className="result-container">
                    {confidence !== null && (
                      <div className="confidence-meter">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Confidence Score
                        </Text>
                        <Progress
                          percent={Math.round(confidence)}
                          size="small"
                          status={
                            confidence > 80 ? 'success' : confidence > 50 ? 'normal' : 'exception'
                          }
                        />
                      </div>
                    )}
                    <div className="text-content">{extractedText}</div>
                  </div>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No text extracted yet" />
                )}
              </Card>

              {stepImages.length > 1 && (
                <div style={{ marginTop: 24 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Processed Image Debug:
                  </Text>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto' }}>
                    {stepImages.map((src, idx) => (
                      <Image
                        key={idx}
                        src={src}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Card>
      </div>
      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ImageToText;
