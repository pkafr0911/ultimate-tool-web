import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CodeOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  DownloadOutlined,
  EditOutlined,
  FileAddOutlined,
  FormatPainterOutlined,
  MobileOutlined,
  TabletOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  Button,
  Card,
  Dropdown,
  MenuProps,
  message,
  Radio,
  Segmented,
  Space,
  Tooltip,
  Typography,
  Divider,
} from 'antd';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './styles.less';

const { Title, Text } = Typography;

const HtmlEditorPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<'rich' | 'html'>('html');
  const [htmlContent, setHtmlContent] = useState<string>(
    '<h2>Welcome to HTML Editor</h2><p>Edit your content here...</p>',
  );
  const [previewHtml, setPreviewHtml] = useState<string>(htmlContent);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // --- Helper function to format HTML properly ---
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
          const tagName = el.tagName.toLowerCase();

          formatted += `${indent}<${tagName}`;
          for (const attr of Array.from(el.attributes)) {
            formatted += ` ${attr.name}="${attr.value}"`;
          }
          formatted += '>';

          const childNodes = Array.from(el.childNodes);
          const hasChildren = childNodes.some(
            (child) => child.nodeType === Node.ELEMENT_NODE || child.textContent?.trim(),
          );

          if (hasChildren) formatted += '\n';

          for (const child of childNodes) {
            formatted += formatNode(child, level + 1);
          }

          if (hasChildren) formatted += indent;
          formatted += `</${tagName}>\n`;
        }

        return formatted;
      };

      const bodyNodes = Array.from(doc.body.childNodes);
      return bodyNodes
        .map((node) => formatNode(node))
        .join('')
        .trim();
    } catch (err) {
      console.error('Failed to format HTML:', err);
      return html;
    }
  };

  // --- Actions ---
  const prettifyHTML = () => {
    if (!htmlContent.trim()) return;
    try {
      const pretty = formatHTML(htmlContent);
      setHtmlContent(pretty);
      message.success('HTML prettified!');
    } catch (err) {
      message.error('Failed to prettify HTML.');
    }
  };

  const minifyHTML = () => {
    if (!htmlContent.trim()) return;
    const minified = htmlContent
      .replace(/\>[\r\n ]+\</g, '><')
      .replace(/(<.*?>)|\s+/g, (m, $1) => ($1 ? $1 : ' '))
      .trim();
    setHtmlContent(minified);
    message.success('HTML minified!');
  };

  const insertBoilerplate = () => {
    const boilerplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>Start editing...</p>
</body>
</html>`;
    setHtmlContent(boilerplate);
    message.success('Boilerplate inserted!');
  };

  const handleClear = () => {
    setHtmlContent('');
    message.info('Editor cleared');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      message.success('Copied HTML to clipboard!');
    } catch {
      message.error('Failed to copy HTML');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'index.html';
    link.click();
  };

  const openInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  // Sync preview
  useEffect(() => {
    setPreviewHtml(htmlContent);
  }, [htmlContent]);

  const templateItems: MenuProps['items'] = [
    {
      key: 'table',
      label: 'Table',
      onClick: () =>
        setHtmlContent(
          htmlContent +
            `\n<table border="1">
  <tr><th>Header 1</th><th>Header 2</th></tr>
  <tr><td>Data 1</td><td>Data 2</td></tr>
</table>`,
        ),
    },
    {
      key: 'form',
      label: 'Form',
      onClick: () =>
        setHtmlContent(
          htmlContent +
            `\n<form>
  <label>Name: <input type="text" /></label>
  <button type="submit">Submit</button>
</form>`,
        ),
    },
    {
      key: 'card',
      label: 'Card',
      onClick: () =>
        setHtmlContent(
          htmlContent +
            `\n<div style="border:1px solid #ccc; padding:16px; border-radius:8px; max-width:300px;">
  <h3>Card Title</h3>
  <p>Some content here...</p>
</div>`,
        ),
    },
  ];

  return (
    <div className="html-editor-page">
      <Card
        bordered={false}
        className="main-card"
        title={
          <div className="header-container">
            <Title level={3} style={{ margin: 0 }}>
              HTML Editor
            </Title>
            <Text type="secondary">Edit, preview, and format HTML code in real-time</Text>
          </div>
        }
        extra={
          <Segmented
            options={[
              { label: 'Code', value: 'html', icon: <CodeOutlined /> },
              { label: 'Rich Text', value: 'rich', icon: <EditOutlined /> },
            ]}
            value={mode}
            onChange={(val) => setMode(val as 'rich' | 'html')}
          />
        }
      >
        <div className="toolbar">
          <Space wrap>
            <Tooltip title="Insert HTML5 Boilerplate">
              <Button icon={<FileAddOutlined />} onClick={insertBoilerplate}>
                Boilerplate
              </Button>
            </Tooltip>
            <Dropdown menu={{ items: templateItems }}>
              <Button icon={<ExportOutlined />}>Insert Template</Button>
            </Dropdown>
            <Divider type="vertical" />
            <Tooltip title="Format Code">
              <Button
                icon={<FormatPainterOutlined />}
                onClick={prettifyHTML}
                disabled={mode === 'rich'}
              />
            </Tooltip>
            <Tooltip title="Minify Code">
              <Button icon={<CompressOutlined />} onClick={minifyHTML} disabled={mode === 'rich'} />
            </Tooltip>
            <Tooltip title="Clear Editor">
              <Button icon={<DeleteOutlined />} danger onClick={handleClear} />
            </Tooltip>
          </Space>
          <Space wrap>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              Copy
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Download
            </Button>
          </Space>
        </div>

        <div className="editor-container">
          {/* --- Left side: Editor --- */}
          <div className="editor-pane">
            {mode === 'rich' ? (
              <ReactQuill
                value={htmlContent}
                onChange={setHtmlContent}
                className="quill-editor"
                theme="snow"
              />
            ) : (
              <div className="monaco-wrapper">
                <Editor
                  height="100%"
                  language="html"
                  value={htmlContent}
                  onChange={(val) => setHtmlContent(val || '')}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    automaticLayout: true,
                    fontSize: 14,
                    padding: { top: 16 },
                  }}
                />
              </div>
            )}
          </div>

          {/* --- Right side: Live Preview --- */}
          <div className="preview-pane-wrapper">
            <div className="preview-toolbar">
              <Text strong>Live Preview</Text>
              <Space size="small">
                <Radio.Group
                  value={deviceMode}
                  onChange={(e) => setDeviceMode(e.target.value)}
                  size="small"
                  buttonStyle="solid"
                >
                  <Radio.Button value="desktop">
                    <Tooltip title="Desktop">
                      <DesktopOutlined />
                    </Tooltip>
                  </Radio.Button>
                  <Radio.Button value="tablet">
                    <Tooltip title="Tablet">
                      <TabletOutlined />
                    </Tooltip>
                  </Radio.Button>
                  <Radio.Button value="mobile">
                    <Tooltip title="Mobile">
                      <MobileOutlined />
                    </Tooltip>
                  </Radio.Button>
                </Radio.Group>
                <Tooltip title="Open in New Window">
                  <Button
                    type="text"
                    icon={<ExportOutlined />}
                    size="small"
                    onClick={openInNewTab}
                  />
                </Tooltip>
              </Space>
            </div>
            <div className="preview-area">
              <div className={`preview-frame-container ${deviceMode}`}>
                <iframe
                  title="preview"
                  srcDoc={previewHtml}
                  className="preview-iframe"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HtmlEditorPage;
