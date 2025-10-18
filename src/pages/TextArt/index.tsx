import { handleCopy } from '@/helpers';
import { CopyOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, InputNumber, Select, Space, Typography, Upload } from 'antd';
import React, { useRef, useState } from 'react';
import './styles.less';

const { Text, Title } = Typography;

// Predefined character sets for generating ASCII / text art
const CHARSETS = {
  classic: '@%#*+=-:. ', // Traditional ASCII art characters
  blocks: '█▓▒░ ', // Block-style characters
  dots: '⠿⠾⠷⠶⠦⠤⠒⠂ ', // Braille/dot characters
  emoji: '😀😄😆😅😂🤣😊🙂😉😋😎🤩😍🥰😘😗😙😚', // Emoji set
};

const TextArtPage: React.FC = () => {
  // State to store generated ASCII art
  const [asciiArt, setAsciiArt] = useState('');
  // State for the width of the generated ASCII art
  const [width, setWidth] = useState(100);
  // State to select which character set to use
  const [charset, setCharset] = useState<keyof typeof CHARSETS>('classic');
  // Loading state (could be used for future loading indicators)
  const [, setLoading] = useState(false);
  // Reference to hidden canvas used for image processing
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle image upload
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    // When file is read, create an Image object
    reader.onload = (e) => {
      const img = new Image();
      // When the image is loaded, generate the ASCII art
      img.onload = () => generateTextArt(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file); // Read file as base64
    return false; // Prevent automatic upload by Ant Design
  };

  // Generate ASCII/text art from an image
  const generateTextArt = (img: HTMLImageElement) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const ratio = img.height / img.width;
    const w = width; // user-defined width
    const h = Math.round(w * ratio * 0.5); // height scaled for character aspect ratio

    canvas.width = w;
    canvas.height = h;
    // Draw the image onto the canvas at the scaled size
    ctx.drawImage(img, 0, 0, w, h);

    // Extract pixel data from the canvas
    const data = ctx.getImageData(0, 0, w, h).data;
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
        const index = Math.floor((1 - brightness) * (chars.length - 1)); // invert brightness
        text += chars[index]; // append character
      }
      text += '\n'; // new line after each row
    }

    setAsciiArt(text); // update state
    setLoading(false);
  };

  // Download ASCII art as a .txt file
  const handleDownload = () => {
    const blob = new Blob([asciiArt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-art.txt';
    a.click(); // trigger download
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-art-page">
      <Card title="🖼️ Image → Text Art Generator Generator" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Upload and settings section */}
          <Space>
            <Upload beforeUpload={handleUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
            <InputNumber
              min={40}
              max={300}
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
          </Space>

          {/* Action buttons */}
          <Space>
            <Button
              onClick={() => handleCopy(asciiArt, 'Copied to clipboard!')}
              icon={<CopyOutlined />}
              disabled={!asciiArt}
            >
              Copy
            </Button>
            <Button onClick={handleDownload} icon={<DownloadOutlined />} disabled={!asciiArt}>
              Download
            </Button>
          </Space>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Display generated ASCII art */}
          {asciiArt && (
            <pre className="ascii-output">
              <code>{asciiArt}</code>
            </pre>
          )}

          {/* Placeholder text when no ASCII art is generated */}
          {!asciiArt && <Text type="secondary">Upload an image to generate ASCII art.</Text>}
        </Space>
      </Card>
    </div>
  );
};

export default TextArtPage;
