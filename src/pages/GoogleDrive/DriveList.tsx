import React, { useRef, useEffect } from 'react';
import { Table, Space, Tooltip, Typography, Dropdown, Card, Row, Col, Spin, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  FileOutlined,
  FolderOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  EditOutlined,
  CopyOutlined,
  ShareAltOutlined,
  DragOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { DriveFile } from './types';

const { Text } = Typography;

export type DisplayMode = 'list' | 'grid';

interface DriveListProps {
  files: DriveFile[];
  loading: boolean;
  loadingMore: boolean;
  displayMode: DisplayMode;
  onFolderClick: (file: DriveFile) => void;
  onPreview: (file: DriveFile) => void;
  onDetail: (file: DriveFile) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onRename: (file: DriveFile) => void;
  onCopy: (file: DriveFile) => void;
  onShare: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onDelete: (file: DriveFile) => void;
}

const getIcon = (mimeType: string, size = 16) => {
  const style = { fontSize: size };
  if (mimeType === 'application/vnd.google-apps.folder')
    return <FolderOutlined style={{ ...style, color: '#faad14' }} />;
  if (mimeType.includes('image'))
    return <FileImageOutlined style={{ ...style, color: '#52c41a' }} />;
  if (mimeType.includes('pdf')) return <FilePdfOutlined style={{ ...style, color: '#f5222d' }} />;
  return <FileOutlined style={style} />;
};

const DriveList: React.FC<DriveListProps> = ({
  files,
  loading,
  loadingMore,
  displayMode,
  onFolderClick,
  onPreview,
  onDetail,
  onLoadMore,
  hasMore,
  onRename,
  onCopy,
  onShare,
  onMove,
  onDelete,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);
  const getActionMenuItems = (record: DriveFile): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: 'Rename',
        onClick: () => onRename(record),
      },
    ];

    // Copy is not supported for folders
    if (record.mimeType !== 'application/vnd.google-apps.folder') {
      items.push({
        key: 'copy',
        icon: <CopyOutlined />,
        label: 'Make a copy',
        onClick: () => onCopy(record),
      });
    }

    items.push(
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: 'Share',
        onClick: () => onShare(record),
      },
      {
        key: 'move',
        icon: <DragOutlined />,
        label: 'Move',
        onClick: () => onMove(record),
      },
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Move to trash',
        danger: true,
        onClick: () => onDelete(record),
      },
    );

    return items;
  };

  const handleItemClick = (record: DriveFile) => {
    if (record.mimeType === 'application/vnd.google-apps.folder') {
      onFolderClick(record);
    } else {
      onPreview(record);
    }
  };

  const sentinel = (
    <div
      ref={sentinelRef}
      style={{ height: 1, textAlign: 'center', padding: loadingMore ? 12 : 0 }}
    >
      {loadingMore && <Spin size="small" />}
    </div>
  );

  // ── Grid view ──────────────────────────────────────────────────────
  if (displayMode === 'grid') {
    return (
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {files.map((record) => (
            <Col key={record.id} xs={12} sm={8} md={6} lg={4} xl={4}>
              <Card
                hoverable
                size="small"
                styles={{ body: { padding: '8px', textAlign: 'center' } }}
                cover={
                  record.thumbnailLink ? (
                    <img
                      alt={record.name}
                      src={record.thumbnailLink}
                      style={{ height: 80, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => handleItemClick(record)}
                    />
                  ) : (
                    <div
                      style={{
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#fafafa',
                      }}
                      onClick={() => handleItemClick(record)}
                    >
                      {getIcon(record.mimeType, 32)}
                    </div>
                  )
                }
                actions={[
                  <Tooltip title="Preview" key="preview">
                    <EyeOutlined onClick={() => onPreview(record)} />
                  </Tooltip>,
                  <Tooltip title="Details" key="detail">
                    <InfoCircleOutlined onClick={() => onDetail(record)} />
                  </Tooltip>,
                  <Dropdown
                    menu={{ items: getActionMenuItems(record) }}
                    trigger={['click']}
                    key="more"
                  >
                    <MoreOutlined />
                  </Dropdown>,
                ]}
              >
                <Text
                  ellipsis={{ tooltip: record.name }}
                  style={{ fontSize: 12, cursor: 'pointer', display: 'block' }}
                  onClick={() => handleItemClick(record)}
                >
                  {record.name}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
        {sentinel}
      </Spin>
    );
  }

  // ── List view (table) ──────────────────────────────────────────────
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DriveFile) => (
        <Space style={{ cursor: 'pointer' }} onClick={() => handleItemClick(record)}>
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
      width: 180,
      render: (_: any, record: DriveFile) => (
        <Space>
          <Tooltip title="Preview">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onPreview(record)} />
          </Tooltip>
          <Tooltip title="Details">
            <Button type="text" icon={<InfoCircleOutlined />} onClick={() => onDetail(record)} />
          </Tooltip>
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
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
      footer={() => (hasMore || loadingMore ? sentinel : null)}
    />
  );
};

export default DriveList;
