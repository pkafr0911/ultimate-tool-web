import { handleCopy } from '@/helpers';
import { CopyOutlined, DeleteOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { Button, Card, Divider, Image, message, Space, Typography, Upload } from 'antd';
import React, { useState } from 'react';

const { Title, Text } = Typography;

const Base64Converter: React.FC = () => {
  const [base64, setBase64] = useState<string>('data:image/png;base64,...');
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBase64(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleBase64ToImage = () => {
    if (!base64.startsWith('data:image')) {
      message.error('Invalid Base64 image string.');
      return;
    }
    setImageUrl(base64);
  };

  const copyToClipboard = () => {
    handleCopy(base64, 'Copied Base64 string to clipboard!');
  };

  const clearAll = () => {
    setBase64('');
    setImageUrl('');
  };

  return (
    <Card
      title="🖼️ Image ↔ Base64 Converter"
      variant={'borderless'}
      style={{
        borderRadius: 16,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>

        {imageUrl && (
          <Card
            size="small"
            style={{
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 12,
              padding: 8,
            }}
          >
            <Image
              src={imageUrl}
              alt="Converted"
              style={{ maxWidth: '100%', borderRadius: 8 }}
              preview
            />
          </Card>
        )}

        <Divider />

        <div>
          <Title level={5} style={{ marginBottom: 8 }}>
            <PictureOutlined /> Base64 Data
          </Title>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              background: '#1e1e1e',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)',
            }}
          >
            <Editor
              height="250px"
              defaultLanguage="plaintext"
              value={base64}
              onChange={(val) => setBase64(val || '')}
              theme="vs-dark"
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                lineNumbers: 'off',
                scrollBeyondLastLine: false,
                fontSize: 13,
                padding: { top: 10 },
              }}
            />
          </Card>
        </div>

        <Space wrap>
          <Button type="primary" onClick={copyToClipboard} icon={<CopyOutlined />}>
            Copy Base64
          </Button>
          <Button onClick={handleBase64ToImage}>Convert to Image</Button>
          <Button danger onClick={clearAll} icon={<DeleteOutlined />}>
            Clear
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default Base64Converter;
