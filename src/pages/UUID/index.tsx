import { handleCopy } from '@/helpers';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BookOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleFilled,
  CompassOutlined,
  CopyOutlined,
  DownloadOutlined,
  FunctionOutlined,
  HistoryOutlined,
  IdcardOutlined,
  NumberOutlined,
  ScanOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Input,
  InputNumber,
  Segmented,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React from 'react';
import {
  NIL as UUID_NIL,
  v1 as uuidv1,
  v4 as uuidv4,
  validate as uuidValidate,
  version as uuidVersion,
} from 'uuid';
import './styles.less';

const { Text, Paragraph } = Typography;

type UuidVersion = 'v1' | 'v4' | 'nil';

const VERSION_INFO: Record<UuidVersion, { label: string; desc: string; color: string }> = {
  v1: {
    label: 'v1 — Time',
    desc: 'Timestamp + MAC address based. Sortable by creation time.',
    color: '#13c2c2',
  },
  v4: {
    label: 'v4 — Random',
    desc: 'Cryptographically random. The most common general-purpose UUID.',
    color: '#1890ff',
  },
  nil: {
    label: 'NIL',
    desc: 'The special all-zero UUID, often used as a placeholder.',
    color: '#8c8c8c',
  },
};

const generateOne = (v: UuidVersion): string => {
  if (v === 'v1') return uuidv1();
  if (v === 'nil') return UUID_NIL;
  return uuidv4();
};

const formatUuid = (raw: string, format: 'standard' | 'upper' | 'no-dash' | 'braces') => {
  const lower = raw.toLowerCase();
  switch (format) {
    case 'upper':
      return lower.toUpperCase();
    case 'no-dash':
      return lower.replace(/-/g, '');
    case 'braces':
      return `{${lower}}`;
    case 'standard':
    default:
      return lower;
  }
};

const decodeUuid = (raw: string) => {
  const trimmed = raw.trim().replace(/[{}]/g, '');
  const valid = uuidValidate(trimmed);
  if (!valid) return { valid: false as const, trimmed };
  const ver = uuidVersion(trimmed);
  // The 17th hex char (after stripping dashes, position 16) encodes the variant.
  const noDash = trimmed.replace(/-/g, '');
  const variantNibble = parseInt(noDash[16], 16);
  let variant = 'Reserved';
  if ((variantNibble & 0b1000) === 0) variant = 'NCS (legacy)';
  else if ((variantNibble & 0b1100) === 0b1000) variant = 'RFC 4122';
  else if ((variantNibble & 0b1110) === 0b1100) variant = 'Microsoft GUID';
  return { valid: true as const, trimmed, version: ver, variant };
};

