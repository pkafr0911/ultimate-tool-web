import {
  ClockCircleOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import React from 'react';
import type { TestStats } from '../types';
import { formatBytes, formatDuration, getDistribution, getStatusColor } from '../types';

const { Text } = Typography;

interface Props {
  stats: TestStats;
}

const ResultsSummary: React.FC<Props> = ({ stats }) => {
  const distribution = getDistribution(stats.responseTimes, stats.totalRequests);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Response Time Statistics" size="small">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="Min"
                  value={stats.minResponseTime}
                  precision={1}
                  suffix="ms"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Max"
                  value={stats.maxResponseTime}
                  precision={1}
                  suffix="ms"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Average"
                  value={stats.avgResponseTime}
                  precision={1}
                  suffix="ms"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Std Deviation"
                  value={stats.stdDevResponseTime}
                  precision={1}
                  suffix="ms"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Median (P50)"
                  value={stats.p50ResponseTime}
                  precision={1}
                  suffix="ms"
                />
              </Col>
              <Col span={12}>
                <Statistic title="P90" value={stats.p90ResponseTime} precision={1} suffix="ms" />
              </Col>
              <Col span={12}>
                <Statistic title="P95" value={stats.p95ResponseTime} precision={1} suffix="ms" />
              </Col>
              <Col span={12}>
                <Statistic title="P99" value={stats.p99ResponseTime} precision={1} suffix="ms" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Throughput & Data" size="small">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="Throughput"
                  value={stats.throughput}
                  precision={2}
                  suffix="req/s"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Duration"
                  value={(stats.endTime - stats.startTime) / 1000}
                  precision={2}
                  suffix="s"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic title="Received" value={formatBytes(stats.totalDataReceived)} />
              </Col>
              <Col span={12}>
                <Statistic title="Sent" value={formatBytes(stats.totalDataSent)} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Received KB/s"
                  value={stats.receivedKBPerSec}
                  precision={2}
                  suffix="KB/s"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Error Rate"
                  value={
                    stats.totalRequests > 0
                      ? ((stats.errorCount / stats.totalRequests) * 100).toFixed(1)
                      : 0
                  }
                  suffix="%"
                  valueStyle={{ color: stats.errorCount > 0 ? '#ff4d4f' : '#52c41a' }}
                  prefix={stats.errorCount > 0 ? <WarningOutlined /> : undefined}
                />
              </Col>
              {stats.assertionFailures > 0 && (
                <Col span={24}>
                  <Statistic
                    title="Assertion Failures"
                    value={stats.assertionFailures}
                    valueStyle={{ color: '#fa8c16' }}
                    prefix={<WarningOutlined />}
                  />
                </Col>
              )}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Status codes */}
      <Card title="Status Code Distribution" size="small" style={{ marginTop: 16 }}>
        <Space wrap>
          {Object.entries(stats.statusCodes)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([code, count]) => (
              <Tag
                key={code}
                color={getStatusColor(Number(code))}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {code === '0' ? 'Network Error' : code}: {count} (
                {((count / stats.totalRequests) * 100).toFixed(1)}%)
              </Tag>
            ))}
        </Space>
      </Card>

      {/* Error messages */}
      {Object.keys(stats.errorMessages).length > 0 && (
        <Card title="Error Messages" size="small" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.entries(stats.errorMessages)
              .sort(([, a], [, b]) => b - a)
              .map(([msg, count]) => (
                <div key={msg}>
                  <Tag color="error">{count}x</Tag>
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {msg}
                  </Text>
                </div>
              ))}
          </Space>
        </Card>
      )}

      {/* Response time distribution */}
      <Card title="Response Time Distribution" size="small" style={{ marginTop: 16 }}>
        {distribution.map((bucket) => (
          <div key={bucket.label} style={{ marginBottom: 8 }}>
            <Row align="middle" gutter={8}>
              <Col span={4}>
                <Text style={{ fontSize: 12 }}>{bucket.label}</Text>
              </Col>
              <Col span={16}>
                <Progress
                  percent={stats.totalRequests > 0 ? (bucket.count / stats.totalRequests) * 100 : 0}
                  showInfo={false}
                  strokeColor={bucket.color}
                  size="small"
                />
              </Col>
              <Col span={4}>
                <Text style={{ fontSize: 12 }}>
                  {bucket.count} (
                  {stats.totalRequests > 0
                    ? ((bucket.count / stats.totalRequests) * 100).toFixed(1)
                    : 0}
                  %)
                </Text>
              </Col>
            </Row>
          </div>
        ))}
      </Card>

      {/* Throughput over time */}
      {stats.throughputOverTime.length > 0 && (
        <Card title="Throughput Over Time (req/s)" size="small" style={{ marginTop: 16 }}>
          <div className="timeSeriesChart">
            {stats.throughputOverTime.map((point, idx) => (
              <div
                key={idx}
                className="timeSeriesBar"
                style={{
                  height: `${Math.max(4, (point.count / Math.max(...stats.throughputOverTime.map((p) => p.count))) * 80)}px`,
                  width: `${Math.max(2, 100 / stats.throughputOverTime.length - 1)}%`,
                }}
                title={`${point.time}s: ${point.count} req/s`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 10 }}>
              0s
            </Text>
            <Text type="secondary" style={{ fontSize: 10 }}>
              {((stats.endTime - stats.startTime) / 1000).toFixed(0)}s
            </Text>
          </div>
        </Card>
      )}
    </>
  );
};

export default ResultsSummary;
