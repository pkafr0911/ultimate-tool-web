import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  FormatPainterOutlined,
  SettingOutlined,
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
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DEFAULT_CSS, DEFAULT_HTML, DEFAULT_SCRIPT } from './constants';
import './styles.less';

const { Title } = Typography;

const PlaygroundPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<'html' | 'playground'>('html');

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

  // --- Prettify HTML ---
  const prettifyHTML = () => {
    if (!htmlContent.trim()) return message.warning('No HTML content to prettify.');
    setHtmlContent(formatHTML(htmlContent));
    message.success('HTML prettified!');
  };

  // --- Prettify CSS ---
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
    } catch (err) {
      message.error('Failed to prettify CSS.');
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
  const [code, setCode] = useState(`// Try something!\nconsole.log("Hello, playground!");`);
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

  // --- Monaco Options ---
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
          { label: 'HTML / CSS / JS', value: 'html' },
          { label: 'JS / TS Runner', value: 'playground' },
        ]}
        value={mode}
        onChange={(val) => setMode(val as any)}
        style={{ marginBottom: 16 }}
      />

      {mode === 'html' ? (
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
                      <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)}>
                        Settings
                      </Button>
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
                      <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)}>
                        Settings
                      </Button>
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
                      <Button
                        icon={<FormatPainterOutlined />}
                        onClick={() => message.info('Add JS prettifier here')}
                      >
                        Prettify
                      </Button>
                      <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)}>
                        Settings
                      </Button>
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
      ) : (
        <Card className="playground-card" variant="borderless">
          <Space style={{ marginBottom: 16 }}>
            <Select
              value={language}
              onChange={(v) => setLanguage(v)}
              options={[
                { label: 'JavaScript', value: 'javascript' },
                { label: 'TypeScript', value: 'typescript' },
              ]}
            />
            <Button type="primary" onClick={runCode}>
              ▶ Run
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setIsModalOpen(true)}>
              Settings
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
