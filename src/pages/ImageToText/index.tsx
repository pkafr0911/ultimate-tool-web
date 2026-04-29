import {
  BulbOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileImageOutlined,
  FileTextOutlined,
  GlobalOutlined,
  PictureOutlined,
  ScanOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Image,
  Progress,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { downloadText, handleOCR, loadSettings, saveSettings } from './utils/helpers';
import './styles.less';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const LANG_OPTIONS = [
  { label: 'English', value: 'eng' },
  { label: 'Vietnamese', value: 'vie' },
  { label: 'Spanish', value: 'spa' },
  { label: 'French', value: 'fra' },
  { label: 'German', value: 'deu' },
  { label: 'Chinese (Simplified)', value: 'chi_sim' },
  { label: 'Japanese', value: 'jpn' },
];

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImageToText: React.FC = () => {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [stepImages, setStepImages] = useState<string[]>([]);

  const [language, setLanguage] = useState<string[]>(['eng']);
  const [enhance, setEnhance] = useState(true);

  useEffect(() => {
    const settings = loadSettings();
    setLanguage(settings.language || ['eng']);
    setEnhance(settings.textEnhancement ?? true);
  }, []);

  useEffect(() => {
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
    return false;
  };

  const onProcess = async () => {
    if (!imageFile) return;
    setLoading(true);
    setConfidence(null);
    try {
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
    } catch {
      // handled in helper
    }
  };

  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      message.success('Copied to clipboard!');
    } catch {
      message.error('Clipboard unavailable');
    }
  };

  const handleClear = () => {
    setImageFile(null);
    setImageUrl('');
    setExtractedText('');
    setConfidence(null);
    setStepImages([]);
  };

  const wordCount = useMemo(() => {
    if (!extractedText.trim()) return 0;
    return extractedText.trim().split(/\s+/).length;
  }, [extractedText]);

  const charCount = extractedText.length;
  const lineCount = useMemo(
    () => (extractedText ? extractedText.split(/\r?\n/).length : 0),
    [extractedText],
  );

  const heroStatusTone: 'idle' | 'running' | 'success' | 'danger' = loading
    ? 'running'
    : confidence == null
      ? 'idle'
      : confidence >= 70
        ? 'success'
        : 'danger';
  const heroStatusLabel = loading
    ? 'Processing'
    : confidence == null
      ? imageFile
        ? 'Ready to extract'
        : 'Awaiting image'
      : `${Math.round(confidence)}% confidence`;

  const ghostButtonStyle = {
    background: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
  };

  const confidenceColor =
    confidence == null
      ? '#bfbfbf'
      : confidence >= 80
        ? '#52c41a'
        : confidence >= 50
          ? '#faad14'
          : '#ff4d4f';

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div className="container imageToTextPage">
        <div className="shell">
          {/* === Hero === */}
          <div className="hero">
            <div className="heroOverlay" />
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <ScanOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">OCR Studio</span>
                  <Title level={4} style={{ color: '#fff', margin: '4px 0 0', lineHeight: 1.25 }}>
                    Image to Text — extract every word with multi-language OCR
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    Powered by Tesseract.js · runs entirely in your browser · no uploads
                  </Text>
                </div>
                <span className={`heroStatus heroStatus-${heroStatusTone}`}>
                  <span className="heroStatusDot" />
                  {heroStatusLabel}
                </span>
              </div>
              <Space className="heroActions" wrap>
                <Button
                  className="primaryAction"
                  size="large"
                  icon={<ScanOutlined />}
                  loading={loading}
                  onClick={onProcess}
                  disabled={!imageFile}
                >
                  {loading ? 'Processing…' : 'Extract Text'}
                </Button>
                {imageFile && (
                  <Tooltip title="Remove image and clear results">
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={handleClear}
                      style={ghostButtonStyle}
                    >
                      Clear
                    </Button>
                  </Tooltip>
                )}
                {extractedText && (
                  <>
                    <Tooltip title="Copy text to clipboard">
                      <Button icon={<CopyOutlined />} onClick={handleCopy} style={ghostButtonStyle}>
                        Copy
                      </Button>
                    </Tooltip>
                    <Tooltip title="Download as .txt">
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => downloadText(extractedText)}
                        style={ghostButtonStyle}
                      >
                        Download
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Space>
            </div>
          </div>

          {/* === Stat strip === */}
          <div className="statStrip">
            <div className={`statChip ${imageFile ? 'success' : ''}`}>
              <span className="statIcon">
                <PictureOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Image</span>
                <span className="statValue">
                  {imageFile ? (
                    <>
                      <CheckCircleFilled
                        style={{ color: '#52c41a', marginRight: 4, fontSize: 12 }}
                      />
                      Loaded
                      <span className="statSub"> · {formatBytes(imageFile.size)}</span>
                    </>
                  ) : (
                    <>
                      <CloseCircleFilled
                        style={{ color: '#bfbfbf', marginRight: 4, fontSize: 12 }}
                      />
                      None
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <GlobalOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Languages</span>
                <span className="statValue">
                  {language.length}
                  <span className="statSub">
                    {' '}
                    ·{' '}
                    {language
                      .map((l) => LANG_OPTIONS.find((o) => o.value === l)?.label ?? l)
                      .join(', ')}
                  </span>
                </span>
              </div>
            </div>
            <div className={`statChip ${enhance ? 'success' : ''}`}>
              <span className="statIcon">
                <ThunderboltOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Enhancement</span>
                <span className="statValue">
                  {enhance ? 'On' : 'Off'}
                  <span className="statSub"> · contrast / sharpness</span>
                </span>
              </div>
            </div>
            <div
              className={`statChip ${
                confidence == null
                  ? ''
                  : confidence >= 80
                    ? 'success'
                    : confidence < 50
                      ? 'danger'
                      : ''
              }`}
            >
              <span className="statIcon">
                <ExperimentOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Confidence</span>
                <span className="statValue">
                  {confidence == null ? '—' : `${Math.round(confidence)}%`}
                </span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <FileTextOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Words</span>
                <span className="statValue">
                  {wordCount.toLocaleString()}
                  <span className="statSub">
                    {' '}
                    · {charCount.toLocaleString()} chars · {lineCount} lines
                  </span>
                </span>
              </div>
            </div>
          </div>

          <Tabs
            defaultActiveKey="workspace"
            items={[
              {
                key: 'workspace',
                label: (
                  <span>
                    <ScanOutlined /> Workspace
                  </span>
                ),
                children: (
                  <div className="tabBody">
                    <div className="workspace">
                      {/* Source */}
                      <div className="panel sourcePanel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <FileImageOutlined /> Source image
                          </span>
                          {imageFile && (
                            <Tag color="purple" style={{ margin: 0 }}>
                              {imageFile.type || 'image'} · {formatBytes(imageFile.size)}
                            </Tag>
                          )}
                        </div>

                        {!imageUrl ? (
                          <Dragger
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={handleUpload}
                            className="customDragger"
                          >
                            <p className="ant-upload-drag-icon">
                              <CloudUploadOutlined />
                            </p>
                            <p className="ant-upload-text">
                              Click or drag image to this area to upload
                            </p>
                            <p className="ant-upload-hint">
                              JPG / PNG / WebP / BMP — single image, processed in-browser only.
                            </p>
                          </Dragger>
                        ) : (
                          <div className="imagePreviewWrapper">
                            <Image src={imageUrl} alt="preview" className="previewImage" />
                            <div className="imageActions">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleClear}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="settingsBlock">
                          <div className="settingsHeader">
                            <SettingOutlined /> <strong>Settings</strong>
                          </div>
                          <div className="settingRow">
                            <Space>
                              <GlobalOutlined />
                              <Text>Language</Text>
                            </Space>
                            <Select
                              mode="multiple"
                              value={language}
                              onChange={setLanguage}
                              style={{ minWidth: 240, flex: 1 }}
                              maxTagCount="responsive"
                              options={LANG_OPTIONS}
                            />
                          </div>
                          <div className="settingRow">
                            <Space>
                              <ThunderboltOutlined />
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
                            className="processBtn"
                          >
                            {loading ? 'Processing…' : 'Extract Text'}
                          </Button>
                        </div>
                      </div>

                      {/* Output */}
                      <div className="panel outputPanel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <FileTextOutlined /> Extracted text
                          </span>
                          {extractedText && (
                            <Space size={6}>
                              <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                                Copy
                              </Button>
                              <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => downloadText(extractedText)}
                              >
                                Download
                              </Button>
                            </Space>
                          )}
                        </div>

                        {confidence !== null && !loading && (
                          <div className="confidenceMeter">
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Confidence
                            </Text>
                            <Progress
                              percent={Math.round(confidence)}
                              size="small"
                              strokeColor={confidenceColor}
                              status={
                                confidence > 80
                                  ? 'success'
                                  : confidence > 50
                                    ? 'normal'
                                    : 'exception'
                              }
                            />
                          </div>
                        )}

                        <div className="outputArea">
                          {loading ? (
                            <div className="loadingState">
                              <Spin size="large" />
                              <Text type="secondary" style={{ marginTop: 16 }}>
                                Analyzing image — this may take a few seconds…
                              </Text>
                            </div>
                          ) : extractedText ? (
                            <pre className="textContent">{extractedText}</pre>
                          ) : (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description={
                                imageFile
                                  ? 'Click "Extract Text" to run OCR'
                                  : 'Upload an image to start'
                              }
                            />
                          )}
                        </div>

                        {extractedText && !loading && (
                          <div className="outputFooter">
                            <Tag>{wordCount} words</Tag>
                            <Tag>{charCount} chars</Tag>
                            <Tag>{lineCount} lines</Tag>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'debug',
                label: (
                  <span>
                    <PictureOutlined /> Debug Steps
                    {stepImages.length > 0 && (
                      <Tag color="purple" style={{ marginLeft: 8 }}>
                        {stepImages.length}
                      </Tag>
                    )}
                  </span>
                ),
                children: (
                  <div className="tabBody">
                    <div className="panel">
                      <div className="panelHeader">
                        <span className="panelTitle">
                          <PictureOutlined /> Pre-processing pipeline
                        </span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Each step shows the image as it is transformed before OCR.
                        </Text>
                      </div>
                      {stepImages.length === 0 ? (
                        <Empty description="Run an OCR pass to see the pre-processing steps" />
                      ) : (
                        <div className="stepGrid">
                          {stepImages.map((src, idx) => (
                            <div key={idx} className="stepTile">
                              <div className="stepIndex">Step {idx + 1}</div>
                              <Image src={src} className="stepImage" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'guide',
                label: (
                  <span>
                    <BulbOutlined /> Guide
                  </span>
                ),
                children: (
                  <div className="tabBody">
                    <div className="guideGrid">
                      <div className="panel guideItem">
                        <div className="guideTitle">Best image quality</div>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          Use a sharp, well-lit image with high contrast between the text and
                          background. Aim for at least <Text strong>300 dpi</Text> or 1000+ pixels
                          on the long edge.
                        </Paragraph>
                      </div>
                      <div className="panel guideItem">
                        <div className="guideTitle">Pick the right languages</div>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          Tesseract loads a model per language — selecting only the languages
                          present in the image keeps recognition fast and accurate.
                        </Paragraph>
                      </div>
                      <div className="panel guideItem">
                        <div className="guideTitle">Auto Enhancement</div>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          Boosts contrast & sharpness and binarizes the image. Disable it for
                          already-clean scans where extra contrast can clip strokes.
                        </Paragraph>
                      </div>
                      <div className="panel guideItem">
                        <div className="guideTitle">Confidence score</div>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          <Tag color="success">≥ 80%</Tag> excellent ·{' '}
                          <Tag color="warning">50–80%</Tag> usable ·{' '}
                          <Tag color="error">&lt; 50%</Tag> unreliable — try a higher-resolution
                          image or different language.
                        </Paragraph>
                      </div>
                      <div className="panel guideItem">
                        <div className="guideTitle">Privacy</div>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          OCR runs entirely with WebAssembly in your browser. The image and
                          extracted text never leave your device.
                        </Paragraph>
                      </div>
                      <div className="panel guideItem">
                        <div className="guideTitle">Drag & drop</div>
                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          Drop an image anywhere on the page (not just the upload box) to load it.
                          The drop overlay highlights the entire workspace.
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
      {dragging && <DragOverlay />}
    </DragDropWrapper>
  );
};

export default ImageToText;
