import { handleCopy } from '@/helpers'; // Import custom copy helper
import { useIsMobile } from '@/hooks/useIsMobile';

import { Button, Card, message, Space, Splitter, Typography } from 'antd'; // Import Ant Design components
import React, { useRef, useState } from 'react'; // Import React and useState hook
import styles from './styles.less'; // Import CSS module

import { extractSize, handleDownload, loadSettings } from './utils/helpers';
import GuideSection from './components/GuideSection';
import DragOverlay from '@/components/DragOverlay';
import EditorSection from './components/EditorSection';
import PreviewTabs from './components/PreviewTabs';
import { SettingOutlined } from '@ant-design/icons';
import SettingsModal from './components/SettingsModal';
import logo from '@/assets/logo.svg?raw';
import DragDropWrapper from '@/components/DragDropWrapper';

const { Text } = Typography; // Destructure Text component from Typography

const SVGViewer: React.FC = () => {
  // --- State variables ---
  const [svgCode, setSvgCode] = useState<string>(logo); // Store the raw SVG code
  const [preview, setPreview] = useState<string>(logo); // Store SVG preview HTML
  const [pngPreview, setPngPreview] = useState<string>('');
  const [icoPreview, setIcoPreview] = useState<string>('');

  const [sizeInfo, setSizeInfo] = useState<{ before: number; after?: number } | null>(null); // Store size info before/after optimization
  const [dragging, setDragging] = useState(false);
  const [svgSize, setSvgSize] = useState<{ width: string; height: string }>({
    width: '',
    height: '',
  }); // Store detected or custom SVG width/height

  // Settings state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Check in using Mobile
  const isMobile = useIsMobile();

  // Couting Drag
  const dragCounter = useRef(0);

  // Highlight Editor Mount
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // --- Function to handle SVG file upload ---
  const handleUpload = (file: File) => {
    const settings = loadSettings(); // 👈 Load user preferences

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result.includes('<svg')) {
        message.error('Invalid SVG file');
        return;
      }

      const newContent = result.trim();
      let combinedSvg = '';

      if (settings.uploadStack && svgCode.trim()) {
        combinedSvg = `${svgCode.trim()}\n\n<!-- New SVG appended -->\n${newContent}`;
      } else {
        combinedSvg = newContent;
      }

      setSvgCode(combinedSvg);
      setPreview(combinedSvg);
      extractSize(combinedSvg, setSvgSize);

      setSizeInfo({ before: new Blob([combinedSvg]).size });
      message.success(settings.uploadStack && svgCode ? 'Appended new SVG!' : 'SVG loaded!');
    };
    reader.readAsText(file);
    return false;
  };

  // --- Generate Data URI string ---
  const getDataURI = () => `data:image/svg+xml;utf8,${encodeURIComponent(svgCode)}`;

  // --- Generate Base64 string ---
  const getBase64 = () =>
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgCode)))}`;

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <Card
        title={
          <Space>
            🧩 SVG Viewer
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setIsSettingsModalOpen(true)}
            />
          </Space>
        }
        variant={'borderless'}
        className={styles.container}
      >
        <div>
          <Typography.Title level={4}>📘 About SVG Viewer</Typography.Title>
          <Typography.Paragraph>
            This tool allows you to <Text strong>upload</Text>, <Text strong>edit</Text>, and
            <Text strong> preview SVG files</Text>. You can optimize, prettify, resize, flip, and
            export SVGs as SVG, PNG, ICO, Data URI, or Base64 formats.
          </Typography.Paragraph>
        </div>
        <div className={styles.content}>
          <Splitter
            layout={isMobile ? 'vertical' : 'horizontal'}
            style={isMobile ? { height: 1600 } : {}}
          >
            <Splitter.Panel defaultSize="50%" min="20%" max="70%" style={{ padding: '0px 10px' }}>
              {/* Left Side - Editor */}
              <EditorSection
                svgCode={svgCode}
                setSvgCode={setSvgCode}
                setPreview={setPreview}
                sizeInfo={sizeInfo}
                setSizeInfo={setSizeInfo}
                svgSize={svgSize}
                setSvgSize={setSvgSize}
                svgContainerRef={svgContainerRef}
                handleUpload={handleUpload}
              />
            </Splitter.Panel>
            <Splitter.Panel style={{ padding: '0px 10px' }}>
              {/* Right Side - Preview */}
              <PreviewTabs
                preview={preview}
                svgCode={svgCode}
                handleDownload={handleDownload}
                handleCopy={handleCopy}
                svgContainerRef={svgContainerRef}
                getDataURI={getDataURI}
                getBase64={getBase64}
              />
            </Splitter.Panel>
          </Splitter>
        </div>
        {/* --- Guide Section --- */}
        <GuideSection
          callback={(action) => {
            if (action === 'openSetting') setIsSettingsModalOpen(true);
          }}
        />
      </Card>

      {/* Drag overlay */}
      {dragging && <DragOverlay />}

      {/* --- Settings Modal --- */}
      <SettingsModal open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </DragDropWrapper>
  );
};

export default SVGViewer;
