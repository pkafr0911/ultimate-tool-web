import { CustomSlider } from './CustomSlider';
import React from 'react';
import { ColorPicker, Typography, Space } from 'antd';
import { usePhotoEditor } from '../context';
import { isEditable } from '../utils/document';
import { FabricObject } from 'fabric';

const { Title, Text } = Typography;

const LayerStylePanel: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();

  if (!selectedObject || !canvas) return null;

  // Helper to update object properties
  const updateProperty = (key: keyof FabricObject, value: any) => {
    if (!isEditable(selectedObject)) return;
    selectedObject.set(key, value);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    history.saveState();
  };

  const strokeWidth = selectedObject.strokeWidth || 0;
  const strokeColor = selectedObject.stroke || '#000000';
  const fillColor = selectedObject.fill || 'transparent';

  return (
    <div style={{ padding: 16 }}>
      <Title level={5}>Layer Style</Title>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Fill Color */}
        <div>
          <Text strong>Fill Color</Text>
          <div style={{ marginTop: 8 }}>
            <ColorPicker
              value={fillColor as string}
              onChange={(color) => updateProperty('fill', color.toHexString())}
              showText
            />
          </div>
        </div>

        {/* Border (Stroke) Color */}
        <div>
          <Text strong>Border Color</Text>
          <div style={{ marginTop: 8 }}>
            <ColorPicker
              value={strokeColor as string}
              onChange={(color) => updateProperty('stroke', color.toHexString())}
              showText
            />
          </div>
        </div>

        {/* Border Thickness */}
        <CustomSlider
          label="Border Thickness"
          min={0}
          max={50}
          value={strokeWidth}
          disabled={!isEditable(selectedObject)}
          onChange={(val) => updateProperty('strokeWidth', val)}
        />
      </Space>
    </div>
  );
};

export default LayerStylePanel;
