import React, { useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CopyOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  FieldBinaryOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleOutlined,
  BookOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { handleCopy } from '@/helpers';
import './styles.less';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// ─── Types & helpers ────────────────────────────────────────────────────────
type AesMode = 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
type KeySize = 128 | 192 | 256;
type OutputFormat = 'base64' | 'hex';
type Action = 'encrypt' | 'decrypt';

const MODE_INFO: Record<AesMode, { color: string; label: string; tag: string; desc: string }> = {
  'AES-GCM': {
    color: '#52c41a',
    label: 'AES-GCM',
    tag: 'AEAD',
    desc: 'Authenticated encryption — confidentiality + integrity. Recommended default.',
  },
  'AES-CBC': {
    color: '#1f6feb',
    label: 'AES-CBC',
    tag: 'Block',
    desc: 'Classic block cipher mode with PKCS#7 padding. No built-in integrity check.',
  },
  'AES-CTR': {
    color: '#fa8c16',
    label: 'AES-CTR',
    tag: 'Stream',
    desc: 'Counter mode turns AES into a stream cipher. Combine with HMAC for integrity.',
  },
};

function buf2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
function hex2buf(hex: string): ArrayBuffer {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}
function buf2b64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
function b642buf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
const encode = (b: ArrayBuffer, fmt: OutputFormat) => (fmt === 'hex' ? buf2hex(b) : buf2b64(b));
const decodeStr = (s: string, fmt: OutputFormat) => (fmt === 'hex' ? hex2buf(s) : b642buf(s));

async function deriveKey(password: string, salt: Uint8Array, keySize: KeySize, mode: AesMode) {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    km,
    { name: mode, length: keySize },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function aesEncrypt(
  plaintext: string,
  password: string,
  mode: AesMode,
  keySize: KeySize,
  fmt: OutputFormat,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, keySize, mode);
  let cipherBuf: ArrayBuffer;
  let params: string;
  if (mode === 'AES-GCM') {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    params = encode(iv.buffer, fmt);
  } else if (mode === 'AES-CBC') {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    cipherBuf = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, enc.encode(plaintext));
    params = encode(iv.buffer, fmt);
  } else {
    const counter = crypto.getRandomValues(new Uint8Array(16));
    cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-CTR', counter, length: 64 },
      key,
      enc.encode(plaintext),
    );
    params = encode(counter.buffer, fmt);
  }
  return `${encode(salt.buffer, fmt)}:${params}:${encode(cipherBuf, fmt)}`;
}

async function aesDecrypt(
  combined: string,
  password: string,
  mode: AesMode,
  keySize: KeySize,
  fmt: OutputFormat,
): Promise<string> {
  const parts = combined.trim().split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format. Expected salt:iv:ciphertext');
  const [saltStr, paramStr, cipherStr] = parts;
  const salt = new Uint8Array(decodeStr(saltStr, fmt));
  const paramBuf = new Uint8Array(decodeStr(paramStr, fmt));
  const cipherBuf = decodeStr(cipherStr, fmt);
  const key = await deriveKey(password, salt, keySize, mode);
  let decrypted: ArrayBuffer;
  if (mode === 'AES-GCM') {
    decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: paramBuf }, key, cipherBuf);
  } else if (mode === 'AES-CBC') {
    decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: paramBuf }, key, cipherBuf);
  } else {
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CTR', counter: paramBuf, length: 64 },
      key,
      cipherBuf,
    );
  }
  return new TextDecoder().decode(decrypted);
}

