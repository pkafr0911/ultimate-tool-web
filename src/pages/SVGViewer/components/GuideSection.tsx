import React from 'react';
import { Typography } from 'antd';
import styles from '../styles.less'; // Import CSS module

const GuideSection: React.FC = () => {
  return (
    <div className={styles['svg-viewer-guide']}>
      <Typography.Title level={5}>🧭 How to Use</Typography.Title>
      <ul>
        <li>Upload an SVG file via drag-and-drop or the upload button.</li>
        <li>Edit SVG code directly in the editor.</li>
        <li>Resize SVG using width/height inputs.</li>
        <li>Flip horizontally or vertically using the buttons.</li>
        <li>Prettify or optimize SVG with the respective buttons.</li>
        <li>Preview your SVG in different formats using the tabs.</li>
        <li>Download or copy the SVG, PNG, ICO, Data URI, or Base64 output.</li>
      </ul>

      <Typography.Paragraph type="secondary">
        ⚠️ Always check optimized SVGs to ensure no critical elements are removed.
      </Typography.Paragraph>
    </div>
  );
};

export default GuideSection;
