import React from 'react';
import { Typography, Divider } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  HighlightOutlined,
  CompressOutlined,
  SwapOutlined,
  LockOutlined,
  UnlockOutlined,
  RotateRightOutlined,
  EyeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  SyncOutlined,
  DownloadOutlined,
  CopyOutlined,
  ControlOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import styles from '../styles.less';

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    icon: <UploadOutlined />,
    text: 'Upload an SVG file via drag-and-drop or the “Upload SVG” button.',
  },
  {
    icon: <EditOutlined />,
    text: 'Edit SVG code directly in the built-in Monaco Editor with syntax highlighting.',
  },
  {
    icon: <HighlightOutlined />,
    text: 'Prettify your SVG for better readability with the “Prettify” button.',
  },
  {
    icon: <CompressOutlined />,
    text: 'Optimize SVG using SVGO to reduce file size without losing quality.',
  },
  {
    icon: <LockOutlined />,
    text: 'Lock aspect ratio to maintain proportions when resizing width/height.',
  },
  {
    icon: <UnlockOutlined />,
    text: 'Unlock the aspect ratio if you want to freely adjust width and height.',
  },
  {
    icon: <SwapOutlined />,
    text: 'Flip the SVG horizontally or vertically with the flip buttons.',
  },
  {
    icon: <RotateRightOutlined />,
    text: 'Rotate the SVG by 90° increments using the rotation button.',
  },
  {
    icon: <EyeOutlined />,
    text: 'Preview your SVG interactively with pan, zoom, and background color modes.',
  },
  {
    icon: <ZoomInOutlined />,
    text: 'Zoom in for detailed inspection, or use zoom out/reset controls for fitting.',
  },
  {
    icon: <ControlOutlined />,
    text: (
      <>
        Hold <Text keyboard>Ctrl</Text> + scroll to zoom smoothly around your cursor — just like
        Figma or Illustrator.
      </>
    ),
  },
  {
    icon: <SyncOutlined />,
    text: 'Reset zoom or pan with the reset button to refit the SVG view.',
  },
  {
    icon: <DownloadOutlined />,
    text: 'Download your SVG as SVG, PNG, or ICO formats from the preview section.',
  },
  {
    icon: <CopyOutlined />,
    text: 'Copy SVG code, Base64, or Data URI to clipboard for quick reuse.',
  },
];

const GuideSection: React.FC<{ callback: (action: string) => void }> = ({ callback }) => {
  return (
    <div className={styles['svg-viewer-guide']}>
      <Title level={5}>🧭 How to Use the SVG Editor & Preview</Title>

      <ul className={styles['guide-list']}>
        {steps.map((step, i) => (
          <li key={i}>
            <span className={styles['guide-icon']}>{step.icon}</span>
            <span>{step.text}</span>
          </li>
        ))}
        <li key={'more'}>
          Click here to open advance <a onClick={() => callback('openSetting')}> Settings</a>
        </li>
      </ul>

      <Divider style={{ margin: '12px 0' }} />

      <Paragraph type="secondary">
        <ExclamationCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
        Always <Text strong>check optimized SVGs</Text> to ensure that no essential shapes or paths
        were removed during optimization.
      </Paragraph>
    </div>
  );
};

export default GuideSection;
