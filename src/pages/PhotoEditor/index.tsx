import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Tag, Divider } from 'antd';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { PhotoEditorProvider } from './context';
import EditorLayout from './components/EditorLayout';
import UploadArea from './components/UploadArea';
import SavedProjectsList from './components/SavedProjectsList';
import { useImageUpload } from './hooks/useImageUpload';
import { useProjects } from './hooks/useProjects';
import styles from './styles.less';
import './styles.less';

const PhotoEditor: React.FC = () => {
  const {
    preview,
    dragging,
    setDragging,
    dragCounter,
    handleUpload,
    addOnFile,
    setAddOnFile,
    loadProject,
    initialProject,
  } = useImageUpload();

  const { savedProjects, deleteProject } = useProjects();

  return (
    <PageContainer
      title={
        <span>
          Photo Editor <Tag color="cyan">Beta</Tag>
        </span>
      }
    >
      <DragDropWrapper
        setDragging={setDragging}
        dragCounter={dragCounter}
        handleUpload={handleUpload}
      >
        <Card className={styles.editorContainer} bodyStyle={{ padding: 0, height: '100%' }}>
          {dragging && <DragOverlay />}

          {!preview ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '20px',
                overflowY: 'auto',
              }}
            >
              <UploadArea onUpload={handleUpload} />
              {savedProjects.length > 0 && (
                <div style={{ width: '100%', maxWidth: '800px', marginTop: '40px' }}>
                  <Divider>Or Open Saved Project</Divider>
                  <SavedProjectsList
                    projects={savedProjects}
                    onLoad={loadProject}
                    onDelete={deleteProject}
                  />
                </div>
              )}
            </div>
          ) : (
            <PhotoEditorProvider
              imageUrl={preview}
              initialProject={initialProject}
              addOnFile={addOnFile}
              setAddOnFile={setAddOnFile}
            >
              <EditorLayout />
            </PhotoEditorProvider>
          )}
        </Card>
      </DragDropWrapper>
    </PageContainer>
  );
};

export default PhotoEditor;