const UUIDPage: React.FC = () => {
  const [version, setVersion] = React.useState<UuidVersion>('v4');
  const [format, setFormat] = React.useState<'standard' | 'upper' | 'no-dash' | 'braces'>(
    'standard',
  );
  const [current, setCurrent] = React.useState<string>(uuidv4());
  const [history, setHistory] = React.useState<string[]>([]);
  const [bulkCount, setBulkCount] = React.useState<number>(10);
  const [bulkOutput, setBulkOutput] = React.useState<string>('');
  const [decodeInput, setDecodeInput] = React.useState<string>('');
  const [autoCopy, setAutoCopy] = React.useState<boolean>(false);

  const generate = React.useCallback(
    (v: UuidVersion = version) => {
      const next = generateOne(v);
      setCurrent(next);
      setHistory((prev) => [next, ...prev].slice(0, 50));
      if (autoCopy) handleCopy(formatUuid(next, format), 'UUID copied');
    },
    [version, autoCopy, format],
  );

  const handleBulkGenerate = () => {
    const count = Math.max(1, Math.min(10000, bulkCount || 1));
    const lines: string[] = [];
    for (let i = 0; i < count; i++) lines.push(formatUuid(generateOne(version), format));
    setBulkOutput(lines.join('\n'));
  };

  const handleDownload = () => {
    if (!bulkOutput) return;
    const blob = new Blob([bulkOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${version}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatted = formatUuid(current, format);
  const decoded = decodeInput.trim() ? decodeUuid(decodeInput) : null;
  const currentDecoded = decodeUuid(current);

  // ---- Hero & stat data ---------------------------------------------------
  const heroActions = (
    <Space wrap>
      <Tooltip title="Auto-copy on generate">
        <span className="autoCopyToggle">
          <Switch checked={autoCopy} onChange={setAutoCopy} size="small" />
          <span>Auto-copy</span>
        </span>
      </Tooltip>
      <Button
        icon={<ClearOutlined />}
        onClick={() => {
          setHistory([]);
          setBulkOutput('');
        }}
        ghost
      >
        Clear history
      </Button>
      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={() => generate()}
        className="primaryAction"
      >
        Generate
      </Button>
    </Space>
  );

  const stats = [
    {
      icon: <FunctionOutlined />,
      label: 'Active version',
      value: VERSION_INFO[version].label,
    },
    {
      icon: <NumberOutlined />,
      label: 'Length',
      value: `${formatted.length} chars`,
    },
    {
      icon: currentDecoded.valid ? (
        <CheckCircleFilled style={{ color: '#52c41a' }} />
      ) : (
        <CloseCircleFilled style={{ color: '#ff4d4f' }} />
      ),
      label: 'Validity',
      value: currentDecoded.valid ? 'Valid' : 'Invalid',
      tone: currentDecoded.valid ? 'success' : 'danger',
    },
    {
      icon: <HistoryOutlined />,
      label: 'Generated',
      value: history.length,
    },
  ];

  return (
    <div className="container">
      <div className="shell">
        {/* ---------- HERO ---------- */}
        <div className="hero">
          <div className="heroRow">
            <div className="heroTitleBlock">
              <div className="heroBadge">
                <IdcardOutlined />
              </div>
              <div>
                <span className="heroEyebrow">UUID Studio</span>
                <Typography.Title level={3} style={{ color: '#fff', margin: '4px 0 2px' }}>
                  Generate, format & decode UUIDs
                </Typography.Title>
                <Text style={{ color: 'rgba(255,255,255,0.78)' }}>
                  RFC 4122 compliant identifiers — random, time-based, or NIL.
                </Text>
              </div>
            </div>
            <div className="heroActions">{heroActions}</div>
          </div>
        </div>

        {/* ---------- STAT STRIP ---------- */}
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

        {/* ---------- WORKSPACE ---------- */}
        <div className="workspace">
          {/* ---- Left: main generator ---- */}
          <div className="panel mainPanel">
            <div className="panelHeader">
              <span className="panelTitle">
                <ThunderboltOutlined /> Generator
              </span>
              <Segmented
                value={version}
                onChange={(v) => setVersion(v as UuidVersion)}
                options={[
                  { label: 'v4 Random', value: 'v4' },
                  { label: 'v1 Time', value: 'v1' },
                  { label: 'NIL', value: 'nil' },
                ]}
              />
            </div>

            <div className="uuidStage">
              <div className="uuidValue">{formatted}</div>
              <div className="uuidStageActions">
                <Tooltip title="Copy">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(formatted, 'UUID copied')}
                  />
                </Tooltip>
                <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => generate()}>
                  Generate new
                </Button>
              </div>
              <div className="uuidVersionDesc">
                <Tag color={VERSION_INFO[version].color}>{VERSION_INFO[version].label}</Tag>
                <span>{VERSION_INFO[version].desc}</span>
              </div>
            </div>

            <div className="formatRow">
              <span className="formatLabel">Format</span>
              <Segmented
                value={format}
                onChange={(v) => setFormat(v as typeof format)}
                options={[
                  { label: 'standard', value: 'standard' },
                  { label: 'UPPER', value: 'upper' },
                  { label: 'no-dash', value: 'no-dash' },
                  { label: '{braces}', value: 'braces' },
                ]}
              />
            </div>

            <div className="bulkBox">
              <div className="bulkBoxHeader">
                <span className="panelTitle">
                  <UnorderedListOutlined /> Bulk generate
                </span>
                <Space>
                  <InputNumber
                    min={1}
                    max={10000}
                    value={bulkCount}
                    onChange={(v) => setBulkCount(Number(v) || 1)}
                    addonAfter="count"
                  />
                  <Button icon={<ThunderboltOutlined />} onClick={handleBulkGenerate}>
                    Generate
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => bulkOutput && handleCopy(bulkOutput, 'List copied')}
                    disabled={!bulkOutput}
                  >
                    Copy
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    disabled={!bulkOutput}
                  >
                    .txt
                  </Button>
                </Space>
              </div>
              <Input.TextArea
                className="bulkOutput"
                value={bulkOutput}
                onChange={(e) => setBulkOutput(e.target.value)}
                placeholder={`Click "Generate" to fill ${bulkCount} ${version.toUpperCase()} UUIDs here…`}
                autoSize={{ minRows: 6, maxRows: 14 }}
              />
            </div>
          </div>

          {/* ---- Right: tabs (history / decode / guide) ---- */}
          <div className="panel sidePanel">
            <Tabs
              defaultActiveKey="history"
              items={[
                {
                  key: 'history',
                  label: (
                    <span>
                      <HistoryOutlined /> History
                      {history.length > 0 ? ` (${history.length})` : ''}
                    </span>
                  ),
                  children:
                    history.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No UUIDs generated yet"
                      />
                    ) : (
                      <ul className="historyList">
                        {history.map((u, i) => (
                          <li key={`${u}-${i}`} className="historyItem">
                            <code>{formatUuid(u, format)}</code>
                            <div className="historyActions">
                              <Tooltip title="Copy">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => handleCopy(formatUuid(u, format), 'UUID copied')}
                                />
                              </Tooltip>
                              <Tooltip title="Use as current">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<ApartmentOutlined />}
                                  onClick={() => setCurrent(u)}
                                />
                              </Tooltip>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ),
                },
                {
                  key: 'decode',
                  label: (
                    <span>
                      <ScanOutlined /> Decode
                    </span>
                  ),
                  children: (
                    <div className="decodeBox">
                      <Input.TextArea
                        rows={3}
                        value={decodeInput}
                        onChange={(e) => setDecodeInput(e.target.value)}
                        placeholder="Paste any UUID to inspect its version & variant…"
                      />
                      <div className="decodeResult">
                        {!decoded ? (
                          <Text type="secondary">Awaiting input…</Text>
                        ) : decoded.valid ? (
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <div className="decodeRow">
                              <Tag icon={<CheckCircleOutlined />} color="success">
                                Valid UUID
                              </Tag>
                            </div>
                            <div className="decodeRow">
                              <span className="decodeKey">Version</span>
                              <Tag color="blue">v{decoded.version}</Tag>
                            </div>
                            <div className="decodeRow">
                              <span className="decodeKey">Variant</span>
                              <Tag color="purple">{decoded.variant}</Tag>
                            </div>
                            <div className="decodeRow">
                              <span className="decodeKey">Normalized</span>
                              <code className="decodeMono">{decoded.trimmed.toLowerCase()}</code>
                            </div>
                          </Space>
                        ) : (
                          <Tag icon={<CloseCircleFilled />} color="error">
                            Not a valid UUID
                          </Tag>
                        )}
                      </div>
                    </div>
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
                        <BookOutlined />
                        <div>
                          <strong>What is a UUID?</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            A 128-bit identifier displayed as 32 hex characters in 5 groups
                            (8-4-4-4-12). The likelihood of a collision is astronomically low.
                          </Paragraph>
                        </div>
                      </div>
                      <div className="guideItem">
                        <AppstoreOutlined />
                        <div>
                          <strong>Common uses</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            Database primary keys, distributed system IDs, session/request tracing,
                            idempotency tokens, file names.
                          </Paragraph>
                        </div>
                      </div>
                      <div className="guideItem">
                        <FunctionOutlined />
                        <div>
                          <strong>Pick a version</strong>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            <strong>v4</strong> — random, the safe default. <strong>v1</strong> —
                            sortable by time but leaks MAC. <strong>NIL</strong> — placeholder
                            zero-UUID.
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

export default UUIDPage;
