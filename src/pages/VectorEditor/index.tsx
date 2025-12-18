import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Layout } from 'antd';
import { VectorEditorProvider } from './context';
import Toolbar from './components/Toolbar';
import CanvasArea from './components/CanvasArea';
import PropertiesPanel from './components/PropertiesPanel';
import styles from './styles.less';

const { Sider, Content } = Layout;

const VectorEditor: React.FC = () => {
  return (
    <PageContainer title="Vector Editor">
      <VectorEditorProvider>
        <Card className={styles.editorContainer} bodyStyle={{ padding: 0, height: '100%' }}>
          <Layout style={{ height: '80vh' }}>
            <Sider theme="light" width={60} className={styles.toolbarSider}>
              <Toolbar />
            </Sider>
            <Content className={styles.canvasContent}>
              <CanvasArea />
            </Content>
            <Sider theme="light" width={300} className={styles.propertiesSider}>
              <PropertiesPanel />
            </Sider>
          </Layout>
        </Card>
      </VectorEditorProvider>
    </PageContainer>
  );
};

export default VectorEditor;
