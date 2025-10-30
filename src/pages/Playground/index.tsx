import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  FormatPainterOutlined,
  Html5Outlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import cssbeautify from 'cssbeautify';
import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import prettier from 'prettier/standalone';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as Babel from '@babel/standalone';
import {
  DEFAULT_CODE,
  DEFAULT_CSS,
  DEFAULT_HTML,
  DEFAULT_REACT,
  DEFAULT_SCRIPT,
} from './constants';
import './styles.less';

const { Title } = Typography;

const PlaygroundPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<'html' | 'playground' | 'react'>('html');

  // --- Editor Settings Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editorOptions, setEditorOptions] = useState({
    minimap: true,
    wordWrap: true,
    fontSize: 14,
    lineNumbersMinChars: 2,
    lineDecorationsWidth: 0,
    lineNumbers: true,
  });

  const handleSaveSettings = (values: any) => {
    setEditorOptions(values);
    setIsModalOpen(false);
    message.success('Editor settings updated!');
  };

  // --- React Playground ---
  const [reactCode, setReactCode] = useState(DEFAULT_REACT);
  const [reactPreview, setReactPreview] = useState('');

  // JSX -> JS (Babel transpilation)
  const transpileTSXCode = (code: string) => {
    try {
      const output = Babel.transform(code, {
        presets: ['env', 'react', 'typescript'],
        filename: 'index.tsx',
      }).code;

      return output || '';
    } catch (e: any) {
      return `
      document.body.innerHTML = '<pre style="color:red;white-space:pre-wrap;">${e.message}</pre>';
    `;
    }
  };

  useEffect(() => {
    const jsCode = transpileTSXCode(reactCode);
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script>
          try {
            ${jsCode}
          } catch (err) {
            document.body.innerHTML = '<pre style="color:red;">' + err + '</pre>';
          }
        <\/script>
      </body>
    </html>`;
    setReactPreview(html);
  }, [reactCode]);

  // --- HTML / CSS / JS Playground ---
  const [viewMode, setViewMode] = useState<'rich' | 'html'>('html');
  const [htmlContent, setHtmlContent] = useState(DEFAULT_HTML);
  const [cssContent, setCssContent] = useState(DEFAULT_CSS);
  const [jsContent, setJsContent] = useState(DEFAULT_SCRIPT);
  const [preview, setPreview] = useState('');

  // --- Prettify HTML ---
  const formatHTML = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const formatNode = (node: Node, level = 0): string => {
        const indent = '  '.repeat(level);
        let formatted = '';
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text) formatted += indent + text + '\n';
          return formatted;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          formatted += `${indent}<${tag}`;
          for (const attr of Array.from(el.attributes)) {
            formatted += ` ${attr.name}="${attr.value}"`;
          }
          formatted += '>';
          const childNodes = Array.from(el.childNodes);
          const hasChildren = childNodes.some(
            (child) => child.nodeType === Node.ELEMENT_NODE || child.textContent?.trim(),
          );
          if (hasChildren) formatted += '\n';
          for (const child of childNodes) formatted += formatNode(child, level + 1);
          if (hasChildren) formatted += indent;
          formatted += `</${tag}>\n`;
        }
        return formatted;
      };
      const bodyNodes = Array.from(doc.body.childNodes);
      return bodyNodes
        .map((node) => formatNode(node))
        .join('')
        .trim();
    } catch {
      return html;
    }
  };

  const prettifyHTML = () => {
    if (!htmlContent.trim()) return message.warning('No HTML content to prettify.');
    setHtmlContent(formatHTML(htmlContent));
    message.success('HTML prettified!');
  };

  const prettifyCSS = () => {
    if (!cssContent.trim()) return message.warning('No CSS content to prettify.');
    try {
      const beautified = cssbeautify(cssContent, {
        indent: '  ',
        openbrace: 'end-of-line',
        autosemicolon: true,
      });
      setCssContent(beautified);
      message.success('CSS prettified!');
    } catch {
      message.error('Failed to prettify CSS.');
    }
  };

  const prettifyJS = async () => {
    const isHtmlMode = mode === 'html';
    const isReactMode = mode === 'react';
    const targetValue = isHtmlMode ? jsContent : isReactMode ? reactCode : code;

    if (!targetValue.trim()) {
      message.warning('No JavaScript content to prettify.');
      return;
    }

    try {
      const formatted = await prettier.format(targetValue, {
        parser: 'babel',
        plugins: [babel, estree],
        semi: true,
        singleQuote: true,
        tabWidth: 2,
      });

      if (isHtmlMode) setJsContent(formatted);
      else if (isReactMode) setReactCode(formatted);
      else setCode(formatted);

      message.success('JS prettified!');
    } catch (error) {
      console.error(error);
      message.error('Failed to prettify JavaScript.');
    }
  };

  useEffect(() => {
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head><style>${cssContent}</style></head>
      <body>
        ${htmlContent}
        <script>${jsContent}<\/script>
      </body>
      </html>`;
    setPreview(fullHTML);
  }, [htmlContent, cssContent, jsContent]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('Copied!');
    } catch {
      message.error('Failed to copy.');
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // --- JS/TS Playground ---
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('javascript');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string>('');

  const runCode = () => {
    let captured: string[] = [];
    const origLog = console.log;
    const origErr = console.error;

    console.log = (...args: any[]) => {
      captured.push(args.join(' '));
      origLog(...args);
    };
    console.error = (...args: any[]) => {
      captured.push('❌ ' + args.join(' '));
      origErr(...args);
    };

    try {
      const result = new Function(code)();
      if (result !== undefined) captured.push(`➡️ ${String(result)}`);
    } catch (err: any) {
      captured.push(`❌ Error: ${err.message}`);
    }

    console.log = origLog;
    console.error = origErr;
    setOutput(captured.join('\n'));
  };

  const monacoOptions = {
    minimap: { enabled: editorOptions.minimap },
    wordWrap: editorOptions.wordWrap ? 'on' : 'off',
    fontSize: editorOptions.fontSize,
    lineNumbersMinChars: editorOptions.lineNumbersMinChars,
    lineDecorationsWidth: editorOptions.lineDecorationsWidth,
    lineNumbers: editorOptions.lineNumbers ? 'on' : 'off',
  };

  return (
    <div className="playground-container">
      <Title level={2} className="playground-title">
        🧠 Ultimate Playground
      </Title>

      <Segmented
        options={[
          {
            label: (
              <div className="segmented-option">
                <Html5Outlined style={{ fontSize: 16, color: '#e34c26' }} />
                <span>HTML / CSS / JS</span>
              </div>
            ),
            value: 'html',
          },
          {
            label: (
              <div className="segmented-option">
                <CodeOutlined style={{ fontSize: 16, color: '#61dafb' }} />
                <span>React</span>
              </div>
            ),
            value: 'react',
          },
          {
            label: (
              <div className="segmented-option">
                <ThunderboltOutlined style={{ fontSize: 16, color: '#fadb14' }} />
                <span>JS / TS Runner</span>
              </div>
            ),
            value: 'playground',
          },
        ]}
        value={mode}
        onChange={(val) => setMode(val as any)}
        size="large"
        style={{
          marginBottom: 16,
          background: 'linear-gradient(145deg, #f0f2f5, #ffffff)',
          padding: 4,
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      />

      {mode === 'html' && (
        <Card className="html-card" variant="borderless">
          <Tabs
            defaultActiveKey="html"
            items={[
              {
                key: 'html',
                label: 'HTML',
                children: (
                  <>
                    <Space align="center" style={{ marginBottom: 12 }}>
                      <Segmented
                        options={[
                          { label: 'HTML Mode', value: 'html', icon: <CodeOutlined /> },
                          { label: 'Rich Mode', value: 'rich', icon: <EditOutlined /> },
                        ]}
                        value={viewMode}
                        onChange={(val) => setViewMode(val as any)}
                      />
                      <Button icon={<FormatPainterOutlined />} onClick={prettifyHTML}>
                        Prettify
                      </Button>
                      <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)} />
                    </Space>
                    {viewMode === 'rich' ? (
                      <ReactQuill value={htmlContent} onChange={setHtmlContent} />
                    ) : (
                      <Editor
                        height="400px"
                        language="html"
                        value={htmlContent}
                        onChange={(val) => setHtmlContent(val || '')}
                        options={monacoOptions}
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
                    <Space align="center" style={{ marginBottom: 12 }}>
                      <Button icon={<FormatPainterOutlined />} onClick={prettifyCSS}>
                        Prettify
                      </Button>
                      <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)} />
                    </Space>
                    <Editor
                      height="400px"
                      language="css"
                      value={cssContent}
                      onChange={(val) => setCssContent(val || '')}
                      options={monacoOptions}
                    />
                  </>
                ),
              },
              {
                key: 'js',
                label: 'JS',
                children: (
                  <>
                    <Space align="center" style={{ marginBottom: 12 }}>
                      <Button icon={<FormatPainterOutlined />} onClick={prettifyJS}>
                        Prettify
                      </Button>
                      <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)} />
                    </Space>
                    <Editor
                      height="400px"
                      language="javascript"
                      value={jsContent}
                      onChange={(val) => setJsContent(val || '')}
                      options={monacoOptions}
                    />
                  </>
                ),
              },
            ]}
          />

          <Space style={{ marginTop: 16 }}>
            <Button icon={<CopyOutlined />} onClick={() => handleCopy(preview)}>
              Copy All
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload('index.html', preview)}
            >
              Download HTML
            </Button>
          </Space>

          <div className="preview-pane" style={{ marginTop: 24 }}>
            <Title level={5}>Live Preview</Title>
            <iframe
              title="preview"
              srcDoc={preview}
              className="html-preview"
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
      )}
      {mode === 'playground' && (
        <Card className="playground-card" variant="borderless">
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)} />
            <Select
              value={language}
              onChange={(v) => setLanguage(v)}
              options={[
                { label: 'JavaScript', value: 'javascript' },
                { label: 'TypeScript', value: 'typescript' },
              ]}
            />

            <Button icon={<FormatPainterOutlined />} onClick={prettifyJS}>
              Prettify
            </Button>
            <Button type="primary" onClick={runCode}>
              ▶ Run
            </Button>
          </Space>

          <Editor
            height="400px"
            language={language}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme={darkMode ? 'vs-dark' : 'light'}
            options={monacoOptions}
          />

          <div className="playground-output">
            <Title level={5}>Output:</Title>
            <pre>{output || '// Your output will appear here'}</pre>
          </div>
        </Card>
      )}

      {mode === 'react' && (
        <Card className="react-card" variant="borderless">
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)} />
            <Button icon={<FormatPainterOutlined />} onClick={prettifyJS}>
              Prettify
            </Button>
          </Space>

          <Editor
            height="400px"
            language="javascript"
            value={reactCode}
            onChange={(val) => setReactCode(val || '')}
            theme={darkMode ? 'vs-dark' : 'light'}
            options={monacoOptions}
          />

          <div className="react-preview-pane" style={{ marginTop: 24 }}>
            <Title level={5}>Live React Preview</Title>
            <iframe
              title="react-preview"
              srcDoc={reactPreview}
              className="react-preview"
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
      )}

      {/* --- Settings Modal --- */}
      <Modal
        title="Editor Settings"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => document.getElementById('editor-settings-submit')?.click()}
        width={380}
        centered
      >
        <Form
          layout="vertical"
          initialValues={editorOptions}
          onFinish={handleSaveSettings}
          id="editor-settings-form"
          style={{ marginTop: 8 }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Form.Item label="Font Size" name="fontSize" style={{ marginBottom: 8 }}>
              <InputNumber min={10} max={30} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Line Numbers Min Chars"
              name="lineNumbersMinChars"
              style={{ marginBottom: 8 }}
            >
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Line Decorations Width"
              name="lineDecorationsWidth"
              style={{ marginBottom: 8 }}
            >
              <InputNumber min={0} max={20} style={{ width: '100%' }} />
            </Form.Item>

            <Space>
              <Form.Item
                label="Minimap"
                name="minimap"
                valuePropName="checked"
                style={{ marginBottom: 4 }}
              >
                <Switch size="small" />
              </Form.Item>
              <Form.Item
                label="Word Wrap"
                name="wordWrap"
                valuePropName="checked"
                style={{ marginBottom: 4 }}
              >
                <Switch size="small" />
              </Form.Item>
              <Form.Item
                label="Line Numbers"
                name="lineNumbers"
                valuePropName="checked"
                style={{ marginBottom: 4 }}
              >
                <Switch size="small" />
              </Form.Item>
            </Space>
          </Space>

          <button type="submit" id="editor-settings-submit" style={{ display: 'none' }} />
        </Form>
      </Modal>
    </div>
  );
};

export default PlaygroundPage;
