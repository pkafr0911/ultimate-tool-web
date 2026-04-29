import React, { useEffect, useMemo, useState } from 'react';
import {
  CloseCircleOutlined,
  CloudUploadOutlined,
  ExperimentOutlined,
  FolderOpenOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HighlightOutlined,
  PictureOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Empty, Tabs, Tag, Tooltip, Typography } from 'antd';
import classNames from 'classnames';

import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { PhotoEditorProvider } from './context';
import EditorLayout from './components/EditorLayout';
import UploadArea from './components/UploadArea';
import SavedProjectsList from './components/SavedProjectsList';
import { useImageUpload } from './hooks/useImageUpload';
import { useProjects } from './hooks/useProjects';

import './styles.less';

const { Paragraph } = Typography;

type FullscreenTarget = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

const PhotoEditor: React.FC = () => {
  const {
    preview,
    dragging,
    setDragging,
    dragCounter,
    handleUpload,
    handleClear,
    addOnFile,
    setAddOnFile,
    loadProject,
    initialProject,
  } = useImageUpload();

  const { savedProjects, deleteProject } = useProjects();

  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const shellRef = React.useRef<HTMLDivElement | null>(null);

  // Sync state with the browser's native fullscreen events (Esc key, etc.)
  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDocument;
      const isNative = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      if (!isNative) {
        setFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const doc = document as FullscreenDocument;
    const node = shellRef.current as FullscreenTarget | null;
    if (!fullscreen) {
      try {
        if (node?.requestFullscreen) {
          await node.requestFullscreen();
        } else if (node?.webkitRequestFullscreen) {
          await node.webkitRequestFullscreen();
        }
      } catch {
        // fall back to CSS-only fullscreen if the API rejects
      }
      setFullscreen(true);
    } else {
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } catch {
        // ignore
      }
      setFullscreen(false);
    }
  };

  const heroStatusTone: 'idle' | 'running' | 'success' = preview
    ? fullscreen
      ? 'success'
      : 'running'
    : 'idle';

  const heroStatusLabel = preview
    ? fullscreen
      ? 'Fullscreen editing'
      : 'Editing image'
    : 'Awaiting image';

  const projectCount = savedProjects.length;

  const tipsContent = useMemo(
    () => (
      <div className="guideGrid">
        <div className="guideItem">
          <span className="guideTitle">
            <CloudUploadOutlined /> Drag, drop, paste
          </span>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Drop a PNG/JPEG anywhere on the page, or paste an image straight from your clipboard —
            the editor opens automatically.
          </Paragraph>
        </div>
        <div className="guideItem">
          <span className="guideTitle">
            <SaveOutlined /> Saved projects
          </span>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Projects are stored in your browser. Open the Saved Projects tab to resume editing where
            you left off.
          </Paragraph>
        </div>
        <div className="guideItem">
          <span className="guideTitle">
            <HighlightOutlined /> Layers &amp; non-destructive edits
          </span>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Stack adjustments, brushes, masks and shapes in independent layers — each one stays
            editable until you flatten or export.
          </Paragraph>
        </div>
        <div className="guideItem">
          <span className="guideTitle">
            <ExperimentOutlined /> Camera Raw &amp; HSL
          </span>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Open the Camera Raw modal for curves, color grading, HSL targets and a live RGB
            histogram.
          </Paragraph>
        </div>
        <div className="guideItem">
          <span className="guideTitle">
            <ThunderboltOutlined /> Keyboard shortcuts
          </span>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> for
            undo/redo, <kbd>V</kbd> select, <kbd>B</kbd> brush, <kbd>E</kbd> eraser.
          </Paragraph>
        </div>
        <div className="guideItem">
          <span className="guideTitle">
            <FullscreenOutlined /> Fullscreen mode
          </span>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Hit the Fullscreen button to expand the canvas to the entire screen — perfect for
            detailed retouching. Press <kbd>Esc</kbd> to exit.
          </Paragraph>
        </div>
      </div>
    ),
    [],
  );

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div ref={shellRef} className={classNames('container photoEditorPage', { fullscreen })}>
        {fullscreen && (
          <button
            type="button"
            className="fullscreenExit"
            onClick={toggleFullscreen}
            title="Exit fullscreen (Esc)"
          >
            <FullscreenExitOutlined /> Exit fullscreen
          </button>
        )}
        <div className="shell">
          {dragging && <DragOverlay />}

          {/* === Hero === */}
          <div className="hero">
            <div className="heroOverlay" />
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <PictureOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">Photo Studio</span>
                  <h1 className="heroTitle">
                    Photo Editor — pro-grade image editing in your browser{' '}
                    <Tag color="cyan" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                      Beta
                    </Tag>
                  </h1>
                  <p className="heroSubtitle">
                    Layers, masks, brushes, Camera Raw and exports — all client-side, no uploads.
                  </p>
                </div>
              </div>
              <div className="heroActions">
                <span className={classNames('heroStatus', `heroStatus-${heroStatusTone}`)}>
                  <span className="heroStatusDot" />
                  {heroStatusLabel}
                </span>
                <Tooltip title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                  <Button
                    ghost
                    icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFullscreen}
                  >
                    {fullscreen ? 'Exit' : 'Fullscreen'}
                  </Button>
                </Tooltip>
                {preview && (
                  <Tooltip title="Close current image">
                    <Button ghost icon={<CloseCircleOutlined />} onClick={handleClear}>
                      Close
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          {/* === Stat strip === */}
          <div className="statStrip">
            <div className={classNames('statChip', { success: !!preview })}>
              <span className="statIcon">
                <PictureOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Image</span>
                <span className="statValue">{preview ? 'Loaded' : 'None'}</span>
                <span className="statSub">{preview ? 'Ready to edit' : 'Upload to begin'}</span>
              </div>
            </div>
            <div className={classNames('statChip', { success: projectCount > 0 })}>
              <span className="statIcon">
                <FolderOpenOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Saved projects</span>
                <span className="statValue">{projectCount}</span>
                <span className="statSub">Stored in your browser</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <HighlightOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Mode</span>
                <span className="statValue">{preview ? 'Editor' : 'Landing'}</span>
                <span className="statSub">
                  {preview ? 'Layers, brushes, exports' : 'Upload or open project'}
                </span>
              </div>
            </div>
            <div className={classNames('statChip', { success: fullscreen })}>
              <span className="statIcon">
                {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              </span>
              <div className="statBody">
                <span className="statLabel">Fullscreen</span>
                <span className="statValue">{fullscreen ? 'On' : 'Off'}</span>
                <span className="statSub">
                  {fullscreen ? 'Press Esc to exit' : 'Click Fullscreen above'}
                </span>
              </div>
            </div>
          </div>

          {/* === Workspace === */}
          {!preview ? (
            <div className="panel workspacePanel">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'upload',
                    label: (
                      <span>
                        <CloudUploadOutlined /> Upload
                      </span>
                    ),
                    children: (
                      <div className="uploadTab">
                        <UploadArea onUpload={handleUpload} />
                        <p className="uploadHint">
                          Or paste an image from your clipboard with <kbd>Ctrl</kbd>+<kbd>V</kbd>.
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: 'projects',
                    label: (
                      <span>
                        <FolderOpenOutlined /> Saved Projects ({projectCount})
                      </span>
                    ),
                    children:
                      projectCount > 0 ? (
                        <SavedProjectsList
                          projects={savedProjects}
                          onLoad={loadProject}
                          onDelete={deleteProject}
                        />
                      ) : (
                        <Empty description="No saved projects yet" style={{ padding: '24px 0' }} />
                      ),
                  },
                  {
                    key: 'tips',
                    label: (
                      <span>
                        <ThunderboltOutlined /> Tips
                      </span>
                    ),
                    children: tipsContent,
                  },
                ]}
              />
            </div>
          ) : (
            <div className="panel editorPanel">
              <PhotoEditorProvider
                imageUrl={preview}
                initialProject={initialProject}
                addOnFile={addOnFile}
                setAddOnFile={setAddOnFile}
              >
                <EditorLayout />
              </PhotoEditorProvider>
            </div>
          )}
        </div>
      </div>
    </DragDropWrapper>
  );
};

export default PhotoEditor;
