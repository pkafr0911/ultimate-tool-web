import React, { useEffect, useMemo, useState } from 'react';
import { Card, Space, Tabs, Typography, Segmented, Splitter, Button, Modal } from 'antd';
import { useMonaco } from '@monaco-editor/react';
import { FileAddOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { prettifyCSS, prettifyJS } from '../utils/formatters';
import { DEFAULT_REACT_TS, REACT_EXTRA_LIB, DEFAULT_REACT_CSS } from '../constants';
import { useDarkMode } from '@/hooks/useDarkMode';
import { transpileCode } from '../utils/transpileReact';
import { usePlaygroundState } from '../hooks/usePlaygroundState';
import PlaygroundToolbar from './common/PlaygroundToolbar';
import PreviewFrame from './common/PreviewFrame';
import CodeEditor from './common/CodeEditor';
import TemplateModal from './common/TemplateModal';

type Props = { onOpenSettings: () => void };

const { Text } = Typography;

type FileTab = {
  name: string;
  language: 'javascript' | 'typescript' | 'css';
  content: string;
};

const ReactPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  const { darkMode } = useDarkMode();
  const monaco = useMonaco();

  const [tabs, setTabs] = usePlaygroundState<FileTab[]>('playground_react_tabs', [
    { name: 'App.tsx', language: 'typescript', content: DEFAULT_REACT_TS },
  ]);
  const [activeTab, setActiveTab] = useState('App.tsx');
  const [splitDirection, setSplitDirection] = useState<'vertical' | 'horizontal'>('horizontal');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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
      });

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        REACT_EXTRA_LIB,
        'file:///node_modules/@types/react/index.d.ts',
      );
    }
  }, [monaco]);

  const [srcDoc, setSrcDoc] = useState('');
  const blobUrlsRef = React.useRef<string[]>([]);

  useEffect(() => {
    const compile = async () => {
      try {
        // Cleanup old blobs
        blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        blobUrlsRef.current = [];

        const imports: Record<string, string> = {
          react: 'https://esm.sh/react@18.2.0',
          'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client',
        };

        let appFileFound = false;

        // Process files
        for (const file of tabs) {
          let code = '';
          if (file.language === 'css') {
            const safeCss = JSON.stringify(file.content);
            code = `
              const style = document.createElement('style');
              style.textContent = ${safeCss};
              document.head.appendChild(style);
            `;
          } else {
            code = transpileCode(
              file.content,
              file.language === 'typescript' ? 'typescript' : 'javascript',
            );
          }

          const blob = new Blob([code], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);

          // Map for entry point (relative to document)
          imports[`./${file.name}`] = url;

          // Map for internal imports (rewritten by Babel to playground-src/...)
          imports[`playground-src/${file.name}`] = url;

          const nameWithoutExt = file.name.replace(/\.(tsx|jsx|ts|js|css)$/, '');
          if (nameWithoutExt !== file.name) {
            imports[`./${nameWithoutExt}`] = url;
            imports[`playground-src/${nameWithoutExt}`] = url;
          }

          if (file.name === 'App.tsx' || file.name === 'App.jsx') {
            appFileFound = true;
          }
        }

        if (!appFileFound) {
          setSrcDoc(
            '<html><body><pre style="color:red">Entry file App.tsx or App.jsx not found.</pre></body></html>',
          );
          return;
        }

        const importMapJson = JSON.stringify({ imports });

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>body { font-family: sans-serif; padding: 1rem; }</style>
              <script type="importmap">
                ${importMapJson}
              </script>
            </head>
            <body>
              <div id="root"></div>
              <script type="module">
                import React from 'react';
                import { createRoot } from 'react-dom/client';
                import AppComp from './App';

                const root = createRoot(document.getElementById('root'));
                try {
                  const Component = AppComp && (AppComp.default || AppComp.App || AppComp);
                  if (Component) {
                    root.render(React.createElement(Component));
                  } else {
                    document.body.innerHTML = '<pre style="color:red">Could not find default export in App.tsx/jsx</pre>';
                  }
                } catch (err) {
                  document.body.innerHTML = '<pre style="color:red">' + err.message + '</pre>';
                }
                
                window.addEventListener('error', (event) => {
                   document.body.innerHTML = '<pre style="color:red">' + event.message + '</pre>';
                });
              </script>
            </body>
          </html>
        `;
        setSrcDoc(html);
      } catch (err: any) {
        console.error(err);
        setSrcDoc(`<html><body><pre style="color:red">${err.message}</pre></body></html>`);
      }
    };

    const timeout = setTimeout(compile, 1000);
    return () => clearTimeout(timeout);
  }, [tabs]);

  const handleFormat = () => {
    const newTabs = tabs.map((t) => {
      if (t.name === activeTab) {
        let formatted = t.content;
        if (t.language === 'css') prettifyCSS(t.content, (v) => (formatted = v));
        else prettifyJS(t.content, (v) => (formatted = v));
        return { ...t, content: formatted };
      }
      return t;
    });
    setTabs(newTabs);
  };

  const handleReset = () => {
    if (confirm('Reset to default template?')) {
      setTabs([{ name: 'App.tsx', language: 'typescript', content: DEFAULT_REACT_TS }]);
      setActiveTab('App.tsx');
    }
  };

  const updateFileContent = (val: string) => {
    const newTabs = tabs.map((t) => (t.name === activeTab ? { ...t, content: val } : t));
    setTabs(newTabs);
  };

  const showHelp = () => {
    Modal.info({
      title: 'How to use React Playground',
      width: 600,
      content: (
        <div>
          <p>Welcome to the React Playground! Here's how to get started:</p>
          <ul>
            <li>
              <strong>Main Entry:</strong> The entry point is always <code>App.tsx</code> (or{' '}
              <code>App.jsx</code>). You must define a component named <code>App</code>.
            </li>
            <li>
              <strong>Adding Files:</strong> Click "New File" to add components or styles.
              <ul>
                <li>
                  For React components, use <code>.tsx</code> or <code>.jsx</code> extension.
                </li>
                <li>
                  For styles, use <code>.css</code> extension.
                </li>
              </ul>
            </li>
            <li>
              <strong>Imports:</strong> You can import other files you create using relative paths.
              For example: <code>import Header from './Header';</code> or{' '}
              <code>import './styles.css';</code>.
            </li>
            <li>
              <strong>External Libraries:</strong> React and ReactDOM are pre-loaded. You can import
              them as usual.
            </li>
          </ul>
        </div>
      ),
    });
  };

  return (
    <Card
      className="react-card"
      variant="borderless"
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
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
          onFormat={handleFormat}
          onReset={handleReset}
          extraActions={
            <Space>
              <Button
                icon={<FileAddOutlined />}
                onClick={() => {
                  const name = prompt('File name (e.g. Component.tsx, utils.ts, style.css):');
                  if (name) {
                    let lang: FileTab['language'] = 'javascript';
                    let content = '';
                    if (name.endsWith('.tsx') || name.endsWith('.ts')) lang = 'typescript';
                    if (name.endsWith('.css')) {
                      lang = 'css';
                      content = DEFAULT_REACT_CSS;
                    }

                    setTabs([
                      ...tabs,
                      {
                        name,
                        language: lang,
                        content,
                      },
                    ]);
                    setActiveTab(name);
                  }
                }}
              >
                New File
              </Button>
              <Button icon={<QuestionCircleOutlined />} onClick={showHelp}>
                Help
              </Button>
            </Space>
          }
        />

        <Space align="center" style={{ marginLeft: 'auto' }}>
          <Text type="secondary" style={{ marginRight: 4 }}>
            Layout:
          </Text>
          <Segmented
            options={[
              { label: 'Horizontal', value: 'horizontal' },
              { label: 'Vertical', value: 'vertical' },
            ]}
            value={splitDirection}
            onChange={(val) => setSplitDirection(val as 'vertical' | 'horizontal')}
            size="middle"
            style={{ minWidth: 180 }}
          />
        </Space>
      </div>

      <TemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        type="react"
        onSelect={(data) => {
          setTabs(data);
          setActiveTab(data[0].name);
        }}
      />

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Splitter
          layout={splitDirection}
          style={{
            flex: 1,
            display: 'flex',
            height: splitDirection === 'vertical' ? 'calc(100vh - 120px)' : undefined,
            width: '100%',
          }}
        >
          <Splitter.Panel defaultSize="50%" min="25%" max="75%">
            <Tabs
              type="editable-card"
              activeKey={activeTab}
              onChange={setActiveTab}
              onEdit={(targetKey, action) => {
                if (action === 'remove' && typeof targetKey === 'string') {
                  const newTabs = tabs.filter((t) => t.name !== targetKey);
                  setTabs(newTabs);
                  if (activeTab === targetKey) setActiveTab(newTabs[0]?.name || '');
                }
              }}
              items={tabs.map((file) => ({
                label: file.name,
                key: file.name,
                closable: file.name !== 'App.tsx' && file.name !== 'App.jsx',
                children: (
                  <CodeEditor
                    height="calc(100vh - 160px)"
                    language={file.language}
                    value={file.content}
                    onChange={(val) => updateFileContent(val || '')}
                    path={file.name}
                  />
                ),
              }))}
              style={{ height: '100%' }}
            />
          </Splitter.Panel>

          <Splitter.Panel>
            <PreviewFrame srcDoc={srcDoc} title="React Live Preview" />
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

export default ReactPlayground;
