import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import { CopyOutlined, SwapOutlined, DeleteOutlined } from '@ant-design/icons';
import { handleCopy } from '@/helpers';

const { TextArea } = Input;
const { Text } = Typography;

type Encoding = 'utf8' | 'ascii' | 'base64';

// ─── Hex helpers ───────────────────────────────────────────────────────────
function textToHex(
  text: string,
  encoding: Encoding,
  separator: string,
  uppercase: boolean,
): string {
  let bytes: number[];
  if (encoding === 'base64') {
    const bin = atob(text);
    bytes = Array.from(bin, (c) => c.charCodeAt(0));
  } else {
    const encoder = new TextEncoder();
    bytes = Array.from(encoder.encode(text));
  }
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join(separator);
  return uppercase ? hex.toUpperCase() : hex;
}

function hexToText(hex: string, encoding: Encoding): string {
  // strip common separators and whitespace
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
  if (cleaned.length % 2 !== 0) throw new Error('Invalid hex string (odd length)');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  if (encoding === 'base64') {
    return btoa(String.fromCharCode(...bytes));
  }
  return new TextDecoder('utf-8').decode(bytes);
}

function hexDump(hex: string): string {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
  const lines: string[] = [];
  for (let offset = 0; offset < cleaned.length; offset += 32) {
    const chunk = cleaned.substring(offset, offset + 32);
    const hexPart = chunk.match(/.{1,2}/g)?.join(' ') ?? '';
    const bytes = (chunk.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16));
    const ascii = bytes.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
    const addr = (offset / 2).toString(16).padStart(8, '0');
    lines.push(`${addr}  ${hexPart.padEnd(48)}  |${ascii}|`);
  }
  return lines.join('\n');
}

const SEPARATORS = [
  { label: 'None', value: '' },
  { label: 'Space', value: ' ' },
  { label: 'Colon (:)', value: ':' },
  { label: 'Dash (-)', value: '-' },
  { label: '0x prefix', value: '0x' },
];

const HexConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encoding, setEncoding] = useState<Encoding>('utf8');
  const [separator, setSeparator] = useState(' ');
  const [uppercase, setUppercase] = useState(true);
  const [showDump, setShowDump] = useState(false);
  const [dump, setDump] = useState('');

  const convert = (text?: string, m?: 'encode' | 'decode') => {
    const val = text ?? input;
    const curMode = m ?? mode;
    if (!val.trim()) {
      setOutput('');
      setDump('');
      return;
    }
    try {
      if (curMode === 'encode') {
        const hex = textToHex(val, encoding, separator === '0x' ? ', 0x' : separator, uppercase);
        const result = separator === '0x' ? '0x' + hex : hex;
        setOutput(result);
        if (showDump) setDump(hexDump(result));
      } else {
        const text = hexToText(val, encoding);
        setOutput(text);
        if (showDump) setDump(hexDump(val));
      }
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
      setDump('');
    }
  };

  const handleSwap = () => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    setInput(output);
    setOutput('');
    setDump('');
    // auto-convert in next tick
    setTimeout(() => convert(output, newMode), 0);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setDump('');
  };

  const byteCount = (() => {
    try {
      if (mode === 'encode' && input) return new TextEncoder().encode(input).length;
      if (mode === 'decode' && output) return new TextEncoder().encode(output).length;
    } catch {}
    return 0;
  })();

  const hexByteCount = (() => {
    const hex = mode === 'encode' ? output : input;
    if (!hex) return 0;
    return hex.replace(/[^0-9a-fA-F]/g, '').length / 2;
  })();

  return (
    <PageContainer title="Hex Encoder / Decoder" subTitle="Convert between text and hexadecimal">
      {/* ── Options bar ──────────────────────────────────────────────────── */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Radio.Group
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setOutput('');
              setDump('');
            }}
          >
            <Radio.Button value="encode">Text → Hex</Radio.Button>
            <Radio.Button value="decode">Hex → Text</Radio.Button>
          </Radio.Group>

          <div>
            <Text type="secondary" style={{ marginRight: 4 }}>
              Encoding:
            </Text>
            <Select value={encoding} onChange={setEncoding} style={{ width: 100 }} size="small">
              <Select.Option value="utf8">UTF-8</Select.Option>
              <Select.Option value="ascii">ASCII</Select.Option>
              <Select.Option value="base64">Base64</Select.Option>
            </Select>
          </div>

          {mode === 'encode' && (
            <>
              <div>
                <Text type="secondary" style={{ marginRight: 4 }}>
                  Separator:
                </Text>
                <Select
                  value={separator}
                  onChange={setSeparator}
                  style={{ width: 120 }}
                  size="small"
                >
                  {SEPARATORS.map((s) => (
                    <Select.Option key={s.value} value={s.value}>
                      {s.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <Text type="secondary" style={{ marginRight: 4 }}>
                  Uppercase:
                </Text>
                <Switch checked={uppercase} onChange={setUppercase} size="small" />
              </div>
            </>
          )}

          <div>
            <Text type="secondary" style={{ marginRight: 4 }}>
              Hex dump:
            </Text>
            <Switch checked={showDump} onChange={setShowDump} size="small" />
          </div>
        </Space>
      </Card>

      {/* ── Input / Output ───────────────────────────────────────────────── */}
      <Row gutter={16}>
        <Col xs={24} md={11}>
          <Card
            title={mode === 'encode' ? 'Text' : 'Hex String'}
            size="small"
            extra={<Text type="secondary">{input.length} chars</Text>}
          >
            <TextArea
              rows={12}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Enter text here...'
                  : 'Enter hex string (e.g. 48 65 6C 6C 6F)...'
              }
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
        </Col>

        <Col
          xs={24}
          md={2}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexDirection: 'column',
            padding: '16px 0',
          }}
        >
          <Button type="primary" onClick={() => convert()} icon={<SwapOutlined rotate={90} />}>
            Convert
          </Button>
          <Button onClick={handleSwap} icon={<SwapOutlined />} size="small">
            Swap
          </Button>
          <Button onClick={handleClear} icon={<DeleteOutlined />} size="small" danger>
            Clear
          </Button>
        </Col>

        <Col xs={24} md={11}>
          <Card
            title={mode === 'encode' ? 'Hex Output' : 'Text Output'}
            size="small"
            extra={
              <Space>
                <Text type="secondary">{hexByteCount} bytes</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(output)}>
                  Copy
                </Button>
              </Space>
            }
          >
            <TextArea
              rows={12}
              value={output}
              readOnly
              style={{ fontFamily: 'monospace' }}
              placeholder="Result will appear here..."
            />
          </Card>
        </Col>
      </Row>

      {/* ── Hex Dump (optional) ──────────────────────────────────────────── */}
      {showDump && dump && (
        <Card title="Hex Dump" size="small" style={{ marginTop: 16 }}>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              margin: 0,
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}
          >
            {dump}
          </pre>
        </Card>
      )}
    </PageContainer>
  );
};

export default HexConverter;
