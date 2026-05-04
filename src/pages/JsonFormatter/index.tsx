import { LoadFromDriveButton, SaveToDriveButton } from '@/components/GoogleDrive/DriveButtons';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CompressOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExpandOutlined,
  FileSearchOutlined,
  FormatPainterOutlined,
  SortAscendingOutlined,
  SwapOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Button, message, Segmented, Space, Tag, Tooltip } from 'antd';
import Papa from 'papaparse';
import React, { useEffect, useRef, useState } from 'react';
import { js2xml, xml2js } from 'xml-js';
import YAML from 'yaml';
import './styles.less';

type ConversionMode = 'formatter' | 'converter';
type ConvertType =
  | 'json2csv'
  | 'csv2json'
  | 'json2xml'
  | 'xml2json'
  | 'json2yaml'
  | 'yaml2json'
  | 'str2json'
  | 'json2str';

const CONVERT_OPTIONS: { value: ConvertType; label: string }[] = [
  { value: 'json2csv', label: 'JSON → CSV' },
  { value: 'csv2json', label: 'CSV → JSON' },
  { value: 'json2xml', label: 'JSON → XML' },
  { value: 'xml2json', label: 'XML → JSON' },
  { value: 'json2yaml', label: 'JSON → YAML' },
  { value: 'yaml2json', label: 'YAML → JSON' },
  { value: 'str2json', label: 'String → JSON' },
  { value: 'json2str', label: 'JSON → String' },
];

