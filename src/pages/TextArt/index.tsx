import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BgColorsOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CloudUploadOutlined,
  ColumnWidthOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  MoonOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  InputNumber,
  Segmented,
  Select,
  Slider,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import classNames from 'classnames';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { SaveToDriveButton } from '@/components/GoogleDrive/DriveButtons';
import { handleCopy } from '@/helpers';

import './styles.less';

const { Paragraph } = Typography;

// Character sets for ASCII / text art generation
const CHARSETS = {
  classic: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  dots: '⠿⠾⠷⠶⠦⠤⠒⠂ ',
  punctuation: '@#$%&*?!;:,. ',
  emoji: '😀😄😆😅😂🤣😊🙂😉😋😎🤩😍🥰😘😗😙😚',
};

const CHARSET_LABELS: Record<keyof typeof CHARSETS, string> = {
  classic: 'Classic',
  blocks: 'Blocks',
  dots: 'Braille dots',
  punctuation: 'Punctuation',
  emoji: 'Emoji',
};

type ImageItem = {
  file: File;
  preview: string;
  asciiArt?: string;
  width?: number;
  height?: number;
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const TextArtPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [width, setWidth] = useState<number>(120);
  const [charset, setCharset] = useState<keyof typeof CHARSETS>('classic');
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<number>(10);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesEndRef = useRef<HTMLDivElement>(null);

  /* Clipboard paste */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItem = Array.from(items).find((i) => i.type.includes('image'));
      if (imageItem) {
        const blob = imageItem.getAsFile();
        if (blob) {
          handleUpload([blob]);
          message.success('Image pasted from clipboard!');
          e.preventDefault();
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  /* Re-convert when settings change */
  useEffect(() => {
    if (images.length > 0) handleConvertAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, charset, width]);

  const scrollToBottom = () => {
    imagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /* Upload */
  const handleUpload = (fileList: File[]) => {
    const newImages: ImageItem[] = [];
    let pending = fileList.length;
    if (!pending) return false;
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({ file, preview: e.target?.result as string });
        pending -= 1;
        if (pending === 0) {
          setImages((prev) => [...prev, ...newImages]);
          setTimeout(scrollToBottom, 120);
        }
      };
      reader.readAsDataURL(file);
    });
    setDragging(false);
    dragCounter.current = 0;
    return false;
  };

  /* Conversion */
  const generateTextArt = (img: HTMLImageElement): { text: string; w: number; h: number } => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const ratio = img.height / img.width;
    const w = Math.max(1, Math.round(width));
    const h = Math.round(w * ratio * 0.5);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch {
      return { text: '', w, h };
    }
    const chars = CHARSETS[charset];
    const step = 4;
    let text = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * step;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3 / 255;
        const idx = Math.floor(
          (mode === 'dark' ? 1 - brightness : brightness) * (chars.length - 1),
        );
        text += chars[idx];
      }
      text += '\n';
    }
    return { text, w, h };
  };

  const handleConvert = (index: number) => {
    const img = new window.Image();
    img.onload = () => {
      const { text, w, h } = generateTextArt(img);
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          asciiArt: text,
          width: w,
          height: h,
        };
        return updated;
      });
    };
    img.src = images[index].preview;
  };

  const handleConvertAll = async (notify = true) => {
    if (!images.length) return;
    const results = await Promise.all(
      images.map(
        (item) =>
          new Promise<ImageItem>((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              const { text, w, h } = generateTextArt(img);
              resolve({ ...item, asciiArt: text, width: w, height: h });
            };
            img.onerror = () => resolve(item);
            img.src = item.preview;
          }),
      ),
    );
    setImages(results);
    if (notify) message.success('All images converted to ASCII!');
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAll = () => {
    setImages([]);
    message.info('All images cleared.');
  };

  const handleDownload = (ascii: string, filename: string) => {
    const blob = new Blob([ascii], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (!images.length) return;
    const zip = new JSZip();
    images.forEach((img, idx) => {
      if (img.asciiArt) zip.file(`text-art-${idx + 1}.txt`, img.asciiArt);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'ascii-art-files.zip');
  };

  /* Derived */
  const convertedCount = useMemo(() => images.filter((i) => i.asciiArt).length, [images]);
  const totalChars = useMemo(
    () => images.reduce((acc, i) => acc + (i.asciiArt?.length ?? 0), 0),
    [images],
  );
  const totalSize = useMemo(() => images.reduce((acc, i) => acc + i.file.size, 0), [images]);

  const heroStatusTone: 'idle' | 'running' | 'success' =
    images.length === 0 ? 'idle' : convertedCount === images.length ? 'success' : 'running';
  const heroStatusLabel =
    images.length === 0
      ? 'Awaiting images'
      : convertedCount === images.length
        ? `${convertedCount}/${images.length} converted`
        : `${convertedCount}/${images.length} converted`;

  const settingsPanel = (
    <div className="settingsBlock">
      <div className="settingsHeader">
        <ExperimentOutlined /> Settings
      </div>
      <div className="settingRow">
        <span className="settingLabel">
          <ColumnWidthOutlined /> Width
        </span>
        <Space>
          <Slider
            min={20}
            max={400}
            value={width}
            onChange={(v) => setWidth(typeof v === 'number' ? v : 120)}
            style={{ width: 180 }}
          />
          <InputNumber
            min={10}
            max={1000}
            size="small"
            value={width}
            onChange={(v) => setWidth(v ?? 120)}
            style={{ width: 80 }}
          />
        </Space>
      </div>
      <div className="settingRow">
        <span className="settingLabel">
          <BgColorsOutlined /> Character set
        </span>
        <Select
          value={charset}
          onChange={setCharset}
          size="small"
          style={{ minWidth: 160 }}
          options={Object.keys(CHARSETS).map((k) => ({
            value: k,
            label: CHARSET_LABELS[k as keyof typeof CHARSETS],
          }))}
        />
      </div>
      <div className="settingRow">
        <span className="settingLabel">
          {mode === 'dark' ? <MoonOutlined /> : <BulbOutlined />} Theme
        </span>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'dark' | 'light')}
          options={[
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' },
          ]}
          size="small"
        />
      </div>
      <div className="settingRow">
        <span className="settingLabel">
          <FontSizeOutlined /> Font size
        </span>
        <Slider
          min={6}
          max={20}
          value={fontSize}
          onChange={(v) => setFontSize(typeof v === 'number' ? v : 10)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <Tag>{fontSize}px</Tag>
      </div>
    </div>
  );

  const guideContent = (
    <div className="guideGrid">
      <div className="guideItem">
        <span className="guideTitle">
          <CloudUploadOutlined /> Drop, paste, browse
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Drop multiple images on the page, paste from your clipboard with <kbd>Ctrl</kbd>+
          <kbd>V</kbd>, or click <em>Upload Images</em> to pick a batch.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <ColumnWidthOutlined /> Width controls density
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Higher width = more characters per row = sharper detail. 80–160 looks great for most
          photos.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <BgColorsOutlined /> Pick a character set
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          <strong>Classic</strong> for portraits, <strong>Blocks</strong> for posters,{' '}
          <strong>Dots</strong> for retro feel, <strong>Emoji</strong> for fun.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <MoonOutlined /> Dark vs. Light theme
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Dark inverts brightness so the result reads correctly on a dark background. Switch to
          Light when pasting into a doc.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <DownloadOutlined /> Save as text or ZIP
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Download a single piece as <code>.txt</code> or grab everything at once via{' '}
          <em>Download All</em> (ZIP).
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <ThunderboltOutlined /> 100% in-browser
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          The pixels never leave your machine — everything is rendered with a hidden canvas right
          here.
        </Paragraph>
      </div>
    </div>
  );

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
      multiple
    >
      <div className="container textArtPage">
        <div className="shell">
          {dragging && <DragOverlay />}

          {/* === Hero === */}
          <div className="hero">
            <div className="heroOverlay" />
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <FontSizeOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">ASCII Lab</span>
                  <h1 className="heroTitle">
                    Text Art Generator — turn images into ASCII masterpieces
                  </h1>
                  <p className="heroSubtitle">
                    Drop a batch of photos, pick a character set, and watch every pixel become text
                    — all rendered in your browser.
                  </p>
                </div>
              </div>
              <div className="heroActions">
                <span className={classNames('heroStatus', `heroStatus-${heroStatusTone}`)}>
                  <span className="heroStatusDot" />
                  {heroStatusLabel}
                </span>
                <Upload
                  beforeUpload={(file) => {
                    handleUpload([file]);
                    return false;
                  }}
                  multiple
                  showUploadList={false}
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                >
                  <Button className="primaryAction" icon={<UploadOutlined />}>
                    Upload Images
                  </Button>
                </Upload>
                {images.length > 0 && (
                  <>
                    <Tooltip title="Convert every uploaded image">
                      <Button
                        ghost
                        icon={<ExperimentOutlined />}
                        onClick={() => handleConvertAll()}
                      >
                        Re-convert
                      </Button>
                    </Tooltip>
                    <Tooltip title="Download all results as a ZIP">
                      <Button
                        ghost
                        icon={<DownloadOutlined />}
                        disabled={convertedCount === 0}
                        onClick={handleDownloadAll}
                      >
                        ZIP
                      </Button>
                    </Tooltip>
                    <Tooltip title="Clear all uploaded images">
                      <Button ghost icon={<DeleteOutlined />} onClick={handleRemoveAll}>
                        Clear
                      </Button>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* === Stat strip === */}
          <div className="statStrip">
            <div className={classNames('statChip', { success: images.length > 0 })}>
              <span className="statIcon">
                {images.length > 0 ? <CheckCircleFilled /> : <CloseCircleFilled />}
              </span>
              <div className="statBody">
                <span className="statLabel">Images</span>
                <span className="statValue">{images.length}</span>
                <span className="statSub">{formatBytes(totalSize)} total</span>
              </div>
            </div>
            <div
              className={classNames('statChip', {
                success: convertedCount > 0 && convertedCount === images.length,
                danger: images.length > 0 && convertedCount === 0,
              })}
            >
              <span className="statIcon">
                <ExperimentOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Converted</span>
                <span className="statValue">
                  {convertedCount}/{images.length}
                </span>
                <span className="statSub">
                  {totalChars ? `${totalChars.toLocaleString()} chars total` : 'Run conversion'}
                </span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <ColumnWidthOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Width</span>
                <span className="statValue">{width}</span>
                <span className="statSub">columns of characters</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <BgColorsOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Character set</span>
                <span className="statValue">{CHARSET_LABELS[charset]}</span>
                <span className="statSub">{CHARSETS[charset].length} symbols</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                {mode === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
              </span>
              <div className="statBody">
                <span className="statLabel">Theme</span>
                <span className="statValue">{mode === 'dark' ? 'Dark' : 'Light'}</span>
                <span className="statSub">
                  {mode === 'dark' ? 'Inverted brightness' : 'Direct brightness'}
                </span>
              </div>
            </div>
          </div>

          {/* === Tabs === */}
          <Tabs
            defaultActiveKey="workspace"
            items={[
              {
                key: 'workspace',
                label: (
                  <span>
                    <PictureOutlined /> Workspace
                  </span>
                ),
                children: (
                  <div className="tabBody">
                    <div className="workspace">
                      <div className="panel sourcePanel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <ExperimentOutlined /> Settings
                          </span>
                          {convertedCount > 0 && (
                            <SaveToDriveButton
                              getContent={() =>
                                images
                                  .filter((i) => i.asciiArt)
                                  .map((i, idx) => `--- text-art-${idx + 1} ---\n${i.asciiArt}`)
                                  .join('\n\n')
                              }
                              fileName="ascii-art.txt"
                              mimeType="text/plain"
                              buttonProps={{ size: 'small' }}
                            >
                              Save to Drive
                            </SaveToDriveButton>
                          )}
                        </div>
                        {settingsPanel}
                      </div>

                      <div className="panel outputPanel">
                        <div className="panelHeader">
                          <span className="panelTitle">
                            <FileImageOutlined /> Results
                          </span>
                          <Space size={6}>
                            <Tag color="purple">
                              {convertedCount}/{images.length} converted
                            </Tag>
                            {totalChars > 0 && <Tag>{totalChars.toLocaleString()} chars</Tag>}
                          </Space>
                        </div>

                        {images.length === 0 ? (
                          <Empty
                            description="Drop images, paste from clipboard, or click Upload"
                            style={{ padding: '32px 0' }}
                          />
                        ) : (
                          <div className="resultsList">
                            {images.map((img, index) => (
                              <div className="resultItem" key={index}>
                                <div className="resultRow">
                                  <img src={img.preview} alt="preview" className="resultThumb" />
                                  <div className="resultMeta">
                                    <span className="resultTitle">Image {index + 1}</span>
                                    <span className="resultSubtitle">
                                      {img.file.name} · {formatBytes(img.file.size)}
                                    </span>
                                    <Space size={4} wrap>
                                      {img.width && img.height && (
                                        <Tag color="blue">
                                          {img.width} × {img.height}
                                        </Tag>
                                      )}
                                      {img.asciiArt ? (
                                        <Tag color="green">
                                          {img.asciiArt.length.toLocaleString()} chars
                                        </Tag>
                                      ) : (
                                        <Tag>Not converted</Tag>
                                      )}
                                    </Space>
                                  </div>
                                  <Space size={4} wrap>
                                    <Tooltip title="Convert this image">
                                      <Button
                                        size="small"
                                        icon={<ExperimentOutlined />}
                                        onClick={() => handleConvert(index)}
                                      />
                                    </Tooltip>
                                    <Tooltip title="Copy ASCII art">
                                      <Button
                                        size="small"
                                        icon={<CopyOutlined />}
                                        disabled={!img.asciiArt}
                                        onClick={() =>
                                          img.asciiArt && handleCopy(img.asciiArt, 'Copied!')
                                        }
                                      />
                                    </Tooltip>
                                    <Tooltip title="Download as .txt">
                                      <Button
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        disabled={!img.asciiArt}
                                        onClick={() =>
                                          img.asciiArt &&
                                          handleDownload(img.asciiArt, `text-art-${index + 1}.txt`)
                                        }
                                      />
                                    </Tooltip>
                                    <Tooltip title="Remove this image">
                                      <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemove(index)}
                                      />
                                    </Tooltip>
                                  </Space>
                                </div>

                                {img.asciiArt && (
                                  <pre
                                    className={classNames('asciiOutput', mode)}
                                    style={{
                                      fontSize: `${fontSize}px`,
                                      lineHeight: `${fontSize}px`,
                                    }}
                                  >
                                    <code>{img.asciiArt}</code>
                                  </pre>
                                )}
                              </div>
                            ))}
                            <div ref={imagesEndRef} />
                          </div>
                        )}
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

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </DragDropWrapper>
  );
};

export default TextArtPage;
