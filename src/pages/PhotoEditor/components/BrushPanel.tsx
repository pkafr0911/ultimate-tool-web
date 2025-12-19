import React, { useEffect, useState } from 'react';
import { ColorPicker, Slider, Typography, Space, Select } from 'antd';
import { usePhotoEditor } from '../context';
import { PencilBrush, CircleBrush, SprayBrush, Shadow } from 'fabric';

const BrushPanel: React.FC = () => {
  const { canvas } = usePhotoEditor();
  const [color, setColor] = useState<string>('#000000');
  const [width, setWidth] = useState<number>(5);
  const [shadowWidth, setShadowWidth] = useState<number>(0);
  const [brushType, setBrushType] = useState<string>('Pencil');

  useEffect(() => {
    if (!canvas) return;

    // Ensure brush exists
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
    }

    const brush = canvas.freeDrawingBrush;
    brush.color = color;
    brush.width = width;

    if (shadowWidth > 0) {
      brush.shadow = new Shadow({ blur: shadowWidth, color: color });
    } else {
      brush.shadow = null;
    }
  }, [canvas, color, width, shadowWidth]);

  const handleBrushChange = (type: string) => {
    if (!canvas) return;
    setBrushType(type);
    let brush;
    switch (type) {
      case 'Circle':
        brush = new CircleBrush(canvas);
        break;
      case 'Spray':
        brush = new SprayBrush(canvas);
        break;
      case 'Pencil':
      default:
        brush = new PencilBrush(canvas);
        break;
    }
    brush.color = color;
    brush.width = width;
    if (shadowWidth > 0) {
      brush.shadow = new Shadow({ blur: shadowWidth, color: color });
    }
    canvas.freeDrawingBrush = brush;
  };

  return (
    <div style={{ padding: 10 }}>
      <Typography.Title level={5}>Brush Settings</Typography.Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Typography.Text>Type</Typography.Text>
          <Select value={brushType} style={{ width: '100%' }} onChange={handleBrushChange}>
            <Select.Option value="Pencil">Pencil</Select.Option>
            <Select.Option value="Circle">Circle</Select.Option>
            <Select.Option value="Spray">Spray</Select.Option>
          </Select>
        </div>
        <div>
          <Typography.Text>Color</Typography.Text>
          <br />
          <ColorPicker value={color} onChange={(c) => setColor(c.toHexString())} showText />
        </div>
        <div>
          <Typography.Text>Width</Typography.Text>
          <Slider min={1} max={100} value={width} onChange={setWidth} />
        </div>
        <div>
          <Typography.Text>Shadow Blur</Typography.Text>
          <Slider min={0} max={50} value={shadowWidth} onChange={setShadowWidth} />
        </div>
      </Space>
    </div>
  );
};

export default BrushPanel;
