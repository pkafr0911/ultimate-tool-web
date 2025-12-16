import React from 'react';
import { Card, Row, Col, Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { SavedProject } from '../types';

const { Title, Text } = Typography;

interface ProjectListProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onLoad, onDelete }) => {
  if (projects.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={4}>Recent Projects</Title>
      <Row gutter={[16, 16]}>
        {projects.map((project) => (
          <Col key={project.id} xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              cover={
                <div
                  style={{
                    height: 120,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f0f0',
                  }}
                >
                  <img
                    alt={project.name}
                    src={project.thumbnail}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
              }
              onClick={() => onLoad(project)}
              actions={[
                <Popconfirm
                  title="Delete project?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    onDelete(project.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined
                    key="delete"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'red' }}
                  />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={
                  <Text ellipsis style={{ width: '100%' }}>
                    {project.name}
                  </Text>
                }
                description={new Date(project.updatedAt).toLocaleDateString()}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProjectList;
