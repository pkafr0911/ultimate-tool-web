import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import {
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PlusOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  Popconfirm,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import ImageTracer from 'imagetracerjs';
import React, { useEffect, useRef, useState } from 'react';
import ImageEditor from './components/ImageEditor';
import SettingsModal from './components/SettingsModal';
import './styles.less';
import { EditorSettings, EditorState, SavedProject } from './types';
import { deleteProjectFromDB, getAllProjectsFromDB, saveProjectToDB } from './utils/storage';

const { Title, Text } = Typography;

const DEFAULT_SETTINGS: EditorSettings = {
  autoSaveInterval: 5,
  maxHistory: 20,
};

const PicsEditor: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [addOnFile, setAddOnFile] = useState<File | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [initialState, setInitialState] = useState<EditorState | null>(null);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const dragCounter = useRef(0);

  useEffect(() => {
    getAllProjectsFromDB()
      .then(setSavedProjects)
      .catch((err) => console.error('Failed to load projects from DB', err));

    const savedSettings = localStorage.getItem('pics_editor_settings');
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: EditorSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pics_editor_settings', JSON.stringify(newSettings));
    message.success('Settings saved');
  };

  // --- Clipboard paste support ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) => item.type.includes('image'));
      if (imageItem) {
        const blob = imageItem.getAsFile();
        if (blob) {
          handleUpload(blob);
          message.success('Image pasted from clipboard!');
          e.preventDefault();
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [preview]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (preview) {
        setAddOnFile(file);
      } else {
        setPreview(e.target?.result as string);
        setCurrentProject(null);
        setInitialState(null);
      }
    };
    reader.readAsDataURL(file);
    setDragging(false);
    dragCounter.current = 0;
    return false;
  };

  const handleClear = () => {
    setPreview(null);
    setSvgContent(null);
    setAddOnFile(null);
    setCurrentProject(null);
    setInitialState(null);
    message.info('Image and SVG cleared.');
  };

  const handleSaveProject = (state: EditorState) => {
    if (!preview) return;

    // Create thumbnail (using the current canvas state would be better, but for now use preview)
    // Ideally ImageEditor should pass the thumbnail in onSave, but we can use the base image for now
    // or rely on the fact that the user just saved.

    // Actually, to get a proper thumbnail of the *edit*, we need the canvas data.
    // But onSave only passes state.
    // Let's assume for now we use the base image as thumbnail or we need to capture it.
    // Since we can't easily capture it here without ref, let's just use the base preview.
    // A better approach would be if onSave passed the dataURL of the result.

    const newProject: SavedProject = {
      id: currentProject?.id || Date.now().toString(),
      name: currentProject?.name || `Project ${new Date().toLocaleString()}`,
      thumbnail: preview, // TODO: Use actual canvas snapshot
      baseImage: preview,
      state: state,
      createdAt: currentProject?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveProjectToDB(newProject)
      .then(() => {
        // Update local state
        const newProjects = currentProject
          ? savedProjects.map((p) => (p.id === currentProject.id ? newProject : p))
          : [newProject, ...savedProjects];

        // Sort by updatedAt desc
        newProjects.sort((a, b) => b.updatedAt - a.updatedAt);

        setSavedProjects(newProjects);
        setCurrentProject(newProject);
        message.success('Project saved successfully!');
      })
      .catch((err) => {
        console.error(err);
        message.error('Failed to save project');
      });
  };

  const loadProject = (project: SavedProject) => {
    setPreview(project.baseImage);
    setInitialState(project.state);
    setCurrentProject(project);
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProjectFromDB(id)
      .then(() => {
        const newProjects = savedProjects.filter((p) => p.id !== id);
        setSavedProjects(newProjects);
        message.success('Project deleted');
      })
      .catch((err) => {
        console.error(err);
        message.error('Failed to delete project');
      });
  };

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              🖼️ Pics Editor <Tag color="cyan">Beta</Tag>
            </span>
            <Button icon={<SettingOutlined />} onClick={() => setShowSettings(true)}>
              Settings
            </Button>
          </div>
        }
        variant={'borderless'}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {!dragging && !preview && (
            <>
              <Upload.Dragger
                beforeUpload={handleUpload}
                showUploadList={false}
                accept=".png,.jpg,.jpeg"
                height={200}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for a single upload. You can also paste an image from clipboard.
                </p>
              </Upload.Dragger>

              {savedProjects.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>Recent Projects</Title>
                  <Row gutter={[16, 16]}>
                    {savedProjects.map((project) => (
                      <Col key={project.id} xs={12} sm={8} md={6} lg={4}>
                        <Card
                          hoverable
                          cover={
                            <div
                              style={{
                                height: 120,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f0f0f0',
                              }}
                            >
                              <img
                                alt={project.name}
                                src={project.thumbnail}
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                              />
                            </div>
                          }
                          onClick={() => loadProject(project)}
                          actions={[
                            <Popconfirm
                              title="Delete project?"
                              onConfirm={(e) => deleteProject(e!, project.id)}
                              onCancel={(e) => e?.stopPropagation()}
                              okText="Yes"
                              cancelText="No"
                            >
                              <DeleteOutlined
                                key="delete"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'red' }}
                              />
                            </Popconfirm>,
                          ]}
                        >
                          <Card.Meta
                            title={
                              <Text ellipsis style={{ width: '100%' }}>
                                {project.name}
                              </Text>
                            }
                            description={new Date(project.updatedAt).toLocaleDateString()}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </>
          )}

          {dragging && <DragOverlay />}

          {/* Preview */}
          {preview && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  {currentProject ? `Editing: ${currentProject.name}` : 'New Project'}
                </Title>
                <Button onClick={handleClear} danger>
                  Close Editor
                </Button>
              </div>
              <ImageEditor
                addOnFile={addOnFile}
                setAddOnFile={setAddOnFile}
                imageUrl={preview}
                initialState={initialState}
                onSave={handleSaveProject}
                settings={settings}
                onExport={(blob) => {
                  console.log('exported blob', blob);
                }}
              />
            </div>
          )}
        </Space>
      </Card>

      <SettingsModal
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialSettings={settings}
      />
    </DragDropWrapper>
  );
};

export default PicsEditor;
