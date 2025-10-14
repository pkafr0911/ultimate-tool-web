import React, { useState, useEffect } from 'react';
import { Card, InputNumber, Button, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { PageContainer } from '@ant-design/pro-components';

const EpochPage: React.FC = () => {
  const [unix, setUnix] = useState<number>(Math.floor(Date.now() / 1000));
  const [input, setInput] = useState<number | undefined>(undefined);

  useEffect(() => {
    const id = setInterval(() => setUnix(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const fromInput = () => {
    if (!input) return null;
    return dayjs.unix(input).format('YYYY-MM-DD HH:mm:ss');
  };

  return (
    <Card title="Epoch / Unix Time">
      <Space direction="vertical">
        <Typography.Text>Current Unix: {unix}</Typography.Text>
        <InputNumber value={input} onChange={(v) => setInput(Number(v))} />
        <Typography.Paragraph>Converted: {fromInput()}</Typography.Paragraph>
      </Space>
    </Card>
  );
};

export default EpochPage;
