import React, { useState } from 'react';
import { Button, Card, Segmented, Select, Space, Splitter, Typography } from 'antd';
import Editor from '@monaco-editor/react';
import { prettifyJS } from '../utils/formatters';
import {
  FormatPainterOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { DEFAULT_CODE } from '../constants';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { useDarkMode } from '@/hooks/useDarkMode';
import { usePlaygroundState } from '../hooks/usePlaygroundState';

// Define prop types for this component
type Props = {
  onOpenSettings: () => void; // Function to open the settings modal
};

// Extract `Title` component from Ant Design Typography for headings
const { Title } = Typography;

// Main component: JsRunner
const JsRunner: React.FC<Props> = ({ onOpenSettings }) => {
  // Detect whether the app is in dark mode (for Monaco theme)
  const { darkMode } = useDarkMode();

  // Selected language for the editor — either JavaScript or TypeScript
  const [language, setLanguage] = usePlaygroundState<'javascript' | 'typescript'>(
    'playground_js_lang',
    'javascript',
  );

  // The actual code written by the user
  const [code, setCode] = usePlaygroundState('playground_js_code', DEFAULT_CODE);

  // Output text displayed after code execution (logs, results, or errors)
  const [output, setOutput] = useState<string>('');

  // Get Monaco editor configuration from custom hook
  const { monacoOptions } = useMonacoOption();

  const [splitDirection, setSplitDirection] = useState<'vertical' | 'horizontal'>('horizontal');

  /**
   * runCode()
   * ----------
   * This function executes the user's code safely in an isolated scope using `new Function()`
   * It also temporarily captures console.log and console.error outputs to show them on screen.
   */
  const runCode = () => {
    // Store captured console outputs
    let captured: string[] = [];

    // Keep references to the original console functions
    const origLog = console.log;
    const origErr = console.error;

    // Override console.log to capture logs in an array
    console.log = (...args: any[]) => {
      captured.push(args.join(' ')); // Combine args into a string
      origLog(...args); // Still print to the browser console
    };

    // Override console.error to capture errors with a ❌ prefix
    console.error = (...args: any[]) => {
      captured.push('❌ ' + args.join(' '));
      origErr(...args);
    };

    try {
      // Execute the user's code dynamically
      // new Function(code) creates a function from the provided code string
      const result = new Function(code)();

      // If the function returns a value, append it to the output
      if (result !== undefined) captured.push(`➡️ ${String(result)}`);
    } catch (err: any) {
      // Catch any runtime errors and show them in the output
      captured.push(`❌ Error: ${err.message}`);
    }

    // Restore original console functions to avoid side effects
    console.log = origLog;
    console.error = origErr;

    // Combine captured logs and set them to the output state
    setOutput(captured.join('\n'));
  };

  return (
    // Ant Design card wrapper for the entire playground interface
    <Card
      className="playground-card"
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
        <Space wrap>
          <Button
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            type="text"
            title="Settings"
          />

          <Button
            icon={<FormatPainterOutlined />}
            onClick={() => prettifyJS(code, setCode, language)}
          >
            Prettify
          </Button>

          <Button type="primary" icon={<PlayCircleOutlined />} onClick={runCode}>
            Run
          </Button>

          <Button
            icon={<ReloadOutlined />}
            danger
            onClick={() => {
              if (confirm('Reset code to default?')) {
                setCode(DEFAULT_CODE);
                setLanguage('javascript');
              }
            }}
          >
            Reset
          </Button>
        </Space>

        <Space align="center" style={{ marginLeft: 'auto' }}>
          <Typography.Text type="secondary" style={{ marginRight: 4, whiteSpace: 'nowrap' }}>
            Layout:
          </Typography.Text>
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

      {/* Splitter Layout */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
        }}
      >
        <Splitter
          layout={splitDirection}
          style={{
            flex: 1,
            minHeight: 'calc(100vh - 120px)',
            width: '100%',
            height: splitDirection === 'vertical' ? 'calc(100vh - 120px)' : undefined,
            display: 'flex',
          }}
        >
          {/* Editor Panel */}
          <Splitter.Panel defaultSize="60%" min="25%" max="75%">
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Title level={5} style={{ padding: '8px 12px', margin: 0 }}>
                {language === 'typescript' ? 'TypeScript Editor' : 'JavaScript Editor'}
              </Title>
              <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={monacoOptions}
                />
              </div>
            </div>
          </Splitter.Panel>

          {/* Output Panel */}
          <Splitter.Panel>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: darkMode ? '#1e1e1e' : '#fff',
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
              }}
            >
              <Title level={5} style={{ padding: '8px 12px', margin: 0 }}>
                Output
              </Title>
              <pre
                style={{
                  flex: 1,
                  padding: '12px',
                  margin: 0,
                  color: darkMode ? '#d4d4d4' : '#333',
                  background: darkMode ? '#1e1e1e' : '#fafafa',
                  fontSize: 13,
                  overflow: 'auto',
                }}
              >
                {output || '// Your output will appear here'}
              </pre>
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

// Export the component so it can be imported elsewhere
export default JsRunner;
