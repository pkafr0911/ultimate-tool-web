import React, { useState } from 'react';
import { Tabs, Typography, Button } from 'antd';
import { colorRanges } from '../../utils/hslHelpers';
import { CustomSlider } from '../CustomSlider';

const { Text } = Typography;

interface HslPanelProps {
  adjustments: Record<string, { h: number; s: number; l: number }>;
  onChange: (adjustments: Record<string, { h: number; s: number; l: number }>) => void;
  activeChannel?: string;
  onActiveChannelChange?: (channel: string) => void;
}

const colorSwatches = [
  { name: 'red', color: '#ff4d4d' },
  { name: 'orange', color: '#ffa500' },
  { name: 'yellow', color: '#ffd700' },
  { name: 'green', color: '#00c853' },
  { name: 'aqua', color: '#00e5ff' },
  { name: 'blue', color: '#2979ff' },
  { name: 'purple', color: '#9c27b0' },
  { name: 'magenta', color: '#ff00aa' },
];

const getSliderGradient = (activeColor: string, type: 'h' | 's' | 'l') => {
  const base = colorSwatches.find((c) => c.name === activeColor)?.color || '#ffffff';
  const index = colorSwatches.findIndex((c) => c.name === activeColor);

  // If not found, default to grayscale
  if (index === -1) return '#555';

  const current = colorSwatches[index].color;
  const left = colorSwatches[index - 1]?.color || current;
  const right = colorSwatches[index + 1]?.color || current;

  switch (type) {
    case 'h':
      return `linear-gradient(90deg, ${left}, ${current}, ${right})`;
    case 's':
      return `linear-gradient(90deg, gray, ${base})`;
    case 'l':
      return `linear-gradient(90deg, black, ${base}, white)`;
    default:
      return '#555';
  }
};

const HslPanel: React.FC<HslPanelProps> = ({
  adjustments,
  onChange,
  activeChannel: propActiveChannel,
  onActiveChannelChange,
}) => {
  const [localActiveChannel, setLocalActiveChannel] = useState<string>('red');

  const activeChannel = propActiveChannel !== undefined ? propActiveChannel : localActiveChannel;

  const handleChannelChange = (channel: string) => {
    if (onActiveChannelChange) {
      onActiveChannelChange(channel);
    } else {
      setLocalActiveChannel(channel);
    }
  };

  const currentAdj = adjustments[activeChannel] || { h: 0, s: 0, l: 0 };

  const updateAdjustment = (field: 'h' | 's' | 'l', value: number) => {
    onChange({
      ...adjustments,
      [activeChannel]: {
        ...adjustments[activeChannel],
        [field]: value,
      },
    });
  };

  return (
    <div>
      <Tabs
        activeKey={activeChannel}
        onChange={handleChannelChange}
        type="card"
        size="small"
        items={colorRanges.map((range) => ({
          label: (
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                background: colorSwatches.find((c) => c.name === range.name)?.color || '#eee',
                borderRadius: '50%',
                marginRight: 4,
              }}
              title={range.name}
            />
          ),
          key: range.name,
        }))}
        tabPosition="top"
        tabBarGutter={4}
      />
      <div style={{ marginTop: 16 }}>
        <Typography.Title level={5} style={{ textTransform: 'capitalize' }}>
          {activeChannel}
        </Typography.Title>

        <div style={{ marginBottom: 16 }}>
          <CustomSlider
            label={`Hue (${currentAdj.h}°)`}
            min={-180}
            max={180}
            value={currentAdj.h}
            onChange={(v) => updateAdjustment('h', v)}
            gradient={getSliderGradient(activeChannel, 'h')}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <CustomSlider
            label={`Saturation (${Math.round(currentAdj.s * 100)}%)`}
            min={-1}
            max={1}
            step={0.01}
            value={currentAdj.s}
            onChange={(v) => updateAdjustment('s', v)}
            gradient={getSliderGradient(activeChannel, 's')}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <CustomSlider
            label={`Luminance (${Math.round(currentAdj.l * 100)}%)`}
            min={-1}
            max={1}
            step={0.01}
            value={currentAdj.l}
            onChange={(v) => updateAdjustment('l', v)}
            gradient={getSliderGradient(activeChannel, 'l')}
          />
        </div>

        <Button
          onClick={() => {
            onChange({
              ...adjustments,
              [activeChannel]: { h: 0, s: 0, l: 0 },
            });
          }}
          size="small"
        >
          Reset {activeChannel}
        </Button>
      </div>
    </div>
  );
};

export default HslPanel;
