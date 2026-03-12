import { DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Row, Space, Typography } from 'antd';
import React from 'react';
import type { TestConfig, UserVariable } from '../types';
import { generateId } from '../types';

const { Text } = Typography;

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  disabled?: boolean;
}

const UserVariablesConfig: React.FC<Props> = ({ config, onChange, disabled }) => {
  const addVariable = () => {
    const v: UserVariable = {
      id: generateId(),
      name: '',
      value: '',
      enabled: true,
    };
    onChange({ userVariables: [...config.userVariables, v] });
  };

  const removeVariable = (id: string) => {
    onChange({ userVariables: config.userVariables.filter((v) => v.id !== id) });
  };

  const updateVariable = (id: string, patch: Partial<UserVariable>) => {
    onChange({
      userVariables: config.userVariables.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <SettingOutlined style={{ color: '#faad14' }} />
        <Text strong>User Defined Variables</Text>
        <Text type="secondary">(like JMeter User Defined Variables)</Text>
      </Space>

      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
        Define variables as key-value pairs. Reference them as {'${variableName}'} in URL, headers,
        body, and other fields.
      </Text>

      {config.userVariables.map((v) => (
        <Row key={v.id} gutter={8} align="middle" style={{ marginBottom: 6 }}>
          <Col flex="none">
            <Checkbox
              checked={v.enabled}
              onChange={(e) => updateVariable(v.id, { enabled: e.target.checked })}
              disabled={disabled}
            />
          </Col>
          <Col flex="auto">
            <Form.Item style={{ marginBottom: 0 }}>
              <Input
                value={v.name}
                onChange={(e) => updateVariable(v.id, { name: e.target.value })}
                placeholder="Variable name"
                size="small"
                disabled={disabled || !v.enabled}
                addonBefore="${"
                addonAfter="}"
              />
            </Form.Item>
          </Col>
          <Col flex="auto">
            <Form.Item style={{ marginBottom: 0 }}>
              <Input
                value={v.value}
                onChange={(e) => updateVariable(v.id, { value: e.target.value })}
                placeholder="Value"
                size="small"
                disabled={disabled || !v.enabled}
              />
            </Form.Item>
          </Col>
          <Col flex="none">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeVariable(v.id)}
              disabled={disabled}
              size="small"
            />
          </Col>
        </Row>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addVariable} disabled={disabled} block>
        Add Variable
      </Button>
    </div>
  );
};

export default UserVariablesConfig;
