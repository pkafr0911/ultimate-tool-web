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
  EyeOutlined,
  FieldTimeOutlined,
  FunctionOutlined,
  KeyOutlined,
  LockOutlined,
  NumberOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Empty,
  Input,
  Segmented,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  SignJWT,
  decodeJwt,
  decodeProtectedHeader,
  importPKCS8,
  importSPKI,
  jwtVerify,
} from 'jose';
import React, { useEffect, useMemo, useState } from 'react';
import './styles.less';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const ALG_GROUPS = [
  {
    label: 'HMAC (symmetric)',
    options: ['HS256', 'HS384', 'HS512'],
    color: '#13c2c2',
  },
  {
    label: 'RSA',
    options: ['RS256', 'RS384', 'RS512'],
    color: '#1890ff',
  },
  {
    label: 'RSA-PSS',
    options: ['PS256', 'PS384', 'PS512'],
    color: '#722ed1',
  },
  {
    label: 'ECDSA',
    options: ['ES256', 'ES384', 'ES512'],
    color: '#fa8c16',
  },
];

const SAMPLE_HEADER = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
const SAMPLE_PAYLOAD =
  '{\n  "sub": "1234567890",\n  "name": "Jane Doe",\n  "role": "admin",\n  "iat": 1700000000\n}';
const SAMPLE_SECRET = 'your-256-bit-secret';

const formatJSON = (obj: any) => JSON.stringify(obj, null, 2);
const parseJSON = (text: string, label: string) => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
};

const formatTimestamp = (n: unknown) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const ms = n < 1e12 ? n * 1000 : n;
  try {
    return new Date(ms).toUTCString();
  } catch {
    return null;
  }
};

const JWTPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState('HS256');
  const [headerStr, setHeaderStr] = useState(SAMPLE_HEADER);
  const [payloadStr, setPayloadStr] = useState(SAMPLE_PAYLOAD);
  const [secret, setSecret] = useState(SAMPLE_SECRET);
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [token, setToken] = useState('');
  const [expiration, setExpiration] = useState('2h');
  const [verifyState, setVerifyState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [verifyError, setVerifyError] = useState<string>('');

  const isSymmetric = useMemo(() => algorithm.startsWith('HS'), [algorithm]);
  const algGroup = useMemo(
    () => ALG_GROUPS.find((g) => g.options.includes(algorithm)) ?? ALG_GROUPS[0],
    [algorithm],
  );

  // Parse current token (live decode)
  const tokenParts = useMemo(() => {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return { error: 'Token must have 3 parts separated by "."' };
    try {
      return {
        header: decodeProtectedHeader(token),
        payload: decodeJwt(token),
        raw: parts,
      };
    } catch (e: any) {
      return { error: e?.message || 'Failed to decode' };
    }
  }, [token]);

  const tokenStats = useMemo(() => {
    if (!token || !tokenParts || 'error' in tokenParts) return null;
    const exp = (tokenParts.payload as any)?.exp as number | undefined;
    const iat = (tokenParts.payload as any)?.iat as number | undefined;
    const now = Math.floor(Date.now() / 1000);
    const expired = typeof exp === 'number' ? exp < now : null;
    return {
      length: token.length,
      claims: Object.keys(tokenParts.payload || {}).length,
      expired,
      expIn: typeof exp === 'number' ? exp - now : null,
      iat,
      exp,
    };
  }, [token, tokenParts]);

  // Sync header.alg whenever algorithm changes
  useEffect(() => {
    try {
      const h = JSON.parse(headerStr);
      if (h.alg !== algorithm) {
        h.alg = algorithm;
        setHeaderStr(formatJSON(h));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  const handleSign = async () => {
    try {
      const header = parseJSON(headerStr, 'Header');
      const payload = parseJSON(payloadStr, 'Payload');
      header.alg = algorithm;
      setHeaderStr(formatJSON(header));

      let cryptoKey: Uint8Array | CryptoKey;
      if (isSymmetric) {
        cryptoKey = new TextEncoder().encode(secret);
      } else {
        if (!privateKey) {
          message.error('Private key is required for asymmetric algorithms.');
          return;
        }
        try {
          cryptoKey = await importPKCS8(privateKey, algorithm);
        } catch {
          message.error('Invalid private key — expected PKCS8 PEM.');
          return;
        }
      }

      let builder = new SignJWT(payload).setProtectedHeader(header);
      if (!('iat' in payload)) builder = builder.setIssuedAt();
      if (expiration) builder = builder.setExpirationTime(expiration);

      const jwt = await builder.sign(cryptoKey);
      setToken(jwt);
      setVerifyState('valid');
      setVerifyError('');
      message.success('Token signed.');
    } catch (err: any) {
      message.error(err?.message || 'Failed to sign token');
    }
  };

  const handleVerify = async () => {
    if (!token) {
      message.warning('No token to verify.');
      return;
    }
    try {
      let cryptoKey: Uint8Array | CryptoKey;
      if (isSymmetric) {
        cryptoKey = new TextEncoder().encode(secret);
      } else {
        if (!publicKey) {
          message.warning('Public key not provided. Decoding without verification.');
          handleDecodeOnly();
          return;
        }
        try {
          cryptoKey = await importSPKI(publicKey, algorithm);
        } catch {
          message.warning('Invalid public key. Decoding without verification.');
          handleDecodeOnly();
          return;
        }
      }
      const { payload, protectedHeader } = await jwtVerify(token, cryptoKey, {
        algorithms: [algorithm],
      });
      setHeaderStr(formatJSON(protectedHeader));
      setPayloadStr(formatJSON(payload));
      setVerifyState('valid');
      setVerifyError('');
      message.success('Signature verified.');
    } catch (err: any) {
      setVerifyState('invalid');
      setVerifyError(err?.message || 'Verification failed');
      handleDecodeOnly(true);
    }
  };

  const handleDecodeOnly = (silent = false) => {
    if (!token) return;
    try {
      const header = decodeProtectedHeader(token);
      const payload = decodeJwt(token);
      setHeaderStr(formatJSON(header));
      setPayloadStr(formatJSON(payload));
      if (header.alg && typeof header.alg === 'string') setAlgorithm(header.alg);
      if (!silent) message.info('Token decoded (signature not verified).');
    } catch (err: any) {
      message.error(`Decode failed: ${err?.message}`);
    }
  };

  const loadSample = () => {
    setAlgorithm('HS256');
    setHeaderStr(SAMPLE_HEADER);
    setPayloadStr(SAMPLE_PAYLOAD);
    setSecret(SAMPLE_SECRET);
    setExpiration('2h');
    setToken('');
    setVerifyState('idle');
  };

  const clearAll = () => {
    setToken('');
    setHeaderStr('{}');
    setPayloadStr('{}');
    setVerifyState('idle');
    setVerifyError('');
  };

  // ─── Hero actions ──────────────────────────────────────────────
  const heroActions = (
    <Space wrap>
      <Button icon={<BookOutlined />} onClick={loadSample} ghost>
        Sample
      </Button>
      <Button icon={<ClearOutlined />} onClick={clearAll} ghost>
        Clear
      </Button>
      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={handleSign}
        className="primaryAction"
      >
        Sign token
      </Button>
    </Space>
  );

  const stats = [
    {
      icon: <FunctionOutlined />,
      label: 'Algorithm',
      value: algorithm,
    },
    {
      icon: <NumberOutlined />,
      label: 'Token length',
      value: token ? `${token.length} chars` : '—',
    },
    {
      icon:
        verifyState === 'valid' ? (
          <CheckCircleFilled style={{ color: '#52c41a' }} />
        ) : verifyState === 'invalid' ? (
          <CloseCircleFilled style={{ color: '#ff4d4f' }} />
        ) : (
          <SafetyCertificateOutlined />
        ),
      label: 'Signature',
      value:
        verifyState === 'valid'
          ? 'Verified'
          : verifyState === 'invalid'
            ? 'Invalid'
            : 'Not verified',
      tone: verifyState === 'valid' ? 'success' : verifyState === 'invalid' ? 'danger' : undefined,
    },
    {
      icon: <FieldTimeOutlined />,
      label: 'Status',
      value:
        tokenStats?.expired === true ? 'Expired' : tokenStats?.expired === false ? 'Active' : '—',
      tone:
        tokenStats?.expired === true
          ? 'danger'
          : tokenStats?.expired === false
            ? 'success'
            : undefined,
    },
  ];

  // ─── Render token visualizer ───────────────────────────────────
  const renderVisualizer = () => {
    if (!token) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Sign a token or paste one to visualise its parts"
        />
      );
    }
    if (tokenParts && 'error' in tokenParts) {
      return <Alert type="error" showIcon message={tokenParts.error} />;
    }
    const [h, p, s] = tokenParts!.raw;
    return (
      <div className="visualizer">
        <span className="t-header">{h}</span>
        <span className="t-dot">.</span>
        <span className="t-payload">{p}</span>
        <span className="t-dot">.</span>
        <span className="t-signature">{s}</span>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="shell">
        {/* ───── HERO ───── */}
        <div className="hero">
          <div className="heroRow">
            <div className="heroTitleBlock">
              <div className="heroBadge">
                <SafetyCertificateOutlined />
              </div>
              <div>
                <span className="heroEyebrow">JWT Studio</span>
                <Typography.Title
                  level={4}
                  style={{ color: '#fff', margin: '2px 0 0', lineHeight: 1.25 }}
                >
                  Sign, decode & verify JSON Web Tokens
                </Typography.Title>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>
                  HS / RS / PS / ES algorithms with live header & payload editing.
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

        {/* ───── WORKSPACE ───── */}
        <div className="workspace">
          {/* LEFT: Decoded editor */}
          <div className="panel mainPanel">
            <div className="panelHeader">
              <span className="panelTitle">
                <CodeOutlined /> Decoded
              </span>
              <Space wrap>
                <Select
                  className="algSelect"
                  value={algorithm}
                  onChange={setAlgorithm}
                  options={ALG_GROUPS.map((g) => ({
                    label: g.label,
                    options: g.options.map((o) => ({ label: o, value: o })),
                  }))}
                  style={{ width: 200 }}
                />
                <Tooltip title="Token expiration (e.g. 2h, 30m, 7d). Leave empty to omit.">
                  <Input
                    prefix={<FieldTimeOutlined />}
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    placeholder="Expiration"
                    style={{ width: 140 }}
                  />
                </Tooltip>
              </Space>
            </div>

            <Tabs
              defaultActiveKey="payload"
              items={[
                {
                  key: 'header',
                  label: (
                    <span>
                      <ApartmentOutlined /> Header
                    </span>
                  ),
                  children: (
                    <TextArea
                      className="codeArea headerArea"
                      value={headerStr}
                      onChange={(e) => setHeaderStr(e.target.value)}
                      autoSize={{ minRows: 5, maxRows: 10 }}
                    />
                  ),
                },
                {
                  key: 'payload',
                  label: (
                    <span>
                      <CodeOutlined /> Payload
                    </span>
                  ),
                  children: (
                    <TextArea
                      className="codeArea payloadArea"
                      value={payloadStr}
                      onChange={(e) => setPayloadStr(e.target.value)}
                      autoSize={{ minRows: 8, maxRows: 18 }}
                    />
                  ),
                },
              ]}
            />

            <div className="keyBox">
              <div className="keyBoxHeader">
                <span className="panelTitle">
                  <KeyOutlined /> {isSymmetric ? 'Secret key' : 'Key pair (PEM)'}
                </span>
                <Tag color={algGroup.color}>{algGroup.label}</Tag>
              </div>

              {isSymmetric ? (
                <Input.Password
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="your-256-bit-secret"
                  iconRender={(visible) => (visible ? <UnlockOutlined /> : <LockOutlined />)}
                  className="secretInput"
                />
              ) : (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" className="keyLabel">
                      Private key (PKCS8 PEM)
                    </Text>
                    <TextArea
                      className="codeArea"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                      autoSize={{ minRows: 4, maxRows: 8 }}
                    />
                  </div>
                  <div>
                    <Text type="secondary" className="keyLabel">
                      Public key (SPKI PEM) — for verification
                    </Text>
                    <TextArea
                      className="codeArea"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'}
                      autoSize={{ minRows: 4, maxRows: 8 }}
                    />
                  </div>
                </Space>
              )}
            </div>
          </div>

          {/* RIGHT: Encoded + tabs */}
          <div className="panel sidePanel">
            <div className="panelHeader">
              <span className="panelTitle">
                <SwapOutlined /> Encoded token
              </span>
              <Space>
                <Tooltip title="Copy">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => token && handleCopy(token, 'Token copied')}
                    disabled={!token}
                  />
                </Tooltip>
                <Button icon={<EyeOutlined />} onClick={() => handleDecodeOnly()}>
                  Decode
                </Button>
                <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleVerify}>
                  Verify
                </Button>
              </Space>
            </div>

            <TextArea
              className="tokenInput"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setVerifyState('idle');
              }}
              placeholder="Paste a JWT here, or click Sign to generate one…"
              autoSize={{ minRows: 6, maxRows: 12 }}
            />

            {verifyState === 'invalid' && verifyError && (
              <Alert type="error" showIcon message="Signature invalid" description={verifyError} />
            )}

            <Tabs
              defaultActiveKey="visualizer"
              items={[
                {
                  key: 'visualizer',
                  label: (
                    <span>
                      <ApartmentOutlined /> Visualizer
                    </span>
                  ),
                  children: (
                    <>
                      <div className="visualizerCard">{renderVisualizer()}</div>
                      <div className="legend">
                        <span className="legItem">
                          <span className="dot dotHeader" /> Header
                        </span>
                        <span className="legItem">
                          <span className="dot dotPayload" /> Payload
                        </span>
                        <span className="legItem">
                          <span className="dot dotSignature" /> Signature
                        </span>
                      </div>
                    </>
                  ),
                },
                {
                  key: 'claims',
                  label: (
                    <span>
                      <BookOutlined /> Claims
                    </span>
                  ),
                  children:
                    tokenParts && !('error' in tokenParts) ? (
                      <div className="claimsList">
                        {Object.entries(tokenParts.payload as Record<string, unknown>).map(
                          ([k, v]) => {
                            const ts =
                              ['exp', 'iat', 'nbf'].includes(k) && typeof v === 'number'
                                ? formatTimestamp(v)
                                : null;
                            return (
                              <div key={k} className="claimRow">
                                <Tag color="geekblue" className="claimKey">
                                  {k}
                                </Tag>
                                <code className="claimVal">
                                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                </code>
                                {ts && <span className="claimMeta">{ts}</span>}
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No decoded claims" />
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
                        <SafetyCertificateOutlined />
                        <div>
                          <strong>What is a JWT?</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            A compact, URL-safe token with three Base64URL parts:{' '}
                            <code>header</code>.<code>payload</code>.<code>signature</code>.
                          </Paragraph>
                        </div>
                      </div>
                      <div className="guideItem">
                        <KeyOutlined />
                        <div>
                          <strong>Symmetric vs asymmetric</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            <strong>HS*</strong> uses a shared secret. <strong>RS*</strong>,{' '}
                            <strong>PS*</strong>, <strong>ES*</strong> use a private key to sign and
                            a public key to verify.
                          </Paragraph>
                        </div>
                      </div>
                      <div className="guideItem">
                        <FieldTimeOutlined />
                        <div>
                          <strong>Standard claims</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            <code>iat</code> issued-at, <code>exp</code> expiration,{' '}
                            <code>nbf</code> not-before, <code>iss</code> issuer, <code>aud</code>{' '}
                            audience, <code>sub</code> subject.
                          </Paragraph>
                        </div>
                      </div>
                      <div className="guideItem">
                        <LockOutlined />
                        <div>
                          <strong>Security tip</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            Never put secrets in the payload — it is only Base64-encoded, not
                            encrypted. JWTs are signed, not confidential.
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
    </div>
  );
};

export default JWTPage;
