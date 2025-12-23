import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Layout, Tag } from 'antd';
import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { PhotoEditorProvider } from './context';
import Toolbar from './components/Toolbar';
import CanvasArea from './components/CanvasArea';
import LayersPanel from './components/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel';
import UploadArea from './components/UploadArea';
import { useImageUpload } from './hooks/useImageUpload';
import styles from './styles.less';

const { Sider, Content } = Layout;

const PhotoEditor: React.FC = () => {
  const { preview, dragging, setDragging, dragCounter, handleUpload, addOnFile, setAddOnFile } =
    useImageUpload();

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
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <UploadArea onUpload={handleUpload} />
            </div>
          ) : (
            <PhotoEditorProvider
              imageUrl={preview}
              addOnFile={addOnFile}
              setAddOnFile={setAddOnFile}
            >
              <Layout style={{ height: '100%' }}>
                <Sider theme="light" width={60} className={styles.toolbarSider}>
                  <Toolbar />
                </Sider>
                <Content className={styles.canvasContent}>
                  <CanvasArea />
                </Content>
                <Sider theme="light" width={300} className={styles.propertiesSider}>
                  <PropertiesPanel />
                  <LayersPanel />
                </Sider>
              </Layout>
            </PhotoEditorProvider>
          )}
        </Card>
      </DragDropWrapper>
    </PageContainer>
  );
};

export default PhotoEditor;
