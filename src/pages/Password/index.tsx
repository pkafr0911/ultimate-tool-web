import { Button, Card, Checkbox, Input, InputNumber, Space, Typography } from 'antd';
import React, { useState } from 'react';
import './styles.less';

const { Text, Paragraph } = Typography;

// --- Password generation helper ---
function generatePassword(
  length: number,
  opts: { lower: boolean; upper: boolean; number: boolean; special: boolean; hex: boolean },
) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,./<>?';
  const hex = 'ABCDEFabcdef0123456789';

  let pool = '';
  if (opts.lower) pool += lower;
  if (opts.upper) pool += upper;
  if (opts.number) pool += numbers;
  if (opts.special) pool += special;
  if (opts.hex) pool += hex;

  if (!pool) return '';
  let pw = '';
  for (let i = 0; i < length; i++) pw += pool[Math.floor(Math.random() * pool.length)];
  return pw;
}

// --- Main Component ---
const PasswordPage: React.FC = () => {
  const [length, setLength] = useState(12);
  const [opts, setOpts] = useState({
    lower: true,
    upper: true,
    number: true,
    special: true,
    hex: false,
  });
  const [value, setValue] = useState('');

  const regenerate = () => {
    setValue(generatePassword(length, opts));
  };

  return (
    <Card title="🔐 Password Generator" className="password-card">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* --- Page Description --- */}
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          This page helps you quickly generate secure passwords with custom settings such as length,
          character types, and an optional hex mode.
        </Paragraph>

        {/* --- Options --- */}
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
          Special Characters
        </Checkbox>
        <Checkbox checked={opts.hex} onChange={(e) => setOpts({ ...opts, hex: e.target.checked })}>
          Hex Letters (A–F, 0–9)
        </Checkbox>

        {/* --- Generate Button --- */}
        <Button type="primary" onClick={regenerate}>
          Generate Password
        </Button>

        {/* --- Output --- */}
        <div className="password-output">
          <Typography.Text strong className="password-label">
            Generated Password:
          </Typography.Text>

          <Input
            value={value}
            readOnly
            placeholder="Click Generate to create a password"
            className="password-display"
          />

          {value && (
            <Typography.Text copyable className="password-copy">
              {value}
            </Typography.Text>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default PasswordPage;
