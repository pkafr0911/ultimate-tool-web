import { Button, Card, Input, Space, Typography, message } from 'antd';
import { SignJWT, jwtVerify } from 'jose';
import React, { useState } from 'react';
import './styles.less';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const JWTTool: React.FC = () => {
  const [secret, setSecret] = useState('');
  const [payload, setPayload] = useState('');
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState('');
  const encoder = new TextEncoder();

  const parsePayload = (text: string) => {
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      try {
        const fixed = trimmed.replace(/'/g, '"').replace(/([a-zA-Z0-9_]+):/g, '"$1":');
        return JSON.parse(fixed);
      } catch {
        throw new Error('Invalid JSON payload format.');
      }
    }
  };

  const handleEncrypt = async () => {
    try {
      const obj = parsePayload(payload);
      const secretKey = encoder.encode(secret);

      const jwt = await new SignJWT(obj)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secretKey);

      setToken(jwt);
      message.success('JWT token created successfully!');
    } catch (err: any) {
      message.error(err.message || 'Error creating JWT.');
    }
  };

  const handleDecrypt = async () => {
    try {
      const secretKey = encoder.encode(secret);
      const { payload: verified } = await jwtVerify(token, secretKey);
      setDecoded(JSON.stringify(verified, null, 2));
      message.success('Token verified successfully!');
    } catch (err: any) {
      message.error(`Invalid token: ${err.message}`);
    }
  };

  const handlePrettify = () => {
    try {
      const obj = parsePayload(payload);
      setPayload(JSON.stringify(obj, null, 2));
      message.success('Payload formatted successfully!');
    } catch {
      message.error('Cannot format: invalid JSON.');
    }
  };

  return (
    <Card title="🔐 JWT Encrypt / Decrypt Tool" className="jwt-card" variant="borderless">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* --- Secret Key Input --- */}
        <Input.Password
          placeholder="Enter Secret Key"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />

        {/* --- Payload Input --- */}
        <TextArea
          rows={4}
          placeholder="Enter Payload JSON (e.g. { 'user': 'admin' })"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />

        {/* --- Action Buttons --- */}
        <Space wrap>
          <Button type="primary" onClick={handleEncrypt}>
            Encrypt (Sign JWT)
          </Button>
          <Button onClick={handlePrettify}>Prettify JSON</Button>
        </Space>

        {/* --- Token Field --- */}
        <TextArea
          rows={4}
          placeholder="Generated or Existing JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <Button onClick={handleDecrypt}>Decrypt (Verify JWT)</Button>

        {/* --- Output Section --- */}
        {decoded && (
          <div className="jwt-output">
            <Title level={5}>Decoded Payload:</Title>
            <pre className="jwt-pre">{decoded}</pre>
          </div>
        )}
      </Space>

      {/* --- Guide Section --- */}
      <div className="jwt-guide">
        <Title level={4}>📘 How to Use This Tool</Title>
        <Paragraph>
          This page helps you <Text strong>create</Text> and <Text strong>verify</Text> JSON Web
          Tokens (JWTs) using a secret key.
        </Paragraph>
        <ul>
          <li>Enter a secret key for signing and verifying tokens.</li>
          <li>
            Provide your payload data in JSON format (e.g. <code>{`{ "user": "admin" }`}</code>).
          </li>
          <li>
            Click <Text strong>Encrypt</Text> to generate a JWT.
          </li>
          <li>
            Paste any JWT token and click <Text strong>Decrypt</Text> to verify and decode it.
          </li>
        </ul>
        <Paragraph type="secondary">
          ⚠️ Always keep your secret key private — anyone with it can generate valid tokens.
        </Paragraph>
      </div>
    </Card>
  );
};

export default JWTTool;
