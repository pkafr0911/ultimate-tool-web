import React from 'react';
import { Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  fullScreen?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
  progress,
  fullScreen = false,
}) => {
  if (!visible) return null;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />
      <div style={{ textAlign: 'center' }}>
        <Text style={{ color: fullScreen ? '#fff' : 'inherit', fontSize: 14 }}>{message}</Text>
        {progress !== undefined && (
          <div style={{ marginTop: 8 }}>
            <Text style={{ color: fullScreen ? '#fff' : 'inherit', fontSize: 12 }}>
              {Math.round(progress)}%
            </Text>
            <div
              style={{
                width: 200,
                height: 4,
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
                marginTop: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#1890ff',
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        borderRadius: 8,
      }}
    >
      {content}
    </div>
  );
};

export default LoadingOverlay;
