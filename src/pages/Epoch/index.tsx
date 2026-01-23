import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  CopyOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RetweetOutlined,
  SwapRightOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import React, { useEffect, useState } from 'react';
import './styles.less';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const EpochPage: React.FC = () => {
  // --- Live Clock State ---
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [isPaused, setIsPaused] = useState(false);

  // --- Converter State ---
  const [epochInput, setEpochInput] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<any>(null);

  // --- Date to Epoch State ---
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [tz, setTz] = useState<string>(dayjs.tz.guess());
  const [generatedEpoch, setGeneratedEpoch] = useState<{ seconds: number; millis: number } | null>(
    null,
  );

  // --- Date Diff State ---
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [diffResult, setDiffResult] = useState<string>('');

  // --- Live Clock Effect ---
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setCurrentEpoch(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  // --- Handlers ---

  const handleEpochToDate = () => {
    if (!epochInput) return;

    let timestamp = Number(epochInput);
    if (isNaN(timestamp)) {
      message.error('Invalid timestamp');
      return;
    }

    // Auto-detect unit
    let unit = 'seconds';
    let dateObj = dayjs.unix(timestamp);

    // If > 30000000000, assume milliseconds (valid for dates after 1973)
    if (timestamp > 30000000000) {
      unit = 'milliseconds';
      dateObj = dayjs(timestamp);
    }
    // If > 30000000000000, assume microseconds
    if (timestamp > 30000000000000) {
      unit = 'microseconds';
      dateObj = dayjs(timestamp / 1000);
    }

    setConversionResult({
      unit,
      gmt: dateObj.utc().format('YYYY-MM-DD HH:mm:ss [GMT]'),
      local: dateObj.format('YYYY-MM-DD HH:mm:ss Z'),
      iso: dateObj.toISOString(),
      relative: dateObj.fromNow(),
    });
  };

  const handleDateToEpoch = () => {
    if (!selectedDate) return;
    const date = selectedDate.tz(tz); // Apply selected timezone
    setGeneratedEpoch({
      seconds: date.unix(),
      millis: date.valueOf(),
    });
  };

  const handleCalculateDiff = () => {
    if (!startDate || !endDate) return;
    const diff = dayjs.duration(endDate.diff(startDate));
    const parts: string[] = [];
    if (diff.years()) parts.push(`${diff.years()} years`);
    if (diff.months()) parts.push(`${diff.months()} months`);
    if (diff.days()) parts.push(`${diff.days()} days`);
    if (diff.hours()) parts.push(`${diff.hours()} hours`);
    if (diff.minutes()) parts.push(`${diff.minutes()} minutes`);
    if (diff.seconds()) parts.push(`${diff.seconds()} seconds`);

    setDiffResult(parts.join(', ') || '0 seconds');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied!');
  };

  // --- Render Helpers ---

  const renderConverterTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card title="Timestamp to Date" bordered={false} className="inner-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Enter timestamp (sec, ms, or μs)"
              value={epochInput}
              onChange={(e) => setEpochInput(e.target.value)}
              onPressEnter={handleEpochToDate}
            />
            <Button type="primary" block onClick={handleEpochToDate}>
              Convert
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Supports auto-detection for seconds, milliseconds, and microseconds.
            </Text>

            {conversionResult && (
              <div className="result-table">
                <Tag color="blue" style={{ marginBottom: 12 }}>
                  Detected: {conversionResult.unit}
                </Tag>
                <Row gutter={[16, 12]}>
                  <Col span={8} className="label-col">
                    GMT / UTC
                  </Col>
                  <Col span={16} className="value-col">
                    {conversionResult.gmt}
                  </Col>

                  <Col span={8} className="label-col">
                    Your Time Zone
                  </Col>
                  <Col span={16} className="value-col">
                    {conversionResult.local}
                  </Col>

                  <Col span={8} className="label-col">
                    ISO 8601
                  </Col>
                  <Col span={16} className="value-col">
                    {conversionResult.iso}
                  </Col>

                  <Col span={8} className="label-col">
                    Relative
                  </Col>
                  <Col span={16} className="value-col">
                    {conversionResult.relative}
                  </Col>
                </Row>
              </div>
            )}
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="Date to Timestamp" bordered={false} className="inner-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={selectedDate}
              onChange={(v) => v && setSelectedDate(v)}
              format="YYYY-MM-DD HH:mm:ss"
            />
            <Select
              showSearch
              value={tz}
              onChange={setTz}
              style={{ width: '100%' }}
              options={[
                { label: 'UTC', value: 'UTC' },
                { label: 'Local (Browser)', value: dayjs.tz.guess() },
                { label: 'Asia/Ho_Chi_Minh', value: 'Asia/Ho_Chi_Minh' },
                { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                { label: 'America/New_York', value: 'America/New_York' },
                { label: 'Europe/London', value: 'Europe/London' },
              ]}
            />
            <Button type="primary" block onClick={handleDateToEpoch}>
              Convert
            </Button>

            {generatedEpoch && (
              <div className="result-table">
                <Row gutter={[16, 12]} align="middle">
                  <Col span={8} className="label-col">
                    Seconds
                  </Col>
                  <Col span={16} className="value-col">
                    <Space>
                      {generatedEpoch.seconds}
                      <CopyOutlined
                        onClick={() => copyToClipboard(String(generatedEpoch.seconds))}
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                      />
                    </Space>
                  </Col>

                  <Col span={8} className="label-col">
                    Milliseconds
                  </Col>
                  <Col span={16} className="value-col">
                    <Space>
                      {generatedEpoch.millis}
                      <CopyOutlined
                        onClick={() => copyToClipboard(String(generatedEpoch.millis))}
                        style={{ cursor: 'pointer', color: '#1890ff' }}
                      />
                    </Space>
                  </Col>
                </Row>
              </div>
            )}
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const renderDiffTab = () => (
    <Card bordered={false}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16} align="middle">
          <Col span={10}>
            <Text>Start Date</Text>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={startDate}
              onChange={setStartDate}
            />
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <SwapRightOutlined style={{ fontSize: 24, color: '#999' }} />
          </Col>
          <Col span={10}>
            <Text>End Date</Text>
            <DatePicker showTime style={{ width: '100%' }} value={endDate} onChange={setEndDate} />
          </Col>
        </Row>
        <Button type="primary" onClick={handleCalculateDiff}>
          Calculate Difference
        </Button>
        {diffResult && (
          <div className="result-table" style={{ textAlign: 'center', fontSize: 18 }}>
            <Text strong>{diffResult}</Text>
          </div>
        )}
      </Space>
    </Card>
  );

  const renderInfoTab = () => (
    <div className="info-section">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="What is Epoch Time?" size="small">
            <Paragraph>
              The Unix epoch (or Unix time or POSIX time or Unix timestamp) is the number of seconds
              that have elapsed since <Text strong>January 1, 1970 (midnight UTC/GMT)</Text>, not
              counting leap seconds (ISO 8601: <Text code>1970-01-01T00:00:00Z</Text>).
            </Paragraph>
            <Paragraph>
              The Y2038 problem refers to the time when signed 32-bit integers will overflow on{' '}
              <Text strong>January 19, 2038</Text>.
            </Paragraph>
          </Card>
          <Card title="Common Time Units" size="small" style={{ marginTop: 16 }}>
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: 'Unit', dataIndex: 'label', key: 'label' },
                { title: 'Seconds', dataIndex: 'seconds', key: 'seconds' },
              ]}
              dataSource={[
                { key: '1', label: '1 hour', seconds: '3,600' },
                { key: '2', label: '1 day', seconds: '86,400' },
                { key: '3', label: '1 week', seconds: '604,800' },
                { key: '4', label: '1 month (avg)', seconds: '2,629,743' },
                { key: '5', label: '1 year (avg)', seconds: '31,556,926' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Code Snippets" size="small">
            <div className="code-block">
              {`PHP        time()
Python     import time; time.time()
Ruby       Time.now.to_i
Java       System.currentTimeMillis() / 1000
C#         DateTimeOffset.Now.ToUnixTimeSeconds()
JS         Math.floor(Date.now() / 1000)
Go         time.Now().Unix()
SQL        SELECT unix_timestamp(now())
Swift      NSDate().timeIntervalSince1970`}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <PageContainer className="epoch-container">
      {/* --- Hero Clock --- */}
      <Card className="live-clock-card" bordered={false}>
        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Current Unix Epoch</Text>
        <div className="current-epoch">{currentEpoch}</div>
        <Space className="clock-controls">
          <Button
            icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(String(currentEpoch))}>
            Copy
          </Button>
          <Button
            icon={<RetweetOutlined />}
            onClick={() => setCurrentEpoch(Math.floor(Date.now() / 1000))}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* --- Main Tools --- */}
      <Card className="converter-card" bordered={false}>
        <Tabs
          defaultActiveKey="converter"
          items={[
            {
              key: 'converter',
              label: (
                <span>
                  <ClockCircleOutlined /> Converter
                </span>
              ),
              children: renderConverterTab(),
            },
            {
              key: 'diff',
              label: (
                <span>
                  <SwapRightOutlined /> Date Difference
                </span>
              ),
              children: renderDiffTab(),
            },
            {
              key: 'info',
              label: (
                <span>
                  <CopyOutlined /> Cheatsheet & Info
                </span>
              ),
              children: renderInfoTab(),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default EpochPage;
