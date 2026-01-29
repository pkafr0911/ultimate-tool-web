import React, { useState } from 'react';
import { Card, Segmented, Space, Splitter, Tabs, Button } from 'antd';
import {
  CodeOutlined,
  EditOutlined,
  FormatPainterOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import { prettifyCSS, prettifyHTML, prettifyJS } from '../utils/formatters';
import { DEFAULT_CSS, DEFAULT_HTML, DEFAULT_SCRIPT } from '../constants';
import { usePlaygroundState } from '../hooks/usePlaygroundState';
import { handleCopy } from '@/helpers';
import { handleDownload } from '../utils/helpers';
import { useDarkMode } from '@/hooks/useDarkMode';
import PlaygroundToolbar from './common/PlaygroundToolbar';
import PreviewFrame from './common/PreviewFrame';
import CodeEditor from './common/CodeEditor';
import { usePreviewGenerator } from '../hooks/usePreviewGenerator';
import TemplateModal from './common/TemplateModal';

type Props = {
  onOpenSettings: () => void;
};

const HtmlPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  const { darkMode } = useDarkMode();

  const [htmlContent, setHtmlContent] = usePlaygroundState('playground_html_html', DEFAULT_HTML);
  const [cssContent, setCssContent] = usePlaygroundState('playground_html_css', DEFAULT_CSS);
  const [jsContent, setJsContent] = usePlaygroundState('playground_html_js', DEFAULT_SCRIPT);

  const [viewMode, setViewMode] = useState<'rich' | 'html'>('html');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'editor' | 'preview'>('none');

  const preview = usePreviewGenerator(htmlContent, cssContent, jsContent);

  const handleFormatAll = () => {
    if (viewMode === 'html') prettifyHTML(htmlContent, setHtmlContent);
    prettifyCSS(cssContent, setCssContent);
    prettifyJS(jsContent, setJsContent);
  };

  const handleReset = () => {
    if (confirm('Reset all code to default?')) {
      setHtmlContent(DEFAULT_HTML);
      setCssContent(DEFAULT_CSS);
      setJsContent(DEFAULT_SCRIPT);
    }
  };

  return (
    <Card
      className="html-card"
      variant="borderless"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          padding: '8px 12px',
          background: darkMode ? '#1f1f1f' : '#fafafa',
          border: darkMode ? '1px solid #333' : '1px solid #e5e5e5',
          borderRadius: 8,
        }}
      >
        <PlaygroundToolbar
          onSettings={onOpenSettings}
          onTemplates={() => setIsTemplateModalOpen(true)}
          onFormat={handleFormatAll}
          onCopy={() => handleCopy(preview, 'Copied full HTML!')}
          onDownload={() => handleDownload('index.html', preview)}
          onReset={handleReset}
        />
      </div>

      <TemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        type="html"
        onSelect={(data) => {
          setHtmlContent(data.html);
          setCssContent(data.css);
          setJsContent(data.javascript);
        }}
      />

      <div className="playground-splitter-container">
        <Splitter>
          <Splitter.Panel
            defaultSize="50%"
            min="20%"
            max="80%"
            className={`editor-pane ${fullscreenMode === 'editor' ? 'fullscreen' : ''} ${fullscreenMode === 'preview' ? 'hidden' : ''}`}
          >
            <div className="pane-header">
              <span style={{ fontWeight: 500 }}>Editor</span>
              <Button
                icon={
                  fullscreenMode === 'editor' ? <FullscreenExitOutlined /> : <FullscreenOutlined />
                }
                onClick={() => setFullscreenMode((prev) => (prev === 'editor' ? 'none' : 'editor'))}
                size="small"
                type="text"
              />
            </div>
            <Tabs
              defaultActiveKey="html"
              type="card"
              size="middle"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              items={[
                {
                  key: 'html',
                  label: 'HTML',
                  children: (
                    <>
                      <Space style={{ marginBottom: 8 }}>
                        <Segmented
                          options={[
                            { label: 'Code', value: 'html', icon: <CodeOutlined /> },
                            { label: 'Rich', value: 'rich', icon: <EditOutlined /> },
                          ]}
                          value={viewMode}
                          onChange={(val) => setViewMode(val as any)}
                        />
                        <Button
                          icon={<FormatPainterOutlined />}
                          onClick={() => prettifyHTML(htmlContent, setHtmlContent)}
                        >
                          Prettify
                        </Button>
                      </Space>

                      {viewMode === 'rich' ? (
                        <ReactQuill value={htmlContent} onChange={setHtmlContent} />
                      ) : (
                        <CodeEditor
                          height="calc(100vh - 120px)"
                          language="html"
                          value={htmlContent}
                          onChange={(val) => setHtmlContent(val || '')}
                        />
                      )}
                    </>
                  ),
                },
                {
                  key: 'css',
                  label: 'CSS',
                  children: (
                    <>
                      <Button
                        icon={<FormatPainterOutlined />}
                        style={{ marginBottom: 8 }}
                        onClick={() => prettifyCSS(cssContent, setCssContent)}
                      >
                        Prettify
                      </Button>
                      <CodeEditor
                        height="calc(100vh - 120px)"
                        language="css"
                        value={cssContent}
                        onChange={(val) => setCssContent(val || '')}
                      />
                    </>
                  ),
                },
                {
                  key: 'js',
                  label: 'JavaScript',
                  children: (
                    <>
                      <Button
                        icon={<FormatPainterOutlined />}
                        style={{ marginBottom: 8 }}
                        onClick={() => prettifyJS(jsContent, setJsContent)}
                      >
                        Prettify
                      </Button>
                      <CodeEditor
                        height="calc(100vh - 120px)"
                        language="javascript"
                        value={jsContent}
                        onChange={(val) => setJsContent(val || '')}
                      />
                    </>
                  ),
                },
              ]}
            />
          </Splitter.Panel>

          <Splitter.Panel
            className={`preview-pane ${fullscreenMode === 'preview' ? 'fullscreen' : ''} ${fullscreenMode === 'editor' ? 'hidden' : ''}`}
          >
            <div className="pane-header">
              <span style={{ fontWeight: 500 }}>Preview</span>
              <Button
                icon={
                  fullscreenMode === 'preview' ? <FullscreenExitOutlined /> : <FullscreenOutlined />
                }
                onClick={() =>
                  setFullscreenMode((prev) => (prev === 'preview' ? 'none' : 'preview'))
                }
                size="small"
                type="text"
              />
            </div>
            <PreviewFrame srcDoc={preview} title="Live HTML Preview" />
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

export default HtmlPlayground;
