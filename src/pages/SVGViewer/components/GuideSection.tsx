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
  SelectOutlined,
  DragOutlined,
  BgColorsOutlined,
  AimOutlined,
} from '@ant-design/icons';
import styles from '../styles.less';

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    icon: <UploadOutlined />,
    text: 'Upload an SVG file via drag-and-drop or by clicking the “Upload SVG” button.',
  },
  {
    icon: <EditOutlined />,
    text: 'Edit SVG source code directly in the built-in Monaco Editor with syntax highlighting.',
  },
  {
    icon: <HighlightOutlined />,
    text: 'Prettify your SVG for better readability using the “Prettify” button.',
  },
  {
    icon: <CompressOutlined />,
    text: 'Optimize your SVG with SVGO to reduce file size without losing visual quality.',
  },
  {
    icon: <LockOutlined />,
    text: 'Lock the aspect ratio to maintain proportions while resizing width or height.',
  },
  {
    icon: <UnlockOutlined />,
    text: 'Unlock aspect ratio if you want to freely adjust width and height independently.',
  },
  {
    icon: <SwapOutlined />,
    text: 'Flip your SVG horizontally or vertically with one click.',
  },
  {
    icon: <RotateRightOutlined />,
    text: 'Rotate your SVG by 90° increments with the rotation control.',
  },
  {
    icon: <EyeOutlined />,
    text: 'Preview your SVG interactively with real-time updates, background color modes, and zoom controls.',
  },
  {
    icon: <SelectOutlined />,
    text: (
      <>
        Use the <Text strong>Select (V)</Text> tool to click and inspect individual SVG elements.
        You’ll see their tag name, size, and on-screen bounding box highlighted.
      </>
    ),
  },
  {
    icon: <DragOutlined />,
    text: (
      <>
        Switch to the <Text strong>Hand (H)(Space)</Text> tool to pan the SVG around freely. Click
        and drag to move your view.
      </>
    ),
  },
  {
    icon: <BgColorsOutlined />,
    text: (
      <>
        Use the <Text strong>Color Picker (C)</Text> tool to hover and sample pixel colors directly
        from your SVG.
      </>
    ),
  },
  {
    icon: <AimOutlined />,
    text: (
      <>
        Activate the <Text strong>Measure (R)</Text> tool to measure distances from the mouse to the
        SVG edges in pixels.
      </>
    ),
  },
  {
    icon: <ZoomInOutlined />,
    text: 'Zoom in for detailed inspection, or use zoom out/reset controls to fit the entire SVG.',
  },
  {
    icon: <ControlOutlined />,
    text: (
      <>
        Hold <Text keyboard>Ctrl</Text> + scroll to smoothly zoom in and out centered around your
        cursor — just like in Figma or Illustrator.
      </>
    ),
  },
  {
    icon: <SyncOutlined />,
    text: 'Reset zoom and pan instantly using the reset button to restore the original view.',
  },
  {
    icon: <BgColorsOutlined />,
    text: (
      <>
        Change background color modes between <Text strong>Transparent</Text>,{' '}
        <Text strong>White</Text>, <Text strong>Grey</Text>, or <Text strong>Black</Text> for better
        visibility.
      </>
    ),
  },
  {
    icon: <DownloadOutlined />,
    text: (
      <>
        Download your work in multiple formats: <Text strong>SVG</Text>, <Text strong>PNG</Text>, or{' '}
        <Text strong>ICO</Text>.
      </>
    ),
  },
  {
    icon: <CopyOutlined />,
    text: (
      <>
        Copy the <Text strong>Data URI</Text> or <Text strong>Base64</Text> encoded version of your
        SVG to clipboard for web embedding.
      </>
    ),
  },
  {
    icon: <ExclamationCircleOutlined />,
    text: 'All tools have keyboard shortcuts (V, H, C, R, Space) — making design inspection faster and smoother.',
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
