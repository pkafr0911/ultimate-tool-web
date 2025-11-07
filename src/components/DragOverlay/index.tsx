import React from 'react';
import { UploadOutlined } from '@ant-design/icons';

const DragOverlay: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.1)',
        border: '2px dashed #1890ff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
      <p style={{ fontSize: 18, marginTop: 8 }}>{text || 'Drop your file here to upload'}</p>
    </div>
  );
};

export default DragOverlay;
