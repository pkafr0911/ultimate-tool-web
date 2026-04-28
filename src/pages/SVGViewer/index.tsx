import { useIsMobile } from '@/hooks/useIsMobile';

import { Button, Splitter, Tooltip, Upload, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.less';

import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import logo from '@/assets/logo.svg?raw';
import {
  BulbOutlined,
  CompressOutlined,
  ExpandOutlined,
  FileImageOutlined,
  FormatPainterOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import EditorSection from './components/EditorSection';
import GuideSection from './components/GuideSection';
import PreviewTabs from './components/PreviewTabs';
import SettingsModal from './components/SettingsModal';
import { extractSize, handleDownload, loadSettings } from './utils/helpers';

const SVGViewer: React.FC = () => {
  // --- State variables ---
  const [svgCode, setSvgCode] = useState<string>(logo);
  const [preview, setPreview] = useState<string>(logo);

  const [sizeInfo, setSizeInfo] = useState<{ before: number; after?: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [svgSize, setSvgSize] = useState<{ width: string; height: string }>({
    width: '',
    height: '',
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [fullscreen, setFullscreen] = useState(false); // Hides hero & guide for an IDE-like workspace
  const rootRef = useRef<HTMLDivElement>(null);

  // Toggle focus mode + browser fullscreen API together
  const toggleFullscreen = async () => {
    const next = !fullscreen;
    setFullscreen(next);
    try {
      if (next && !document.fullscreenElement) {
        await rootRef.current?.requestFullscreen?.();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen?.();
      }
    } catch {
      /* ignore — some browsers block fullscreen without user gesture or in iframes */
    }
  };

  // Keep state in sync if the user exits via Esc / browser UI, and add F11 shortcut
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen((cur) => (cur ? false : cur));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const isMobile = useIsMobile();
  const dragCounter = useRef(0);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // --- Upload SVG file ---
  const handleUpload = (file: File) => {
    const settings = loadSettings();

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

  // --- Reset to default logo ---
  const resetToDefault = () => {
    setSvgCode(logo);
    setPreview(logo);
    extractSize(logo, setSvgSize);
    setSizeInfo({ before: new Blob([logo]).size });
    message.success('Reset to default logo');
  };

  // --- Derived stats ---
  const stats = useMemo(() => {
    const sizeKb = sizeInfo ? (sizeInfo.before / 1024).toFixed(2) : '0.00';
    const savings =
      sizeInfo?.after && sizeInfo.before
        ? (((sizeInfo.before - sizeInfo.after) / sizeInfo.before) * 100).toFixed(1)
        : null;
    const afterKb = sizeInfo?.after ? (sizeInfo.after / 1024).toFixed(2) : null;
    const dim = svgSize.width && svgSize.height ? `${svgSize.width} × ${svgSize.height}` : '—';
    return { sizeKb, afterKb, savings, dim };
  }, [sizeInfo, svgSize]);

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div ref={rootRef} className={`${styles.container} ${fullscreen ? styles.containerFs : ''}`}>
        <div className={`${styles.shell} ${fullscreen ? styles.shellFs : ''}`}>
          {/* === Hero === */}
          {!fullscreen && (
            <header className={styles.hero}>
              <div className={styles.heroRow}>
                <div className={styles.heroTitleBlock}>
                  <span className={styles.heroBadge}>
                    <FileImageOutlined />
                  </span>
                  <div className={styles.heroText}>
                    <span className={styles.heroEyebrow}>Visual Tool</span>
                    <h1>SVG Viewer & Editor</h1>
                    <p>
                      Upload, edit, optimize, transform, and export SVGs — plus PNG, ICO, Data URI
                      and Base64 output.
                    </p>
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <Upload beforeUpload={handleUpload} showUploadList={false} accept=".svg">
                    <Button icon={<UploadOutlined />} type="primary">
                      Upload SVG
                    </Button>
                  </Upload>
                  <Tooltip title="Reset to sample logo">
                    <Button
                      className={styles.ghostBtn}
                      icon={<ReloadOutlined />}
                      onClick={resetToDefault}
                    >
                      Sample
                    </Button>
                  </Tooltip>
                  <Tooltip title="How to use">
                    <Button
                      className={styles.ghostBtn}
                      icon={<QuestionCircleOutlined />}
                      onClick={() => setShowGuide((v) => !v)}
                    >
                      Guide
                    </Button>
                  </Tooltip>
                  <Tooltip title="Settings">
                    <Button
                      className={styles.ghostBtn}
                      icon={<SettingOutlined />}
                      onClick={() => setIsSettingsModalOpen(true)}
                    />
                  </Tooltip>
                  <Tooltip title="Fullscreen workspace (F11)">
                    <Button
                      type="primary"
                      ghost
                      className={styles.fsBtn}
                      icon={<ExpandOutlined />}
                      onClick={toggleFullscreen}
                    >
                      Fullscreen
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <div className={styles.statStrip}>
                <div className={styles.statChip}>
                  <span className={styles.dot} />
                  <span>
                    <strong>Live</strong> · auto-preview
                  </span>
                </div>
                <div className={styles.statChip}>
                  <FormatPainterOutlined />
                  <span>
                    Size: <strong>{stats.sizeKb} KB</strong>
                    {stats.afterKb && (
                      <>
                        {' '}
                        → <strong>{stats.afterKb} KB</strong>{' '}
                        <span className={styles.savings}>(-{stats.savings}%)</span>
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.statChip}>
                  <span>
                    Dimensions: <strong>{stats.dim}</strong>
                  </span>
                </div>
                <div className={styles.statChip}>
                  <span>
                    Characters: <strong>{svgCode.length.toLocaleString()}</strong>
                  </span>
                </div>
                <div className={styles.statChip}>
                  <BulbOutlined />
                  <span>
                    Tools: <strong>V</strong> <strong>H</strong> <strong>C</strong>{' '}
                    <strong>R</strong> · hold <strong>Space</strong> to pan
                  </span>
                </div>
              </div>
            </header>
          )}

          {/* Floating exit-fullscreen button */}
          {fullscreen && (
            <Tooltip title="Exit fullscreen (Esc / F11)" placement="left">
              <Button
                className={styles.exitFsBtn}
                icon={<CompressOutlined />}
                onClick={toggleFullscreen}
                shape="circle"
                type="primary"
              />
            </Tooltip>
          )}

          {/* === Workspace === */}
          <div className={`${styles.workspace} ${fullscreen ? styles.workspaceFs : ''}`}>
            <div className={styles.content}>
              <Splitter
                layout={isMobile ? 'vertical' : 'horizontal'}
                style={
                  isMobile ? { height: 1600, width: '100%' } : { width: '100%', height: '100%' }
                }
              >
                <Splitter.Panel
                  defaultSize="50%"
                  min="20%"
                  max="70%"
                  style={{ padding: '0px 10px' }}
                >
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
                  <PreviewTabs
                    preview={preview}
                    svgCode={svgCode}
                    handleDownload={handleDownload}
                    svgContainerRef={svgContainerRef}
                    getDataURI={getDataURI}
                    getBase64={getBase64}
                  />
                </Splitter.Panel>
              </Splitter>
            </div>
          </div>

          {/* === Guide (collapsible) === */}
          {showGuide && !fullscreen && (
            <GuideSection
              callback={(action) => {
                if (action === 'openSettings') setIsSettingsModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Drag overlay */}
      {dragging && <DragOverlay />}

      {/* Settings Modal */}
      <SettingsModal open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </DragDropWrapper>
  );
};

export default SVGViewer;
