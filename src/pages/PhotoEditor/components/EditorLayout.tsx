import React from 'react';
import { Layout, Collapse } from 'antd';
import { usePhotoEditor } from '../context';
import Toolbar from './Toolbar';
import CanvasArea from './CanvasArea';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
import HistoryPanel from './HistoryPanel';
import PhotoEditorErrorBoundary from './PhotoEditorErrorBoundary';
import styles from '../styles.less';

const { Sider, Content } = Layout;
const { Panel } = Collapse;

const EditorLayout: React.FC = () => {
  const { history } = usePhotoEditor();

  return (
    <PhotoEditorErrorBoundary>
      <Layout style={{ height: '100%' }}>
        <Sider theme="light" width={60} className={styles.toolbarSider}>
          <Toolbar />
        </Sider>
        <Content className={styles.canvasContent}>
          <CanvasArea />
        </Content>
        <Sider theme="light" width={300} className={styles.propertiesSider}>
          <PropertiesPanel />
          <Collapse
            defaultActiveKey={['layers']}
            bordered={false}
            style={{ background: 'transparent' }}
          >
            <Panel header="Layers" key="layers" style={{ padding: 0 }}>
              <LayersPanel />
            </Panel>
            <Panel header="History" key="history" style={{ padding: 0 }}>
              <div style={{ overflow: 'hidden' }}>
                <HistoryPanel
                  entries={history.entries}
                  currentIndex={history.currentIndex}
                  onGoToEntry={history.goToEntry}
                  onUndo={history.undo}
                  onRedo={history.redo}
                  canUndo={history.canUndo}
                  canRedo={history.canRedo}
                  isProcessing={history.isProcessing}
                />
              </div>
            </Panel>
          </Collapse>
        </Sider>
      </Layout>
    </PhotoEditorErrorBoundary>
  );
};

export default EditorLayout;
