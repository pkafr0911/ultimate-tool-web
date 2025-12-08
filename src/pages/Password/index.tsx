import {
  CopyOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Input,
  List,
  Progress,
  Row,
  Slider,
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import './styles.less';

const { Title, Text, Paragraph } = Typography;

interface PasswordOptions {
  lower: boolean;
  upper: boolean;
  number: boolean;
  special: boolean;
  hex: boolean;
  excludeAmbiguous: boolean;
}

const PasswordPage: React.FC = () => {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState<PasswordOptions>({
    lower: true,
    upper: true,
    number: true,
    special: true,
    hex: false,
    excludeAmbiguous: false,
  });
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  // --- Logic ---

  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length > 8) score += 20;
    if (pwd.length > 12) score += 20;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    return Math.min(100, score);
  };

  const generatePassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,./<>?';
    const hex = 'ABCDEFabcdef0123456789';
    const ambiguous = 'l1IO0';

    let pool = '';
    if (opts.hex) {
      pool = hex;
    } else {
      if (opts.lower) pool += lower;
      if (opts.upper) pool += upper;
      if (opts.number) pool += numbers;
      if (opts.special) pool += special;
    }

    if (opts.excludeAmbiguous) {
      pool = pool
        .split('')
        .filter((c) => !ambiguous.includes(c))
        .join('');
    }

    if (!pool) {
      setPassword('');
      setStrength(0);
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      newPassword += pool[array[i] % pool.length];
    }

    setPassword(newPassword);
    setStrength(calculateStrength(newPassword));
    addToHistory(newPassword);
  };

  const addToHistory = (pwd: string) => {
    setHistory((prev) => {
      const newHistory = [pwd, ...prev.filter((p) => p !== pwd)].slice(0, 10);
      return newHistory;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Password copied to clipboard!');
  };

  const clearHistory = () => {
    setHistory([]);
    message.success('History cleared');
  };

  // Auto-generate on mount
  useEffect(() => {
    generatePassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get strength color
  const getStrengthColor = () => {
    if (strength < 40) return '#ff4d4f';
    if (strength < 70) return '#faad14';
    return '#52c41a';
  };

  const getStrengthLabel = () => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="password-container">
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={14}>
          <Card
            className="password-card main-card"
            bordered={false}
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                <span>Secure Password Generator</span>
              </Space>
            }
          >
            {/* Display Section */}
            <div className="password-display-section">
              <div className="password-box">
                <Input value={password} readOnly className="password-input" bordered={false} />
                <Space>
                  <Tooltip title="Regenerate">
                    <Button
                      type="text"
                      icon={<ReloadOutlined />}
                      onClick={generatePassword}
                      size="large"
                    />
                  </Tooltip>
                  <Tooltip title="Copy">
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(password)}
                      size="large"
                      shape="circle"
                    />
                  </Tooltip>
                </Space>
              </div>

              <div className="strength-meter">
                <div className="strength-label">
                  <Text type="secondary">Strength: </Text>
                  <Text strong style={{ color: getStrengthColor() }}>
                    {getStrengthLabel()}
                  </Text>
                </div>
                <Progress
                  percent={strength}
                  showInfo={false}
                  strokeColor={getStrengthColor()}
                  trailColor="rgba(0,0,0,0.05)"
                  size="small"
                />
              </div>
            </div>

            <Divider />

            {/* Configuration Section */}
            <div className="config-section">
              <Title level={5}>
                <SettingOutlined /> Configuration
              </Title>

              <div className="length-slider">
                <div className="slider-header">
                  <Text>Password Length</Text>
                  <Text strong className="length-value">
                    {length}
                  </Text>
                </div>
                <Slider
                  min={4}
                  max={64}
                  value={length}
                  onChange={setLength}
                  tooltip={{ formatter: (value) => `${value} chars` }}
                />
              </div>

              <Row gutter={[16, 16]} className="options-grid">
                <Col span={12}>
                  <Checkbox
                    checked={opts.upper}
                    onChange={(e) => setOpts({ ...opts, upper: e.target.checked })}
                    disabled={opts.hex}
                  >
                    Uppercase (A-Z)
                  </Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox
                    checked={opts.lower}
                    onChange={(e) => setOpts({ ...opts, lower: e.target.checked })}
                    disabled={opts.hex}
                  >
                    Lowercase (a-z)
                  </Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox
                    checked={opts.number}
                    onChange={(e) => setOpts({ ...opts, number: e.target.checked })}
                  >
                    Numbers (0-9)
                  </Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox
                    checked={opts.special}
                    onChange={(e) => setOpts({ ...opts, special: e.target.checked })}
                    disabled={opts.hex}
                  >
                    Special (!@#$)
                  </Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox
                    checked={opts.excludeAmbiguous}
                    onChange={(e) => setOpts({ ...opts, excludeAmbiguous: e.target.checked })}
                  >
                    Exclude Ambiguous (l, 1, O, 0)
                  </Checkbox>
                </Col>
                <Col span={12}>
                  <Space>
                    <Text>Hex Mode</Text>
                    <Switch
                      checked={opts.hex}
                      onChange={(checked) => setOpts({ ...opts, hex: checked })}
                      size="small"
                    />
                  </Space>
                </Col>
              </Row>

              <Button
                type="primary"
                block
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={generatePassword}
                style={{ marginTop: 24 }}
              >
                Generate New Password
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            className="password-card history-card"
            bordered={false}
            title={
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Space>
                  <HistoryOutlined />
                  <span>History</span>
                </Space>
                {history.length > 0 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={clearHistory}
                  >
                    Clear
                  </Button>
                )}
              </div>
            }
          >
            <List
              dataSource={history}
              renderItem={(item) => (
                <List.Item
                  className="history-item"
                  actions={[
                    <Tooltip title="Copy">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(item)}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Text code ellipsis style={{ width: '100%' }}>
                    {item}
                  </Text>
                </List.Item>
              )}
              locale={{ emptyText: 'No history yet' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PasswordPage;
