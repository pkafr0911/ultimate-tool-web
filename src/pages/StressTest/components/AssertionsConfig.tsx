import { CheckCircleOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Row, Select, Space, Typography } from 'antd';
import React from 'react';
import type { Assertion, TestConfig } from '../types';
import { generateId } from '../types';

const { Text } = Typography;
const { Option } = Select;

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  disabled?: boolean;
}

const ASSERTION_TYPES = [
  { value: 'response-code', label: 'Response Code' },
  { value: 'response-body', label: 'Response Body' },
  { value: 'response-time', label: 'Response Time (ms)' },
  { value: 'response-header', label: 'Response Header' },
  { value: 'json-path', label: 'JSON Path' },
  { value: 'size', label: 'Response Size (bytes)' },
];

const CONDITION_MAP: Record<string, { value: string; label: string }[]> = {
  'response-code': [
    { value: 'equals', label: 'Equals' },
    { value: 'not-contains', label: 'Not Equals' },
  ],
  'response-body': [
    { value: 'contains', label: 'Contains' },
    { value: 'not-contains', label: 'Not Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'matches', label: 'Matches Regex' },
  ],
  'response-time': [
    { value: 'less-than', label: 'Less Than' },
    { value: 'greater-than', label: 'Greater Than' },
  ],
  'response-header': [
    { value: 'contains', label: 'Contains' },
    { value: 'not-contains', label: 'Not Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'matches', label: 'Matches Regex' },
  ],
  'json-path': [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not-contains', label: 'Not Contains' },
    { value: 'matches', label: 'Matches Regex' },
  ],
  size: [
    { value: 'less-than', label: 'Less Than' },
    { value: 'greater-than', label: 'Greater Than' },
    { value: 'equals', label: 'Equals' },
  ],
};

const AssertionsConfig: React.FC<Props> = ({ config, onChange, disabled }) => {
  const addAssertion = () => {
    const a: Assertion = {
      id: generateId(),
      enabled: true,
      type: 'response-code',
      condition: 'equals',
      target: '200',
      name: `Assertion ${config.assertions.length + 1}`,
    };
    onChange({ assertions: [...config.assertions, a] });
  };

  const removeAssertion = (id: string) => {
    onChange({ assertions: config.assertions.filter((a) => a.id !== id) });
  };

  const updateAssertion = (id: string, patch: Partial<Assertion>) => {
    onChange({
      assertions: config.assertions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <CheckCircleOutlined style={{ color: '#52c41a' }} />
        <Text strong>Response Assertions</Text>
        <Text type="secondary">(like JMeter Assertions)</Text>
      </Space>

      {config.assertions.map((a, idx) => (
        <div
          key={a.id}
          style={{
            padding: 12,
            marginBottom: 8,
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            opacity: a.enabled ? 1 : 0.5,
          }}
        >
          <Row gutter={8} align="middle">
            <Col flex="none">
              <Checkbox
                checked={a.enabled}
                onChange={(e) => updateAssertion(a.id, { enabled: e.target.checked })}
                disabled={disabled}
              />
            </Col>
            <Col flex="auto">
              <Input
                value={a.name}
                onChange={(e) => updateAssertion(a.id, { name: e.target.value })}
                placeholder="Assertion name"
                size="small"
                style={{ fontWeight: 600 }}
                disabled={disabled}
              />
            </Col>
            <Col flex="none">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAssertion(a.id)}
                disabled={disabled}
                size="small"
              />
            </Col>
          </Row>
          <Row gutter={8} style={{ marginTop: 8 }}>
            <Col xs={8} sm={6}>
              <Form.Item label="Type" style={{ marginBottom: 0 }}>
                <Select
                  value={a.type}
                  onChange={(v) =>
                    updateAssertion(a.id, {
                      type: v as Assertion['type'],
                      condition: CONDITION_MAP[v]?.[0]?.value as Assertion['condition'],
                    })
                  }
                  size="small"
                  disabled={disabled}
                  style={{ width: '100%' }}
                >
                  {ASSERTION_TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>
                      {t.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={8} sm={6}>
              <Form.Item label="Condition" style={{ marginBottom: 0 }}>
                <Select
                  value={a.condition}
                  onChange={(v) =>
                    updateAssertion(a.id, { condition: v as Assertion['condition'] })
                  }
                  size="small"
                  disabled={disabled}
                  style={{ width: '100%' }}
                >
                  {(CONDITION_MAP[a.type] || []).map((c) => (
                    <Option key={c.value} value={c.value}>
                      {c.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={8} sm={12}>
              <Form.Item
                label={a.type === 'json-path' ? 'JSON Path → Expected' : 'Expected Value'}
                style={{ marginBottom: 0 }}
              >
                <Input
                  value={a.target}
                  onChange={(e) => updateAssertion(a.id, { target: e.target.value })}
                  size="small"
                  placeholder={
                    a.type === 'response-code'
                      ? '200'
                      : a.type === 'response-time'
                        ? '1000'
                        : a.type === 'json-path'
                          ? '$.data.id=123'
                          : 'expected'
                  }
                  disabled={disabled}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addAssertion}
        disabled={disabled}
        block
      >
        Add Assertion
      </Button>
    </div>
  );
};

export default AssertionsConfig;
