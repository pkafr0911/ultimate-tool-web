import React, { useEffect, useState, useRef } from 'react';
import { List, Button, Typography, Space, InputNumber, Select } from 'antd';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { usePhotoEditor } from '../context';
import { FabricObject } from 'fabric';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Title } = Typography;
const { Option } = Select;

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children, isSelected, onClick }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
    marginBottom: 4,
    border: '1px solid #f0f0f0',
    borderRadius: 4,
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          marginRight: 8,
          display: 'flex',
          alignItems: 'center',
          color: '#999',
        }}
      >
        <HolderOutlined />
      </div>
      <div onClick={onClick} style={{ flex: 1, cursor: 'pointer' }}>
        {children}
      </div>
    </div>
  );
};

const LayersPanel: React.FC = () => {
  const { canvas, selectedObject, setSelectedObject, history } = usePhotoEditor();
  const [objects, setObjects] = useState<FabricObject[]>([]);
  const draggingOpacity = useRef(false);
  const opacityStartX = useRef<number | null>(null);
  const opacityStartValue = useRef<number>(100);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateObjects = () => {
    if (!canvas) return;
    const objs = canvas.getObjects();
    objs.forEach((obj: any) => {
      if (!obj.uid) obj.uid = Math.random().toString(36).substr(2, 9);
    });
    // Reverse to show top layers first
    setObjects([...objs].reverse());
  };

  useEffect(() => {
    if (!canvas) return;

    let timeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateObjects, 100);
    };

    canvas.on('object:added', debouncedUpdate);
    canvas.on('object:removed', debouncedUpdate);
    canvas.on('object:modified', debouncedUpdate);

    updateObjects();

    return () => {
      canvas.off('object:added', debouncedUpdate);
      canvas.off('object:removed', debouncedUpdate);
      canvas.off('object:modified', debouncedUpdate);
      clearTimeout(timeout);
    };
  }, [canvas]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = objects.findIndex((obj: any) => obj.uid === active.id);
      const newIndex = objects.findIndex((obj: any) => obj.uid === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const fabricNewIndex = objects.length - 1 - newIndex;
        const obj = objects[oldIndex];

        canvas?.moveObjectTo(obj, fabricNewIndex);
        canvas?.requestRenderAll();
        history.saveState();
        updateObjects();
      }
    }
  };

  const toggleVisibility = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation();
    obj.visible = !obj.visible;
    if (!obj.visible) {
      canvas?.discardActiveObject();
    }
    canvas?.requestRenderAll();
    history.saveState();
    setObjects([...(canvas?.getObjects() || [])].reverse());
  };

  const toggleLock = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation();
    obj.lockMovementX = !obj.lockMovementX;
    obj.lockMovementY = !obj.lockMovementY;
    obj.lockRotation = !obj.lockRotation;
    obj.lockScalingX = !obj.lockScalingX;
    obj.lockScalingY = !obj.lockScalingY;
    obj.selectable = !obj.lockMovementX;

    if (!obj.selectable) {
      canvas?.discardActiveObject();
    }

    canvas?.requestRenderAll();
    history.saveState();
    setObjects([...(canvas?.getObjects() || [])].reverse());
  };

  const selectObject = (obj: FabricObject) => {
    if (!canvas || !(obj as any).visible || !(obj as any).selectable) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setSelectedObject && setSelectedObject(obj);
  };

  const deleteObject = (obj: FabricObject, e: React.MouseEvent) => {
    e.stopPropagation();
    canvas?.remove(obj);
    canvas?.requestRenderAll();
    history.saveState();
  };

  const handleOpacityChange = (value: number) => {
    if (!canvas || !selectedObject) return;
    selectedObject.set('opacity', value);
    canvas.requestRenderAll();
    // history.saveState(); // Maybe debounce this or save onAfterChange
  };

  const handleOpacityNumberChange = (v: number | undefined | null) => {
    if (!canvas || !selectedObject) return;
    const value = Number(v || 0);
    selectedObject.set('opacity', Math.max(0, Math.min(100, value)) / 100);
    canvas.requestRenderAll();
  };

  const handleOpacityLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingOpacity.current = true;
    opacityStartX.current = e.clientX;
    // store percentage (0-100)
    opacityStartValue.current = Math.round(((selectedObject?.opacity ?? 1) as number) * 100);
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingOpacity.current || opacityStartX.current === null) return;
      const delta = ev.clientX - opacityStartX.current;
      const sensitivity = 0.2; // pixels -> percent
      let newVal = Math.max(0, Math.min(100, opacityStartValue.current + delta * sensitivity));
      const obj = canvas?.getActiveObject() as FabricObject | undefined;
      if (obj && canvas) {
        obj.set('opacity', newVal / 100);
        canvas.requestRenderAll();
      }
    };

    const onMouseUp = () => {
      draggingOpacity.current = false;
      opacityStartX.current = null;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      history.saveState();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleOpacityAfterChange = () => {
    history.saveState();
  };

  const handleBlendModeChange = (value: string) => {
    if (!canvas || !selectedObject) return;
    selectedObject.set('globalCompositeOperation', value);
    canvas.requestRenderAll();
    history.saveState();
  };

  return (
    <div style={{ padding: 10 }}>
      <Title level={5}>Layers</Title>

      {selectedObject && (
        <div style={{ marginBottom: 16, padding: 8, background: '#fafafa', borderRadius: 4 }}>
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                cursor: 'ew-resize',
                userSelect: 'none',
              }}
              onMouseDown={handleOpacityLabelMouseDown}
            >
              <div style={{ marginRight: 8 }}>Opacity:</div>
              <InputNumber
                size="small"
                min={0}
                max={100}
                step={1}
                value={Math.round((selectedObject.opacity ?? 1) * 100)}
                onChange={(v) => handleOpacityNumberChange(v)}
                onBlur={() => handleOpacityAfterChange()}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, width: '100%' }}
            >
              <div style={{ marginRight: 8 }}>Blend Mode:</div>
              <Select
                size="small"
                style={{ flex: 1 }}
                value={selectedObject.globalCompositeOperation || 'source-over'}
                onChange={handleBlendModeChange}
              >
                <Option value="source-over">Normal</Option>
                <Option value="multiply">Multiply</Option>
                <Option value="screen">Screen</Option>
                <Option value="overlay">Overlay</Option>
                <Option value="darken">Darken</Option>
                <Option value="lighten">Lighten</Option>
                <Option value="color-dodge">Color Dodge</Option>
                <Option value="color-burn">Color Burn</Option>
                <Option value="hard-light">Hard Light</Option>
                <Option value="soft-light">Soft Light</Option>
                <Option value="difference">Difference</Option>
                <Option value="exclusion">Exclusion</Option>
                <Option value="hue">Hue</Option>
                <Option value="saturation">Saturation</Option>
                <Option value="color">Color</Option>
                <Option value="luminosity">Luminosity</Option>
              </Select>
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={objects.map((obj: any) => obj.uid)}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{
              // maxHeight: 300, // Removed to allow scrolling
              overflowY: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 4,
            }}
          >
            {objects.map((item: any, index) => {
              const isSelected = selectedObject === item;
              const type = item.type || 'Object';
              const name = item.name || `${type} ${objects.length - index}`;

              return (
                <SortableItem
                  key={item.uid}
                  id={item.uid}
                  isSelected={isSelected}
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
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={item.lockMovementX ? <LockOutlined /> : <UnlockOutlined />}
                        onClick={(e) => toggleLock(item, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => deleteObject(item, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </Space>
                  </div>
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LayersPanel;
