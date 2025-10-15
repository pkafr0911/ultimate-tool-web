import React, { useState } from 'react';
import { Card, Button, Space, Select, Typography } from 'antd';
import Editor from '@monaco-editor/react';
import './styles.less';

const { Title } = Typography;

const PlaygroundPage: React.FC = () => {
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('javascript');
  const [code, setCode] = useState(`// Try something!\nconsole.log("Hello, playground!");`);
  const [output, setOutput] = useState<string>('');

  const runCode = () => {
    let capturedOutput: string[] = [];

    // Temporary override console methods
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      capturedOutput.push(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      capturedOutput.push('❌ ' + args.join(' '));
      originalError(...args);
    };

    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(code)();
      if (result !== undefined) {
        capturedOutput.push(`➡️ ${String(result)}`);
      }
    } catch (err: any) {
      capturedOutput.push(`❌ Error: ${err.message}`);
    }

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    // Update output area
    setOutput(capturedOutput.join('\n'));
  };

  return (
    <div className="playground-container">
      <Title level={2} className="playground-title">
        🧠 JavaScript / TypeScript Playground
      </Title>

      <Card className="playground-card" bordered={false}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={language}
            onChange={(v) => setLanguage(v)}
            options={[
              { label: 'JavaScript', value: 'javascript' },
              { label: 'TypeScript', value: 'typescript' },
            ]}
          />
          <Button type="primary" onClick={runCode}>
            ▶ Run
          </Button>
        </Space>

        <Editor
          height="400px"
          language={language}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />

        <div className="playground-output">
          <Title level={5}>Output:</Title>
          <pre>{output || '// Your output will appear here'}</pre>
        </div>
      </Card>
    </div>
  );
};

export default PlaygroundPage;
