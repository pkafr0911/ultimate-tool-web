import React from 'react';
import { usePhotoEditor } from '../context';
import AdjustmentPanel from './AdjustmentPanel';
import BrushPanel from './BrushPanel';
import TextStylePanel from './TextStylePanel';
import AlignControls from './AlignControls';
import LayerStylePanel from './LayerStylePanel';
import { FabricImage } from 'fabric';

const PropertiesPanel: React.FC = () => {
  const { activeTool, selectedObject } = usePhotoEditor();

  if (activeTool === 'brush') return <BrushPanel />;

  if (activeTool === 'text') return <TextStylePanel />;

  // if a text object is selected, show text panel too
  if (selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text'))
    return (
      <>
        <TextStylePanel />
        <LayerStylePanel />
        <AlignControls />
      </>
    );

  if (selectedObject) {
    const isImage = selectedObject instanceof FabricImage || selectedObject.type === 'image';

    return (
      <>
        {isImage ? <AdjustmentPanel /> : <LayerStylePanel />}
        <AlignControls />
      </>
    );
  }

  return <AdjustmentPanel />;
};

export default PropertiesPanel;
