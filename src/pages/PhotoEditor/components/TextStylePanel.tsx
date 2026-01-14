import React, { useEffect, useState } from 'react';
import { Select, InputNumber, Button, Space, Divider, ColorPicker } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
} from '@ant-design/icons';
import { usePhotoEditor } from '../context';
import { IText } from 'fabric';

const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana'];

const TextStylePanel: React.FC = () => {
  const { canvas, selectedObject, history, setActiveTool } = usePhotoEditor();
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [fontSize, setFontSize] = useState<number>(24);
  const [bold, setBold] = useState<boolean>(false);
  const [italic, setItalic] = useState<boolean>(false);
  const [underline, setUnderline] = useState<boolean>(false);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [color, setColor] = useState<string>('#000000');

  useEffect(() => {
    if (selectedObject && (selectedObject as any).isType === 'i-text') {
      const txt = selectedObject as IText;
      setFontFamily((txt.fontFamily as string) || 'Arial');
      setFontSize((txt.fontSize as number) || 24);
      setBold(txt.fontWeight === 'bold' || txt.fontWeight === 700);
      setItalic(txt.fontStyle === 'italic');
      setUnderline((txt.underline as boolean) || false);
      setAlign((txt.textAlign as any) || 'left');
      setColor((txt.fill as string) || '#000000');
    }
  }, [selectedObject]);

  const apply = (patch: Record<string, any>, save = true) => {
    if (!selectedObject) return;
    selectedObject.set(patch);
    selectedObject.setCoords && selectedObject.setCoords();
    canvas && canvas.requestRenderAll();
    if (save && history) history.saveState();
  };

  const getFirstLayerRect = () => {
    if (!canvas) return null;
    const objs = canvas.getObjects();
    if (!objs || objs.length === 0) return null;
    const first = objs[0];
    try {
      return first.getBoundingRect();
    } catch (e) {
      return null;
    }
  };

  const alignHorizontalToFirst = (mode: 'left' | 'center' | 'right') => {
    if (!canvas || !selectedObject) return;
    const target = getFirstLayerRect();
    if (!target) return;
    const objRect = selectedObject.getBoundingRect();

    let left = selectedObject.left || 0;
    if (mode === 'left') {
      left = target.left;
    } else if (mode === 'center') {
      left = target.left + (target.width - objRect.width) / 2;
    } else if (mode === 'right') {
      left = target.left + target.width - objRect.width;
    }

    apply({ left }, true);
  };

  const alignVerticalToFirst = (mode: 'top' | 'middle' | 'bottom') => {
    if (!canvas || !selectedObject) return;
    const target = getFirstLayerRect();
    if (!target) return;
    const objRect = selectedObject.getBoundingRect();

    let top = selectedObject.top || 0;
    if (mode === 'top') {
      top = target.top;
    } else if (mode === 'middle') {
      top = target.top + (target.height - objRect.height) / 2;
    } else if (mode === 'bottom') {
      top = target.top + target.height - objRect.height;
    }

    apply({ top }, true);
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Font</strong>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Select
          value={fontFamily}
          onChange={(v) => {
            setFontFamily(v);
            apply({ fontFamily: v });
          }}
          style={{ width: '100%' }}
        >
          {fonts.map((f) => (
            <Select.Option key={f} value={f}>
              {f}
            </Select.Option>
          ))}
        </Select>

        <InputNumber
          min={8}
          max={200}
          value={fontSize}
          onChange={(v) => {
            setFontSize(v || 24);
            apply({ fontSize: v || 24 });
          }}
          style={{ width: '100%' }}
        />

        <div>
          <Space>
            <Button
              icon={<BoldOutlined />}
              type={bold ? 'primary' : 'default'}
              onClick={() => {
                const newVal = !bold;
                setBold(newVal);
                apply({ fontWeight: newVal ? 'bold' : 'normal' });
              }}
            />
            <Button
              icon={<ItalicOutlined />}
              type={italic ? 'primary' : 'default'}
              onClick={() => {
                const newVal = !italic;
                setItalic(newVal);
                apply({ fontStyle: newVal ? 'italic' : 'normal' });
              }}
            />
            <Button
              icon={<UnderlineOutlined />}
              type={underline ? 'primary' : 'default'}
              onClick={() => {
                const newVal = !underline;
                setUnderline(newVal);
                apply({ underline: newVal });
              }}
            />
          </Space>
        </div>

        <Divider />

        <div>
          <strong>Horizontal Align (textAlign)</strong>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Button
                icon={<AlignLeftOutlined />}
                type={align === 'left' ? 'primary' : 'default'}
                onClick={() => {
                  setAlign('left');
                  apply({ textAlign: 'left' });
                }}
              />
              <Button
                icon={<AlignCenterOutlined />}
                type={align === 'center' ? 'primary' : 'default'}
                onClick={() => {
                  setAlign('center');
                  apply({ textAlign: 'center' });
                }}
              />
              <Button
                icon={<AlignRightOutlined />}
                type={align === 'right' ? 'primary' : 'default'}
                onClick={() => {
                  setAlign('right');
                  apply({ textAlign: 'right' });
                }}
              />
            </Space>
          </div>
        </div>

        <Divider />

        <div>
          <strong>Color</strong>
          <div style={{ marginTop: 8 }}>
            <ColorPicker
              value={color}
              onChange={(c) => {
                const hex = c.toHexString();
                setColor(hex);
                apply({ fill: hex });
                // if user is currently editing the text, ensure text tool stays active
                try {
                  if ((selectedObject as any)?.isEditing) {
                    setActiveTool && setActiveTool('text');
                  }
                } catch (e) {
                  // ignore
                }
              }}
              showText
            />
          </div>
        </div>
      </Space>
    </div>
  );
};

export default TextStylePanel;
