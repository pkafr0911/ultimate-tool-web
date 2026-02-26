import { DeleteOutlined, ExportOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import React from 'react';
import type { Extractor, TestConfig } from '../types';
import { generateId } from '../types';

const { Text } = Typography;
const { Option } = Select;

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  disabled?: boolean;
}

const EXTRACTOR_TYPES = [
  { value: 'regex', label: 'Regular Expression' },
  { value: 'json-path', label: 'JSON Path' },
  { value: 'css-selector', label: 'CSS / jQuery Selector' },
  { value: 'header', label: 'Response Header' },
];

const ExtractorsConfig: React.FC<Props> = ({ config, onChange, disabled }) => {
  const addExtractor = () => {
    const ext: Extractor = {
      id: generateId(),
      enabled: true,
      type: 'json-path',
      expression: '$.data.token',
      variableName: `var_${config.extractors.length + 1}`,
      matchNo: 1,
      defaultValue: 'NOT_FOUND',
    };
    onChange({ extractors: [...config.extractors, ext] });
  };

  const removeExtractor = (id: string) => {
    onChange({ extractors: config.extractors.filter((e) => e.id !== id) });
  };

  const updateExtractor = (id: string, patch: Partial<Extractor>) => {
    onChange({
      extractors: config.extractors.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <ExportOutlined style={{ color: '#1890ff' }} />
        <Text strong>Post-Processor / Extractors</Text>
        <Text type="secondary">(like JMeter extractors)</Text>
      </Space>

      {config.extractors.map((ext) => (
        <div
          key={ext.id}
          style={{
            padding: 12,
            marginBottom: 8,
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            opacity: ext.enabled ? 1 : 0.5,
          }}
        >
          <Row gutter={8} align="middle">
            <Col flex="none">
              <Checkbox
                checked={ext.enabled}
                onChange={(e) => updateExtractor(ext.id, { enabled: e.target.checked })}
                disabled={disabled}
              />
            </Col>
            <Col xs={6} sm={4}>
              <Form.Item label="Type" style={{ marginBottom: 0 }}>
                <Select
                  value={ext.type}
                  onChange={(v) => updateExtractor(ext.id, { type: v as Extractor['type'] })}
                  size="small"
                  disabled={disabled}
                  style={{ width: '100%' }}
                >
                  {EXTRACTOR_TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>
                      {t.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col flex="auto">
              <Form.Item label="Expression" style={{ marginBottom: 0 }}>
                <Input
                  value={ext.expression}
                  onChange={(e) => updateExtractor(ext.id, { expression: e.target.value })}
                  size="small"
                  placeholder={
                    ext.type === 'json-path'
                      ? '$.data.token'
                      : ext.type === 'regex'
                        ? '"token":"(.+?)"'
                        : ext.type === 'header'
                          ? 'X-Auth-Token'
                          : 'div.result'
                  }
                  disabled={disabled}
                />
              </Form.Item>
            </Col>
            <Col xs={6} sm={4}>
              <Form.Item label="Variable Name" style={{ marginBottom: 0 }}>
                <Input
                  value={ext.variableName}
                  onChange={(e) => updateExtractor(ext.id, { variableName: e.target.value })}
                  size="small"
                  placeholder="myVar"
                  disabled={disabled}
                />
              </Form.Item>
            </Col>
            <Col xs={4} sm={3}>
              <Form.Item label="Match #" style={{ marginBottom: 0 }}>
                <InputNumber
                  value={ext.matchNo}
                  onChange={(v) => updateExtractor(ext.id, { matchNo: v ?? 1 })}
                  size="small"
                  min={-1}
                  style={{ width: '100%' }}
                  disabled={disabled}
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeExtractor(ext.id)}
                disabled={disabled}
                size="small"
                style={{ marginTop: 20 }}
              />
            </Col>
          </Row>
          <Row gutter={8} style={{ marginTop: 4 }}>
            <Col xs={12} sm={6}>
              <Form.Item label="Default Value" style={{ marginBottom: 0 }}>
                <Input
                  value={ext.defaultValue}
                  onChange={(e) => updateExtractor(ext.id, { defaultValue: e.target.value })}
                  size="small"
                  placeholder="NOT_FOUND"
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
        onClick={addExtractor}
        disabled={disabled}
        block
      >
        Add Extractor
      </Button>
    </div>
  );
};

export default ExtractorsConfig;
