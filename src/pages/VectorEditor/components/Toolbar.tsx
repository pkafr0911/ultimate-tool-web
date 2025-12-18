import React from 'react';
import { Button, Tooltip, Space, Divider } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  StopOutlined,
  FontSizeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HighlightOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { Rect, Circle, IText } from 'fabric';
import { useVectorEditor } from '../context';

const Toolbar: React.FC = () => {
  const { canvas, activeTool, setActiveTool, history } = useVectorEditor();

  const addRectangle = () => {
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: '#ff0000',
      width: 100,
      height: 100,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setActiveTool('select');
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: '#00ff00',
      radius: 50,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    setActiveTool('select');
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText('Type here', {
      left: 100,
      top: 100,
      fontFamily: 'arial',
      fill: '#333',
      fontSize: 20,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('select');
  };

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    history.saveState();
  };

  const exportSVG = () => {
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Space direction="vertical" size="small">
      <Tooltip title="Select (V)">
        <Button
          type={activeTool === 'select' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('select')}
        />
      </Tooltip>

      <Tooltip title="Pan (H / Space)">
        <Button
          type={activeTool === 'pan' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('pan')}
        />
      </Tooltip>

      <Divider style={{ margin: '4px 0' }} />

      <Tooltip title="Rectangle (R)">
        <Button icon={<BorderOutlined />} onClick={addRectangle} />
      </Tooltip>

      <Tooltip title="Circle (C)">
        <Button icon={<StopOutlined rotate={45} />} onClick={addCircle} />
      </Tooltip>

      <Tooltip title="Text (T)">
        <Button icon={<FontSizeOutlined />} onClick={addText} />
      </Tooltip>

      <Tooltip title="Draw (B)">
        <Button
          type={activeTool === 'draw' ? 'primary' : 'default'}
          icon={<HighlightOutlined />}
          onClick={() => setActiveTool('draw')}
        />
      </Tooltip>

      <Divider style={{ margin: '4px 0' }} />

      <Tooltip title="Undo (Ctrl+Z)">
        <Button icon={<UndoOutlined />} onClick={history.undo} disabled={!history.canUndo} />
      </Tooltip>

      <Tooltip title="Redo (Ctrl+Shift+Z)">
        <Button icon={<RedoOutlined />} onClick={history.redo} disabled={!history.canRedo} />
      </Tooltip>

      <Divider style={{ margin: '4px 0' }} />

      <Tooltip title="Clear Canvas">
        <Button icon={<DeleteOutlined />} danger onClick={clearCanvas} />
      </Tooltip>

      <Tooltip title="Export SVG">
        <Button icon={<DownloadOutlined />} onClick={exportSVG} />
      </Tooltip>
    </Space>
  );
};

export default Toolbar;
