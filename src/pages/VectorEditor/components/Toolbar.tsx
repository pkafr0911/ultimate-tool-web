import React from 'react';
import { Button, Tooltip, Space, Divider } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  StopOutlined,
  FontSizeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UndoOutlined,
  RedoOutlined,
  EditOutlined,
  SettingOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { Rect, Circle, IText, Path } from 'fabric';
import { useVectorEditor } from '../context';
import SettingsModal from './SettingsModal';

const Toolbar: React.FC = () => {
  const { canvas, activeTool, setActiveTool, history, pointEditor } = useVectorEditor();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

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

  const enterDirectSelection = () => {
    if (!canvas || !pointEditor) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      console.log('No object selected for point editing');
      return;
    }

    // Check if object is a Path
    if (!(activeObj instanceof Path)) {
      console.log('Point editing only works with Path objects');
      return;
    }

    if (pointEditor.isEditing) {
      // Already in point edit mode - exit
      pointEditor.exit(true);
      setActiveTool('select');
    } else {
      // Enter point edit mode
      pointEditor.enter(activeObj);
      setActiveTool('direct-select');
    }
  };

  const exportSVG = () => {
    if (!canvas) return;

    // Save current background color
    const originalBg = canvas.backgroundColor;

    // Set background to transparent for export
    canvas.backgroundColor = 'transparent';

    // Calculate bounding box of all objects
    const objects = canvas.getObjects();
    let svg;

    if (objects.length > 0) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      objects.forEach((obj) => {
        const br = obj.getBoundingRect();
        if (br.left < minX) minX = br.left;
        if (br.top < minY) minY = br.top;
        if (br.left + br.width > maxX) maxX = br.left + br.width;
        if (br.top + br.height > maxY) maxY = br.top + br.height;
      });

      // Add some padding
      const padding = 10;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const width = maxX - minX;
      const height = maxY - minY;

      svg = canvas.toSVG({
        viewBox: {
          x: minX,
          y: minY,
          width: width,
          height: height,
        },
        width: width.toString(),
        height: height.toString(),
      });
    } else {
      svg = canvas.toSVG();
    }

    // Restore background
    canvas.backgroundColor = originalBg;
    canvas.requestRenderAll();

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

      <Tooltip title="Direct Select / Point Edit (A)">
        <Button
          type={activeTool === 'direct-select' || pointEditor?.isEditing ? 'primary' : 'default'}
          icon={<AimOutlined />}
          onClick={enterDirectSelection}
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

      <Tooltip title="Pen (P)">
        <Button
          type={activeTool === 'pen' ? 'primary' : 'default'}
          icon={<EditOutlined />}
          onClick={() => setActiveTool('pen')}
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

      <Tooltip title="Settings">
        <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
      </Tooltip>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Space>
  );
};

export default Toolbar;
