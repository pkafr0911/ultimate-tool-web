import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  FileMarkdownOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, Card, message, Segmented, Space, Typography } from 'antd';
import MarkdownIt from 'markdown-it';
import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TurndownService from 'turndown';
import hljs from 'highlight.js';
import 'github-markdown-css/github-markdown-light.css';
import 'highlight.js/styles/github.css';
import './styles.less';

const { Title } = Typography;

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  codeBlockStyle: 'fenced',
});

// Configure MarkdownIt + syntax highlight
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, {
            language: lang,
            ignoreIllegals: true,
          }).value
        }</code></pre>`;
      } catch (__) {}
    }
    return `<pre class="hljs"><code>${mdParser.utils.escapeHtml(str)}</code></pre>`;
  },
});

const ReadmeEditorPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<'rich' | 'markdown'>('markdown');
  const [htmlContent, setHtmlContent] = useState<string>(
    '<h2>Welcome to README Editor</h2><p>Start typing here...</p>',
  );
  const [markdownContent, setMarkdownContent] = useState<string>('');

  // Load GitHub theme for dark/light mode
  useEffect(() => {
    import(
      darkMode
        ? 'github-markdown-css/github-markdown-dark.css'
        : 'github-markdown-css/github-markdown-light.css'
    );
    import(darkMode ? 'highlight.js/styles/github-dark.css' : 'highlight.js/styles/github.css');
  }, [darkMode]);

  // HTML → Markdown
  useEffect(() => {
    if (mode === 'rich') {
      setMarkdownContent(turndownService.turndown(htmlContent));
    }
  }, [htmlContent, mode]);

  // Markdown → HTML
  useEffect(() => {
    if (mode === 'markdown') {
      setHtmlContent(mdParser.render(markdownContent));
    }
  }, [markdownContent, mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
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
              { label: 'Markdown Mode', value: 'markdown', icon: <FileMarkdownOutlined /> },
              { label: 'Rich Mode', value: 'rich', icon: <EditOutlined /> },
            ]}
            value={mode}
            onChange={(val) => setMode(val as 'rich' | 'markdown')}
          />
        </Space>
      }
      className="readme-card"
    >
      <div className="readme-container">
        {/* Left side: Editor */}
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
              theme={darkMode ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          )}
        </div>

        {/* Right side: Preview */}
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
            <div
              className={`markdown-preview markdown-body ${
                darkMode ? 'markdown-dark' : 'markdown-light'
              }`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
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
