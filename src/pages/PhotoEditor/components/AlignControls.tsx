import React from 'react';
import { Button, Space } from 'antd';
import { usePhotoEditor } from '../context';

const AlignControls: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();

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

  const apply = (patch: Record<string, any>) => {
    if (!selectedObject) return;
    selectedObject.set(patch);
    selectedObject.setCoords && selectedObject.setCoords();
    canvas && canvas.requestRenderAll();
    if (history) history.saveState();
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

    apply({ left });
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

    apply({ top });
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 6 }}>
        <strong>Align to First Layer</strong>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Space>
          <Button onClick={() => alignHorizontalToFirst('left')}>H: Left</Button>
          <Button onClick={() => alignHorizontalToFirst('center')}>H: Center</Button>
          <Button onClick={() => alignHorizontalToFirst('right')}>H: Right</Button>
        </Space>
      </div>
      <div>
        <Space>
          <Button onClick={() => alignVerticalToFirst('top')}>V: Top</Button>
          <Button onClick={() => alignVerticalToFirst('middle')}>V: Middle</Button>
          <Button onClick={() => alignVerticalToFirst('bottom')}>V: Bottom</Button>
        </Space>
      </div>
    </div>
  );
};

export default AlignControls;
