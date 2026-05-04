import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileMarkdownOutlined,
  FontSizeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, message, Segmented, Space, Splitter, Tag, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import mermaid from 'mermaid';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TurndownService from 'turndown';
import 'github-markdown-css/github-markdown-light.css';
import 'highlight.js/styles/github.css';

import { LoadFromDriveButton, SaveToDriveButton } from '@/components/GoogleDrive/DriveButtons';
import { useDarkMode } from '@/hooks/useDarkMode';

import './styles.less';

const { Paragraph } = Typography;

type FullscreenTarget = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  codeBlockStyle: 'fenced',
});

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
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

const DEFAULT_MARKDOWN = `# Welcome to README Editor

Start typing on the **left** to see a live preview on the **right**.

## Features

- Live HTML / Markdown round-trip
- Mermaid diagrams, syntax highlighting, GFM tables
- Save & load from Google Drive
- Distraction-free fullscreen mode

\`\`\`mermaid
graph LR
  A[Markdown] --> B(Renderer)
  B --> C{Looks great?}
  C -- Yes --> D[Ship it!]
  C -- No --> A
\`\`\`

> Tip: switch to **Rich Mode** for a WYSIWYG editor.
`;

const ReadmeEditorPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const previewRef = useRef<HTMLDivElement>(null);
  const mermaidIdCounter = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'rich' | 'markdown'>('markdown');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [markdownContent, setMarkdownContent] = useState<string>(DEFAULT_MARKDOWN);
  const [paneFullscreen, setPaneFullscreen] = useState<'none' | 'editor' | 'preview'>('none');
  const [pageFullscreen, setPageFullscreen] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState<14 | 16 | 18>(14);

  /* Initial render of default markdown */
  useEffect(() => {
    setHtmlContent(mdParser.render(DEFAULT_MARKDOWN));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Initialize mermaid */
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [darkMode]);

  /* Render mermaid diagrams */
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

  /* GitHub markdown / highlight theme swap */
  useEffect(() => {
    import(
      darkMode
        ? 'github-markdown-css/github-markdown-dark.css'
        : 'github-markdown-css/github-markdown-light.css'
    );
    import(darkMode ? 'highlight.js/styles/github-dark.css' : 'highlight.js/styles/github.css');
  }, [darkMode]);

  /* HTML → Markdown */
  useEffect(() => {
    if (mode === 'rich') {
      setMarkdownContent(turndownService.turndown(htmlContent));
    }
  }, [htmlContent, mode]);

  /* Markdown → HTML */
  useEffect(() => {
    if (mode === 'markdown') {
      setHtmlContent(mdParser.render(markdownContent));
    }
  }, [markdownContent, mode]);

  /* Native fullscreen sync */
  useEffect(() => {
    const onChange = () => {
      const doc = document as FullscreenDocument;
      const isNative = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      if (!isNative) setPageFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const togglePageFullscreen = async () => {
    const doc = document as FullscreenDocument;
    const node = shellRef.current as FullscreenTarget | null;
    if (!pageFullscreen) {
      try {
        if (node?.requestFullscreen) await node.requestFullscreen();
        else if (node?.webkitRequestFullscreen) await node.webkitRequestFullscreen();
      } catch {
        /* CSS fallback */
      }
      setPageFullscreen(true);
    } else {
      try {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } catch {
        /* ignore */
      }
      setPageFullscreen(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      message.success('Copied Markdown to clipboard!');
    } catch {
      message.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], {
      type: 'text/markdown;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'README.md';
    link.click();
  };

  const togglePane = (target: 'editor' | 'preview') => {
    setPaneFullscreen((prev) => (prev === target ? 'none' : target));
  };

  /* Stats */
  const stats = useMemo(() => {
    const md = markdownContent ?? '';
    const wordCount = md.trim() ? md.trim().split(/\s+/).length : 0;
    const lineCount = md ? md.split('\n').length : 0;
    const charCount = md.length;
    const readingMinutes = Math.max(1, Math.round(wordCount / 200));
    const headingCount = (md.match(/^#{1,6} /gm) ?? []).length;
    return { wordCount, lineCount, charCount, readingMinutes, headingCount };
  }, [markdownContent]);

  const heroStatusTone: 'idle' | 'running' | 'success' = stats.charCount ? 'success' : 'idle';
  const heroStatusLabel = stats.charCount
    ? `${stats.wordCount.toLocaleString()} words · ${stats.readingMinutes}m read`
    : 'Empty document';

  const guideContent = (
    <div className="guideGrid">
      <div className="guideItem">
        <span className="guideTitle">
          <FileMarkdownOutlined /> Markdown ↔ Rich
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Switch modes anytime — the editor keeps both representations in sync via MarkdownIt and
          Turndown.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <CodeOutlined /> Mermaid &amp; code highlight
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Use <code>```mermaid</code> for diagrams or any other language for syntax highlighting via
          highlight.js.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <EyeOutlined /> GitHub-flavored preview
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          The preview uses GitHub's markdown CSS — including tables, blockquotes, and fenced code
          blocks — switching themes with dark mode.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <FullscreenOutlined /> Focus modes
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Maximize a single pane, or send the entire page fullscreen for a distraction-free
          workspace. Press <kbd>Esc</kbd> to exit.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <DownloadOutlined /> Save anywhere
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Copy to clipboard, download as <code>README.md</code>, or save / load directly from Google
          Drive.
        </Paragraph>
      </div>
      <div className="guideItem">
        <span className="guideTitle">
          <ThunderboltOutlined /> 100% in-browser
        </span>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Your README never leaves the page — parsing, rendering and previewing all run locally.
        </Paragraph>
      </div>
    </div>
  );

  return (
    <div
      ref={shellRef}
      className={classNames('container readmeEditorPage', {
        fullscreen: pageFullscreen,
      })}
    >
      {pageFullscreen && (
        <button
          type="button"
          className="fullscreenExit"
          onClick={togglePageFullscreen}
          title="Exit fullscreen (Esc)"
        >
          <FullscreenExitOutlined /> Exit fullscreen
        </button>
      )}

      <div className="shell">
        {/* === Hero === */}
        <div className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <FileMarkdownOutlined />
              </span>
              <div>
                <span className="heroEyebrow">Markdown Studio</span>
                <h1 className="heroTitle">README Editor — write, render and ship Markdown</h1>
                <p className="heroSubtitle">
                  Live preview, Mermaid diagrams, syntax highlighting, Drive sync — in Markdown or
                  rich-text mode.
                </p>
              </div>
            </div>
            <div className="heroActions">
              <span className={classNames('heroStatus', `heroStatus-${heroStatusTone}`)}>
                <span className="heroStatusDot" />
                {heroStatusLabel}
              </span>
              <Segmented
                value={mode}
                onChange={(v) => setMode(v as 'rich' | 'markdown')}
                options={[
                  {
                    value: 'markdown',
                    label: 'Markdown',
                    icon: <FileMarkdownOutlined />,
                  },
                  {
                    value: 'rich',
                    label: 'Rich',
                    icon: <EditOutlined />,
                  },
                ]}
              />
              <Tooltip title={pageFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                <Button
                  ghost
                  icon={pageFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={togglePageFullscreen}
                >
                  {pageFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </Tooltip>
              <Tooltip title="Copy Markdown">
                <Button ghost icon={<CopyOutlined />} onClick={handleCopy}>
                  Copy
                </Button>
              </Tooltip>
              <Tooltip title="Download as README.md">
                <Button ghost icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* === Stat strip === */}
        <div className="statStrip">
          <div className={classNames('statChip', { success: stats.wordCount > 0 })}>
            <span className="statIcon">
              <FileMarkdownOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Words</span>
              <span className="statValue">{stats.wordCount.toLocaleString()}</span>
              <span className="statSub">{stats.charCount.toLocaleString()} chars</span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <CodeOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Lines</span>
              <span className="statValue">{stats.lineCount.toLocaleString()}</span>
              <span className="statSub">{stats.headingCount} headings</span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <EyeOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Reading time</span>
              <span className="statValue">~{stats.readingMinutes} min</span>
              <span className="statSub">at 200 wpm</span>
            </div>
          </div>
          <div className="statChip">
            <span className="statIcon">
              <EditOutlined />
            </span>
            <div className="statBody">
              <span className="statLabel">Mode</span>
              <span className="statValue">{mode === 'markdown' ? 'Markdown' : 'Rich Text'}</span>
              <span className="statSub">{mode === 'markdown' ? 'Raw .md editing' : 'WYSIWYG'}</span>
            </div>
          </div>
          <div className={classNames('statChip', { success: pageFullscreen })}>
            <span className="statIcon">
              {pageFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </span>
            <div className="statBody">
              <span className="statLabel">Fullscreen</span>
              <span className="statValue">{pageFullscreen ? 'On' : 'Off'}</span>
              <span className="statSub">
                {pageFullscreen ? 'Press Esc to exit' : 'Click Fullscreen'}
              </span>
            </div>
          </div>
        </div>

        {/* === Workspace === */}
        <div className="panel workspacePanel">
          <div className="workspaceToolbar">
            <Space size={8} wrap>
              <span className="toolbarLabel">
                <FontSizeOutlined /> Editor size
              </span>
              <Segmented
                size="small"
                value={editorFontSize}
                onChange={(v) => setEditorFontSize(v as 14 | 16 | 18)}
                options={[
                  { label: '14', value: 14 },
                  { label: '16', value: 16 },
                  { label: '18', value: 18 },
                ]}
              />
            </Space>
            <Space size={6} wrap>
              <Tag color={mode === 'markdown' ? 'blue' : 'purple'}>
                {mode === 'markdown' ? 'Markdown' : 'Rich'} mode
              </Tag>
              <SaveToDriveButton
                getContent={() => markdownContent}
                fileName="README.md"
                mimeType="text/markdown"
                buttonProps={{ size: 'small' }}
              />
              <LoadFromDriveButton
                onLoad={(content) => {
                  setMode('markdown');
                  setMarkdownContent(content);
                }}
                accept={['text/markdown', 'text/plain']}
                buttonProps={{ size: 'small' }}
              />
            </Space>
          </div>

          <div className="splitWrapper">
            <Splitter>
              {/* Editor pane */}
              <Splitter.Panel
                defaultSize="50%"
                min="20%"
                max="80%"
                className={classNames('paneShell', 'editorPane', {
                  fullscreen: paneFullscreen === 'editor',
                  hidden: paneFullscreen === 'preview',
                })}
              >
                <div className="paneHeader">
                  <span className="paneTitle">
                    {mode === 'rich' ? (
                      <>
                        <EditOutlined /> Edit (Rich Text)
                      </>
                    ) : (
                      <>
                        <FileMarkdownOutlined /> Edit (Raw Markdown)
                      </>
                    )}
                  </span>
                  <Tooltip
                    title={paneFullscreen === 'editor' ? 'Restore split view' : 'Maximize editor'}
                  >
                    <Button
                      icon={
                        paneFullscreen === 'editor' ? (
                          <FullscreenExitOutlined />
                        ) : (
                          <FullscreenOutlined />
                        )
                      }
                      onClick={() => togglePane('editor')}
                      size="small"
                      type="text"
                    />
                  </Tooltip>
                </div>

                <div className="paneBody">
                  {mode === 'rich' ? (
                    <ReactQuill
                      value={htmlContent}
                      onChange={setHtmlContent}
                      className="quillEditor"
                    />
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
                        fontSize: editorFontSize,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 12 },
                      }}
                    />
                  )}
                </div>
              </Splitter.Panel>

              {/* Preview pane */}
              <Splitter.Panel
                className={classNames('paneShell', 'previewPane', {
                  fullscreen: paneFullscreen === 'preview',
                  hidden: paneFullscreen === 'editor',
                })}
              >
                <div className="paneHeader">
                  <span className="paneTitle">
                    {mode === 'rich' ? (
                      <>
                        <CodeOutlined /> Raw Markdown (.md)
                      </>
                    ) : (
                      <>
                        <EyeOutlined /> Rendered Preview
                      </>
                    )}
                  </span>
                  <Tooltip
                    title={paneFullscreen === 'preview' ? 'Restore split view' : 'Maximize preview'}
                  >
                    <Button
                      icon={
                        paneFullscreen === 'preview' ? (
                          <FullscreenExitOutlined />
                        ) : (
                          <FullscreenOutlined />
                        )
                      }
                      onClick={() => togglePane('preview')}
                      size="small"
                      type="text"
                    />
                  </Tooltip>
                </div>

                <div className="paneBody">
                  {mode === 'rich' ? (
                    <Editor
                      height="100%"
                      language="markdown"
                      value={markdownContent}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        fontSize: editorFontSize,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 12 },
                      }}
                    />
                  ) : (
                    <div
                      ref={previewRef}
                      className={classNames(
                        'markdownPreview',
                        'markdown-body',
                        darkMode ? 'markdown-dark' : 'markdown-light',
                      )}
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  )}
                </div>
              </Splitter.Panel>
            </Splitter>
          </div>
        </div>

        {/* === Guide === */}
        <div className="panel guidePanel">
          <div className="panelHeader">
            <span className="panelTitle">
              <ThunderboltOutlined /> Guide
            </span>
          </div>
          {guideContent}
        </div>
      </div>
    </div>
  );
};

export default ReadmeEditorPage;
