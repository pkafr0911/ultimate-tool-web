import React from 'react';
import { Drawer, Descriptions, Button, Space, Image, Typography } from 'antd';
import { DownloadOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { DriveFile } from './types';
import { useDriveApi } from './hooks/useDriveApi';

interface DriveDetailProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
}

const DriveDetail: React.FC<DriveDetailProps> = ({ file, visible, onClose, accessToken }) => {
  const { download } = useDriveApi(accessToken);

  if (!file) return null;

  return (
    <Drawer title="File Details" placement="right" onClose={onClose} open={visible} width={400}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ textAlign: 'center' }}>
          {file.thumbnailLink ? (
            <Image src={file.thumbnailLink} alt={file.name} style={{ maxHeight: 200 }} />
          ) : (
            <div
              style={{
                height: 100,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              No Preview
            </div>
          )}
        </div>

        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">{file.name}</Descriptions.Item>
          <Descriptions.Item label="Type">{file.mimeType}</Descriptions.Item>
          <Descriptions.Item label="Size">
            {file.size ? (parseInt(file.size) / 1024 / 1024).toFixed(2) + ' MB' : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(file.createdTime || '').toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Modified">
            {new Date(file.modifiedTime || '').toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            {file.owners?.map((o) => o.displayName).join(', ')}
          </Descriptions.Item>
        </Descriptions>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block icon={<DownloadOutlined />} onClick={() => download(file.id, file.name)}>
            Download
          </Button>
          <Button block icon={<LinkOutlined />} href={file.webViewLink} target="_blank">
            Open in Drive
          </Button>
        </Space>
      </Space>
    </Drawer>
  );
};

export default DriveDetail;
