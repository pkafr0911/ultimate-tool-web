import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

interface PreviewFrameProps {
  srcDoc?: string;
  title?: string;
  height?: string | number;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({
  srcDoc,
  title = 'Preview',
  height = '100%',
}) => {
  return (
    <Card
      title={
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
      }
      bodyStyle={{ padding: 0, height: height, overflow: 'hidden' }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <iframe
        title="preview"
        srcDoc={srcDoc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#fff',
        }}
        sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
      />
    </Card>
  );
};

export default PreviewFrame;
