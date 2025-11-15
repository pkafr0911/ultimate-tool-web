import React from 'react';
import { Typography, Divider } from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  SettingOutlined,
  CameraOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import styles from '../styles.less';

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    icon: <UploadOutlined />,
    text: 'Upload an image containing text via drag-and-drop or by clicking the "Upload Image" button.',
  },
  {
    icon: <CameraOutlined />,
    text: 'You can also paste an image directly from your clipboard (Ctrl+V or Cmd+V).',
  },
  {
    icon: <FileTextOutlined />,
    text: 'Click "Extract Text" to use OCR and extract text from the uploaded image.',
  },
  {
    icon: <SettingOutlined />,
    text: (
      <>
        Adjust OCR <Text strong>Language</Text> or <Text strong>Upscale Mode</Text> from the
        Settings panel to improve recognition accuracy.
      </>
    ),
  },
  {
    icon: <CopyOutlined />,
    text: 'Copy the extracted text to your clipboard with the "Copy" button.',
  },
  {
    icon: <DownloadOutlined />,
    text: 'Download the extracted text as a file using the "Download" button.',
  },
  {
    icon: <ExclamationCircleOutlined />,
    text: (
      <>
        Always <Text strong>verify extracted text</Text> to ensure OCR accuracy, especially for
        small or low-quality images.
      </>
    ),
  },
];

const GuideSection: React.FC<{ callback?: (action: string) => void }> = ({ callback }) => {
  return (
    <div className={styles['image-to-text-guide']}>
      <Title level={5}>🧭 How to Use Image → Text (OCR) Tool</Title>

      <ul className={styles['guide-list']}>
        {steps.map((step, i) => (
          <li key={i}>
            <span className={styles['guide-icon']}>{step.icon}</span>
            <span>{step.text}</span>
          </li>
        ))}
        {callback && (
          <li key="more">
            Click here to open advanced <a onClick={() => callback('openSettings')}>Settings</a>
          </li>
        )}
      </ul>

      <Divider style={{ margin: '12px 0' }} />

      <Paragraph type="secondary">
        <ExclamationCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
        Recommended: Use high-quality images for better OCR accuracy. Small fonts or blurry images
        may reduce recognition quality.
      </Paragraph>
    </div>
  );
};

export default GuideSection;
