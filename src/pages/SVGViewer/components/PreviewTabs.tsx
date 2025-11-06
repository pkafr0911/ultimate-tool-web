import React, { useState } from 'react';
import { Tabs, Button, Space, Segmented, Tooltip, Typography, message } from 'antd'; // Import Ant Design components
import {
  MinusOutlined,
  PlusOutlined,
  SyncOutlined,
  DownloadOutlined,
  CopyOutlined,
} from '@ant-design/icons'; // Import icons
import styles from '../styles.less'; // Import CSS module

const { Text } = Typography;

type Props = {
  preview: string;
  svgCode: string;
  handleDownload: (content: string, name: string, type: string) => void;
  handleCopy: (val: string, msg: string) => void;
  svgContainerRef: React.RefObject<HTMLDivElement>;
  getDataURI: () => string;
  getBase64: () => string;
};

const PreviewTabs: React.FC<Props> = ({
  preview,
  svgCode,
  handleDownload,
  handleCopy,
  svgContainerRef,
  getDataURI,
  getBase64,
}) => {
  // --- State variables ---
  const [activeTab, setActiveTab] = useState<string>('svg'); // Active preview tab
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey'); // Background mode

  const [zoom, setZoom] = useState(1); // 1 = 100%
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3)); // up to 300%
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.2)); // down to 20%
  const handleResetZoom = () => setZoom(1);

  // --- Convert SVG to Canvas image (PNG or ICO) ---
  const svgToCanvas = async (mimeType: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image(); // Create image element
      img.onload = () => {
        const canvas = document.createElement('canvas'); // Create canvas
        canvas.width = img.width; // Set width
        canvas.height = img.height; // Set height
        const ctx = canvas.getContext('2d'); // Get 2D context
        if (!ctx) return reject('Canvas context not found'); // Error if context missing
        ctx.drawImage(img, 0, 0); // Draw image on canvas
        resolve(canvas.toDataURL(mimeType)); // Return as data URL
      };
      img.onerror = reject; // Reject on load error
      img.src = getDataURI(); // Set image source
    });
  };

  // --- Download PNG ---
  const handleDownloadPng = async () => {
    try {
      const dataUrl = await svgToCanvas('image/png'); // Convert SVG to PNG
      const link = document.createElement('a'); // Create link
      link.href = dataUrl;
      link.download = 'image.png'; // Set filename
      link.click(); // Trigger download
    } catch {
      message.error('Failed to convert to PNG.');
    }
  };

  // --- Download ICO ---
  const handleDownloadIco = async () => {
    try {
      const dataUrl = await svgToCanvas('image/x-icon'); // Convert SVG to ICO
      const link = document.createElement('a'); // Create link
      link.href = dataUrl;
      link.download = 'favicon.ico'; // Set filename
      link.click(); // Trigger download
    } catch {
      message.error('Failed to convert to ICO.');
    }
  };
  return (
    <div className={styles.previewWrapper}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={[
          {
            key: 'svg',
            label: 'SVG',
            children: (
              <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                <div
                  ref={svgContainerRef}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left', // ensure scaling doesn't cut off top-left
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'inline-block',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: preview
                      .split('<!-- New SVG appended -->')
                      .map((part, i) => `<div>${part}</div>`)
                      .join(''),
                  }}
                />
              </div>
            ),
          },
          {
            key: 'png',
            label: 'PNG',
            children: (
              <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                <img src={getDataURI()} alt="PNG preview" style={{ maxWidth: '100%' }} />
              </div>
            ),
          },
          {
            key: 'ico',
            label: 'ICO',
            children: (
              <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                <img src={getDataURI()} alt="ICO preview" style={{ maxWidth: '100%' }} />
              </div>
            ),
          },
          {
            key: 'datauri',
            label: 'Data URI',
            children: <pre className={styles.previewCodeBox}>{getDataURI()}</pre>,
          },
          {
            key: 'base64',
            label: 'Base64',
            children: <pre className={styles.previewCodeBox}>{getBase64()}</pre>,
          },
        ]}
      />

      {/* Bottom-left: background mode switch */}
      <div className={styles.previewFooter}>
        <Space>
          <Segmented
            options={[
              { label: 'Transparent', value: 'transparent' },
              { label: 'White', value: 'white' },
              { label: 'Grey', value: 'grey' },
              { label: 'Black', value: 'black' },
            ]}
            value={bgMode}
            onChange={(val) => setBgMode(val as any)}
          />
          <Tooltip title="Zoom Out">
            <Button icon={<MinusOutlined />} onClick={handleZoomOut} />
          </Tooltip>
          <Tooltip title="Zoom In">
            <Button icon={<PlusOutlined />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <Button icon={<SyncOutlined />} onClick={handleResetZoom} />
          </Tooltip>
          <Text type="secondary">{Math.round(zoom * 100)}%</Text>
        </Space>
      </div>

      {/* Bottom-right: download / copy actions */}
      <div className={styles.previewActions}>
        {['svg', 'png', 'ico'].includes(activeTab) && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={
              activeTab === 'svg'
                ? () => handleDownload(svgCode, 'image.svg', 'image/svg+xml')
                : activeTab === 'png'
                  ? handleDownloadPng
                  : handleDownloadIco
            }
          >
            Download {activeTab.toUpperCase()}
          </Button>
        )}
        {['datauri', 'base64'].includes(activeTab) && (
          <Button
            icon={<CopyOutlined />}
            onClick={() =>
              handleCopy(
                activeTab === 'datauri' ? getDataURI() : getBase64(),
                `Copied ${activeTab.toUpperCase()} to clipboard!`,
              )
            }
          >
            Copy {activeTab.toUpperCase()}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PreviewTabs;
