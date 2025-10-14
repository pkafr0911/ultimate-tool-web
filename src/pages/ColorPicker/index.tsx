import React, { useState } from 'react';
import { Card, ColorPicker, Divider, Typography, Input, Space, Radio, message, Button } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { TinyColor } from '@ctrl/tinycolor';
import { CopyOutlined } from '@ant-design/icons';

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
    <Card title="Color Picker">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={4}>Choose Mode</Title>
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
            <Title level={5}>Pick a color</Title>
            <ColorPicker value={color1} onChange={setColor1} showText />
            <Divider />
            <Paragraph>Color values:</Paragraph>
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
            <Title level={5}>Pick gradient colors</Title>
            <Space>
              <ColorPicker value={color1} onChange={setColor1} showText />
              <ColorPicker value={color2} onChange={setColor2} showText />
            </Space>

            <Divider />

            <Paragraph>Gradient values:</Paragraph>
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
    </Card>
  );
};

export default ColorPickerPage;
