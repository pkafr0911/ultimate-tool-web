import { useDarkMode } from '@/hooks/useDarkMode';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  AimOutlined,
  BorderOutlined,
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExpandOutlined,
  EyeOutlined,
  SettingOutlined,
  CompressOutlined,
  FileImageOutlined,
  AppstoreOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, Collapse, ColorPicker, message, Splitter, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CODE, DEFAULT_CONFIG, SAMPLE_DIAGRAMS } from './constants';
import styles from './styles.less';
import classNames from 'classnames';
import mermaid from 'mermaid';

const { Title, Text } = Typography;

type EditorTab = 'code' | 'config';

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundImage: [
    'linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%)',
    'linear-gradient(-45deg, rgba(0,0,0,0.06) 25%, transparent 25%)',
    'linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.06) 75%)',
    'linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.06) 75%)',
  ].join(', '),
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundSize: '20px 20px',
};

const getPreviewBgStyle = (bg: string, showGrid: boolean): React.CSSProperties => {
  if (showGrid) {
    return {
      backgroundColor: bg,
      ...CHECKERBOARD_STYLE,
    };
  }
  return { backgroundColor: bg };
};

const STORAGE_KEY = 'mermaid-editor';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

const MermaidEditorPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const isMobile = useIsMobile();

  const saved = useRef(loadFromStorage()).current;

  const [code, setCode] = useState<string>(saved?.code ?? DEFAULT_CODE);
  const [config, setConfig] = useState<string>(saved?.config ?? DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<EditorTab>('code');
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewBg, setPreviewBg] = useState(
    saved?.previewBg ?? (darkMode ? '#1f1f1f' : '#ffffff'),
  );
  const [showGrid, setShowGrid] = useState<boolean>(saved?.showGrid ?? true);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, config, previewBg, showGrid }));
    } catch {
      // ignore quota errors
    }
  }, [code, config, previewBg, showGrid]);

  const BG_PRESETS = [
    '#ffffff',
    '#f5f5f5',
    '#e8e8e8',
    '#1f1f1f',
    '#141414',
    '#000000',
    '#f0f5ff',
    '#f6ffed',
    '#fff7e6',
    '#fff1f0',
  ];

  const previewRef = useRef<HTMLDivElement>(null);
  const fullscreenPreviewRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const renderIdRef = useRef(0);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });

  // Fullscreen Pan & Zoom state
  const [fsZoom, setFsZoom] = useState(1);
  const [fsPan, setFsPan] = useState({ x: 0, y: 0 });
  const isFsPanningRef = useRef(false);
  const fsPanStartRef = useRef({ x: 0, y: 0 });
  const fsPanOffsetRef = useRef({ x: 0, y: 0 });

  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 5;
  const ZOOM_STEP = 0.1;

  // Reset pan/zoom when diagram changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [svgOutput]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const resetFsView = () => {
    setFsZoom(1);
    setFsPan({ x: 0, y: 0 });
  };

  // Wheel zoom handler for preview (zoom toward mouse position)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setZoom((prevZoom) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom + delta));
      const scale = newZoom / prevZoom;

      setPan((prevPan) => ({
        x: mouseX - centerX - (mouseX - centerX - prevPan.x) * scale,
        y: mouseY - centerY - (mouseY - centerY - prevPan.y) * scale,
      }));

      return newZoom;
    });
  }, []);

  // Mouse pan handlers for preview
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetRef.current = { ...pan };
      e.currentTarget.style.cursor = 'grabbing';
    },
    [pan],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({ x: panOffsetRef.current.x + dx, y: panOffsetRef.current.y + dy });
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isPanningRef.current = false;
    e.currentTarget.style.cursor = 'grab';
  }, []);

  // Wheel zoom handler for fullscreen (zoom toward mouse position)
  const handleFsWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setFsZoom((prevZoom) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom + delta));
      const scale = newZoom / prevZoom;

      setFsPan((prevPan) => ({
        x: mouseX - centerX - (mouseX - centerX - prevPan.x) * scale,
        y: mouseY - centerY - (mouseY - centerY - prevPan.y) * scale,
      }));

      return newZoom;
    });
  }, []);

  // Mouse pan handlers for fullscreen
  const handleFsMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      isFsPanningRef.current = true;
      fsPanStartRef.current = { x: e.clientX, y: e.clientY };
      fsPanOffsetRef.current = { ...fsPan };
      e.currentTarget.style.cursor = 'grabbing';
    },
    [fsPan],
  );

  const handleFsMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFsPanningRef.current) return;
    const dx = e.clientX - fsPanStartRef.current.x;
    const dy = e.clientY - fsPanStartRef.current.y;
    setFsPan({ x: fsPanOffsetRef.current.x + dx, y: fsPanOffsetRef.current.y + dy });
  }, []);

  const handleFsMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isFsPanningRef.current = false;
    e.currentTarget.style.cursor = 'grab';
  }, []);

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
      flowchart: { useMaxWidth: false, htmlLabels: true, padding: 15 },
      sequence: { useMaxWidth: false },
      gantt: { useMaxWidth: false },
      class: { useMaxWidth: false },
      state: { useMaxWidth: false },
      er: { useMaxWidth: false },
      pie: { useMaxWidth: false },
      journey: { useMaxWidth: false },
    });
  }, [darkMode]);

  // Render diagram with debounce
  const renderDiagram = useCallback(
    async (mermaidCode: string, mermaidConfig: string) => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }

      renderTimeoutRef.current = setTimeout(async () => {
        const currentId = ++renderIdRef.current;

        try {
          // Parse config
          let parsedConfig: Record<string, any> = {};
          try {
            parsedConfig = JSON.parse(mermaidConfig);
          } catch {
            // ignore invalid config
          }

          // Re-initialize with config
          mermaid.initialize({
            startOnLoad: false,
            theme: darkMode ? 'dark' : 'default',
            securityLevel: 'loose',
            fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
            flowchart: { useMaxWidth: false, htmlLabels: true, padding: 15 },
            sequence: { useMaxWidth: false },
            gantt: { useMaxWidth: false },
            class: { useMaxWidth: false },
            state: { useMaxWidth: false },
            er: { useMaxWidth: false },
            pie: { useMaxWidth: false },
            journey: { useMaxWidth: false },
            ...parsedConfig,
          });

          // Validate syntax
          await mermaid.parse(mermaidCode);

          // Render
          const uniqueId = `mermaid-preview-${currentId}-${Date.now()}`;
          const { svg } = await mermaid.render(uniqueId, mermaidCode);

          if (currentId === renderIdRef.current) {
            // Remove inline max-width from SVG to prevent text clipping
            const cleanedSvg = svg
              .replace(/max-width:\s*[\d.]+px;?/gi, '')
              .replace(/style="/i, 'style="max-width:none!important;');
            setSvgOutput(cleanedSvg);
            setError('');
          }
        } catch (err: any) {
          if (currentId === renderIdRef.current) {
            setError(err?.message || 'Failed to render diagram');
          }
        }
      }, 300);
    },
    [darkMode],
  );

  // Re-render on code/config change
  useEffect(() => {
    renderDiagram(code, config);
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [code, config, renderDiagram]);

  // Copy SVG to clipboard
  const handleCopySvg = async () => {
    if (!svgOutput) {
      message.warning('No diagram to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(svgOutput);
      message.success('SVG copied to clipboard');
    } catch {
      message.error('Failed to copy');
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      message.success('Code copied to clipboard');
    } catch {
      message.error('Failed to copy');
    }
  };

  // Download as SVG
  const handleDownloadSvg = () => {
    if (!svgOutput) {
      message.warning('No diagram to download');
      return;
    }
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mermaid-diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
    message.success('SVG downloaded');
  };

  // Download as PNG
  const handleDownloadPng = () => {
    if (!svgOutput) {
      message.warning('No diagram to download');
      return;
    }

    const svgEl = document.createElement('div');
    svgEl.innerHTML = svgOutput;
    const svgNode = svgEl.querySelector('svg');
    if (!svgNode) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgNode);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const scale = 2; // 2x resolution
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.scale(scale, scale);
      ctx.fillStyle = darkMode ? '#1f1f1f' : '#ffffff';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'mermaid-diagram.png';
        a.click();
        URL.revokeObjectURL(pngUrl);
        message.success('PNG downloaded');
      });
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // Load sample diagram
  const handleLoadSample = (key: string) => {
    const sample = SAMPLE_DIAGRAMS[key];
    if (sample) {
      setCode(sample.code);
      setActiveTab('code');
    }
  };

  const editorContent = activeTab === 'code' ? code : config;
  const editorLanguage = activeTab === 'code' ? 'markdown' : 'json';

  const pageClass = classNames(styles.mermaidEditorPage, {
    [styles.mermaidEditorPageDark]: darkMode,
  });

  return (
    <div className={pageClass}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Title level={5} style={{ margin: 0 }}>
            Mermaid Live Editor
          </Title>
          {error ? (
            <Text type="danger" style={{ fontSize: 12 }}>
              ● Syntax Error
            </Text>
          ) : svgOutput ? (
            <Text type="success" style={{ fontSize: 12 }}>
              ● Valid
            </Text>
          ) : null}
        </div>
        <div className={styles.toolbarRight}>
          <Tooltip title="Copy Code">
            <Button icon={<CopyOutlined />} size="small" onClick={handleCopyCode} />
          </Tooltip>
          <Tooltip title="Copy SVG">
            <Button icon={<CodeOutlined />} size="small" onClick={handleCopySvg} />
          </Tooltip>
          <Tooltip title="Download SVG">
            <Button icon={<DownloadOutlined />} size="small" onClick={handleDownloadSvg} />
          </Tooltip>
          <Tooltip title="Download PNG">
            <Button icon={<FileImageOutlined />} size="small" onClick={handleDownloadPng} />
          </Tooltip>
          <Tooltip title="Fullscreen">
            <Button icon={<ExpandOutlined />} size="small" onClick={() => setIsFullscreen(true)} />
          </Tooltip>
        </div>
      </div>

      {/* Main Editor & Preview */}
      <Splitter className={styles.editorContainer} layout={isMobile ? 'vertical' : 'horizontal'}>
        <Splitter.Panel defaultSize="30%" min="20%">
          <div className={styles.editorPane}>
            {/* Editor Tabs */}
            <div className={styles.editorTabs}>
              <div
                className={classNames(styles.editorTab, { [styles.active]: activeTab === 'code' })}
                onClick={() => setActiveTab('code')}
              >
                <CodeOutlined /> Code
              </div>
              <div
                className={classNames(styles.editorTab, {
                  [styles.active]: activeTab === 'config',
                })}
                onClick={() => setActiveTab('config')}
              >
                <SettingOutlined /> Config
              </div>
            </div>

            {/* Code Editor */}
            <div className={styles.editorContent}>
              <Editor
                height="100%"
                language={editorLanguage}
                value={editorContent}
                theme={darkMode ? 'vs-dark' : 'vs'}
                onChange={(value) => {
                  if (activeTab === 'code') {
                    setCode(value || '');
                  } else {
                    setConfig(value || '');
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12 },
                  tabSize: 2,
                }}
              />
            </div>

            {/* Sample Diagrams */}
            <Collapse
              ghost
              size="small"
              items={[
                {
                  key: 'samples',
                  label: (
                    <span>
                      <AppstoreOutlined /> Sample Diagrams
                    </span>
                  ),
                  children: (
                    <div className={styles.sampleDiagramsPanel}>
                      <div className={styles.sampleGrid}>
                        {Object.entries(SAMPLE_DIAGRAMS).map(([key, sample]) => (
                          <div
                            key={key}
                            className={styles.sampleCard}
                            onClick={() => handleLoadSample(key)}
                          >
                            <div className={styles.sampleIcon}>{sample.icon}</div>
                            <div>{sample.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Splitter.Panel>

        <Splitter.Panel min="20%">
          <div className={styles.previewPane}>
            {/* Preview Header */}
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>
                <EyeOutlined /> Preview
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {Math.round(zoom * 100)}%
                </Text>
              </span>
              <div className={styles.previewActions}>
                <Tooltip title="Toggle Grid">
                  <Button
                    type={showGrid ? 'primary' : 'text'}
                    size="small"
                    icon={<BorderOutlined />}
                    onClick={() => setShowGrid((v) => !v)}
                  />
                </Tooltip>
                <ColorPicker
                  size="small"
                  value={previewBg}
                  onChange={(_, hex) => setPreviewBg(hex)}
                  presets={[
                    {
                      label: 'Presets',
                      colors: BG_PRESETS,
                    },
                  ]}
                />
                <Tooltip title="Zoom In">
                  <Button
                    type="text"
                    size="small"
                    icon={<ZoomInOutlined />}
                    onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                  />
                </Tooltip>
                <Tooltip title="Zoom Out">
                  <Button
                    type="text"
                    size="small"
                    icon={<ZoomOutOutlined />}
                    onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                  />
                </Tooltip>
                <Tooltip title="Reset View">
                  <Button type="text" size="small" icon={<AimOutlined />} onClick={resetView} />
                </Tooltip>
                <Tooltip title="Fullscreen">
                  <Button
                    type="text"
                    size="small"
                    icon={<ExpandOutlined />}
                    onClick={() => setIsFullscreen(true)}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Preview Content */}
            <div
              className={styles.previewContent}
              ref={previewRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: 'grab', ...getPreviewBgStyle(previewBg, showGrid) }}
            >
              {error ? (
                <div className={styles.errorMessage}>{error}</div>
              ) : svgOutput ? (
                <div
                  className={styles.mermaidOutput}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isPanningRef.current ? 'none' : 'transform 0.1s ease-out',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : (
                <Text type="secondary">Enter Mermaid code to see preview...</Text>
              )}
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>

      {/* Fullscreen Preview */}
      {isFullscreen && (
        <div className={styles.fullscreenOverlay}>
          <div className={styles.fullscreenHeader}>
            <Title level={5} style={{ margin: 0 }}>
              Mermaid Diagram Preview
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Math.round(fsZoom * 100)}%
              </Text>
              <Tooltip title="Zoom In">
                <Button
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={() => setFsZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                />
              </Tooltip>
              <Tooltip title="Zoom Out">
                <Button
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={() => setFsZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                />
              </Tooltip>
              <Tooltip title="Reset View">
                <Button size="small" icon={<AimOutlined />} onClick={resetFsView} />
              </Tooltip>
              <Button
                icon={<CompressOutlined />}
                onClick={() => {
                  setIsFullscreen(false);
                  resetFsView();
                }}
              >
                Exit Fullscreen
              </Button>
            </div>
          </div>
          <div
            className={styles.fullscreenContent}
            ref={fullscreenPreviewRef}
            onWheel={handleFsWheel}
            onMouseDown={handleFsMouseDown}
            onMouseMove={handleFsMouseMove}
            onMouseUp={handleFsMouseUp}
            onMouseLeave={handleFsMouseUp}
            style={{ cursor: 'grab', ...getPreviewBgStyle(previewBg, showGrid) }}
          >
            {error ? (
              <div className={styles.errorMessage}>{error}</div>
            ) : svgOutput ? (
              <div
                className={styles.mermaidOutput}
                style={{
                  transform: `translate(${fsPan.x}px, ${fsPan.y}px) scale(${fsZoom})`,
                  transformOrigin: 'center center',
                  transition: isFsPanningRef.current ? 'none' : 'transform 0.1s ease-out',
                }}
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            ) : (
              <Text type="secondary">No diagram to display</Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidEditorPage;
