import React from 'react';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

interface UploadAreaProps {
  onUpload: (file: File) => boolean | void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onUpload }) => {
  return (
    <Upload.Dragger
      beforeUpload={onUpload}
      showUploadList={false}
      accept=".png,.jpg,.jpeg"
      height={200}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag file to this area to upload</p>
      <p className="ant-upload-hint">
        Support for a single upload. You can also paste an image from clipboard.
      </p>
    </Upload.Dragger>
  );
};

export default UploadArea;
