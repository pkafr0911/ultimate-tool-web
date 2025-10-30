import React, { useMemo, useState } from 'react';
import { Button, Card, Segmented, Space, Tabs, Typography } from 'antd';
import Editor from '@monaco-editor/react';
import { prettifyCSS, prettifyHTML, prettifyJS } from '../utils/formatters';
import {
  CopyOutlined,
  FormatPainterOutlined,
  CodeOutlined,
  EditOutlined,
  SettingOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { DEFAULT_CSS, DEFAULT_HTML, DEFAULT_SCRIPT } from '../constants';
import ReactQuill from 'react-quill';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { handleCopy } from '@/helpers';
import { handleDownload } from '../utils/helpers';
import { useDarkMode } from '@/hooks/useDarkMode';

// Define props accepted by this component (only one: onOpenSettings)
type Props = {
  onOpenSettings: () => void;
};

// Extract `Title` from Ant Design Typography for section headings
const { Title } = Typography;

/**
 * HtmlPlayground Component
 * ------------------------
 * This component allows users to:
 * - Edit HTML, CSS, and JavaScript live
 * - See instant preview of the combined output
 * - Switch between "code" and "rich text" modes for HTML
 * - Prettify, copy, or download the full code
 */
const HtmlPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  // Dark mode state (used for Monaco theme)
  const { darkMode } = useDarkMode();

  // Current view mode for the HTML tab: either 'html' or 'rich' (WYSIWYG)
  const [viewMode, setViewMode] = useState<'rich' | 'html'>('html');

  // Code content states for HTML, CSS, and JS
  const [htmlContent, setHtmlContent] = useState(DEFAULT_HTML);
  const [cssContent, setCssContent] = useState(DEFAULT_CSS);
  const [jsContent, setJsContent] = useState(DEFAULT_SCRIPT);

  // Get editor configuration options from custom hook
  const { monacoOptions } = useMonacoOption();

  // Preview HTML (combined and injected into iframe)
  const preview = useMemo(
    () => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <style>${cssContent}</style>
        </head>
        <body>
          ${htmlContent}
          <script>${jsContent}<\/script>
        </body>
        </html>`,
    [cssContent, htmlContent, jsContent],
  ); // Re-run whenever any part of the code changes

  return (
    // Ant Design card wrapper for the entire playground
    <Card className="html-card" variant="borderless">
      {/* Tabs to switch between HTML, CSS, and JS editors */}
      <Tabs
        defaultActiveKey="html"
        items={[
          // ---------------------- HTML TAB ----------------------
          {
            key: 'html',
            label: 'HTML',
            children: (
              <>
                {/* Toolbar (switch view, prettify, open settings) */}
                <Space align="center" style={{ marginBottom: 12 }}>
                  {/* Switch between code and rich (visual) modes */}
                  <Segmented
                    options={[
                      { label: 'HTML Mode', value: 'html', icon: <CodeOutlined /> },
                      { label: 'Rich Mode', value: 'rich', icon: <EditOutlined /> },
                    ]}
                    value={viewMode}
                    onChange={(val) => setViewMode(val as any)}
                  />

                  {/* Button to auto-format HTML */}
                  <Button
                    icon={<FormatPainterOutlined />}
                    onClick={() => prettifyHTML(htmlContent, setHtmlContent)}
                  >
                    Prettify
                  </Button>

                  {/* Open global settings modal */}
                  <Button icon={<SettingOutlined />} onClick={onOpenSettings} />
                </Space>

                {/* Conditional: show code editor or rich text editor */}
                {viewMode === 'rich' ? (
                  // Rich text (WYSIWYG) editor
                  <ReactQuill value={htmlContent} onChange={setHtmlContent} />
                ) : (
                  // Monaco code editor
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

          // ---------------------- CSS TAB ----------------------
          {
            key: 'css',
            label: 'CSS',
            children: (
              <>
                <Space align="center" style={{ marginBottom: 12 }}>
                  {/* Prettify CSS */}
                  <Button
                    icon={<FormatPainterOutlined />}
                    onClick={() => prettifyCSS(cssContent, setCssContent)}
                  >
                    Prettify
                  </Button>

                  {/* Settings button */}
                  <Button icon={<SettingOutlined />} onClick={onOpenSettings} />
                </Space>

                {/* Monaco editor for CSS */}
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

          // ---------------------- JAVASCRIPT TAB ----------------------
          {
            key: 'js',
            label: 'JS',
            children: (
              <>
                <Space align="center" style={{ marginBottom: 12 }}>
                  {/* Prettify JS */}
                  <Button
                    icon={<FormatPainterOutlined />}
                    onClick={() => prettifyJS(jsContent, setJsContent)}
                  >
                    Prettify
                  </Button>

                  {/* Settings button */}
                  <Button icon={<SettingOutlined />} onClick={onOpenSettings} />
                </Space>

                {/* Monaco editor for JavaScript */}
                <Editor
                  height="400px"
                  language="javascript"
                  value={jsContent}
                  onChange={(val) => setJsContent(val || '')}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={monacoOptions}
                />
              </>
            ),
          },
        ]}
      />

      {/* Toolbar below editors for global actions (copy/download) */}
      <Space style={{ marginTop: 16 }}>
        {/* Copy the entire preview HTML to clipboard */}
        <Button icon={<CopyOutlined />} onClick={() => handleCopy(preview, 'Copied!')}>
          Copy All
        </Button>

        {/* Download the generated HTML as a file */}
        <Button icon={<DownloadOutlined />} onClick={() => handleDownload('index.html', preview)}>
          Download HTML
        </Button>
      </Space>

      {/* Live preview area */}
      <div className="preview-pane" style={{ marginTop: 24 }}>
        <Title level={5}>Live Preview</Title>
        <iframe
          title="preview"
          srcDoc={preview} // Directly inject full HTML document
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
  );
};

// Export the component as default for use in other parts of the app
export default HtmlPlayground;
