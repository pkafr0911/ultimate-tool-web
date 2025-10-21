import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CompressOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  FormatPainterOutlined,
  SortAscendingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, Card, Input, message, Segmented, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import './styles.less';

const { Title, Text } = Typography;

const JsonFormatterPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<'formatter' | 'converter'>('formatter');

  // --- Shared States ---
  const [input, setInput] = useState<string>('{\n  "name": "Thanh",\n  "age": 25\n}');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // --- Formatter Functions ---
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
      let text = input.trim();

      // 1️⃣ Try normal JSON.parse first
      try {
        const parsed = JSON.parse(text);
        const formatted = JSON.stringify(parsed, null, 2);
        setOutput(formatted);
        setError('');
        setIsValid(true);
        message.success('Formatted successfully!');
        return;
      } catch {
        // continue to next fallback
      }

      // 2️⃣ If JSON.parse fails, try to fix JavaScript-like syntax
      // Convert single quotes → double quotes
      text = text
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // add quotes around keys
        .replace(/'/g, '"') // replace single quotes with double
        .replace(/,(\s*[}\]])/g, '$1'); // remove trailing commas

      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);

      setOutput(formatted);
      setError('');
      setIsValid(true);
      message.success('Converted & formatted successfully!');
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid input, cannot convert to JSON');
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
            .reduce((acc, key) => {
              acc[key] = sortObj(obj[key]);
              return acc;
            }, {} as Record<string, any>);
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

  // --- Converter Functions ---
  const convertStringToJson = () => {
    try {
      // Remove wrapping quotes and unescape newlines/quotes
      const cleaned = input
        .replace(/^["']|["']$/g, '') // remove outer quotes if any
        .replace(/\\n/g, '\n') // convert \n → actual newline
        .replace(/\\"/g, '"'); // convert \" → "
      const parsed = JSON.parse(cleaned);
      setOutput(JSON.stringify(parsed, null, 2));
      message.success('Converted string to JSON successfully!');
    } catch (err: any) {
      console.error(err);
      message.error('Invalid escaped JSON string');
      setOutput('');
    }
  };

  const convertJsonToString = () => {
    try {
      const obj = JSON.parse(input);
      const jsonStr = JSON.stringify(obj, null, 2)
        .replace(/\n/g, '\\n') // escape newlines
        .replace(/"/g, '\\"'); // escape quotes
      setOutput(`"${jsonStr}"`);
      message.success('Converted JSON to escaped string successfully!');
    } catch (err: any) {
      console.error(err);
      message.error('Invalid JSON object');
      setOutput('');
    }
  };

  // --- Render ---
  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ marginBottom: 0 }}>
            JSON Tools
          </Title>
          <Segmented
            options={[
              { label: 'Formatter & Validator', value: 'formatter' },
              { label: 'String ⇄ JSON Converter', value: 'converter' },
            ]}
            value={mode}
            onChange={(val) => setMode(val as any)}
          />
        </Space>
      }
      className="json-card"
    >
      {mode === 'formatter' ? (
        <div className="json-container">
          {/* Left Side: Input JSON */}
          <div className="json-pane">
            <Title level={5}>Input JSON</Title>
            <Editor
              height="600px"
              language="json"
              value={input}
              onChange={(val) => setInput(val || '')}
              theme={darkMode ? 'vs-dark' : 'light'}
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
      ) : (
        <div className="json-container">
          {/* String ⇄ JSON Converter */}
          <div className="json-pane">
            <Title level={5}>Input String or JSON</Title>
            <Input.TextArea
              rows={16}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a JSON string or object here"
            />
            <Space className="button-group">
              <Button icon={<SwapOutlined />} type="primary" onClick={convertStringToJson}>
                String → JSON
              </Button>
              <Button icon={<SwapOutlined />} onClick={convertJsonToString}>
                JSON → String
              </Button>
              <Button icon={<ClearOutlined />} danger onClick={clearAll}>
                Clear
              </Button>
            </Space>
          </div>

          <div className="json-pane">
            <Title level={5}>Converted Output</Title>
            <Input.TextArea
              rows={16}
              value={output}
              readOnly
              placeholder="Converted result will appear here"
            />
            <Space className="button-group">
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                Copy
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Card>
  );
};

export default JsonFormatterPage;
