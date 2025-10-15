import React, { useState } from 'react';
import { Upload, Button, Card, Space, message, Segmented, Typography, Tabs } from 'antd';
import {
  UploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HighlightOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { optimize } from 'svgo';
import { handleCopy } from '@/helpers';
import styles from './styles.less';

const { Text } = Typography;

const SVGViewer: React.FC = () => {
  const [svgCode, setSvgCode] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey');
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after?: number } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('svg');

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result.includes('<svg')) {
        message.error('Invalid SVG file');
        return;
      }
      setSvgCode(result);
      setPreview(result);
      setSizeInfo({ before: new Blob([result]).size });
    };
    reader.readAsText(file);
    return false;
  };

  const handleCopyCode = () => handleCopy(svgCode, 'Copied SVG code to clipboard!');

  const handleClear = () => {
    setSvgCode('');
    setPreview('');
    setSizeInfo(null);
  };

  const handleDownload = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const prettifySVG = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG code to prettify.');
      return;
    }
    try {
      const pretty = formatXML(svgCode);
      setSvgCode(pretty);
      setPreview(pretty);
      message.success('SVG prettified!');
    } catch (err) {
      console.error(err);
      message.error('Failed to prettify SVG.');
    }
  };

  const formatXML = (xml: string) => {
    xml = xml.replace(/>\s+</g, '><').replace(/\r|\n/g, '').trim();
    xml = xml.replace(/(>)(<)(\/*)/g, '$1\n$2$3');
    const lines = xml.split('\n');
    let indentLevel = 0;
    const formattedLines: string[] = [];
    lines.forEach((line) => {
      if (line.match(/^<\/\w/)) indentLevel--;
      const padding = '  '.repeat(indentLevel);
      let formattedLine = padding + line.trim();
      if (formattedLine.match(/^<\w.*\s+\w+=/)) {
        formattedLine = formattedLine.replace(/(\s+\w+=)/g, '\n' + padding + '  $1');
      }
      formattedLines.push(formattedLine);
      if (line.match(/^<\w[^>]*[^/]>$/)) indentLevel++;
    });
    return formattedLines.join('\n').trim();
  };

  const handleOptimize = () => {
    if (!svgCode.trim()) {
      message.warning('No SVG code to optimize.');
      return;
    }
    try {
      const beforeSize = new Blob([svgCode]).size;
      const result = optimize(svgCode, { multipass: true });
      let optimized = result.data;
      optimized = optimized
        .replace(/\n+/g, '')
        .replace(/\r+/g, '')
        .replace(/\t+/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/> </g, '><')
        .trim();
      const afterSize = new Blob([optimized]).size;
      setSvgCode(optimized);
      setPreview(optimized);
      setSizeInfo({ before: beforeSize, after: afterSize });
      const percent = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1);
      message.success(`SVG optimized! Reduced by ${percent}%`);
    } catch (err) {
      console.error(err);
      message.error('Failed to optimize SVG.');
    }
  };

  // --- Generate other formats ---
  const getDataURI = () => `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`;
  const getBase64 = () =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;

  const svgToCanvas = async (mimeType: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not found');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL(mimeType));
      };
      img.onerror = reject;
      img.src = getDataURI();
    });
  };

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await svgToCanvas('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'image.png';
      link.click();
    } catch {
      message.error('Failed to convert to PNG.');
    }
  };

  const handleDownloadIco = async () => {
    try {
      const dataUrl = await svgToCanvas('image/x-icon');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'favicon.ico';
      link.click();
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

          <div className={styles.editorBox}>
            <Editor
              height="100%"
              defaultLanguage="xml"
              value={svgCode}
              onChange={(val) => {
                setSvgCode(val || '');
                setPreview(val || '');
              }}
              theme="vs-light"
              options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 14 }}
            />
          </div>

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

          {/* --- Bottom-left actions --- */}
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

          {/* --- Bottom-right actions --- */}
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
