import { Button, Card, Space, Typography } from 'antd';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import './styles.less';

const { Title, Text, Paragraph } = Typography;

const UUIDPage: React.FC = () => {
  const [value, setValue] = React.useState(uuidv4());

  return (
    <Card title="UUID Generator" className="uuid-card">
      {/* Page Description */}
      <Paragraph type="secondary" className="uuid-description">
        This page allows you to{' '}
        <Text strong>generate random UUIDs (Universally Unique Identifiers)</Text>. UUIDs are
        commonly used for unique record IDs, API keys, session tokens, and more.
      </Paragraph>

      <Space direction="vertical" size="middle" className="uuid-content">
        {/* UUID Display */}
        <Text className="uuid-value" copyable>
          {value}
        </Text>

        {/* Generate Button */}
        <Button type="primary" className="uuid-button" onClick={() => setValue(uuidv4())} block>
          Generate New UUID
        </Button>

        {/* --- User Guide Section --- */}
        <div className="uuid-guide">
          <Title level={5}>📘 How to Use</Title>
          <Paragraph>
            <Text strong>1.</Text> Click the <Text code>Generate New UUID</Text> button to create a
            new unique ID.
            <br />
            <Text strong>2.</Text> Click the <Text code>copy</Text> icon beside the value to copy it
            to your clipboard.
            <br />
            <Text strong>3.</Text> Use the generated UUID wherever a unique identifier is required.
            <br />
            <Text type="secondary">
              💡 Tip: UUIDs are globally unique — no two values will ever be the same.
            </Text>
          </Paragraph>
        </div>
      </Space>
    </Card>
  );
};

export default UUIDPage;
