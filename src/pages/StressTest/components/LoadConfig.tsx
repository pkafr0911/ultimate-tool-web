import { DashboardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Col,
  Divider,
  Form,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import React from 'react';
import type { ScheduleMode, TestConfig, TimerConfig } from '../types';

const { Text } = Typography;
const { Option } = Select;

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  disabled?: boolean;
}

const LoadConfig: React.FC<Props> = ({ config, onChange, disabled }) => {
  const updateTimer = (patch: Partial<TimerConfig>) => {
    onChange({ timer: { ...config.timer, ...patch } });
  };

  return (
    <Form layout="vertical">
      {/* Schedule Mode */}
      <Form.Item label="Schedule Mode">
        <Radio.Group
          value={config.scheduleMode}
          onChange={(e) => onChange({ scheduleMode: e.target.value as ScheduleMode })}
          disabled={disabled}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="simple">Simple (N requests)</Radio.Button>
          <Radio.Button value="duration">Duration-based</Radio.Button>
          <Radio.Button value="stepping">Stepping Threads</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Form.Item
            label={
              <Space>
                <span>Threads (Users)</span>
                <Tooltip title="Number of concurrent virtual users / threads">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <InputNumber
              min={1}
              max={500}
              value={config.concurrency}
              onChange={(v) => onChange({ concurrency: v || 10 })}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        {config.scheduleMode === 'simple' && (
          <Col xs={12} sm={6}>
            <Form.Item
              label={
                <Space>
                  <span>Total Requests</span>
                  <Tooltip title="Total number of HTTP samples to execute">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <InputNumber
                min={1}
                max={100000}
                value={config.totalRequests}
                onChange={(v) => onChange({ totalRequests: v || 100 })}
                style={{ width: '100%' }}
                disabled={disabled}
              />
            </Form.Item>
          </Col>
        )}

        {config.scheduleMode === 'duration' && (
          <Col xs={12} sm={6}>
            <Form.Item
              label={
                <Space>
                  <span>Duration (s)</span>
                  <Tooltip title="Test will run for this many seconds, regardless of iterations">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <InputNumber
                min={1}
                max={3600}
                value={config.duration}
                onChange={(v) => onChange({ duration: v || 60 })}
                style={{ width: '100%' }}
                disabled={disabled}
              />
            </Form.Item>
          </Col>
        )}

        {config.scheduleMode === 'stepping' && (
          <>
            <Col xs={12} sm={6}>
              <Form.Item label="Total Requests">
                <InputNumber
                  min={1}
                  max={100000}
                  value={config.totalRequests}
                  onChange={(v) => onChange({ totalRequests: v || 100 })}
                  style={{ width: '100%' }}
                  disabled={disabled}
                />
              </Form.Item>
            </Col>
          </>
        )}

        <Col xs={12} sm={6}>
          <Form.Item
            label={
              <Space>
                <span>Ramp-Up (s)</span>
                <Tooltip title="Time to start all threads. E.g., 10 threads + 10s ramp-up = 1 thread/sec">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <InputNumber
              min={0}
              max={600}
              value={config.rampUpTime}
              onChange={(v) => onChange({ rampUpTime: v || 0 })}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={12} sm={6}>
          <Form.Item
            label={
              <Space>
                <span>Startup Delay (s)</span>
                <Tooltip title="Delay before test starts (like JMeter scheduler)">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <InputNumber
              min={0}
              max={300}
              value={config.startupDelay}
              onChange={(v) => onChange({ startupDelay: v || 0 })}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Form.Item label="Request Timeout (ms)" tooltip="Max time to wait for a response">
            <InputNumber
              min={1000}
              max={120000}
              step={1000}
              value={config.timeout}
              onChange={(v) => onChange({ timeout: v || 30000 })}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item label="Connect Timeout (ms)" tooltip="Max time to establish a connection">
            <InputNumber
              min={500}
              max={60000}
              step={500}
              value={config.connectTimeout}
              onChange={(v) => onChange({ connectTimeout: v || 5000 })}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Timer (Think Time) */}
      <Divider orientation="left" plain>
        <Space>
          <DashboardOutlined />
          Timer / Think Time
        </Space>
      </Divider>

      <Row gutter={16} align="middle">
        <Col xs={6} sm={3}>
          <Form.Item>
            <Switch
              checked={config.timer.enabled}
              onChange={(v) => updateTimer({ enabled: v })}
              disabled={disabled}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Form.Item>
        </Col>
        <Col xs={18} sm={6}>
          <Form.Item label="Type">
            <Select
              value={config.timer.type}
              onChange={(v) => updateTimer({ type: v })}
              disabled={disabled || !config.timer.enabled}
              style={{ width: '100%' }}
            >
              <Option value="none">No Timer</Option>
              <Option value="constant">Constant Timer</Option>
              <Option value="uniform-random">Uniform Random</Option>
              <Option value="gaussian-random">Gaussian Random</Option>
              <Option value="poisson">Poisson Random</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item label={config.timer.type === 'constant' ? 'Delay (ms)' : 'Mean Delay (ms)'}>
            <InputNumber
              min={0}
              max={60000}
              step={100}
              value={config.timer.delay}
              onChange={(v) => updateTimer({ delay: v || 0 })}
              style={{ width: '100%' }}
              disabled={disabled || !config.timer.enabled}
            />
          </Form.Item>
        </Col>
        {config.timer.type !== 'constant' && config.timer.type !== 'none' && (
          <Col xs={12} sm={6}>
            <Form.Item label="Deviation / Range (ms)">
              <InputNumber
                min={0}
                max={30000}
                step={100}
                value={config.timer.range}
                onChange={(v) => updateTimer({ range: v || 0 })}
                style={{ width: '100%' }}
                disabled={disabled || !config.timer.enabled}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {config.timer.enabled && config.timer.type !== 'none' && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {config.timer.type === 'constant' &&
            `Each thread will wait ${config.timer.delay}ms between requests.`}
          {config.timer.type === 'uniform-random' &&
            `Random delay between ${Math.max(0, config.timer.delay - config.timer.range)}ms and ${config.timer.delay + config.timer.range}ms.`}
          {config.timer.type === 'gaussian-random' &&
            `Gaussian delay with mean ${config.timer.delay}ms and std dev ${config.timer.range}ms.`}
          {config.timer.type === 'poisson' &&
            `Poisson-distributed delay with lambda ${config.timer.delay}ms.`}
        </Text>
      )}
    </Form>
  );
};

export default LoadConfig;
