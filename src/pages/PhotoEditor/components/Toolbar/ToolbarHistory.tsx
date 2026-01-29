import React from 'react';
import { Button, Tooltip, Divider } from 'antd';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';

interface ToolbarHistoryProps {
  history: {
    saveState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
}

const ToolbarHistory: React.FC<ToolbarHistoryProps> = ({ history }) => {
  return (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <Tooltip title="Undo (Ctrl+Z)">
        <Button icon={<UndoOutlined />} onClick={history.undo} disabled={!history.canUndo} />
      </Tooltip>
      <Tooltip title="Redo (Ctrl+Y)">
        <Button icon={<RedoOutlined />} onClick={history.redo} disabled={!history.canRedo} />
      </Tooltip>
    </>
  );
};

export default ToolbarHistory;
