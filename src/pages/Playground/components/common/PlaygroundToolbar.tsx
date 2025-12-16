import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  FormatPainterOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  SnippetsOutlined,
} from '@ant-design/icons';

interface PlaygroundToolbarProps {
  onFormat?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  onSettings?: () => void;
  onTemplates?: () => void;
  extraActions?: React.ReactNode;
}

const PlaygroundToolbar: React.FC<PlaygroundToolbarProps> = ({
  onFormat,
  onCopy,
  onDownload,
  onReset,
  onSettings,
  onTemplates,
  extraActions,
}) => {
  return (
    <Space wrap style={{ marginBottom: 8 }}>
      {onSettings && (
        <Tooltip title="Editor Settings">
          <Button icon={<SettingOutlined />} onClick={onSettings} type="text" />
        </Tooltip>
      )}
      {onTemplates && (
        <Tooltip title="Load Template">
          <Button icon={<SnippetsOutlined />} onClick={onTemplates}>
            Templates
          </Button>
        </Tooltip>
      )}
      {onFormat && (
        <Tooltip title="Format Code">
          <Button icon={<FormatPainterOutlined />} onClick={onFormat}>
            Format
          </Button>
        </Tooltip>
      )}
      {onCopy && (
        <Tooltip title="Copy Code">
          <Button icon={<CopyOutlined />} onClick={onCopy}>
            Copy
          </Button>
        </Tooltip>
      )}
      {onDownload && (
        <Tooltip title="Download">
          <Button icon={<DownloadOutlined />} onClick={onDownload}>
            Download
          </Button>
        </Tooltip>
      )}
      {extraActions}
      {onReset && (
        <Tooltip title="Reset Code">
          <Button icon={<ReloadOutlined />} onClick={onReset} danger>
            Reset
          </Button>
        </Tooltip>
      )}
    </Space>
  );
};

export default PlaygroundToolbar;
