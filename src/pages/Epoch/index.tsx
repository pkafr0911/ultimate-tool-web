import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Divider,
  InputNumber,
  Row,
  Select,
  Table,
  Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useEffect, useState } from 'react';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const EpochPage: React.FC = () => {
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [epochInput, setEpochInput] = useState<number | undefined>(undefined);
  const [convertedDate, setConvertedDate] = useState<{
    gmt: string;
    local: string;
    relative: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [tz, setTz] = useState<string>('UTC');
  const [convertedEpoch, setConvertedEpoch] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setCurrentEpoch(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleEpochToDate = () => {
    if (!epochInput) return;
    const date = dayjs.unix(epochInput);
    const gmt = date.utc().format('dddd, MMMM D, YYYY HH:mm:ss') + ' GMT';
    const local = date.tz(dayjs.tz.guess()).format('dddd, MMMM D, YYYY HH:mm:ss [GMT]Z');
    const relative = date.fromNow();
    setConvertedDate({ gmt, local, relative });
  };

  const handleDateToEpoch = () => {
    const epoch = selectedDate.tz(tz).unix();
    setConvertedEpoch(epoch);
  };

  const timeUnits = [
    { key: '1', label: '1 hour', seconds: '3600' },
    { key: '2', label: '1 day', seconds: '86400' },
    { key: '3', label: '1 week', seconds: '604800' },
    { key: '4', label: '1 month (30.44 days)', seconds: '2629743' },
    { key: '5', label: '1 year (365.24 days)', seconds: '31556926' },
  ];

  return (
    <PageContainer>
      <Card title="Epoch & Unix Timestamp Conversion Tools">
        <Paragraph>
          The current Unix epoch time is{' '}
          <Text code style={{ fontSize: 16 }}>
            {currentEpoch}
          </Text>
        </Paragraph>

        <Divider />

        <Title level={5}>Convert epoch to human-readable date</Title>
        <Row gutter={[8, 8]} align="middle">
          <Col>
            <InputNumber
              style={{ minWidth: 420 }}
              value={epochInput}
              onChange={(v) => setEpochInput(Number(v))}
              placeholder="Enter epoch"
            />
          </Col>
          <Col>
            <Button type="primary" onClick={handleEpochToDate}>
              Timestamp → Human date
            </Button>
          </Col>
        </Row>

        {convertedDate && (
          <Card
            type="inner"
            style={{ marginTop: 10, background: '#fafafa' }}
            title={
              <Text strong>
                Result for <Text code>{epochInput}</Text>
              </Text>
            }
          >
            <Paragraph>
              <Text strong>Assuming this timestamp is in seconds:</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>GMT:</Text> {convertedDate.gmt}
            </Paragraph>
            <Paragraph>
              <Text strong>Your time zone:</Text> {convertedDate.local}
            </Paragraph>
            <Paragraph>
              <Text strong>Relative:</Text> {convertedDate.relative}
            </Paragraph>
          </Card>
        )}

        <Divider />

        <Title level={5}>Convert human date to epoch</Title>
        <Row gutter={[8, 8]} align="middle">
          <Col>
            <DatePicker
              showTime
              value={selectedDate}
              onChange={(v) => v && setSelectedDate(v)}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Col>
          <Col>
            <Select
              value={tz}
              onChange={setTz}
              options={[
                { label: 'UTC', value: 'UTC' },
                { label: 'Asia/Ho_Chi_Minh', value: 'Asia/Ho_Chi_Minh' },
                { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
                { label: 'America/New_York', value: 'America/New_York' },
                { label: 'Europe/London', value: 'Europe/London' },
              ]}
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={handleDateToEpoch}>
              Human date → Timestamp
            </Button>
          </Col>
        </Row>

        {convertedEpoch !== null && (
          <Paragraph style={{ marginTop: 10 }}>
            <Text strong>Result: </Text>
            <Text code>{convertedEpoch}</Text>
          </Paragraph>
        )}
      </Card>

      <Divider />

      <Card title="What is Epoch Time?">
        <Paragraph>
          The Unix epoch (or Unix time or POSIX time or Unix timestamp) is the number of seconds
          that have elapsed since <Text strong>January 1, 1970 (midnight UTC/GMT)</Text>, not
          counting leap seconds (ISO 8601: <Text code>1970-01-01T00:00:00Z</Text>). The epoch is
          Unix time 0 (midnight 1/1/1970), but the term is often used as a synonym for Unix time.
        </Paragraph>
        <Paragraph>
          Some systems store epoch dates as signed 32-bit integers, which might cause problems on{' '}
          <Text strong>January 19, 2038</Text> (the Y2038 problem). This converter supports
          timestamps in seconds (10-digit), milliseconds (13-digit), and microseconds (16-digit).
        </Paragraph>

        <Divider />

        <Title level={5}>Human-readable time conversions</Title>
        <Table
          size="small"
          bordered
          pagination={false}
          columns={[
            { title: 'Human-readable time', dataIndex: 'label', key: 'label' },
            { title: 'Seconds', dataIndex: 'seconds', key: 'seconds' },
          ]}
          dataSource={timeUnits}
        />

        <Divider />

        <Collapse>
          <Panel header="Show language examples" key="1">
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {`PHP        time()
Python     import time; time.time()
Ruby       Time.now.to_i
Java       System.currentTimeMillis()/1000
C#         DateTimeOffset.Now.ToUnixTimeSeconds()
JavaScript Math.floor(new Date().getTime()/1000)
MySQL      SELECT unix_timestamp(now());
Go         time.Now().Unix()
PostgreSQL SELECT extract(epoch FROM now());
Unix Shell date +%s`}
              </pre>
            </Paragraph>
          </Panel>
        </Collapse>
      </Card>
    </PageContainer>
  );
};

export default EpochPage;
