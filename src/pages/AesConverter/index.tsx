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
  Typography,
  message,
  Alert,
  Tooltip,
} from 'antd';
import {
  CopyOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { handleCopy } from '@/helpers';

const { TextArea } = Input;
const { Text } = Typography;

// ─── AES helpers using SubtleCrypto (browser native) ────────────────────────
type AesMode = 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
type KeySize = 128 | 192 | 256;
type OutputFormat = 'base64' | 'hex';

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

function encode(buf: ArrayBuffer, fmt: OutputFormat): string {
  return fmt === 'hex' ? buf2hex(buf) : buf2b64(buf);
}

function decode(str: string, fmt: OutputFormat): ArrayBuffer {
  return fmt === 'hex' ? hex2buf(str) : b642buf(str);
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  keySize: KeySize,
  mode: AesMode,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
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
  outputFormat: OutputFormat,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, keySize, mode);

  let cipherBuf: ArrayBuffer;
  let params: string;

  if (mode === 'AES-GCM') {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    params = encode(iv.buffer, outputFormat);
  } else if (mode === 'AES-CBC') {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    cipherBuf = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, enc.encode(plaintext));
    params = encode(iv.buffer, outputFormat);
  } else {
    // AES-CTR
    const counter = crypto.getRandomValues(new Uint8Array(16));
    cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-CTR', counter, length: 64 },
      key,
      enc.encode(plaintext),
    );
    params = encode(counter.buffer, outputFormat);
  }

  const saltStr = encode(salt.buffer, outputFormat);
  const cipherStr = encode(cipherBuf, outputFormat);
  // Format: salt:iv:ciphertext
  return `${saltStr}:${params}:${cipherStr}`;
}

async function aesDecrypt(
  combined: string,
  password: string,
  mode: AesMode,
  keySize: KeySize,
  outputFormat: OutputFormat,
): Promise<string> {
  const parts = combined.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format. Expected salt:iv:ciphertext');

  const [saltStr, paramStr, cipherStr] = parts;
  const salt = new Uint8Array(decode(saltStr, outputFormat));
  const paramBuf = new Uint8Array(decode(paramStr, outputFormat));
  const cipherBuf = decode(cipherStr, outputFormat);
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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

// ─── Component ──────────────────────────────────────────────────────────────
const AesConverter: React.FC = () => {
  const [modeAction, setModeAction] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [aesMode, setAesMode] = useState<AesMode>('AES-GCM');
  const [keySize, setKeySize] = useState<KeySize>(256);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('base64');
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    if (!password.trim()) {
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
      if (modeAction === 'encrypt') {
        const result = await aesEncrypt(input, password, aesMode, keySize, outputFormat);
        setOutput(result);
      } else {
        const result = await aesDecrypt(input, password, aesMode, keySize, outputFormat);
        setOutput(result);
      }
    } catch (e: any) {
      const msg = e.message || 'Operation failed';
      setError(msg);
      setOutput('');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handleGeneratePassword = () => {
    setPassword(generatePassword(32));
  };

  return (
    <PageContainer
      title="AES Encrypt / Decrypt"
      subTitle="Encrypt and decrypt text using AES (browser native SubtleCrypto)"
    >
      {/* ── Options bar ──────────────────────────────────────────────────── */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Radio.Group
            value={modeAction}
            onChange={(e) => {
              setModeAction(e.target.value);
              setOutput('');
              setError('');
            }}
          >
            <Radio.Button value="encrypt">
              <LockOutlined /> Encrypt
            </Radio.Button>
            <Radio.Button value="decrypt">
              <UnlockOutlined /> Decrypt
            </Radio.Button>
          </Radio.Group>

          <div>
            <Text type="secondary" style={{ marginRight: 4 }}>
              Mode:
            </Text>
            <Select value={aesMode} onChange={setAesMode} style={{ width: 120 }} size="small">
              <Select.Option value="AES-GCM">AES-GCM</Select.Option>
              <Select.Option value="AES-CBC">AES-CBC</Select.Option>
              <Select.Option value="AES-CTR">AES-CTR</Select.Option>
            </Select>
          </div>

          <div>
            <Text type="secondary" style={{ marginRight: 4 }}>
              Key size:
            </Text>
            <Select value={keySize} onChange={setKeySize} style={{ width: 90 }} size="small">
              <Select.Option value={128}>128-bit</Select.Option>
              <Select.Option value={192}>192-bit</Select.Option>
              <Select.Option value={256}>256-bit</Select.Option>
            </Select>
          </div>

          <div>
            <Text type="secondary" style={{ marginRight: 4 }}>
              Output:
            </Text>
            <Select
              value={outputFormat}
              onChange={setOutputFormat}
              style={{ width: 100 }}
              size="small"
            >
              <Select.Option value="base64">Base64</Select.Option>
              <Select.Option value="hex">Hex</Select.Option>
            </Select>
          </div>
        </Space>
      </Card>

      {/* ── Password ─────────────────────────────────────────────────────── */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input.Password
            addonBefore={<LockOutlined />}
            placeholder="Enter password / secret key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
          <Tooltip title="Generate a random 32-character password">
            <Button icon={<ReloadOutlined />} onClick={handleGeneratePassword} />
          </Tooltip>
          <Tooltip title="Copy password">
            <Button icon={<CopyOutlined />} onClick={() => handleCopy(password)} />
          </Tooltip>
        </Space.Compact>
        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
          Key is derived from password using PBKDF2 (100 000 iterations, SHA-256). A random salt and
          IV are embedded in the output.
        </Text>
      </Card>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError('')}
        />
      )}

      {/* ── Input / Output ───────────────────────────────────────────────── */}
      <Row gutter={16}>
        <Col xs={24} md={11}>
          <Card
            title={modeAction === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
            size="small"
            extra={<Text type="secondary">{input.length} chars</Text>}
          >
            <TextArea
              rows={14}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                modeAction === 'encrypt'
                  ? 'Enter text to encrypt...'
                  : 'Paste ciphertext (salt:iv:ciphertext)...'
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
          <Button
            type="primary"
            onClick={handleConvert}
            loading={loading}
            icon={modeAction === 'encrypt' ? <LockOutlined /> : <UnlockOutlined />}
          >
            {modeAction === 'encrypt' ? 'Encrypt' : 'Decrypt'}
          </Button>
          <Button onClick={handleClear} icon={<DeleteOutlined />} size="small" danger>
            Clear
          </Button>
        </Col>

        <Col xs={24} md={11}>
          <Card
            title={modeAction === 'encrypt' ? 'Ciphertext' : 'Plaintext'}
            size="small"
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(output)}>
                Copy
              </Button>
            }
          >
            <TextArea
              rows={14}
              value={output}
              readOnly
              style={{ fontFamily: 'monospace' }}
              placeholder="Result will appear here..."
            />
          </Card>
        </Col>
      </Row>

      {/* ── Info card ────────────────────────────────────────────────────── */}
      <Card title="About" size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Text strong>AES-GCM</Text>
            <br />
            <Text type="secondary">
              Authenticated encryption. Provides both confidentiality and integrity. Most
              recommended mode for general use.
            </Text>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>AES-CBC</Text>
            <br />
            <Text type="secondary">
              Classic block cipher mode with PKCS#7 padding. Widely used but does not provide
              integrity checking on its own.
            </Text>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>AES-CTR</Text>
            <br />
            <Text type="secondary">
              Counter mode turns AES into a stream cipher. No padding needed. Does not provide
              authentication — combine with HMAC for integrity.
            </Text>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default AesConverter;
