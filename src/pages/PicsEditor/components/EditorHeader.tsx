import React from 'react';
import { Button, Typography } from 'antd';

const { Title } = Typography;

interface EditorHeaderProps {
  projectName?: string;
  onClose: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ projectName, onClose }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <Title level={5} style={{ margin: 0 }}>
        {projectName ? `Editing: ${projectName}` : 'New Project'}
      </Title>
      <Button onClick={onClose} danger>
        Close Editor
      </Button>
    </div>
  );
};

export default EditorHeader;
