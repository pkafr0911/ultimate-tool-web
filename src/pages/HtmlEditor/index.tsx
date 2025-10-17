import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message, Segmented } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  CodeOutlined,
  EditOutlined,
  FormatPainterOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import Editor from '@monaco-editor/react';
import 'react-quill/dist/quill.snow.css';
import './styles.less';

const { Title } = Typography;

const HtmlEditorPage: React.FC = () => {
  const [mode, setMode] = useState<'rich' | 'html'>('html');
  const [htmlContent, setHtmlContent] = useState<string>(
    '<h2>Welcome to HTML Editor</h2><p>Edit your content here...</p>',
  );
  const [previewHtml, setPreviewHtml] = useState<string>(htmlContent);

  // --- Helper function to format HTML properly ---
  const formatHTML = (html: string) => {
    try {
      // Parse HTML into a DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Recursive formatter
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

          // Open tag with attributes
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

          // Recurse into children
          for (const child of childNodes) {
            formatted += formatNode(child, level + 1);
          }

          if (hasChildren) formatted += indent;
          formatted += `</${tagName}>\n`;
        }

        return formatted;
      };

      // Format <html> content inside <body>
      const bodyNodes = Array.from(doc.body.childNodes);
      return bodyNodes
        .map((node) => formatNode(node))
        .join('')
        .trim();
    } catch (err) {
      console.error('Failed to format HTML:', err);
      return html; // fallback
    }
  };

  // --- Prettify HTML code ---
  const prettifyHTML = () => {
    if (!htmlContent.trim()) {
      message.warning('No HTML content to prettify.');
      return;
    }
    try {
      const pretty = formatHTML(htmlContent);
      setHtmlContent(pretty);
      setPreviewHtml(pretty);
      message.success('HTML prettified!');
    } catch (err) {
      console.error(err);
      message.error('Failed to prettify HTML.');
    }
  };

  // Sync preview whenever content changes
  useEffect(() => {
    setPreviewHtml(htmlContent);
  }, [htmlContent, mode]);

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

  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            HTML Editor
          </Title>
          <Segmented
            options={[
              { label: 'HTML Mode', value: 'html', icon: <CodeOutlined /> },
              { label: 'Rich Mode', value: 'rich', icon: <EditOutlined /> },
            ]}
            value={mode}
            onChange={(val) => setMode(val as 'rich' | 'html')}
          />
        </Space>
      }
      className="html-card"
    >
      <div className="html-container">
        {/* --- Left side: Editor --- */}
        <div className="editor-pane">
          <Title level={5}>{mode === 'rich' ? 'Edit (Rich Text)' : 'Edit (HTML Code)'}</Title>

          {mode === 'rich' ? (
            <ReactQuill value={htmlContent} onChange={setHtmlContent} className="quill-editor" />
          ) : (
            <Editor
              height="600px"
              language="html"
              value={htmlContent}
              onChange={(val) => setHtmlContent(val || '')}
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          )}

          {/* Action buttons */}
          {mode === 'html' && (
            <Space style={{ marginTop: 16 }}>
              <Button icon={<FormatPainterOutlined />} onClick={prettifyHTML}>
                Prettify
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                Copy
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Download
              </Button>
            </Space>
          )}
        </div>

        {/* --- Right side: Live Preview --- */}
        <div className="preview-pane">
          <Title level={5}>Live Preview</Title>
          <div className="html-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    </Card>
  );
};

export default HtmlEditorPage;
