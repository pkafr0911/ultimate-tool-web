import React, { useState, useEffect } from 'react';
import { Modal, Spin, Button, Result } from 'antd';
import { DriveFile } from './types';
import { downloadToBlob } from './utils/driveApi';

interface DrivePreviewProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
}

const DrivePreview: React.FC<DrivePreviewProps> = ({ file, visible, onClose, accessToken }) => {
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && file && accessToken) {
      loadPreview();
    } else {
      setContentUrl(null);
      setError(null);
    }
  }, [visible, file, accessToken]);

  const loadPreview = async () => {
    if (!file || !accessToken) return;
    setLoading(true);
    setError(null);

    try {
      if (file.mimeType.startsWith('image/')) {
        // For images, download blob and show
        const blob = await downloadToBlob(accessToken, file.id);
        const url = URL.createObjectURL(blob);
        setContentUrl(url);
      } else if (file.mimeType === 'application/pdf') {
        // For PDF, download blob and show in iframe
        const blob = await downloadToBlob(accessToken, file.id);
        const url = URL.createObjectURL(blob);
        setContentUrl(url);
      } else {
        // Fallback to webViewLink or not supported
        setError('Preview not supported for this file type.');
      }
    } catch (e) {
      setError('Failed to load preview.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return <Spin size="large" />;
    if (error)
      return (
        <Result
          status="info"
          title="Preview Unavailable"
          subTitle={error}
          extra={
            <Button type="primary" href={file?.webViewLink} target="_blank">
              Open in Google Drive
            </Button>
          }
        />
      );

    if (file?.mimeType.startsWith('image/')) {
      return (
        <img
          src={contentUrl || ''}
          alt={file.name}
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      );
    }
    if (file?.mimeType === 'application/pdf') {
      return (
        <iframe src={contentUrl || ''} style={{ width: '100%', height: '80vh', border: 'none' }} />
      );
    }
    return null;
  };

  return (
    <Modal
      title={file?.name}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnClose
    >
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}
      >
        {renderContent()}
      </div>
    </Modal>
  );
};

export default DrivePreview;
