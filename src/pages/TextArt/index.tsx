import { handleCopy } from '@/helpers';
import {
  BulbOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  MoonOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  InputNumber,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import React, { useEffect, useRef, useState } from 'react';
import './styles.less';
import DragOverlay from '@/components/DragOverlay';

const { Text } = Typography;

// Character sets for ASCII / text art generation
const CHARSETS = {
  // Classic gradient from dense to light
  classic: '@%#*+=-:. ',

  // Blocky style
  blocks: '█▓▒░ ',

  // Braille/dot style
  dots: '⠿⠾⠷⠶⠦⠤⠒⠂ ',

  // Punctuation for strong contrast
  punctuation: '@#$%&*?!;:,. ',

  // Emoji fun
  emoji: '😀😄😆😅😂🤣😊🙂😉😋😎🤩😍🥰😘😗😙😚',
};

// Define Image item type
type ImageItem = {
  file: File;
  preview: string;
  asciiArt?: string;
};

const TextArtPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]); // Store uploaded images
  const [width, setWidth] = useState(100); // Width of ASCII output
  const [charset, setCharset] = useState<keyof typeof CHARSETS>('classic'); // Selected charset
  const [dragging, setDragging] = useState(false); // Drag state
  const [, setLoading] = useState(false); // Optional loading indicator
  const dragCounter = useRef(0); // To track nested drag events
  const canvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for image processing
  const [mode, setMode] = useState<'dark' | 'light'>('dark'); // Dark/light mode
  const imagesEndRef = useRef<HTMLDivElement>(null);

  /** When mode change convert all the images again */
  useEffect(() => {
    if (images.length > 0) handleConvertAll();
  }, [mode, charset]);

  /** Scroll to bottom when new images uploaded */
  const scrollToBottom = () => {
    imagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /** Handle file uploads */
  const handleUpload = (fileList: File[]) => {
    const newImages: ImageItem[] = [];
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({ file, preview: e.target?.result as string });
        if (newImages.length === fileList.length) {
          setImages((prev) => [...prev, ...newImages]);
          setTimeout(scrollToBottom, 100); // Wait for render
        }
      };
      reader.readAsDataURL(file);
    });
    setDragging(false); // Reset drag state after upload
    dragCounter.current = 0;
    return false;
  };

  /** Generate ASCII text from an image element */
  const generateTextArt = (img: HTMLImageElement) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const ratio = img.height / img.width;
    const w = Math.max(1, Math.round(width)); // user-defined width
    const h = Math.round(w * ratio * 0.5); // height scaled for character aspect ratio

    canvas.width = w;
    canvas.height = h;
    // Draw the image onto the canvas at the scaled size
    ctx.drawImage(img, 0, 0, w, h);

    // Extract pixel data from the canvas
    let data;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch (err) {
      console.error('Canvas getImageData failed', err);
      return '';
    }
    const chars = CHARSETS[charset];
    const step = 4; // Each pixel has 4 values: r,g,b,a
    let text = '';

    // Loop through every pixel to map brightness to a character
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * step; // index in the data array
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        const brightness = (r + g + b) / 3 / 255; // average brightness 0-1
        const index = Math.floor(
          (mode === 'dark' ? 1 - brightness : brightness) * (chars.length - 1),
        ); // if mode is dark 1 - brightness to invert brightness
        text += chars[index]; // append character
      }
      text += '\n'; // new line after each row
    }
    return text;
  };

  /** Convert a specific image */
  const handleConvert = (index: number) => {
    const img = new Image();
    img.onload = () => {
      const text = generateTextArt(img);
      setImages((prev) => {
        const updated = [...prev];
        updated[index].asciiArt = text;
        return updated;
      });
      setLoading(false);
    };
    img.src = images[index].preview;
  };

  /** Convert all uploaded images */
  const handleConvertAll = () => {
    setLoading(true);
    const updated = images.map((img) => {
      const imageObj = new Image();
      imageObj.src = img.preview;
      return { ...img, asciiArt: generateTextArt(imageObj) };
    });
    setImages(updated);
    setLoading(false);
    message.success('All images converted to ASCII!');
  };

  /** Remove a specific image */
  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /** Remove all images */
  const handleRemoveAll = () => {
    setImages([]);
    message.info('All images cleared.');
  };

  /** Download ASCII art as text file */
  const handleDownload = (ascii: string, filename: string) => {
    const blob = new Blob([ascii], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Download all ASCII art files as a single ZIP */
  const handleDownloadAll = async () => {
    if (!images.length) return;

    const zip = new JSZip();
    images.forEach((img, index) => {
      if (img.asciiArt) {
        zip.file(`text-art-${index + 1}.txt`, img.asciiArt);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'ascii-art-files.zip');
  };

  return (
    <div
      className="text-art-page"
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        dragCounter.current = 0;
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleUpload(files);
      }}
    >
      <Card title="🖼️ Multi Image → ASCII Text Art Generator" variant={'borderless'}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Drag-and-drop overlay */}
          {dragging && <DragOverlay />}

          {/* File upload button */}
          <Upload
            beforeUpload={(file) => {
              handleUpload([file]);
              return false;
            }}
            multiple
            showUploadList={false}
            accept=".png,.jpg,.jpeg,.gif"
          >
            <Button icon={<UploadOutlined />}>Upload Images</Button>
          </Upload>

          {/* Settings: width and charset */}
          <Space wrap>
            <InputNumber
              min={10}
              max={1000}
              value={width}
              onChange={(v) => setWidth(v || 100)}
              addonBefore="Width"
            />
            <Select value={charset} onChange={setCharset}>
              {Object.keys(CHARSETS).map((key) => (
                <Select.Option key={key} value={key}>
                  {key}
                </Select.Option>
              ))}
            </Select>
            {'|'}
            {/* Toggle mode button in the UI */}
            <Space>
              <Tooltip title={`Current mode: ${mode === 'dark' ? 'Dark' : 'Light'}`}>
                <Switch
                  checked={mode === 'dark'}
                  onChange={(checked) => setMode(checked ? 'dark' : 'light')}
                />
              </Tooltip>
              {mode === 'dark' ? (
                <MoonOutlined style={{ color: mode === 'dark' ? '#1890ff' : '#888' }} />
              ) : (
                <BulbOutlined style={{ color: mode === 'light' ? '#ffc107' : '#888' }} />
              )}
            </Space>
          </Space>

          {/* Global actions */}
          {images.length > 0 && (
            <Space wrap>
              <Button type="primary" icon={<ExperimentOutlined />} onClick={handleConvertAll}>
                Convert All
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadAll}
                disabled={!images.some((img) => img.asciiArt)}
              >
                Download All
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleRemoveAll}>
                Remove All
              </Button>
            </Space>
          )}

          {/* Render each uploaded image */}
          {images.map((img, index) => (
            <Card key={index} size="small" style={{ marginBottom: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={img.preview}
                    alt="preview"
                    style={{
                      maxWidth: 100,
                      maxHeight: 100,
                      borderRadius: 6,
                      border: '1px solid #eee',
                    }}
                  />
                  <Space wrap>
                    <Tooltip title="Convert this image to ASCII art">
                      <Button icon={<ExperimentOutlined />} onClick={() => handleConvert(index)} />
                    </Tooltip>

                    <Tooltip title="Copy ASCII art to clipboard">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => img.asciiArt && handleCopy(img.asciiArt, 'Copied!')}
                        disabled={!img.asciiArt}
                      />
                    </Tooltip>

                    <Tooltip title="Download ASCII art as text file">
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          img.asciiArt && handleDownload(img.asciiArt, `text-art-${index + 1}.txt`)
                        }
                        disabled={!img.asciiArt}
                      />
                    </Tooltip>

                    <Tooltip title="Remove this image">
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(index)}
                      />
                    </Tooltip>
                  </Space>
                </div>

                {/* Display ASCII output */}
                {img.asciiArt && (
                  <pre className={`ascii-output ${mode}`}>
                    <code>{img.asciiArt}</code>
                  </pre>
                )}
              </Space>
            </Card>
          ))}

          <div ref={imagesEndRef} />

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {!images.length && <Text type="secondary">Upload images to generate ASCII art.</Text>}
        </Space>
      </Card>
    </div>
  );
};

export default TextArtPage;
