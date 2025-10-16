import React, { useState } from 'react';
import { Card, Button, Space, Typography, message, Tag } from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  CompressOutlined,
  FormatPainterOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SortAscendingOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import './styles.less';

const { Title, Text } = Typography;

const JsonFormatterPage: React.FC = () => {
  const [input, setInput] = useState<string>('{\n  "name": "Thanh",\n  "age": 25\n}');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateJson = () => {
    try {
      JSON.parse(input);
      setIsValid(true);
      message.success('Valid JSON');
    } catch (err: any) {
      setIsValid(false);
      message.error('Invalid JSON');
      setError(err.message);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setError('');
      setIsValid(true);
      message.success('Formatted successfully!');
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid JSON input');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError('');
      setIsValid(true);
      message.success('Minified successfully!');
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid JSON input');
    }
  };

  const sortKeys = () => {
    try {
      const parsed = JSON.parse(input);
      const sortObj = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(sortObj);
        if (obj && typeof obj === 'object') {
          return Object.keys(obj)
            .sort()
            .reduce(
              (acc, key) => {
                acc[key] = sortObj(obj[key]);
                return acc;
              },
              {} as Record<string, any>,
            );
        }
        return obj;
      };
      const sorted = sortObj(parsed);
      const formatted = JSON.stringify(sorted, null, 2);
      setOutput(formatted);
      message.success('Keys sorted alphabetically!');
      setIsValid(true);
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid JSON input');
    }
  };

  const handleCopy = async () => {
    if (!output) {
      message.warning('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      message.success('Copied formatted JSON!');
    } catch {
      message.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    if (!output) {
      message.warning('No formatted JSON to download');
      return;
    }
    const blob = new Blob([output], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'formatted.json';
    link.click();
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setIsValid(null);
  };

  return (
    <Card title="JSON Formatter & Validator" className="json-card">
      <div className="json-container">
        {/* Left Side: Input JSON */}
        <div className="json-pane">
          <Title level={5}>Input JSON</Title>
          <Editor
            height="600px"
            language="json"
            value={input}
            onChange={(val) => setInput(val || '')}
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />

          <Space className="button-group">
            <Button icon={<FileSearchOutlined />} onClick={validateJson}>
              Validate
            </Button>
            <Button icon={<FormatPainterOutlined />} type="primary" onClick={formatJson}>
              Format
            </Button>
            <Button icon={<CompressOutlined />} onClick={minifyJson}>
              Minify
            </Button>
            <Button icon={<SortAscendingOutlined />} onClick={sortKeys}>
              Sort Keys
            </Button>
            <Button icon={<ClearOutlined />} danger onClick={clearAll}>
              Clear
            </Button>
          </Space>

          {isValid === true && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Valid JSON
            </Tag>
          )}
          {isValid === false && (
            <Tag icon={<CloseCircleOutlined />} color="error">
              Invalid JSON
            </Tag>
          )}
          {error && <Text type="danger">Error: {error}</Text>}
        </div>

        {/* Right Side: Output JSON */}
        <div className="json-pane">
          <Title level={5}>Formatted Output</Title>
          <Editor
            height="600px"
            language="json"
            value={output}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />

          <Space className="button-group">
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              Copy
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              Download
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default JsonFormatterPage;
