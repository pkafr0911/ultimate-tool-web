import React from 'react';
import { Button, Tooltip } from 'antd';
import { DragOutlined, HighlightOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';

interface ToolbarBrushToolsProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

const ToolbarBrushTools: React.FC<ToolbarBrushToolsProps> = ({ activeTool, setActiveTool }) => {
  return (
    <>
      <Tooltip title="Hand (H)">
        <Button
          type={activeTool === 'hand' ? 'primary' : 'default'}
          icon={<IconFont name="iconhand" styles={{ height: 16, width: 16 }} />}
          onClick={() => setActiveTool('hand')}
        />
      </Tooltip>
      <Tooltip title="Select (V)">
        <Button
          type={activeTool === 'select' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('select')}
        />
      </Tooltip>
      <Tooltip title="Brush (B)">
        <Button
          type={activeTool === 'brush' ? 'primary' : 'default'}
          icon={<HighlightOutlined />}
          onClick={() => setActiveTool('brush')}
        />
      </Tooltip>
    </>
  );
};

export default ToolbarBrushTools;
