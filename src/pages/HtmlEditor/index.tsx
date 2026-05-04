import { LoadFromDriveButton, SaveToDriveButton } from '@/components/GoogleDrive/DriveButtons';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CodeOutlined,
  CompressOutlined,
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  DownloadOutlined,
  EditOutlined,
  ExpandOutlined,
  ExportOutlined,
  EyeOutlined,
  FileAddOutlined,
  FormatPainterOutlined,
  Html5Outlined,
  MobileOutlined,
  TabletOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  Button,
  Divider,
  Dropdown,
  MenuProps,
  message,
  Radio,
  Segmented,
  Space,
  Tooltip,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './styles.less';

type Mode = 'html' | 'rich';
type Device = 'desktop' | 'tablet' | 'mobile';

const DEFAULT_HTML = `<h2>Welcome to the HTML Editor</h2>
<p>Edit on the left, see the result instantly on the right.</p>
<ul>
  <li>💎 Live preview with device-frame mockups</li>
  <li>🎨 Switch between rich-text and code modes</li>
  <li>⚡ Format, minify and download in one click</li>
</ul>`;

const HtmlEditorPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<Mode>('html');
  const [html, setHtml] = useState<string>(DEFAULT_HTML);
  const [preview, setPreview] = useState<string>(DEFAULT_HTML);
  const [device, setDevice] = useState<Device>('desktop');
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPreview(html), 200);
    return () => clearTimeout(t);
  }, [html]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    const el = shellRef.current as any;
    if (!el) return;
    if (!document.fullscreenElement) {
      (el.requestFullscreen?.() || el.webkitRequestFullscreen?.())?.catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  const formatHTML = (src: string) => {
    try {
      const doc = new DOMParser().parseFromString(src, 'text/html');
      const formatNode = (node: Node, level = 0): string => {
        const indent = '  '.repeat(level);
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent?.trim();
          return t ? indent + t + '\n' : '';
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();
          let out = `${indent}<${tag}`;
          for (const a of Array.from(el.attributes)) out += ` ${a.name}="${a.value}"`;
          out += '>';
          const children = Array.from(el.childNodes);
          const has = children.some(
            (c) => c.nodeType === Node.ELEMENT_NODE || c.textContent?.trim(),
          );
          if (has) out += '\n';
          for (const c of children) out += formatNode(c, level + 1);
          if (has) out += indent;
          out += `</${tag}>\n`;
          return out;
        }
        return '';
      };
      return Array.from(doc.body.childNodes)
        .map((n) => formatNode(n))
        .join('')
        .trim();
    } catch {
      return src;
    }
  };

  const prettify = () => {
    if (!html.trim()) return;
    setHtml(formatHTML(html));
    message.success('Prettified');
  };
  const minify = () => {
    if (!html.trim()) return;
    const min = html
      .replace(/>[\r\n ]+</g, '><')
      .replace(/(<.*?>)|\s+/g, (m, $1) => ($1 ? $1 : ' '))
      .trim();
    setHtml(min);
    message.success('Minified');
  };
  const insertBoilerplate = () => {
    setHtml(`<!DOCTYPE html>
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
</html>`);
    message.success('Boilerplate inserted');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      message.success('Copied');
    } catch {
      message.error('Copy failed');
    }
  };
  const download = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'index.html';
    link.click();
  };
  const openTab = () => {
    const w = window.open();
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const templateItems: MenuProps['items'] = [
    {
      key: 'table',
      label: 'Table',
      onClick: () =>
        setHtml(
          html +
            `\n<table border="1">\n  <tr><th>Header 1</th><th>Header 2</th></tr>\n  <tr><td>Data 1</td><td>Data 2</td></tr>\n</table>`,
        ),
    },
    {
      key: 'form',
      label: 'Form',
      onClick: () =>
        setHtml(
          html +
            `\n<form>\n  <label>Name: <input type="text" /></label>\n  <button type="submit">Submit</button>\n</form>`,
        ),
    },
    {
      key: 'card',
      label: 'Card',
      onClick: () =>
        setHtml(
          html +
            `\n<div style="border:1px solid #ccc; padding:16px; border-radius:8px; max-width:300px;">\n  <h3>Card Title</h3>\n  <p>Some content here...</p>\n</div>`,
        ),
    },
  ];

  const lines = html.split('\n').length;
  const bytes = new Blob([html]).size;

  return (
    <div className={`container htmlEditorPage ${isFullscreen ? 'fullscreen' : ''}`} ref={shellRef}>
      <button className="fullscreenExit" onClick={toggleFullscreen}>
        ✕ Exit
      </button>

      <div className="shell">
        {/* Hero */}
        <section className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <Html5Outlined />
              </span>
              <div>
                <span className="heroEyebrow">HTML Editor</span>
                <h1 className="heroTitle">Code, paint, preview — all in one canvas</h1>
                <p className="heroSubtitle">
                  Toggle between rich-text and Monaco code mode, format or minify, then preview on
                  desktop, tablet and mobile mockups.
                </p>
              </div>
            </div>
            <div className="heroActions">
              <Segmented
                size="large"
                options={[
                  { label: 'Code', value: 'html', icon: <CodeOutlined /> },
                  { label: 'Rich Text', value: 'rich', icon: <EditOutlined /> },
                ]}
                value={mode}
                onChange={(v) => setMode(v as Mode)}
              />
              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <Button
                  className="primaryAction"
                  icon={<ExpandOutlined />}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="statStrip">
          <div className="statChip">
            <span className="statLabel">Mode</span>
            <span className="statValue">{mode === 'html' ? 'Code' : 'Rich text'}</span>
          </div>
          <div className="statChip">
            <span className="statLabel">Lines</span>
            <span className="statValue">{lines}</span>
          </div>
          <div className="statChip">
            <span className="statLabel">Size</span>
            <span className="statValue">{bytes} B</span>
          </div>
          <div className="statChip">
            <span className="statLabel">Device</span>
            <span className="statValue">{device}</span>
          </div>
        </section>

        {/* Toolbar */}
        <section className="panel toolbarPanel">
          <Space wrap>
            <Tooltip title="Insert HTML5 boilerplate">
              <Button icon={<FileAddOutlined />} onClick={insertBoilerplate}>
                Boilerplate
              </Button>
            </Tooltip>
            <Dropdown menu={{ items: templateItems }}>
              <Button icon={<ExportOutlined />}>Insert template</Button>
            </Dropdown>
            <Divider type="vertical" />
            <Tooltip title="Format code">
              <Button
                icon={<FormatPainterOutlined />}
                onClick={prettify}
                disabled={mode === 'rich'}
              />
            </Tooltip>
            <Tooltip title="Minify code">
              <Button icon={<CompressOutlined />} onClick={minify} disabled={mode === 'rich'} />
            </Tooltip>
            <Tooltip title="Clear">
              <Button icon={<DeleteOutlined />} danger onClick={() => setHtml('')} />
            </Tooltip>
          </Space>
          <Space wrap>
            <Button icon={<CopyOutlined />} onClick={copy}>
              Copy
            </Button>
            <Button icon={<DownloadOutlined />} onClick={download}>
              Download
            </Button>
            <SaveToDriveButton getContent={() => html} fileName="index.html" mimeType="text/html" />
            <LoadFromDriveButton onLoad={(c) => setHtml(c)} accept={['text/html', 'text/plain']} />
          </Space>
        </section>

        {/* Workspace */}
        <section className="panel workspacePanel">
          <div className="paneRow">
            {/* Editor */}
            <div className="pane">
              <div className="paneHeader">
                <div className="paneTitle">
                  <span className="paneDot in" /> {mode === 'html' ? 'Source' : 'Editor'}
                </div>
              </div>
              <div className="editorWrap">
                {mode === 'rich' ? (
                  <ReactQuill
                    value={html}
                    onChange={setHtml}
                    className="quillEditor"
                    theme="snow"
                  />
                ) : (
                  <Editor
                    height="100%"
                    language="html"
                    value={html}
                    onChange={(v) => setHtml(v || '')}
                    theme={darkMode ? 'vs-dark' : 'light'}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontSize: 13,
                      padding: { top: 12 },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="pane previewPane">
              <div className="paneHeader">
                <div className="paneTitle">
                  <span className="paneDot out" />
                  <EyeOutlined /> Live preview
                </div>
                <Space size="small">
                  <Radio.Group
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    size="small"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="desktop">
                      <DesktopOutlined />
                    </Radio.Button>
                    <Radio.Button value="tablet">
                      <TabletOutlined />
                    </Radio.Button>
                    <Radio.Button value="mobile">
                      <MobileOutlined />
                    </Radio.Button>
                  </Radio.Group>
                  <Tooltip title="Open in new tab">
                    <Button type="text" icon={<ExportOutlined />} size="small" onClick={openTab} />
                  </Tooltip>
                </Space>
              </div>
              <div className="previewArea">
                <div className={`deviceFrame ${device}`}>
                  <iframe
                    title="preview"
                    srcDoc={preview}
                    className="previewIframe"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guide */}
        <section className="guidePanel">
          <div className="guideGrid">
            <div className="guideItem">
              <div className="guideTitle">Two modes</div>
              Switch between Monaco code editor and rich-text WYSIWYG without losing content.
            </div>
            <div className="guideItem">
              <div className="guideTitle">Device mockups</div>
              Iframe-sandboxed preview at desktop / tablet (768×1024) / mobile (375×667) sizes.
            </div>
            <div className="guideItem">
              <div className="guideTitle">Snippets</div>
              Drop in tables, forms, cards or a full HTML5 boilerplate with one click.
            </div>
            <div className="guideItem">
              <div className="guideTitle">Format & minify</div>
              Indent or compact your markup before exporting to disk or Google Drive.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HtmlEditorPage;
