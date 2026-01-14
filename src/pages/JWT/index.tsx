import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
  message,
  Tooltip,
} from 'antd';
import {
  SignJWT,
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
  importPKCS8,
  importSPKI,
} from 'jose';
import React, { useState, useMemo } from 'react';
import {
  ArrowRightOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  CopyOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import './styles.less';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const JWTTool: React.FC = () => {
  // --- State ---
  const [algorithm, setAlgorithm] = useState('HS256');
  const [headerStr, setHeaderStr] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadStr, setPayloadStr] = useState(
    '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}',
  );
  const [secret, setSecret] = useState('secret');
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [token, setToken] = useState('');
  const [expiration, setExpiration] = useState('2h');

  const encoder = new TextEncoder();

  // Determine if algorithm is symmetric (HMAC) or asymmetric (RSA/ECDSA/PS)
  const isSymmetric = useMemo(() => {
    return algorithm.startsWith('HS');
  }, [algorithm]);

  // --- Helpers ---
  const parseJSON = (text: string, label: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON in ${label}`);
    }
  };

  const formatJSON = (obj: any) => JSON.stringify(obj, null, 2);

  // --- Actions ---

  const handleEncrypt = async () => {
    try {
      const header = parseJSON(headerStr, 'Header');
      const payload = parseJSON(payloadStr, 'Payload');

      // Ensure algorithm in header matches selected algorithm
      header.alg = algorithm;
      setHeaderStr(formatJSON(header));

      let cryptoKey: Uint8Array | CryptoKey;

      if (isSymmetric) {
        // Use secret for HMAC algorithms
        cryptoKey = encoder.encode(secret);
      } else {
        // Use private key for asymmetric algorithms
        if (!privateKey) {
          message.error('Private key is required for asymmetric algorithms');
          return;
        }
        try {
          cryptoKey = await importPKCS8(privateKey, algorithm);
        } catch (err: any) {
          message.error('Invalid private key format. Expected PKCS8 PEM format.');
          return;
        }
      }

      let jwtBuilder = new SignJWT(payload).setProtectedHeader(header).setIssuedAt();

      if (expiration) {
        jwtBuilder = jwtBuilder.setExpirationTime(expiration);
      }

      const jwt = await jwtBuilder.sign(cryptoKey);

      setToken(jwt);
      message.success('Token generated successfully!');
    } catch (err: any) {
      message.error(err.message || 'Error generating token');
    }
  };

  const handleVerify = async () => {
    if (!token) return;
    try {
      let cryptoKey: Uint8Array | CryptoKey;

      if (isSymmetric) {
        // Use secret for HMAC algorithms
        cryptoKey = encoder.encode(secret);
      } else {
        // Use public key for asymmetric algorithms
        if (!publicKey) {
          message.warning('Public key not provided. Decoding without verification...');
          handleDecodeOnly();
          return;
        }
        try {
          cryptoKey = await importSPKI(publicKey, algorithm);
        } catch (err: any) {
          message.warning('Invalid public key. Decoding without verification...');
          handleDecodeOnly();
          return;
        }
      }

      const { payload, protectedHeader } = await jwtVerify(token, cryptoKey, {
        algorithms: [algorithm],
      });

      setHeaderStr(formatJSON(protectedHeader));
      setPayloadStr(formatJSON(payload));
      message.success('Token verified successfully!');
    } catch (err: any) {
      message.warning(`Verification failed: ${err.message}. Decoding without verification...`);
      handleDecodeOnly();
    }
  };

  const handleDecodeOnly = () => {
    if (!token) return;
    try {
      const header = decodeProtectedHeader(token);
      const payload = decodeJwt(token);

      setHeaderStr(formatJSON(header));
      setPayloadStr(formatJSON(payload));

      if (header.alg) {
        setAlgorithm(header.alg);
      }

      message.info('Token decoded (signature not verified)');
    } catch (err: any) {
      message.error(`Decoding failed: ${err.message}`);
    }
  };

  // --- Render Helpers ---

  // Color-coded token visualizer
  const renderTokenVisualizer = () => {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return <Text type="secondary">Invalid token format</Text>;

    return (
      <div className="token-visualizer">
        <span className="token-part-header">{parts[0]}</span>
        <span className="token-dot">.</span>
        <span className="token-part-payload">{parts[1]}</span>
        <span className="token-dot">.</span>
        <span className="token-part-signature">{parts[2]}</span>
      </div>
    );
  };

  return (
    <div className="jwt-container">
      <Card bordered={false} className="jwt-main-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>🔐 JWT Debugger</Title>
          <Paragraph type="secondary">
            Encode and Decode JSON Web Tokens. Verify signatures with secrets.
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          {/* --- Left Column: Decoded --- */}
          <Col xs={24} lg={12}>
            <Card title="Decoded" className="section-card" bordered={false}>
              {/* Algorithm & Secret */}
              <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Algorithm</Text>
                    <Select
                      value={algorithm}
                      onChange={(val) => {
                        setAlgorithm(val);
                        // Update header JSON automatically
                        try {
                          const h = JSON.parse(headerStr);
                          h.alg = val;
                          setHeaderStr(formatJSON(h));
                        } catch {}
                      }}
                      style={{ width: '100%' }}
                    >
                      <Option value="HS256">HS256</Option>
                      <Option value="HS384">HS384</Option>
                      <Option value="HS512">HS512</Option>
                      <Option value="RS256">RS256</Option>
                      <Option value="RS384">RS384</Option>
                      <Option value="RS512">RS512</Option>
                      <Option value="ES256">ES256</Option>
                      <Option value="ES384">ES384</Option>
                      <Option value="ES512">ES512</Option>
                      <Option value="PS256">PS256</Option>
                      <Option value="PS384">PS384</Option>
                      <Option value="PS512">PS512</Option>
                    </Select>
                  </Col>
                  <Col span={12}>
                    <Text strong>Expiration</Text>
                    <Input
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value)}
                      placeholder="e.g. 2h, 10m, 7d"
                    />
                  </Col>
                </Row>
              </Space>

              {/* Header & Payload Tabs */}
              <Tabs
                defaultActiveKey="payload"
                items={[
                  {
                    key: 'header',
                    label: 'Header',
                    children: (
                      <div className="json-editor-container header-editor">
                        <TextArea
                          value={headerStr}
                          onChange={(e) => setHeaderStr(e.target.value)}
                          autoSize={{ minRows: 4, maxRows: 8 }}
                          className="code-font"
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'payload',
                    label: 'Payload',
                    children: (
                      <div className="json-editor-container payload-editor">
                        <TextArea
                          value={payloadStr}
                          onChange={(e) => setPayloadStr(e.target.value)}
                          autoSize={{ minRows: 8, maxRows: 16 }}
                          className="code-font"
                        />
                      </div>
                    ),
                  },
                ]}
              />

              {/* Secret Key */}
              <div style={{ marginTop: 16 }}>
                {isSymmetric ? (
                  <>
                    <Text strong>Secret Key</Text>
                    <Input.Password
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder="your-256-bit-secret"
                      iconRender={(visible) => (visible ? <UnlockOutlined /> : <LockOutlined />)}
                    />
                  </>
                ) : (
                  <>
                    <Text strong>Private Key (PKCS8 PEM)</Text>
                    <TextArea
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      className="code-font"
                      style={{ marginBottom: 16 }}
                    />
                    <Text strong>Public Key (SPKI PEM) - for verification</Text>
                    <TextArea
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      className="code-font"
                    />
                  </>
                )}
              </div>

              {/* Action: Encode */}
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={handleEncrypt}
                  size="large"
                >
                  Sign / Encode
                </Button>
              </div>
            </Card>
          </Col>

          {/* --- Right Column: Encoded --- */}
          <Col xs={24} lg={12}>
            <Card title="Encoded" className="section-card" bordered={false}>
              <div className="encoded-container">
                <TextArea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste a JWT here..."
                  autoSize={{ minRows: 8, maxRows: 12 }}
                  className="code-font token-input"
                />

                <Space style={{ marginTop: 16, width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Button icon={<EyeOutlined />} onClick={handleDecodeOnly}>
                      Decode Only
                    </Button>
                    <Tooltip title="Copy Token">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(token);
                          message.success('Copied!');
                        }}
                      />
                    </Tooltip>
                  </Space>
                  <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleVerify}
                    size="large"
                  >
                    Verify / Decode
                  </Button>
                </Space>
              </div>

              <Divider orientation="left">Visualizer</Divider>
              <div className="visualizer-container">{renderTokenVisualizer()}</div>

              <div className="legend" style={{ marginTop: 16 }}>
                <Space size="large">
                  <Space>
                    <div className="dot header-dot" />
                    <Text type="secondary">Header</Text>
                  </Space>
                  <Space>
                    <div className="dot payload-dot" />
                    <Text type="secondary">Payload</Text>
                  </Space>
                  <Space>
                    <div className="dot signature-dot" />
                    <Text type="secondary">Signature</Text>
                  </Space>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default JWTTool;
