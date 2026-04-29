import { handleCopy } from '@/helpers';
import {
  ApartmentOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClearOutlined,
  CloseCircleFilled,
  CodeOutlined,
  CompassOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FunctionOutlined,
  NumberOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Input,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import './styles.less';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

type Encoding = 'utf8' | 'ascii' | 'base64';
type Mode = 'encode' | 'decode';
type Separator = '' | ' ' | ':' | '-' | '0x';

// ─── Hex helpers ───────────────────────────────────────────────────────────
const SEPARATORS: { label: string; value: Separator }[] = [
  { label: 'None', value: '' },
  { label: 'Space', value: ' ' },
  { label: 'Colon  : ', value: ':' },
  { label: 'Dash  - ', value: '-' },
  { label: '0x prefix', value: '0x' },
];

function bytesFromText(text: string, encoding: Encoding): Uint8Array {
  if (encoding === 'base64') {
    const bin = atob(text);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // utf8 / ascii — TextEncoder always emits UTF-8; for ascii we still pass
  // through the same bytes (ASCII ⊂ UTF-8 for code points < 0x80).
  return new TextEncoder().encode(text);
}

function bytesToText(bytes: Uint8Array, encoding: Encoding): string {
  if (encoding === 'base64') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

function bytesToHex(bytes: Uint8Array, separator: Separator, uppercase: boolean): string {
  const tokens = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  let joined: string;
  if (separator === '0x') joined = tokens.map((t) => '0x' + t).join(', ');
  else joined = tokens.join(separator);
  return uppercase ? joined.toUpperCase() : joined.toLowerCase();
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
  if (cleaned.length % 2 !== 0) throw new Error('Hex string has an odd number of digits');
  const out = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    out[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return out;
}

function makeHexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = bytes.subarray(off, off + 16);
    const hexPart = Array.from(chunk, (b) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(chunk, (b) =>
      b >= 32 && b < 127 ? String.fromCharCode(b) : '.',
    ).join('');
    const addr = off.toString(16).padStart(8, '0');
    lines.push(`${addr}  ${hexPart.padEnd(47)}  |${ascii}|`);
  }
  return lines.join('\n');
}

const SAMPLES: Record<Mode, string> = {
  encode: 'Hello, world!  👋',
  decode: '48 65 6C 6C 6F 2C 20 77 6F 72 6C 64 21',
};

// ───────────────────────────────────────────────────────────────────────────
const HexConverterPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('encode');
  const [encoding, setEncoding] = useState<Encoding>('utf8');
  const [separator, setSeparator] = useState<Separator>(' ');
  const [uppercase, setUppercase] = useState(true);
  const [input, setInput] = useState(SAMPLES.encode);
  const [showDump, setShowDump] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, output: '', bytes: new Uint8Array() };
    try {
      if (mode === 'encode') {
        const bytes = bytesFromText(input, encoding);
        return { ok: true as const, output: bytesToHex(bytes, separator, uppercase), bytes };
      }
      const bytes = hexToBytes(input);
      return { ok: true as const, output: bytesToText(bytes, encoding), bytes };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? 'Conversion error' };
    }
  }, [input, mode, encoding, separator, uppercase]);

  const dump = useMemo(() => {
    if (!showDump || !result.ok || result.bytes.length === 0) return '';
    return makeHexDump(result.bytes);
  }, [showDump, result]);

  // when switching modes load a sensible sample if input is empty
  useEffect(() => {
    if (!input.trim()) setInput(SAMPLES[mode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSwap = () => {
    if (!result.ok) return;
    const newMode: Mode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    setInput(result.output);
  };

  const handleClear = () => setInput('');
  const handleSample = () => setInput(SAMPLES[mode]);

  const inputChars = input.length;
  const byteCount = result.ok ? result.bytes.length : 0;
  const outputChars = result.ok ? result.output.length : 0;

  const heroActions = (
    <Space wrap>
      <Button icon={<BookOutlined />} onClick={handleSample} ghost>
        Sample
      </Button>
      <Button icon={<ClearOutlined />} onClick={handleClear} ghost>
        Clear
      </Button>
      <Button
        type="primary"
        icon={<SwapOutlined />}
        onClick={handleSwap}
        disabled={!result.ok || !result.output}
        className="primaryAction"
      >
        Swap sides
      </Button>
    </Space>
  );

  const stats = [
    {
      icon: <FunctionOutlined />,
      label: 'Direction',
      value: mode === 'encode' ? 'Text → Hex' : 'Hex → Text',
    },
    {
      icon: <FileTextOutlined />,
      label: 'Encoding',
      value: encoding.toUpperCase(),
    },
    {
      icon: <NumberOutlined />,
      label: 'Bytes',
      value: byteCount,
    },
    {
      icon: result.ok ? (
        <CheckCircleFilled style={{ color: '#52c41a' }} />
      ) : (
        <CloseCircleFilled style={{ color: '#ff4d4f' }} />
      ),
      label: 'Status',
      value: result.ok ? 'Valid' : 'Invalid',
      tone: result.ok ? 'success' : 'danger',
    },
  ];

  return (
    <div className="container">
      <div className="shell">
        {/* ───── HERO ───── */}
        <div className="hero">
          <div className="heroRow">
            <div className="heroTitleBlock">
              <div className="heroBadge">
                <CodeOutlined />
              </div>
              <div>
                <span className="heroEyebrow">Hex Studio</span>
                <Typography.Title
                  level={4}
                  style={{ color: '#fff', margin: '2px 0 0', lineHeight: 1.25 }}
                >
                  Convert text ⇄ hexadecimal bytes
                </Typography.Title>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>
                  UTF-8 / ASCII / Base64 · custom separators · live hex dump.
                </Text>
              </div>
            </div>
            <div className="heroActions">{heroActions}</div>
          </div>
        </div>

        {/* ───── STAT STRIP ───── */}
        <div className="statStrip">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`statChip ${s.tone === 'success' ? 'success' : ''} ${
                s.tone === 'danger' ? 'danger' : ''
              }`}
            >
              <span className="statIcon">{s.icon}</span>
              <span className="statBody">
                <span className="statLabel">{s.label}</span>
                <span className="statValue">{s.value}</span>
              </span>
            </div>
          ))}
        </div>

        {/* ───── OPTIONS BAR ───── */}
        <div className="panel optionsBar">
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { label: 'Text → Hex', value: 'encode' },
              { label: 'Hex → Text', value: 'decode' },
            ]}
          />
          <div className="optGroup">
            <span className="optLabel">Encoding</span>
            <Select
              value={encoding}
              onChange={setEncoding}
              style={{ width: 110 }}
              options={[
                { label: 'UTF-8', value: 'utf8' },
                { label: 'ASCII', value: 'ascii' },
                { label: 'Base64', value: 'base64' },
              ]}
            />
          </div>
          {mode === 'encode' && (
            <>
              <div className="optGroup">
                <span className="optLabel">Separator</span>
                <Select
                  value={separator}
                  onChange={(v) => setSeparator(v as Separator)}
                  style={{ width: 140 }}
                  options={SEPARATORS.map((s) => ({ label: s.label, value: s.value }))}
                />
              </div>
              <div className="optGroup">
                <span className="optLabel">Uppercase</span>
                <Switch checked={uppercase} onChange={setUppercase} />
              </div>
            </>
          )}
          <div className="optGroup">
            <span className="optLabel">Hex dump</span>
            <Switch checked={showDump} onChange={setShowDump} />
          </div>
        </div>

        {/* ───── WORKSPACE ───── */}
        <div className="workspace">
          {/* INPUT */}
          <div className="panel ioPanel">
            <div className="panelHeader">
              <span className="panelTitle">
                <ApartmentOutlined /> {mode === 'encode' ? 'Text input' : 'Hex input'}
              </span>
              <Space size={6}>
                <Tag>{inputChars} chars</Tag>
                <Tooltip title="Clear">
                  <Button size="small" icon={<DeleteOutlined />} onClick={handleClear} />
                </Tooltip>
              </Space>
            </div>
            <TextArea
              className="codeArea inputArea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'Type or paste text to convert into hex bytes…'
                  : 'Paste hex bytes — spaces, dashes, colons, or 0x prefixes are all OK…'
              }
              autoSize={{ minRows: 10, maxRows: 22 }}
            />
          </div>

          {/* OUTPUT */}
          <div className="panel ioPanel">
            <div className="panelHeader">
              <span className="panelTitle">
                <ThunderboltOutlined /> {mode === 'encode' ? 'Hex output' : 'Text output'}
              </span>
              <Space size={6}>
                <Tag color={result.ok ? 'green' : 'red'}>
                  {result.ok ? `${outputChars} chars` : 'error'}
                </Tag>
                <Tooltip title="Copy result">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => result.ok && handleCopy(result.output, 'Result copied')}
                    disabled={!result.ok || !result.output}
                  />
                </Tooltip>
                <Tooltip title="Swap sides">
                  <Button
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={handleSwap}
                    disabled={!result.ok || !result.output}
                  />
                </Tooltip>
              </Space>
            </div>
            {result.ok ? (
              <TextArea
                className="codeArea outputArea"
                value={result.output}
                readOnly
                placeholder="Result will appear here as you type…"
                autoSize={{ minRows: 10, maxRows: 22 }}
              />
            ) : (
              <div className="errorBox">
                <CloseCircleFilled style={{ color: '#ff4d4f' }} /> {result.error}
              </div>
            )}
          </div>
        </div>

        {/* ───── DUMP / GUIDE ───── */}
        <div className="panel">
          <Tabs
            defaultActiveKey={showDump ? 'dump' : 'guide'}
            items={[
              {
                key: 'dump',
                label: (
                  <span>
                    <CodeOutlined /> Hex dump
                  </span>
                ),
                children: dump ? (
                  <pre className="dumpPre">{dump}</pre>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      showDump ? 'Enter content to see a dump' : 'Toggle "Hex dump" above to enable'
                    }
                  />
                ),
              },
              {
                key: 'guide',
                label: (
                  <span>
                    <CompassOutlined /> Guide
                  </span>
                ),
                children: (
                  <div className="guideList">
                    <div className="guideItem">
                      <CodeOutlined />
                      <div>
                        <strong>What is hexadecimal?</strong>
                        <Paragraph type="secondary" style={{ margin: 0 }}>
                          A base-16 representation where each byte (0–255) becomes two characters
                          using digits <code>0–9</code> and letters <code>a–f</code>.
                        </Paragraph>
                      </div>
                    </div>
                    <div className="guideItem">
                      <FileTextOutlined />
                      <div>
                        <strong>Encodings</strong>
                        <Paragraph type="secondary" style={{ margin: 0 }}>
                          <strong>UTF-8</strong> — variable-width Unicode (recommended).{' '}
                          <strong>ASCII</strong> — single-byte legacy. <strong>Base64</strong> —
                          treat input as a Base64 blob and round-trip its raw bytes.
                        </Paragraph>
                      </div>
                    </div>
                    <div className="guideItem">
                      <ApartmentOutlined />
                      <div>
                        <strong>Separators</strong>
                        <Paragraph type="secondary" style={{ margin: 0 }}>
                          When decoding, spaces, dashes, colons, and <code>0x</code> prefixes are
                          all stripped — paste hex in any common form.
                        </Paragraph>
                      </div>
                    </div>
                    <div className="guideItem">
                      <NumberOutlined />
                      <div>
                        <strong>Hex dump</strong>
                        <Paragraph type="secondary" style={{ margin: 0 }}>
                          Toggle <em>Hex dump</em> to see a classic <code>xxd</code>-style view with
                          offsets and ASCII sidebar.
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default HexConverterPage;
