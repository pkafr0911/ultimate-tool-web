import React, { useState } from 'react';
import { Card, Input, Button, Space, Alert } from 'antd';

const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [result, setResult] = useState<string>('');

  const run = () => {
    try {
      const re = new RegExp(pattern, flags);
      const matches = text.match(re) || [];
      setResult(JSON.stringify(matches, null, 2));
    } catch (e: any) {
      setResult('Error: ' + e.message);
    }
  };

  return (
    <Card title="Regex Tester">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input placeholder="pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <Input
          placeholder="flags (eg: g,i,m)"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
        />
        <Input.TextArea
          placeholder="test text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />
        <Button onClick={run}>Test</Button>
        <Alert
          message={result || 'No result'}
          type={result.startsWith('Error') ? 'error' : 'info'}
        />
      </Space>
    </Card>
  );
};

export default RegexTester;
