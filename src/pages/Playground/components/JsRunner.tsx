import React, { useEffect, useState } from 'react';
import { Button, Card, Select, Space, Typography } from 'antd';
import Editor from '@monaco-editor/react';
import { prettifyJS } from '../utils/formatters';
import { FormatPainterOutlined, SettingOutlined } from '@ant-design/icons';
import { DEFAULT_CODE, DEFAULT_REACT, REACT_EXTRA_LIB } from '../constants';
import { useMonacoOption } from '../hooks/useMonacoOption';
import { useDarkMode } from '@/hooks/useDarkMode';

// Define prop types for this component
type Props = {
  onOpenSettings: () => void; // Function to open the settings modal
};

// Extract `Title` component from Ant Design Typography for headings
const { Title } = Typography;

// Main component: ReactPlayground
const ReactPlayground: React.FC<Props> = ({ onOpenSettings }) => {
  // Detect whether the app is in dark mode (for Monaco theme)
  const { darkMode } = useDarkMode();

  // Selected language for the editor — either JavaScript or TypeScript
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('javascript');

  // The actual code written by the user
  const [code, setCode] = useState(DEFAULT_CODE);

  // Output text displayed after code execution (logs, results, or errors)
  const [output, setOutput] = useState<string>('');

  // Get Monaco editor configuration from custom hook
  const { monacoOptions } = useMonacoOption();

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
    <Card className="playground-card" variant="borderless">
      {/* Toolbar section with settings, language selector, prettify, and run buttons */}
      <Space style={{ marginBottom: 16 }}>
        {/* Open settings modal */}
        <Button icon={<SettingOutlined />} onClick={onOpenSettings} />

        {/* Dropdown to switch between JS and TS modes */}
        <Select
          value={language}
          onChange={(v) => setLanguage(v)}
          options={[
            { label: 'JavaScript', value: 'javascript' },
            { label: 'TypeScript', value: 'typescript' },
          ]}
        />

        {/* Button to auto-format the JS/TS code using Prettier */}
        <Button icon={<FormatPainterOutlined />} onClick={() => prettifyJS(code, setCode)}>
          Prettify
        </Button>

        {/* Button to execute the code */}
        <Button type="primary" onClick={runCode}>
          ▶ Run
        </Button>
      </Space>

      {/* Monaco Editor for writing code */}
      <Editor
        height="400px"
        language={language} // JS or TS
        value={code}
        onChange={(val) => setCode(val || '')} // Update code state on edit
        theme={darkMode ? 'vs-dark' : 'light'} // Match theme with dark/light mode
        options={monacoOptions} // Apply custom editor settings
      />

      {/* Output section below editor */}
      <div className="playground-output">
        <Title level={5}>Output:</Title>
        {/* Preformatted output text area showing logs or results */}
        <pre>{output || '// Your output will appear here'}</pre>
      </div>
    </Card>
  );
};

// Export the component so it can be imported elsewhere
export default ReactPlayground;
