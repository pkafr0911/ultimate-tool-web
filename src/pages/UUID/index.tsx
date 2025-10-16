import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import './styles.less';

const { Text, Title } = Typography;

const UUIDPage: React.FC = () => {
  const [value, setValue] = React.useState(uuidv4());

  return (
    <Card title={'UUID Generator'} className="uuid-card">
      <Space direction="vertical" size="middle" className="uuid-content">
        <Text className="uuid-value" copyable>
          {value}
        </Text>

        <Button type="primary" className="uuid-button" onClick={() => setValue(uuidv4())}>
          Generate New UUID
        </Button>
      </Space>
    </Card>
  );
};

export default UUIDPage;
