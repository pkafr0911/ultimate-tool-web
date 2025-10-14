import React, { useState } from 'react';
import { Input, Button, Card, Typography, Space, message } from 'antd';
import jwt from 'jsonwebtoken';
import { PageContainer } from '@ant-design/pro-components';

const { TextArea } = Input;
const { Title, Text } = Typography;

const JWTTool: React.FC = () => {
  const [secret, setSecret] = useState('');
  const [payload, setPayload] = useState('');
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState('');

  const handleEncrypt = () => {
    try {
      const obj = JSON.parse(payload);
      const signed = jwt.sign(obj, secret, { algorithm: 'HS256' });
      setToken(signed);
      message.success('JWT token created successfully!');
    } catch (err) {
      message.error('Invalid JSON payload.');
    }
  };

  const handleDecrypt = () => {
    try {
      const decodedData = jwt.verify(token, secret);
      setDecoded(JSON.stringify(decodedData, null, 2));
      message.success('Token decoded successfully!');
    } catch (err: any) {
      message.error(`Invalid token: ${err.message}`);
    }
  };

  return (
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

        <Button type="primary" onClick={handleEncrypt}>
          Encrypt (Sign JWT)
        </Button>

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
            <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6 }}>{decoded}</pre>
          </>
        )}
      </Space>
    </Card>
  );
};

export default JWTTool;
