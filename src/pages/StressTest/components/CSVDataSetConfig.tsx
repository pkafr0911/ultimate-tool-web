import { DatabaseOutlined, InboxOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import React from 'react';
import type { CSVDataConfig, TestConfig } from '../types';
import { parseCSV } from '../types';

const { Text } = Typography;
const { Dragger } = Upload;

interface Props {
  config: TestConfig;
  onChange: (patch: Partial<TestConfig>) => void;
  disabled?: boolean;
}

const CSVDataSetConfig: React.FC<Props> = ({ config, onChange, disabled }) => {
  const csv = config.csvData;

  const updateCSV = (patch: Partial<CSVDataConfig>) => {
    onChange({ csvData: { ...csv, ...patch } });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseCSV(text, csv.delimiter);
        updateCSV({
          headers: parsed.headers,
          data: parsed.data,
          enabled: true,
        });
      }
    };
    reader.readAsText(file);
    return false; // prevent auto upload
  };

  const handlePasteData = (text: string) => {
    const parsed = parseCSV(text, csv.delimiter);
    updateCSV({
      headers: parsed.headers,
      data: parsed.data,
    });
  };

  const columns = csv.headers.map((h, i) => ({
    title: (
      <Space>
        <Tag color="blue">${`{${h}}`}</Tag>
        {h}
      </Space>
    ),
    dataIndex: i.toString(),
    key: h,
    ellipsis: true,
  }));

  const dataSource = csv.data.slice(0, 50).map((row, rowIdx) => {
    const obj: Record<string, string> = { key: `${rowIdx}` };
    row.forEach((cell, colIdx) => {
      obj[colIdx.toString()] = cell;
    });
    return obj;
  });

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <DatabaseOutlined style={{ color: '#722ed1' }} />
        <Text strong>CSV Data Set Config</Text>
        <Text type="secondary">(like JMeter CSV Data Set Config)</Text>
        <Switch
          checked={csv.enabled}
          onChange={(v) => updateCSV({ enabled: v })}
          disabled={disabled}
          checkedChildren="ON"
          unCheckedChildren="OFF"
          size="small"
        />
      </Space>

      {csv.enabled && (
        <>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col xs={12} sm={6}>
              <Form.Item label="Delimiter" style={{ marginBottom: 8 }}>
                <Input
                  value={csv.delimiter}
                  onChange={(e) => updateCSV({ delimiter: e.target.value || ',' })}
                  style={{ width: 80 }}
                  disabled={disabled}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item label="Recycle on EOF" style={{ marginBottom: 8 }}>
                <Checkbox
                  checked={csv.recycle}
                  onChange={(e) => updateCSV({ recycle: e.target.checked })}
                  disabled={disabled}
                >
                  Yes
                </Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Sharing Mode" style={{ marginBottom: 8 }}>
                <Radio.Group
                  value={csv.shareMode}
                  onChange={(e) => updateCSV({ shareMode: e.target.value })}
                  disabled={disabled}
                  size="small"
                >
                  <Radio.Button value="all">All Threads</Radio.Button>
                  <Radio.Button value="thread">Per Thread</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {/* File upload */}
          <Dragger
            accept=".csv,.tsv,.txt"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            disabled={disabled}
            style={{ marginBottom: 12 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag CSV file to upload</p>
            <p className="ant-upload-hint">
              First row must be header row. Variables become ${'{columnName}'} in URL &amp; Body.
            </p>
          </Dragger>

          {/* Or paste */}
          <Input.TextArea
            rows={3}
            placeholder={`Or paste CSV data here...\nid,name,email\n1,Alice,alice@example.com`}
            onChange={(e) => handlePasteData(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 12 }}
            disabled={disabled}
          />

          {/* Preview */}
          {csv.headers.length > 0 && (
            <>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Variables: {csv.headers.map((h) => `\${${h}}`).join(', ')} — {csv.data.length} data
                rows
                {csv.data.length > 50 && ' (showing first 50)'}
              </Text>
              <Table
                dataSource={dataSource}
                columns={columns}
                size="small"
                pagination={false}
                scroll={{ y: 200 }}
                bordered
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CSVDataSetConfig;