function generatePassword(len = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

function passwordStrength(pw: string): {
  score: number;
  label: string;
  tone: 'danger' | 'warning' | 'success';
} {
  if (!pw) return { score: 0, label: 'Empty', tone: 'danger' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score, label: 'Weak', tone: 'danger' };
  if (score === 3) return { score, label: 'Fair', tone: 'warning' };
  if (score === 4) return { score, label: 'Good', tone: 'success' };
  return { score, label: 'Strong', tone: 'success' };
}

// ─── Component ──────────────────────────────────────────────────────────────
const AesConverter: React.FC = () => {
  const [action, setAction] = useState<Action>('encrypt');
  const [aesMode, setAesMode] = useState<AesMode>('AES-GCM');
  const [keySize, setKeySize] = useState<KeySize>(256);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('base64');
  const [pwLen, setPwLen] = useState<number>(32);
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastOk, setLastOk] = useState<boolean | null>(null);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const modeInfo = MODE_INFO[aesMode];

  const handleConvert = async () => {
    if (!password) {
      message.warning('Password / key is required');
      return;
    }
    if (!input.trim()) {
      message.warning('Input is empty');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result =
        action === 'encrypt'
          ? await aesEncrypt(input, password, aesMode, keySize, outputFormat)
          : await aesDecrypt(input, password, aesMode, keySize, outputFormat);
      setOutput(result);
      setLastOk(true);
    } catch (e: any) {
      const msg = e?.message || 'Operation failed';
      setError(msg);
      setOutput('');
      setLastOk(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setLastOk(null);
  };

  const handleSwap = () => {
    setInput(output);
    setOutput('');
    setAction(action === 'encrypt' ? 'decrypt' : 'encrypt');
    setError('');
    setLastOk(null);
  };

  const handleGeneratePassword = () => {
    const pw = generatePassword(pwLen);
    setPassword(pw);
    message.success(`Generated ${pwLen}-char password`);
  };

  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputBytes = useMemo(() => new TextEncoder().encode(output).length, [output]);

  return (
    <PageContainer
      title={false}
      header={{ title: '', breadcrumb: {} }}
      ghost
      className="aes-page-container"
    >
      <div className="container">
        <div className="shell">
          {/* === Hero === */}
          <div className="hero">
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <SafetyCertificateOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">AES Studio</span>
                  <Title level={4} style={{ color: '#fff', margin: '4px 0 0', lineHeight: 1.25 }}>
                    Encrypt &amp; Decrypt with AES
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12 }}>
                    Browser-native SubtleCrypto · PBKDF2 100k · Salt &amp; IV embedded
                  </Text>
                </div>
              </div>
              <Space className="heroActions" wrap>
                <Tooltip title="Swap input ↔ output and toggle action">
                  <Button
                    icon={<SwapOutlined />}
                    onClick={handleSwap}
                    style={{
                      background: 'rgba(255,255,255,0.16)',
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                    }}
                  >
                    Swap
                  </Button>
                </Tooltip>
                <Tooltip title="Clear all">
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={handleClear}
                    style={{
                      background: 'rgba(255,255,255,0.16)',
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                    }}
                  >
                    Clear
                  </Button>
                </Tooltip>
                <Button
                  className="primaryAction"
                  icon={action === 'encrypt' ? <LockOutlined /> : <UnlockOutlined />}
                  loading={loading}
                  onClick={handleConvert}
                >
                  {action === 'encrypt' ? 'Encrypt' : 'Decrypt'}
                </Button>
              </Space>
            </div>
          </div>

          {/* === Stat strip === */}
          <div className="statStrip">
            <div className="statChip">
              <span className="statIcon">
                {action === 'encrypt' ? <LockOutlined /> : <UnlockOutlined />}
              </span>
              <div className="statBody">
                <span className="statLabel">Action</span>
                <span className="statValue">{action === 'encrypt' ? 'Encrypt' : 'Decrypt'}</span>
              </div>
            </div>
            <div className="statChip">
              <span
                className="statIcon"
                style={{ background: `${modeInfo.color}22`, color: modeInfo.color }}
              >
                <ThunderboltOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Cipher</span>
                <span className="statValue">
                  {modeInfo.label} · {keySize}-bit
                </span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <FieldBinaryOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Output</span>
                <span className="statValue">{outputFormat === 'hex' ? 'Hex' : 'Base64'}</span>
              </div>
            </div>
            <div
              className={`statChip ${lastOk === true ? 'success' : lastOk === false ? 'danger' : ''}`}
            >
              <span className="statIcon">
                {lastOk === true ? (
                  <CheckCircleFilled />
                ) : lastOk === false ? (
                  <CloseCircleFilled />
                ) : (
                  <ExclamationCircleOutlined />
                )}
              </span>
              <div className="statBody">
                <span className="statLabel">Status</span>
                <span className="statValue">
                  {lastOk === true ? 'Success' : lastOk === false ? 'Failed' : 'Idle'}
                </span>
              </div>
            </div>
          </div>

          {/* === Options bar === */}
          <div className="panel optionsBar">
            <div className="optGroup">
              <span className="optLabel">Action</span>
              <Segmented
                value={action}
                onChange={(v) => {
                  setAction(v as Action);
                  setOutput('');
                  setError('');
                  setLastOk(null);
                }}
                options={[
                  {
                    label: (
                      <>
                        <LockOutlined /> Encrypt
                      </>
                    ),
                    value: 'encrypt',
                  },
                  {
                    label: (
                      <>
                        <UnlockOutlined /> Decrypt
                      </>
                    ),
                    value: 'decrypt',
                  },
                ]}
              />
            </div>
            <div className="optGroup">
              <span className="optLabel">Cipher</span>
              <Select
                value={aesMode}
                onChange={setAesMode}
                style={{ width: 130 }}
                options={[
                  { value: 'AES-GCM', label: 'AES-GCM' },
                  { value: 'AES-CBC', label: 'AES-CBC' },
                  { value: 'AES-CTR', label: 'AES-CTR' },
                ]}
              />
              <Tag color={modeInfo.color} style={{ margin: 0 }}>
                {modeInfo.tag}
              </Tag>
            </div>
            <div className="optGroup">
              <span className="optLabel">Key size</span>
              <Select
                value={keySize}
                onChange={setKeySize}
                style={{ width: 100 }}
                options={[
                  { value: 128, label: '128-bit' },
                  { value: 192, label: '192-bit' },
                  { value: 256, label: '256-bit' },
                ]}
              />
            </div>
            <div className="optGroup">
              <span className="optLabel">Output</span>
              <Segmented
                value={outputFormat}
                onChange={(v) => setOutputFormat(v as OutputFormat)}
                options={[
                  { label: 'Base64', value: 'base64' },
                  { label: 'Hex', value: 'hex' },
                ]}
              />
            </div>
          </div>

          {/* === Password panel === */}
          <div className="panel">
            <div className="panelHeader">
              <span className="panelTitle">
                <KeyOutlined /> Password / Secret key
              </span>
              <Space size={6} wrap>
                <span className={`strengthChip strength-${strength.tone}`}>
                  <span className="dot" />
                  {strength.label}
                </span>
                <InputNumber
                  size="small"
                  min={8}
                  max={128}
                  value={pwLen}
                  onChange={(v) => v && setPwLen(v)}
                  style={{ width: 70 }}
                />
                <Tooltip title={`Generate a random ${pwLen}-character password`}>
                  <Button size="small" icon={<ReloadOutlined />} onClick={handleGeneratePassword}>
                    Generate
                  </Button>
                </Tooltip>
                <Tooltip title="Copy password">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(password)}
                  />
                </Tooltip>
              </Space>
            </div>
            <Input.Password
              size="large"
              placeholder="Enter password or generate one…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={<LockOutlined />}
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="passwordInput"
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Key is derived from password using PBKDF2 (100,000 iterations · SHA-256). A random
              16-byte salt and per-mode IV/counter are embedded in the output.
            </Text>
          </div>

          {/* === Workspace === */}
          <div className="workspace">
            {/* Input */}
            <div className="panel">
              <div className="panelHeader">
                <span className="panelTitle">
                  {action === 'encrypt' ? (
                    <>
                      <LockOutlined /> Plaintext
                    </>
                  ) : (
                    <>
                      <UnlockOutlined /> Ciphertext
                    </>
                  )}
                </span>
                <Space size={6}>
                  <Tag style={{ margin: 0 }}>{input.length} chars</Tag>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {inputBytes} B
                  </Tag>
                  <Tooltip title="Clear input">
                    <Button size="small" icon={<DeleteOutlined />} onClick={() => setInput('')} />
                  </Tooltip>
                </Space>
              </div>
              <TextArea
                rows={12}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  action === 'encrypt'
                    ? 'Type or paste plaintext to encrypt…'
                    : 'Paste ciphertext (salt:iv:ciphertext)…'
                }
                className="codeArea inputArea"
              />
            </div>

            {/* Output */}
            <div className="panel">
              <div className="panelHeader">
                <span className="panelTitle">
                  {action === 'encrypt' ? (
                    <>
                      <SafetyCertificateOutlined /> Ciphertext
                    </>
                  ) : (
                    <>
                      <CheckCircleFilled /> Plaintext
                    </>
                  )}
                </span>
                <Space size={6}>
                  <Tag style={{ margin: 0 }}>{output.length} chars</Tag>
                  <Tag color="green" style={{ margin: 0 }}>
                    {outputBytes} B
                  </Tag>
                  <Tooltip title="Copy output">
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(output)}>
                      Copy
                    </Button>
                  </Tooltip>
                </Space>
              </div>
              {error ? (
                <div className="errorBox">
                  <CloseCircleFilled /> {error}
                </div>
              ) : null}
              <TextArea
                rows={12}
                value={output}
                readOnly
                placeholder="Result will appear here…"
                className="codeArea outputArea"
              />
            </div>
          </div>

          {/* === Tabs: Format · Guide === */}
          <div className="panel">
            <Tabs
              defaultActiveKey="format"
              items={[
                {
                  key: 'format',
                  label: (
                    <span>
                      <FieldBinaryOutlined /> Output Format
                    </span>
                  ),
                  children: (
                    <div className="formatGrid">
                      <div className="formatBlock">
                        <span className="formatLabel">salt</span>
                        <span className="formatHint">16 bytes (random per encryption)</span>
                      </div>
                      <span className="formatSep">:</span>
                      <div className="formatBlock">
                        <span className="formatLabel">
                          {aesMode === 'AES-GCM' ? 'iv' : aesMode === 'AES-CBC' ? 'iv' : 'counter'}
                        </span>
                        <span className="formatHint">
                          {aesMode === 'AES-GCM' ? '12 bytes' : '16 bytes'} · per encryption
                        </span>
                      </div>
                      <span className="formatSep">:</span>
                      <div className="formatBlock">
                        <span className="formatLabel">ciphertext</span>
                        <span className="formatHint">
                          {aesMode === 'AES-GCM' ? 'cipher + 16-byte auth tag' : 'cipher bytes'}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'guide',
                  label: (
                    <span>
                      <BookOutlined /> Guide
                    </span>
                  ),
                  children: (
                    <div className="guideList">
                      {(Object.keys(MODE_INFO) as AesMode[]).map((m) => (
                        <div key={m} className="guideItem">
                          <ThunderboltOutlined style={{ color: MODE_INFO[m].color }} />
                          <div>
                            <strong>
                              {MODE_INFO[m].label}{' '}
                              <Tag color={MODE_INFO[m].color} style={{ marginLeft: 6 }}>
                                {MODE_INFO[m].tag}
                              </Tag>
                            </strong>
                            <Paragraph style={{ margin: 0 }} type="secondary">
                              {MODE_INFO[m].desc}
                            </Paragraph>
                          </div>
                        </div>
                      ))}
                      <div className="guideItem">
                        <KeyOutlined />
                        <div>
                          <strong>Key derivation</strong>
                          <Paragraph style={{ margin: 0 }} type="secondary">
                            Passwords are stretched with <code>PBKDF2-HMAC-SHA256</code> · 100,000
                            iterations · 16-byte random salt, producing a {keySize}-bit key.
                          </Paragraph>
                        </div>
                      </div>
                      <div className="guideItem">
                        <FieldBinaryOutlined />
                        <div>
                          <strong>Output layout</strong>
                          <Paragraph style={{ margin: 0 }} type="secondary">
                            Outputs are stored as <code>salt:iv:ciphertext</code> in{' '}
                            {outputFormat === 'hex' ? 'hex' : 'Base64'}. To decrypt, paste the full
                            string with the same password and parameters.
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
    </PageContainer>
  );
};

export default AesConverter;
