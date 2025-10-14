import React from 'react';
import { Card, Button, Typography } from 'antd';
import { v4 as uuidv4 } from 'uuid';

const UUIDPage: React.FC = () => {
  const [value, setValue] = React.useState(uuidv4());
  return (
    <Card title="UUID Generator">
      <Typography.Text copyable>{value}</Typography.Text>
      <Button onClick={() => setValue(uuidv4())}>Generate</Button>
    </Card>
  );
};

export default UUIDPage;
