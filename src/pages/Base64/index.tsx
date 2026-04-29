import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PictureOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import {
  Button,
  Empty,
  Image,
  Segmented,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import classNames from 'classnames';

import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { handleCopy } from '@/helpers';

import './styles.less';

const { Paragraph } = Typography;

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const detectMime = (dataUrl: string): string => {
  const m = /^data:([^;]+);base64,/.exec(dataUrl);
  return m?.[1] ?? '';
};

const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Base64Converter: React.FC = () => {
  const [base64, setBase64] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);

  // Text mode state
  const [textMode, setTextMode] = useState<'encode' | 'decode'>('encode');
  const [textInput, setTextInput] = useState<string>('');
  const [textOutput, setTextOutput] = useState<string>('');
  const [textError, setTextError] = useState<string>('');

  // Drag-drop
  const [dragging, setDragging] = useState(false);
  const dragCounter = React.useRef(0);

  /* ====== Image handlers ====== */
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBase64(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  // Probe image dimensions whenever the preview changes
  useEffect(() => {
    if (!imageUrl) {
      setImageDims(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setImageDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setImageDims(null);
    img.src = imageUrl;
  }, [imageUrl]);

  // Clipboard paste
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

  const handleBase64ToImage = () => {
    if (!base64.startsWith('data:image')) {
      message.error('Invalid Base64 image string. Must start with "data:image/...".');
      return;
    }
    setImageUrl(base64);
    message.success('Preview rendered from Base64.');
  };

  const copyImageBase64 = () => {
    if (!base64) {
      message.warning('Nothing to copy.');
      return;
    }
    handleCopy(base64, 'Copied Base64 string to clipboard!');
  };

  const downloadImage = () => {
    if (!imageUrl) {
      message.warning('No image to download.');
      return;
    }
    try {
      const mime = detectMime(imageUrl) || 'image/png';
      const ext = mime.split('/')[1] || 'png';
      const byteString = atob(imageUrl.split(',')[1]);
      const len = byteString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = byteString.charCodeAt(i);
      downloadBlob(new Blob([bytes], { type: mime }), `base64-image.${ext}`);
    } catch {
      message.error('Failed to decode Base64 image.');
    }
  };

  const clearImage = () => {
    setBase64('');
    setImageUrl('');
    setImageDims(null);
  };

  /* ====== Text handlers ====== */
  const runTextConversion = () => {
    setTextError('');
    if (!textInput) {
      setTextOutput('');
      return;
    }
    try {
      if (textMode === 'encode') {
        // UTF-8 safe encode
        const encoded = btoa(
          encodeURIComponent(textInput).replace(/%([0-9A-F]{2})/g, (_m, p1) =>
            String.fromCharCode(parseInt(p1, 16)),
          ),
        );
        setTextOutput(encoded);
      } else {
        const decoded = decodeURIComponent(
          atob(textInput.trim())
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        setTextOutput(decoded);
      }
    } catch (err) {
      const msg = textMode === 'decode' ? 'Invalid Base64 input.' : 'Failed to encode input.';
      setTextError(msg);
      setTextOutput('');
    }
  };

  // Auto-run conversion as user types
  useEffect(() => {
    runTextConversion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput, textMode]);

  const copyTextOutput = () => {
    if (!textOutput) {
      message.warning('Nothing to copy.');
      return;
    }
    handleCopy(textOutput, 'Copied result to clipboard!');
  };

  const swapTextIO = () => {
    setTextInput(textOutput);
    setTextOutput('');
  };

  const clearText = () => {
    setTextInput('');
    setTextOutput('');
    setTextError('');
  };

  /* ====== Derived ====== */
  const base64Size = base64.length;
  const mime = useMemo(() => detectMime(base64), [base64]);
  const isImageLoaded = !!imageUrl;
  const heroStatusTone = isImageLoaded ? 'success' : 'idle';
  const heroStatusLabel = isImageLoaded ? 'Image loaded' : 'No image';

  const guideContent = (
    <div className="guideGrid">
      <div className="guideItem">
        <span className="guideTitle">
          <UploadOutlined /> Drop, paste, browse
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Drag an image anywhere on this page, paste from clipboard with <kbd>Ctrl</kbd>+
          <kbd>V</kbd>, or click <em>Upload Image</em>.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <SwapOutlined /> Two-way conversion
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Paste a Base64 data URL into the editor and click <em>Render Preview</em> to decode it
          back into a viewable image.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <FileTextOutlined /> Text mode
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Switch to the <em>Text</em> tab to encode/decode arbitrary UTF-8 strings — useful for
          tokens, JWTs and credentials.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <DownloadOutlined /> Save the file
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Use <em>Download</em> to save the decoded image as a regular file with the correct
          extension based on the MIME type.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <ThunderboltOutlined /> 100% in-browser
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          All encoding and decoding runs locally — your files and text never leave the page.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <CodeOutlined /> Power tips
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          The editor supports word-wrap and free editing — tweak the data URL header or trim it
          before re-rendering.
        </Paragraph>
      </div>
    </div>
  );

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div className="container base64Page">
        <div className="shell">
          {dragging && <DragOverlay />}

          {/* === Hero === */}
          <div className="hero">
            <div className="heroOverlay" />
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <SwapOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">Encoding Lab</span>
                  <h1 className="heroTitle">
                    Base64 Converter — images &amp; text, both directions
                  </h1>
                  <p className="heroSubtitle">
                    Drop an image to get a Base64 data URL, paste a data URL to render it back, or
                    encode/decode UTF-8 text.
                  </p>
                </div>
              </div>
              <div className="heroActions">
                <span className={classNames('heroStatus', `heroStatus-${heroStatusTone}`)}>
                  <span className="heroStatusDot" />
                  {heroStatusLabel}
                </span>
                {isImageLoaded && (
                  <>
                    <Tooltip title="Copy Base64 string">
                      <Button ghost icon={<CopyOutlined />} onClick={copyImageBase64}>
                        Copy
                      </Button>
                    </Tooltip>
                    <Tooltip title="Download decoded image">
                      <Button ghost icon={<DownloadOutlined />} onClick={downloadImage}>
                        Download
                      </Button>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* === Stat strip === */}
          <div className="statStrip">
            <div className={classNames('statChip', { success: isImageLoaded })}>
              <span className="statIcon">
                {isImageLoaded ? <CheckCircleFilled /> : <CloseCircleFilled />}
              </span>
              <div className="statBody">
                <span className="statLabel">Image</span>
                <span className="statValue">{isImageLoaded ? 'Loaded' : 'None'}</span>
                <span className="statSub">
                  {isImageLoaded ? mime || 'image' : 'Upload to begin'}
                </span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <PictureOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Dimensions</span>
                <span className="statValue">
                  {imageDims ? `${imageDims.w} × ${imageDims.h}` : '—'}
                </span>
                <span className="statSub">pixels</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <CodeOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Base64 size</span>
                <span className="statValue">{formatBytes(base64Size)}</span>
                <span className="statSub">{base64Size.toLocaleString()} chars</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <FileTextOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Text mode</span>
                <span className="statValue">{textMode === 'encode' ? 'Encode' : 'Decode'}</span>
                <span className="statSub">
                  {textOutput ? `${textOutput.length.toLocaleString()} chars out` : 'Idle'}
                </span>
              </div>
            </div>
          </div>

          {/* === Tabs === */}
          <Tabs
            defaultActiveKey="image"
            items={[
              {
                key: 'image',
                label: (
                  <span>
                    <PictureOutlined /> Image ↔ Base64
                  </span>
                ),
                children: (
                  <div className="tabBody">
                    <div className="workspace">
                      {/* Source */}
                      <div className="panel sourcePanel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <PictureOutlined /> Source
                          </span>
                          <Space size={6}>
                            <Upload
                              beforeUpload={handleUpload}
                              showUploadList={false}
                              accept="image/*"
                            >
                              <Button size="small" icon={<UploadOutlined />}>
                                Upload
                              </Button>
                            </Upload>
                            {isImageLoaded && (
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={clearImage}
                              >
                                Clear
                              </Button>
                            )}
                          </Space>
                        </div>
                        <div className="imagePreviewWrapper">
                          {imageUrl ? (
                            <Image src={imageUrl} alt="Preview" className="previewImage" preview />
                          ) : (
                            <Empty
                              description="Drop, paste, or upload an image to convert"
                              style={{ padding: '32px 0' }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Output */}
                      <div className="panel outputPanel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <CodeOutlined /> Base64 Data
                          </span>
                          <Space size={6}>
                            <Button
                              size="small"
                              type="primary"
                              icon={<SwapOutlined />}
                              onClick={handleBase64ToImage}
                              disabled={!base64.startsWith('data:image')}
                            >
                              Render Preview
                            </Button>
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={copyImageBase64}
                              disabled={!base64}
                            >
                              Copy
                            </Button>
                          </Space>
                        </div>
                        <div className="editorWrap">
                          <Editor
                            height="320px"
                            defaultLanguage="plaintext"
                            value={base64}
                            onChange={(val) => setBase64(val || '')}
                            theme="vs-dark"
                            options={{
                              wordWrap: 'on',
                              minimap: { enabled: false },
                              lineNumbers: 'off',
                              scrollBeyondLastLine: false,
                              fontSize: 13,
                              padding: { top: 10 },
                            }}
                          />
                        </div>
                        <div className="outputFooter">
                          {mime && <Tag color="blue">{mime}</Tag>}
                          <Tag>{formatBytes(base64Size)}</Tag>
                          <Tag>{base64Size.toLocaleString()} chars</Tag>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'text',
                label: (
                  <span>
                    <FileTextOutlined /> Text ↔ Base64
                  </span>
                ),
                children: (
                  <div className="tabBody">
                    <div className="panel">
                      <div className="panelHeader">
                        <span className="panelTitle">
                          <FileTextOutlined /> Text Conversion
                        </span>
                        <Space size={8}>
                          <Segmented
                            value={textMode}
                            onChange={(v) => setTextMode(v as 'encode' | 'decode')}
                            options={[
                              { label: 'Encode', value: 'encode' },
                              { label: 'Decode', value: 'decode' },
                            ]}
                          />
                          <Button
                            size="small"
                            icon={<SwapOutlined />}
                            onClick={swapTextIO}
                            disabled={!textOutput}
                          >
                            Use output as input
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={clearText}
                            disabled={!textInput && !textOutput}
                          >
                            Clear
                          </Button>
                        </Space>
                      </div>
                      <div className="textGrid">
                        <div className="textBlock">
                          <span className="textLabel">
                            {textMode === 'encode' ? 'Plain text input' : 'Base64 input'}
                          </span>
                          <Editor
                            height="280px"
                            defaultLanguage="plaintext"
                            value={textInput}
                            onChange={(val) => setTextInput(val || '')}
                            theme="vs-dark"
                            options={{
                              wordWrap: 'on',
                              minimap: { enabled: false },
                              lineNumbers: 'off',
                              scrollBeyondLastLine: false,
                              fontSize: 13,
                              padding: { top: 10 },
                            }}
                          />
                        </div>
                        <div className="textBlock">
                          <div className="textLabelRow">
                            <span className="textLabel">
                              {textMode === 'encode' ? 'Base64 output' : 'Decoded text'}
                            </span>
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={copyTextOutput}
                              disabled={!textOutput}
                            >
                              Copy
                            </Button>
                          </div>
                          <Editor
                            height="280px"
                            defaultLanguage="plaintext"
                            value={textOutput}
                            theme="vs-dark"
                            options={{
                              wordWrap: 'on',
                              minimap: { enabled: false },
                              lineNumbers: 'off',
                              scrollBeyondLastLine: false,
                              fontSize: 13,
                              padding: { top: 10 },
                              readOnly: true,
                            }}
                          />
                          {textError && (
                            <span className="textError">
                              <CloseCircleFilled /> {textError}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'guide',
                label: (
                  <span>
                    <ThunderboltOutlined /> Guide
                  </span>
                ),
                children: <div className="tabBody">{guideContent}</div>,
              },
            ]}
          />
        </div>
      </div>
    </DragDropWrapper>
  );
};

export default Base64Converter;