const JsonFormatterPage: React.FC = () => {
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<ConversionMode>('formatter');
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Formatter state
  const [input, setInput] = useState<string>(
    '{\n  "name": "Thanh",\n  "skills": ["go", "ts", "react"],\n  "active": true\n}',
  );
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Converter state
  const [convertType, setConvertType] = useState<ConvertType>('json2csv');
  const [convertInput, setConvertInput] = useState<string>('');
  const [convertOutput, setConvertOutput] = useState<string>('');

  /* ── Fullscreen ── */
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    const el = shellRef.current as any;
    if (!el) return;
    if (!document.fullscreenElement) {
      (el.requestFullscreen?.() || el.webkitRequestFullscreen?.())?.catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  /* ── Formatter ── */
  const validateJson = () => {
    try {
      JSON.parse(input);
      setIsValid(true);
      setError('');
      message.success('Valid JSON');
    } catch (err: any) {
      setIsValid(false);
      setError(err.message);
      message.error('Invalid JSON');
    }
  };

  const formatJson = () => {
    try {
      let text = input.trim();
      try {
        const parsed = JSON.parse(text);
        setOutput(JSON.stringify(parsed, null, 2));
        setError('');
        setIsValid(true);
        message.success('Formatted');
        return;
      } catch {
        // fall through to lenient mode
      }
      text = text
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, '$1');
      const parsed = JSON.parse(text);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
      setIsValid(true);
      message.success('Converted & formatted');
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid input');
    }
  };

  const minifyJson = () => {
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
      setIsValid(true);
      setError('');
      message.success('Minified');
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid JSON');
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
            .reduce((acc: Record<string, any>, k) => {
              acc[k] = sortObj(obj[k]);
              return acc;
            }, {});
        }
        return obj;
      };
      setOutput(JSON.stringify(sortObj(parsed), null, 2));
      setIsValid(true);
      setError('');
      message.success('Keys sorted');
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
      message.error('Invalid JSON');
    }
  };

  const handleCopy = async (text: string) => {
    if (!text) return message.warning('Nothing to copy');
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied');
    } catch {
      message.error('Copy failed');
    }
  };

  const handleDownload = (text: string, filename: string) => {
    if (!text) return message.warning('Nothing to download');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  /* ── Converter ── */
  const handleConvert = () => {
    if (!convertInput.trim()) return message.warning('Please enter input');
    try {
      let result = '';
      switch (convertType) {
        case 'json2csv': {
          const data = JSON.parse(convertInput);
          result = Papa.unparse(Array.isArray(data) ? data : [data]);
          break;
        }
        case 'csv2json': {
          const parsed = Papa.parse(convertInput, { header: true, skipEmptyLines: true });
          if (parsed.errors.length) throw new Error(parsed.errors[0].message);
          result = JSON.stringify(parsed.data, null, 2);
          break;
        }
        case 'json2xml':
          result = js2xml(JSON.parse(convertInput), { compact: true, spaces: 2 });
          break;
        case 'xml2json':
          result = JSON.stringify(xml2js(convertInput, { compact: true }), null, 2);
          break;
        case 'json2yaml':
          result = YAML.stringify(JSON.parse(convertInput));
          break;
        case 'yaml2json':
          result = JSON.stringify(YAML.parse(convertInput), null, 2);
          break;
        case 'str2json': {
          const cleaned = convertInput
            .replace(/^["']|["']$/g, '')
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"');
          result = JSON.stringify(JSON.parse(cleaned), null, 2);
          break;
        }
        case 'json2str': {
          const obj = JSON.parse(convertInput);
          const jsonStr = JSON.stringify(obj, null, 2).replace(/\n/g, '\\n').replace(/"/g, '\\"');
          result = `"${jsonStr}"`;
          break;
        }
      }
      setConvertOutput(result);
      message.success('Converted');
    } catch (err: any) {
      message.error(`Conversion failed: ${err.message}`);
    }
  };

  /* ── Stats ── */
  const inputLines = (mode === 'formatter' ? input : convertInput).split('\n').length;
  const outputLines = (mode === 'formatter' ? output : convertOutput).split('\n').length;
  const inputBytes = new Blob([mode === 'formatter' ? input : convertInput]).size;
  const outputBytes = new Blob([mode === 'formatter' ? output : convertOutput]).size;
  const ratio = inputBytes ? Math.round((outputBytes / inputBytes) * 100) : 0;

  return (
    <div
      className={`container jsonFormatterPage ${isFullscreen ? 'fullscreen' : ''}`}
      ref={shellRef}
    >
      <button className="fullscreenExit" onClick={toggleFullscreen}>
        ✕ Exit
      </button>

      <div className="shell">
        {/* Hero */}
        <section className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <CodeOutlined />
              </span>
              <div>
                <span className="heroEyebrow">JSON Toolkit</span>
                <h1 className="heroTitle">Format, validate &amp; transform structured data</h1>
                <p className="heroSubtitle">
                  Pretty-print JSON, fix loose syntax, sort keys, or convert between JSON, CSV, XML
                  and YAML — all locally in your browser.
                </p>
              </div>
            </div>
            <div className="heroActions">
              <Segmented
                size="large"
                options={[
                  { label: 'Formatter', value: 'formatter', icon: <FormatPainterOutlined /> },
                  { label: 'Converter', value: 'converter', icon: <SwapOutlined /> },
                ]}
                value={mode}
                onChange={(v) => setMode(v as ConversionMode)}
              />
              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <Button
                  className="primaryAction"
                  icon={<ExpandOutlined />}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="statStrip">
          <div className="statChip">
            <span className="statLabel">Mode</span>
            <span className="statValue">{mode === 'formatter' ? 'Format' : 'Convert'}</span>
          </div>
          <div className="statChip">
            <span className="statLabel">Input</span>
            <span className="statValue">
              {inputLines} ln · {inputBytes} B
            </span>
          </div>
          <div className="statChip">
            <span className="statLabel">Output</span>
            <span className="statValue">
              {outputLines} ln · {outputBytes} B
            </span>
          </div>
          <div className="statChip">
            <span className="statLabel">Status</span>
            <span
              className={`statValue statusValue ${isValid === false ? 'danger' : isValid ? 'success' : 'idle'}`}
            >
              <span className="dot" />
              {isValid === false ? 'Invalid' : isValid ? 'Valid' : 'Idle'}
              {output ? ` · ${ratio}%` : ''}
            </span>
          </div>
        </section>

        {/* Workspace */}
        <section className="panel workspacePanel">
          {mode === 'formatter' ? (
            <div className="paneRow">
              {/* Input pane */}
              <div className="pane">
                <div className="paneHeader">
                  <div className="paneTitle">
                    <span className="paneDot in" />
                    Input JSON
                  </div>
                  <Space size={4}>
                    <Tooltip title="Validate">
                      <Button size="small" icon={<FileSearchOutlined />} onClick={validateJson} />
                    </Tooltip>
                    <Tooltip title="Format">
                      <Button
                        size="small"
                        type="primary"
                        icon={<FormatPainterOutlined />}
                        onClick={formatJson}
                      />
                    </Tooltip>
                    <Tooltip title="Minify">
                      <Button size="small" icon={<CompressOutlined />} onClick={minifyJson} />
                    </Tooltip>
                    <Tooltip title="Sort keys">
                      <Button size="small" icon={<SortAscendingOutlined />} onClick={sortKeys} />
                    </Tooltip>
                    <Tooltip title="Clear">
                      <Button
                        size="small"
                        danger
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setInput('');
                          setOutput('');
                          setError('');
                          setIsValid(null);
                        }}
                      />
                    </Tooltip>
                  </Space>
                </div>
                <div className="editorWrap">
                  <Editor
                    height="100%"
                    language="json"
                    value={input}
                    onChange={(v) => setInput(v || '')}
                    theme={darkMode ? 'vs-dark' : 'light'}
                    options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 13 }}
                  />
                </div>
                {error && (
                  <div className="errorBanner">
                    <CloseCircleOutlined /> {error}
                  </div>
                )}
              </div>

              {/* Output pane */}
              <div className="pane">
                <div className="paneHeader">
                  <div className="paneTitle">
                    <span className="paneDot out" />
                    Output
                    {isValid && (
                      <Tag className="validTag" color="success" icon={<CheckCircleOutlined />}>
                        OK
                      </Tag>
                    )}
                  </div>
                  <Space size={4} wrap>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(output)}>
                      Copy
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(output, 'formatted.json')}
                    >
                      Download
                    </Button>
                    <SaveToDriveButton
                      getContent={() => output}
                      fileName="formatted.json"
                      mimeType="application/json"
                      buttonProps={{ size: 'small' }}
                    />
                    <LoadFromDriveButton
                      onLoad={(c) => setInput(c)}
                      accept={['application/json', 'text/plain']}
                      buttonProps={{ size: 'small' }}
                    />
                  </Space>
                </div>
                <div className="editorWrap">
                  <Editor
                    height="100%"
                    language="json"
                    value={output}
                    theme={darkMode ? 'vs-dark' : 'light'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="converterLayout">
              <div className="converterToolbar">
                <Segmented
                  options={CONVERT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={convertType}
                  onChange={(v) => setConvertType(v as ConvertType)}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltFilled />}
                  onClick={handleConvert}
                  className="convertBtn"
                >
                  Convert
                </Button>
              </div>
              <div className="paneRow">
                <div className="pane">
                  <div className="paneHeader">
                    <div className="paneTitle">
                      <span className="paneDot in" /> Input
                    </div>
                    <Tooltip title="Clear">
                      <Button
                        size="small"
                        danger
                        icon={<ClearOutlined />}
                        onClick={() => {
                          setConvertInput('');
                          setConvertOutput('');
                        }}
                      />
                    </Tooltip>
                  </div>
                  <div className="editorWrap">
                    <Editor
                      height="100%"
                      language={convertType.startsWith('json') ? 'json' : 'plaintext'}
                      value={convertInput}
                      onChange={(v) => setConvertInput(v || '')}
                      theme={darkMode ? 'vs-dark' : 'light'}
                      options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 13 }}
                    />
                  </div>
                </div>
                <div className="pane">
                  <div className="paneHeader">
                    <div className="paneTitle">
                      <span className="paneDot out" /> Output
                    </div>
                    <Space size={4}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(convertOutput)}
                      >
                        Copy
                      </Button>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(convertOutput, 'converted.txt')}
                      >
                        Download
                      </Button>
                    </Space>
                  </div>
                  <div className="editorWrap">
                    <Editor
                      height="100%"
                      language={convertType.endsWith('json') ? 'json' : 'plaintext'}
                      value={convertOutput}
                      theme={darkMode ? 'vs-dark' : 'light'}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Guide */}
        <section className="guidePanel">
          <div className="guideGrid">
            <div className="guideItem">
              <div className="guideTitle">Lenient parser</div>
              Single quotes, unquoted keys, and trailing commas auto-fixed in Format mode.
            </div>
            <div className="guideItem">
              <div className="guideTitle">Sort keys</div>
              Recursively orders every object alphabetically — perfect for diffs.
            </div>
            <div className="guideItem">
              <div className="guideTitle">8 conversions</div>
              JSON ⇄ CSV / XML / YAML / escaped string. Roundtrip in two clicks.
            </div>
            <div className="guideItem">
              <div className="guideTitle">100% local</div>
              Nothing is uploaded — all parsing happens in your browser.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default JsonFormatterPage;
