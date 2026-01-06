import React from 'react';
import { Typography, Collapse, Button } from 'antd';
import { CustomSlider } from '../CustomSlider';
import { CameraRawSettings } from '../../utils/cameraRawHelpers';

const { Panel } = Collapse;
const { Text } = Typography;

interface ColorGradingPanelProps {
  settings: CameraRawSettings['colorGrading'];
  onChange: (settings: CameraRawSettings['colorGrading']) => void;
}

const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({ settings, onChange }) => {
  const updateZone = (
    zone: 'shadows' | 'midtones' | 'highlights',
    field: 'h' | 's' | 'l',
    value: number,
  ) => {
    onChange({
      ...settings,
      [zone]: {
        ...settings[zone],
        [field]: value,
      },
    });
  };

  const getRainbowGradient = () =>
    'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)';
  const getSaturationGradient = (hue: number) =>
    `linear-gradient(to right, #888, hsl(${hue}, 100%, 50%))`;

  return (
    <div>
      <Collapse defaultActiveKey={['shadows', 'midtones', 'highlights']} ghost>
        <Panel header="Shadows" key="shadows">
          <CustomSlider
            label={`Hue (${Math.round(settings.shadows.h)}°)`}
            min={0}
            max={360}
            value={settings.shadows.h}
            onChange={(v) => updateZone('shadows', 'h', v)}
            gradient={getRainbowGradient()}
          />
          <CustomSlider
            label={`Saturation (${Math.round(settings.shadows.s * 100)}%)`}
            min={0}
            max={1}
            step={0.01}
            value={settings.shadows.s}
            onChange={(v) => updateZone('shadows', 's', v)}
            gradient={getSaturationGradient(settings.shadows.h)}
          />
          {/* Luminance for grading? usually grading is just Tint, but some tools allow Luma shift too. Kept simple for now (Tint). */}
        </Panel>

        <Panel header="Midtones" key="midtones">
          <CustomSlider
            label={`Hue (${Math.round(settings.midtones.h)}°)`}
            min={0}
            max={360}
            value={settings.midtones.h}
            onChange={(v) => updateZone('midtones', 'h', v)}
            gradient={getRainbowGradient()}
          />
          <CustomSlider
            label={`Saturation (${Math.round(settings.midtones.s * 100)}%)`}
            min={0}
            max={1}
            step={0.01}
            value={settings.midtones.s}
            onChange={(v) => updateZone('midtones', 's', v)}
            gradient={getSaturationGradient(settings.midtones.h)}
          />
        </Panel>

        <Panel header="Highlights" key="highlights">
          <CustomSlider
            label={`Hue (${Math.round(settings.highlights.h)}°)`}
            min={0}
            max={360}
            value={settings.highlights.h}
            onChange={(v) => updateZone('highlights', 'h', v)}
            gradient={getRainbowGradient()}
          />
          <CustomSlider
            label={`Saturation (${Math.round(settings.highlights.s * 100)}%)`}
            min={0}
            max={1}
            step={0.01}
            value={settings.highlights.s}
            onChange={(v) => updateZone('highlights', 's', v)}
            gradient={getSaturationGradient(settings.highlights.h)}
          />
        </Panel>
      </Collapse>

      {/* 
      <div style={{ marginTop: 16 }}>
          <Text strong>Blending / Balance (Not Implemented)</Text>
           // These require more complex shader/pixel math, keeping it simple additive for now.
      </div> 
      */}

      <Button
        onClick={() =>
          onChange({
            shadows: { h: 0, s: 0, l: 0 },
            midtones: { h: 0, s: 0, l: 0 },
            highlights: { h: 0, s: 0, l: 0 },
            blending: 0.5,
            balance: 0,
          })
        }
        style={{ marginTop: 16 }}
      >
        Reset Grading
      </Button>
    </div>
  );
};

export default ColorGradingPanel;
