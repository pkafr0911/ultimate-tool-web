import React from 'react';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import {
  BorderOutlined,
  PlusCircleOutlined,
  AppstoreAddOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import { Rect, Circle, Triangle, Polygon, IText, Canvas } from 'fabric';

interface ToolbarShapesProps {
  canvas: Canvas | null;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  saveState: () => void;
}

const ToolbarShapes: React.FC<ToolbarShapesProps> = ({
  canvas,
  activeTool,
  setActiveTool,
  saveState,
}) => {
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
    saveState();
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
    saveState();
  };

  const addTriangle = () => {
    if (!canvas) return;
    const triangle = new Triangle({
      left: 100,
      top: 100,
      fill: '#0000ff',
      width: 100,
      height: 100,
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    saveState();
  };

  const addPolygon = () => {
    if (!canvas) return;
    const points = [
      { x: 200, y: 100 },
      { x: 250, y: 125 },
      { x: 250, y: 175 },
      { x: 200, y: 200 },
      { x: 150, y: 175 },
      { x: 150, y: 125 },
    ];
    const polygon = new Polygon(points, {
      left: 100,
      top: 100,
      fill: '#ffff00',
      objectCaching: false,
    });
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    saveState();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText('Text', {
      left: 100,
      top: 100,
      fontSize: 24,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('text');
    saveState();
  };

  return (
    <>
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item key="rect" icon={<BorderOutlined />} onClick={addRectangle}>
              Rectangle (R)
            </Menu.Item>
            <Menu.Item key="circle" icon={<PlusCircleOutlined />} onClick={addCircle}>
              Circle
            </Menu.Item>
            <Menu.Item key="triangle" icon={<BorderOutlined />} onClick={addTriangle}>
              Triangle
            </Menu.Item>
            <Menu.Item key="polygon" icon={<BorderOutlined />} onClick={addPolygon}>
              Polygon
            </Menu.Item>
          </Menu>
        }
        trigger={['click']}
      >
        <Tooltip title="Shapes">
          <Button icon={<AppstoreAddOutlined />} />
        </Tooltip>
      </Dropdown>

      <Tooltip title="Text (T)">
        <Button
          type={activeTool === 'text' ? 'primary' : 'default'}
          icon={<FontSizeOutlined />}
          onClick={() => setActiveTool('text')}
        />
      </Tooltip>
    </>
  );
};

export default ToolbarShapes;
