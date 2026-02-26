import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ColorPicker, Slider, Typography, Space, Select, InputNumber, Tooltip, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { usePhotoEditor } from '../context';
import { PencilBrush, CircleBrush, SprayBrush, PatternBrush, Shadow } from 'fabric';

type ToneName = 'warm' | 'cool' | 'earth' | 'pastel' | 'neon' | 'monochrome' | 'skin' | 'nature';

const COLOR_TONES: Record<ToneName, { label: string; colors: string[] }> = {
  warm: {
    label: 'Warm',
    colors: [
      '#FF4500',
      '#FF6347',
      '#FF7F50',
      '#FF8C00',
      '#FFA500',
      '#FFD700',
      '#FFBB33',
      '#E25822',
    ],
  },
  cool: {
    label: 'Cool',
    colors: [
      '#0077B6',
      '#00B4D8',
      '#48CAE4',
      '#90E0EF',
      '#5E60CE',
      '#7B68EE',
      '#4169E1',
      '#1E90FF',
    ],
  },
  earth: {
    label: 'Earth',
    colors: [
      '#8B4513',
      '#A0522D',
      '#CD853F',
      '#D2B48C',
      '#556B2F',
      '#6B8E23',
      '#808000',
      '#BDB76B',
    ],
  },
  pastel: {
    label: 'Pastel',
    colors: [
      '#FFB3BA',
      '#FFDFBA',
      '#FFFFBA',
      '#BAFFC9',
      '#BAE1FF',
      '#E8BAFF',
      '#FFC8DD',
      '#BDE0FE',
    ],
  },
  neon: {
    label: 'Neon',
    colors: [
      '#FF00FF',
      '#00FF00',
      '#00FFFF',
      '#FF073A',
      '#DFFF00',
      '#FF6EC7',
      '#7DF9FF',
      '#FF3F00',
    ],
  },
  monochrome: {
    label: 'Mono',
    colors: [
      '#000000',
      '#1A1A1A',
      '#333333',
      '#4D4D4D',
      '#808080',
      '#B3B3B3',
      '#D9D9D9',
      '#FFFFFF',
    ],
  },
  skin: {
    label: 'Skin',
    colors: [
      '#FFDFC4',
      '#F0C8A0',
      '#D4A574',
      '#C68642',
      '#8D5524',
      '#6B3E26',
      '#5C3317',
      '#3B2219',
    ],
  },
  nature: {
    label: 'Nature',
    colors: [
      '#228B22',
      '#32CD32',
      '#90EE90',
      '#006400',
      '#87CEEB',
      '#4682B4',
      '#F4A460',
      '#DAA520',
    ],
  },
};

const PRESET_COLORS = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FF8C00',
  '#8B008B',
  '#006400',
  '#DC143C',
  '#4169E1',
  '#FF69B4',
  '#808080',
];

const ColorSwatch: React.FC<{
  color: string;
  selected: boolean;
  onClick: () => void;
  size?: number;
}> = ({ color, selected, onClick, size = 22 }) => (
  <Tooltip title={color}>
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: 4,
        cursor: 'pointer',
        border: selected ? '2px solid #1677ff' : '1px solid #d9d9d9',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: selected ? '0 0 0 2px rgba(22,119,255,0.3)' : 'none',
      }}
    >
      {selected && (
        <CheckOutlined
          style={{
            fontSize: 10,
            color: isLightColor(color) ? '#333' : '#fff',
          }}
        />
      )}
    </div>
  </Tooltip>
);

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

