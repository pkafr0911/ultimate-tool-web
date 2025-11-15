import React from 'react';
import { Button, Input, Space, message } from 'antd';
import { handleCopy } from '@/helpers';
import { downloadText } from '../utils/helpers';

type Props = {
  text: string;
  setText: (value: string) => void;
};

const TextOutput: React.FC<Props> = ({ text, setText }) => {
  return (
    <div style={{ height: '100%' }}>
      <Space style={{ marginBottom: 10 }}>
        <Button onClick={() => handleCopy(text, 'Copied!')}>Copy</Button>
        <Button onClick={() => downloadText(text)}>Download</Button>
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
