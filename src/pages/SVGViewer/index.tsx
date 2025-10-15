import React, { useState } from 'react'; // Import React and useState hook
import { Upload, Button, Card, Space, message, Segmented, Typography, Tabs } from 'antd'; // Import Ant Design components
import {
  UploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HighlightOutlined,
  CompressOutlined,
} from '@ant-design/icons'; // Import icons
import { Editor } from '@monaco-editor/react'; // Import Monaco Editor component
import { optimize } from 'svgo'; // Import SVG optimizer
import { handleCopy } from '@/helpers'; // Import custom copy helper
import styles from './styles.less'; // Import CSS module

const { Text } = Typography; // Destructure Text component from Typography

const SVGViewer: React.FC = () => {
  // --- State variables ---
  const [svgCode, setSvgCode] = useState<string>(''); // Store the raw SVG code
  const [preview, setPreview] = useState<string>(''); // Store SVG preview HTML
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey'); // Background mode
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after?: number } | null>(null); // Store size info before/after optimization
  const [activeTab, setActiveTab] = useState<string>('svg'); // Active preview tab

  // --- Function to handle SVG file upload ---
  const handleUpload = (file: File) => {
    const reader = new FileReader(); // Create a FileReader instance
    reader.onload = (e) => {
      const result = e.target?.result as string; // Get file content as string
      if (!result.includes('<svg')) {
        // Validate that the file contains <svg>
        message.error('Invalid SVG file'); // Show error if not
        return;
      }
      setSvgCode(result); // Set SVG code state
      setPreview(result); // Set preview state
      setSizeInfo({ before: new Blob([result]).size }); // Save original file size
    };
    reader.readAsText(file); // Read the file as text
    return false; // Prevent default upload behavior
  };

  // --- Copy SVG code to clipboard ---
  const handleCopyCode = () => handleCopy(svgCode, 'Copied SVG code to clipboard!');

  // --- Clear SVG code and preview ---
  const handleClear = () => {
    setSvgCode(''); // Clear SVG code
    setPreview(''); // Clear preview
    setSizeInfo(null); // Clear size info
  };

  // --- Download SVG or other data as file ---
  const handleDownload = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type }); // Create a blob from data
    const link = document.createElement('a'); // Create an anchor element
    link.href = URL.createObjectURL(blob); // Set href to blob URL
    link.download = filename; // Set file name
    link.click(); // Trigger download
    URL.revokeObjectURL(link.href); // Clean up URL object
  };

  // --- Prettify SVG code ---
  const prettifySVG = () => {
    if (!svgCode.trim()) {
      // Check if SVG code exists
      message.warning('No SVG code to prettify.');
      return;
    }
    try {
      const pretty = formatXML(svgCode); // Format SVG XML
      setSvgCode(pretty); // Update SVG code state
      setPreview(pretty); // Update preview
      message.success('SVG prettified!');
    } catch (err) {
      console.error(err); // Log error
      message.error('Failed to prettify SVG.');
    }
  };

  // --- Helper function to format XML ---
  const formatXML = (xml: string) => {
    xml = xml.replace(/>\s+</g, '><').replace(/\r|\n/g, '').trim(); // Remove whitespace between tags and newlines
    xml = xml.replace(/(>)(<)(\/*)/g, '$1\n$2$3'); // Add newline between tags
    const lines = xml.split('\n'); // Split XML into lines
    let indentLevel = 0; // Initialize indentation level
    const formattedLines: string[] = []; // Store formatted lines

    lines.forEach((line) => {
      if (line.match(/^<\/\w/)) indentLevel--; // Decrease indent for closing tags
      const padding = '  '.repeat(indentLevel); // Create padding string
      let formattedLine = padding + line.trim(); // Apply padding
      if (formattedLine.match(/^<\w.*\s+\w+=/)) {
        // If tag has attributes
        formattedLine = formattedLine.replace(/(\s+\w+=)/g, '\n' + padding + '  $1'); // Put each attribute on a new line
      }
      formattedLines.push(formattedLine); // Add formatted line to array
      if (line.match(/^<\w[^>]*[^/]>$/)) indentLevel++; // Increase indent for opening tag
    });

    return formattedLines.join('\n').trim(); // Join all lines
  };

  // --- Optimize SVG using SVGO ---
  const handleOptimize = () => {
    if (!svgCode.trim()) {
      // Check if SVG code exists
      message.warning('No SVG code to optimize.');
      return;
    }
    try {
      const beforeSize = new Blob([svgCode]).size; // Get original size
      const result = optimize(svgCode, { multipass: true }); // Optimize SVG
      let optimized = result.data; // Get optimized code

      // Remove unnecessary whitespace
      optimized = optimized
        .replace(/\n+/g, '')
        .replace(/\r+/g, '')
        .replace(/\t+/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/> </g, '><')
        .trim();

      const afterSize = new Blob([optimized]).size; // Get optimized size
      setSvgCode(optimized); // Update SVG code
      setPreview(optimized); // Update preview
      setSizeInfo({ before: beforeSize, after: afterSize }); // Update size info

      const percent = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1); // Calculate reduction
      message.success(`SVG optimized! Reduced by ${percent}%`);
    } catch (err) {
      console.error(err);
      message.error('Failed to optimize SVG.');
    }
  };

  // --- Generate Data URI string ---
  const getDataURI = () => `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`;

  // --- Generate Base64 string ---
  const getBase64 = () =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;

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
    <Card title="🧩 SVG Viewer" bordered={false} className={styles.container}>
      <div className={styles.content}>
        {/* Left Side - Editor */}
        <div className={styles.editorSection}>
          <Space className={styles.topActions} style={{ marginTop: 12, marginBottom: 8 }} wrap>
            <Upload beforeUpload={handleUpload} showUploadList={false} accept=".svg">
              <Button icon={<UploadOutlined />}>Upload SVG</Button>
            </Upload>
            <Button onClick={prettifySVG} icon={<HighlightOutlined />}>
              Prettify
            </Button>
            <Button onClick={handleOptimize} icon={<CompressOutlined />}>
              Optimize
            </Button>
          </Space>

          {/* Show size info */}
          {sizeInfo && (
            <Text type="secondary" className="mb-2 block">
              Size: <b>{(sizeInfo.before / 1024).toFixed(2)} KB</b>
              {sizeInfo.after && (
                <>
                  {' '}
                  → <b>{(sizeInfo.after / 1024).toFixed(2)} KB</b> (
                  {(((sizeInfo.before - sizeInfo.after) / sizeInfo.before) * 100).toFixed(1)}%
                  smaller)
                </>
              )}
            </Text>
          )}

          {/* Editor */}
          <div className={styles.editorBox}>
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={svgCode}
              onChange={(val) => {
                setSvgCode(val || '');
                setPreview(val || '');
              }} // Update states on change
              theme="vs-light"
              options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 14 }}
            />
          </div>

          {/* Editor actions */}
          <Space className={styles.actions} wrap>
            <Button type="primary" onClick={handleCopyCode} icon={<CopyOutlined />}>
              Copy
            </Button>
            <Button danger onClick={handleClear} icon={<DeleteOutlined />}>
              Clear
            </Button>
          </Space>
        </div>

        {/* Right Side - Preview */}
        <div className={styles.previewWrapper}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={[
              {
                key: 'svg',
                label: 'SVG',
                children: (
                  <div
                    className={`${styles.previewSection} ${styles[bgMode]}`}
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
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
                children: <pre className={`${styles.previewCodeBox}`}>{getDataURI()}</pre>,
              },
              {
                key: 'base64',
                label: 'Base64',
                children: <pre className={`${styles.previewCodeBox}`}>{getBase64()}</pre>,
              },
            ]}
          />

          {/* Bottom-left: background mode switch */}
          <div className={styles.previewFooter}>
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
      </div>
    </Card>
  );
};

export default SVGViewer;
