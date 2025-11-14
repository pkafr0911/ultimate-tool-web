import React from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

type Props = {
  handleOCR: (file: File) => void;
  loading: boolean;
};

const OCRUploader: React.FC<Props> = ({ handleOCR, loading }) => {
  return (
    <Upload
      accept="image/*"
      showUploadList={false}
      beforeUpload={(file) => {
        handleOCR(file);
        return false;
      }}
    >
      <Button icon={<UploadOutlined />} loading={loading} block>
        Upload Image
      </Button>
    </Upload>
  );
};

export default OCRUploader;
