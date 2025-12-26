import React, { useState } from 'react';
import { Modal, Upload, Progress, Button, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useDriveApi } from '../hooks/useDriveApi';

const { Dragger } = Upload;
const { Text } = Typography;

interface UploadControlProps {
  visible: boolean;
  onClose: () => void;
  parentId: string;
  accessToken: string | null;
  onComplete: () => void;
}

const UploadControl: React.FC<UploadControlProps> = ({
  visible,
  onClose,
  parentId,
  accessToken,
  onComplete,
}) => {
  const { upload } = useDriveApi(accessToken);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  const handleUpload = async (file: File) => {
    setUploading(true);
    setCurrentFile(file.name);
    setProgress(0);
    try {
      await upload(file, parentId, (percent) => setProgress(percent));
      message.success(`${file.name} uploaded successfully`);
      onComplete();
    } catch (e) {
      message.error(`Failed to upload ${file.name}`);
    } finally {
      setUploading(false);
      setCurrentFile('');
      setProgress(0);
    }
    return false; // Prevent default upload behavior
  };

  return (
    <Modal
      title="Upload Files"
      open={visible}
      onCancel={!uploading ? onClose : undefined}
      footer={[
        <Button key="close" onClick={onClose} disabled={uploading}>
          Close
        </Button>,
      ]}
    >
      <Dragger
        beforeUpload={handleUpload}
        showUploadList={false}
        disabled={uploading}
        multiple={false} // Simple sequential upload for now
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for a single or bulk upload. Strictly prohibit from uploading company data or
          other band files
        </p>
      </Dragger>

      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Text>Uploading {currentFile}...</Text>
          <Progress percent={progress} status="active" />
        </div>
      )}
    </Modal>
  );
};

export default UploadControl;
