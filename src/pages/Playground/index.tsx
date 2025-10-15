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
    try {
      // Reset output
      setOutput('');
      // Run JS code safely in sandboxed Function
      const result = new Function(code)();
      if (result !== undefined) setOutput(String(result));
    } catch (err: any) {
      setOutput(`❌ Error: ${err.message}`);
    }
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
          defaultLanguage={language}
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
