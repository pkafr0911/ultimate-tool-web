import React, { useEffect, useState } from 'react';
import {
  Form,
  InputNumber,
  ColorPicker,
  Slider,
  Typography,
  Empty,
  Select,
  Switch,
  Divider,
  Space,
  Button,
  Tooltip,
} from 'antd';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons';
import { IText, Shadow } from 'fabric';
import { useVectorEditor } from '../context';

const { Title, Text } = Typography;

// Solid line + three dash presets
const DASH_PRESETS: Record<string, number[] | null> = {
  solid: null,
  dashed: [10, 6],
  dotted: [2, 4],
  'dash-dot': [10, 4, 2, 4],
};

const dashToPreset = (val: number[] | undefined): string => {
  if (!val || val.length === 0) return 'solid';
  const s = val.join(',');
  for (const [k, v] of Object.entries(DASH_PRESETS)) {
    if (v && v.join(',') === s) return k;
  }
  return 'custom';
};

const toColorString = (val: any, fallback = '#000000'): string => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (val.toHexString) return val.toHexString();
  if (typeof val === 'object' && 'colorStops' in val) return fallback; // gradient
  return String(val);
};

const PropertiesPanel: React.FC = () => {
  const { canvas, selectedObject } = useVectorEditor();
  const [form] = Form.useForm();
  const [, tick] = useState(0);

  const isText = selectedObject instanceof IText;

  useEffect(() => {
    if (!selectedObject) return;

    const updateForm = () => {
      const shadow = selectedObject.shadow as Shadow | null | undefined;
      form.setFieldsValue({
        fill: toColorString(selectedObject.fill, 'transparent'),
        stroke: toColorString(selectedObject.stroke, 'transparent'),
        strokeWidth: selectedObject.strokeWidth ?? 0,
        opacity: selectedObject.opacity ?? 1,
        left: Math.round(selectedObject.left || 0),
        top: Math.round(selectedObject.top || 0),
        width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
        height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
        angle: Math.round(selectedObject.angle || 0),
        dash: dashToPreset(selectedObject.strokeDashArray as number[] | undefined),
        lineCap: selectedObject.strokeLineCap ?? 'butt',
        lineJoin: selectedObject.strokeLineJoin ?? 'miter',
        shadowOn: !!shadow,
        shadowColor: shadow ? toColorString(shadow.color, 'rgba(0,0,0,0.4)') : 'rgba(0,0,0,0.4)',
        shadowBlur: shadow?.blur ?? 8,
        shadowOffsetX: shadow?.offsetX ?? 4,
        shadowOffsetY: shadow?.offsetY ?? 4,
        ...(selectedObject instanceof IText && {
          fontFamily: selectedObject.fontFamily,
          fontSize: selectedObject.fontSize,
          fontWeight: selectedObject.fontWeight,
          fontStyle: selectedObject.fontStyle,
          underline: selectedObject.underline,
          textAlign: selectedObject.textAlign,
          lineHeight: selectedObject.lineHeight,
          charSpacing: selectedObject.charSpacing,
        }),
      });
      tick((n) => n + 1);
    };

    updateForm();

    if (canvas) {
      const handler = () => updateForm();
      canvas.on('object:modified', handler);
      return () => {
        canvas.off('object:modified', handler);
      };
    }
  }, [selectedObject, canvas, form]);

  if (!selectedObject) {
    return <Empty description="No object selected" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const setProp = (key: string, value: any) => selectedObject.set(key as any, value);

  const handleValuesChange = (changed: any) => {
    if (!selectedObject || !canvas) return;

    if ('fill' in changed) setProp('fill', toColorString(changed.fill));
    if ('stroke' in changed) setProp('stroke', toColorString(changed.stroke));
    if ('strokeWidth' in changed) setProp('strokeWidth', changed.strokeWidth);
    if ('opacity' in changed) setProp('opacity', changed.opacity);
    if ('left' in changed) setProp('left', changed.left);
    if ('top' in changed) setProp('top', changed.top);
    if ('angle' in changed) setProp('angle', changed.angle);

    if ('width' in changed && changed.width && selectedObject.width) {
      selectedObject.scaleToWidth(changed.width);
    }
    if ('height' in changed && changed.height && selectedObject.height) {
      selectedObject.scaleToHeight(changed.height);
    }

    if ('dash' in changed) {
      const preset = DASH_PRESETS[changed.dash as string];
      setProp('strokeDashArray', preset ?? null);
    }
    if ('lineCap' in changed) setProp('strokeLineCap', changed.lineCap);
    if ('lineJoin' in changed) setProp('strokeLineJoin', changed.lineJoin);

    if ('shadowOn' in changed) {
      if (changed.shadowOn) {
        const all = form.getFieldsValue();
        setProp(
          'shadow',
          new Shadow({
            color: toColorString(all.shadowColor, 'rgba(0,0,0,0.4)'),
            blur: all.shadowBlur ?? 8,
            offsetX: all.shadowOffsetX ?? 4,
            offsetY: all.shadowOffsetY ?? 4,
          }),
        );
      } else {
        setProp('shadow', null);
      }
    }
    if (
      'shadowColor' in changed ||
      'shadowBlur' in changed ||
      'shadowOffsetX' in changed ||
      'shadowOffsetY' in changed
    ) {
      const all = form.getFieldsValue();
      if (all.shadowOn) {
        setProp(
          'shadow',
          new Shadow({
            color: toColorString(all.shadowColor, 'rgba(0,0,0,0.4)'),
            blur: all.shadowBlur ?? 8,
            offsetX: all.shadowOffsetX ?? 4,
            offsetY: all.shadowOffsetY ?? 4,
          }),
        );
      }
    }

    // Text properties
    if (selectedObject instanceof IText) {
      if ('fontFamily' in changed) setProp('fontFamily', changed.fontFamily);
      if ('fontSize' in changed) setProp('fontSize', changed.fontSize);
      if ('fontWeight' in changed) setProp('fontWeight', changed.fontWeight);
      if ('fontStyle' in changed) setProp('fontStyle', changed.fontStyle);
      if ('underline' in changed) setProp('underline', changed.underline);
      if ('textAlign' in changed) setProp('textAlign', changed.textAlign);
      if ('lineHeight' in changed) setProp('lineHeight', changed.lineHeight);
      if ('charSpacing' in changed) setProp('charSpacing', changed.charSpacing);
    }

    selectedObject.setCoords();
    canvas.requestRenderAll();
  };

  // Quick toggle buttons for text
  const toggleText = (key: 'fontWeight' | 'fontStyle' | 'underline') => {
    if (!(selectedObject instanceof IText) || !canvas) return;
    if (key === 'fontWeight') {
      const cur = selectedObject.fontWeight;
      const next = cur === 'bold' ? 'normal' : 'bold';
      selectedObject.set('fontWeight', next);
      form.setFieldValue('fontWeight', next);
    } else if (key === 'fontStyle') {
      const cur = selectedObject.fontStyle;
      const next = cur === 'italic' ? 'normal' : 'italic';
      selectedObject.set('fontStyle', next);
      form.setFieldValue('fontStyle', next);
    } else if (key === 'underline') {
      const next = !selectedObject.underline;
      selectedObject.set('underline', next);
      form.setFieldValue('underline', next);
    }
    canvas.requestRenderAll();
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 8 }}>
        Properties
      </Title>
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange} size="small">
        <Form.Item name="fill" label="Fill">
          <ColorPicker showText allowClear />
        </Form.Item>

        <Form.Item name="stroke" label="Stroke">
          <ColorPicker showText allowClear />
        </Form.Item>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="strokeWidth" label="Width" style={{ flex: 1 }}>
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="dash" label="Dash" style={{ flex: 1 }}>
            <Select
              options={[
                { value: 'solid', label: 'Solid' },
                { value: 'dashed', label: 'Dashed' },
                { value: 'dotted', label: 'Dotted' },
                { value: 'dash-dot', label: 'Dash-dot' },
              ]}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="lineCap" label="Cap" style={{ flex: 1 }}>
            <Select
              options={[
                { value: 'butt', label: 'Butt' },
                { value: 'round', label: 'Round' },
                { value: 'square', label: 'Square' },
              ]}
            />
          </Form.Item>
          <Form.Item name="lineJoin" label="Join" style={{ flex: 1 }}>
            <Select
              options={[
                { value: 'miter', label: 'Miter' },
                { value: 'round', label: 'Round' },
                { value: 'bevel', label: 'Bevel' },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item name="opacity" label="Opacity">
          <Slider min={0} max={1} step={0.05} />
        </Form.Item>

        <Divider style={{ margin: '8px 0' }}>Transform</Divider>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="left" label="X" style={{ flex: 1 }}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="top" label="Y" style={{ flex: 1 }}>
            <InputNumber />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="width" label="W" style={{ flex: 1 }}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="height" label="H" style={{ flex: 1 }}>
            <InputNumber min={1} />
          </Form.Item>
        </div>

        <Form.Item name="angle" label="Rotation">
          <Slider min={0} max={360} />
        </Form.Item>

        <Divider style={{ margin: '8px 0' }}>Drop shadow</Divider>

        <Form.Item name="shadowOn" label="Enable" valuePropName="checked">
          <Switch size="small" />
        </Form.Item>

        <Form.Item name="shadowColor" label="Colour">
          <ColorPicker showText />
        </Form.Item>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="shadowBlur" label="Blur" style={{ flex: 1 }}>
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="shadowOffsetX" label="X" style={{ flex: 1 }}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="shadowOffsetY" label="Y" style={{ flex: 1 }}>
            <InputNumber />
          </Form.Item>
        </div>

        {isText && (
          <>
            <Divider style={{ margin: '8px 0' }}>Text</Divider>
            <Form.Item name="fontFamily" label="Font">
              <Select
                showSearch
                options={[
                  'Arial',
                  'Helvetica',
                  'Times New Roman',
                  'Georgia',
                  'Courier New',
                  'Verdana',
                  'Tahoma',
                  'Trebuchet MS',
                  'Impact',
                  'Comic Sans MS',
                ].map((f) => ({ value: f, label: f }))}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item name="fontSize" label="Size" style={{ flex: 1 }}>
                <InputNumber min={1} max={400} />
              </Form.Item>
              <Form.Item name="lineHeight" label="Line" style={{ flex: 1 }}>
                <InputNumber min={0.5} max={4} step={0.1} />
              </Form.Item>
              <Form.Item name="charSpacing" label="Track" style={{ flex: 1 }}>
                <InputNumber min={-200} max={1000} />
              </Form.Item>
            </div>

            <Form.Item label="Style">
              <Space>
                <Tooltip title="Bold">
                  <Button
                    size="small"
                    icon={<BoldOutlined />}
                    type={(selectedObject as IText).fontWeight === 'bold' ? 'primary' : 'default'}
                    onClick={() => toggleText('fontWeight')}
                  />
                </Tooltip>
                <Tooltip title="Italic">
                  <Button
                    size="small"
                    icon={<ItalicOutlined />}
                    type={(selectedObject as IText).fontStyle === 'italic' ? 'primary' : 'default'}
                    onClick={() => toggleText('fontStyle')}
                  />
                </Tooltip>
                <Tooltip title="Underline">
                  <Button
                    size="small"
                    icon={<UnderlineOutlined />}
                    type={(selectedObject as IText).underline ? 'primary' : 'default'}
                    onClick={() => toggleText('underline')}
                  />
                </Tooltip>
              </Space>
            </Form.Item>

            <Form.Item name="textAlign" label="Align">
              <Select
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                  { value: 'justify', label: 'Justify' },
                ]}
              />
            </Form.Item>
          </>
        )}
      </Form>
      <Text type="secondary" style={{ fontSize: 11 }}>
        Tip: hold Alt while dragging pen handles to break tangents.
      </Text>
    </div>
  );
};

export default PropertiesPanel;
