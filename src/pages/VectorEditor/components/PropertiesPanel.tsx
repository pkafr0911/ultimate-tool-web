import React, { useEffect, useState } from 'react';
import { Form, InputNumber, ColorPicker, Slider, Typography, Empty } from 'antd';
import { useVectorEditor } from '../context';

const { Title } = Typography;

const PropertiesPanel: React.FC = () => {
  const { canvas, selectedObject } = useVectorEditor();
  const [form] = Form.useForm();

  // Local state to force re-render when object properties change externally (e.g. dragging)
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (selectedObject) {
      const updateForm = () => {
        // Helper to safely get color string
        const getColor = (val: any) => {
          if (typeof val === 'string') return val;
          if (val && typeof val === 'object' && 'colorStops' in val) return '#000000'; // Fallback for gradients
          return val ? val.toString() : 'transparent';
        };

        form.setFieldsValue({
          fill: getColor(selectedObject.fill),
          stroke: getColor(selectedObject.stroke),
          strokeWidth: selectedObject.strokeWidth,
          opacity: selectedObject.opacity,
          left: Math.round(selectedObject.left || 0),
          top: Math.round(selectedObject.top || 0),
          width: Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)),
          height: Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)),
          angle: Math.round(selectedObject.angle || 0),
        });
        forceUpdate({});
      };

      updateForm();

      // Listen for object modification events on canvas to update form
      if (canvas) {
        const handleModified = () => updateForm();
        canvas.on('object:modified', handleModified);
        return () => {
          canvas.off('object:modified', handleModified);
        };
      }
    }
  }, [selectedObject, canvas, form]);

  if (!selectedObject) {
    return <Empty description="No object selected" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (!selectedObject || !canvas) return;

    if ('fill' in changedValues) {
      // Antd ColorPicker returns an object, we need hex string or rgba
      const color =
        typeof changedValues.fill === 'string'
          ? changedValues.fill
          : changedValues.fill?.toHexString?.() || '#000000';
      selectedObject.set('fill', color);
    }
    if ('stroke' in changedValues) {
      const color =
        typeof changedValues.stroke === 'string'
          ? changedValues.stroke
          : changedValues.stroke?.toHexString?.() || '#000000';
      selectedObject.set('stroke', color);
    }
    if ('strokeWidth' in changedValues) {
      selectedObject.set('strokeWidth', changedValues.strokeWidth);
    }
    if ('opacity' in changedValues) {
      selectedObject.set('opacity', changedValues.opacity);
    }
    if ('left' in changedValues) {
      selectedObject.set('left', changedValues.left);
    }
    if ('top' in changedValues) {
      selectedObject.set('top', changedValues.top);
    }
    if ('angle' in changedValues) {
      selectedObject.set('angle', changedValues.angle);
    }

    // Handling width/height changes usually requires adjusting scale for fabric objects
    if ('width' in changedValues) {
      const newWidth = changedValues.width;
      if (selectedObject.width) {
        selectedObject.scaleToWidth(newWidth);
      }
    }
    if ('height' in changedValues) {
      const newHeight = changedValues.height;
      if (selectedObject.height) {
        selectedObject.scaleToHeight(newHeight);
      }
    }

    selectedObject.setCoords();
    canvas.requestRenderAll();
  };

  return (
    <div>
      <Title level={5}>Properties</Title>
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange} size="small">
        <Form.Item name="fill" label="Fill Color">
          <ColorPicker showText />
        </Form.Item>

        <Form.Item name="stroke" label="Stroke Color">
          <ColorPicker showText />
        </Form.Item>

        <Form.Item name="strokeWidth" label="Stroke Width">
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item name="opacity" label="Opacity">
          <Slider min={0} max={1} step={0.1} />
        </Form.Item>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="left" label="X">
            <InputNumber />
          </Form.Item>
          <Form.Item name="top" label="Y">
            <InputNumber />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Form.Item name="width" label="Width">
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="height" label="Height">
            <InputNumber min={1} />
          </Form.Item>
        </div>

        <Form.Item name="angle" label="Rotation">
          <Slider min={0} max={360} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default PropertiesPanel;