const BrushPanel: React.FC = () => {
  const {
    canvas,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    brushOpacity,
    setBrushOpacity,
  } = usePhotoEditor();
  const [shadowWidth, setShadowWidth] = useState<number>(0);
  const [brushType, setBrushType] = useState<string>('Pencil');
  const [selectedTone, setSelectedTone] = useState<ToneName | null>(null);

  const recommendedColors = useMemo(() => {
    if (!selectedTone) return PRESET_COLORS;
    return COLOR_TONES[selectedTone].colors;
  }, [selectedTone]);

  const draggingWidth = useRef(false);
  const widthStartX = useRef<number | null>(null);
  const widthStartValue = useRef<number>(brushSize);

  const draggingShadow = useRef(false);
  const shadowStartX = useRef<number | null>(null);
  const shadowStartValue = useRef<number>(shadowWidth);

  const draggingOpacity = useRef(false);
  const opacityStartX = useRef<number | null>(null);
  const opacityStartValue = useRef<number>(brushOpacity);

  const handleWidthLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingWidth.current = true;
    widthStartX.current = e.clientX;
    widthStartValue.current = brushSize;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingWidth.current || widthStartX.current === null) return;
      const delta = ev.clientX - widthStartX.current;
      const sensitivity = 0.2; // pixels -> width
      const newVal = Math.max(1, Math.min(2000, widthStartValue.current + delta * sensitivity));
      setBrushSize(Number(newVal.toFixed(0)));
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

  const handleOpacityLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingOpacity.current = true;
    opacityStartX.current = e.clientX;
    opacityStartValue.current = brushOpacity;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingOpacity.current || opacityStartX.current === null) return;
      const delta = ev.clientX - opacityStartX.current;
      const sensitivity = 0.002; // pixels -> opacity
      const newVal = Math.max(0, Math.min(1, opacityStartValue.current + delta * sensitivity));
      setBrushOpacity(Number(newVal.toFixed(2)));
    };

    const onMouseUp = () => {
      draggingOpacity.current = false;
      opacityStartX.current = null;
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
    // Apply opacity to color
    // Fabric brush color is a string. We need to parse it or use rgba.
    // Assuming brushColor is hex.
    // Simple hex to rgba conversion
    const hex = brushColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    brush.color = `rgba(${r},${g},${b},${brushOpacity})`;
    brush.width = brushSize;

    if (shadowWidth > 0) {
      brush.shadow = new Shadow({ blur: shadowWidth, color: brush.color });
    } else {
      brush.shadow = null;
    }
    // Re-scale dash arrays when brushSize changes
    if (brushType === 'Dashed' || brushType === 'Dotted' || brushType === 'DashDot') {
      const s = Math.max(1, brushSize * 0.8);
      if (brushType === 'Dashed') {
        brush.strokeDashArray = [4 * s, 2.5 * s];
      } else if (brushType === 'Dotted') {
        brush.strokeDashArray = [0.1 * s, 2.5 * s];
      } else {
        brush.strokeDashArray = [4 * s, 1.5 * s, 0.1 * s, 1.5 * s];
      }
    }
  }, [canvas, brushColor, brushSize, shadowWidth, brushOpacity, brushType]);

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
      case 'Pattern':
        brush = new PatternBrush(canvas);
        break;
      case 'Dashed': {
        brush = new PencilBrush(canvas);
        const dScale = Math.max(1, brushSize * 0.8);
        brush.strokeDashArray = [4 * dScale, 2.5 * dScale];
        brush.needsFullRender = () => true;
        break;
      }
      case 'Dotted': {
        brush = new PencilBrush(canvas);
        const dotScale = Math.max(1, brushSize * 0.8);
        brush.strokeDashArray = [0.1 * dotScale, 2.5 * dotScale];
        brush.strokeLineCap = 'round';
        brush.needsFullRender = () => true;
        break;
      }
      case 'DashDot': {
        brush = new PencilBrush(canvas);
        const ddScale = Math.max(1, brushSize * 0.8);
        brush.strokeDashArray = [4 * ddScale, 1.5 * ddScale, 0.1 * ddScale, 1.5 * ddScale];
        brush.strokeLineCap = 'round';
        brush.needsFullRender = () => true;
        break;
      }
      case 'Marker': {
        brush = new PencilBrush(canvas);
        brush.strokeLineCap = 'square';
        brush.strokeLineJoin = 'bevel';
        break;
      }
      case 'Pencil':
      default:
        brush = new PencilBrush(canvas);
        break;
    }
    const hex = brushColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    brush.color = `rgba(${r},${g},${b},${brushOpacity})`;
    brush.width = brushSize;
    if (shadowWidth > 0) {
      brush.shadow = new Shadow({ blur: shadowWidth, color: brush.color });
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
            <Select.Option value="Pattern">Pattern</Select.Option>
            <Select.Option value="Dashed">Dashed</Select.Option>
            <Select.Option value="Dotted">Dotted</Select.Option>
            <Select.Option value="DashDot">Dash-Dot</Select.Option>
            <Select.Option value="Marker">Marker</Select.Option>
          </Select>
        </div>
        <div>
          <Typography.Text>Color</Typography.Text>
          <br />
          <ColorPicker
            value={brushColor}
            onChange={(c) => setBrushColor(c.toHexString())}
            showText
          />
        </div>
        <div>
          <Typography.Text>Color Tone</Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            <Tag
              style={{ cursor: 'pointer', margin: 0 }}
              color={selectedTone === null ? 'blue' : undefined}
              onClick={() => setSelectedTone(null)}
            >
              All
            </Tag>
            {(Object.keys(COLOR_TONES) as ToneName[]).map((tone) => (
              <Tag
                key={tone}
                style={{ cursor: 'pointer', margin: 0 }}
                color={selectedTone === tone ? 'blue' : undefined}
                onClick={() => setSelectedTone(tone)}
              >
                {COLOR_TONES[tone].label}
              </Tag>
            ))}
          </div>
        </div>
        <div>
          <Typography.Text>
            {selectedTone ? `${COLOR_TONES[selectedTone].label} Presets` : 'Preset Colors'}
          </Typography.Text>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              marginTop: 4,
            }}
          >
            {recommendedColors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                selected={brushColor.toLowerCase() === color.toLowerCase()}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </div>
        </div>
        <div>
          <Typography.Text
            onMouseDown={handleWidthLabelMouseDown}
            style={{ cursor: 'ew-resize', userSelect: 'none' }}
          >
            Width
          </Typography.Text>
          <br />
          <InputNumber
            min={1}
            max={2000}
            value={brushSize}
            onChange={(v) => setBrushSize(Number(v || 1))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <Typography.Text
            onMouseDown={handleOpacityLabelMouseDown}
            style={{ cursor: 'ew-resize', userSelect: 'none' }}
          >
            Opacity
          </Typography.Text>
          <br />
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            value={brushOpacity}
            onChange={(v) => setBrushOpacity(Number(v || 1))}
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
          <InputNumber
            min={0}
            max={500}
            value={shadowWidth}
            onChange={(v) => setShadowWidth(Number(v || 0))}
            style={{ width: '100%' }}
          />
        </div>
      </Space>
    </div>
  );
};

export default BrushPanel;
