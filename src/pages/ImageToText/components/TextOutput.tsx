import React from 'react';
import { Button, Input, Space, message } from 'antd';

type Props = {
  text: string;
  setText: (value: string) => void;
};

const TextOutput: React.FC<Props> = ({ text, setText }) => {
  const downloadText = () => {
    const blob = new Blob([text || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'extracted-text.txt';
    a.href = url;
    a.click();
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text || '');
    message.success('Copied!');
  };

  return (
    <div style={{ height: '100%' }}>
      <Space style={{ marginBottom: 10 }}>
        <Button onClick={copyText}>Copy</Button>
        <Button onClick={downloadText}>Download</Button>
      </Space>

      <Input.TextArea
        rows={20}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Extracted text will show here..."
      />
    </div>
  );
};

export default TextOutput;
