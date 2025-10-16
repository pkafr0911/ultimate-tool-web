import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, message, Segmented } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  FileMarkdownOutlined,
  EditOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import Editor from '@monaco-editor/react';
import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';
import 'react-quill/dist/quill.snow.css';
import './styles.less';

const { Title } = Typography;

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  codeBlockStyle: 'fenced',
});

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const ReadmeEditorPage: React.FC = () => {
  const [mode, setMode] = useState<'rich' | 'markdown'>('rich');
  const [htmlContent, setHtmlContent] = useState<string>(
    '<h2>Welcome to README Editor</h2><p>Start typing here...</p>',
  );
  const [markdownContent, setMarkdownContent] = useState<string>('');

  // HTML → Markdown (for rich editor)
  useEffect(() => {
    if (mode === 'rich') {
      setMarkdownContent(turndownService.turndown(htmlContent));
    }
  }, [htmlContent, mode]);

  // Markdown → HTML (for markdown editor)
  useEffect(() => {
    if (mode === 'markdown') {
      setHtmlContent(mdParser.render(markdownContent));
    }
  }, [markdownContent, mode]);

  const handleCopy = async () => {
    try {
      const textToCopy = mode === 'rich' ? markdownContent : markdownContent;
      await navigator.clipboard.writeText(textToCopy);
      message.success('Copied Markdown to clipboard!');
    } catch {
      message.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'README.md';
    link.click();
  };

  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            README Editor
          </Title>
          <Segmented
            options={[
              { label: 'Rich Mode', value: 'rich', icon: <EditOutlined /> },
              { label: 'Markdown Mode', value: 'markdown', icon: <FileMarkdownOutlined /> },
            ]}
            value={mode}
            onChange={(val) => setMode(val as 'rich' | 'markdown')}
          />
        </Space>
      }
      className="readme-card"
    >
      <div className="readme-container">
        {/* Left side: Editable */}
        <div className="editor-pane">
          <Title level={5}>{mode === 'rich' ? 'Edit (Rich Text)' : 'Edit (Raw Markdown)'}</Title>

          {mode === 'rich' ? (
            <ReactQuill value={htmlContent} onChange={setHtmlContent} className="quill-editor" />
          ) : (
            <Editor
              height="600px"
              language="markdown"
              value={markdownContent}
              onChange={(val) => setMarkdownContent(val || '')}
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          )}
        </div>

        {/* Right side: Output */}
        <div className="preview-pane">
          <Title level={5}>{mode === 'rich' ? 'Raw Markdown (.md)' : 'Rendered Preview'}</Title>

          {mode === 'rich' ? (
            <Editor
              height="600px"
              language="markdown"
              value={markdownContent}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          ) : (
            <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          )}

          <Space className="button-group">
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              Copy
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Download
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default ReadmeEditorPage;
