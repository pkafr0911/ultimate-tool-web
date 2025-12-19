import React, { useState } from 'react';
import { Button, Tooltip, Space, Divider } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  FontSizeOutlined,
  FileImageOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
  HighlightOutlined,
  ExportOutlined,
  ScissorOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { Rect, Circle, IText, Image as FabricImage } from 'fabric';
import { usePhotoEditor } from '../context';
import ExportModal from './ExportModal';
import LayerMaskModal from './LayerMaskModal';
import ColorRemovalModal from './ColorRemovalModal';
import { applyMaskToFabricObject } from '../utils/effectsHelpers';

const Toolbar: React.FC = () => {
  const { canvas, setActiveTool, activeTool, history, selectedObject } = usePhotoEditor();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [maskModalVisible, setMaskModalVisible] = useState(false);
  const [colorRemovalModalVisible, setColorRemovalModalVisible] = useState(false);

  const addRectangle = () => {
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: '#ff0000',
      width: 100,
      height: 100,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    history.saveState();
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: '#00ff00',
      radius: 50,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    history.saveState();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText('Text', {
      left: 100,
      top: 100,
      fontSize: 24,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    history.saveState();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      FabricImage.fromURL(data).then((img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.centerObject(img);
        canvas.setActiveObject(img);
        history.saveState();
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      history.saveState();
    }
  };

  const handleApplyMask = (maskCanvas: HTMLCanvasElement) => {
    if (!canvas || !selectedObject) return;
    applyMaskToFabricObject(canvas, selectedObject, maskCanvas);
    history.saveState();
    setMaskModalVisible(false);
  };

  const handleApplyColorRemoval = (maskCanvas: HTMLCanvasElement) => {
    if (!canvas || !selectedObject) return;
    applyMaskToFabricObject(canvas, selectedObject, maskCanvas);
    history.saveState();
    setColorRemovalModalVisible(false);
  };

  const getSelectedImageCanvas = (): HTMLCanvasElement | null => {
    if (!selectedObject || !(selectedObject instanceof FabricImage)) return null;
    const imgElement = selectedObject.getElement() as HTMLImageElement | HTMLCanvasElement;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgElement.width;
    tempCanvas.height = imgElement.height;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imgElement, 0, 0);
    }
    return tempCanvas;
  };

  const isImageSelected = selectedObject instanceof FabricImage;

  return (
    <Space direction="vertical" style={{ padding: '8px' }}>
      <Tooltip title="Select">
        <Button
          type={activeTool === 'select' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('select')}
        />
      </Tooltip>
      <Tooltip title="Brush">
        <Button
          type={activeTool === 'brush' ? 'primary' : 'default'}
          icon={<HighlightOutlined />}
          onClick={() => setActiveTool('brush')}
        />
      </Tooltip>
      <Tooltip title="Rectangle">
        <Button icon={<BorderOutlined />} onClick={addRectangle} />
      </Tooltip>
      <Tooltip title="Circle">
        <Button icon={<BorderOutlined style={{ borderRadius: '50%' }} />} onClick={addCircle} />
      </Tooltip>
      <Tooltip title="Text">
        <Button icon={<FontSizeOutlined />} onClick={addText} />
      </Tooltip>
      <Tooltip title="Upload Image">
        <Button
          icon={<FileImageOutlined />}
          onClick={() => document.getElementById('image-upload')?.click()}
        />
        <input type="file" id="image-upload" hidden accept="image/*" onChange={handleImageUpload} />
      </Tooltip>

      <Divider style={{ margin: '8px 0' }} />

      <Tooltip title="Mask">
        <Button
          icon={<ScissorOutlined />}
          onClick={() => setMaskModalVisible(true)}
          disabled={!isImageSelected}
        />
      </Tooltip>
      <Tooltip title="Remove Color">
        <Button
          icon={<BgColorsOutlined />}
          onClick={() => setColorRemovalModalVisible(true)}
          disabled={!isImageSelected}
        />
      </Tooltip>

      <Divider style={{ margin: '8px 0' }} />

      <Tooltip title="Delete">
        <Button icon={<DeleteOutlined />} onClick={deleteSelected} danger />
      </Tooltip>
      <Tooltip title="Undo">
        <Button icon={<UndoOutlined />} onClick={history.undo} disabled={!history.canUndo} />
      </Tooltip>
      <Tooltip title="Redo">
        <Button icon={<RedoOutlined />} onClick={history.redo} disabled={!history.canRedo} />
      </Tooltip>

      <Divider style={{ margin: '8px 0' }} />

      <Tooltip title="Export">
        <Button icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)} />
      </Tooltip>

      <ExportModal
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        canvas={canvas}
      />

      {maskModalVisible && isImageSelected && (
        <LayerMaskModal
          open={maskModalVisible}
          onCancel={() => setMaskModalVisible(false)}
          onApply={handleApplyMask}
          sourceCanvas={getSelectedImageCanvas()}
        />
      )}

      {colorRemovalModalVisible && isImageSelected && (
        <ColorRemovalModal
          open={colorRemovalModalVisible}
          onCancel={() => setColorRemovalModalVisible(false)}
          onApply={handleApplyColorRemoval}
          sourceCanvas={getSelectedImageCanvas()}
          selectedColor={null}
        />
      )}
    </Space>
  );
};

export default Toolbar;
