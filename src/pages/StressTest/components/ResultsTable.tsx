import { ApiOutlined } from '@ant-design/icons';
import { Table, Tag, Tooltip, Typography } from 'antd';
import React, { useMemo } from 'react';
import type { RequestResult } from '../types';
import { formatBytes, formatDuration, getStatusColor } from '../types';

const { Text } = Typography;

interface Props {
  results: RequestResult[];
}

const ResultsTable: React.FC<Props> = ({ results }) => {
  const columns = useMemo(
    () => [
      {
        title: '#',
        dataIndex: 'index',
        key: 'index',
        width: 60,
        sorter: (a: RequestResult, b: RequestResult) => a.index - b.index,
      },
      {
        title: 'Thread',
        dataIndex: 'threadId',
        key: 'threadId',
        width: 70,
        sorter: (a: RequestResult, b: RequestResult) => a.threadId - b.threadId,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: number, record: RequestResult) => (
          <Tag color={getStatusColor(status)}>
            {status === 0 ? 'ERR' : status} {record.statusText}
          </Tag>
        ),
        sorter: (a: RequestResult, b: RequestResult) => a.status - b.status,
        filters: [
          { text: '2xx', value: '2xx' },
          { text: '3xx', value: '3xx' },
          { text: '4xx', value: '4xx' },
          { text: '5xx', value: '5xx' },
          { text: 'Error', value: 'err' },
        ],
        onFilter: (value: any, record: RequestResult) => {
          if (value === 'err') return record.status === 0;
          const century = Math.floor(record.status / 100);
          return `${century}xx` === value;
        },
      },
      {
        title: 'Duration',
        dataIndex: 'duration',
        key: 'duration',
        width: 100,
        render: (v: number) => formatDuration(v),
        sorter: (a: RequestResult, b: RequestResult) => a.duration - b.duration,
      },
      {
        title: 'Latency',
        dataIndex: 'latency',
        key: 'latency',
        width: 90,
        render: (v: number) => formatDuration(v),
        sorter: (a: RequestResult, b: RequestResult) => a.latency - b.latency,
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
        width: 90,
        render: (v: number) => formatBytes(v),
        sorter: (a: RequestResult, b: RequestResult) => a.size - b.size,
      },
      {
        title: 'Assertions',
        key: 'assertions',
        width: 100,
        render: (_: any, record: RequestResult) => {
          if (!record.assertions || record.assertions.length === 0) return '-';
          const passed = record.assertions.filter((a) => a.passed).length;
          const failed = record.assertions.filter((a) => !a.passed).length;
          return (
            <span>
              {passed > 0 && <Tag color="success">{passed} ✓</Tag>}
              {failed > 0 && <Tag color="error">{failed} ✗</Tag>}
            </span>
          );
        },
      },
      {
        title: 'URL',
        dataIndex: 'url',
        key: 'url',
        ellipsis: true,
        width: 200,
        render: (url: string) => (
          <Tooltip title={url}>
            <Text style={{ fontSize: 11 }} ellipsis>
              {url}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: 'Error',
        dataIndex: 'error',
        key: 'error',
        ellipsis: true,
        render: (err: string | undefined) =>
          err ? (
            <Tooltip title={err}>
              <Text type="danger" ellipsis style={{ fontSize: 11 }}>
                {err}
              </Text>
            </Tooltip>
          ) : (
            '-'
          ),
      },
    ],
    [],
  );

  return (
    <Table
      dataSource={results}
      columns={columns}
      rowKey="index"
      size="small"
      pagination={{
        pageSize: 50,
        showSizeChanger: true,
        pageSizeOptions: ['20', '50', '100', '200'],
        showTotal: (t) => `Total: ${t}`,
      }}
      scroll={{ y: 450, x: 900 }}
      expandable={{
        expandedRowRender: (record) => (
          <div style={{ fontSize: 12 }}>
            {record.assertions.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text strong>Assertions:</Text>
                {record.assertions.map((a, i) => (
                  <div key={i} style={{ paddingLeft: 12 }}>
                    <Tag color={a.passed ? 'success' : 'error'} style={{ fontSize: 11 }}>
                      {a.passed ? '✓' : '✗'} {a.name}
                    </Tag>
                    <Text type="secondary">{a.message}</Text>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(record.extractedVars).length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <Text strong>Extracted Variables:</Text>
                {Object.entries(record.extractedVars).map(([k, v]) => (
                  <Tag key={k} style={{ fontSize: 11, margin: 2 }}>
                    {k} = {v}
                  </Tag>
                ))}
              </div>
            )}
            {record.responseBodySnippet && (
              <div>
                <Text strong>Response Body (first 500 chars):</Text>
                <pre
                  style={{
                    fontSize: 11,
                    maxHeight: 120,
                    overflow: 'auto',
                    background: '#fafafa',
                    padding: 8,
                    borderRadius: 4,
                  }}
                >
                  {record.responseBodySnippet}
                </pre>
              </div>
            )}
          </div>
        ),
        rowExpandable: (record) =>
          record.assertions.length > 0 ||
          Object.keys(record.extractedVars).length > 0 ||
          !!record.responseBodySnippet,
      }}
    />
  );
};

export default ResultsTable;
