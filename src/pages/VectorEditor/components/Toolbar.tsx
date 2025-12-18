import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  StopOutlined, // Using as Circle placeholder if CircleOutlined is not filled enough, but let's use standard icons
  FontSizeOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Rect, Circle, IText } from 'fabric';
import { useVectorEditor } from '../context';

const Toolbar: React.FC = () => {
  const { canvas, activeTool, setActiveTool } = useVectorEditor();

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
  };

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
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
    <Space direction="vertical" size="middle">
      <Tooltip title="Select">
        <Button
          type={activeTool === 'select' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('select')}
        />
      </Tooltip>

      <Tooltip title="Add Rectangle">
        <Button icon={<BorderOutlined />} onClick={addRectangle} />
      </Tooltip>

      <Tooltip title="Add Circle">
        <Button icon={<StopOutlined rotate={45} />} onClick={addCircle} />
      </Tooltip>

      <Tooltip title="Add Text">
        <Button icon={<FontSizeOutlined />} onClick={addText} />
      </Tooltip>

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
