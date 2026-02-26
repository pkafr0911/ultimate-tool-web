import { AimOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Form, Input, Row, Select, Tabs } from 'antd';
import React from 'react';
import type { TestConfig } from '../types';
import { CONTENT_TYPES, generateId, HTTP_METHODS } from '../types';

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  disabled?: boolean;
}

const RequestConfig: React.FC<Props> = ({ config, onChange, disabled }) => {
  const addHeader = () => {
    onChange({
      headers: [...config.headers, { key: '', value: '', id: generateId(), enabled: true }],
    });
  };

  const removeHeader = (id: string) => {
    onChange({ headers: config.headers.filter((h) => h.id !== id) });
  };

  const updateHeader = (id: string, field: string, val: any) => {
    onChange({
      headers: config.headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)),
    });
  };

  const addCookie = () => {
    onChange({
      cookies: [
        ...config.cookies,
        { name: '', value: '', domain: '', path: '/', id: generateId(), enabled: true },
      ],
    });
  };

  const removeCookie = (id: string) => {
    onChange({ cookies: config.cookies.filter((c) => c.id !== id) });
  };

  const updateCookie = (id: string, field: string, val: any) => {
    onChange({
      cookies: config.cookies.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    });
  };

  const bodyPlaceholder: Record<string, string> = {
    json: '{\n  "key": "value"\n}',
    form: 'username=admin&password=secret',
    xml: '<root>\n  <element>value</element>\n</root>',
    text: 'Plain text body...',
    graphql: '{\n  "query": "{ users { id name } }",\n  "variables": {}\n}',
    none: '',
  };

  return (
    <Form layout="vertical">
      {/* Method + URL */}
      <Row gutter={12}>
        <Col xs={24} sm={5} md={4}>
          <Form.Item label="Method">
            <Select
              value={config.method}
              onChange={(v) => onChange({ method: v })}
              disabled={disabled}
            >
              {HTTP_METHODS.map((m) => (
                <Option key={m} value={m}>
                  {m}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={19} md={20}>
          <Form.Item label="URL" tooltip="Supports ${variable} placeholders from CSV Data Set">
            <Input
              placeholder="https://api.example.com/endpoint/${id}"
              value={config.url}
              onChange={(e) => onChange({ url: e.target.value })}
              prefix={<AimOutlined />}
              size="large"
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Connection settings */}
      <Row gutter={12}>
        <Col xs={12} sm={6}>
          <Form.Item>
            <Checkbox
              checked={config.followRedirects}
              onChange={(e) => onChange({ followRedirects: e.target.checked })}
              disabled={disabled}
            >
              Follow Redirects
            </Checkbox>
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item>
            <Checkbox
              checked={config.keepAlive}
              onChange={(e) => onChange({ keepAlive: e.target.checked })}
              disabled={disabled}
            >
              Keep-Alive
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>

      {/* Tabs: Headers / Cookies / Body / Auth */}
      <Tabs
        size="small"
        items={[
          {
            key: 'headers',
            label: `Headers (${config.headers.length})`,
            children: (
              <>
                {config.headers.map((h) => (
                  <div key={h.id} className="headersRow">
                    <div className="headerItem">
                      <Checkbox
                        checked={h.enabled}
                        onChange={(e) => updateHeader(h.id, 'enabled', e.target.checked)}
                        disabled={disabled}
                      />
                      <Input
                        placeholder="Header name"
                        value={h.key}
                        onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                        className="headerInput"
                        disabled={disabled || !h.enabled}
                      />
                      <Input
                        placeholder="Value"
                        value={h.value}
                        onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                        className="headerInput"
                        disabled={disabled || !h.enabled}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeHeader(h.id)}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addHeader}
                  disabled={disabled}
                  style={{ marginTop: 8 }}
                >
                  Add Header
                </Button>
              </>
            ),
          },
          {
            key: 'cookies',
            label: `Cookies (${config.cookies.length})`,
            children: (
              <>
                {config.cookies.map((c) => (
                  <div key={c.id} className="headersRow">
                    <div className="headerItem">
                      <Checkbox
                        checked={c.enabled}
                        onChange={(e) => updateCookie(c.id, 'enabled', e.target.checked)}
                        disabled={disabled}
                      />
                      <Input
                        placeholder="Name"
                        value={c.name}
                        onChange={(e) => updateCookie(c.id, 'name', e.target.value)}
                        className="headerInput"
                        disabled={disabled || !c.enabled}
                        style={{ maxWidth: 150 }}
                      />
                      <Input
                        placeholder="Value"
                        value={c.value}
                        onChange={(e) => updateCookie(c.id, 'value', e.target.value)}
                        className="headerInput"
                        disabled={disabled || !c.enabled}
                      />
                      <Input
                        placeholder="Domain"
                        value={c.domain}
                        onChange={(e) => updateCookie(c.id, 'domain', e.target.value)}
                        className="headerInput"
                        disabled={disabled || !c.enabled}
                        style={{ maxWidth: 150 }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeCookie(c.id)}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addCookie}
                  disabled={disabled}
                  style={{ marginTop: 8 }}
                >
                  Add Cookie
                </Button>
              </>
            ),
          },
          {
            key: 'body',
            label: 'Body',
            children: (
              <>
                <Form.Item label="Content Type" style={{ marginBottom: 8 }}>
                  <Select
                    value={config.contentType}
                    onChange={(v) => {
                      const patch: Partial<TestConfig> = { contentType: v };
                      // Auto-set Content-Type header
                      if (v !== 'none' && CONTENT_TYPES[v]) {
                        const headers = config.headers.map((h) =>
                          h.key.toLowerCase() === 'content-type'
                            ? { ...h, value: CONTENT_TYPES[v] }
                            : h,
                        );
                        patch.headers = headers;
                      }
                      onChange(patch);
                    }}
                    disabled={disabled}
                    style={{ width: 220 }}
                  >
                    <Option value="none">None</Option>
                    <Option value="json">JSON</Option>
                    <Option value="form">Form URL-Encoded</Option>
                    <Option value="xml">XML</Option>
                    <Option value="text">Plain Text</Option>
                    <Option value="graphql">GraphQL</Option>
                  </Select>
                </Form.Item>
                {config.contentType !== 'none' && (
                  <TextArea
                    rows={8}
                    placeholder={bodyPlaceholder[config.contentType]}
                    value={config.body}
                    onChange={(e) => onChange({ body: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                    disabled={disabled}
                  />
                )}
              </>
            ),
          },
        ]}
      />
    </Form>
  );
};

export default RequestConfig;
