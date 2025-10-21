import { CopyOutlined } from '@ant-design/icons';
import { TinyColor } from '@ctrl/tinycolor';
import { Button, Card, ColorPicker, Divider, Input, Radio, Space, Typography, message } from 'antd';
import type { Color } from 'antd/es/color-picker';
import React, { useState } from 'react';
import './styles.less';

const { Title, Paragraph, Text } = Typography;

const ColorPickerPage: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'gradient'>('single');
  const [color1, setColor1] = useState<Color | string>('#1677ff');
  const [color2, setColor2] = useState<Color | string>('#ff718b');

  const toTiny = (value: Color | string) =>
    new TinyColor(typeof value === 'string' ? value : value.toHexString());

  const tiny1 = toTiny(color1);
  const tiny2 = toTiny(color2);

  const hex1 = tiny1.toHexString();
  const rgb1 = tiny1.toRgbString();
  const hsl1 = tiny1.toHslString();

  const hex2 = tiny2.toHexString();
  const rgb2 = tiny2.toRgbString();
  const hsl2 = tiny2.toHslString();

  const gradient = `linear-gradient(90deg, ${hex1}, ${hex2})`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  return (
    <Card title="🎨 Color Picker Tool" className="color-picker-card" variant="borderless">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={4}>Select Mode</Title>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          options={[
            { label: 'Single Color', value: 'single' },
            { label: 'Gradient', value: 'gradient' },
          ]}
          optionType="button"
          buttonStyle="solid"
        />

        <Divider />

        {mode === 'single' ? (
          <>
            <Title level={5}>Pick a Color</Title>
            <ColorPicker value={color1} onChange={setColor1} showText />
            <Divider />
            <Paragraph>Color Values:</Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input addonBefore="HEX" value={hex1} readOnly />
              <Input addonBefore="RGB" value={rgb1} readOnly />
              <Input addonBefore="HSL" value={hsl1} readOnly />
            </Space>

            <Divider />
            <div
              style={{
                background: hex1,
                height: 80,
                borderRadius: 8,
                boxShadow: '0 0 4px rgba(0,0,0,0.2)',
              }}
            />
            <Text type="secondary">Preview of the selected color</Text>
          </>
        ) : (
          <>
            <Title level={5}>Pick Gradient Colors</Title>
            <Space>
              <ColorPicker value={color1} onChange={setColor1} showText />
              <ColorPicker value={color2} onChange={setColor2} showText />
            </Space>

            <Divider />

            <Paragraph>Gradient Values:</Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input addonBefore="From" value={hex1} readOnly />
              <Input addonBefore="To" value={hex2} readOnly />
              <Input addonBefore="CSS" value={gradient} readOnly />
              <Button icon={<CopyOutlined />} onClick={() => handleCopy(gradient)}>
                Copy Gradient CSS
              </Button>
            </Space>

            <Divider />
            <div
              style={{
                background: gradient,
                height: 80,
                borderRadius: 8,
                boxShadow: '0 0 4px rgba(0,0,0,0.2)',
              }}
            />
            <Text type="secondary">Preview of the selected gradient</Text>
          </>
        )}
      </Space>

      {/* --- Guide Section --- */}
      <div className="color-picker-guide">
        <Title level={4}>📘 How to Use This Tool</Title>
        <Paragraph>
          This page helps you <Text strong>pick colors</Text> and create{' '}
          <Text strong>CSS gradients</Text> with real-time previews and code formats.
        </Paragraph>
        <ul>
          <li>
            Choose <Text strong>Single Color</Text> or <Text strong>Gradient</Text> mode.
          </li>
          <li>Select one or two colors using the color picker(s).</li>
          <li>
            View the color values in <Text code>HEX</Text>, <Text code>RGB</Text>, and
            <Text code>HSL</Text> formats.
          </li>
          <li>Copy the color or gradient CSS code for use in your project.</li>
          <li>Preview updates instantly as you change colors.</li>
        </ul>
        <Paragraph type="secondary">
          💡 Great for designers and developers working with brand colors, gradients, and UI themes.
        </Paragraph>
      </div>
    </Card>
  );
};

export default ColorPickerPage;
