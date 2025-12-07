import React, { useMemo, useState } from 'react';
import { Button, Card, Segmented, Space, Splitter, Tabs, Typography } from 'antd';
import Editor from '@monaco-editor/react';
import { prettifyCSS, prettifyHTML, prettifyJS } from '../utils/formatters';
import {
  CopyOutlined,
  FormatPainterOutlined,
  CodeOutlined,
  EditOutlined,
  SettingOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { DEFAULT_CSS, DEFAULT_HTML, DEFAULT_SCRIPT } from '../constants';
import ReactQuill from 'react-quill';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { usePlaygroundState } from '../hooks/usePlaygroundState';
import { handleCopy } from '@/helpers';
import { handleDownload } from '../utils/helpers';
import { useDarkMode } from '@/hooks/useDarkMode';

// Define props accepted by this component (only one: onOpenSettings)
type Props = {
  onOpenSettings: () => void;
};

// Extract `Title` from Ant Design Typography for section headings
const { Text, Title } = Typography;

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

  // Get editor configuration options from custom hook
  const { monacoOptions } = useMonacoOption();

  // Code content states for HTML, CSS, and JS
  const [htmlContent, setHtmlContent] = usePlaygroundState('playground_html_html', DEFAULT_HTML);
  const [cssContent, setCssContent] = usePlaygroundState('playground_html_css', DEFAULT_CSS);
  const [jsContent, setJsContent] = usePlaygroundState('playground_html_js', DEFAULT_SCRIPT);

  // Mode & layout states
  const [viewMode, setViewMode] = useState<'rich' | 'html'>('html'); // Current view mode for the HTML tab: either 'html' or 'rich' (WYSIWYG)
  const [splitDirection, setSplitDirection] = useState<'vertical' | 'horizontal'>('horizontal');

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
    <Card
      className="html-card"
      variant="borderless"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          padding: '8px 12px',
          background: darkMode ? '#1f1f1f' : '#fafafa',
          border: darkMode ? '1px solid #333' : '1px solid #e5e5e5',
          borderRadius: 8,
        }}
      >
        {/* Left: actions */}
        <Space wrap>
          <Button icon={<SettingOutlined />} onClick={onOpenSettings} type="text" />

          <Button
            icon={<FormatPainterOutlined />}
            onClick={() => {
              if (viewMode === 'html') prettifyHTML(htmlContent, setHtmlContent);
              prettifyCSS(cssContent, setCssContent);
              prettifyJS(jsContent, setJsContent);
            }}
          >
            Prettify All
          </Button>

          <Button icon={<CopyOutlined />} onClick={() => handleCopy(preview, 'Copied full HTML!')}>
            Copy All
          </Button>

          <Button icon={<DownloadOutlined />} onClick={() => handleDownload('index.html', preview)}>
            Download
          </Button>

          <Button
            icon={<ReloadOutlined />}
            danger
            onClick={() => {
              if (confirm('Reset all code to default?')) {
                setHtmlContent(DEFAULT_HTML);
                setCssContent(DEFAULT_CSS);
                setJsContent(DEFAULT_SCRIPT);
              }
            }}
          >
            Reset
          </Button>
        </Space>

        {/* Right: layout controls */}
        <Space align="center" style={{ marginLeft: 'auto' }}>
          <Text type="secondary" style={{ marginRight: 4 }}>
            Layout:
          </Text>
          <Segmented
            options={[
              { label: 'Horizontal', value: 'horizontal' },
              { label: 'Vertical', value: 'vertical' },
            ]}
            value={splitDirection}
            onChange={(val) => setSplitDirection(val as 'vertical' | 'horizontal')}
            size="middle"
            style={{ minWidth: 180 }}
          />
        </Space>
      </div>

      {/* Splitter Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
        }}
      >
        <Splitter
          key={splitDirection}
          layout={splitDirection}
          style={{
            flex: 1,
            display: 'flex',
            height: splitDirection === 'vertical' ? 'calc(100vh - 120px)' : undefined,
            width: '100%',
          }}
        >
          {/* Left / Top: Editors */}
          <Splitter.Panel defaultSize="50%" min="25%" max="75%">
            <Tabs
              defaultActiveKey="html"
              type="card"
              size="middle"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              items={[
                {
                  key: 'html',
                  label: 'HTML',
                  children: (
                    <>
                      <Space style={{ marginBottom: 8 }}>
                        <Segmented
                          options={[
                            { label: 'Code', value: 'html', icon: <CodeOutlined /> },
                            { label: 'Rich', value: 'rich', icon: <EditOutlined /> },
                          ]}
                          value={viewMode}
                          onChange={(val) => setViewMode(val as any)}
                        />
                        <Button
                          icon={<FormatPainterOutlined />}
                          onClick={() => prettifyHTML(htmlContent, setHtmlContent)}
                        >
                          Prettify
                        </Button>
                      </Space>

                      {viewMode === 'rich' ? (
                        <ReactQuill value={htmlContent} onChange={setHtmlContent} />
                      ) : (
                        <Editor
                          height="calc(100vh - 120px)"
                          language="html"
                          value={htmlContent}
                          onChange={(val) => setHtmlContent(val || '')}
                          theme={darkMode ? 'vs-dark' : 'light'}
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
                      <Button
                        icon={<FormatPainterOutlined />}
                        style={{ marginBottom: 8 }}
                        onClick={() => prettifyCSS(cssContent, setCssContent)}
                      >
                        Prettify
                      </Button>
                      <Editor
                        height="calc(100vh - 120px)"
                        language="css"
                        value={cssContent}
                        onChange={(val) => setCssContent(val || '')}
                        theme={darkMode ? 'vs-dark' : 'light'}
                        options={monacoOptions}
                      />
                    </>
                  ),
                },
                {
                  key: 'js',
                  label: 'JavaScript',
                  children: (
                    <>
                      <Button
                        icon={<FormatPainterOutlined />}
                        style={{ marginBottom: 8 }}
                        onClick={() => prettifyJS(jsContent, setJsContent)}
                      >
                        Prettify
                      </Button>
                      <Editor
                        height="calc(100vh - 120px)"
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
          </Splitter.Panel>

          {/* Right / Bottom: Live Preview */}
          <Splitter.Panel>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                flex: 1,
                minHeight: 0,
              }}
            >
              <Title level={5} style={{ padding: '8px 12px', margin: 0 }}>
                Live HTML Preview
              </Title>
              <iframe
                title="html-preview"
                srcDoc={preview}
                // sandbox="allow-scripts allow-same-origin allow-modals"
                style={{
                  flex: 1,
                  borderTop: splitDirection === 'horizontal' ? '1px solid #ddd' : undefined,
                  borderRadius: 8,
                  minHeight: 0,
                }}
              />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

// Export the component as default for use in other parts of the app
export default HtmlPlayground;
