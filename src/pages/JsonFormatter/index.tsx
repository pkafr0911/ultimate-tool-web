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
  CodeOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  Button,
  Card,
  Input,
  message,
  Segmented,
  Space,
  Tag,
  Typography,
  Radio,
  Tooltip,
} from 'antd';
import React, { useState } from 'react';
import Papa from 'papaparse';
import YAML from 'yaml';
import { js2xml, xml2js } from 'xml-js';
import './styles.less';

const { Title, Text } = Typography;

type ConversionMode = 'formatter' | 'converter';

const JsonFormatterPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<ConversionMode>('formatter');

  // --- Formatter State ---
  const [input, setInput] = useState<string>('{\n  "name": "Thanh",\n  "age": 25\n}');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // --- Converter State ---
  const [convertType, setConvertType] = useState<
    | 'json2csv'
    | 'csv2json'
    | 'json2xml'
    | 'xml2json'
    | 'json2yaml'
    | 'yaml2json'
    | 'str2json'
    | 'json2str'
  >('json2csv');
  const [convertInput, setConvertInput] = useState<string>('');
  const [convertOutput, setConvertOutput] = useState<string>('');

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

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('Nothing to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch {
      message.error('Failed to copy');
    }
  };

  const handleDownload = (text: string, filename: string) => {
    if (!text) {
      message.warning('Nothing to download');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const clearFormatter = () => {
    setInput('');
    setOutput('');
    setError('');
    setIsValid(null);
  };

  // --- Converter Functions ---

  const handleConvert = () => {
    if (!convertInput.trim()) {
      message.warning('Please enter input text');
      return;
    }

    try {
      let result = '';

      switch (convertType) {
        case 'json2csv': {
          const json = JSON.parse(convertInput);
          const data = Array.isArray(json) ? json : [json];
          result = Papa.unparse(data);
          break;
        }
        case 'csv2json': {
          const parsed = Papa.parse(convertInput, { header: true, skipEmptyLines: true });
          if (parsed.errors.length > 0) throw new Error(parsed.errors[0].message);
          result = JSON.stringify(parsed.data, null, 2);
          break;
        }
        case 'json2xml': {
          const json = JSON.parse(convertInput);
          result = js2xml(json, { compact: true, spaces: 2 });
          break;
        }
        case 'xml2json': {
          const json = xml2js(convertInput, { compact: true });
          result = JSON.stringify(json, null, 2);
          break;
        }
        case 'json2yaml': {
          const json = JSON.parse(convertInput);
          result = YAML.stringify(json);
          break;
        }
        case 'yaml2json': {
          const json = YAML.parse(convertInput);
          result = JSON.stringify(json, null, 2);
          break;
        }
        case 'str2json': {
          // Remove wrapping quotes and unescape newlines/quotes
          const cleaned = convertInput
            .replace(/^["']|["']$/g, '') // remove outer quotes if any
            .replace(/\\n/g, '\n') // convert \n → actual newline
            .replace(/\\"/g, '"'); // convert \" → "
          const parsed = JSON.parse(cleaned);
          result = JSON.stringify(parsed, null, 2);
          break;
        }
        case 'json2str': {
          const obj = JSON.parse(convertInput);
          const jsonStr = JSON.stringify(obj, null, 2)
            .replace(/\n/g, '\\n') // escape newlines
            .replace(/"/g, '\\"'); // escape quotes
          result = `"${jsonStr}"`;
          break;
        }
      }

      setConvertOutput(result);
      message.success('Converted successfully!');
    } catch (err: any) {
      message.error(`Conversion failed: ${err.message}`);
    }
  };

  const clearConverter = () => {
    setConvertInput('');
    setConvertOutput('');
  };

  // --- Render ---
  return (
    <div className="json-tool-container">
      <Card
        bordered={false}
        className="json-main-card"
        title={
          <div className="header-container">
            <Title level={3} style={{ margin: 0 }}>
              🛠️ JSON Toolkit
            </Title>
            <Segmented
              options={[
                { label: 'Formatter & Validator', value: 'formatter', icon: <CodeOutlined /> },
                { label: 'Converter (CSV/XML/YAML)', value: 'converter', icon: <SwapOutlined /> },
              ]}
              value={mode}
              onChange={(val) => setMode(val as ConversionMode)}
              size="large"
            />
          </div>
        }
      >
        {mode === 'formatter' && (
          <div className="tool-content">
            <div className="pane input-pane">
              <div className="pane-header">
                <Title level={5}>Input JSON</Title>
                <Space>
                  <Tooltip title="Clear Input">
                    <Button icon={<ClearOutlined />} onClick={clearFormatter} size="small" danger />
                  </Tooltip>
                </Space>
              </div>
              <Editor
                height="60vh"
                language="json"
                value={input}
                onChange={(val) => setInput(val || '')}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{ minimap: { enabled: false }, automaticLayout: true }}
                className="monaco-editor-custom"
              />
              <div className="action-bar">
                <Space wrap>
                  <Button icon={<FileSearchOutlined />} onClick={validateJson}>
                    Validate
                  </Button>
                  <Button type="primary" icon={<FormatPainterOutlined />} onClick={formatJson}>
                    Format
                  </Button>
                  <Button icon={<CompressOutlined />} onClick={minifyJson}>
                    Minify
                  </Button>
                  <Button icon={<SortAscendingOutlined />} onClick={sortKeys}>
                    Sort Keys
                  </Button>
                </Space>
                <div className="status-indicator">
                  {isValid === true && (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Valid
                    </Tag>
                  )}
                  {isValid === false && (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                      Invalid
                    </Tag>
                  )}
                </div>
              </div>
              {error && (
                <div className="error-message">
                  <Text type="danger">{error}</Text>
                </div>
              )}
            </div>

            <div className="pane output-pane">
              <div className="pane-header">
                <Title level={5}>Output</Title>
                <Space>
                  <Button icon={<CopyOutlined />} onClick={() => handleCopy(output)} size="small">
                    Copy
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(output, 'formatted.json')}
                    size="small"
                  >
                    Download
                  </Button>
                </Space>
              </div>
              <Editor
                height="60vh"
                language="json"
                value={output}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{ readOnly: true, minimap: { enabled: false }, automaticLayout: true }}
                className="monaco-editor-custom"
              />
            </div>
          </div>
        )}

        {mode === 'converter' && (
          <div className="tool-content converter-mode">
            <div className="converter-controls">
              <Radio.Group
                value={convertType}
                onChange={(e) => setConvertType(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="json2csv">JSON → CSV</Radio.Button>
                <Radio.Button value="csv2json">CSV → JSON</Radio.Button>
                <Radio.Button value="json2xml">JSON → XML</Radio.Button>
                <Radio.Button value="xml2json">XML → JSON</Radio.Button>
                <Radio.Button value="json2yaml">JSON → YAML</Radio.Button>
                <Radio.Button value="yaml2json">YAML → JSON</Radio.Button>
                <Radio.Button value="str2json">String → JSON</Radio.Button>
                <Radio.Button value="json2str">JSON → String</Radio.Button>
              </Radio.Group>
            </div>

            <div className="converter-panes">
              <div className="pane input-pane">
                <div className="pane-header">
                  <Title level={5}>Input</Title>
                  <Button icon={<ClearOutlined />} onClick={clearConverter} size="small" danger />
                </div>
                <Editor
                  height="55vh"
                  defaultLanguage="plaintext"
                  language={convertType.startsWith('json') ? 'json' : 'plaintext'}
                  value={convertInput}
                  onChange={(val) => setConvertInput(val || '')}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={{ minimap: { enabled: false }, automaticLayout: true }}
                />
                <div className="action-bar centered">
                  <Button
                    type="primary"
                    icon={<SwapOutlined />}
                    onClick={handleConvert}
                    size="large"
                  >
                    Convert
                  </Button>
                </div>
              </div>

              <div className="pane output-pane">
                <div className="pane-header">
                  <Title level={5}>Output</Title>
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(convertOutput)}
                      size="small"
                    >
                      Copy
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(convertOutput, 'converted.txt')}
                      size="small"
                    >
                      Download
                    </Button>
                  </Space>
                </div>
                <Editor
                  height="55vh"
                  defaultLanguage="plaintext"
                  language={convertType.endsWith('json') ? 'json' : 'plaintext'}
                  value={convertOutput}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={{ readOnly: true, minimap: { enabled: false }, automaticLayout: true }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default JsonFormatterPage;
