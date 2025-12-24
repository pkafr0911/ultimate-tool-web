import React from 'react';
import { usePhotoEditor } from '../context';
import AdjustmentPanel from './AdjustmentPanel';
import BrushPanel from './BrushPanel';
import TextStylePanel from './TextStylePanel';
import AlignControls from './AlignControls';

const PropertiesPanel: React.FC = () => {
  const { activeTool, selectedObject } = usePhotoEditor();

  if (activeTool === 'brush') return <BrushPanel />;

  if (activeTool === 'text') return <TextStylePanel />;

  // if a text object is selected, show text panel too
  if (selectedObject && (selectedObject as any).isType === 'i-text')
    return (
      <>
        <TextStylePanel />
        <AlignControls />
      </>
    );

  if (selectedObject)
    return (
      <>
        <AdjustmentPanel />
        <AlignControls />
      </>
    );

  return <AdjustmentPanel />;
};

export default PropertiesPanel;
