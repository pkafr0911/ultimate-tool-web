import React from 'react';
import { Table, Button, Space, Tooltip, Typography } from 'antd';
import {
  FileOutlined,
  FolderOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { DriveFile } from './types';

const { Text } = Typography;

interface DriveListProps {
  files: DriveFile[];
  loading: boolean;
  onFolderClick: (file: DriveFile) => void;
  onPreview: (file: DriveFile) => void;
  onDetail: (file: DriveFile) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

const getIcon = (mimeType: string) => {
  if (mimeType === 'application/vnd.google-apps.folder')
    return <FolderOutlined style={{ color: '#faad14' }} />;
  if (mimeType.includes('image')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
  if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ color: '#f5222d' }} />;
  return <FileOutlined />;
};

const DriveList: React.FC<DriveListProps> = ({
  files,
  loading,
  onFolderClick,
  onPreview,
  onDetail,
  onLoadMore,
  hasMore,
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DriveFile) => (
        <Space
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (record.mimeType === 'application/vnd.google-apps.folder') {
              onFolderClick(record);
            } else {
              onPreview(record);
            }
          }}
        >
          {getIcon(record.mimeType)}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: string) => (size ? (parseInt(size) / 1024 / 1024).toFixed(2) + ' MB' : '-'),
    },
    {
      title: 'Modified',
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      width: 200,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: DriveFile) => (
        <Space>
          <Tooltip title="Preview">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onPreview(record)} />
          </Tooltip>
          <Tooltip title="Details">
            <Button type="text" icon={<InfoCircleOutlined />} onClick={() => onDetail(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={files}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={false}
      footer={() =>
        hasMore ? (
          <div style={{ textAlign: 'center' }}>
            <Button onClick={onLoadMore} loading={loading}>
              Load More
            </Button>
          </div>
        ) : null
      }
    />
  );
};

export default DriveList;
