import React from 'react';
import { Card, Typography, List, Space, Button } from 'antd';
import { history } from 'umi';
import { pages } from '@/consants';

const { Title, Paragraph } = Typography;

const WelcomePage: React.FC = () => {
  return (
    <Card title="Welcome">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4}>Ultimate Tools & Utilities</Title>
        <Paragraph>Choose one of the tools below to get started:</Paragraph>
        <List
          dataSource={pages}
          renderItem={(item) => (
            <List.Item>
              <Button type="link" onClick={() => history.push(item.path)}>
                {item.name}
              </Button>
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};

export default WelcomePage;
