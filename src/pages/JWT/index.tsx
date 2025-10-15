import React, { useState } from 'react';
import { Input, Button, Card, Typography, Space, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { SignJWT, jwtVerify } from 'jose';

const { TextArea } = Input;
const { Title } = Typography;

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
        let fixed = trimmed
          .replace(/'/g, '"') // replace single quotes
          .replace(/([a-zA-Z0-9_]+):/g, '"$1":'); // add quotes to keys
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
      console.error(err);
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
    <PageContainer>
      <Card title="🔐 JWT Encrypt / Decrypt Tool" bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input.Password
            placeholder="Enter Secret Key"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />

          <TextArea
            rows={4}
            placeholder="Enter Payload JSON (e.g. { 'user': 'admin' })"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />

          <Space>
            <Button type="primary" onClick={handleEncrypt}>
              Encrypt (Sign JWT)
            </Button>
            <Button onClick={handlePrettify}>Prettify JSON</Button>
          </Space>

          <TextArea
            rows={4}
            placeholder="Generated or Existing JWT Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          <Button onClick={handleDecrypt}>Decrypt (Verify JWT)</Button>

          {decoded && (
            <>
              <Title level={5}>Decoded Payload:</Title>
              <pre
                style={{
                  background: '#f7f7f7',
                  padding: 12,
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {decoded}
              </pre>
            </>
          )}
        </Space>
      </Card>
    </PageContainer>
  );
};

export default JWTTool;
