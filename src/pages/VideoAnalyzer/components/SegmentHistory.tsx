import { Table, Tag } from 'antd';
import React from 'react';
import { FormatBytes } from '../utils/helpers';

interface SegmentInfo {
  key: string;
  type: string;
  url: string;
  bitrate?: number;
  resolution?: string;
  bytesLoaded?: number;
  duration?: number;
}

interface SegmentHistoryProps {
  segments: SegmentInfo[];
}

const SegmentHistory: React.FC<SegmentHistoryProps> = ({ segments }) => {
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (t: string) => <Tag color={t === 'HLS' ? 'orange' : 'blue'}>{t}</Tag>,
    },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (d: number) => (d ? `${d.toFixed(2)}s` : '-'),
    },
    {
      title: 'Resolution',
      dataIndex: 'resolution',
      key: 'resolution',
      width: 120,
    },
    {
      title: 'Size',
      dataIndex: 'bytesLoaded',
      key: 'bytesLoaded',
      render: (b: number) => FormatBytes(b),
      width: 100,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={segments}
      pagination={{ pageSize: 10 }}
      size="small"
      scroll={{ y: 300 }}
    />
  );
};

export default SegmentHistory;
