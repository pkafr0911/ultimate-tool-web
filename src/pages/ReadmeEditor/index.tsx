import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  FileMarkdownOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, Card, message, Segmented, Space, Splitter, Typography } from 'antd';
import MarkdownIt from 'markdown-it';
import mermaid from 'mermaid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    // Render mermaid code blocks as diagrams
    if (lang === 'mermaid') {
      return `<div class="mermaid-block">${mdParser.utils.escapeHtml(str)}</div>`;
    }
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
  const previewRef = useRef<HTMLDivElement>(null);
  const mermaidIdCounter = useRef(0);
  const [mode, setMode] = useState<'rich' | 'markdown'>('markdown');
  const [htmlContent, setHtmlContent] = useState<string>(
    '<h2>Welcome to README Editor</h2><p>Start typing here...</p>',
  );
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'editor' | 'preview'>('none');

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [darkMode]);

  // Render mermaid diagrams in preview
  const renderMermaidDiagrams = useCallback(async () => {
    if (!previewRef.current) return;
    const blocks = previewRef.current.querySelectorAll('.mermaid-block');
    for (const block of Array.from(blocks)) {
      if (block.getAttribute('data-mermaid-rendered')) continue;
      const code = block.textContent || '';
      try {
        await mermaid.parse(code);
        const id = `mermaid-readme-${mermaidIdCounter.current++}`;
        const { svg } = await mermaid.render(id, code);
        block.innerHTML = svg;
        block.setAttribute('data-mermaid-rendered', 'true');
      } catch {
        block.innerHTML = `<pre class="hljs mermaid-error"><code>${code}</code></pre>`;
      }
    }
  }, []);

  useEffect(() => {
    if (mode === 'markdown') {
      renderMermaidDiagrams();
    }
  }, [htmlContent, mode, renderMermaidDiagrams]);

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

  const toggleEditorFullscreen = () => {
    setFullscreenMode((prev) => (prev === 'editor' ? 'none' : 'editor'));
  };

  const togglePreviewFullscreen = () => {
    setFullscreenMode((prev) => (prev === 'preview' ? 'none' : 'preview'));
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
        <Splitter>
          {/* Left side: Editor */}
          <Splitter.Panel
            defaultSize="50%"
            min="20%"
            max="80%"
            className={`editor-pane ${fullscreenMode === 'editor' ? 'fullscreen' : ''} ${fullscreenMode === 'preview' ? 'hidden' : ''}`}
          >
            <div className="pane-header">
              <Title level={5}>
                {mode === 'rich' ? 'Edit (Rich Text)' : 'Edit (Raw Markdown)'}
              </Title>
              <Button
                icon={
                  fullscreenMode === 'editor' ? <FullscreenExitOutlined /> : <FullscreenOutlined />
                }
                onClick={toggleEditorFullscreen}
                size="small"
                type="text"
              />
            </div>

            {mode === 'rich' ? (
              <ReactQuill value={htmlContent} onChange={setHtmlContent} className="quill-editor" />
            ) : (
              <Editor
                height="100%"
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
          </Splitter.Panel>

          {/* Right side: Preview */}
          <Splitter.Panel
            className={`preview-pane ${fullscreenMode === 'preview' ? 'fullscreen' : ''} ${fullscreenMode === 'editor' ? 'hidden' : ''}`}
          >
            <div className="pane-header">
              <Title level={5}>{mode === 'rich' ? 'Raw Markdown (.md)' : 'Rendered Preview'}</Title>
              <Button
                icon={
                  fullscreenMode === 'preview' ? <FullscreenExitOutlined /> : <FullscreenOutlined />
                }
                onClick={togglePreviewFullscreen}
                size="small"
                type="text"
              />
            </div>

            {mode === 'rich' ? (
              <Editor
                height="100%"
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
                ref={previewRef}
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
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

export default ReadmeEditorPage;
