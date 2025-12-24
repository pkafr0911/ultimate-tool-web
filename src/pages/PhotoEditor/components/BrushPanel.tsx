import React, { useEffect, useState, useRef } from 'react';
import { ColorPicker, Slider, Typography, Space, Select } from 'antd';
import { usePhotoEditor } from '../context';
import { PencilBrush, CircleBrush, SprayBrush, Shadow } from 'fabric';

const BrushPanel: React.FC = () => {
  const { canvas } = usePhotoEditor();
  const [color, setColor] = useState<string>('#000000');
  const [width, setWidth] = useState<number>(5);
  const [shadowWidth, setShadowWidth] = useState<number>(0);
  const [brushType, setBrushType] = useState<string>('Pencil');

  const draggingWidth = useRef(false);
  const widthStartX = useRef<number | null>(null);
  const widthStartValue = useRef<number>(width);

  const draggingShadow = useRef(false);
  const shadowStartX = useRef<number | null>(null);
  const shadowStartValue = useRef<number>(shadowWidth);

  const handleWidthLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingWidth.current = true;
    widthStartX.current = e.clientX;
    widthStartValue.current = width;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingWidth.current || widthStartX.current === null) return;
      const delta = ev.clientX - widthStartX.current;
      const sensitivity = 0.2; // pixels -> width
      const newVal = Math.max(1, Math.min(2000, widthStartValue.current + delta * sensitivity));
      setWidth(Number(newVal.toFixed(0)));
    };

    const onMouseUp = () => {
      draggingWidth.current = false;
      widthStartX.current = null;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleShadowLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingShadow.current = true;
    shadowStartX.current = e.clientX;
    shadowStartValue.current = shadowWidth;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingShadow.current || shadowStartX.current === null) return;
      const delta = ev.clientX - shadowStartX.current;
      const sensitivity = 0.2;
      const newVal = Math.max(0, Math.min(200, shadowStartValue.current + delta * sensitivity));
      setShadowWidth(Number(newVal.toFixed(0)));
    };

    const onMouseUp = () => {
      draggingShadow.current = false;
      shadowStartX.current = null;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
          <Typography.Text
            onMouseDown={handleWidthLabelMouseDown}
            style={{ cursor: 'ew-resize', userSelect: 'none' }}
          >
            Width
          </Typography.Text>
          <br />
          <input
            type="number"
            min={1}
            max={2000}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value || 1))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <Typography.Text
            onMouseDown={handleShadowLabelMouseDown}
            style={{ cursor: 'ew-resize', userSelect: 'none' }}
          >
            Shadow Blur
          </Typography.Text>
          <br />
          <input
            type="number"
            min={0}
            max={500}
            value={shadowWidth}
            onChange={(e) => setShadowWidth(Number(e.target.value || 0))}
            style={{ width: '100%' }}
          />
        </div>
      </Space>
    </div>
  );
};

export default BrushPanel;
