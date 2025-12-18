import React from 'react';
import { Button, Space, Tooltip, Typography } from 'antd';
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  GroupOutlined,
  UngroupOutlined,
} from '@ant-design/icons';
import { useVectorEditor } from '../context';
import { ActiveSelection, Group } from 'fabric';

const { Title } = Typography;

const AlignmentPanel: React.FC = () => {
  const { canvas, selectedObject, history } = useVectorEditor();

  const align = (position: string) => {
    if (!canvas || !selectedObject) return;

    const activeObj = selectedObject;
    const canvasWidth = canvas.width || 0;
    const canvasHeight = canvas.height || 0;

    switch (position) {
      case 'left':
        activeObj.set({ left: 0 });
        break;
      case 'center':
        canvas.centerObjectH(activeObj);
        break;
      case 'right':
        activeObj.set({ left: canvasWidth - (activeObj.width || 0) * (activeObj.scaleX || 1) });
        break;
      case 'top':
        activeObj.set({ top: 0 });
        break;
      case 'middle':
        canvas.centerObjectV(activeObj);
        break;
      case 'bottom':
        activeObj.set({ top: canvasHeight - (activeObj.height || 0) * (activeObj.scaleY || 1) });
        break;
    }

    activeObj.setCoords();
    canvas.requestRenderAll();
    history.saveState();
  };

  const groupObjects = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') return;

    (activeObj as any).toGroup();
    canvas.requestRenderAll();
    history.saveState();
  };

  const ungroupObjects = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') return;

    (activeObj as any).toActiveSelection();
    canvas.requestRenderAll();
    history.saveState();
  };

  if (!selectedObject) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <Title level={5}>Alignment & Grouping</Title>
      <Space wrap>
        <Tooltip title="Align Left">
          <Button size="small" icon={<AlignLeftOutlined />} onClick={() => align('left')} />
        </Tooltip>
        <Tooltip title="Align Center">
          <Button size="small" icon={<AlignCenterOutlined />} onClick={() => align('center')} />
        </Tooltip>
        <Tooltip title="Align Right">
          <Button size="small" icon={<AlignRightOutlined />} onClick={() => align('right')} />
        </Tooltip>
        <Tooltip title="Align Top">
          <Button size="small" icon={<VerticalAlignTopOutlined />} onClick={() => align('top')} />
        </Tooltip>
        <Tooltip title="Align Middle">
          <Button
            size="small"
            icon={<VerticalAlignMiddleOutlined />}
            onClick={() => align('middle')}
          />
        </Tooltip>
        <Tooltip title="Align Bottom">
          <Button
            size="small"
            icon={<VerticalAlignBottomOutlined />}
            onClick={() => align('bottom')}
          />
        </Tooltip>
      </Space>
      <div style={{ marginTop: 8 }}>
        <Space>
          <Tooltip title="Group">
            <Button size="small" icon={<GroupOutlined />} onClick={groupObjects} />
          </Tooltip>
          <Tooltip title="Ungroup">
            <Button size="small" icon={<UngroupOutlined />} onClick={ungroupObjects} />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};

export default AlignmentPanel;
