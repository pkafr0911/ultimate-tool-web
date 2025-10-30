import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Typography, Tabs } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';
import { prettifyJS } from '../utils/formatters';
import { FormatPainterOutlined, SettingOutlined, FileAddOutlined } from '@ant-design/icons';
import { DEFAULT_REACT, REACT_EXTRA_LIB, DEFAULT_CSS } from '../constants';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { useDarkMode } from '@/hooks/useDarkMode';
import { transpileTSXCode } from '../utils/transpileReact';

type Props = {
  onOpenSettings: () => void;
};

const { Title } = Typography;

type FileTab = {
  name: string;
  language: string;
  content: string;
};

const ReactPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  const { darkMode } = useDarkMode();
  const monaco = useMonaco();
  const { monacoOptions } = useMonacoOption();

  // Manage multiple tabs/files
  const [tabs, setTabs] = useState<FileTab[]>([
    { name: 'App.tsx', language: 'typescript', content: DEFAULT_REACT },
  ]);
  const [activeTab, setActiveTab] = useState<string>('App.tsx');

  const activeFile = tabs.find((t) => t.name === activeTab)!;

  // Monaco setup
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

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
    }
  }, [monaco]);

  // Preview HTML (embed all CSS files too)
  const preview = useMemo(() => {
    const tsxFile = tabs.find((t) => t.language === 'typescript')!;
    const cssFiles = tabs.filter((t) => t.language === 'css');

    const jsCode = transpileTSXCode(tsxFile.content);
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
        <body>
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

  // Add new CSS file
  const addCssFile = () => {
    const newFile: FileTab = {
      name: `style${tabs.filter((f) => f.language === 'css').length + 1}.css`,
      language: 'css',
      content: DEFAULT_CSS,
    };
    setTabs([...tabs, newFile]);
    setActiveTab(newFile.name);
  };

  return (
    <Card className="react-card" variant="borderless">
      {/* Toolbar */}
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<SettingOutlined />} onClick={onOpenSettings} />
        <Button
          icon={<FormatPainterOutlined />}
          onClick={() =>
            prettifyJS(
              activeFile.content,
              (val) => {
                setTabs(tabs.map((t) => (t.name === activeTab ? { ...t, content: val } : t)));
              },
              'typescript',
            )
          }
        >
          Prettify
        </Button>
        <Button icon={<FileAddOutlined />} onClick={addCssFile}>
          Add CSS
        </Button>
      </Space>

      {/* File Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        type="editable-card"
        hideAdd
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
            closable={file.name !== 'App.tsx'} // ✅ App.tsx is not closable
          >
            <Editor
              height="400px"
              language={file.language}
              value={file.content}
              onChange={(val) => {
                setTabs(tabs.map((t) => (t.name === file.name ? { ...t, content: val || '' } : t)));
              }}
              theme={darkMode ? 'vs-dark' : 'light'}
              options={monacoOptions}
              path={`file:///${file.name}`}
            />
          </Tabs.TabPane>
        ))}
      </Tabs>

      {/* Preview */}
      <div className="react-preview-pane" style={{ marginTop: 24 }}>
        <Title level={5}>Live React Preview</Title>
        <iframe
          title="react-preview"
          srcDoc={preview}
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fff',
          }}
        />
      </div>
    </Card>
  );
};

export default ReactPlayground;
