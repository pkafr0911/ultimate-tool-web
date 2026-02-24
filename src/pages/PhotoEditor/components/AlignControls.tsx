import React from 'react';
import { Button, Space } from 'antd';
import { usePhotoEditor } from '../context';

const AlignControls: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();

  const getContentBounds = () => {
    if (!canvas) return null;
    const objects = canvas.getObjects();
    if (!objects || objects.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach((obj) => {
      const bound = obj.getBoundingRect();
      if (bound.left < minX) minX = bound.left;
      if (bound.top < minY) minY = bound.top;
      if (bound.left + bound.width > maxX) maxX = bound.left + bound.width;
      if (bound.top + bound.height > maxY) maxY = bound.top + bound.height;
    });

    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  };

  const apply = (patch: Record<string, any>) => {
    if (!selectedObject) return;
    selectedObject.set(patch);
    selectedObject.setCoords && selectedObject.setCoords();
    canvas && canvas.requestRenderAll();
    if (history) history.saveState();
  };

  const alignHorizontal = (mode: 'left' | 'center' | 'right') => {
    if (!canvas || !selectedObject) return;
    const target = getContentBounds();
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

  const alignVertical = (mode: 'top' | 'middle' | 'bottom') => {
    if (!canvas || !selectedObject) return;
    const target = getContentBounds();
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
        <strong>Align to Content Bounds</strong>
      </div>
      <div style={{ marginBottom: 8 }}>
        <Space>
          <Button onClick={() => alignHorizontal('left')}>H: Left</Button>
          <Button onClick={() => alignHorizontal('center')}>H: Center</Button>
          <Button onClick={() => alignHorizontal('right')}>H: Right</Button>
        </Space>
      </div>
      <div>
        <Space>
          <Button onClick={() => alignVertical('top')}>V: Top</Button>
          <Button onClick={() => alignVertical('middle')}>V: Middle</Button>
          <Button onClick={() => alignVertical('bottom')}>V: Bottom</Button>
        </Space>
      </div>
    </div>
  );
};

export default AlignControls;
