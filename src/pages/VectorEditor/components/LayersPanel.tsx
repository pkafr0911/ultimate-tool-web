import React, { useEffect, useState } from 'react';
import { List, Button, Typography, Space } from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useVectorEditor } from '../context';
import { FabricObject } from 'fabric';

const { Title } = Typography;

const LayersPanel: React.FC = () => {
  const { canvas, selectedObject, setSelectedObject, history } = useVectorEditor();
  const [objects, setObjects] = useState<FabricObject[]>([]);

  useEffect(() => {
    if (!canvas) return;

    const updateObjects = () => {
      // Reverse to show top layers first
      setObjects([...canvas.getObjects()].reverse());
    };

    canvas.on('object:added', updateObjects);
    canvas.on('object:removed', updateObjects);
    canvas.on('object:modified', updateObjects);

    updateObjects();

    return () => {
      canvas.off('object:added', updateObjects);
      canvas.off('object:removed', updateObjects);
      canvas.off('object:modified', updateObjects);
    };
  }, [canvas]);

  const toggleVisibility = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation();
    obj.visible = !obj.visible;
    if (!obj.visible) {
      canvas?.discardActiveObject();
    }
    canvas?.requestRenderAll();
    history.saveState();
    // Force update
    setObjects([...(canvas?.getObjects() || [])].reverse());
  };

  const toggleLock = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation();
    obj.lockMovementX = !obj.lockMovementX;
    obj.lockMovementY = !obj.lockMovementY;
    obj.lockRotation = !obj.lockRotation;
    obj.lockScalingX = !obj.lockScalingX;
    obj.lockScalingY = !obj.lockScalingY;
    obj.selectable = !obj.lockMovementX; // If locked, not selectable

    if (!obj.selectable) {
      canvas?.discardActiveObject();
    }

    canvas?.requestRenderAll();
    history.saveState();
    setObjects([...(canvas?.getObjects() || [])].reverse());
  };

  const selectObject = (obj: FabricObject) => {
    if (!canvas || !obj.visible || !obj.selectable) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
  };

  const deleteObject = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation();
    canvas?.remove(obj);
    canvas?.requestRenderAll();
    history.saveState();
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={5}>Layers</Title>
      <List
        size="small"
        bordered
        dataSource={objects}
        renderItem={(item, index) => {
          const isSelected = selectedObject === item;
          const type = item.type || 'Object';
          // @ts-ignore - fabric types might not have name property by default but we can add it
          const name = item.name || `${type} ${objects.length - index}`;

          return (
            <List.Item
              style={{
                backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                cursor: 'pointer',
                padding: '8px',
              }}
              onClick={() => selectObject(item)}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                  }}
                >
                  {name}
                </span>
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    onClick={(e) => toggleVisibility(item, e)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={item.lockMovementX ? <LockOutlined /> : <UnlockOutlined />}
                    onClick={(e) => toggleLock(item, e)}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => deleteObject(item, e)}
                  />
                </Space>
              </div>
            </List.Item>
          );
        }}
        style={{ maxHeight: 300, overflowY: 'auto' }}
      />
    </div>
  );
};

export default LayersPanel;
