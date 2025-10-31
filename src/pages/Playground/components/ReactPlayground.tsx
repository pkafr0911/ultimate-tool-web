import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Tabs, Typography, Segmented, Splitter } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';
import { SettingOutlined, FormatPainterOutlined, FileAddOutlined } from '@ant-design/icons';
import { prettifyCSS, prettifyJS } from '../utils/formatters';
import { DEFAULT_REACT_TS, REACT_EXTRA_LIB, DEFAULT_CSS, DEFAULT_REACT_JS } from '../constants';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { useDarkMode } from '@/hooks/useDarkMode';
import { transpileCode } from '../utils/transpileReact';

type Props = { onOpenSettings: () => void };

const { Title } = Typography;

type FileTab = {
  name: string;
  language: 'javascript' | 'typescript' | 'css';
  content: string;
};

const ReactPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  const { darkMode } = useDarkMode();
  const monaco = useMonaco();
  const { monacoOptions } = useMonacoOption();

  const [tabs, setTabs] = useState<FileTab[]>([
    { name: 'App.tsx', language: 'typescript', content: DEFAULT_REACT_TS },
  ]);
  const [activeTab, setActiveTab] = useState('App.tsx');
  const [splitDirection, setSplitDirection] = useState<'vertical' | 'horizontal'>('horizontal');

  const activeFile = tabs.find((t) => t.name === activeTab)!;

  useEffect(() => {
    if (monaco) {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        jsxImportSource: 'react',
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
      });

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_EXTRA_LIB,
        'file:///node_modules/@types/react/index.d.ts',
      );
    }
  }, [monaco]);

  const preview = useMemo(() => {
    const scriptFile = tabs.find((t) => ['typescript', 'javascript'].includes(t.language))!;
    const cssFiles = tabs.filter((t) => t.language === 'css');

    const jsCode = transpileCode(
      scriptFile.content,
      scriptFile.language as 'javascript' | 'typescript',
    );
    const cssCode = cssFiles.map((f) => `<style>${f.content}</style>`).join('\n');

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Live React Preview</title>
          ${cssCode}
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        </head>
        <body style="margin:0;">
          <div id="root"></div>
          <script type="module">
            window.addEventListener('DOMContentLoaded', () => {
              try {
                ${jsCode}
              } catch (err) {
                document.body.innerHTML = '<pre style="color:red;">' + err + '</pre>';
                console.error(err);
              }
            });
          <\/script>
        </body>
      </html>
    `;
  }, [tabs]);

  const addCssFile = () => {
    const newFile: FileTab = {
      name: `style${tabs.filter((f) => f.language === 'css').length + 1}.css`,
      language: 'css',
      content: DEFAULT_CSS,
    };
    setTabs([...tabs, newFile]);
    setActiveTab(newFile.name);
  };

  const switchAppFile = () => {
    if (activeTab === 'App.tsx') {
      setTabs(
        tabs.map((t) =>
          t.name === 'App.tsx'
            ? { name: 'App.jsx', language: 'javascript', content: DEFAULT_REACT_JS }
            : t,
        ),
      );
      setActiveTab('App.jsx');
    } else if (activeTab === 'App.jsx') {
      setTabs(
        tabs.map((t) =>
          t.name === 'App.jsx'
            ? { name: 'App.tsx', language: 'typescript', content: DEFAULT_REACT_TS }
            : t,
        ),
      );
      setActiveTab('App.tsx');
    }
  };

  return (
    <Card
      className="react-card"
      variant="borderless"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
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
        {/* Left section: action buttons */}
        <Space wrap>
          <Button
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            type="text"
            title="Settings"
          />

          {(activeTab === 'App.tsx' || activeTab === 'App.jsx') && (
            <Button onClick={switchAppFile} icon={<FileAddOutlined />} type="default">
              {activeTab === 'App.tsx' ? 'Switch to JSX' : 'Switch to TSX'}
            </Button>
          )}

          <Button
            icon={<FormatPainterOutlined />}
            onClick={() => {
              if (activeFile.language === 'css') {
                prettifyCSS(activeFile.content, (val) =>
                  setTabs(tabs.map((t) => (t.name === activeTab ? { ...t, content: val } : t))),
                );
              } else {
                prettifyJS(
                  activeFile.content,
                  (val) =>
                    setTabs(tabs.map((t) => (t.name === activeTab ? { ...t, content: val } : t))),
                  activeFile.language,
                );
              }
            }}
          >
            Prettify
          </Button>

          <Button icon={<FileAddOutlined />} type="primary" onClick={addCssFile}>
            Add CSS
          </Button>
        </Space>

        {/* Right section: layout switch */}
        <Space align="center" style={{ marginLeft: 'auto' }}>
          <Typography.Text type="secondary" style={{ marginRight: 4, whiteSpace: 'nowrap' }}>
            Layout:
          </Typography.Text>
          <Segmented
            options={[
              { label: 'Horizontal', value: 'horizontal' },
              { label: 'Vertical', value: 'vertical' },
            ]}
            value={splitDirection}
            onChange={(val) => setSplitDirection(val as 'vertical' | 'horizontal')}
            block
            size="middle"
            style={{ minWidth: 180 }}
          />
        </Space>
      </div>

      {/* Splitter fills the rest */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
        }}
      >
        <Splitter
          key={splitDirection} // 👈 forces re-render when layout changes
          layout={splitDirection}
          style={{
            flex: 1,
            minHeight: 'calc(100vh - 120px)',
            width: '100%',
            height: splitDirection === 'vertical' ? 'calc(100vh - 120px)' : undefined,
            display: 'flex',
          }}
        >
          {/* Left/Top Panel: Code Editor */}
          <Splitter.Panel defaultSize="50%" min="25%" max="75%">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              type="editable-card"
              hideAdd
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              onEdit={(targetKey, action) => {
                if (action === 'remove') {
                  const newTabs = tabs.filter((t) => t.name !== targetKey);
                  setTabs(newTabs);
                  if (activeTab === targetKey && newTabs.length) setActiveTab(newTabs[0].name);
                }
              }}
            >
              {tabs.map((file) => (
                <Tabs.TabPane
                  tab={file.name}
                  key={file.name}
                  closable={file.name !== 'App.tsx' && file.name !== 'App.jsx'}
                  style={{ height: '100%', flex: 1, minHeight: 0 }}
                >
                  <div style={{ height: '100%', flex: 1, minHeight: 0 }}>
                    <Editor
                      height="calc(100vh - 120px)"
                      language={file.language}
                      value={file.content}
                      onChange={(val) => {
                        setTabs(
                          tabs.map((t) =>
                            t.name === file.name ? { ...t, content: val || '' } : t,
                          ),
                        );
                      }}
                      theme={darkMode ? 'vs-dark' : 'light'}
                      options={monacoOptions}
                      path={`file:///${file.name}`}
                    />
                  </div>
                </Tabs.TabPane>
              ))}
            </Tabs>
          </Splitter.Panel>

          {/* Right/Bottom Panel: Preview */}
          <Splitter.Panel>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                flex: 1,
                minHeight: 0,
              }}
            >
              <Title level={5} style={{ padding: '8px 12px', margin: 0 }}>
                Live React Preview
              </Title>
              <iframe
                title="react-preview"
                srcDoc={preview}
                sandbox="allow-scripts allow-same-origin"
                style={{
                  flex: 1,
                  borderTop: splitDirection === 'horizontal' ? '1px solid #ddd' : undefined,
                  borderRadius: 8,
                  minHeight: 0,
                }}
              />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

export default ReactPlayground;
