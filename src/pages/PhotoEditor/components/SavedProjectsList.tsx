import React from 'react';
import { List, Card, Button, Popconfirm, Image, Typography } from 'antd';
import { DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { SavedProject } from '../types';

interface SavedProjectsListProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

const SavedProjectsList: React.FC<SavedProjectsListProps> = ({ projects, onLoad, onDelete }) => {
  if (projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Typography.Text type="secondary">No saved projects found.</Typography.Text>
      </div>
    );
  }

  return (
    <List
      grid={{ gutter: 16, column: 3 }}
      dataSource={projects}
      renderItem={(item) => (
        <List.Item>
          <Card
            hoverable
            cover={
              <div
                style={{
                  height: 150,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                }}
              >
                <Image
                  src={item.thumbnail}
                  preview={false}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            }
            actions={[
              <Button type="text" icon={<FolderOpenOutlined />} onClick={() => onLoad(item)}>
                Load
              </Button>,
              <Popconfirm
                title="Delete project?"
                onConfirm={() => onDelete(item.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>,
            ]}
          >
            <Card.Meta title={item.name} description={new Date(item.updatedAt).toLocaleString()} />
          </Card>
        </List.Item>
      )}
    />
  );
};

export default SavedProjectsList;
