import React, { useMemo } from 'react';
import { isEditable } from '../../utils/document';
import { Button, Tooltip, Divider } from 'antd';
import {
  ScissorOutlined,
  BgColorsOutlined,
  HighlightOutlined,
  BorderOuterOutlined,
} from '@ant-design/icons';
import { Canvas, FabricImage, FabricObject } from 'fabric';
import LayerMaskModal from '../LayerMaskModal';
import CropModal from '../CropModal';
import BlurBrushModal from '../BlurBrush/BlurBrushModal';
import CameraRawModal from '../CameraRaw/CameraRawModal';
import { applyMaskToFabricObject } from '../../utils/effectsHelpers';

interface ToolbarFiltersProps {
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
  saveState: () => void;
  history: {
    saveState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
  maskModalVisible: boolean;
  setMaskModalVisible: (visible: boolean) => void;
  cameraRawVisible: boolean;
  setCameraRawVisible: (visible: boolean) => void;
  cropModalVisible: boolean;
  setCropModalVisible: (visible: boolean) => void;
  blurBrushVisible: boolean;
  setBlurBrushVisible: (visible: boolean) => void;
}

const ToolbarFilters: React.FC<ToolbarFiltersProps> = ({
  canvas,
  selectedObject,
  saveState,
  history,
  maskModalVisible,
  setMaskModalVisible,
  cameraRawVisible,
  setCameraRawVisible,
  cropModalVisible,
  setCropModalVisible,
  blurBrushVisible,
  setBlurBrushVisible,
}) => {
  const isImageSelected = selectedObject instanceof FabricImage && isEditable(selectedObject);

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

  const handleApplyMask = (maskCanvas: HTMLCanvasElement) => {
    if (!canvas || !selectedObject) return;
    applyMaskToFabricObject(canvas, selectedObject, maskCanvas);
    saveState();
    setMaskModalVisible(false);
  };

  const handleApplyCameraRaw = (processedCanvas: HTMLCanvasElement) => {
    if (!canvas || !selectedObject || !(selectedObject instanceof FabricImage)) return;

    if (!isEditable(selectedObject)) return;
    // Camera Raw is an explicit raster operation. Keep identity/transforms/mask.
    selectedObject.set('originalSource' as any, (selectedObject as any).originalSource || selectedObject.getSrc());
    selectedObject.filters = [];
    selectedObject.setElement(processedCanvas);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    saveState();
    setCameraRawVisible(false);
  };

  const sourceCanvas = useMemo(getSelectedImageCanvas, [selectedObject, maskModalVisible, cameraRawVisible]);

  return (
    <>
      <Divider style={{ margin: '8px 0' }} />

      <Tooltip title="Crop (C)">
        <Button icon={<BorderOuterOutlined />} onClick={() => setCropModalVisible(true)} />
      </Tooltip>
      <Tooltip title="Mask (M)">
        <Button
          icon={<ScissorOutlined />}
          onClick={() => setMaskModalVisible(true)}
          disabled={!isImageSelected}
        />
      </Tooltip>
      <Tooltip title="Camera Raw Filter">
        <Button
          icon={<BgColorsOutlined />}
          onClick={() => setCameraRawVisible(true)}
          disabled={!isImageSelected}
        />
      </Tooltip>
      <Tooltip title="Blur Brush">
        <Button icon={<HighlightOutlined />} onClick={() => setBlurBrushVisible(true)} />
      </Tooltip>

      {maskModalVisible && isImageSelected && (
        <LayerMaskModal
          open={maskModalVisible}
          onCancel={() => setMaskModalVisible(false)}
          onApply={handleApplyMask}
          sourceCanvas={sourceCanvas}
          selectedColor={null}
        />
      )}

      {cameraRawVisible && isImageSelected && (
        <CameraRawModal
          visible={cameraRawVisible}
          onCancel={() => setCameraRawVisible(false)}
          onApply={handleApplyCameraRaw}
          sourceCanvas={sourceCanvas}
        />
      )}

      {cropModalVisible && (
        <CropModal
          visible={cropModalVisible}
          onCancel={() => setCropModalVisible(false)}
          canvas={canvas}
          history={history}
        />
      )}

      {blurBrushVisible && (
        <BlurBrushModal
          visible={blurBrushVisible}
          onCancel={() => setBlurBrushVisible(false)}
          canvas={canvas}
          history={history}
        />
      )}
    </>
  );
};

export default ToolbarFilters;
