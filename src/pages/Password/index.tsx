import React, { useState } from 'react';
import { Card, InputNumber, Checkbox, Button, Input, Space, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';

function generatePassword(
  length: number,
  opts: { lower: boolean; upper: boolean; number: boolean; special: boolean },
) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,./<>?';
  let pool = '';
  if (opts.lower) pool += lower;
  if (opts.upper) pool += upper;
  if (opts.number) pool += numbers;
  if (opts.special) pool += special;
  if (!pool) return '';
  let pw = '';
  for (let i = 0; i < length; i++) pw += pool[Math.floor(Math.random() * pool.length)];
  return pw;
}

const PasswordPage: React.FC = () => {
  const [length, setLength] = useState(12);
  const [opts, setOpts] = useState({ lower: true, upper: true, number: true, special: true });
  const [value, setValue] = useState('');

  const regenerate = () => {
    setValue(generatePassword(length, opts));
  };

  return (
    <Card title="Password Generator">
      <Space direction="vertical" style={{ width: '100%' }}>
        <InputNumber
          min={4}
          max={64}
          value={length}
          onChange={(v) => setLength(Number(v))}
          addonBefore="Length"
        />
        <Checkbox
          checked={opts.lower}
          onChange={(e) => setOpts({ ...opts, lower: e.target.checked })}
        >
          Lowercase
        </Checkbox>
        <Checkbox
          checked={opts.upper}
          onChange={(e) => setOpts({ ...opts, upper: e.target.checked })}
        >
          Uppercase
        </Checkbox>
        <Checkbox
          checked={opts.number}
          onChange={(e) => setOpts({ ...opts, number: e.target.checked })}
        >
          Numbers
        </Checkbox>
        <Checkbox
          checked={opts.special}
          onChange={(e) => setOpts({ ...opts, special: e.target.checked })}
        >
          Special
        </Checkbox>
        <Button type="primary" onClick={regenerate}>
          Generate
        </Button>
        <Input value={value} readOnly placeholder="Generated password" />
        {value && <Typography.Text copyable>{value}</Typography.Text>}
      </Space>
    </Card>
  );
};

export default PasswordPage;
