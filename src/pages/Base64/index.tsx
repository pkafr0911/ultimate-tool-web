import React, { useState } from 'react';
import { Upload, Button, Input, Typography, Space, message, Card, Image } from 'antd';
import { UploadOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Base64Converter: React.FC = () => {
  const [base64, setBase64] = useState<string>('');
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

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(base64);
    message.success('Copied Base64 string to clipboard!');
  };

  const clearAll = () => {
    setBase64('');
    setImageUrl('');
  };

  return (
    <Card title="🖼️ Image ↔ Base64 Converter" bordered={false}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>

        {imageUrl && (
          <Image src={imageUrl} alt="Converted" style={{ maxWidth: '100%', borderRadius: 8 }} />
        )}

        <TextArea
          rows={6}
          placeholder="Paste Base64 string here..."
          value={base64}
          onChange={(e) => setBase64(e.target.value)}
        />

        <Space>
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
