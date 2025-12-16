import React from 'react';
import { Button, Card, Space, Tag } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import ImageEditor from './components/ImageEditor';
import SettingsModal from './components/SettingsModal';
import ProjectList from './components/ProjectList';
import UploadArea from './components/UploadArea';
import EditorHeader from './components/EditorHeader';
import { useProjects } from './hooks/useProjects';
import { useEditorSettings } from './hooks/useEditorSettings';
import { useImageUpload } from './hooks/useImageUpload';
import './styles.less';

const PicsEditor: React.FC = () => {
  // Custom Hooks
  const {
    savedProjects,
    currentProject,
    initialState,
    saveProject,
    deleteProject,
    loadProjectIntoEditor,
    clearCurrentProject,
  } = useProjects();

  const { settings, showSettings, updateSettings, toggleSettings } = useEditorSettings();

  const {
    preview,
    setPreview,
    addOnFile,
    setAddOnFile,
    dragging,
    setDragging,
    dragCounter,
    handleUpload,
    handleClear,
  } = useImageUpload();

  // Handlers
  const onProjectLoad = (project: any) => {
    setPreview(project.baseImage);
    loadProjectIntoEditor(project);
  };

  const onEditorClose = () => {
    handleClear();
    clearCurrentProject();
  };

  const onSaveProject = (state: any) => {
    if (preview) {
      saveProject(preview, state);
    }
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
            <Button icon={<SettingOutlined />} onClick={() => toggleSettings(true)}>
              Settings
            </Button>
          </div>
        }
        variant={'borderless'}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {!dragging && !preview && (
            <>
              <UploadArea onUpload={handleUpload} />
              <ProjectList
                projects={savedProjects}
                onLoad={onProjectLoad}
                onDelete={deleteProject}
              />
            </>
          )}

          {dragging && <DragOverlay />}

          {/* Editor View */}
          {preview && (
            <div>
              <EditorHeader projectName={currentProject?.name} onClose={onEditorClose} />
              <ImageEditor
                addOnFile={addOnFile}
                setAddOnFile={setAddOnFile}
                imageUrl={preview}
                initialState={initialState}
                onSave={onSaveProject}
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
        onCancel={() => toggleSettings(false)}
        onSave={updateSettings}
        initialSettings={settings}
      />
    </DragDropWrapper>
  );
};

export default PicsEditor;
