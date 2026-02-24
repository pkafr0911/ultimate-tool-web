import React from 'react';
import { Typography, Collapse, Button } from 'antd';
import { CustomSlider } from '../CustomSlider';
import { CameraRawSettings } from '../../utils/cameraRawHelpers';

const { Panel } = Collapse;

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

  const updateGlobal = (field: 'blending' | 'balance' | 'temperature' | 'tint', value: number) => {
    onChange({
      ...settings,
      [field]: value,
    } as any);
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
          <CustomSlider
            label={`Luminance (${Math.round(settings.shadows.l * 100)}%)`}
            min={-1}
            max={1}
            step={0.01}
            value={settings.shadows.l}
            onChange={(v) => updateZone('shadows', 'l', v)}
            gradient={`linear-gradient(to right, #000, #888, #fff)`}
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
          <CustomSlider
            label={`Luminance (${Math.round(settings.midtones.l * 100)}%)`}
            min={-1}
            max={1}
            step={0.01}
            value={settings.midtones.l}
            onChange={(v) => updateZone('midtones', 'l', v)}
            gradient={`linear-gradient(to right, #000, #888, #fff)`}
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
          <CustomSlider
            label={`Luminance (${Math.round(settings.highlights.l * 100)}%)`}
            min={-1}
            max={1}
            step={0.01}
            value={settings.highlights.l}
            onChange={(v) => updateZone('highlights', 'l', v)}
            gradient={`linear-gradient(to right, #000, #888, #fff)`}
          />
        </Panel>
      </Collapse>

      <div style={{ marginTop: 12 }}>
        <CustomSlider
          label={`Blending (${Math.round(settings.blending * 100)}%)`}
          min={0}
          max={1}
          step={0.01}
          value={settings.blending}
          onChange={(v) => updateGlobal('blending', v)}
          gradient={`linear-gradient(to right, #444, #888, #ccc)`}
        />
        <CustomSlider
          label={`Balance (${Math.round(settings.balance * 100)}%)`}
          min={-1}
          max={1}
          step={0.01}
          value={settings.balance}
          onChange={(v) => updateGlobal('balance', v)}
          gradient={`linear-gradient(to right, #f00, #888, #00f)`}
        />
        <CustomSlider
          label={`Temperature (${Math.round(settings.temperature * 100)}%)`}
          min={-1}
          max={1}
          step={0.01}
          value={settings.temperature}
          onChange={(v) => updateGlobal('temperature', v)}
          gradient={`linear-gradient(to right, #001f3f, #888, #ffdd99)`}
        />
        <CustomSlider
          label={`Tint (${Math.round(settings.tint * 100)}%)`}
          min={-1}
          max={1}
          step={0.01}
          value={settings.tint}
          onChange={(v) => updateGlobal('tint', v)}
          gradient={`linear-gradient(to right, #ff88ff, #888, #88ff88)`}
        />
      </div>

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
            temperature: 0,
            tint: 0,
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
