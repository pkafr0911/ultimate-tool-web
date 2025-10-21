import { handleCopy } from '@/helpers'; // Import custom copy helper
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HighlightOutlined,
  MinusOutlined,
  PlusOutlined,
  SwapOutlined,
  SyncOutlined,
  UploadOutlined,
} from '@ant-design/icons'; // Import icons
import { Editor } from '@monaco-editor/react'; // Import Monaco Editor component
import {
  Button,
  Card,
  Input,
  message,
  Segmented,
  Space,
  Splitter,
  Tabs,
  Tooltip,
  Typography,
  Upload,
} from 'antd'; // Import Ant Design components
import React, { useRef, useState } from 'react'; // Import React and useState hook
import { optimize } from 'svgo'; // Import SVG optimizer
import styles from './styles.less'; // Import CSS module

const { Text } = Typography; // Destructure Text component from Typography

const SVGViewer: React.FC = () => {
  // --- State variables ---
  const [svgCode, setSvgCode] = useState<string>(''); // Store the raw SVG code
  const [preview, setPreview] = useState<string>(''); // Store SVG preview HTML
  const [pngPreview, setPngPreview] = useState<string>('');
  const [icoPreview, setIcoPreview] = useState<string>('');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey'); // Background mode
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after?: number } | null>(null); // Store size info before/after optimization
  const [activeTab, setActiveTab] = useState<string>('svg'); // Active preview tab
  const [dragging, setDragging] = useState(false);
  const [svgSize, setSvgSize] = useState<{ width: string; height: string }>({
    width: '',
    height: '',
  }); // Store detected or custom SVG width/height

  const [zoom, setZoom] = useState(1); // 1 = 100%
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3)); // up to 300%
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.2)); // down to 20%
  const handleResetZoom = () => setZoom(1);

  // Check in using Mobile
  // Check in using Mobile
  const isMobile = useIsMobile();

  const dragCounter = useRef(0);
  // place this near the top of your component, under useState declarations:
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Function to handle SVG file upload ---
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result.includes('<svg')) {
        message.error('Invalid SVG file');
        return;
      }

      const newContent = result.trim();
      let combinedSvg = '';

      if (svgCode.trim()) {
        // Append new SVG below existing one
        combinedSvg = `${svgCode.trim()}\n\n<!-- New SVG appended -->\n${newContent}`;
      } else {
        combinedSvg = newContent;
      }

      setSvgCode(combinedSvg);
      setPreview(combinedSvg);

      extractSize(combinedSvg); // Auto-detect width & height

      // Update combined file size
      setSizeInfo({ before: new Blob([combinedSvg]).size });
      message.success(svgCode ? 'Appended new SVG!' : 'SVG loaded!');
    };
    reader.readAsText(file);
    return false;
  };

  // --- Debounced Resize ---
  const debouncedResize = (width: string, height: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (width && height) handleResize(width, height);
    }, 500); // waits 500ms after typing stops
  };

  // --- Extract width and height from SVG code ---
  const extractSize = (code: string) => {
    const widthMatch = code.match(/width="([^"]+)"/);
    const heightMatch = code.match(/height="([^"]+)"/);
    setSvgSize({
      width: widthMatch ? widthMatch[1] : '',
      height: heightMatch ? heightMatch[1] : '',
    });
  };

  // --- Resize SVG by updating width and height attributes ---
  const handleResize = (width: string, height: string) => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }

    if (!width || !height) {
      message.warning('Please enter both width and height.');
      return;
    }

    let updated = svgCode;

    if (updated.includes('width=')) {
      updated = updated.replace(/width="[^"]*"/, `width="${width}"`);
    } else {
      updated = updated.replace('<svg', `<svg width="${width}"`);
    }

    if (updated.includes('height=')) {
      updated = updated.replace(/height="[^"]*"/, `height="${height}"`);
    } else {
      updated = updated.replace('<svg', `<svg height="${height}"`);
    }

    setSvgCode(updated);
    setPreview(updated);
    message.success(`SVG resized to ${width} × ${height}`);
  };

  // --- Copy SVG code to clipboard ---
  const handleCopyCode = () => handleCopy(svgCode, 'Copied SVG code to clipboard!');

  // --- Clear SVG code and preview ---
  const handleClear = () => {
    setSvgCode(''); // Clear SVG code
    setPreview(''); // Clear preview
    setSizeInfo(null); // Clear size info
    setSvgSize({ width: '', height: '' }); // Clear detected size
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

  // --- Prettify SVG code ---
  const prettifySVG = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG code to prettify.');
      return;
    }
    try {
      const pretty = formatXML(svgCode);
      setSvgCode(pretty);
      setPreview(pretty);
      extractSize(pretty);
      message.success('SVG prettified!');
    } catch (err) {
      console.error(err);
      message.error('Failed to prettify SVG.');
    }
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

  // --- Flip SVG horizontally ---
  const flipHorizontal = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }
    let updated = svgCode;

    // Insert or update transform attribute
    updated = updated.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (attrs.includes('transform=')) {
        return `<svg${attrs.replace(/transform="([^"]*)"/, 'transform="scale(-1,1) $1"')}>`;
      } else {
        return `<svg${attrs} transform="scale(-1,1)">`;
      }
    });

    setSvgCode(updated);
    setPreview(updated);
    message.success('Flipped horizontally!');
  };

  // --- Flip SVG vertically ---
  const flipVertical = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG loaded.');
      return;
    }
    let updated = svgCode;

    updated = updated.replace(/<svg([^>]*)>/, (match, attrs) => {
      if (attrs.includes('transform=')) {
        return `<svg${attrs.replace(/transform="([^"]*)"/, 'transform="scale(1,-1) $1"')}>`;
      } else {
        return `<svg${attrs} transform="scale(1,-1)">`;
      }
    });

    setSvgCode(updated);
    setPreview(updated);
    message.success('Flipped vertically!');
  };

  return (
    <div
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
        const files = e.dataTransfer.files;
        if (files.length > 0) handleUpload(files[0]);
      }}
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      <Card title="🧩 SVG Viewer" variant={'borderless'} className={styles.container}>
        <div className={styles.content}>
          <Splitter
            layout={isMobile ? 'vertical' : 'horizontal'}
            style={isMobile ? { height: 1600 } : {}}
          >
            <Splitter.Panel defaultSize="50%" min="20%" max="70%" style={{ padding: '0px 10px' }}>
              {/* Left Side - Editor */}
              <div className={styles.editorSection}>
                <Space
                  className={styles.topActions}
                  style={{ marginTop: 12, marginBottom: 8 }}
                  wrap
                >
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
                      const code = val || '';
                      setSvgCode(code);
                      setPreview(code);
                      extractSize(code);
                    }}
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
                {/* Resize controls */}
                <Space style={{ float: 'right', marginTop: 16 }}>
                  <Text strong>Resize:</Text>
                  <Input
                    size="small"
                    prefix={<CompressOutlined />}
                    placeholder="W"
                    style={{ width: 90 }}
                    value={svgSize.width}
                    onChange={(e) => {
                      const width = e.target.value;
                      setSvgSize((prev) => ({ ...prev, width }));
                      if (width && svgSize.height) debouncedResize(width, svgSize.height);
                    }}
                  />
                  x
                  <Input
                    size="small"
                    prefix={<CompressOutlined />}
                    placeholder="H"
                    style={{ width: 90 }}
                    value={svgSize.height}
                    onChange={(e) => {
                      const height = e.target.value;
                      setSvgSize((prev) => ({ ...prev, height }));
                      if (height && svgSize.width) debouncedResize(svgSize.width, height);
                    }}
                  />
                  <Tooltip title={'Flip H'}>
                    <Button onClick={flipHorizontal} icon={<SwapOutlined />} />
                  </Tooltip>
                  <Tooltip title={'Flip V'}>
                    <Button
                      onClick={flipVertical}
                      icon={<SwapOutlined style={{ transform: 'rotate(90deg)' }} />}
                    />
                  </Tooltip>
                </Space>
              </div>
            </Splitter.Panel>
            <Splitter.Panel style={{ padding: '0px 10px' }}>
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
                        <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                          <div
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
            </Splitter.Panel>
          </Splitter>
        </div>
      </Card>

      {/* Drag overlay */}
      {dragging && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.1)',
            border: '2px dashed #1890ff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <p style={{ fontSize: 18, marginTop: 8 }}>Drop your SVG file here to upload</p>
        </div>
      )}
    </div>
  );
};

export default SVGViewer;
