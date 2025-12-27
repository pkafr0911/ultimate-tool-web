import React from 'react';
import { ColorPicker, Slider, InputNumber, Typography, Space, Row, Col } from 'antd';
import { usePhotoEditor } from '../context';
import { FabricObject } from 'fabric';

const { Title, Text } = Typography;

const LayerStylePanel: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();

  if (!selectedObject || !canvas) return null;

  // Helper to update object properties
  const updateProperty = (key: keyof FabricObject, value: any) => {
    selectedObject.set(key, value);
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
        <div>
          <Text strong>Border Thickness</Text>
          <Row gutter={16} align="middle">
            <Col span={16}>
              <Slider
                min={0}
                max={50}
                value={strokeWidth}
                onChange={(val) => updateProperty('strokeWidth', val)}
              />
            </Col>
            <Col span={8}>
              <InputNumber
                min={0}
                max={50}
                value={strokeWidth}
                onChange={(val) => updateProperty('strokeWidth', Number(val))}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </div>
      </Space>
    </div>
  );
};

export default LayerStylePanel;
